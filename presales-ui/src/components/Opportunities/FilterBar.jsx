import React from 'react';
import {
  Box,
  Paper,
  TextField,
  MenuItem,
  Button,
  InputAdornment,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';

const FilterBar = ({ filters, onFilterChange, onAddNew, statuses, regions }) => {
  return (
    <Paper 
      sx={{ 
        p: 2.5, 
        mb: 3,
        borderRadius: 3,
        boxShadow: '0 2px 8px rgba(102, 126, 234, 0.15)',
        background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%)',
        border: '1px solid rgba(102, 126, 234, 0.2)',
      }}
    >
      <Box display="flex" gap={2} flexWrap="wrap" alignItems="center">
        <TextField
          placeholder="Search opportunities..."
          value={filters.search}
          onChange={(e) => onFilterChange({ ...filters, search: e.target.value })}
          sx={{ 
            flex: 1, 
            minWidth: 250,
            '& .MuiOutlinedInput-root': {
              background: 'white',
              borderRadius: 2,
              '& fieldset': {
                borderColor: 'rgba(102, 126, 234, 0.3)',
                borderWidth: 2,
              },
              '&:hover fieldset': {
                borderColor: 'rgba(102, 126, 234, 0.5)',
              },
              '&.Mui-focused fieldset': {
                borderColor: '#667eea',
              }
            },
          }}
          size="small"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: '#667eea' }} />
              </InputAdornment>
            ),
          }}
        />

        <TextField
          select
          label="Status"
          value={filters.status}
          onChange={(e) => onFilterChange({ ...filters, status: e.target.value })}
          sx={{ 
            minWidth: 180,
            '& .MuiOutlinedInput-root': {
              background: 'white',
              borderRadius: 2,
              '& fieldset': {
                borderColor: 'rgba(240, 147, 251, 0.3)',
                borderWidth: 2,
              },
              '&:hover fieldset': {
                borderColor: 'rgba(240, 147, 251, 0.5)',
              },
              '&.Mui-focused fieldset': {
                borderColor: '#f093fb',
              }
            },
            '& .MuiInputLabel-root.Mui-focused': {
              color: '#f093fb',
            },
          }}
          size="small"
        >
          <MenuItem value="">All Statuses</MenuItem>
          {statuses.map((status) => (
            <MenuItem key={status} value={status}>
              {status}
            </MenuItem>
          ))}
        </TextField>

        <TextField
          select
          label="Region"
          value={filters.region}
          onChange={(e) => onFilterChange({ ...filters, region: e.target.value })}
          sx={{ 
            minWidth: 180,
            '& .MuiOutlinedInput-root': {
              background: 'white',
              borderRadius: 2,
              '& fieldset': {
                borderColor: 'rgba(74, 222, 128, 0.3)',
                borderWidth: 2,
              },
              '&:hover fieldset': {
                borderColor: 'rgba(74, 222, 128, 0.5)',
              },
              '&.Mui-focused fieldset': {
                borderColor: '#4ade80',
              }
            },
            '& .MuiInputLabel-root.Mui-focused': {
              color: '#4ade80',
            },
          }}
          size="small"
        >
          <MenuItem value="">All Regions</MenuItem>
          {regions.map((region) => (
            <MenuItem key={region} value={region}>
              {region}
            </MenuItem>
          ))}
        </TextField>

        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={onAddNew}
          sx={{ 
            ml: 'auto',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)',
            px: 4,
            py: 1.2,
            textTransform: 'none',
            fontWeight: 600,
            fontSize: '0.95rem',
            borderRadius: 2,
            transition: 'all 0.3s ease',
            '&:hover': {
              background: 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)',
              transform: 'translateY(-2px)',
              boxShadow: '0 6px 20px rgba(102, 126, 234, 0.5)',
            }
          }}
        >
          Add New
        </Button>
      </Box>
    </Paper>
  );
};

export default FilterBar;