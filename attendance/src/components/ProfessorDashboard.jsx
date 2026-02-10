import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  Container, Grid, Card, CardContent, Typography, Button,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  Box, Chip, IconButton, Dialog, DialogTitle, DialogContent, DialogActions,
  Alert, TextField, MenuItem, Select, FormControl, InputLabel,
  Tabs, Tab, List, ListItem, ListItemText, ListItemAvatar, Avatar,
  Tooltip, Snackbar, LinearProgress, Divider, Switch, FormControlLabel,
  Badge, Stepper, Step, StepLabel, StepContent,
  Modal, Fade, Backdrop
} from '@mui/material';
import { 
  FaQrcode, 
  FaUsers, 
  FaChartLine,
  FaPlus,
  FaSignOutAlt,
  FaUserTie,
  FaCalendar,
  FaClock,
  FaCheckCircle,
  FaCopy,
  FaTrash,
  FaDownload,
  FaEye,
  FaEdit,
  FaFileExport,
  FaPrint,
  FaUserCircle,
  FaCalendarAlt,
  FaHistory,
  FaCog,
  FaBell,
  FaKey,
  FaMobileAlt,
  FaTimes,
  FaExpand,
  FaFileCsv,
  FaIdCard,
  FaUniversity,
  FaGraduationCap,
  FaChartPie,
  FaRegClock,
  FaRegCalendarCheck,
  FaRegCalendarTimes,
  FaSearch,
  FaFilter,
  FaSortAmountDown,
  FaCalendarPlus,
  FaChalkboardTeacher,
  FaDoorOpen,
  FaListUl,
  FaExclamationTriangle
} from 'react-icons/fa';
import { 
  MdQrCode, 
  MdContentCopy, 
  MdTimer, 
  MdPerson,
  MdClass,
  MdDateRange,
  MdAccessTime,
  MdMoreVert,
  MdSettings,
  MdPrint,
  MdPictureAsPdf,
  MdShare,
  MdRefresh,
  MdDeleteSweep,
  MdWarning,
  MdInfo,
  MdSchool,
  MdGroup,
  MdLocationOn,
  MdTitle,
  MdDescription,
  MdCategory,
  MdVideoLibrary
} from 'react-icons/md';
import { HiOutlineClipboardCopy, HiOutlineDownload, HiOutlinePrinter } from 'react-icons/hi';
import { QRCodeSVG } from 'qrcode.react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import mockDB from '../services/mockDB';

const ProfessorDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const qrRef = useRef(null);
  
  // Main states
  const [sessions, setSessions] = useState([]);
  const [activeQR, setActiveQR] = useState(null);
  const [showQRDialog, setShowQRDialog] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);
  const [showSessionDetails, setShowSessionDetails] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState(null);
  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('date_desc');
  
  // New session form
  const [newSession, setNewSession] = useState({
    title: '',
    code: '',
    date: new Date().toISOString().split('T')[0],
    startTime: '09:00',
    endTime: '10:30',
    duration: '90',
    location: 'Room 301',
    description: '',
    courseType: 'lecture',
    autoGenerateQR: false
  });
  
  // Stats
  const [stats, setStats] = useState({
    totalSessions: 0,
    totalAttendance: 0,
    todayAttendance: 0,
    activeSessions: 0,
    attendanceRate: '0%',
    avgAttendance: 0
  });
  
  // UI states
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [loading, setLoading] = useState(false);
  const [createStep, setCreateStep] = useState(0);
  
  // Initialize
  useEffect(() => {
    loadAllData();
    
    // Listen for real-time updates from other devices
    const unsubscribe = mockDB.addDataListener((key) => {
      if (key === 'sessions' || key === 'attendance') {
        loadAllData();
      }
    });
    
    return () => unsubscribe();
  }, []);
  
  const loadAllData = () => {
    setLoading(true);
    setTimeout(() => {
      loadSessions();
      calculateStats();
      checkActiveSessions();
      setLoading(false);
    }, 300);
  };
  
  const loadSessions = () => {
    let profSessions = mockDB.getProfessorSessions(user.id);
    
    // Apply search filter
    if (searchTerm) {
      profSessions = profSessions.filter(session =>
        session.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        session.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (session.description && session.description.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    
    // Apply sorting
    profSessions.sort((a, b) => {
      switch(sortBy) {
        case 'date_desc':
          return new Date(b.date + ' ' + b.startTime) - new Date(a.date + ' ' + a.startTime);
        case 'date_asc':
          return new Date(a.date + ' ' + a.startTime) - new Date(b.date + ' ' + b.startTime);
        case 'attendance_desc':
          return (b.attendees?.length || 0) - (a.attendees?.length || 0);
        case 'attendance_asc':
          return (a.attendees?.length || 0) - (b.attendees?.length || 0);
        case 'title_asc':
          return a.title.localeCompare(b.title);
        case 'title_desc':
          return b.title.localeCompare(a.title);
        default:
          return 0;
      }
    });
    
    // Filter by tab
    switch(activeTab) {
      case 'active':
        profSessions = profSessions.filter(s => s.active);
        break;
      case 'today':
        const today = new Date().toISOString().split('T')[0];
        profSessions = profSessions.filter(s => s.date === today);
        break;
      case 'past':
        const now = new Date().toISOString().split('T')[0];
        profSessions = profSessions.filter(s => s.date < now);
        break;
      case 'upcoming':
        const todayDate = new Date().toISOString().split('T')[0];
        profSessions = profSessions.filter(s => s.date > todayDate);
        break;
    }
    
    setSessions(profSessions);
  };
  
  const calculateStats = () => {
    const allSessions = mockDB.getSessions().filter(s => s.professorId === user.id);
    const totalAttendance = allSessions.reduce((sum, session) => sum + (session.attendees?.length || 0), 0);
    const today = new Date().toISOString().split('T')[0];
    const todaySessions = allSessions.filter(s => s.date === today);
    const todayAttendance = todaySessions.reduce((sum, session) => sum + (session.attendees?.length || 0), 0);
    const activeSessions = allSessions.filter(s => s.active).length;
    
    const attendanceRate = allSessions.length > 0 
      ? `${Math.round((totalAttendance / (allSessions.length * 25)) * 100)}%` 
      : '0%';
    
    const avgAttendance = allSessions.length > 0 
      ? Math.round(totalAttendance / allSessions.length) 
      : 0;
    
    setStats({
      totalSessions: allSessions.length,
      totalAttendance,
      todayAttendance,
      activeSessions,
      attendanceRate,
      avgAttendance
    });
  };
  
  const checkActiveSessions = () => {
    const activeSession = sessions.find(s => s.active);
    if (activeSession && activeQR?.sessionId !== activeSession.id) {
      setActiveQR({
        sessionId: activeSession.id,
        qrCode: activeSession.qrCode,
        expiry: new Date(activeSession.qrExpiry).toLocaleTimeString(),
        sessionName: activeSession.title,
        timeRemaining: calculateTimeRemaining(activeSession.qrExpiry)
      });
    }
  };
  
  const calculateTimeRemaining = (expiry) => {
    if (!expiry) return 'N/A';
    const remaining = expiry - Date.now();
    if (remaining <= 0) return 'Expired';
    const minutes = Math.floor(remaining / 60000);
    const seconds = Math.floor((remaining % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };
  
  // CREATE NEW SESSION - WORKING FORM
  const handleCreateSession = () => {
    if (!newSession.title.trim()) {
      showSnackbar('Please enter a session title', 'error');
      return;
    }
    
    if (!newSession.code.trim()) {
      showSnackbar('Please enter a course code', 'error');
      return;
    }
    
    const sessionData = {
      title: newSession.title,
      code: newSession.code,
      date: newSession.date,
      startTime: newSession.startTime,
      endTime: newSession.endTime,
      duration: `${newSession.duration} minutes`,
      location: newSession.location,
      description: newSession.description,
      courseType: newSession.courseType,
      professorName: user.name
    };
    
    const createdSession = mockDB.createSession(user.id, sessionData);
    
    // Add to local state
    setSessions([createdSession, ...sessions]);
    calculateStats();
    
    showSnackbar(`Session "${newSession.title}" created successfully!`, 'success');
    
    // Reset form
    setNewSession({
      title: '',
      code: '',
      date: new Date().toISOString().split('T')[0],
      startTime: '09:00',
      endTime: '10:30',
      duration: '90',
      location: 'Room 301',
      description: '',
      courseType: 'lecture',
      autoGenerateQR: false
    });
    
    setShowCreateModal(false);
    setCreateStep(0);
    
    // Auto-generate QR if selected
    if (newSession.autoGenerateQR) {
      setTimeout(() => {
        generateQR(createdSession.id);
      }, 500);
    }
  };
  
  const generateQR = (sessionId, expirationMinutes = 15) => {
    const result = mockDB.generateQR(sessionId, expirationMinutes);
    if (result) {
      const session = sessions.find(s => s.id === sessionId);
      setActiveQR({
        sessionId,
        qrCode: result.qrCode,
        expiry: new Date(result.expiry).toLocaleTimeString(),
        sessionName: session?.title || 'Session',
        timeRemaining: calculateTimeRemaining(result.expiry),
        expirationMinutes,
        manualCode: result.manualCode
      });
      setShowQRDialog(true);
      loadSessions();
      calculateStats();
      showSnackbar(`QR code generated (valid for ${expirationMinutes} minutes)`, 'success');
    }
  };
  
  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };
  
  const copyQRCode = () => {
    if (activeQR) {
      navigator.clipboard.writeText(activeQR.qrCode);
      showSnackbar('QR code copied to clipboard!', 'info');
    }
  };
  
  const copyManualCode = () => {
    if (activeQR?.manualCode) {
      navigator.clipboard.writeText(activeQR.manualCode);
      showSnackbar('Manual code copied to clipboard!', 'info');
    }
  };
  
  const downloadQRCode = () => {
    if (qrRef.current) {
      html2canvas(qrRef.current).then(canvas => {
        const link = document.createElement('a');
        link.download = `QR_${activeQR?.sessionName}_${new Date().toISOString().split('T')[0]}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
        showSnackbar('QR code downloaded!', 'success');
      });
    }
  };
  
  const printQRCode = () => {
    const printContent = document.createElement('div');
    printContent.innerHTML = `
      <div style="text-align: center; padding: 40px; font-family: Arial, sans-serif;">
        <h2>${activeQR?.sessionName}</h2>
        <p>Date: ${new Date().toLocaleDateString()}</p>
        <p>Time: ${new Date().toLocaleTimeString()}</p>
        <p>Valid for: ${activeQR?.expirationMinutes || 15} minutes</p>
        <div style="margin: 30px auto; padding: 20px; border: 2px solid #333; display: inline-block;">
          <div id="qr-print"></div>
        </div>
        <p style="margin-top: 30px; color: #666;">
          Scan this QR code to mark attendance<br>
          Manual Code: ${activeQR?.manualCode || 'N/A'}<br>
          Generated by SmartAttend System
        </p>
      </div>
    `;
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Print QR Code - ${activeQR?.sessionName}</title>
          <script src="https://unpkg.com/qrcode.react@latest/lib/index.js"></script>
          <script>
            window.onload = function() {
              const QRCode = qrcode.react.QRCodeSVG;
              const root = ReactDOM.createRoot(document.getElementById('qr-print'));
              root.render(React.createElement(QRCode, {
                value: "${activeQR?.qrCode || ''}",
                size: 200,
                level: "H"
              }));
              setTimeout(() => window.print(), 500);
            };
          </script>
        </head>
        <body>
          ${printContent.innerHTML}
        </body>
      </html>
    `);
    printWindow.document.close();
  };
  
  const exportAttendanceCSV = (session) => {
    const attendees = session.attendees || [];
    const csvContent = [
      ['Student ID', 'Name', 'Session', 'Date', 'Time', 'Status'],
      ...attendees.map(studentId => {
        const student = mockDB.getStudentById(studentId);
        return [
          studentId,
          student?.name || 'Unknown',
          session.title,
          session.date,
          session.startTime,
          'Present'
        ];
      })
    ].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance_${session.code}_${session.date}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    showSnackbar('Attendance exported as CSV!', 'success');
  };
  
  const exportAttendancePDF = (session) => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text(`Attendance Report - ${session.title}`, 20, 20);
    doc.setFontSize(12);
    doc.text(`Date: ${session.date}`, 20, 35);
    doc.text(`Time: ${session.startTime} - ${session.endTime}`, 20, 42);
    doc.text(`Course Code: ${session.code}`, 20, 49);
    doc.text(`Total Attended: ${session.attendees?.length || 0} students`, 20, 56);
    
    let yPos = 70;
    doc.setFontSize(11);
    doc.text('Student ID', 20, yPos);
    doc.text('Name', 80, yPos);
    doc.text('Status', 150, yPos);
    
    yPos += 7;
    doc.setFontSize(10);
    
    (session.attendees || []).forEach((studentId, index) => {
      const student = mockDB.getStudentById(studentId);
      if (yPos > 280) {
        doc.addPage();
        yPos = 20;
      }
      doc.text(studentId, 20, yPos);
      doc.text(student?.name || 'Unknown Student', 80, yPos);
      doc.text('Present', 150, yPos);
      yPos += 7;
    });
    
    doc.save(`Attendance_${session.code}_${session.date}.pdf`);
    showSnackbar('Attendance report exported as PDF!', 'success');
  };
  
  const endSession = (sessionId) => {
    const success = mockDB.endSession(sessionId);
    if (success) {
      loadSessions();
      calculateStats();
      
      if (activeQR && activeQR.sessionId === sessionId) {
        setActiveQR(null);
        setShowQRDialog(false);
      }
      
      showSnackbar('Session ended successfully', 'info');
    }
  };
  
  const confirmDeleteSession = (session) => {
    setSessionToDelete(session);
    setShowDeleteConfirm(true);
  };
  
  const deleteSession = () => {
    if (sessionToDelete) {
      const success = mockDB.deleteSession(sessionToDelete.id);
      if (success) {
        loadSessions();
        calculateStats();
        showSnackbar(`Session "${sessionToDelete.title}" deleted`, 'warning');
      }
      setShowDeleteConfirm(false);
      setSessionToDelete(null);
    }
  };
  
  const viewSessionDetails = (session) => {
    setSelectedSession(session);
    setShowSessionDetails(true);
  };
  
  const handleLogout = () => {
    logout();
    navigate('/login');
  };
  
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    setTimeout(loadSessions, 100);
  };
  
  // Time options for select
  const timeOptions = [];
  for (let hour = 8; hour <= 20; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      timeOptions.push(time);
    }
  }
  
  return (
    <Container maxWidth="xl" sx={{ mt: 2, mb: 6, p: { xs: 1, md: 2 } }}>
      {/* Header */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        mb: 4,
        p: 3,
        background: 'linear-gradient(135deg, #1565c0 0%, #0d47a1 100%)',
        color: 'white',
        borderRadius: 3,
        boxShadow: 3
      }}>
        <Box>
          <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <FaUserTie size={32} />
            Professor Dashboard
          </Typography>
          <Typography variant="body1">
            Welcome, <strong>Dr. {user?.name}</strong>
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.9 }}>
            {user?.department} • Manage attendance sessions
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Button 
            variant="outlined" 
            sx={{ color: 'white', borderColor: 'white' }}
            onClick={loadAllData}
            startIcon={<MdRefresh />}
          >
            Refresh
          </Button>
          <Button 
            variant="contained" 
            color="secondary"
            onClick={handleLogout}
            startIcon={<FaSignOutAlt />}
            sx={{ 
              color: 'white',
              bgcolor: '#ff4081',
              '&:hover': { bgcolor: '#f50057' }
            }}
          >
            Logout
          </Button>
        </Box>
      </Box>

      {/* Active QR Alert */}
      {activeQR && (
        <Alert 
          severity="info" 
          sx={{ mb: 3 }}
          icon={<FaQrcode />}
          action={
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button 
                color="inherit" 
                size="small" 
                onClick={() => setShowQRDialog(true)}
                startIcon={<FaExpand />}
              >
                Show QR
              </Button>
              <Button 
                color="inherit" 
                size="small" 
                onClick={() => endSession(activeQR.sessionId)}
                startIcon={<FaTimes />}
              >
                End Session
              </Button>
            </Box>
          }
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
            <Typography fontWeight="bold">Active QR Session:</Typography>
            <Typography>{activeQR.sessionName}</Typography>
            <Chip 
              label={`Expires in: ${activeQR.timeRemaining}`} 
              size="small" 
              color="warning"
              icon={<FaRegClock />}
            />
            <Chip 
              label={`${activeQR.expirationMinutes || 15} min`} 
              size="small" 
              variant="outlined"
            />
          </Box>
        </Alert>
      )}

      {/* Stats Cards */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
        {[
          { icon: <FaCalendar />, value: stats.totalSessions, label: 'Total Sessions', color: '#1976d2' },
          { icon: <FaUsers />, value: stats.totalAttendance, label: 'Total Attendance', color: '#2e7d32' },
          { icon: <FaChartLine />, value: stats.todayAttendance, label: 'Today', color: '#ed6c02' },
          { icon: <FaQrcode />, value: stats.activeSessions, label: 'Active', color: '#9c27b0' },
          { icon: <FaChartPie />, value: stats.attendanceRate, label: 'Attendance Rate', color: '#d32f2f' }
        ].map((stat, index) => (
          <Grid item xs={6} sm={4} md={2.4} key={index}>
            <Card sx={{ 
              height: '100%', 
              transition: 'all 0.3s', 
              '&:hover': { transform: 'translateY(-4px)', boxShadow: 4 } 
            }}>
              <CardContent sx={{ textAlign: 'center', p: 2 }}>
                <Box sx={{ color: stat.color, mb: 1 }}>
                  {React.cloneElement(stat.icon, { size: 28 })}
                </Box>
                <Typography variant="h5" sx={{ color: stat.color }}>
                  {stat.value}
                </Typography>
                <Typography variant="caption" color="textSecondary">
                  {stat.label}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Create Session Modal */}
      <Modal
        open={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          setCreateStep(0);
        }}
        closeAfterTransition
        BackdropComponent={Backdrop}
        BackdropProps={{ timeout: 500 }}
      >
        <Fade in={showCreateModal}>
          <Box sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: { xs: '90%', md: 600 },
            bgcolor: 'background.paper',
            borderRadius: 3,
            boxShadow: 24,
            p: 0,
            overflow: 'hidden'
          }}>
            {/* Modal Header */}
            <Box sx={{ 
              p: 3, 
              bgcolor: 'primary.main', 
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              gap: 2
            }}>
              <FaCalendarPlus size={24} />
              <Typography variant="h6">Create New Session</Typography>
            </Box>
            
            <Stepper activeStep={createStep} sx={{ p: 3, pb: 2 }}>
              <Step><StepLabel>Basic Info</StepLabel></Step>
              <Step><StepLabel>Time & Location</StepLabel></Step>
              <Step><StepLabel>Confirmation</StepLabel></Step>
            </Stepper>
            
            <Box sx={{ p: 3, maxHeight: 500, overflow: 'auto' }}>
              {createStep === 0 && (
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Session Title"
                      value={newSession.title}
                      onChange={(e) => setNewSession({...newSession, title: e.target.value})}
                      required
                      placeholder="e.g., Software Engineering Lab"
                      InputProps={{
                        startAdornment: <MdTitle style={{ marginRight: 8, color: '#666' }} />
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Course Code"
                      value={newSession.code}
                      onChange={(e) => setNewSession({...newSession, code: e.target.value})}
                      required
                      placeholder="e.g., SE301"
                      InputProps={{
                        startAdornment: <MdCategory style={{ marginRight: 8, color: '#666' }} />
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth>
                      <InputLabel>Course Type</InputLabel>
                      <Select
                        value={newSession.courseType}
                        label="Course Type"
                        onChange={(e) => setNewSession({...newSession, courseType: e.target.value})}
                      >
                        <MenuItem value="lecture"><MdClass style={{ marginRight: 8 }} /> Lecture</MenuItem>
                        <MenuItem value="lab"><MdVideoLibrary style={{ marginRight: 8 }} /> Lab</MenuItem>
                        <MenuItem value="tutorial"><MdGroup style={{ marginRight: 8 }} /> Tutorial</MenuItem>
                        <MenuItem value="seminar"><FaChalkboardTeacher style={{ marginRight: 8 }} /> Seminar</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Description (Optional)"
                      value={newSession.description}
                      onChange={(e) => setNewSession({...newSession, description: e.target.value})}
                      multiline
                      rows={2}
                      placeholder="Brief description of the session..."
                      InputProps={{
                        startAdornment: <MdDescription style={{ marginRight: 8, color: '#666' }} />
                      }}
                    />
                  </Grid>
                </Grid>
              )}
              
              {createStep === 1 && (
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Date"
                      type="date"
                      value={newSession.date}
                      onChange={(e) => setNewSession({...newSession, date: e.target.value})}
                      InputLabelProps={{ shrink: true }}
                      InputProps={{
                        startAdornment: <MdDateRange style={{ marginRight: 8, color: '#666' }} />
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Duration (minutes)"
                      type="number"
                      value={newSession.duration}
                      onChange={(e) => setNewSession({...newSession, duration: e.target.value})}
                      InputProps={{
                        startAdornment: <MdTimer style={{ marginRight: 8, color: '#666' }} />
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth>
                      <InputLabel>Start Time</InputLabel>
                      <Select
                        value={newSession.startTime}
                        label="Start Time"
                        onChange={(e) => setNewSession({...newSession, startTime: e.target.value})}
                      >
                        {timeOptions.map(time => (
                          <MenuItem key={time} value={time}>
                            <MdAccessTime style={{ marginRight: 8 }} /> {time}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth>
                      <InputLabel>End Time</InputLabel>
                      <Select
                        value={newSession.endTime}
                        label="End Time"
                        onChange={(e) => setNewSession({...newSession, endTime: e.target.value})}
                      >
                        {timeOptions.map(time => (
                          <MenuItem key={time} value={time}>
                            <MdAccessTime style={{ marginRight: 8 }} /> {time}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Location"
                      value={newSession.location}
                      onChange={(e) => setNewSession({...newSession, location: e.target.value})}
                      placeholder="e.g., Room 301, Lab A, Building C"
                      InputProps={{
                        startAdornment: <MdLocationOn style={{ marginRight: 8, color: '#666' }} />
                      }}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={newSession.autoGenerateQR}
                          onChange={(e) => setNewSession({...newSession, autoGenerateQR: e.target.checked})}
                        />
                      }
                      label="Auto-generate QR code after creation"
                    />
                  </Grid>
                </Grid>
              )}
              
              {createStep === 2 && (
                <Box>
                  <Alert severity="info" sx={{ mb: 3 }}>
                    <Typography variant="body2">
                      Please review the session details before creating:
                    </Typography>
                  </Alert>
                  
                  <Paper sx={{ p: 3, mb: 3, bgcolor: 'grey.50' }}>
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <Typography variant="caption" color="textSecondary">Title</Typography>
                        <Typography fontWeight="medium">{newSession.title}</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="caption" color="textSecondary">Course Code</Typography>
                        <Typography fontWeight="medium">{newSession.code}</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="caption" color="textSecondary">Date</Typography>
                        <Typography>{newSession.date}</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="caption" color="textSecondary">Time</Typography>
                        <Typography>{newSession.startTime} - {newSession.endTime}</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="caption" color="textSecondary">Duration</Typography>
                        <Typography>{newSession.duration} minutes</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="caption" color="textSecondary">Location</Typography>
                        <Typography>{newSession.location}</Typography>
                      </Grid>
                      {newSession.description && (
                        <Grid item xs={12}>
                          <Typography variant="caption" color="textSecondary">Description</Typography>
                          <Typography>{newSession.description}</Typography>
                        </Grid>
                      )}
                    </Grid>
                  </Paper>
                  
                  <Alert severity="success">
                    Ready to create session! {newSession.autoGenerateQR && 'QR code will be generated automatically.'}
                  </Alert>
                </Box>
              )}
            </Box>
            
            <Box sx={{ p: 3, pt: 0, display: 'flex', justifyContent: 'space-between' }}>
              <Button
                onClick={() => {
                  if (createStep > 0) {
                    setCreateStep(createStep - 1);
                  } else {
                    setShowCreateModal(false);
                  }
                }}
              >
                {createStep === 0 ? 'Cancel' : 'Back'}
              </Button>
              
              <Button
                variant="contained"
                onClick={() => {
                  if (createStep < 2) {
                    setCreateStep(createStep + 1);
                  } else {
                    handleCreateSession();
                  }
                }}
              >
                {createStep === 2 ? 'Create Session' : 'Next'}
              </Button>
            </Box>
          </Box>
        </Fade>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'error.main' }}>
            <FaExclamationTriangle /> Confirm Delete
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete the session "<strong>{sessionToDelete?.title}</strong>"?
          </Typography>
          <Alert severity="warning" sx={{ mt: 2 }}>
            This action cannot be undone. All attendance data for this session will be permanently deleted.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowDeleteConfirm(false)}>Cancel</Button>
          <Button 
            variant="contained" 
            color="error" 
            onClick={deleteSession}
            startIcon={<FaTrash />}
          >
            Delete Session
          </Button>
        </DialogActions>
      </Dialog>

      {/* QR Code Dialog */}
      <Dialog 
        open={showQRDialog} 
        onClose={() => setShowQRDialog(false)} 
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ bgcolor: 'primary.main', color: 'white', py: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <MdQrCode size={24} />
            <Typography variant="h6">QR Code for Attendance</Typography>
            {activeQR && (
              <Chip 
                label={`Valid: ${activeQR.timeRemaining}`}
                size="small"
                sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white', ml: 'auto' }}
              />
            )}
          </Box>
        </DialogTitle>
        <DialogContent sx={{ p: 4 }}>
          {activeQR && (
            <Grid container spacing={4}>
              {/* Left Column - QR Code */}
              <Grid item xs={12} md={6}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h5" gutterBottom color="primary">
                    {activeQR.sessionName}
                  </Typography>
                  
                  <Paper 
                    ref={qrRef}
                    sx={{ 
                      p: 3, 
                      bgcolor: 'white',
                      display: 'inline-block',
                      border: '2px solid #e0e0e0',
                      borderRadius: 2,
                      mb: 3,
                      boxShadow: '0 8px 24px rgba(0,0,0,0.12)'
                    }}
                  >
                    <QRCodeSVG
                      value={activeQR.qrCode} 
                      size={220}
                      level="H"
                      includeMargin={true}
                    />
                  </Paper>
                  
                  <Typography variant="body2" color="textSecondary" gutterBottom>
                    Expires at: {activeQR.expiry} ({activeQR.expirationMinutes || 15} minutes)
                  </Typography>
                  
                  <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', flexWrap: 'wrap', mb: 3 }}>
                    <Button
                      variant="contained"
                      startIcon={<FaCopy />}
                      onClick={copyQRCode}
                    >
                      Copy QR
                    </Button>
                    <Button
                      variant="outlined"
                      startIcon={<HiOutlineDownload />}
                      onClick={downloadQRCode}
                    >
                      Download
                    </Button>
                    <Button
                      variant="outlined"
                      startIcon={<HiOutlinePrinter />}
                      onClick={printQRCode}
                    >
                      Print
                    </Button>
                  </Box>
                </Box>
              </Grid>

              {/* Right Column - Manual Code & Instructions */}
              <Grid item xs={12} md={6}>
                <Card variant="outlined" sx={{ mb: 3 }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <FaKey /> Manual Entry Code
                    </Typography>
                    <Paper sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1, mb: 2 }}>
                      <Typography variant="body1" sx={{ 
                        fontFamily: 'monospace', 
                        fontWeight: 'bold',
                        fontSize: '1.1rem',
                        textAlign: 'center'
                      }}>
                        {activeQR.manualCode}
                      </Typography>
                    </Paper>
                    <Button
                      fullWidth
                      variant="outlined"
                      startIcon={<HiOutlineClipboardCopy />}
                      onClick={copyManualCode}
                    >
                      Copy Manual Code
                    </Button>
                  </CardContent>
                </Card>

                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <MdInfo /> How to Use
                    </Typography>
                    <List dense>
                      <ListItem>
                        <ListItemText 
                          primary="1. Display QR code in classroom"
                          secondary="Project or share on screen"
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemText 
                          primary="2. Students scan with their phones"
                          secondary="QR auto-expires to prevent misuse"
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemText 
                          primary="3. Alternative: Share manual code"
                          secondary="For students without camera access"
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemText 
                          primary="4. Real-time attendance tracking"
                          secondary="Watch attendance update live"
                        />
                      </ListItem>
                    </List>
                  </CardContent>
                </Card>

                <Box sx={{ mt: 3, p: 2, bgcolor: 'info.light', borderRadius: 1 }}>
                  <Typography variant="body2">
                    <strong>Tip:</strong> Keep this window open to monitor attendance in real-time.
                    Students from other devices will appear instantly.
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 0 }}>
          <Button onClick={() => setShowQRDialog(false)}>Close</Button>
          <Button 
            variant="contained" 
            color="secondary"
            onClick={() => {
              if (activeQR) endSession(activeQR.sessionId);
              setShowQRDialog(false);
            }}
            startIcon={<FaTimes />}
          >
            End Session
          </Button>
        </DialogActions>
      </Dialog>

      {/* Session Details Dialog */}
      <Dialog 
        open={showSessionDetails} 
        onClose={() => setShowSessionDetails(false)} 
        maxWidth="lg"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        {selectedSession && (
          <>
            <DialogTitle sx={{ bgcolor: 'primary.main', color: 'white', py: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography variant="h6">{selectedSession.title}</Typography>
                <Chip 
                  label={selectedSession.active ? "Active" : "Completed"} 
                  color={selectedSession.active ? "success" : "default"}
                  sx={{ color: 'white', bgcolor: selectedSession.active ? '#4caf50' : '#757575' }}
                />
              </Box>
            </DialogTitle>
            <DialogContent sx={{ p: 0 }}>
              <Tabs value="attendance" sx={{ borderBottom: 1, borderColor: 'divider', px: 3, pt: 2 }}>
                <Tab label="Attendance" value="attendance" icon={<FaUsers />} />
                <Tab label="Session Info" value="info" icon={<MdInfo />} />
                <Tab label="Actions" value="actions" icon={<FaQrcode />} />
              </Tabs>

              <Box sx={{ p: 3 }}>
                {/* Attendance Tab */}
                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Typography variant="h6">
                      Attendance ({selectedSession.attendees?.length || 0} students)
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button 
                        size="small" 
                        startIcon={<FaFileCsv />}
                        onClick={() => exportAttendanceCSV(selectedSession)}
                        disabled={!selectedSession.attendees?.length}
                      >
                        Export CSV
                      </Button>
                      <Button 
                        size="small" 
                        startIcon={<MdPictureAsPdf />}
                        onClick={() => exportAttendancePDF(selectedSession)}
                        disabled={!selectedSession.attendees?.length}
                      >
                        Export PDF
                      </Button>
                    </Box>
                  </Box>

                  {selectedSession.attendees?.length > 0 ? (
                    <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 300, overflow: 'auto' }}>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Student ID</TableCell>
                            <TableCell>Name</TableCell>
                            <TableCell>Year</TableCell>
                            <TableCell align="center">Status</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {selectedSession.attendees.map((studentId, index) => {
                            const student = mockDB.getStudentById(studentId);
                            return (
                              <TableRow key={index}>
                                <TableCell>
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <FaIdCard size={14} color="#666" />
                                    {studentId}
                                  </Box>
                                </TableCell>
                                <TableCell>
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <FaUserCircle size={16} color="#1976d2" />
                                    {student?.name || 'Unknown Student'}
                                  </Box>
                                </TableCell>
                                <TableCell>{student?.year || 'N/A'}</TableCell>
                                <TableCell align="center">
                                  <Chip 
                                    label="Present" 
                                    size="small" 
                                    color="success"
                                    icon={<FaCheckCircle size={12} />}
                                  />
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  ) : (
                    <Alert severity="info" sx={{ mt: 2 }}>
                      No attendance recorded for this session yet.
                    </Alert>
                  )}

                  {selectedSession.active && (
                    <Alert severity="success" sx={{ mt: 3 }}>
                      <Typography variant="body2">
                        <strong>Live Session:</strong> Students can scan the QR code to mark attendance in real-time.
                      </Typography>
                    </Alert>
                  )}
                </Box>
              </Box>
            </DialogContent>
            <DialogActions sx={{ p: 3 }}>
              <Button onClick={() => setShowSessionDetails(false)}>Close</Button>
              {selectedSession.active ? (
                <Button 
                  variant="contained" 
                  color="secondary"
                  onClick={() => endSession(selectedSession.id)}
                >
                  End Session
                </Button>
              ) : (
                <Button 
                  variant="contained" 
                  onClick={() => {
                    generateQR(selectedSession.id);
                    setShowSessionDetails(false);
                  }}
                >
                  Generate QR
                </Button>
              )}
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Main Content - Sessions Management */}
      <Card sx={{ boxShadow: 3, borderRadius: 3, overflow: 'hidden' }}>
        <CardContent sx={{ p: 0 }}>
          {/* Toolbar */}
          <Box sx={{ 
            p: 3, 
            bgcolor: 'background.paper',
            borderBottom: 1,
            borderColor: 'divider'
          }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={6}>
                <Typography variant="h5" fontWeight="bold">
                  Session Management
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Create and manage attendance sessions
                </Typography>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                  <TextField
                    placeholder="Search sessions..."
                    size="small"
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setTimeout(loadSessions, 300);
                    }}
                    sx={{ minWidth: 200 }}
                    InputProps={{
                      startAdornment: <FaSearch style={{ marginRight: 8, color: '#666' }} />
                    }}
                  />
                  
                  <FormControl size="small" sx={{ minWidth: 150 }}>
                    <Select
                      value={sortBy}
                      onChange={(e) => {
                        setSortBy(e.target.value);
                        setTimeout(loadSessions, 300);
                      }}
                      displayEmpty
                    >
                      <MenuItem value="date_desc">Newest First</MenuItem>
                      <MenuItem value="date_asc">Oldest First</MenuItem>
                      <MenuItem value="attendance_desc">Most Attended</MenuItem>
                      <MenuItem value="attendance_asc">Least Attended</MenuItem>
                    </Select>
                  </FormControl>
                  
                  <Button 
                    variant="contained" 
                    color="primary" 
                    onClick={() => setShowCreateModal(true)}
                    startIcon={<FaPlus />}
                  >
                    Create Session
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </Box>

          {/* Tabs */}
          <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 3 }}>
            <Tabs 
              value={activeTab} 
              onChange={handleTabChange}
              variant="scrollable"
              scrollButtons="auto"
            >
              <Tab label="All Sessions" value="all" icon={<FaListUl />} />
              <Tab 
                label={
                  <Badge badgeContent={stats.activeSessions} color="error" showZero>
                    <span>Active</span>
                  </Badge>
                } 
                value="active" 
                icon={<FaQrcode />}
              />
              <Tab label="Today" value="today" icon={<FaRegCalendarCheck />} />
              <Tab label="Upcoming" value="upcoming" icon={<FaCalendarAlt />} />
              <Tab label="Past" value="past" icon={<FaHistory />} />
            </Tabs>
          </Box>

          {/* Sessions Table */}
          {loading ? (
            <Box sx={{ p: 8, textAlign: 'center' }}>
              <CircularProgress />
              <Typography sx={{ mt: 2 }}>Loading sessions...</Typography>
            </Box>
          ) : sessions.length === 0 ? (
            <Box sx={{ 
              textAlign: 'center', 
              py: 8,
              color: 'text.secondary'
            }}>
              <MdClass size={64} style={{ opacity: 0.3, marginBottom: 16 }} />
              <Typography variant="h6" gutterBottom>
                No sessions found
              </Typography>
              <Typography variant="body2" sx={{ mb: 3 }}>
                {searchTerm 
                  ? 'No sessions match your search' 
                  : activeTab === 'active' 
                    ? 'No active sessions' 
                    : 'Create your first session to get started'}
              </Typography>
              <Button
                variant="contained"
                startIcon={<FaPlus />}
                onClick={() => setShowCreateModal(true)}
                size="large"
              >
                Create Your First Session
              </Button>
            </Box>
          ) : (
            <TableContainer>
              <Table>
                <TableHead sx={{ bgcolor: 'grey.50' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold' }}>Session Details</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Date & Time</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Attendance</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {sessions.map(session => (
                    <TableRow 
                      key={session.id}
                      hover
                      sx={{ 
                        '&:hover': { bgcolor: 'action.hover' },
                        bgcolor: session.active ? 'success.light' : 'inherit'
                      }}
                    >
                      <TableCell>
                        <Box>
                          <Typography variant="subtitle1" fontWeight="medium">
                            {session.title}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            {session.code} • {session.location || 'No location'}
                          </Typography>
                          {session.description && (
                            <Typography variant="caption" color="textSecondary" display="block">
                              {session.description.substring(0, 50)}...
                            </Typography>
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box>
                          <Typography variant="body2" fontWeight="medium">
                            {session.date}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            {session.startTime} - {session.endTime}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <FaUsers size={14} />
                          <Typography fontWeight="medium">
                            {session.attendees?.length || 0}
                          </Typography>
                          {session.attendees?.length > 0 && (
                            <Button
                              size="small"
                              onClick={() => viewSessionDetails(session)}
                              sx={{ ml: 1, minWidth: 0, p: 0.5 }}
                            >
                              <FaEye size={12} />
                            </Button>
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>
                        {session.active ? (
                          <Chip 
                            icon={<FaQrcode size={12} />}
                            label="QR Active" 
                            color="success" 
                            size="small"
                            sx={{ fontWeight: 'medium' }}
                          />
                        ) : (
                          <Chip 
                            label="Completed" 
                            color="default" 
                            size="small"
                            variant="outlined"
                          />
                        )}
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                          <Tooltip title={session.active ? "QR Active" : "Generate QR"}>
                            <Button
                              variant={session.active ? "contained" : "outlined"}
                              size="small"
                              onClick={() => generateQR(session.id)}
                              disabled={session.active}
                              sx={{ minWidth: 100 }}
                            >
                              {session.active ? 'Active' : 'Start QR'}
                            </Button>
                          </Tooltip>
                          
                          <Tooltip title="View Details">
                            <IconButton
                              size="small"
                              onClick={() => viewSessionDetails(session)}
                            >
                              <FaEye size={14} />
                            </IconButton>
                          </Tooltip>
                          
                          <Tooltip title="Export">
                            <IconButton
                              size="small"
                              onClick={() => exportAttendanceCSV(session)}
                              disabled={!session.attendees?.length}
                            >
                              <FaDownload size={14} />
                            </IconButton>
                          </Tooltip>
                          
                          <Tooltip title="Delete">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => confirmDeleteSession(session)}
                            >
                              <FaTrash size={14} />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* Cross-Device Instructions */}
      <Alert 
        severity="info" 
        sx={{ mt: 3, borderRadius: 2 }}
        icon={<FaMobileAlt />}
      >
        <Typography variant="body2">
          <strong>Cross-Device Testing:</strong> Open this app on another device (phone/tablet) and login as a student. 
          The attendance data will sync in real-time between devices using browser broadcast channels.
        </Typography>
      </Alert>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={() => setSnackbar({ ...snackbar, open: false })} 
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

// Import missing components
import CircularProgress from '@mui/material/CircularProgress';

export default ProfessorDashboard;