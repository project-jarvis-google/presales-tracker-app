import React, { useState } from 'react';
import {
  Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  IconButton, Chip, Box, Typography, TablePagination,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import DescriptionIcon from '@mui/icons-material/Description';
import LinkIcon from '@mui/icons-material/Link';
import FilterBar from './FilterBar';
import OpportunityForm from './OpportunityForm';
import { getStatusColor, getChargingColor } from '../../utils/constants';

const dbVal = (row, dbKey, jsKey) =>
  row[dbKey] !== undefined ? row[dbKey] : (jsKey ? row[jsKey] : undefined);

const OpportunitiesTable = ({ opportunities, onAdd, onEdit, onDelete, userRole }) => {
  // Added subRegion to initial filter state
  const [filters, setFilters] = useState({ search: '', status: '', region: '', subRegion: '' });
  const [formOpen, setFormOpen] = useState(false);
  const [editingOpportunity, setEditingOpportunity] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const statuses = [...new Set(opportunities.map(o => o.status).filter(Boolean))];
  const regions  = [...new Set(opportunities.map(o => o.region).filter(Boolean))];

  const filteredData = opportunities.filter(opp => {
    const matchesSearch    = !filters.search    ||
      Object.values(opp).some(v => String(v).toLowerCase().includes(filters.search.toLowerCase()));
    const matchesStatus    = !filters.status    || opp.status     === filters.status;
    const matchesRegion    = !filters.region    || opp.region     === filters.region;
    // New sub-region filter
    const matchesSubRegion = !filters.subRegion || opp.sub_region === filters.subRegion;
    return matchesSearch && matchesStatus && matchesRegion && matchesSubRegion;
  });

  const paginatedData = filteredData.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  const handleAddNew = () => {
    if (userRole === 'presales_viewer') { alert('Viewers cannot add opportunities'); return; }
    setEditingOpportunity(null); setFormOpen(true);
  };
  const handleEdit = (opp) => {
    if (userRole === 'presales_viewer') { alert('Viewers cannot edit opportunities'); return; }
    setEditingOpportunity(opp); setFormOpen(true);
  };
  const handleFormSubmit = async (data) => {
    if (editingOpportunity) await onEdit(editingOpportunity.id, data);
    else await onAdd(data);
    setFormOpen(false); setEditingOpportunity(null);
  };
  const handleDelete = (id) => {
    if (userRole !== 'presales_admin') { alert('Only admins can delete opportunities'); return; }
    if (window.confirm('Delete this opportunity?')) onDelete(id);
  };

  const fmtCurrency = (v) => {
    if (!v) return '-';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(v);
  };
  const fmtDate = (s) => {
    if (!s) return '-';
    return new Date(s).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };
  const fmtNames = (str) => {
    if (!str) return '-';
    const names = String(str).split(',').map(n => n.trim()).filter(Boolean);
    return names.length === 0 ? '-' : (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.3 }}>
        {names.map((n, i) => <Typography key={i} sx={{ fontSize: '0.82rem', color: '#475569', lineHeight: 1.3 }}>{n}</Typography>)}
      </Box>
    );
  };
  const fmtLink = (url, opp, Icon) => {
    if (!url) return '-';
    const text = opp.opportunity || opp.account_name || 'View';
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
        <Icon sx={{ fontSize: 15, color: '#667eea' }} />
        <a href={url} target="_blank" rel="noopener noreferrer"
          style={{ color: '#667eea', textDecoration: 'none', fontWeight: 500, fontSize: '0.82rem' }}
          onMouseEnter={e => e.target.style.textDecoration = 'underline'}
          onMouseLeave={e => e.target.style.textDecoration = 'none'}>
          {text}
        </a>
      </Box>
    );
  };

  const H = ({ children, w = 140 }) => (
    <TableCell sx={{ fontWeight: 700, color: 'white', fontSize: '0.82rem', minWidth: w, background: 'transparent', border: 'none', px: 2, whiteSpace: 'nowrap' }}>
      {children}
    </TableCell>
  );
  const C = ({ children, sx = {} }) => (
    <TableCell sx={{ color: '#475569', fontSize: '0.82rem', px: 2, ...sx }}>{children}</TableCell>
  );

  return (
    <Box>
      <FilterBar filters={filters} onFilterChange={setFilters} onAddNew={handleAddNew} statuses={statuses} regions={regions} />

      <TableContainer component={Paper} sx={{
        borderRadius: '12px 12px 0 0', background: 'white',
        border: '1px solid rgba(102,126,234,0.15)', borderBottom: 'none',
        boxShadow: '0 4px 12px rgba(102,126,234,0.1)',
        overflow: 'auto', maxHeight: 'calc(100vh - 330px)',
      }}>
        <Table sx={{ minWidth: 3000, borderCollapse: 'collapse' }}>
          <TableHead sx={{ position: 'sticky', top: 0, zIndex: 10, '& .MuiTableCell-head': { borderBottom: 'none', borderRight: 'none' } }}>
            <TableRow sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
              <H w={70}>S.No</H>
              <H w={180}>Account Name</H>
              <H w={180}>Opportunity</H>
              <H w={140}>Region Location</H>
              <H w={110}>Region</H>
              <H w={130}>Sub Region</H>
              <H w={140}>Deal Value (USD)</H>
              <H w={200}>Estimation / Pricing Sheet</H>
              <H w={180}>Scoping Doc</H>
              <H w={180}>Supporting Docs</H>
              <H w={180}>Vector Link</H>
              <H w={130}>Charging on Vector</H>
              <H w={160}>Presales Period (Wks)</H>
              <H w={160}>Status</H>
              <H w={190}>Primary POC from GSD</H>
              <H w={190}>Supporting Team</H>
              <H w={150}>Pursuit Lead</H>
              <H w={160}>Delivery Manager</H>
              <H w={155}>Presales Start Date</H>
              <H w={170}>Expected Planned Start</H>
              <H w={155}>SOW Signature Date</H>
              <H w={150}>Staffing Completed</H>
              <H w={130}>Staffing POC</H>
              <H w={240}>Remarks</H>
              <TableCell align="center" sx={{
                fontWeight: 700, color: 'white', fontSize: '0.82rem', minWidth: 110,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                position: 'sticky', right: 0, zIndex: 11, border: 'none', px: 2,
              }}>Actions</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {paginatedData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={25} align="center">
                  <Typography color="text.secondary" py={8} fontSize="1.1rem">No opportunities found</Typography>
                </TableCell>
              </TableRow>
            ) : paginatedData.map((opp, idx) => {
              const sn = page * rowsPerPage + idx + 1;
              const bg = idx % 2 === 0 ? 'rgba(248,250,252,0.6)' : 'white';

              const primaryPoc     = dbVal(opp, 'Primary POC from GSD', 'primary_poc_from_gsd');
              const supportingTeam = dbVal(opp, 'supporting team', 'supporting_team');
              const estSheet       = dbVal(opp, 'Estimation/pricing sheet', 'estimation_pricing_sheet');
              const suppDocs       = dbVal(opp, 'supporting docs', 'supporting_docs');

              return (
                <TableRow key={opp.id} sx={{
                  background: bg, transition: 'all 0.15s ease',
                  '&:hover': { background: 'rgba(102,126,234,0.05)' },
                  '& .MuiTableCell-root': { borderRight: 'none', borderBottom: '1px solid rgba(224,224,224,0.3)' },
                }}>
                  <C sx={{ fontWeight: 700, color: '#667eea' }}>{sn}</C>
                  <C sx={{ fontWeight: 600, color: '#1e293b' }}>{opp.account_name}</C>
                  <C>{opp.opportunity || '-'}</C>
                  <C>{opp.region_location || '-'}</C>
                  <C>{opp.region || '-'}</C>
                  <C>{opp.sub_region || '-'}</C>
                  <TableCell sx={{ fontWeight: 600, color: '#4ade80', fontSize: '0.82rem', px: 2 }}>
                    {fmtCurrency(opp.deal_value_usd)}
                  </TableCell>
                  <C>{fmtLink(estSheet, opp, DescriptionIcon)}</C>
                  <C>{fmtLink(opp.scoping_doc, opp, DescriptionIcon)}</C>
                  <C>{fmtLink(suppDocs, opp, DescriptionIcon)}</C>
                  <C>{fmtLink(opp.vector_link, opp, LinkIcon)}</C>
                  <TableCell sx={{ px: 2 }}>
                    <Chip label={opp.charging_on_vector || 'N/A'} size="small" sx={{
                      fontWeight: 600, fontSize: '0.72rem', width: 110, height: 24,
                      background: `${getChargingColor(opp.charging_on_vector)}20`,
                      color: getChargingColor(opp.charging_on_vector),
                      border: `1.5px solid ${getChargingColor(opp.charging_on_vector)}`,
                      '& .MuiChip-label': { px: '8px' },
                    }} />
                  </TableCell>
                  <C sx={{ textAlign: 'center' }}>{opp.period_of_presales_weeks || '-'}</C>
                  <TableCell sx={{ px: 2 }}>
                    <Chip label={opp.status || 'N/A'} size="small" sx={{
                      fontWeight: 600, fontSize: '0.72rem', width: 150, height: 24,
                      background: `${getStatusColor(opp.status)}20`,
                      color: getStatusColor(opp.status),
                      border: `1.5px solid ${getStatusColor(opp.status)}`,
                      '& .MuiChip-label': { px: '8px' },
                    }} />
                  </TableCell>
                  <C>{fmtNames(primaryPoc)}</C>
                  <C>{fmtNames(supportingTeam)}</C>
                  <C>{opp.pursuit_lead || '-'}</C>
                  <C>{opp.delivery_manager || '-'}</C>
                  <C>{fmtDate(opp.presales_start_date)}</C>
                  <C>{fmtDate(opp.expected_planned_start)}</C>
                  <C>{fmtDate(opp.sow_signature_date)}</C>
                  <C sx={{ fontWeight: 600 }}>{opp.staffing_completed_flag ? 'Yes' : 'No'}</C>
                  <C>{opp.staffing_poc || '-'}</C>
                  <C>{opp.remarks || '-'}</C>
                  <TableCell align="center" sx={{ position: 'sticky', right: 0, background: bg, zIndex: 1 }}>
                    <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                      {(userRole === 'presales_admin' || userRole === 'presales_creator') && (
                        <IconButton size="small" onClick={() => handleEdit(opp)} sx={{
                          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                          color: 'white', width: 30, height: 30,
                          '&:hover': { transform: 'scale(1.1)', boxShadow: '0 4px 12px rgba(102,126,234,0.4)' },
                        }}>
                          <EditIcon sx={{ fontSize: 16 }} />
                        </IconButton>
                      )}
                      {userRole === 'presales_admin' && (
                        <IconButton size="small" onClick={() => handleDelete(opp.id)} sx={{
                          background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                          color: 'white', width: 30, height: 30,
                          '&:hover': { transform: 'scale(1.1)', boxShadow: '0 4px 12px rgba(239,68,68,0.4)' },
                        }}>
                          <DeleteIcon sx={{ fontSize: 16 }} />
                        </IconButton>
                      )}
                      {userRole === 'presales_viewer' && (
                        <Typography variant="caption" sx={{ fontStyle: 'italic', fontSize: '0.68rem', color: 'text.secondary' }}>
                          View Only
                        </Typography>
                      )}
                    </Box>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      <Paper sx={{
        borderRadius: '0 0 12px 12px', background: 'white',
        border: '1px solid rgba(102,126,234,0.15)', borderTop: 'none',
        boxShadow: '0 4px 12px rgba(102,126,234,0.1)',
      }}>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]} component="div"
          count={filteredData.length} rowsPerPage={rowsPerPage} page={page}
          onPageChange={(_, p) => setPage(p)}
          onRowsPerPageChange={e => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
          sx={{
            '& .MuiTablePagination-toolbar': { minHeight: 52, px: 2 },
            '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': { color: '#475569', fontWeight: 500, m: 0 },
            '& .MuiTablePagination-select': { color: '#1e293b', fontWeight: 600, borderRadius: '8px', border: '1px solid rgba(102,126,234,0.2)', pl: 1, pr: '32px !important', py: '4px' },
            '& .MuiTablePagination-selectIcon': { color: '#667eea' },
            '& .MuiIconButton-root': { color: '#667eea', border: '1px solid rgba(102,126,234,0.2)', borderRadius: '50%', width: 32, height: 32, p: 0, m: '0 4px', '&:hover': { background: 'rgba(102,126,234,0.1)' }, '&.Mui-disabled': { border: '1px solid rgba(102,126,234,0.1)', color: '#cbd5e1' } },
          }}
        />
      </Paper>

      <OpportunityForm
        open={formOpen} onClose={() => setFormOpen(false)}
        onSubmit={handleFormSubmit} initialData={editingOpportunity}
      />
    </Box>
  );
};

export default OpportunitiesTable;