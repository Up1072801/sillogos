import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Button, Table, TableBody, TableCell, TableContainer, 
  TableHead, TableRow, Paper, Dialog, DialogTitle, DialogContent, 
  DialogActions, TextField, Select, MenuItem, FormControl, InputLabel,
  IconButton, Tooltip, CircularProgress
} from '@mui/material';
import { Delete, LockReset } from '@mui/icons-material';
import api from '../utils/api';

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState('new'); // 'new', 'reset'
  const [selectedUser, setSelectedUser] = useState(null);
  
  const [newUser, setNewUser] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    role: 'user'
  });
  
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/auth/users');
      setUsers(response.data);
      setError('');
    } catch (err) {
      console.error('Σφάλμα κατά τη φόρτωση χρηστών:', err);
      setError('Σφάλμα κατά τη φόρτωση των χρηστών');
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchUsers();
  }, []);
  
  const handleOpenNewUserDialog = () => {
    setNewUser({
      username: '',
      password: '',
      confirmPassword: '',
      role: 'user'
    });
    setDialogMode('new');
    setDialogOpen(true);
  };
  
  const handleOpenResetPasswordDialog = (user) => {
    setSelectedUser(user);
    setNewUser({
      ...newUser,
      password: '',
      confirmPassword: ''
    });
    setDialogMode('reset');
    setDialogOpen(true);
  };
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setNewUser({
      ...newUser,
      [name]: value
    });
  };
  
  const validateForm = () => {
    if (!newUser.username && dialogMode === 'new') {
      setError('Συμπληρώστε το όνομα χρήστη');
      return false;
    }
    
    if ((!newUser.password || !newUser.confirmPassword) && 
        (dialogMode === 'new' || dialogMode === 'reset')) {
      setError('Συμπληρώστε τον κωδικό και την επιβεβαίωση');
      return false;
    }
    
    if (newUser.password !== newUser.confirmPassword && 
        (dialogMode === 'new' || dialogMode === 'reset')) {
      setError('Οι κωδικοί δεν ταιριάζουν');
      return false;
    }
    
    if (newUser.password.length < 6 && 
        (dialogMode === 'new' || dialogMode === 'reset')) {
      setError('Ο κωδικός πρέπει να έχει τουλάχιστον 6 χαρακτήρες');
      return false;
    }
    
    return true;
  };
  
  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }
    
    setError('');
    
    try {
      if (dialogMode === 'new') {
        // Δημιουργία νέου χρήστη
        await api.post('/auth/users', {
          username: newUser.username,
          password: newUser.password,
          role: newUser.role
        });
        
      } else if (dialogMode === 'reset') {
        // Επαναφορά κωδικού
        await api.put(`/auth/users/${selectedUser.id}/reset-password`, {
          newPassword: newUser.password
        });
      }
      
      // Ανανέωση λίστας χρηστών
      await fetchUsers();
      setDialogOpen(false);
      
    } catch (err) {
      console.error('Σφάλμα:', err);
      setError(err.response?.data?.error || 'Σφάλμα κατά την επεξεργασία');
    }
  };
  
  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Είστε σίγουροι ότι θέλετε να διαγράψετε αυτόν τον χρήστη;')) {
      return;
    }
    
    try {
      await api.delete(`/auth/users/${userId}`);
      await fetchUsers();
    } catch (err) {
      console.error('Σφάλμα κατά τη διαγραφή:', err);
      setError(err.response?.data?.error || 'Σφάλμα κατά τη διαγραφή');
    }
  };
  
  // Έλεγχος αν είναι ο τρέχων χρήστης
  const currentUser = JSON.parse(localStorage.getItem('user'));
  
  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">Διαχείριση Χρηστών</Typography>
        <Button 
          variant="contained" 
          onClick={handleOpenNewUserDialog}
        >
          Νέος Χρήστης
        </Button>
      </Box>
      
      {error && (
        <Typography color="error" sx={{ my: 2 }}>
          {error}
        </Typography>
      )}
      
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Όνομα Χρήστη</TableCell>
              <TableCell>Ρόλος</TableCell>
              <TableCell>Ημ/νία Δημιουργίας</TableCell>
              <TableCell>Ενέργειες</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={4} align="center">
                  <CircularProgress size={24} /> Φόρτωση...
                </TableCell>
              </TableRow>
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} align="center">Δεν βρέθηκαν χρήστες</TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>{user.username}</TableCell>
                  <TableCell>{user.role === 'admin' ? 'Διαχειριστής' : 'Χρήστης'}</TableCell>
                  <TableCell>
                    {new Date(user.createdAt).toLocaleDateString('el-GR')}
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Tooltip title="Επαναφορά κωδικού">
                        <IconButton 
                          color="primary"
                          onClick={() => handleOpenResetPasswordDialog(user)}
                        >
                          <LockReset />
                        </IconButton>
                      </Tooltip>
                      
                      <Tooltip title="Διαγραφή">
                        <span>
                          <IconButton 
                            color="error"
                            onClick={() => handleDeleteUser(user.id)}
                            disabled={currentUser?.id === user.id} // Απενεργοποίηση αν είναι ο τρέχων χρήστης
                          >
                            <Delete />
                          </IconButton>
                        </span>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
      
      {/* Διάλογος για νέο χρήστη / επαναφορά κωδικού */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)}>
        <DialogTitle>
          {dialogMode === 'new' ? 'Νέος Χρήστης' : 'Επαναφορά Κωδικού'}
        </DialogTitle>
        
        <DialogContent sx={{ pt: 2 }}>
          {error && (
            <Typography color="error" sx={{ mb: 2 }}>
              {error}
            </Typography>
          )}
          
          {dialogMode === 'new' && (
            <TextField
              fullWidth
              margin="dense"
              label="Όνομα Χρήστη"
              name="username"
              value={newUser.username}
              onChange={handleChange}
            />
          )}
          
          {dialogMode === 'reset' && (
            <Typography variant="subtitle1" sx={{ mb: 2 }}>
              Επαναφορά κωδικού για: <strong>{selectedUser?.username}</strong>
            </Typography>
          )}
          
          <TextField
            fullWidth
            margin="dense"
            label="Κωδικός"
            type="password"
            name="password"
            value={newUser.password}
            onChange={handleChange}
          />
          
          <TextField
            fullWidth
            margin="dense"
            label="Επιβεβαίωση Κωδικού"
            type="password"
            name="confirmPassword"
            value={newUser.confirmPassword}
            onChange={handleChange}
          />
          
          {dialogMode === 'new' && (
            <FormControl fullWidth margin="dense">
              <InputLabel>Ρόλος</InputLabel>
              <Select
                name="role"
                value={newUser.role}
                onChange={handleChange}
                label="Ρόλος"
              >
                <MenuItem value="user">Χρήστης</MenuItem>
                <MenuItem value="admin">Διαχειριστής</MenuItem>
              </Select>
            </FormControl>
          )}
        </DialogContent>
        
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Άκυρο</Button>
          <Button 
            variant="contained" 
            onClick={handleSubmit}
          >
            {dialogMode === 'new' ? 'Δημιουργία' : 'Αποθήκευση'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}