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
import DescriptionIcon from '@mui/icons-material/Description';
import LinkIcon from '@mui/icons-material/Link';
import FilterBar from './FilterBar';
import OpportunityForm from './OpportunityForm';
import { getStatusColor, getChargingColor } from '../../utils/constants';

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

  const formatCurrency = (value) => {
    if (!value) return '-';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatBoolean = (value) => {
    return value ? 'Yes' : 'No';
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  // Format assignee names with line breaks
  const formatAssignees = (assigneeString) => {
    if (!assigneeString) return '-';
    const assignees = assigneeString.split(',').map(name => name.trim()).filter(Boolean);
    if (assignees.length === 0) return '-';
    
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
        {assignees.map((name, index) => (
          <Typography key={index} sx={{ fontSize: '0.85rem', color: '#475569', lineHeight: 1.3 }}>
            {name}
          </Typography>
        ))}
      </Box>
    );
  };

  // Format document/link with opportunity name as clickable link
  const formatDocumentLink = (url, opportunity) => {
    if (!url) return '-';
    
    // Use opportunity name, fallback to account name, fallback to generic text
    const linkText = opportunity.opportunity || opportunity.account_name || 'View Document';
    
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <DescriptionIcon sx={{ fontSize: 16, color: '#667eea' }} />
        <a 
          href={url} 
          target="_blank" 
          rel="noopener noreferrer"
          style={{ 
            color: '#667eea', 
            textDecoration: 'none',
            fontWeight: 500,
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => e.target.style.textDecoration = 'underline'}
          onMouseLeave={(e) => e.target.style.textDecoration = 'none'}
        >
          {linkText}
        </a>
      </Box>
    );
  };

  const formatVectorLink = (url, opportunity) => {
    if (!url) return '-';
    
    // Use opportunity name, fallback to account name, fallback to generic text
    const linkText = opportunity.opportunity || opportunity.account_name || 'View Vector';
    
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <LinkIcon sx={{ fontSize: 16, color: '#667eea' }} />
        <a 
          href={url} 
          target="_blank" 
          rel="noopener noreferrer"
          style={{ 
            color: '#667eea', 
            textDecoration: 'none',
            fontWeight: 500,
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => e.target.style.textDecoration = 'underline'}
          onMouseLeave={(e) => e.target.style.textDecoration = 'none'}
        >
          {linkText}
        </a>
      </Box>
    );
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
          borderRadius: '12px 12px 0 0',
          background: 'white',
          border: '1px solid rgba(102, 126, 234, 0.15)',
          borderBottom: 'none',
          boxShadow: '0 4px 12px rgba(102, 126, 234, 0.1)',
          overflow: 'auto',
          maxHeight: 'calc(100vh - 330px)',
        }}
      >
        <Table sx={{ minWidth: 2400, borderCollapse: 'collapse' }}>
          <TableHead
            sx={{
              position: 'sticky',
              top: 0,
              zIndex: 10,
              '& .MuiTableCell-head': {
                borderBottom: 'none',
                borderRight: 'none',
              }
            }}
          >
            <TableRow 
              sx={{ 
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              }}
            >
              <TableCell sx={{ fontWeight: 700, color: 'white', fontSize: '0.85rem', minWidth: 80, background: 'transparent', border: 'none', paddingX: 2 }}>S.No</TableCell>
              <TableCell sx={{ fontWeight: 700, color: 'white', fontSize: '0.85rem', minWidth: 180, background: 'transparent', border: 'none', paddingX: 2 }}>Account Name</TableCell>
              <TableCell sx={{ fontWeight: 700, color: 'white', fontSize: '0.85rem', minWidth: 180, background: 'transparent', border: 'none', paddingX: 2 }}>Opportunity</TableCell>
              <TableCell sx={{ fontWeight: 700, color: 'white', fontSize: '0.85rem', minWidth: 150, background: 'transparent', border: 'none', paddingX: 2 }}>Region Location</TableCell>
              <TableCell sx={{ fontWeight: 700, color: 'white', fontSize: '0.85rem', minWidth: 120, background: 'transparent', border: 'none', paddingX: 2 }}>Region</TableCell>
              <TableCell sx={{ fontWeight: 700, color: 'white', fontSize: '0.85rem', minWidth: 120, background: 'transparent', border: 'none', paddingX: 2 }}>Sub Region</TableCell>
              <TableCell sx={{ fontWeight: 700, color: 'white', fontSize: '0.85rem', minWidth: 130, background: 'transparent', border: 'none', paddingX: 2 }}>Deal Value (USD)</TableCell>
              <TableCell sx={{ fontWeight: 700, color: 'white', fontSize: '0.85rem', minWidth: 200, background: 'transparent', border: 'none', paddingX: 2 }}>Scoping Doc</TableCell>
              <TableCell sx={{ fontWeight: 700, color: 'white', fontSize: '0.85rem', minWidth: 200, background: 'transparent', border: 'none', paddingX: 2 }}>Vector Link</TableCell>
              <TableCell sx={{ fontWeight: 700, color: 'white', fontSize: '0.85rem', minWidth: 130, background: 'transparent', border: 'none', paddingX: 2 }}>Charging on Vector</TableCell>
              <TableCell sx={{ fontWeight: 700, color: 'white', fontSize: '0.85rem', minWidth: 150, background: 'transparent', border: 'none', paddingX: 2 }}>Presales Period (Weeks)</TableCell>
              <TableCell sx={{ fontWeight: 700, color: 'white', fontSize: '0.85rem', minWidth: 120, background: 'transparent', border: 'none', paddingX: 2 }}>Status</TableCell>
              <TableCell sx={{ fontWeight: 700, color: 'white', fontSize: '0.85rem', minWidth: 150, background: 'transparent', border: 'none', paddingX: 2 }}>Assignee (GSD)</TableCell>
              <TableCell sx={{ fontWeight: 700, color: 'white', fontSize: '0.85rem', minWidth: 150, background: 'transparent', border: 'none', paddingX: 2 }}>Pursuit Lead</TableCell>
              <TableCell sx={{ fontWeight: 700, color: 'white', fontSize: '0.85rem', minWidth: 150, background: 'transparent', border: 'none', paddingX: 2 }}>Delivery Manager</TableCell>
              <TableCell sx={{ fontWeight: 700, color: 'white', fontSize: '0.85rem', minWidth: 140, background: 'transparent', border: 'none', paddingX: 2 }}>Presales Start Date</TableCell>
              <TableCell sx={{ fontWeight: 700, color: 'white', fontSize: '0.85rem', minWidth: 160, background: 'transparent', border: 'none', paddingX: 2 }}>Expected Planned Start</TableCell>
              <TableCell sx={{ fontWeight: 700, color: 'white', fontSize: '0.85rem', minWidth: 150, background: 'transparent', border: 'none', paddingX: 2 }}>SOW Signature Date</TableCell>
              <TableCell sx={{ fontWeight: 700, color: 'white', fontSize: '0.85rem', minWidth: 140, background: 'transparent', border: 'none', paddingX: 2 }}>Staffing Completed</TableCell>
              <TableCell sx={{ fontWeight: 700, color: 'white', fontSize: '0.85rem', minWidth: 120, background: 'transparent', border: 'none', paddingX: 2 }}>Staffing POC</TableCell>
              <TableCell sx={{ fontWeight: 700, color: 'white', fontSize: '0.85rem', minWidth: 250, background: 'transparent', border: 'none', paddingX: 2 }}>Remarks</TableCell>
              <TableCell 
                align="center" 
                sx={{ 
                  fontWeight: 700, 
                  color: 'white', 
                  fontSize: '0.85rem', 
                  minWidth: 120, 
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  position: 'sticky',
                  right: 0,
                  zIndex: 11,
                  border: 'none',
                  paddingX: 2,
                }}
              >
                Actions
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={22} align="center">
                  <Typography color="text.secondary" py={8} fontSize="1.1rem">
                    No opportunities found
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              paginatedData.map((opp, index) => {
                // Calculate S.No based on current page and index
                const serialNumber = page * rowsPerPage + index + 1;
                
                return (
                  <TableRow 
                    key={opp.id} 
                    sx={{
                      transition: 'all 0.2s ease',
                      background: index % 2 === 0 
                        ? 'rgba(248, 250, 252, 0.5)' 
                        : 'white',
                      '&:hover': {
                        background: 'rgba(102, 126, 234, 0.05)',
                        boxShadow: '0 2px 8px rgba(102, 126, 234, 0.1)',
                      },
                      '& .MuiTableCell-root': {
                        borderRight: 'none',
                        borderBottom: '1px solid rgba(224, 224, 224, 0.3)',
                      }
                    }}
                  >
                    <TableCell sx={{ fontWeight: 600, color: '#667eea', fontSize: '0.85rem' }}>{serialNumber}</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: '#1e293b', fontSize: '0.85rem' }}>{opp.account_name}</TableCell>
                    <TableCell sx={{ color: '#475569', fontSize: '0.85rem' }}>{opp.opportunity || '-'}</TableCell>
                    <TableCell sx={{ color: '#475569', fontSize: '0.85rem' }}>{opp.region_location || '-'}</TableCell>
                    <TableCell sx={{ color: '#475569', fontSize: '0.85rem' }}>{opp.region || '-'}</TableCell>
                    <TableCell sx={{ color: '#475569', fontSize: '0.85rem' }}>{opp.sub_region || '-'}</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: '#4ade80', fontSize: '0.85rem', minWidth: 130 }}>
                      <Box sx={{ 
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'flex-start',
                        minWidth: '120px'
                      }}>
                        {formatCurrency(opp.deal_value_usd)}
                      </Box>
                    </TableCell>
                    <TableCell sx={{ color: '#475569', fontSize: '0.85rem' }}>
                      {formatDocumentLink(opp.scoping_doc, opp)}
                    </TableCell>
                    <TableCell sx={{ color: '#475569', fontSize: '0.85rem' }}>
                      {formatVectorLink(opp.vector_link, opp)}
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center' }}>
                        <Chip
                          label={opp.charging_on_vector || 'N/A'}
                          size="small"
                          sx={{ 
                            fontWeight: 600,
                            background: `${getChargingColor(opp.charging_on_vector)}20`,
                            color: getChargingColor(opp.charging_on_vector),
                            border: `1.5px solid ${getChargingColor(opp.charging_on_vector)}`,
                            fontSize: '0.75rem',
                            width: '110px',
                            height: '26px',
                            '& .MuiChip-label': {
                              padding: '0 10px',
                              display: 'flex',
                              justifyContent: 'center',
                              alignItems: 'center',
                            }
                          }}
                        />
                      </Box>
                    </TableCell>
                    <TableCell sx={{ color: '#475569', fontSize: '0.85rem', paddingLeft: 2 }}>
                      <Box sx={{ 
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        minWidth: '100px'
                      }}>
                        {opp.period_of_presales_weeks || '-'}
                      </Box>
                    </TableCell>
                    <TableCell sx={{ paddingLeft: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center' }}>
                        <Chip
                          label={opp.status || 'N/A'}
                          size="small"
                          sx={{ 
                            fontWeight: 600,
                            background: `${getStatusColor(opp.status)}20`,
                            color: getStatusColor(opp.status),
                            border: `1.5px solid ${getStatusColor(opp.status)}`,
                            fontSize: '0.75rem',
                            width: '150px',
                            height: '26px',
                            '& .MuiChip-label': {
                              padding: '0 10px',
                              display: 'flex',
                              justifyContent: 'center',
                              alignItems: 'center',
                            }
                          }}
                        />
                      </Box>
                    </TableCell>
                    <TableCell sx={{ color: '#475569', fontSize: '0.85rem' }}>
                      {formatAssignees(opp.assignee_from_gsd)}
                    </TableCell>
                    <TableCell sx={{ color: '#475569', fontSize: '0.85rem' }}>{opp.pursuit_lead || '-'}</TableCell>
                    <TableCell sx={{ color: '#475569', fontSize: '0.85rem' }}>{opp.delivery_manager || '-'}</TableCell>
                    <TableCell sx={{ color: '#475569', fontSize: '0.85rem' }}>
                      {formatDate(opp.presales_start_date)}
                    </TableCell>
                    <TableCell sx={{ color: '#475569', fontSize: '0.85rem' }}>
                      {formatDate(opp.expected_planned_start)}
                    </TableCell>
                    <TableCell sx={{ color: '#475569', fontSize: '0.85rem' }}>
                      {formatDate(opp.sow_signature_date)}
                    </TableCell>
                    <TableCell sx={{ color: '#475569', fontSize: '0.85rem', fontWeight: 600 }}>
                      {formatBoolean(opp.staffing_completed_flag)}
                    </TableCell>
                    <TableCell sx={{ color: '#475569', fontSize: '0.85rem' }}>{opp.staffing_poc || '-'}</TableCell>
                    <TableCell sx={{ color: '#475569', fontSize: '0.85rem' }}>
                      {opp.remarks || '-'}
                    </TableCell>
                    <TableCell align="center" sx={{ position: 'sticky', right: 0, background: index % 2 === 0 ? 'rgba(248, 250, 252, 0.5)' : 'white', zIndex: 1 }}>
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
                              fontSize: '0.7rem',
                              color: 'text.secondary'
                            }}
                          >
                            View Only
                          </Typography>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Pagination - Outside TableContainer, completely static */}
      <Paper
        sx={{
          borderRadius: '0 0 12px 12px',
          borderTop: '1px solid rgba(102, 126, 234, 0.1)',
          background: 'white',
          border: '1px solid rgba(102, 126, 234, 0.15)',
          borderTop: 'none',
          boxShadow: '0 4px 12px rgba(102, 126, 234, 0.1)',
        }}
      >
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
            '& .MuiTablePagination-toolbar': {
              minHeight: '52px',
              paddingLeft: '16px',
              paddingRight: '16px',
            },
            '& .MuiTablePagination-selectLabel': {
              color: '#475569',
              fontWeight: 500,
              fontSize: '0.875rem',
              margin: 0,
            },
            '& .MuiTablePagination-displayedRows': {
              color: '#475569',
              fontWeight: 500,
              fontSize: '0.875rem',
              margin: 0,
            },
            '& .MuiTablePagination-select': {
              color: '#1e293b',
              fontWeight: 600,
              borderRadius: '8px',
              border: '1px solid rgba(102, 126, 234, 0.2)',
              paddingLeft: '8px',
              paddingRight: '32px !important',
              paddingTop: '4px',
              paddingBottom: '4px',
              '&:focus': {
                borderRadius: '8px',
                background: 'rgba(102, 126, 234, 0.05)',
              },
            },
            '& .MuiTablePagination-selectIcon': {
              color: '#667eea',
            },
            '& .MuiTablePagination-actions': {
              marginLeft: '20px',
            },
            '& .MuiIconButton-root': {
              color: '#667eea',
              border: '1px solid rgba(102, 126, 234, 0.2)',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              padding: 0,
              margin: '0 4px',
              transition: 'all 0.2s ease',
              '&:hover': {
                background: 'rgba(102, 126, 234, 0.1)',
                transform: 'scale(1.05)',
              },
              '&.Mui-disabled': {
                border: '1px solid rgba(102, 126, 234, 0.1)',
                color: '#cbd5e1',
              },
            },
          }}
        />
      </Paper>

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