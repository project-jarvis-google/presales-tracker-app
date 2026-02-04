import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  IconButton,
  Chip,
  Alert,
  CircularProgress,
} from '@mui/material';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { userService } from '../../services/api';

const PeopleManagement = ({ user }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [newUser, setNewUser] = useState({ email: '', name: '', role: 'presales_viewer' });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    setError('');
    
    try {
      const response = await userService.getAll();
      setUsers(response.data.data || []);
    } catch (err) {
      setError('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = async () => {
    setError('');
    
    try {
      await userService.add(newUser);
      setSuccess('User added successfully');
      setAddDialogOpen(false);
      setNewUser({ email: '', name: '', role: 'presales_viewer' });
      loadUsers();
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to add user');
    }
  };

  const handleUpdateRole = async (userId, newRole) => {
    setError('');
    
    try {
      await userService.updateRole(userId, newRole);
      setSuccess('User role updated successfully');
      setEditDialogOpen(false);
      setSelectedUser(null);
      loadUsers();
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to update user role');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm('Are you sure you want to remove this user?')) {
      setError('');
      
      try {
        await userService.delete(userId);
        setSuccess('User removed successfully');
        loadUsers();
        
        setTimeout(() => setSuccess(''), 3000);
      } catch (err) {
        setError(err.response?.data?.detail || 'Failed to remove user');
      }
    }
  };

  const getRoleColor = (role) => {
    const colors = {
      presales_admin: '#C73E1D',
      presales_creator: '#048A81',
      presales_viewer: '#54C6EB',
    };
    return colors[role] || '#6B6B6B';
  };

  const getRoleLabel = (role) => {
    const labels = {
      presales_admin: 'Presales Admin',
      presales_creator: 'Presales Creator',
      presales_viewer: 'Presales Viewer',
    };
    return labels[role] || role;
  };

  if (user.role !== 'presales_admin') {
    return (
      <Box p={4}>
        <Alert severity="error">
          Access Denied: Only administrators can view this page.
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Paper 
        sx={{ 
          p: 3,
          mb: 3,
          borderRadius: 3,
          background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%)',
          border: '1px solid rgba(102, 126, 234, 0.2)',
          boxShadow: '0 2px 8px rgba(102, 126, 234, 0.15)',
        }}
      >
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography variant="h5" fontWeight="700" gutterBottom sx={{ color: '#1e293b' }}>
              People Management
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Manage user access and roles
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<PersonAddIcon />}
            onClick={() => setAddDialogOpen(true)}
            sx={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              textTransform: 'none',
              fontWeight: 600,
              px: 3,
              boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
              '&:hover': {
                background: 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)',
                transform: 'translateY(-2px)',
                boxShadow: '0 6px 20px rgba(102, 126, 234, 0.4)',
              },
            }}
          >
            Add User
          </Button>
        </Box>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      {loading ? (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="300px">
          <CircularProgress sx={{ color: '#667eea' }} />
        </Box>
      ) : (
        <TableContainer 
          component={Paper}
          sx={{
            borderRadius: 3,
            background: 'white',
            border: '1px solid rgba(102, 126, 234, 0.15)',
            boxShadow: '0 4px 12px rgba(102, 126, 234, 0.1)',
          }}
        >
          <Table>
            <TableHead>
              <TableRow 
                sx={{ 
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                }}
              >
                <TableCell sx={{ fontWeight: 700, color: 'white' }}>Name</TableCell>
                <TableCell sx={{ fontWeight: 700, color: 'white' }}>Email</TableCell>
                <TableCell sx={{ fontWeight: 700, color: 'white' }}>Role</TableCell>
                <TableCell sx={{ fontWeight: 700, color: 'white' }}>Added On</TableCell>
                <TableCell align="center" sx={{ fontWeight: 700, color: 'white' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    <Typography color="text.secondary" py={6}>
                      No users found
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                users.map((u, index) => (
                  <TableRow 
                    key={u.id}
                    sx={{
                      background: index % 2 === 0 ? 'rgba(248, 250, 252, 0.5)' : 'white',
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        background: 'rgba(102, 126, 234, 0.05)',
                        transform: 'scale(1.005)',
                      }
                    }}
                  >
                    <TableCell sx={{ fontWeight: 600, color: '#1e293b' }}>{u.name}</TableCell>
                    <TableCell sx={{ color: '#475569' }}>{u.email}</TableCell>
                    <TableCell>
                      <Chip
                        label={getRoleLabel(u.role)}
                        size="small"
                        sx={{ 
                          fontWeight: 600,
                          backgroundColor: getRoleColor(u.role),
                          color: 'white',
                        }}
                      />
                    </TableCell>
                    <TableCell sx={{ color: '#475569' }}>
                      {new Date(u.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </TableCell>
                    <TableCell align="center">
                      <IconButton
                        size="small"
                        onClick={() => {
                          setSelectedUser(u);
                          setEditDialogOpen(true);
                        }}
                        sx={{
                          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                          color: 'white',
                          width: 32,
                          height: 32,
                          mr: 1,
                          transition: 'all 0.2s ease',
                          '&:hover': {
                            background: 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)',
                            transform: 'scale(1.1)',
                            boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)',
                          }
                        }}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleDeleteUser(u.id)}
                        sx={{
                          background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                          color: 'white',
                          width: 32,
                          height: 32,
                          transition: 'all 0.2s ease',
                          '&:hover': {
                            background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
                            transform: 'scale(1.1)',
                            boxShadow: '0 4px 12px rgba(239, 68, 68, 0.4)',
                          }
                        }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Add User Dialog */}
      <Dialog open={addDialogOpen} onClose={() => setAddDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle
          sx={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            fontWeight: 700,
          }}
        >
          Add New User
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <TextField
            fullWidth
            label="Email"
            type="email"
            value={newUser.email}
            onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
            margin="normal"
            required
            helperText="Must be a @google.com email address"
          />
          <TextField
            fullWidth
            label="Name"
            value={newUser.name}
            onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
            margin="normal"
            required
          />
          <TextField
            select
            fullWidth
            label="Role"
            value={newUser.role}
            onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
            margin="normal"
            required
          >
            <MenuItem value="presales_viewer">Presales Viewer</MenuItem>
            <MenuItem value="presales_creator">Presales Creator</MenuItem>
            <MenuItem value="presales_admin">Presales Admin</MenuItem>
          </TextField>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setAddDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleAddUser} 
            variant="contained"
            sx={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              '&:hover': {
                background: 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)',
              },
            }}
          >
            Add User
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Role Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle
          sx={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            fontWeight: 700,
          }}
        >
          Edit User Role
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          {selectedUser && (
            <>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                User: <strong>{selectedUser.name}</strong> ({selectedUser.email})
              </Typography>
              <TextField
                select
                fullWidth
                label="Role"
                value={selectedUser.role}
                onChange={(e) => setSelectedUser({ ...selectedUser, role: e.target.value })}
                margin="normal"
                required
              >
                <MenuItem value="presales_viewer">Presales Viewer</MenuItem>
                <MenuItem value="presales_creator">Presales Creator</MenuItem>
                <MenuItem value="presales_admin">Presales Admin</MenuItem>
              </TextField>
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={() => handleUpdateRole(selectedUser.id, selectedUser.role)} 
            variant="contained"
            sx={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              '&:hover': {
                background: 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)',
              },
            }}
          >
            Update Role
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PeopleManagement;