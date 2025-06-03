import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, TextField, Button, Paper, Container, InputAdornment, IconButton } from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
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
      const response = await api.post('/api/auth/login', { username, password });
      
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
    <Container component="main" maxWidth="xs">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Paper
          elevation={3}
          sx={{ 
            padding: 4, 
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center'
          }}
        >
          <Typography component="h1" variant="h5">
            Είσοδος
          </Typography>
          
          {error && (
            <Typography color="error" sx={{ mt: 2, mb: 1 }}>
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
            />
            
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
              disabled={loading}
            >
              {loading ? 'Σύνδεση...' : 'Σύνδεση'}
            </Button>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
}