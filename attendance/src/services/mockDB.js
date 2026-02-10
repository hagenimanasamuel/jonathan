// Simulate a shared database using localStorage with broadcasting
class SharedDB {
  constructor() {
    this.channel = new BroadcastChannel('attendance-system');
    this.listeners = [];
    
    // Listen for changes from other tabs/devices
    this.channel.onmessage = (event) => {
      if (event.data.type === 'DATA_UPDATE') {
        this.notifyListeners(event.data.key, event.data.value);
      }
    };
  }

  // Store data and notify all tabs/devices
  setItem(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
    
    // Broadcast to other tabs/devices
    this.channel.postMessage({
      type: 'DATA_UPDATE',
      key,
      value,
      timestamp: Date.now()
    });
    
    return value;
  }

  getItem(key) {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : null;
  }

  // Add listener for real-time updates
  addListener(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(cb => cb !== callback);
    };
  }

  notifyListeners(key, value) {
    this.listeners.forEach(callback => callback(key, value));
  }
}

// Create shared instance
const sharedDB = new SharedDB();

// Initialize with default data
const initializeSharedData = () => {
  if (!sharedDB.getItem('initialized_v2')) {
    const defaultData = {
      users: [
        { 
          id: 1, 
          email: 'prof@college.edu', 
          password: 'prof123', 
          role: 'professor', 
          name: 'Dr. Emmanuel',
          department: 'Software Engineering'
        },
        { 
          id: 2, 
          email: 'student1@college.edu', 
          password: 'stu123', 
          role: 'student', 
          name: 'Iradukunda Jonathan', 
          studentId: 'SE2023001',
          year: '3rd Year'
        },
        { 
          id: 3, 
          email: 'student2@college.edu', 
          password: 'stu123', 
          role: 'student', 
          name: 'HAGENIMANA Samuel', 
          studentId: 'SE2023002',
          year: '3rd Year'
        },
        { 
          id: 4, 
          email: 'student3@college.edu', 
          password: 'stu123', 
          role: 'student', 
          name: 'Charlie Brown', 
          studentId: 'SE2023003',
          year: '3rd Year'
        },
      ],
      sessions: [],
      attendance: []
    };
    
    sharedDB.setItem('users', defaultData.users);
    sharedDB.setItem('sessions', defaultData.sessions);
    sharedDB.setItem('attendance', defaultData.attendance);
    sharedDB.setItem('initialized_v2', true);
  }
};

initializeSharedData();

const mockDB = {
  // Getter functions with shared DB
  getUsers: () => sharedDB.getItem('users') || [],
  getSessions: () => sharedDB.getItem('sessions') || [],
  getAttendance: () => sharedDB.getItem('attendance') || [],
  
  // Setter functions with broadcasting
  setUsers: (users) => sharedDB.setItem('users', users),
  setSessions: (sessions) => sharedDB.setItem('sessions', sessions),
  setAttendance: (attendance) => sharedDB.setItem('attendance', attendance),
  
  // Add listener for real-time updates
  addDataListener: (callback) => sharedDB.addListener(callback),
  
  // User authentication
  login: (email, password) => {
    const users = mockDB.getUsers();
    const user = users.find(u => u.email === email && u.password === password);
    return user ? { success: true, user } : { success: false, message: 'Invalid credentials' };
  },

  // Student-specific functions
  getStudentAttendance: (studentId) => {
    const attendance = mockDB.getAttendance();
    return attendance.filter(a => a.studentId === studentId);
  },

  getStudentById: (studentId) => {
    const users = mockDB.getUsers();
    return users.find(u => u.studentId === studentId && u.role === 'student');
  },

  // Professor-specific functions
  getProfessorSessions: (professorId) => {
    const sessions = mockDB.getSessions();
    return sessions.filter(s => s.professorId === professorId);
  },

  // Create session with proper input
  createSession: (professorId, sessionData) => {
    const sessions = mockDB.getSessions();
    const users = mockDB.getUsers();
    const professor = users.find(u => u.id === professorId);
    
    const newSession = {
      id: Date.now(),
      professorId,
      professorName: professor?.name || 'Professor',
      ...sessionData,
      qrCode: null,
      qrExpiry: null,
      active: false,
      attendees: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    sessions.push(newSession);
    mockDB.setSessions(sessions);
    return newSession;
  },

  // Update session
  updateSession: (sessionId, updates) => {
    const sessions = mockDB.getSessions();
    const sessionIndex = sessions.findIndex(s => s.id === sessionId);
    
    if (sessionIndex !== -1) {
      sessions[sessionIndex] = {
        ...sessions[sessionIndex],
        ...updates,
        updatedAt: new Date().toISOString()
      };
      mockDB.setSessions(sessions);
      return sessions[sessionIndex];
    }
    return null;
  },

  // Delete session
  deleteSession: (sessionId) => {
    const sessions = mockDB.getSessions();
    const filteredSessions = sessions.filter(s => s.id !== sessionId);
    mockDB.setSessions(filteredSessions);
    return true;
  },

  // Generate QR for session
  generateQR: (sessionId, expirationMinutes = 15) => {
    const sessions = mockDB.getSessions();
    const sessionIndex = sessions.findIndex(s => s.id === sessionId);
    
    if (sessionIndex === -1) return null;
    
    // Generate unique QR data
    const qrData = `ATTENDANCE-${sessionId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const qrExpiry = Date.now() + (expirationMinutes * 60 * 1000);
    
    sessions[sessionIndex].qrCode = qrData;
    sessions[sessionIndex].qrExpiry = qrExpiry;
    sessions[sessionIndex].active = true;
    sessions[sessionIndex].updatedAt = new Date().toISOString();
    
    mockDB.setSessions(sessions);
    return { 
      qrCode: qrData, 
      expiry: qrExpiry,
      expirationMinutes,
      manualCode: `MANUAL-${sessionId.toString().slice(-4)}-${Date.now().toString().slice(-4)}`
    };
  },

  // Mark attendance
  markAttendance: (studentId, qrCode) => {
    const sessions = mockDB.getSessions();
    const attendance = mockDB.getAttendance();
    
    // Find session by QR code
    const sessionIndex = sessions.findIndex(s => s.qrCode === qrCode && s.active);
    
    if (sessionIndex === -1) {
      return { success: false, message: 'Invalid QR code' };
    }
    
    const session = sessions[sessionIndex];
    
    // Check if QR expired
    if (session.qrExpiry && Date.now() > session.qrExpiry) {
      sessions[sessionIndex].active = false;
      mockDB.setSessions(sessions);
      return { success: false, message: 'QR code has expired' };
    }
    
    // Check if already attended
    if (session.attendees.includes(studentId)) {
      return { success: false, message: 'Attendance already marked' };
    }
    
    // Add to attendees
    sessions[sessionIndex].attendees.push(studentId);
    
    // Record in attendance log
    const attendanceRecord = {
      id: Date.now(),
      studentId,
      sessionId: session.id,
      sessionName: session.title,
      timestamp: new Date().toISOString(),
      status: 'present',
      scannedAt: new Date().toISOString()
    };
    
    attendance.push(attendanceRecord);
    
    // Save updates
    mockDB.setSessions(sessions);
    mockDB.setAttendance(attendance);
    
    return { 
      success: true, 
      message: `Attendance marked for ${session.title}`,
      record: attendanceRecord
    };
  },

  // Get today's active sessions
  getTodaySessions: () => {
    const sessions = mockDB.getSessions();
    const today = new Date().toISOString().split('T')[0];
    return sessions.filter(s => s.date === today && s.active);
  },

  // End session
  endSession: (sessionId) => {
    const sessions = mockDB.getSessions();
    const sessionIndex = sessions.findIndex(s => s.id === sessionId);
    
    if (sessionIndex !== -1) {
      sessions[sessionIndex].active = false;
      sessions[sessionIndex].qrCode = null;
      sessions[sessionIndex].qrExpiry = null;
      sessions[sessionIndex].updatedAt = new Date().toISOString();
      mockDB.setSessions(sessions);
      return true;
    }
    return false;
  },

  // Reset all data
  resetData: () => {
    sharedDB.setItem('sessions', []);
    sharedDB.setItem('attendance', []);
    return { success: true, message: 'Data reset successfully' };
  },

  // Get active QR sessions
  getActiveSessions: () => {
    const sessions = mockDB.getSessions();
    return sessions.filter(s => s.active);
  }
};

export default mockDB;