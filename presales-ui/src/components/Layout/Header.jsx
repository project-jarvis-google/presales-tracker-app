import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Avatar,
  Menu,
  MenuItem,
  Box,
  Chip,
} from '@mui/material';
import { Logout, Person } from '@mui/icons-material';

const Header = ({ user, onLogout }) => {
  const [anchorEl, setAnchorEl] = useState(null);

  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    handleClose();
    onLogout();
  };

  const userName = user?.name || user?.email?.split('@')[0] || 'User';
  const userEmail = user?.email || '';
  const userInitial = userName ? userName[0].toUpperCase() : 'U';

  const getRoleLabel = (role) => {
    const labels = {
      presales_admin: 'Admin',
      presales_creator: 'Creator',
      presales_viewer: 'Viewer',
    };
    return labels[role] || role;
  };

  const getRoleColor = (role) => {
    const colors = {
      presales_admin: '#EA4335',
      presales_creator: '#34A853',
      presales_viewer: '#4285F4',
    };
    return colors[role] || '#5F6368';
  };

  return (
    <AppBar 
      position="static"
      sx={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
        borderRadius: 0,
      }}
    >
      <Toolbar>
        {/* Logo */}
        <Box 
          sx={{
            width: 40,
            height: 40,
            mr: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <img 
            src="/falcon.png" 
            alt="Flux Logo" 
            style={{ 
              width: '100%', 
              height: '100%',
              objectFit: 'contain',
              filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2))',
            }} 
          />
        </Box>
        
        <Box>
          <Typography 
            variant="h6" 
            component="div" 
            sx={{ 
              fontWeight: 600,
              color: 'white',
              lineHeight: 1.2,
            }}
          >
            Flux
          </Typography>
          <Typography 
            variant="caption" 
            component="div" 
            sx={{ 
              color: 'rgba(255, 255, 255, 0.8)',
              fontWeight: 400,
              fontSize: '0.7rem',
            }}
          >
            Presales Tracking
          </Typography>
        </Box>

        <Box sx={{ flexGrow: 1 }} />

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box sx={{ display: { xs: 'none', sm: 'block' }, textAlign: 'right', mr: 1 }}>
            <Typography 
              variant="body2" 
              sx={{ 
                fontWeight: 500,
                color: 'white',
                lineHeight: 1.2,
              }}
            >
              {userName}
            </Typography>
            <Chip
              label={getRoleLabel(user?.role)}
              size="small"
              sx={{
                height: 18,
                fontSize: '0.65rem',
                fontWeight: 600,
                backgroundColor: 'rgba(255, 255, 255, 0.25)',
                color: 'white',
                mt: 0.5,
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
              }}
            />
          </Box>
          <IconButton 
            onClick={handleMenu} 
            sx={{ 
              p: 0.5,
            }}
          >
            <Avatar
              alt={userName}
              sx={{ 
                width: 36, 
                height: 36,
                bgcolor: 'white',
                color: '#667eea',
                fontWeight: 600,
                fontSize: '0.95rem',
                border: '2px solid rgba(255, 255, 255, 0.3)',
              }}
            >
              {userInitial}
            </Avatar>
          </IconButton>
        </Box>

        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleClose}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'right',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
          PaperProps={{
            elevation: 3,
            sx: {
              mt: 1.5,
              minWidth: 220,
              borderRadius: 2,
            }
          }}
        >
          <MenuItem disabled sx={{ opacity: 1, flexDirection: 'column', alignItems: 'flex-start' }}>
            <Box display="flex" alignItems="center" width="100%" mb={0.5}>
              <Person sx={{ mr: 1, color: '#667eea', fontSize: 20 }} />
              <Typography variant="body2" fontWeight="500">{userName}</Typography>
            </Box>
            <Typography variant="caption" color="text.secondary" sx={{ ml: 3.5 }}>
              {userEmail}
            </Typography>
            <Chip
              label={getRoleLabel(user?.role)}
              size="small"
              sx={{
                mt: 1,
                ml: 3.5,
                height: 20,
                fontSize: '0.7rem',
                fontWeight: 600,
                backgroundColor: getRoleColor(user?.role),
                color: 'white',
              }}
            />
          </MenuItem>
          <MenuItem 
            onClick={handleLogout}
            sx={{
              mt: 1,
              color: '#5F6368',
              '&:hover': {
                backgroundColor: '#F8F9FA',
              }
            }}
          >
            <Logout sx={{ mr: 1, fontSize: 20 }} />
            Sign Out
          </MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  );
};

export default Header;