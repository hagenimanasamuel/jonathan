import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  Container, Card, CardContent, Typography, Button,
  TextField, Alert, Box, CircularProgress, Paper
} from '@mui/material';
import { 
  FaQrcode, 
  FaCamera, 
  FaCheckCircle, 
  FaTimesCircle,
  FaArrowLeft,
  FaMobileAlt,
  FaClock
} from 'react-icons/fa';
import { MdQrCodeScanner, MdContentCopy } from 'react-icons/md';
import mockDB from '../services/mockDB';

const QRScanner = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [qrInput, setQrInput] = useState('');
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState(null);
  const [countdown, setCountdown] = useState(5);
  const [showScanner, setShowScanner] = useState(true);

  useEffect(() => {
    let timer;
    if (scanning && countdown > 0) {
      timer = setInterval(() => {
        setCountdown(prev => prev - 1);
      }, 1000);
    } else if (countdown === 0) {
      handleScanComplete();
    }
    return () => clearInterval(timer);
  }, [scanning, countdown]);

  const handleScanComplete = () => {
    setScanning(false);
    // Use demo QR code for simulation
    const demoQR = `ATTENDANCE-1-${Date.now()}-DEMO456`;
    const attendanceResult = mockDB.markAttendance(user.studentId, demoQR);
    setResult(attendanceResult);
    
    if (attendanceResult.success) {
      setTimeout(() => navigate('/student'), 3000);
    }
  };

  const startScanning = () => {
    setShowScanner(true);
    setScanning(true);
    setCountdown(5);
    setResult(null);
  };

  const handleManualEntry = () => {
    if (!qrInput.trim()) {
      setResult({ success: false, message: 'Please enter a QR code' });
      return;
    }
    
    setScanning(true);
    setTimeout(() => {
      const attendanceResult = mockDB.markAttendance(user.studentId, qrInput);
      setResult(attendanceResult);
      setScanning(false);
      
      if (attendanceResult.success) {
        setTimeout(() => navigate('/student'), 2000);
      }
    }, 1500);
  };

  const generateDemoQR = () => {
    const demoCode = `ATTENDANCE-${Math.floor(Math.random() * 5) + 1}-${Date.now()}-${Math.random().toString(36).substr(2, 8).toUpperCase()}`;
    setQrInput(demoCode);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(qrInput);
    alert('QR code copied to clipboard!');
  };

  return (
    <Container maxWidth="md" sx={{ mt: 2, mb: 6 }}>
      <Button
        startIcon={<FaArrowLeft />}
        onClick={() => navigate('/student')}
        sx={{ mb: 2 }}
      >
        Back to Dashboard
      </Button>

      <Card elevation={3}>
        <CardContent sx={{ p: { xs: 2, md: 4 } }}>
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <FaQrcode size={60} color="#1976d2" style={{ marginBottom: 16 }} />
            <Typography variant="h4" gutterBottom>
              QR Code Scanner
            </Typography>
            <Typography variant="body1" color="textSecondary" paragraph>
              Scan the QR code displayed in your classroom to mark attendance
            </Typography>
          </Box>

          <Grid container spacing={4}>
            {/* Left Column - Scanner Simulation */}
            <Grid item xs={12} md={7}>
              <Paper elevation={2} sx={{ p: 3, borderRadius: 2 }}>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <FaCamera /> Scanner Preview
                </Typography>
                
                {/* Scanner Simulation */}
                <Box sx={{ 
                  position: 'relative',
                  width: '100%',
                  height: 300,
                  backgroundColor: '#000',
                  borderRadius: 2,
                  overflow: 'hidden',
                  mb: 2,
                  border: '2px solid',
                  borderColor: scanning ? 'primary.main' : 'divider'
                }}>
                  {/* Scanner Frame */}
                  <Box sx={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: 220,
                    height: 220,
                    border: '3px solid',
                    borderColor: scanning ? '#00ff00' : '#fff',
                    borderRadius: 2,
                    boxShadow: scanning ? '0 0 20px #00ff00' : 'none'
                  }}>
                    {/* Scanning Animation */}
                    {scanning && (
                      <Box sx={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        height: 4,
                        background: 'linear-gradient(90deg, transparent, #00ff00, transparent)',
                        animation: 'scan 2s linear infinite',
                        borderRadius: 2
                      }} />
                    )}
                    
                    {/* QR Code in Center (for demo) */}
                    <Box sx={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      width: 140,
                      height: 140,
                      backgroundColor: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: 1
                    }}>
                      <MdQrCodeScanner size={80} color="#000" />
                    </Box>
                  </Box>
                  
                  {/* Overlay Text */}
                  {scanning ? (
                    <Box sx={{
                      position: 'absolute',
                      bottom: 20,
                      left: 0,
                      right: 0,
                      textAlign: 'center',
                      color: '#00ff00'
                    }}>
                      <Typography variant="body1" fontWeight="medium">
                        Scanning... {countdown}s
                      </Typography>
                    </Box>
                  ) : (
                    <Box sx={{
                      position: 'absolute',
                      bottom: 20,
                      left: 0,
                      right: 0,
                      textAlign: 'center',
                      color: 'white'
                    }}>
                      <Typography variant="body2">
                        Point camera at QR code
                      </Typography>
                    </Box>
                  )}
                </Box>
                
                <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={startScanning}
                    disabled={scanning}
                    startIcon={scanning ? <CircularProgress size={20} /> : <FaCamera />}
                  >
                    {scanning ? `Scanning (${countdown}s)` : 'Start Scanning'}
                  </Button>
                  
                  <Button
                    variant="outlined"
                    onClick={() => setShowScanner(!showScanner)}
                  >
                    {showScanner ? 'Hide Scanner' : 'Show Scanner'}
                  </Button>
                </Box>
              </Paper>
            </Grid>

            {/* Right Column - Manual Entry & Results */}
            <Grid item xs={12} md={5}>
              <Paper elevation={2} sx={{ p: 3, borderRadius: 2, height: '100%' }}>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <FaMobileAlt /> Manual Entry
                </Typography>
                
                {result && (
                  <Alert 
                    severity={result.success ? "success" : "error"}
                    icon={result.success ? <FaCheckCircle /> : <FaTimesCircle />}
                    sx={{ mb: 3 }}
                  >
                    <Typography fontWeight="medium">{result.message}</Typography>
                    {result.success && (
                      <Typography variant="body2">
                        Redirecting to dashboard...
                      </Typography>
                    )}
                  </Alert>
                )}
                
                <TextField
                  fullWidth
                  label="Enter QR Code Manually"
                  value={qrInput}
                  onChange={(e) => setQrInput(e.target.value)}
                  sx={{ mb: 2 }}
                  disabled={scanning}
                  multiline
                  rows={2}
                />
                
                <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                  <Button
                    variant="outlined"
                    onClick={generateDemoQR}
                    disabled={scanning}
                    size="small"
                    startIcon={<MdQrCodeScanner />}
                  >
                    Get Demo QR
                  </Button>
                  
                  {qrInput && (
                    <Button
                      variant="outlined"
                      onClick={copyToClipboard}
                      size="small"
                      startIcon={<MdContentCopy />}
                    >
                      Copy
                    </Button>
                  )}
                </Box>
                
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleManualEntry}
                  disabled={scanning || !qrInput.trim()}
                  fullWidth
                  sx={{ mb: 3 }}
                  startIcon={scanning ? <CircularProgress size={20} /> : <FaCheckCircle />}
                >
                  {scanning ? 'Processing...' : 'Mark Attendance'}
                </Button>
                
                {/* Instructions */}
                <Paper sx={{ p: 2, bgcolor: 'info.light', borderRadius: 1 }}>
                  <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <FaClock /> How it works:
                  </Typography>
                  <Typography variant="body2">
                    1. Professor displays QR code in class<br/>
                    2. Scan within 15 minutes of generation<br/>
                    3. One scan per student per session<br/>
                    4. Instant confirmation
                  </Typography>
                </Paper>
              </Paper>
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

// Need to import Grid
import { Grid } from '@mui/material';

export default QRScanner;