import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Box, 
  Typography, 
  TextField, 
  Button, 
  Paper, 
  Container, 
  InputAdornment, 
  IconButton,
  Avatar,
  Divider
} from '@mui/material';
import { Visibility, VisibilityOff, Terrain } from '@mui/icons-material';
import api from '../utils/api';
import { setToken } from '../utils/auth';

// Προσθήκη του setUser ως παράμετρο στο component
export default function Login({ setUser }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  
  useEffect(() => {
    // Ανακατεύθυνση αν ο χρήστης είναι ήδη συνδεδεμένος
    const token = localStorage.getItem('token');
    if (token) {
      navigate('/');
    }
  }, [navigate]);
  
  const handleLogin = async (e) => {
    e.preventDefault();
    
    if (!username || !password) {
      setError('Συμπληρώστε το όνομα χρήστη και τον κωδικό');
      return;
    }
    
    setError('');
    setLoading(true);
    
    try {
      const response = await api.post('/auth/login', { username, password });
      
      // 1. Αποθήκευση token και στοιχείων χρήστη
      const token = response.data.token;
      const userData = response.data.user;
      
      // 2. Αποθήκευση στο localStorage
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userData));
      
      // 3. Ρύθμιση του token στα headers για μελλοντικά requests
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      // 4. Εάν είναι διαθέσιμη η συνάρτηση setUser
      if (typeof setUser === 'function') {
        setUser(userData);
      }
      
      // 5. Καθυστέρηση για να εξασφαλίσουμε σωστή αποθήκευση
      setTimeout(() => {
        // 6. Ανακατεύθυνση στην αρχική σελίδα
        navigate('/');
      }, 100);
      
    } catch (error) {
      console.error('Σφάλμα σύνδεσης:', error);
      setError(error.response?.data?.error || 'Σφάλμα σύνδεσης');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #f5f7fa 0%, #e4e8ed 100%)',
        backgroundImage: 'url("https://source.unsplash.com/random?mountains")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        padding: 2
      }}
    >
      <Container component="main" maxWidth="sm">
        <Paper
          elevation={6}
          sx={{ 
            padding: 4,
            borderRadius: 2,
            backdropFilter: 'blur(10px)',
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
          }}
        >
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            <Avatar sx={{ m: 2, bgcolor: '#1976d2', width: 70, height: 70 }}>
              <Terrain sx={{ fontSize: 40 }} />
            </Avatar>
            
            <Typography variant="h5" component="h1" sx={{ fontWeight: 'bold', color: '#1976d2', textAlign: 'center' }}>
              Ελληνικός Ορειβατικός Σύλλογος Πατρών
            </Typography>
            
            <Typography variant="subtitle1" sx={{ mb: 3, color: 'text.secondary', textAlign: 'center' }}>
              Σύστημα Διαχείρισης
            </Typography>
            
            <Divider sx={{ width: '100%', mb: 3 }} />

            <Typography component="h2" variant="h5" fontWeight="500" sx={{ mb: 3, color: '#1976d2' }}>
              Είσοδος Χρήστη
            </Typography>
            
            {error && (
              <Typography color="error" sx={{ mt: 1, mb: 2 }} variant="body2">
                {error}
              </Typography>
            )}
            
            <Box component="form" onSubmit={handleLogin} sx={{ mt: 1, width: '100%' }}>
              <TextField
                margin="normal"
                required
                fullWidth
                id="username"
                label="Όνομα χρήστη"
                name="username"
                autoComplete="username"
                autoFocus
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                variant="outlined"
                sx={{ mb: 2 }}
              />
              
              <TextField
                margin="normal"
                required
                fullWidth
                name="password"
                label="Κωδικός"
                type={showPassword ? 'text' : 'password'}
                id="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                variant="outlined"
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle password visibility"
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  )
                }}
                sx={{ mb: 3 }}
              />
              
              <Button
                type="submit"
                fullWidth
                variant="contained"
                color="primary"
                sx={{ 
                  mt: 2, 
                  mb: 2, 
                  py: 1.5, 
                  fontWeight: 'bold',
                  fontSize: '1rem',
                  backgroundColor: '#1976d2',
                  '&:hover': {
                    backgroundColor: '#0d47a1', 
                  }
                }}
                disabled={loading}
              >
                {loading ? 'Σύνδεση...' : 'ΣΥΝΔΕΣΗ'}
              </Button>
            </Box>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
}