import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  Container, Card, CardContent, Typography, Button,
  TextField, Alert, Box, CircularProgress, Paper,
  Dialog, DialogTitle, DialogContent, DialogActions,
  IconButton, Fab, Chip
} from '@mui/material';
import { 
  FaQrcode, 
  FaCamera, 
  FaCheckCircle, 
  FaTimesCircle,
  FaArrowLeft,
  FaMobileAlt,
  FaClock,
  FaCopy,
  FaExpand,
  FaLightbulb,
  FaVideo
} from 'react-icons/fa';
import { 
  MdQrCodeScanner, 
  MdContentCopy, 
  MdCameraAlt,
  MdFlashOn,
  MdFlashOff
} from 'react-icons/md';
import { HiOutlineClipboardCheck } from 'react-icons/hi';
import mockDB from '../services/mockDB';

// This simulates actual QR scanning - in production, use react-qr-scanner
const RealQRScanner = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const [scanning, setScanning] = useState(true);
  const [result, setResult] = useState(null);
  const [manualCode, setManualCode] = useState('');
  const [showManual, setShowManual] = useState(false);
  const [flashOn, setFlashOn] = useState(false);
  const [scanHistory, setScanHistory] = useState([]);
  const [activeSessions, setActiveSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);

  useEffect(() => {
    // Load active sessions
    const sessions = mockDB.getActiveSessions();
    setActiveSessions(sessions);
    
    // Listen for real-time updates
    const unsubscribe = mockDB.addDataListener((key, value) => {
      if (key === 'sessions') {
        const active = value.filter(s => s.active);
        setActiveSessions(active);
      }
    });
    
    // Simulate camera access
    setTimeout(() => {
      if (scanning) {
        // Simulate finding QR codes after 2 seconds
        simulateQRDetection();
      }
    }, 2000);
    
    return () => unsubscribe();
  }, [scanning]);

  const simulateQRDetection = () => {
    if (!scanning || result) return;
    
    const activeSessions = mockDB.getActiveSessions();
    if (activeSessions.length > 0) {
      // Simulate finding a QR code
      setTimeout(() => {
        const session = activeSessions[0];
        if (session.qrCode) {
          handleScan(session.qrCode);
        }
      }, 1000);
    }
  };

  const handleScan = (qrData) => {
    setScanning(false);
    setResult({ type: 'scanning', message: 'Processing QR code...' });
    
    setTimeout(() => {
      const attendanceResult = mockDB.markAttendance(user.studentId, qrData);
      
      if (attendanceResult.success) {
        setResult({
          type: 'success',
          message: `Attendance marked for ${attendanceResult.record.sessionName}`,
          details: `Scanned at ${new Date().toLocaleTimeString()}`
        });
        
        // Add to history
        setScanHistory(prev => [{
          id: Date.now(),
          session: attendanceResult.record.sessionName,
          time: new Date().toLocaleTimeString(),
          status: 'success'
        }, ...prev.slice(0, 4)]);
        
        // Auto-close after 3 seconds
        setTimeout(() => {
          navigate('/student');
        }, 3000);
      } else {
        setResult({
          type: 'error',
          message: attendanceResult.message,
          details: 'Please try again'
        });
      }
    }, 1500);
  };

  const handleManualSubmit = () => {
    if (!manualCode.trim()) {
      setResult({ type: 'error', message: 'Please enter a code' });
      return;
    }
    
    setScanning(false);
    setResult({ type: 'scanning', message: 'Processing manual code...' });
    
    setTimeout(() => {
      const attendanceResult = mockDB.markAttendance(user.studentId, manualCode);
      
      if (attendanceResult.success) {
        setResult({
          type: 'success',
          message: `Attendance marked for ${attendanceResult.record.sessionName}`,
          details: `Manual entry at ${new Date().toLocaleTimeString()}`
        });
        
        setScanHistory(prev => [{
          id: Date.now(),
          session: attendanceResult.record.sessionName,
          time: new Date().toLocaleTimeString(),
          status: 'manual'
        }, ...prev.slice(0, 4)]);
        
        setTimeout(() => {
          setShowManual(false);
          navigate('/student');
        }, 3000);
      } else {
        setResult({
          type: 'error',
          message: attendanceResult.message,
          details: 'Invalid or expired code'
        });
      }
    }, 1500);
  };

  const startScanning = () => {
    setScanning(true);
    setResult(null);
    setManualCode('');
  };

  const copyDemoCode = () => {
    const activeSessions = mockDB.getActiveSessions();
    if (activeSessions.length > 0) {
      const demoCode = activeSessions[0].qrCode || `DEMO-${Date.now()}`;
      navigator.clipboard.writeText(demoCode);
      setManualCode(demoCode);
      setResult({ type: 'info', message: 'Demo code copied!' });
    }
  };

  const selectSession = (session) => {
    setSelectedSession(session);
    if (session.qrCode) {
      setManualCode(session.qrCode);
    }
  };

  return (
    <Container maxWidth="md" sx={{ mt: 1, mb: 4 }}>
      {/* Back button */}
      <Button
        startIcon={<FaArrowLeft />}
        onClick={() => navigate('/student')}
        sx={{ mb: 2 }}
        variant="outlined"
      >
        Back to Dashboard
      </Button>

      <Card elevation={3} sx={{ borderRadius: 3, overflow: 'hidden' }}>
        <CardContent sx={{ p: 0 }}>
          {/* Header */}
          <Box sx={{ 
            p: 3, 
            bgcolor: 'primary.main', 
            color: 'white',
            textAlign: 'center'
          }}>
            <MdQrCodeScanner size={48} style={{ marginBottom: 16 }} />
            <Typography variant="h4" gutterBottom>
              QR Code Scanner
            </Typography>
            <Typography variant="body1">
              Scan your professor's QR code to mark attendance
            </Typography>
          </Box>

          {/* Main Content */}
          <Grid container>
            {/* Left Column - Scanner */}
            <Grid item xs={12} md={7}>
              <Box sx={{ p: 3, borderRight: { md: 1 }, borderColor: 'divider' }}>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <FaCamera /> Scanner View
                </Typography>
                
                {/* Scanner Simulation */}
                <Paper 
                  elevation={3} 
                  sx={{ 
                    position: 'relative',
                    width: '100%',
                    height: 300,
                    backgroundColor: '#000',
                    borderRadius: 2,
                    overflow: 'hidden',
                    mb: 3,
                    border: '2px solid',
                    borderColor: scanning ? 'primary.main' : 'divider'
                  }}
                >
                  {/* Camera overlay */}
                  <Box sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: scanning 
                      ? 'radial-gradient(circle, transparent 30%, rgba(0,0,0,0.9) 70%)'
                      : 'rgba(0,0,0,0.7)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexDirection: 'column'
                  }}>
                    {scanning ? (
                      <>
                        {/* Scanner frame */}
                        <Box sx={{
                          width: 200,
                          height: 200,
                          border: '3px solid #00ff00',
                          borderRadius: 2,
                          position: 'relative',
                          boxShadow: '0 0 20px #00ff00'
                        }}>
                          {/* Scanning line */}
                          <Box sx={{
                            position: 'absolute',
                            top: '50%',
                            left: 0,
                            right: 0,
                            height: 3,
                            background: 'linear-gradient(90deg, transparent, #00ff00, transparent)',
                            animation: 'scan 2s linear infinite'
                          }} />
                        </Box>
                        
                        {/* Scanning text */}
                        <Typography sx={{ color: '#00ff00', mt: 2 }}>
                          Scanning for QR codes...
                        </Typography>
                      </>
                    ) : (
                      <Box sx={{ textAlign: 'center', color: 'white' }}>
                        {result?.type === 'success' ? (
                          <FaCheckCircle size={64} color="#4caf50" />
                        ) : result?.type === 'error' ? (
                          <FaTimesCircle size={64} color="#f44336" />
                        ) : (
                          <MdCameraAlt size={64} color="#ccc" />
                        )}
                        <Typography variant="h6" sx={{ mt: 2 }}>
                          {result?.type === 'success' ? 'Ready to scan' : 
                           result?.type === 'error' ? 'Scan failed' : 'Scanner paused'}
                        </Typography>
                      </Box>
                    )}
                  </Box>
                  
                  {/* Camera controls */}
                  <Box sx={{ 
                    position: 'absolute', 
                    bottom: 16, 
                    left: 0, 
                    right: 0,
                    display: 'flex',
                    justifyContent: 'center',
                    gap: 2
                  }}>
                    <Fab
                      color="primary"
                      size="small"
                      onClick={() => setFlashOn(!flashOn)}
                      sx={{ bgcolor: flashOn ? 'warning.main' : 'grey.700' }}
                    >
                      {flashOn ? <MdFlashOn /> : <MdFlashOff />}
                    </Fab>
                    
                    <Fab
                      color={scanning ? "secondary" : "primary"}
                      onClick={startScanning}
                    >
                      {scanning ? <FaVideo /> : <MdCameraAlt />}
                    </Fab>
                    
                    <Fab
                      color="primary"
                      size="small"
                      onClick={() => setShowManual(true)}
                    >
                      <FaCopy />
                    </Fab>
                  </Box>
                </Paper>
                
                {/* Scanner controls */}
                <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
                  <Button
                    variant={scanning ? "contained" : "outlined"}
                    color={scanning ? "primary" : "inherit"}
                    onClick={startScanning}
                    startIcon={scanning ? <CircularProgress size={20} /> : <FaCamera />}
                    disabled={scanning && !result}
                  >
                    {scanning ? 'Scanning...' : 'Start Scanning'}
                  </Button>
                  
                  <Button
                    variant="outlined"
                    onClick={() => setShowManual(true)}
                    startIcon={<HiOutlineClipboardCheck />}
                  >
                    Enter Code
                  </Button>
                  
                  <Button
                    variant="outlined"
                    onClick={copyDemoCode}
                    startIcon={<FaLightbulb />}
                  >
                    Demo Code
                  </Button>
                </Box>
              </Box>
            </Grid>

            {/* Right Column - Info & Results */}
            <Grid item xs={12} md={5}>
              <Box sx={{ p: 3 }}>
                {/* Result display */}
                {result && (
                  <Alert 
                    severity={
                      result.type === 'success' ? "success" :
                      result.type === 'error' ? "error" :
                      result.type === 'scanning' ? "info" : "info"
                    }
                    icon={
                      result.type === 'success' ? <FaCheckCircle /> :
                      result.type === 'error' ? <FaTimesCircle /> :
                      <CircularProgress size={20} />
                    }
                    sx={{ mb: 3 }}
                  >
                    <Typography fontWeight="bold">{result.message}</Typography>
                    {result.details && (
                      <Typography variant="body2" sx={{ mt: 0.5 }}>
                        {result.details}
                      </Typography>
                    )}
                  </Alert>
                )}
                
                {/* Active Sessions */}
                <Paper elevation={1} sx={{ p: 2, mb: 3, borderRadius: 2 }}>
                  <Typography variant="subtitle1" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <FaClock /> Active Sessions
                  </Typography>
                  
                  {activeSessions.length > 0 ? (
                    <List dense>
                      {activeSessions.map(session => (
                        <ListItem 
                          key={session.id}
                          button
                          selected={selectedSession?.id === session.id}
                          onClick={() => selectSession(session)}
                          sx={{ 
                            borderRadius: 1,
                            mb: 1,
                            border: selectedSession?.id === session.id ? '2px solid' : '1px solid',
                            borderColor: selectedSession?.id === session.id ? 'primary.main' : 'divider'
                          }}
                        >
                          <ListItemText
                            primary={session.title}
                            secondary={`${session.code} • Expires in ${Math.max(0, Math.floor((session.qrExpiry - Date.now()) / 60000))}min`}
                          />
                          <Chip 
                            label="Active" 
                            size="small" 
                            color="success"
                            icon={<FaQrcode size={12} />}
                          />
                        </ListItem>
                      ))}
                    </List>
                  ) : (
                    <Typography variant="body2" color="textSecondary" align="center" sx={{ py: 2 }}>
                      No active sessions. Ask your professor to start a session.
                    </Typography>
                  )}
                </Paper>
                
                {/* Manual Entry */}
                {showManual && (
                  <Paper elevation={2} sx={{ p: 2, borderRadius: 2 }}>
                    <Typography variant="subtitle1" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <FaCopy /> Manual Entry
                    </Typography>
                    
                    <TextField
                      fullWidth
                      label="Enter QR code manually"
                      value={manualCode}
                      onChange={(e) => setManualCode(e.target.value)}
                      sx={{ mb: 2 }}
                      placeholder="ATTENDANCE-123-..."
                    />
                    
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={copyDemoCode}
                        startIcon={<MdContentCopy />}
                      >
                        Copy Demo
                      </Button>
                      
                      <Button
                        variant="contained"
                        size="small"
                        onClick={handleManualSubmit}
                        disabled={!manualCode.trim()}
                        sx={{ ml: 'auto' }}
                      >
                        Submit
                      </Button>
                    </Box>
                  </Paper>
                )}
                
                {/* Scan History */}
                {scanHistory.length > 0 && (
                  <Paper elevation={1} sx={{ p: 2, mt: 3, borderRadius: 2 }}>
                    <Typography variant="subtitle2" gutterBottom color="textSecondary">
                      Recent Scans
                    </Typography>
                    <List dense>
                      {scanHistory.map(scan => (
                        <ListItem key={scan.id} sx={{ px: 0, py: 0.5 }}>
                          <ListItemText
                            primary={scan.session}
                            secondary={scan.time}
                          />
                          <Chip 
                            label={scan.status} 
                            size="small"
                            color={scan.status === 'success' ? 'success' : 'default'}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </Paper>
                )}
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <style>{`
        @keyframes scan {
          0% { top: 0; }
          100% { top: 100%; }
        }
      `}</style>
    </Container>
  );
};

// Import missing components
import Grid from '@mui/material/Grid';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';

export default RealQRScanner;