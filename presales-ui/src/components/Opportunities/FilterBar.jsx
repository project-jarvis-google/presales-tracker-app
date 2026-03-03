import React, { useMemo } from 'react';
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
import { SUB_REGION_BY_REGION } from '../../utils/constants';

const FilterBar = ({ filters, onFilterChange, onAddNew, statuses, regions }) => {
  // Sub-regions cascade from selected region; if none selected, show all
  const availableSubRegions = useMemo(() => {
    if (!filters.region) return Object.values(SUB_REGION_BY_REGION).flat();
    return SUB_REGION_BY_REGION[filters.region] || [];
  }, [filters.region]);

  const handleRegionChange = (e) => {
    // Clear sub_region when region changes
    onFilterChange({ ...filters, region: e.target.value, subRegion: '' });
  };

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
        {/* Search */}
        <TextField
          placeholder="Search opportunities..."
          value={filters.search}
          onChange={(e) => onFilterChange({ ...filters, search: e.target.value })}
          sx={{
            flex: 1,
            minWidth: 220,
            '& .MuiOutlinedInput-root': {
              background: 'white', borderRadius: 2,
              '& fieldset': { borderColor: 'rgba(102,126,234,0.3)', borderWidth: 2 },
              '&:hover fieldset': { borderColor: 'rgba(102,126,234,0.5)' },
              '&.Mui-focused fieldset': { borderColor: '#667eea' },
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

        {/* Status */}
        <TextField
          select label="Status"
          value={filters.status}
          onChange={(e) => onFilterChange({ ...filters, status: e.target.value })}
          sx={{
            minWidth: 160,
            '& .MuiOutlinedInput-root': {
              background: 'white', borderRadius: 2,
              '& fieldset': { borderColor: 'rgba(240,147,251,0.3)', borderWidth: 2 },
              '&:hover fieldset': { borderColor: 'rgba(240,147,251,0.5)' },
              '&.Mui-focused fieldset': { borderColor: '#f093fb' },
            },
            '& .MuiInputLabel-root.Mui-focused': { color: '#f093fb' },
          }}
          size="small"
        >
          <MenuItem value="">All Statuses</MenuItem>
          {statuses.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
        </TextField>

        {/* Region */}
        <TextField
          select label="Region"
          value={filters.region}
          onChange={handleRegionChange}
          sx={{
            minWidth: 150,
            '& .MuiOutlinedInput-root': {
              background: 'white', borderRadius: 2,
              '& fieldset': { borderColor: 'rgba(74,222,128,0.3)', borderWidth: 2 },
              '&:hover fieldset': { borderColor: 'rgba(74,222,128,0.5)' },
              '&.Mui-focused fieldset': { borderColor: '#4ade80' },
            },
            '& .MuiInputLabel-root.Mui-focused': { color: '#4ade80' },
          }}
          size="small"
        >
          <MenuItem value="">All Regions</MenuItem>
          {regions.map((r) => <MenuItem key={r} value={r}>{r}</MenuItem>)}
        </TextField>

        {/* Sub-Region — cascades from Region */}
        <TextField
          select label="Sub-Region"
          value={filters.subRegion || ''}
          onChange={(e) => onFilterChange({ ...filters, subRegion: e.target.value })}
          sx={{
            minWidth: 165,
            '& .MuiOutlinedInput-root': {
              background: 'white', borderRadius: 2,
              '& fieldset': { borderColor: 'rgba(96,165,250,0.3)', borderWidth: 2 },
              '&:hover fieldset': { borderColor: 'rgba(96,165,250,0.5)' },
              '&.Mui-focused fieldset': { borderColor: '#60a5fa' },
            },
            '& .MuiInputLabel-root.Mui-focused': { color: '#60a5fa' },
          }}
          size="small"
        >
          <MenuItem value="">All Sub-Regions</MenuItem>
          {availableSubRegions.map((sr) => <MenuItem key={sr} value={sr}>{sr}</MenuItem>)}
        </TextField>

        {/* Add New */}
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={onAddNew}
          sx={{
            ml: 'auto',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            boxShadow: '0 4px 12px rgba(102,126,234,0.4)',
            px: 4, py: 1.2,
            textTransform: 'none', fontWeight: 600, fontSize: '0.95rem', borderRadius: 2,
            transition: 'all 0.3s ease',
            '&:hover': {
              background: 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)',
              transform: 'translateY(-2px)',
              boxShadow: '0 6px 20px rgba(102,126,234,0.5)',
            },
          }}
        >
          Add New
        </Button>
      </Box>
    </Paper>
  );
};

export default FilterBar;