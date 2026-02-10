import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  Container, Paper, Typography, TextField, Button,
  Box, Alert, Card, CardContent, Grid, Fade, Zoom,
  FormControlLabel, Checkbox, Divider
} from '@mui/material';
import { 
  FaUniversity, 
  FaUser, 
  FaLock, 
  FaSignInAlt,
  FaChalkboardTeacher,
  FaUserGraduate,
  FaQrcode,
  FaClock,
  FaCheckCircle,
  FaShieldAlt,
  FaMobileAlt
} from 'react-icons/fa';
import { MdEmail, MdPassword } from 'react-icons/md';
import mockDB from '../services/mockDB';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [showDemoTips, setShowDemoTips] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const result = mockDB.login(email, password);
    
    if (result.success) {
      login(result.user);
      if (rememberMe) {
        localStorage.setItem('rememberedEmail', email);
      }
      navigate(`/${result.user.role}`);
    } else {
      setError(result.message || 'Invalid credentials');
    }
    
    setLoading(false);
  };

  const quickLogin = (role) => {
    const credentials = {
      professor: { 
        email: 'prof@college.edu', 
        password: 'prof123',
        name: 'Professor Demo'
      },
      student: { 
        email: 'student1@college.edu', 
        password: 'stu123',
        name: 'Iradukunda Jonathan'
      }
    };
    
    const cred = credentials[role];
    setEmail(cred.email);
    setPassword(cred.password);
    setLoading(true);
    
    // Auto-login after a short delay for demo
    setTimeout(() => {
      const result = mockDB.login(cred.email, cred.password);
      if (result.success) {
        login(result.user);
        navigate(`/${result.user.role}`);
      } else {
        setError('Demo login failed');
        setLoading(false);
      }
    }, 500);
  };

  // Load remembered email
  React.useEffect(() => {
    const rememberedEmail = localStorage.getItem('rememberedEmail');
    if (rememberedEmail) {
      setEmail(rememberedEmail);
      setRememberMe(true);
    }
  }, []);

  return (
    <Container maxWidth="lg" sx={{ 
      mt: { xs: 2, md: 4 }, 
      mb: 6,
      minHeight: '90vh',
      display: 'flex',
      alignItems: 'center'
    }}>
      <Fade in timeout={800}>
        <Grid container spacing={4} alignItems="center">
          {/* Left Side - Welcome & Features */}
          <Grid item xs={12} md={6}>
            <Zoom in timeout={1000}>
              <Box sx={{ textAlign: { xs: 'center', md: 'left' } }}>
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: { xs: 'center', md: 'flex-start' },
                  gap: 2,
                  mb: 3
                }}>
                  <FaUniversity size={48} color="#1976d2" />
                  <Typography variant="h3" color="primary" fontWeight="bold">
                    SmartAttend
                  </Typography>
                </Box>
                
                <Typography variant="h4" gutterBottom fontWeight="medium">
                  Welcome to the Future of Attendance
                </Typography>
                
                <Typography variant="h6" color="textSecondary" paragraph sx={{ mb: 4 }}>
                  A revolutionary QR-based attendance system that saves time, 
                  prevents fraud, and streamlines classroom management.
                </Typography>

                {/* Feature Cards */}
                <Grid container spacing={2} sx={{ mb: 4 }}>
                  <Grid item xs={12} md={6}>
                    <Paper elevation={1} sx={{ p: 2, borderRadius: 2, height: '100%' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                        <FaQrcode size={24} color="#1976d2" />
                        <Typography variant="subtitle1" fontWeight="medium">
                          One-Tap Attendance
                        </Typography>
                      </Box>
                      <Typography variant="body2" color="textSecondary">
                        Students scan QR codes instantly. No more manual registers.
                      </Typography>
                    </Paper>
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <Paper elevation={1} sx={{ p: 2, borderRadius: 2, height: '100%' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                        <FaShieldAlt size={24} color="#2e7d32" />
                        <Typography variant="subtitle1" fontWeight="medium">
                          Fraud Prevention
                        </Typography>
                      </Box>
                      <Typography variant="body2" color="textSecondary">
                        Dynamic QR codes expire in 15 minutes. No proxy attendance.
                      </Typography>
                    </Paper>
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <Paper elevation={1} sx={{ p: 2, borderRadius: 2, height: '100%' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                        <FaClock size={24} color="#ed6c02" />
                        <Typography variant="subtitle1" fontWeight="medium">
                          Real-time Tracking
                        </Typography>
                      </Box>
                      <Typography variant="body2" color="textSecondary">
                        Professors see attendance live. Instant reports and analytics.
                      </Typography>
                    </Paper>
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <Paper elevation={1} sx={{ p: 2, borderRadius: 2, height: '100%' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                        <FaMobileAlt size={24} color="#9c27b0" />
                        <Typography variant="subtitle1" fontWeight="medium">
                          Mobile Friendly
                        </Typography>
                      </Box>
                      <Typography variant="body2" color="textSecondary">
                        Works on any device. No app installation required.
                      </Typography>
                    </Paper>
                  </Grid>
                </Grid>

                {/* Demo Info */}
                <Paper elevation={0} sx={{ 
                  p: 3, 
                  backgroundColor: 'info.light', 
                  borderRadius: 2,
                  borderLeft: '4px solid',
                  borderColor: 'info.main'
                }}>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <FaCheckCircle /> About This Demo
                  </Typography>
                  <Typography variant="body2" paragraph>
                    This is a fully functional MVP demonstrating the QR attendance system. 
                    All data is stored locally in your browser.
                  </Typography>
                  <Button 
                    variant="outlined" 
                    size="small" 
                    onClick={() => setShowDemoTips(!showDemoTips)}
                  >
                    {showDemoTips ? 'Hide Tips' : 'Show Demo Tips'}
                  </Button>
                  
                  {showDemoTips && (
                    <Box sx={{ mt: 2, pl: 2 }}>
                      <Typography variant="body2">
                        • Try both Professor and Student accounts<br/>
                        • Create sessions and generate QR codes<br/>
                        • Scan QR codes to mark attendance<br/>
                        • All data resets on page refresh
                      </Typography>
                    </Box>
                  )}
                </Paper>
              </Box>
            </Zoom>
          </Grid>

          {/* Right Side - Login Form */}
          <Grid item xs={12} md={6}>
            <Zoom in timeout={1200}>
              <Card elevation={6} sx={{ 
                borderRadius: 3,
                overflow: 'hidden',
                border: '1px solid',
                borderColor: 'divider'
              }}>
                {/* Card Header */}
                <Box sx={{ 
                  backgroundColor: 'primary.main', 
                  color: 'white',
                  p: 3,
                  textAlign: 'center'
                }}>
                  <FaSignInAlt size={32} style={{ marginBottom: 8 }} />
                  <Typography variant="h4" fontWeight="bold">
                    Sign In
                  </Typography>
                  <Typography variant="body1" sx={{ opacity: 0.9 }}>
                    Access your attendance portal
                  </Typography>
                </Box>

                <CardContent sx={{ p: { xs: 3, md: 4 } }}>
                  {/* Quick Login Buttons */}
                  <Box sx={{ mb: 4 }}>
                    <Typography variant="h6" gutterBottom align="center" color="textSecondary">
                      Quick Demo Login
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={6}>
                        <Button
                          fullWidth
                          variant="contained"
                          size="large"
                          onClick={() => quickLogin('professor')}
                          disabled={loading}
                          startIcon={<FaChalkboardTeacher />}
                          sx={{ 
                            py: 1.5,
                            bgcolor: 'primary.dark',
                            '&:hover': { bgcolor: 'primary.main' }
                          }}
                        >
                          Professor
                        </Button>
                        <Typography variant="caption" color="textSecondary" align="center" display="block" sx={{ mt: 1 }}>
                          prof@college.edu
                        </Typography>
                      </Grid>
                      
                      <Grid item xs={12} md={6}>
                        <Button
                          fullWidth
                          variant="contained"
                          color="secondary"
                          size="large"
                          onClick={() => quickLogin('student')}
                          disabled={loading}
                          startIcon={<FaUserGraduate />}
                          sx={{ py: 1.5 }}
                        >
                          Student
                        </Button>
                        <Typography variant="caption" color="textSecondary" align="center" display="block" sx={{ mt: 1 }}>
                          student1@college.edu
                        </Typography>
                      </Grid>
                    </Grid>
                  </Box>

                  <Divider sx={{ my: 3 }}>
                    <Typography variant="body2" color="textSecondary">
                      OR SIGN IN MANUALLY
                    </Typography>
                  </Divider>

                  {/* Login Form */}
                  <form onSubmit={handleLogin}>
                    {error && (
                      <Alert 
                        severity="error" 
                        sx={{ mb: 3 }}
                        onClose={() => setError('')}
                      >
                        {error}
                      </Alert>
                    )}
                    
                    {/* Email Field */}
                    <Box sx={{ mb: 3 }}>
                      <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <MdEmail /> Email Address
                      </Typography>
                      <TextField
                        fullWidth
                        placeholder="your.email@college.edu"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        disabled={loading}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 2,
                          }
                        }}
                        InputProps={{
                          startAdornment: (
                            <FaUser style={{ marginRight: 10, color: '#666' }} />
                          ),
                        }}
                      />
                    </Box>
                    
                    {/* Password Field */}
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <MdPassword /> Password
                      </Typography>
                      <TextField
                        fullWidth
                        placeholder="Enter your password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        disabled={loading}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 2,
                          }
                        }}
                        InputProps={{
                          startAdornment: (
                            <FaLock style={{ marginRight: 10, color: '#666' }} />
                          ),
                        }}
                      />
                    </Box>
                    
                    {/* Remember Me & Forgot Password */}
                    <Box sx={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      mb: 3
                    }}>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={rememberMe}
                            onChange={(e) => setRememberMe(e.target.checked)}
                            color="primary"
                            disabled={loading}
                          />
                        }
                        label="Remember me"
                      />
                      <Button 
                        variant="text" 
                        size="small"
                        onClick={() => alert('Password reset feature would be implemented in production')}
                      >
                        Forgot password?
                      </Button>
                    </Box>
                    
                    {/* Submit Button */}
                    <Button
                      type="submit"
                      fullWidth
                      variant="contained"
                      size="large"
                      disabled={loading || !email || !password}
                      sx={{ 
                        py: 1.5,
                        borderRadius: 2,
                        fontSize: '1.1rem',
                        fontWeight: 'bold',
                        mb: 2
                      }}
                      startIcon={loading ? null : <FaSignInAlt />}
                    >
                      {loading ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2"></span>
                          Signing in...
                        </>
                      ) : 'Sign In'}
                    </Button>
                    
                    {/* Demo Note */}
                    <Alert 
                      severity="info" 
                      icon={null}
                      sx={{ 
                        mt: 3,
                        borderRadius: 2,
                        bgcolor: 'grey.50'
                      }}
                    >
                      <Typography variant="body2" align="center">
                        <strong>Demo Mode:</strong> All data is stored locally. 
                        Refresh the page to reset everything.
                      </Typography>
                    </Alert>
                  </form>
                </CardContent>
              </Card>
            </Zoom>
          </Grid>
        </Grid>
      </Fade>

      {/* Footer */}
      <Box sx={{ 
        position: 'fixed', 
        bottom: 0, 
        left: 0, 
        right: 0, 
        p: 2,
        backgroundColor: 'primary.dark',
        color: 'white',
        textAlign: 'center'
      }}>
        <Typography variant="caption">
          SmartAttend MVP • Developed for College Attendance System Proposal • 
          Data is stored locally in your browser • 
          <Button 
            size="small" 
            sx={{ color: 'white', ml: 1 }}
            onClick={() => {
              localStorage.clear();
              window.location.reload();
            }}
          >
            Reset Demo Data
          </Button>
        </Typography>
      </Box>

      {/* Add spinner styles */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .spinner-border {
          display: inline-block;
          width: 1rem;
          height: 1rem;
          vertical-align: text-bottom;
          border: 0.2em solid currentColor;
          border-right-color: transparent;
          border-radius: 50%;
          animation: spin 0.75s linear infinite;
        }
      `}</style>
    </Container>
  );
};

export default Login;