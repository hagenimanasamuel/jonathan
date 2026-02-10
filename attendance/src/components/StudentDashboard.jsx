import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  Container, Card, CardContent, Typography, Button, Grid,
  List, ListItem, ListItemText, ListItemIcon, Chip, Box, Paper, Alert,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  LinearProgress, Stepper, Step, StepLabel, StepContent,
  Tabs, Tab, Badge, IconButton, Tooltip, Fade, Divider
} from '@mui/material';
import { 
  FaQrcode, 
  FaCheckCircle, 
  FaUserGraduate,
  FaSignOutAlt,
  FaCalendarCheck,
  FaHistory,
  FaClock,
  FaCalendarAlt,
  FaChartBar,
  FaBell,
  FaExclamationTriangle,
  FaInfoCircle,
  FaMobileAlt,
  FaKey,
  FaCopy,
  FaTimes,
  FaArrowRight,
  FaRegClock,
  FaUniversity,
  FaChalkboardTeacher,
  FaMapMarkerAlt,
  FaShieldAlt,
  FaDoorOpen,
  FaListOl,
  FaUserFriends,
  FaRegCalendarPlus,
  FaSync,
  FaExpand
} from 'react-icons/fa';
import { 
  MdQrCodeScanner, 
  MdClass, 
  MdAccessTime,
  MdPerson,
  MdDateRange,
  MdTimer,
  MdWarning,
  MdDoneAll,
  MdError,
  MdInfo,
  MdShare,
  MdLocationOn,
  MdSchool,
  MdGroup,
  MdVideocam
} from 'react-icons/md';
import { HiOutlineClipboardCopy, HiOutlineExternalLink } from 'react-icons/hi';
import mockDB from '../services/mockDB';

const StudentDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  // Main states
  const [attendance, setAttendance] = useState([]);
  const [todaySessions, setTodaySessions] = useState([]);
  const [upcomingSessions, setUpcomingSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [activeTab, setActiveTab] = useState('today');
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [scanStep, setScanStep] = useState(0);
  const [expirationTime, setExpirationTime] = useState('');
  const [recentActivity, setRecentActivity] = useState([]);
  
  // Stats
  const [stats, setStats] = useState({
    total: 0,
    thisWeek: 0,
    thisMonth: 0,
    attendanceRate: '0%',
    streak: 0,
    pending: 0,
    totalSessions: 0
  });
  
  // Initialize
  useEffect(() => {
    loadData();
    
    // Listen for real-time updates from other devices
    const unsubscribe = mockDB.addDataListener((key) => {
      if (key === 'sessions' || key === 'attendance') {
        loadData();
      }
    });
    
    // Update expiration timer every second
    const timer = setInterval(updateExpirationTimers, 1000);
    
    return () => {
      unsubscribe();
      clearInterval(timer);
    };
  }, [user.studentId]);
  
  const loadData = () => {
    // Load student's attendance
    const studentAttendance = mockDB.getStudentAttendance(user.studentId);
    setAttendance(studentAttendance);
    
    // Get all sessions
    const allSessions = mockDB.getSessions();
    const today = new Date().toISOString().split('T')[0];
    
    // Today's sessions
    const todaySessionsList = allSessions.filter(s => s.date === today);
    setTodaySessions(todaySessionsList);
    
    // Upcoming sessions
    const upcoming = allSessions.filter(s => 
      s.date > today && 
      !s.attendees?.includes(user.studentId)
    ).slice(0, 5);
    setUpcomingSessions(upcoming);
    
    // Recent activity (last 5 actions)
    const recent = [...studentAttendance]
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, 5)
      .map(record => ({
        type: 'attendance',
        session: record.sessionName,
        time: record.timestamp,
        icon: <FaCheckCircle />,
        color: 'success'
      }));
    setRecentActivity(recent);
    
    // Calculate stats
    const total = studentAttendance.length;
    
    // This week
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const thisWeek = studentAttendance.filter(a => 
      new Date(a.timestamp) > weekAgo
    ).length;
    
    // This month
    const monthAgo = new Date();
    monthAgo.setMonth(monthAgo.getDate() - 30);
    const thisMonth = studentAttendance.filter(a => 
      new Date(a.timestamp) > monthAgo
    ).length;
    
    // Attendance rate
    const totalPossibleSessions = allSessions.filter(s => s.date <= today).length;
    const attendanceRate = totalPossibleSessions > 0 
      ? `${Math.round((total / totalPossibleSessions) * 100)}%` 
      : '0%';
    
    // Calculate streak
    const sortedAttendance = [...studentAttendance].sort((a, b) => 
      new Date(b.timestamp) - new Date(a.timestamp)
    );
    let streak = 0;
    let currentDate = new Date().toDateString();
    
    for (const record of sortedAttendance) {
      const recordDate = new Date(record.timestamp).toDateString();
      if (recordDate === currentDate) {
        streak++;
      } else {
        break;
      }
    }
    
    // Pending attendance (active sessions not attended)
    const pending = todaySessionsList.filter(s => 
      s.active && !s.attendees?.includes(user.studentId)
    ).length;
    
    setStats({
      total,
      thisWeek,
      thisMonth,
      attendanceRate,
      streak,
      pending,
      totalSessions: totalPossibleSessions
    });
    
    updateExpirationTimers();
  };
  
  const updateExpirationTimers = () => {
    const now = Date.now();
    todaySessions.forEach(session => {
      if (session.active && session.qrExpiry) {
        const remaining = session.qrExpiry - now;
        if (remaining > 0 && remaining < 5 * 60 * 1000) {
          const minutes = Math.floor(remaining / 60000);
          const seconds = Math.floor((remaining % 60000) / 1000);
          setExpirationTime(`${minutes}:${seconds.toString().padStart(2, '0')}`);
        }
      }
    });
  };
  
  const handleSessionClick = (session) => {
    setSelectedSession(session);
    setScanStep(0);
    setScanResult(null);
    setShowSessionModal(true);
    
    // If already attended, show details
    if (session.attendees?.includes(user.studentId)) {
      setScanStep(3);
    } else if (!session.active) {
      setScanStep(4);
    }
  };
  
  const startScanning = () => {
    if (!selectedSession || !selectedSession.active) {
      setScanResult({ success: false, message: 'Session is not active' });
      return;
    }
    
    setScanning(true);
    setScanStep(1);
    
    // Simulate scanning process
    setTimeout(() => {
      setScanStep(2);
      
      // Simulate processing
      setTimeout(() => {
        const qrCode = selectedSession.qrCode;
        const result = mockDB.markAttendance(user.studentId, qrCode);
        setScanResult(result);
        setScanning(false);
        
        if (result.success) {
          setScanStep(3);
          loadData();
          
          // Auto-close after success
          setTimeout(() => {
            setShowSessionModal(false);
          }, 2000);
        } else {
          setScanStep(0);
        }
      }, 1500);
    }, 1000);
  };
  
  const handleManualSubmit = () => {
    if (!manualCode.trim()) {
      setScanResult({ success: false, message: 'Please enter a valid code' });
      return;
    }
    
    setScanning(true);
    setTimeout(() => {
      const result = mockDB.markAttendance(user.studentId, manualCode);
      setScanResult(result);
      setScanning(false);
      
      if (result.success) {
        setScanStep(3);
        loadData();
        setTimeout(() => {
          setShowSessionModal(false);
          setShowManualEntry(false);
          setManualCode('');
        }, 2000);
      }
    }, 1500);
  };
  
  const copyDemoCode = () => {
    const activeSession = todaySessions.find(s => s.active);
    if (activeSession?.qrCode) {
      navigator.clipboard.writeText(activeSession.qrCode);
      setManualCode(activeSession.qrCode);
      setScanResult({ success: true, message: 'Demo code copied!' });
    }
  };
  
  const handleLogout = () => {
    logout();
    navigate('/login');
  };
  
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short',
      month: 'short', 
      day: 'numeric'
    });
  };
  
  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };
  
  const getSessionStatus = (session) => {
    if (session.attendees?.includes(user.studentId)) {
      return { 
        status: 'attended', 
        color: 'success', 
        icon: <FaCheckCircle />,
        label: 'Attended'
      };
    } else if (session.active) {
      return { 
        status: 'active', 
        color: 'warning', 
        icon: <FaClock />,
        label: 'Active'
      };
    } else if (new Date(session.date) < new Date()) {
      return { 
        status: 'missed', 
        color: 'error', 
        icon: <FaTimes />,
        label: 'Missed'
      };
    } else {
      return { 
        status: 'upcoming', 
        color: 'info', 
        icon: <FaCalendarAlt />,
        label: 'Upcoming'
      };
    }
  };
  
  const refreshData = () => {
    loadData();
    setScanResult({ success: true, message: 'Data refreshed!' });
  };
  
  const getFilteredSessions = () => {
    let filtered = todaySessions;
    
    switch(activeTab) {
      case 'active':
        filtered = filtered.filter(s => s.active);
        break;
      case 'pending':
        filtered = filtered.filter(s => !s.attendees?.includes(user.studentId));
        break;
      case 'attended':
        filtered = filtered.filter(s => s.attendees?.includes(user.studentId));
        break;
      case 'all':
      default:
        break;
    }
    
    return filtered;
  };
  
  return (
    <Container maxWidth="xl" sx={{ mt: 2, mb: 6, p: { xs: 1, md: 2 } }}>
      {/* Header */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        mb: 4,
        p: 3,
        background: 'linear-gradient(135deg, #2e7d32 0%, #1b5e20 100%)',
        color: 'white',
        borderRadius: 3,
        boxShadow: 3
      }}>
        <Box>
          <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <FaUserGraduate size={32} />
            Student Portal
          </Typography>
          <Typography variant="body1">
            Welcome back, <strong>{user?.name}</strong>
          </Typography>
          <Typography variant="body2">
            {user?.studentId} • {user?.year} • Software Engineering
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button 
            variant="outlined" 
            sx={{ color: 'white', borderColor: 'white' }}
            onClick={refreshData}
            startIcon={<FaSync />}
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
      
      {/* Pending Alerts */}
      {stats.pending > 0 && (
        <Alert 
          severity="warning" 
          sx={{ mb: 3 }}
          icon={<FaBell />}
          action={
            <Button 
              color="inherit" 
              size="small" 
              onClick={() => {
                const activeSession = todaySessions.find(s => s.active && !s.attendees?.includes(user.studentId));
                if (activeSession) {
                  handleSessionClick(activeSession);
                }
              }}
            >
              Mark Now
            </Button>
          }
        >
          You have <strong>{stats.pending} pending attendance</strong> session{stats.pending > 1 ? 's' : ''} today.
        </Alert>
      )}
      
      {/* Stats Cards */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
        {[
          { 
            icon: <FaCalendarCheck />, 
            value: stats.total, 
            label: 'Total Attended',
            color: '#1976d2',
            sublabel: `of ${stats.totalSessions} sessions`
          },
          { 
            icon: <FaChartBar />, 
            value: stats.thisWeek, 
            label: 'This Week',
            color: '#2e7d32',
            sublabel: 'sessions'
          },
          { 
            icon: <FaClock />, 
            value: stats.attendanceRate, 
            label: 'Attendance Rate',
            color: '#ed6c02',
            sublabel: 'overall'
          },
          { 
            icon: <FaHistory />, 
            value: stats.streak, 
            label: 'Day Streak',
            color: '#9c27b0',
            sublabel: 'consecutive days'
          },
          { 
            icon: <MdQrCodeScanner />, 
            value: stats.pending, 
            label: 'Pending',
            color: '#d32f2f',
            sublabel: 'today',
            action: () => navigate('/scan')
          }
        ].map((stat, index) => (
          <Grid item xs={6} sm={4} md={2.4} key={index}>
            <Card sx={{ 
              height: '100%', 
              transition: 'all 0.3s', 
              '&:hover': { transform: 'translateY(-4px)', boxShadow: 4, cursor: stat.action ? 'pointer' : 'default' } 
            }}
            onClick={stat.action}
            >
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
                {stat.sublabel && (
                  <Typography variant="caption" color="textSecondary" display="block">
                    {stat.sublabel}
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
      
      {/* Session Modal */}
      <Dialog 
        open={showSessionModal} 
        onClose={() => setShowSessionModal(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 3, overflow: 'hidden' }
        }}
      >
        {selectedSession && (
          <>
            <DialogTitle sx={{ 
              bgcolor: `${getSessionStatus(selectedSession).color}.main`, 
              color: 'white',
              py: 2
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                {getSessionStatus(selectedSession).icon}
                <Typography variant="h6">{selectedSession.title}</Typography>
                <Chip 
                  label={getSessionStatus(selectedSession).label.toUpperCase()}
                  size="small"
                  sx={{ 
                    bgcolor: 'rgba(255,255,255,0.2)', 
                    color: 'white',
                    ml: 'auto'
                  }}
                />
              </Box>
            </DialogTitle>
            
            <DialogContent sx={{ p: 0 }}>
              {/* Session Info */}
              <Box sx={{ p: 3, borderBottom: 1, borderColor: 'divider' }}>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="textSecondary">
                      <MdDateRange size={12} style={{ marginRight: 4 }} /> Date
                    </Typography>
                    <Typography>{selectedSession.date}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="textSecondary">
                      <MdAccessTime size={12} style={{ marginRight: 4 }} /> Time
                    </Typography>
                    <Typography>{selectedSession.startTime} - {selectedSession.endTime}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="textSecondary">
                      <MdSchool size={12} style={{ marginRight: 4 }} /> Course
                    </Typography>
                    <Typography>{selectedSession.code}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="textSecondary">
                      <MdPerson size={12} style={{ marginRight: 4 }} /> Professor
                    </Typography>
                    <Typography>{selectedSession.professorName}</Typography>
                  </Grid>
                  {selectedSession.location && (
                    <Grid item xs={12}>
                      <Typography variant="caption" color="textSecondary">
                        <MdLocationOn size={12} style={{ marginRight: 4 }} /> Location
                      </Typography>
                      <Typography>{selectedSession.location}</Typography>
                    </Grid>
                  )}
                  {selectedSession.active && selectedSession.qrExpiry && (
                    <Grid item xs={12}>
                      <Alert 
                        severity="warning" 
                        icon={<FaRegClock />}
                        sx={{ mt: 1 }}
                      >
                        <Typography variant="body2">
                          QR Code expires in: <strong>{expirationTime || 'Calculating...'}</strong>
                        </Typography>
                      </Alert>
                    </Grid>
                  )}
                </Grid>
              </Box>
              
              {/* Attendance Process */}
              <Box sx={{ p: 3 }}>
                <Stepper activeStep={scanStep} orientation="vertical">
                  {/* Step 0: Ready */}
                  <Step>
                    <StepLabel 
                      icon={scanStep === 0 ? <MdQrCodeScanner /> : <MdDoneAll />}
                      error={scanResult?.success === false}
                    >
                      {getSessionStatus(selectedSession).status === 'attended' ? 'Already Attended' : 'Mark Attendance'}
                    </StepLabel>
                    <StepContent>
                      {getSessionStatus(selectedSession).status === 'attended' ? (
                        <Alert severity="success" icon={<MdDoneAll />}>
                          <Typography>
                            You attended this session at {
                              attendance.find(a => a.sessionId === selectedSession.id) 
                              ? formatTime(attendance.find(a => a.sessionId === selectedSession.id).timestamp)
                              : 'previous time'
                            }
                          </Typography>
                        </Alert>
                      ) : getSessionStatus(selectedSession).status === 'active' ? (
                        <Box>
                          <Typography variant="body2" paragraph>
                            Scan the QR code displayed in class or enter the manual code.
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                            <Button
                              variant="contained"
                              fullWidth
                              onClick={startScanning}
                              disabled={scanning}
                              startIcon={<MdQrCodeScanner />}
                            >
                              Scan QR Code
                            </Button>
                            <Button
                              variant="outlined"
                              fullWidth
                              onClick={() => {
                                setShowManualEntry(true);
                                setManualCode('');
                              }}
                              startIcon={<FaKey />}
                            >
                              Enter Code
                            </Button>
                          </Box>
                        </Box>
                      ) : (
                        <Alert severity="info" icon={<MdInfo />}>
                          <Typography>
                            This session is {getSessionStatus(selectedSession).status}. 
                            {getSessionStatus(selectedSession).status === 'upcoming' 
                              ? ' Please wait for it to start.' 
                              : ' You cannot mark attendance now.'}
                          </Typography>
                        </Alert>
                      )}
                    </StepContent>
                  </Step>
                  
                  {/* Step 1: Scanning */}
                  <Step>
                    <StepLabel icon={scanning ? <MdTimer /> : <MdDoneAll />}>
                      Scanning QR Code
                    </StepLabel>
                    <StepContent>
                      <Box sx={{ textAlign: 'center', py: 2 }}>
                        <MdQrCodeScanner size={64} color="#1976d2" style={{ marginBottom: 16 }} />
                        <Typography variant="body1" gutterBottom>
                          Point your camera at the QR code
                        </Typography>
                        <LinearProgress sx={{ my: 2 }} />
                        <Typography variant="caption" color="textSecondary">
                          Align QR code within the frame
                        </Typography>
                      </Box>
                    </StepContent>
                  </Step>
                  
                  {/* Step 2: Processing */}
                  <Step>
                    <StepLabel icon={<MdTimer />}>
                      Processing Attendance
                    </StepLabel>
                    <StepContent>
                      <Box sx={{ textAlign: 'center', py: 2 }}>
                        <LinearProgress sx={{ mb: 2 }} />
                        <Typography variant="body1">
                          Verifying attendance...
                        </Typography>
                      </Box>
                    </StepContent>
                  </Step>
                  
                  {/* Step 3: Complete */}
                  <Step>
                    <StepLabel icon={<MdDoneAll />}>
                      {scanResult?.success ? 'Attendance Marked' : 'Error'}
                    </StepLabel>
                    <StepContent>
                      {scanResult && (
                        <Alert 
                          severity={scanResult.success ? "success" : "error"}
                          icon={scanResult.success ? <MdDoneAll /> : <MdError />}
                        >
                          <Typography fontWeight="bold">
                            {scanResult.message}
                          </Typography>
                          {scanResult.success && (
                            <Typography variant="body2" sx={{ mt: 1 }}>
                              Recorded at {new Date().toLocaleTimeString()}
                            </Typography>
                          )}
                        </Alert>
                      )}
                    </StepContent>
                  </Step>
                </Stepper>
              </Box>
            </DialogContent>
            
            <DialogActions sx={{ p: 3, pt: 0 }}>
              <Button onClick={() => setShowSessionModal(false)}>
                Close
              </Button>
              {getSessionStatus(selectedSession).status === 'active' && !selectedSession.attendees?.includes(user.studentId) && (
                <Button 
                  variant="contained" 
                  onClick={startScanning}
                  disabled={scanning}
                  startIcon={<MdQrCodeScanner />}
                >
                  {scanning ? 'Scanning...' : 'Try Again'}
                </Button>
              )}
            </DialogActions>
          </>
        )}
      </Dialog>
      
      {/* Manual Entry Modal */}
      <Dialog 
        open={showManualEntry} 
        onClose={() => {
          setShowManualEntry(false);
          setManualCode('');
        }}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <FaKey /> Enter Attendance Code
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Typography variant="body2" color="textSecondary" gutterBottom>
              Enter the code provided by your professor:
            </Typography>
            <TextField
              fullWidth
              placeholder="e.g., ATT-1234-5678"
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value.toUpperCase())}
              sx={{ my: 2 }}
              autoFocus
            />
            <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
              <Button
                variant="outlined"
                size="small"
                onClick={copyDemoCode}
                startIcon={<FaCopy />}
              >
                Copy Demo Code
              </Button>
              <Button
                variant="outlined"
                size="small"
                onClick={() => {
                  const randomCode = `ATT-${Math.floor(Math.random() * 9000 + 1000)}-${Date.now().toString().slice(-4)}`;
                  setManualCode(randomCode);
                }}
              >
                Generate Test
              </Button>
            </Box>
            {scanResult && (
              <Alert severity={scanResult.success ? "success" : "error"} sx={{ mt: 2 }}>
                {scanResult.message}
              </Alert>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setShowManualEntry(false);
            setManualCode('');
          }}>
            Cancel
          </Button>
          <Button 
            variant="contained" 
            onClick={handleManualSubmit}
            disabled={scanning || !manualCode.trim()}
          >
            {scanning ? 'Submitting...' : 'Submit Attendance'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Main Content */}
      <Grid container spacing={3}>
        {/* Left Column - Today's Sessions */}
        <Grid item xs={12} lg={8}>
          <Card sx={{ height: '100%', boxShadow: 3, borderRadius: 3 }}>
            <CardContent sx={{ p: 0 }}>
              <Box sx={{ 
                p: 3, 
                borderBottom: 1, 
                borderColor: 'divider',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <Typography variant="h5">
                  Today's Sessions
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Badge badgeContent={stats.pending} color="error">
                    <Chip 
                      label={`${todaySessions.length} total`}
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                  </Badge>
                  <Button
                    size="small"
                    onClick={() => navigate('/scan')}
                    startIcon={<MdQrCodeScanner />}
                    variant="outlined"
                  >
                    Open Scanner
                  </Button>
                </Box>
              </Box>
              
              <Tabs 
                value={activeTab} 
                onChange={(e, v) => setActiveTab(v)}
                sx={{ px: 3, borderBottom: 1, borderColor: 'divider' }}
                variant="scrollable"
                scrollButtons="auto"
              >
                <Tab label="All" value="today" />
                <Tab label="Active" value="active" />
                <Tab label="Pending" value="pending" />
                <Tab label="Attended" value="attended" />
              </Tabs>
              
              <Box sx={{ maxHeight: 500, overflow: 'auto' }}>
                {getFilteredSessions().length === 0 ? (
                  <Box sx={{ textAlign: 'center', py: 6 }}>
                    <MdClass size={64} style={{ opacity: 0.3, marginBottom: 16 }} />
                    <Typography variant="h6" color="textSecondary">
                      No sessions found
                    </Typography>
                    <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                      {activeTab === 'active' ? 'No active sessions' :
                       activeTab === 'pending' ? 'No pending attendance' :
                       activeTab === 'attended' ? 'No attended sessions' :
                       'No sessions scheduled for today'}
                    </Typography>
                  </Box>
                ) : (
                  <List>
                    {getFilteredSessions().map(session => {
                      const status = getSessionStatus(session);
                      const isActive = status.status === 'active';
                      const hasAttended = status.status === 'attended';
                      
                      return (
                        <ListItem 
                          key={session.id}
                          sx={{ 
                            borderBottom: 1,
                            borderColor: 'divider',
                            '&:hover': { bgcolor: 'action.hover' },
                            cursor: 'pointer'
                          }}
                          onClick={() => handleSessionClick(session)}
                        >
                          <ListItemIcon>
                            <Box sx={{ 
                              p: 1, 
                              borderRadius: '50%', 
                              bgcolor: `${status.color}.light`,
                              color: `${status.color}.main`
                            }}>
                              {status.icon}
                            </Box>
                          </ListItemIcon>
                          
                          <ListItemText
                            primary={
                              <Typography variant="subtitle1" fontWeight="medium">
                                {session.title}
                              </Typography>
                            }
                            secondary={
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 0.5, flexWrap: 'wrap' }}>
                                <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                  <MdAccessTime size={12} />
                                  {session.startTime} - {session.endTime}
                                </Typography>
                                <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                  <MdPerson size={12} />
                                  {session.professorName}
                                </Typography>
                                <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                  <FaUniversity size={12} />
                                  {session.code}
                                </Typography>
                                {session.location && (
                                  <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                    <MdLocationOn size={12} />
                                    {session.location}
                                  </Typography>
                                )}
                              </Box>
                            }
                          />
                          
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {isActive && session.qrExpiry && (
                              <Tooltip title="Time remaining">
                                <Chip 
                                  label={expirationTime || 'Active'}
                                  size="small"
                                  color="warning"
                                  icon={<FaRegClock />}
                                />
                              </Tooltip>
                            )}
                            
                            <Chip 
                              label={status.label}
                              size="small"
                              color={status.color}
                              variant={hasAttended ? "filled" : "outlined"}
                            />
                            
                            <IconButton size="small">
                              <FaArrowRight />
                            </IconButton>
                          </Box>
                        </ListItem>
                      );
                    })}
                  </List>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        {/* Right Column - Quick Actions & Recent */}
        <Grid item xs={12} lg={4}>
          <Grid container spacing={3}>
            {/* Quick Actions */}
            <Grid item xs={12}>
              <Card sx={{ boxShadow: 3, borderRadius: 3 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                    <FaQrcode /> Quick Actions
                  </Typography>
                  
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Button
                      variant="contained"
                      color="primary"
                      size="large"
                      onClick={() => navigate('/scan')}
                      startIcon={<MdQrCodeScanner />}
                      sx={{ py: 1.5 }}
                    >
                      Open QR Scanner
                    </Button>
                    
                    <Button
                      variant="outlined"
                      color="primary"
                      onClick={() => {
                        setShowManualEntry(true);
                        setManualCode('');
                      }}
                      startIcon={<FaKey />}
                    >
                      Enter Manual Code
                    </Button>
                    
                    <Button
                      variant="outlined"
                      onClick={() => {
                        const activeSession = todaySessions.find(s => s.active && !s.attendees?.includes(user.studentId));
                        if (activeSession) {
                          handleSessionClick(activeSession);
                        } else {
                          // Show snackbar or alert
                          setScanResult({ success: false, message: 'No active sessions available' });
                        }
                      }}
                      startIcon={<FaBell />}
                    >
                      Check Active Sessions
                    </Button>
                    
                    <Button
                      variant="outlined"
                      onClick={refreshData}
                      startIcon={<FaSync />}
                    >
                      Refresh Data
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            
            {/* Recent Attendance */}
            <Grid item xs={12}>
              <Card sx={{ boxShadow: 3, borderRadius: 3 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                    <FaHistory /> Recent Attendance
                  </Typography>
                  
                  {attendance.length === 0 ? (
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                      <FaCalendarAlt size={48} style={{ opacity: 0.3, marginBottom: 16 }} />
                      <Typography variant="body2" color="textSecondary">
                        No attendance records yet
                      </Typography>
                      <Button
                        variant="outlined"
                        size="small"
                        sx={{ mt: 2 }}
                        onClick={() => navigate('/scan')}
                      >
                        Mark First Attendance
                      </Button>
                    </Box>
                  ) : (
                    <>
                      <List sx={{ maxHeight: 300, overflow: 'auto' }}>
                        {attendance.slice(0, 5).map(record => (
                          <ListItem 
                            key={record.id}
                            sx={{ 
                              px: 0,
                              py: 1.5,
                              borderBottom: 1,
                              borderColor: 'divider',
                              '&:last-child': { borderBottom: 0 }
                            }}
                          >
                            <ListItemIcon>
                              <FaCheckCircle color="success" />
                            </ListItemIcon>
                            <ListItemText
                              primary={
                                <Typography variant="body2" fontWeight="medium" noWrap>
                                  {record.sessionName}
                                </Typography>
                              }
                              secondary={
                                <Typography variant="caption" color="textSecondary">
                                  {formatDate(record.timestamp)} • {formatTime(record.timestamp)}
                                </Typography>
                              }
                            />
                          </ListItem>
                        ))}
                      </List>
                      
                      {attendance.length > 5 && (
                        <Button 
                          fullWidth 
                          variant="text" 
                          size="small"
                          sx={{ mt: 1 }}
                          endIcon={<HiOutlineExternalLink />}
                          onClick={() => {
                            // In real app, this would navigate to full attendance page
                            setActiveTab('attended');
                          }}
                        >
                          View All ({attendance.length})
                        </Button>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            </Grid>
            
            {/* Upcoming Sessions */}
            {upcomingSessions.length > 0 && (
              <Grid item xs={12}>
                <Card sx={{ boxShadow: 3, borderRadius: 3 }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                      <FaCalendarAlt /> Upcoming Sessions
                    </Typography>
                    
                    <List dense>
                      {upcomingSessions.map(session => (
                        <ListItem 
                          key={session.id}
                          sx={{ 
                            px: 0,
                            py: 1,
                            '&:hover': { bgcolor: 'action.hover', cursor: 'pointer' }
                          }}
                          onClick={() => handleSessionClick(session)}
                        >
                          <ListItemIcon>
                            <FaRegCalendarPlus color="info" />
                          </ListItemIcon>
                          <ListItemText
                            primary={
                              <Typography variant="body2">
                                {session.title}
                              </Typography>
                            }
                            secondary={
                              <Typography variant="caption" color="textSecondary">
                                {session.date} • {session.startTime}
                              </Typography>
                            }
                          />
                          <IconButton size="small">
                            <FaArrowRight size={12} />
                          </IconButton>
                        </ListItem>
                      ))}
                    </List>
                    
                    {upcomingSessions.length > 0 && (
                      <Typography variant="caption" color="textSecondary" sx={{ display: 'block', textAlign: 'center', mt: 1 }}>
                        {upcomingSessions.length} upcoming session{upcomingSessions.length > 1 ? 's' : ''}
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            )}
            
            {/* Quick Stats */}
            <Grid item xs={12}>
              <Card sx={{ boxShadow: 3, borderRadius: 3 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                    <FaChartBar /> Quick Stats
                  </Typography>
                  
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Paper sx={{ p: 2, textAlign: 'center', borderRadius: 2 }}>
                        <Typography variant="h6" color="primary">
                          {stats.thisWeek}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          This Week
                        </Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={6}>
                      <Paper sx={{ p: 2, textAlign: 'center', borderRadius: 2 }}>
                        <Typography variant="h6" color="success.main">
                          {stats.thisMonth}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          This Month
                        </Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={12}>
                      <Divider sx={{ my: 1 }} />
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="body2">Attendance Rate:</Typography>
                        <Typography variant="body2" fontWeight="bold" color="primary">
                          {stats.attendanceRate}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
                        <Typography variant="body2">Current Streak:</Typography>
                        <Typography variant="body2" fontWeight="bold" color="success.main">
                          {stats.streak} days
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Grid>
      </Grid>
      
      {/* Cross-Device Testing Note */}
      <Alert 
        severity="info" 
        sx={{ mt: 4, borderRadius: 2 }}
        icon={<FaMobileAlt />}
      >
        <Typography variant="body2">
          <strong>Cross-Device Testing:</strong> Open this app on another device (phone/tablet) and login as a student. 
          Scan the QR code from the professor's device to see real-time attendance updates.
        </Typography>
        <Button 
          size="small" 
          sx={{ mt: 1 }}
          startIcon={<FaExpand />}
          onClick={() => window.open(window.location.href, '_blank')}
        >
          Open in New Window
        </Button>
      </Alert>
    </Container>
  );
};

export default StudentDashboard;