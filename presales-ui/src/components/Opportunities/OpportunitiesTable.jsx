import React, { useState } from 'react';
import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  Box,
  Typography,
  TablePagination,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import FilterBar from './FilterBar';
import OpportunityForm from './OpportunityForm';

const OpportunitiesTable = ({ opportunities, onAdd, onEdit, onDelete, userRole }) => {
  const [filters, setFilters] = useState({ search: '', status: '', region: '' });
  const [formOpen, setFormOpen] = useState(false);
  const [editingOpportunity, setEditingOpportunity] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const statuses = [...new Set(opportunities.map((o) => o.status).filter(Boolean))];
  const regions = [...new Set(opportunities.map((o) => o.region).filter(Boolean))];

  const filteredData = opportunities.filter((opp) => {
    const matchesSearch =
      !filters.search ||
      Object.values(opp).some((val) =>
        String(val).toLowerCase().includes(filters.search.toLowerCase())
      );
    const matchesStatus = !filters.status || opp.status === filters.status;
    const matchesRegion = !filters.region || opp.region === filters.region;
    return matchesSearch && matchesStatus && matchesRegion;
  });

  const paginatedData = filteredData.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  const handleAddNew = () => {
    if (userRole === 'presales_viewer') {
      alert('Viewers cannot add opportunities');
      return;
    }
    setEditingOpportunity(null);
    setFormOpen(true);
  };

  const handleEdit = (opportunity) => {
    if (userRole === 'presales_viewer') {
      alert('Viewers cannot edit opportunities');
      return;
    }
    setEditingOpportunity(opportunity);
    setFormOpen(true);
  };

  const handleFormSubmit = async (data) => {
    if (editingOpportunity) {
      await onEdit(editingOpportunity.id, data);
    } else {
      await onAdd(data);
    }
    setFormOpen(false);
    setEditingOpportunity(null);
  };

  const handleDelete = (id) => {
    if (userRole !== 'presales_admin') {
      alert('Only admins can delete opportunities');
      return;
    }
    if (window.confirm('Are you sure you want to delete this opportunity?')) {
      onDelete(id);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      Active: '#4ade80',
      'On Hold': '#fb923c',
      'Closed Won': '#667eea',
      'Closed Lost': '#ef4444',
      'In Progress': '#f093fb',
    };
    return colors[status] || '#94a3b8';
  };

  const formatCurrency = (value) => {
    if (!value) return '-';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <Box>
      <FilterBar
        filters={filters}
        onFilterChange={setFilters}
        onAddNew={handleAddNew}
        statuses={statuses}
        regions={regions}
      />

      <TableContainer 
        component={Paper}
        sx={{
          borderRadius: 3,
          background: 'white',
          border: '1px solid rgba(102, 126, 234, 0.15)',
          boxShadow: '0 4px 12px rgba(102, 126, 234, 0.1)',
          overflow: 'hidden',
        }}
      >
        <Table>
          <TableHead>
            <TableRow 
              sx={{ 
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              }}
            >
              <TableCell sx={{ fontWeight: 700, color: 'white', fontSize: '0.9rem' }}>ID</TableCell>
              <TableCell sx={{ fontWeight: 700, color: 'white', fontSize: '0.9rem' }}>Account Name</TableCell>
              <TableCell sx={{ fontWeight: 700, color: 'white', fontSize: '0.9rem' }}>Opportunity</TableCell>
              <TableCell sx={{ fontWeight: 700, color: 'white', fontSize: '0.9rem' }}>Region</TableCell>
              <TableCell sx={{ fontWeight: 700, color: 'white', fontSize: '0.9rem' }}>Status</TableCell>
              <TableCell sx={{ fontWeight: 700, color: 'white', fontSize: '0.9rem' }}>Deal Value</TableCell>
              <TableCell sx={{ fontWeight: 700, color: 'white', fontSize: '0.9rem' }}>Pursuit Lead</TableCell>
              <TableCell align="center" sx={{ fontWeight: 700, color: 'white', fontSize: '0.9rem' }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  <Typography color="text.secondary" py={8} fontSize="1.1rem">
                    No opportunities found
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              paginatedData.map((opp, index) => (
                <TableRow 
                  key={opp.id} 
                  sx={{
                    transition: 'all 0.2s ease',
                    background: index % 2 === 0 
                      ? 'rgba(248, 250, 252, 0.5)' 
                      : 'white',
                    '&:hover': {
                      background: 'rgba(102, 126, 234, 0.05)',
                      transform: 'scale(1.005)',
                      boxShadow: '0 2px 8px rgba(102, 126, 234, 0.1)',
                    }
                  }}
                >
                  <TableCell sx={{ fontWeight: 600, color: '#667eea' }}>{opp.id}</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: '#1e293b' }}>{opp.account_name}</TableCell>
                  <TableCell sx={{ color: '#475569' }}>{opp.opportunity || '-'}</TableCell>
                  <TableCell sx={{ color: '#475569' }}>{opp.region || '-'}</TableCell>
                  <TableCell>
                    <Chip
                      label={opp.status || 'N/A'}
                      size="small"
                      sx={{ 
                        fontWeight: 700,
                        background: `${getStatusColor(opp.status)}20`,
                        color: getStatusColor(opp.status),
                        border: `2px solid ${getStatusColor(opp.status)}60`,
                        fontSize: '0.75rem',
                      }}
                    />
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#4ade80', fontSize: '0.95rem' }}>
                    {formatCurrency(opp.deal_value_usd)}
                  </TableCell>
                  <TableCell sx={{ color: '#475569' }}>{opp.pursuit_lead || '-'}</TableCell>
                  <TableCell align="center">
                    <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                      {(userRole === 'presales_admin' || userRole === 'presales_creator') && (
                        <IconButton
                          size="small"
                          onClick={() => handleEdit(opp)}
                          sx={{
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            color: 'white',
                            width: 32,
                            height: 32,
                            transition: 'all 0.2s ease',
                            '&:hover': {
                              background: 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)',
                              transform: 'scale(1.1)',
                              boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)',
                            }
                          }}
                        >
                          <EditIcon sx={{ fontSize: 18 }} />
                        </IconButton>
                      )}
                      {userRole === 'presales_admin' && (
                        <IconButton
                          size="small"
                          onClick={() => handleDelete(opp.id)}
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
                          <DeleteIcon sx={{ fontSize: 18 }} />
                        </IconButton>
                      )}
                      {userRole === 'presales_viewer' && (
                        <Typography 
                          variant="caption" 
                          sx={{ 
                            fontStyle: 'italic', 
                            fontSize: '0.75rem',
                            color: 'text.secondary'
                          }}
                        >
                          View Only
                        </Typography>
                      )}
                    </Box>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={filteredData.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={(e, newPage) => setPage(newPage)}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
          sx={{
            background: 'rgba(248, 250, 252, 0.5)',
            borderTop: '1px solid rgba(102, 126, 234, 0.1)',
            color: '#475569',
            '.MuiTablePagination-selectLabel, .MuiTablePagination-displayedRows': {
              color: '#475569',
              fontWeight: 500,
            },
            '.MuiTablePagination-select': {
              color: '#1e293b',
            },
            '.MuiTablePagination-selectIcon': {
              color: '#475569',
            },
            '.MuiIconButton-root': {
              color: '#475569',
            }
          }}
        />
      </TableContainer>

      <OpportunityForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSubmit={handleFormSubmit}
        initialData={editingOpportunity}
      />
    </Box>
  );
};

export default OpportunitiesTable;