import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import {
  Box, Grid, Paper, Typography, TextField, MenuItem,
  Button, Tab, Tabs, Chip,
} from '@mui/material';
import {
  AreaChart, Area, PieChart, Pie, Cell, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import BusinessIcon from '@mui/icons-material/Business';
import AssessmentIcon from '@mui/icons-material/Assessment';
import InsightsIcon from '@mui/icons-material/Insights';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PublicIcon from '@mui/icons-material/Public';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';

import {
  STATUS_OPTIONS, REGION_OPTIONS, getStatusColor,
} from '../../utils/constants';

// ─── Utilities ────────────────────────────────────────────────────────────────
const fmtCurrency = (v) => {
  if (!v && v !== 0) return '$0';
  if (v >= 1e6) return `$${(v / 1e6).toFixed(1)}M`;
  if (v >= 1e3) return `$${(v / 1e3).toFixed(0)}K`;
  return `$${v}`;
};

const daysSince = (dateStr) => {
  if (!dateStr) return null;
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
};

const formatDays = (dateStr) => {
  const d = daysSince(dateStr);
  return d === null ? 'Not provided' : `${d}d`;
};

const TERMINAL = ['Won', 'Lost', 'Not Required'];

const IC = {
  bg: '#f8fafc', surface: '#ffffff', card: '#ffffff', border: '#e2e8f0',
  a1: '#4285F4', a2: '#667eea', a3: '#FBBC04', a4: '#34A853', a5: '#EA4335',
  text: '#1e293b', muted: '#64748b',
};

const PIE_COLORS = [
  '#4285F4', '#34A853', '#EA4335', '#FBBC04', '#9C27B0',
  '#00BCD4', '#FF5722', '#795548', '#607D8B', '#E91E63',
];

// ─── Dynamic helpers derived from opportunities data ──────────────────────────

/**
 * Build a { region: [subRegion, ...] } map from the actual opportunities data.
 * Falls back to empty arrays for regions that have no data.
 */
const buildSubRegionByRegion = (opportunities) => {
  const map = {};
  opportunities.forEach(opp => {
    if (!opp.region || !opp.sub_region) return;
    if (!map[opp.region]) map[opp.region] = new Set();
    map[opp.region].add(opp.sub_region);
  });
  // Convert Sets to sorted arrays
  const result = {};
  Object.entries(map).forEach(([region, set]) => {
    result[region] = Array.from(set).sort();
  });
  return result;
};

/**
 * Returns all unique sub-regions across all data (optionally filtered by region).
 */
const getSubRegions = (subRegionByRegion, region = '') => {
  if (region) return subRegionByRegion[region] || [];
  return Object.values(subRegionByRegion).flat().sort();
};

// ═══════════════════════════════════════════════════════════════════════════════
// WORLD MAP TAB — D3 map, sub-region bubbles derived from data
// ═══════════════════════════════════════════════════════════════════════════════

// Static ISO mapping only used for map rendering (country fill + bubble placement).
// Sub-region ↔ region relationship comes purely from data.
const SUB_REGION_TO_ISO = {
  // JAPAC
  'India':         ['IND'],
  'GDC India':     ['IND'],
  'Japan':         ['JPN'],
  'Korea':         ['KOR'],
  'SEA':           ['SGP', 'MYS', 'THA', 'VNM', 'PHL', 'IDN'],
  'AUNZ':          ['AUS', 'NZL'],
  'Greater China': ['CHN'],
  // NORTHAM
  'US Retail':   ['USA'],
  'US West':     ['USA'],
  'US TME':      ['USA'],
  'US FS':       ['USA'],
  'US South':    ['USA'],
  'US HCLS':     ['USA'],
  'US North':    ['USA'],
  'US Central':  ['USA'],
  'US EAST':     ['USA'],
  'SAISV Alto':  ['USA'],
  'Canada':      ['CAN'],
  // EMEA
  'UKI':              ['GBR'],
  'DACH':             ['DEU', 'AUT', 'CHE'],
  'France':           ['FRA'],
  'Benelux':          ['BEL', 'NLD', 'LUX'],
  'Nordics':          ['SWE', 'NOR', 'DNK', 'FIN'],
  'Southern Europe':  ['ITA', 'ESP', 'PRT', 'GRC'],
  'MEA':              ['SAU', 'ARE', 'EGY'],
  'CEE':              ['POL', 'CZE', 'ROU', 'HUN'],
};

const REGION_COLORS = {
  NORTHAM: '#4285F4',
  EMEA:    '#34A853',
  JAPAC:   '#EA4335',
};

const buildCountryData = (opportunities) => {
  const map = {};
  opportunities.forEach(opp => {
    if (!opp.sub_region || !opp.region) return;
    const isos = SUB_REGION_TO_ISO[opp.sub_region];
    if (!isos) return;
    const key = opp.sub_region;
    if (!map[key]) map[key] = { isos, subRegion: key, count: 0, value: 0, region: opp.region };
    map[key].count += 1;
    map[key].value += opp.deal_value_usd || 0;
  });
  return map;
};

/**
 * For the "Countries / Territories Active" summary card we want to show
 * the number of distinct geographic territories that have deals.
 * For regions where many sub-regions share one ISO (e.g. all US sub-regions → USA)
 * we count distinct sub-regions instead, so filtering to "US South" shows 1, not 0.
 */
const countActiveTerritories = (countryData) => {
  // Group sub-regions by their primary ISO
  const isoSubRegions = {};
  Object.values(countryData).forEach(cd => {
    const iso = cd.isos[0];
    if (!isoSubRegions[iso]) isoSubRegions[iso] = new Set();
    isoSubRegions[iso].add(cd.subRegion);
  });
  // For ISOs with multiple sub-regions (e.g. USA), count each sub-region as a territory
  // For ISOs with a single sub-region, count as 1 country
  let total = 0;
  Object.values(isoSubRegions).forEach(subSet => {
    total += subSet.size; // each distinct sub-region = 1 territory
  });
  return total;
};

const WorldMapTab = ({ opportunities }) => {
  const svgRef  = useRef(null);
  const [tooltip, setTooltip]                 = useState(null);
  const [geoData, setGeoData]                 = useState(null);
  const [libsReady, setLibsReady]             = useState(false);
  const [loadError, setLoadError]             = useState(false);
  const [filterRegion, setFilterRegion]       = useState('');
  const [filterSubRegion, setFilterSubRegion] = useState('');

  // Build sub-region map from data
  const subRegionByRegion = useMemo(() => buildSubRegionByRegion(opportunities), [opportunities]);

  const availableSubRegions = useMemo(
    () => getSubRegions(subRegionByRegion, filterRegion),
    [subRegionByRegion, filterRegion]
  );

  // All regions present in the data
  const availableRegions = useMemo(() => Object.keys(subRegionByRegion).sort(), [subRegionByRegion]);

  const filtered = useMemo(() => {
    return opportunities.filter(o => {
      const matchRegion    = !filterRegion    || o.region     === filterRegion;
      const matchSubRegion = !filterSubRegion || o.sub_region === filterSubRegion;
      return matchRegion && matchSubRegion;
    });
  }, [opportunities, filterRegion, filterSubRegion]);

  const countryData = useMemo(() => buildCountryData(filtered), [filtered]);

  useEffect(() => {
    let cancelled = false;
    const loadScript = (src) => new Promise((res, rej) => {
      const existing = document.querySelector(`script[src="${src}"]`);
      if (existing) { res(); return; }
      const s = document.createElement('script');
      s.src = src; s.onload = res; s.onerror = rej;
      document.head.appendChild(s);
    });
    const run = async () => {
      try {
        if (!window.d3)       await loadScript('https://cdnjs.cloudflare.com/ajax/libs/d3/7.8.5/d3.min.js');
        if (!window.topojson) await loadScript('https://cdnjs.cloudflare.com/ajax/libs/topojson/3.0.2/topojson.min.js');
        const resp = await fetch('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json');
        const topo = await resp.json();
        if (!cancelled) { setGeoData(topo); setLibsReady(true); }
      } catch (err) {
        console.error('Map load error:', err);
        if (!cancelled) setLoadError(true);
      }
    };
    run();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!libsReady || !geoData || !svgRef.current || !window.d3 || !window.topojson) return;

    const d3       = window.d3;
    const topojson = window.topojson;
    const svg      = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const W = svgRef.current.clientWidth || 900;
    const H = 620;

    const numToAlpha3 = buildNumericToAlpha3();
    const countries = topojson.feature(geoData, geoData.objects.countries).features;

    const projection = d3.geoNaturalEarth1()
      .scale(W / 5.8)
      .translate([W / 2, H / 2.05]);
    const geoPath = d3.geoPath().projection(projection);

    svg.append('rect')
      .attr('width', W).attr('height', H)
      .attr('fill', '#e8f0f7')
      .attr('rx', 10);

    const graticule = d3.geoGraticule()();
    svg.append('path')
      .datum(graticule)
      .attr('d', geoPath)
      .attr('fill', 'none')
      .attr('stroke', '#c8d8e8')
      .attr('stroke-width', 0.4)
      .attr('opacity', 0.8);

    const g = svg.append('g');

    const isoToRegion = {};
    Object.values(countryData).forEach(cd => {
      cd.isos.forEach(iso => {
        if (!isoToRegion[iso]) isoToRegion[iso] = cd.region;
      });
    });

    g.selectAll('path.country')
      .data(countries)
      .enter()
      .append('path')
      .attr('class', 'country')
      .attr('d', geoPath)
      .attr('stroke', '#b8ccd8')
      .attr('stroke-width', 0.5)
      .attr('fill', d => {
        const alpha3 = numToAlpha3[d.id];
        const region = alpha3 ? isoToRegion[alpha3] : null;
        return region ? (REGION_COLORS[region] || '#667eea') : '#d0dce8';
      })
      .attr('opacity', d => {
        const alpha3 = numToAlpha3[d.id];
        return (alpha3 && isoToRegion[alpha3]) ? 0.85 : 0.7;
      })
      .on('mousemove', function(event, d) {
        const alpha3 = numToAlpha3[d.id];
        if (!alpha3 || !isoToRegion[alpha3]) { setTooltip(null); return; }
        // For countries with multiple sub-regions (e.g. USA), show the first one on hover;
      // individual bubbles below have their own hover handlers with correct sub-region data.
      const allCds = Object.values(countryData).filter(c => c.isos.includes(alpha3));
      if (!allCds.length) { setTooltip(null); return; }
      const rect = svgRef.current.getBoundingClientRect();
      setTooltip({ x: event.clientX - rect.left, y: event.clientY - rect.top, ...allCds[0] });
      })
      .on('mouseleave', () => setTooltip(null));

    // Group sub-regions by their primary ISO for bubble placement
    const isoGroups = {};
    Object.values(countryData).forEach(cd => {
      const primaryIso = cd.isos[0];
      if (!isoGroups[primaryIso]) isoGroups[primaryIso] = [];
      isoGroups[primaryIso].push(cd);
    });

    Object.entries(isoGroups).forEach(([primaryIso, entries]) => {
      const numId = Number(Object.entries(numToAlpha3).find(([, v]) => v === primaryIso)?.[0]);
      if (!numId) return;
      const feature = countries.find(f => f.id === numId);
      if (!feature) return;
      const centroid = geoPath.centroid(feature);
      if (!centroid || isNaN(centroid[0]) || isNaN(centroid[1])) return;

      const n = entries.length;
      // Fixed bubble radius — smaller when many share the same country
      const r = n === 1
        ? Math.max(11, 6 + Math.sqrt(entries[0].count) * 5)
        : Math.max(9, 5 + Math.sqrt(entries[0].count) * 3);

      entries.forEach((cd, idx) => {
        const color = REGION_COLORS[cd.region] || '#667eea';

        let cx, cy;
        if (n === 1) {
          cx = centroid[0];
          cy = centroid[1];
        } else {
          // Grid layout — keeps all bubbles within the country bounding box
          const cols     = Math.ceil(Math.sqrt(n));
          const col      = idx % cols;
          const row      = Math.floor(idx / cols);
          const totalCols = Math.min(n, cols);
          const totalRows = Math.ceil(n / cols);
          const spacing  = r * 2 + 3;
          cx = centroid[0] + (col - (totalCols - 1) / 2) * spacing;
          cy = centroid[1] + (row - (totalRows - 1) / 2) * spacing;
        }

        // Glow ring
        g.append('circle')
          .attr('cx', cx).attr('cy', cy).attr('r', r + 3)
          .attr('fill', 'none').attr('stroke', color).attr('stroke-width', 1)
          .attr('opacity', 0.3);

        // Main bubble
        g.append('circle')
          .attr('cx', cx).attr('cy', cy).attr('r', r)
          .attr('fill', color).attr('stroke', '#fff').attr('stroke-width', 1.5)
          .attr('opacity', 0.95).style('cursor', 'pointer')
          .on('mousemove', function(event) {
            const rect = svgRef.current.getBoundingClientRect();
            setTooltip({ x: event.clientX - rect.left, y: event.clientY - rect.top, ...cd });
          })
          .on('mouseleave', () => setTooltip(null));

        // Label: deal count for single; abbreviated sub-region name + count for multi
        if (n === 1) {
          g.append('text')
            .attr('x', cx).attr('y', cy + 1)
            .attr('text-anchor', 'middle').attr('dominant-baseline', 'middle')
            .attr('font-size', r > 13 ? 9 : 7).attr('font-weight', '800')
            .attr('fill', 'white').attr('pointer-events', 'none')
            .text(cd.count);
        } else {
          // Short label: strip "US " prefix and take first 3 chars, e.g. "Sou", "Wes"
          const short = cd.subRegion.replace(/^US /, '').substring(0, 3);
          g.append('text')
            .attr('x', cx).attr('y', cy - 2)
            .attr('text-anchor', 'middle').attr('dominant-baseline', 'middle')
            .attr('font-size', Math.max(5.5, r * 0.55)).attr('font-weight', '800')
            .attr('fill', 'white').attr('pointer-events', 'none')
            .text(short);
          g.append('text')
            .attr('x', cx).attr('y', cy + 5.5)
            .attr('text-anchor', 'middle').attr('dominant-baseline', 'middle')
            .attr('font-size', Math.max(5, r * 0.5)).attr('font-weight', '700')
            .attr('fill', 'rgba(255,255,255,0.9)').attr('pointer-events', 'none')
            .text(cd.count);
        }
      });
    });

    svg.call(
      d3.zoom().scaleExtent([1, 8])
        .on('zoom', (event) => g.attr('transform', event.transform))
    );

  }, [libsReady, geoData, countryData]);

  const totalDeals = filtered.length;
  const totalValue = filtered.reduce((s, o) => s + (o.deal_value_usd || 0), 0);

  // Count active territories directly from filtered data — not from countryData
  // (countryData only includes sub_regions that have a SUB_REGION_TO_ISO entry, so
  //  unknown sub_region strings would cause countryData to be empty and show 0)
  const countriesWithDeals = useMemo(() => {
    return new Set(filtered.map(o => o.sub_region).filter(Boolean)).size;
  }, [filtered]);

  const MAP_HEIGHT = 620;

  return (
    <Box>
      {/* Header */}
      <Paper sx={{ p: 2.5, mb: 3, borderRadius: 3, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
        <Box display="flex" gap={2} alignItems="center" flexWrap="wrap">
          <Typography variant="h6" fontWeight="600" color="#1e293b">Global Deal Distribution</Typography>
          <TextField select label="Filter Region" value={filterRegion}
            onChange={e => { setFilterRegion(e.target.value); setFilterSubRegion(''); }} sx={{ minWidth: 150 }} size="small">
            <MenuItem value="">All Regions</MenuItem>
            {availableRegions.map(r => <MenuItem key={r} value={r}>{r}</MenuItem>)}
          </TextField>
          <TextField select label="Sub-Region" value={filterSubRegion}
            onChange={e => setFilterSubRegion(e.target.value)} sx={{ minWidth: 165 }} size="small">
            <MenuItem value="">All Sub-Regions</MenuItem>
            {availableSubRegions.map(sr => <MenuItem key={sr} value={sr}>{sr}</MenuItem>)}
          </TextField>
          {(filterRegion || filterSubRegion) && (
            <Button size="small" onClick={() => { setFilterRegion(''); setFilterSubRegion(''); }}
              sx={{ color: '#EA4335', borderColor: '#EA4335' }} variant="outlined">
              Clear
            </Button>
          )}
          {/* Legend — dynamically use region colors from data */}
          <Box sx={{ display: 'flex', gap: 2, ml: 'auto', flexWrap: 'wrap' }}>
            {availableRegions.map(r => (
              <Box key={r} sx={{ display: 'flex', alignItems: 'center', gap: 0.6 }}>
                <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: REGION_COLORS[r] || '#667eea' }} />
                <Typography variant="caption" fontWeight={600} color="#475569">{r}</Typography>
              </Box>
            ))}
          </Box>
        </Box>
      </Paper>

      {/* Summary Cards */}
      <Grid container spacing={2} mb={3}>
        {[
          { label: 'Total Deals', value: totalDeals, color: '#4285F4' },
          { label: 'Total Pipeline', value: fmtCurrency(totalValue), color: '#34A853' },
          { label: 'Territories Active', value: countriesWithDeals, color: '#EA4335' },
        ].map(c => (
          <Grid item xs={12} sm={4} key={c.label}>
            <Paper sx={{ p: 2.5, borderRadius: 3, borderTop: `4px solid ${c.color}`, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
              <Typography variant="body2" color="#64748b" fontWeight={500}>{c.label}</Typography>
              <Typography variant="h4" fontWeight={700} color="#1e293b">{c.value}</Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>

      {/* Map */}
      <Paper sx={{ p: 2, mb: 3, borderRadius: 3, boxShadow: '0 2px 8px rgba(0,0,0,0.08)', position: 'relative', overflow: 'hidden', background: '#ffffff' }}>
        <Typography variant="caption" sx={{ color: '#64748b', display: 'block', mb: 1, px: 1 }}>
          Scroll to zoom · Drag to pan · Hover for sub-region details
        </Typography>
        {!libsReady && !loadError && (
          <Box sx={{ height: MAP_HEIGHT, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 2 }}>
            <Typography color="#1e293b" fontSize={16}>Loading world map…</Typography>
            <Typography color="#64748b" fontSize={12}>Fetching map data from CDN</Typography>
          </Box>
        )}
        {loadError && (
          <Box sx={{ height: MAP_HEIGHT, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Typography color="#EA4335">Failed to load map. Check network access to cdn.jsdelivr.net</Typography>
          </Box>
        )}
        <svg
          ref={svgRef}
          style={{
            width: '100%', height: libsReady ? MAP_HEIGHT : 0,
            display: 'block', borderRadius: 8,
          }}
        />
        {/* Tooltip */}
        {tooltip && (() => {
          const regionColor = REGION_COLORS[tooltip.region] || '#667eea';
          return (
            <Box sx={{
              position: 'absolute',
              left: Math.min(tooltip.x + 14, 680),
              top: Math.max(tooltip.y - 80, 50),
              bgcolor: '#ffffff',
              border: `2px solid ${regionColor}`,
              borderRadius: 2, px: 2.5, py: 1.8,
              boxShadow: `0 6px 24px rgba(0,0,0,0.18), 0 0 0 4px ${regionColor}20`,
              pointerEvents: 'none', zIndex: 20, minWidth: 210,
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.8 }}>
                <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: regionColor, flexShrink: 0 }} />
                <Typography variant="body2" fontWeight={700} color="#1e293b">
                  {tooltip.subRegion}
                </Typography>
              </Box>
              <Typography variant="caption" sx={{ color: '#64748b' }} display="block">
                Region: <strong style={{ color: regionColor }}>{tooltip.region}</strong>
              </Typography>
              <Box sx={{ display: 'flex', gap: 3, mt: 0.8 }}>
                <Box>
                  <Typography variant="caption" color="#94a3b8" display="block">Deals</Typography>
                  <Typography variant="body2" fontWeight={800} sx={{ color: regionColor }}>{tooltip.count}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="#94a3b8" display="block">Value</Typography>
                  <Typography variant="body2" fontWeight={800} color="#34A853">{fmtCurrency(tooltip.value)}</Typography>
                </Box>
              </Box>
            </Box>
          );
        })()}
      </Paper>

      {/* Sub-Region Breakdown Table — built dynamically from data */}
      {(() => {
        // All sub-regions from filtered data, grouped by region
        const rows = [];
        Object.entries(subRegionByRegion).forEach(([region, subRegions]) => {
          subRegions.forEach(sr => {
            const deals = filtered.filter(o => o.sub_region === sr && o.region === region);
            if (deals.length === 0) return;
            rows.push({
              region, subRegion: sr,
              count: deals.length,
              value: deals.reduce((s, d) => s + (d.deal_value_usd || 0), 0),
            });
          });
        });
        rows.sort((a, b) => b.count - a.count);

        if (rows.length === 0) return null;

        return (
          <Paper sx={{ p: 3, borderRadius: 3, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
            <Typography variant="h6" fontWeight="600" color="#1e293b" mb={2}>
              Sub-Region Breakdown
            </Typography>
            <Box sx={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr>
                    {['Region', 'Sub-Region', 'Deals', 'Pipeline Value', 'Share'].map(h => (
                      <th key={h} style={{ textAlign: 'left', padding: '8px 12px', color: '#64748b', fontWeight: 600, fontSize: 11, letterSpacing: '0.8px', textTransform: 'uppercase', borderBottom: '2px solid #e2e8f0', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, i) => {
                    const color = REGION_COLORS[row.region] || '#667eea';
                    const pct = totalDeals > 0 ? Math.round((row.count / totalDeals) * 100) : 0;
                    return (
                      <tr key={`${row.region}-${row.subRegion}`} style={{ background: i % 2 === 0 ? '#f8fafc' : 'white' }}>
                        <td style={{ padding: '10px 12px', fontWeight: 600 }}>
                          <span style={{ background: `${color}18`, color, border: `1px solid ${color}40`, borderRadius: 6, padding: '2px 8px', fontSize: 11, fontWeight: 700 }}>{row.region}</span>
                        </td>
                        <td style={{ padding: '10px 12px', color: '#1e293b', fontWeight: 600 }}>{row.subRegion}</td>
                        <td style={{ padding: '10px 12px', color, fontWeight: 800, fontSize: 15 }}>{row.count}</td>
                        <td style={{ padding: '10px 12px', color: '#34A853', fontWeight: 700 }}>{fmtCurrency(row.value)}</td>
                        <td style={{ padding: '10px 12px', minWidth: 140 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Box sx={{ flex: 1, height: 6, borderRadius: 1, bgcolor: '#e2e8f0', overflow: 'hidden' }}>
                              <Box sx={{ width: `${pct}%`, height: '100%', bgcolor: color, borderRadius: 1 }} />
                            </Box>
                            <Typography variant="caption" color="#94a3b8" sx={{ minWidth: 28 }}>{pct}%</Typography>
                          </Box>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </Box>
          </Paper>
        );
      })()}
    </Box>
  );
};

function buildNumericToAlpha3() {
  return {
    840: 'USA',  124: 'CAN',  484: 'MEX',
    826: 'GBR',  276: 'DEU',  250: 'FRA',  380: 'ITA',
    724: 'ESP',  528: 'NLD',   56: 'BEL',  752: 'SWE',
    578: 'NOR',  208: 'DNK',  246: 'FIN',  616: 'POL',
    203: 'CZE',   40: 'AUT',  756: 'CHE',  620: 'PRT',
    300: 'GRC',  642: 'ROU',  348: 'HUN',  100: 'BGR',
    191: 'HRV',  703: 'SVK',  705: 'SVN',  233: 'EST',
    428: 'LVA',  440: 'LTU',  372: 'IRL',  442: 'LUX',
    682: 'SAU',  784: 'ARE',  634: 'QAT',   48: 'BHR',
    400: 'JOR',  818: 'EGY',  504: 'MAR',  566: 'NGA',
     24: 'AGO',  710: 'ZAF',  404: 'KEN',  800: 'UGA',
    356: 'IND',  392: 'JPN',  410: 'KOR',  156: 'CHN',
    158: 'TWN',   36: 'AUS',  554: 'NZL',  702: 'SGP',
    458: 'MYS',  360: 'IDN',  764: 'THA',  704: 'VNM',
    608: 'PHL',   50: 'BGD',  586: 'PAK',  144: 'LKA',
    792: 'TUR',   76: 'BRA',   32: 'ARG',  152: 'CHL',
    170: 'COL',
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB 1 — OVERVIEW
// ═══════════════════════════════════════════════════════════════════════════════

const InlineMetricCard = ({ title, value, icon, color }) => (
  <Paper sx={{
    p: 3, display: 'flex', alignItems: 'center', gap: 2.5,
    borderRadius: 3, background: 'white', borderTop: `4px solid ${color}`,
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)', transition: 'all 0.2s ease', height: '100%',
    '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 4px 16px rgba(0,0,0,0.12)' },
  }}>
    <Box sx={{ bgcolor: `${color}15`, color, p: 2, borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: 60, minHeight: 60 }}>
      {icon}
    </Box>
    <Box flex={1}>
      <Typography variant="body2" color="#64748b" fontWeight="500" gutterBottom sx={{ fontSize: '0.875rem' }}>
        {title}
      </Typography>
      <Typography variant="h4" fontWeight="700" sx={{ color: '#1e293b', fontSize: { xs: '1.5rem', sm: '1.75rem' } }}>
        {value}
      </Typography>
    </Box>
  </Paper>
);

const WinRateRing = ({ percentage, wonCount, total }) => {
  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;
  const color = percentage >= 60 ? '#34A853' : percentage >= 30 ? '#FBBC04' : '#EA4335';
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <Box sx={{ position: 'relative', display: 'inline-flex' }}>
        <svg width="160" height="160">
          <circle cx="80" cy="80" r={radius} fill="none" stroke="#f1f5f9" strokeWidth="12" />
          <circle cx="80" cy="80" r={radius} fill="none" stroke={color} strokeWidth="12"
            strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round"
            transform="rotate(-90 80 80)" style={{ transition: 'stroke-dashoffset 0.6s ease' }} />
        </svg>
        <Box sx={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <Typography variant="h3" fontWeight="600" color={color}>{percentage}%</Typography>
          <Typography variant="caption" color="#64748b" fontWeight="500">Win Rate</Typography>
        </Box>
      </Box>
      <Typography variant="body2" color="#64748b" mt={1.5} textAlign="center">
        {wonCount} won of {total} total
      </Typography>
    </Box>
  );
};

const PieTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const item = payload[0];
    const realCount = item.payload.displayValue !== undefined ? item.payload.displayValue : item.value;
    return (
      <Paper sx={{ p: 1.5, boxShadow: 3, borderRadius: 2, border: '1px solid #e2e8f0' }}>
        <Typography variant="body2" fontWeight="700" color="#1e293b">{item.name}</Typography>
        <Typography variant="body2" sx={{ color: item.payload.fill }}>
          Count: {realCount}{realCount === 0 ? ' (no deals)' : ''}
        </Typography>
      </Paper>
    );
  }
  return null;
};

const OverviewTab = ({ opportunities }) => {
  const [statusFilter, setStatusFilter]       = useState('');
  const [regionFilter, setRegionFilter]       = useState('');
  const [subRegionFilter, setSubRegionFilter] = useState('');
  const [selectedRegion, setSelectedRegion]   = useState('');

  // Build sub-region map dynamically from data
  const subRegionByRegion = useMemo(() => buildSubRegionByRegion(opportunities), [opportunities]);

  const availableRegions = useMemo(() => Object.keys(subRegionByRegion).sort(), [subRegionByRegion]);

  const availableSubRegions = useMemo(
    () => getSubRegions(subRegionByRegion, regionFilter),
    [subRegionByRegion, regionFilter]
  );

  const filtered = opportunities.filter(opp => {
    const matchesStatus    = !statusFilter    || opp.status     === statusFilter;
    const matchesRegion    = !regionFilter    || opp.region     === regionFilter;
    const matchesSubRegion = !subRegionFilter || opp.sub_region === subRegionFilter;
    return matchesStatus && matchesRegion && matchesSubRegion;
  });

  const totalDealValue = filtered.reduce((s, o) => s + (o.deal_value_usd || 0), 0);
  const wonCount       = filtered.filter(o => o.status === 'Won').length;
  const avgDealValue   = filtered.length > 0 ? totalDealValue / filtered.length : 0;
  const winRatePct     = filtered.length > 0 ? Math.round((wonCount / filtered.length) * 100) : 0;

  const monthlyData = filtered.reduce((acc, opp) => {
    const d = opp.presales_start_date || opp.expected_planned_start || new Date().toISOString();
    const month = new Date(d).toLocaleDateString('en-US', { month: 'short' });
    if (!acc[month]) acc[month] = { month, count: 0, value: 0 };
    acc[month].count += 1; acc[month].value += opp.deal_value_usd || 0;
    return acc;
  }, {});
  const trendData = Object.values(monthlyData).slice(0, 7);

  // Region pie — only show regions that exist in data
  const regionPieData = availableRegions.map((r, i) => ({
    name: r,
    value: filtered.filter(o => o.region === r).length,
    displayValue: filtered.filter(o => o.region === r).length,
    fill: PIE_COLORS[i % PIE_COLORS.length],
  }));
  const regionPieDataAll = regionPieData.map(r => ({ ...r, value: r.value === 0 ? 0.01 : r.value }));

  const activeRegionForSub = selectedRegion || regionFilter;
  const subRegionPieData = useMemo(() => {
    if (activeRegionForSub) {
      const keys = subRegionByRegion[activeRegionForSub] || [];
      return keys.map((sr, i) => ({
        name: sr,
        value: filtered.filter(o => o.region === activeRegionForSub && o.sub_region === sr).length,
        fill: PIE_COLORS[(i + 3) % PIE_COLORS.length],
      })).filter(s => s.value > 0);
    }
    // All sub-regions from all regions in the data
    const allSubs = Object.entries(subRegionByRegion).flatMap(([region, subs]) =>
      subs.map((sr, i) => ({
        name: sr,
        value: filtered.filter(o => o.sub_region === sr && o.region === region).length,
        fill: PIE_COLORS[i % PIE_COLORS.length],
      }))
    ).filter(s => s.value > 0);
    return allSubs;
  }, [activeRegionForSub, filtered, subRegionByRegion]);

  const statusChartData = STATUS_OPTIONS.map(s => ({
    name: s.label,
    value: filtered.filter(o => o.status === s.value).length,
  })).filter(s => s.value > 0);

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <Paper sx={{ p: 2, boxShadow: 3, borderRadius: 2, border: '1px solid #e2e8f0' }}>
          <Typography variant="body2" fontWeight="600" mb={0.5} color="#1e293b">{label}</Typography>
          {payload.map((e, i) => (
            <Typography key={i} variant="body2" sx={{ color: e.color }}>
              {e.name}: {typeof e.value === 'number' && e.value > 1000 ? fmtCurrency(e.value) : e.value}
            </Typography>
          ))}
        </Paper>
      );
    }
    return null;
  };

  const renderPieLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, value, displayValue }) => {
    const realValue = displayValue !== undefined ? displayValue : value;
    if (!realValue) return null;
    const R = Math.PI / 180;
    const r = innerRadius + (outerRadius - innerRadius) * 0.55;
    const x = cx + r * Math.cos(-midAngle * R);
    const y = cy + r * Math.sin(-midAngle * R);
    return (
      <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central"
        fontSize={11} fontWeight={700}>{realValue}</text>
    );
  };

  const handleRegionPieClick = (data) => {
    if (!data || !data.name) return;
    if (data.displayValue === 0) return;
    setSelectedRegion(prev => prev === data.name ? '' : data.name);
  };

  return (
    <Box>
      {/* Filters */}
      <Paper sx={{ p: 2.5, mb: 3, borderRadius: 3, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
        <Box display="flex" gap={2} alignItems="center" flexWrap="wrap">
          <Typography variant="h6" fontWeight="600" color="#1e293b">Filter Analytics</Typography>
          <TextField select label="Status" value={statusFilter} onChange={e => setStatusFilter(e.target.value)} sx={{ minWidth: 200 }} size="small">
            <MenuItem value="">All Statuses</MenuItem>
            {STATUS_OPTIONS.map(s => <MenuItem key={s.value} value={s.value}>{s.label}</MenuItem>)}
          </TextField>
          <TextField select label="Region" value={regionFilter}
            onChange={e => { setRegionFilter(e.target.value); setSelectedRegion(''); setSubRegionFilter(''); }}
            sx={{ minWidth: 150 }} size="small">
            <MenuItem value="">All Regions</MenuItem>
            {availableRegions.map(r => <MenuItem key={r} value={r}>{r}</MenuItem>)}
          </TextField>
          <TextField select label="Sub-Region" value={subRegionFilter}
            onChange={e => setSubRegionFilter(e.target.value)} sx={{ minWidth: 170 }} size="small">
            <MenuItem value="">All Sub-Regions</MenuItem>
            {availableSubRegions.map(sr => <MenuItem key={sr} value={sr}>{sr}</MenuItem>)}
          </TextField>
          {(statusFilter || regionFilter || subRegionFilter) && (
            <Button variant="outlined" size="small"
              onClick={() => { setStatusFilter(''); setRegionFilter(''); setSubRegionFilter(''); setSelectedRegion(''); }}
              sx={{ ml: 'auto', color: '#64748b', borderColor: '#e2e8f0' }}>
              Clear Filters
            </Button>
          )}
        </Box>
      </Paper>

      {/* Metric Cards */}
      <Grid container spacing={3} mb={3}>
        {[
          { title: 'Total Opportunities', value: filtered.length, icon: <BusinessIcon sx={{ fontSize: 28 }} />, color: '#4285F4' },
          { title: 'Total Deal Value',    value: fmtCurrency(totalDealValue), icon: <AttachMoneyIcon sx={{ fontSize: 28 }} />, color: '#34A853' },
          { title: 'Won Deals',           value: wonCount, icon: <EmojiEventsIcon sx={{ fontSize: 28 }} />, color: '#FBBC04' },
          { title: 'Avg Deal Value',      value: fmtCurrency(avgDealValue), icon: <AssessmentIcon sx={{ fontSize: 28 }} />, color: '#EA4335' },
        ].map(card => (
          <Grid item xs={12} sm={6} md={3} key={card.title}>
            <InlineMetricCard {...card} />
          </Grid>
        ))}
      </Grid>

      {/* Trend + Win Rate */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} lg={8}>
          <Paper sx={{ p: 3, borderRadius: 3, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
            <Typography variant="h6" gutterBottom fontWeight="600" color="#1e293b" mb={3}>Deal Value Trends</Typography>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4285F4" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#4285F4" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#34A853" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#34A853" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" stroke="#64748b" style={{ fontSize: '12px' }} />
                <YAxis stroke="#64748b" style={{ fontSize: '12px' }} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="value" stroke="#4285F4" strokeWidth={2} fill="url(#colorValue)" name="Deal Value" />
                <Area type="monotone" dataKey="count" stroke="#34A853" strokeWidth={2} fill="url(#colorCount)" name="Count" />
              </AreaChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
        <Grid item xs={12} lg={4}>
          <Paper sx={{ p: 3, borderRadius: 3, boxShadow: '0 2px 8px rgba(0,0,0,0.08)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
            <Typography variant="h6" gutterBottom fontWeight="600" color="#1e293b" mb={2}>Win Rate</Typography>
            <WinRateRing percentage={winRatePct} wonCount={wonCount} total={filtered.length} />
          </Paper>
        </Grid>
      </Grid>

      {/* Won Deals Meter */}
      {(() => {
        const won    = filtered.filter(o => o.status === 'Won').length;
        const lost   = filtered.filter(o => o.status === 'Lost').length;
        const active = filtered.filter(o => !TERMINAL.includes(o.status)).length;
        const notReq = filtered.filter(o => o.status === 'Not Required').length;
        const total  = filtered.length || 1;
        const segments = [
          { label: 'Won',          count: won,    pct: Math.round((won    / total) * 100), color: '#34A853' },
          { label: 'Active',       count: active, pct: Math.round((active / total) * 100), color: '#4285F4' },
          { label: 'Lost',         count: lost,   pct: Math.round((lost   / total) * 100), color: '#EA4335' },
          { label: 'Not Required', count: notReq, pct: Math.round((notReq / total) * 100), color: '#94a3b8' },
        ];
        return (
          <Paper sx={{ p: 3, mb: 3, borderRadius: 3, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
            <Typography variant="h6" fontWeight="600" color="#1e293b" mb={2.5}>Won Deals Meter</Typography>
            <Box sx={{ display: 'flex', height: 28, borderRadius: 2, overflow: 'hidden', mb: 3 }}>
              {segments.filter(s => s.pct > 0).map(s => (
                <Box key={s.label} sx={{
                  width: `${s.pct}%`, bgcolor: s.color, transition: 'width 0.5s ease',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }} title={`${s.label}: ${s.pct}%`}>
                  {s.pct >= 7 && (
                    <Typography sx={{ fontSize: 10, fontWeight: 700, color: 'white', userSelect: 'none' }}>{s.pct}%</Typography>
                  )}
                </Box>
              ))}
            </Box>
            <Grid container spacing={2}>
              {segments.map(s => (
                <Grid item xs={6} sm={3} key={s.label}>
                  <Box sx={{ p: 2, borderRadius: 2, border: `1.5px solid ${s.color}30`, background: `${s.color}08`, textAlign: 'center' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.8, mb: 0.5 }}>
                      <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: s.color, flexShrink: 0 }} />
                      <Typography variant="caption" color="#64748b" fontWeight={600}>{s.label}</Typography>
                    </Box>
                    <Typography variant="h5" fontWeight={800} sx={{ color: s.color, lineHeight: 1.1 }}>{s.count}</Typography>
                    <Typography variant="caption" color="#94a3b8">{s.pct}%</Typography>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </Paper>
        );
      })()}

      {/* Pie Charts */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} lg={6}>
          <Paper sx={{ p: 3, borderRadius: 3, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
              <Typography variant="h6" fontWeight="600" color="#1e293b">Regional Distribution</Typography>
              {selectedRegion && (
                <Chip label={`${selectedRegion} selected`} size="small" onDelete={() => setSelectedRegion('')}
                  sx={{ background: '#667eea22', color: '#667eea', fontWeight: 600, fontSize: 11 }} />
              )}
            </Box>
            <Typography variant="caption" color="#64748b" display="block" mb={1}>
              Click a slice to filter sub-regions →
            </Typography>
            {regionPieDataAll.every(r => r.displayValue === 0) ? (
              <Box sx={{ height: 260, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Typography color="text.secondary">No data</Typography>
              </Box>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={regionPieDataAll} cx="50%" cy="50%" outerRadius={95}
                    dataKey="value" nameKey="name" labelLine={false}
                    label={renderPieLabel}
                    onClick={(data) => handleRegionPieClick(data)}
                    style={{ cursor: 'pointer' }}
                  >
                    {regionPieDataAll.map((entry, i) => (
                      <Cell
                        key={i} fill={entry.fill}
                        opacity={selectedRegion && selectedRegion !== entry.name ? 0.4 : 1}
                        stroke={selectedRegion === entry.name ? '#fff' : 'none'}
                        strokeWidth={selectedRegion === entry.name ? 3 : 0}
                      />
                    ))}
                  </Pie>
                  <Tooltip content={<PieTooltip />} />
                  <Legend formatter={v => <span style={{ fontSize: 12, color: '#475569' }}>{v}</span>} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </Paper>
        </Grid>

        <Grid item xs={12} lg={6}>
          <Paper sx={{ p: 3, borderRadius: 3, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
              <Typography variant="h6" fontWeight="600" color="#1e293b">Sub-Region Distribution</Typography>
            </Box>
            <Typography variant="caption" color="#64748b" display="block" mb={1}>
              {activeRegionForSub
                ? `Filtered to ${activeRegionForSub} · click region slice to change`
                : 'All sub-regions · click a region slice to drill down'}
            </Typography>
            {subRegionPieData.length === 0 ? (
              <Box sx={{ height: 260, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 1 }}>
                <Typography color="text.secondary" fontSize={13}>No sub-region data available</Typography>
              </Box>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={subRegionPieData} cx="50%" cy="50%" outerRadius={95}
                    dataKey="value" nameKey="name" labelLine={false}
                    label={renderPieLabel}
                  >
                    {subRegionPieData.map((entry, i) => (
                      <Cell key={i} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip content={<PieTooltip />} />
                  <Legend formatter={v => <span style={{ fontSize: 12, color: '#475569' }}>{v}</span>} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Status Breakdown */}
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Paper sx={{ p: 3, borderRadius: 3, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
            <Typography variant="h6" gutterBottom fontWeight="600" color="#1e293b" mb={2}>Status Breakdown</Typography>
            {statusChartData.length === 0 ? (
              <Box sx={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Typography color="text.secondary">No data</Typography>
              </Box>
            ) : (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
                <Box sx={{ flex: '0 0 280px' }}>
                  <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                      <Pie
                        data={statusChartData} cx="50%" cy="50%"
                        innerRadius={72} outerRadius={115}
                        dataKey="value" nameKey="name" labelLine={false}
                        label={({ cx, cy, midAngle, innerRadius, outerRadius, value }) => {
                          if (!value) return null;
                          const R = Math.PI / 180;
                          const r = innerRadius + (outerRadius - innerRadius) * 0.5;
                          const x = cx + r * Math.cos(-midAngle * R);
                          const y = cy + r * Math.sin(-midAngle * R);
                          return (
                            <text x={x} y={y} fill="white" textAnchor="middle"
                              dominantBaseline="central" fontSize={11} fontWeight={700}>
                              {value}
                            </text>
                          );
                        }}
                      >
                        {statusChartData.map((entry, i) => {
                          const opt = STATUS_OPTIONS.find(s => s.label === entry.name);
                          return <Cell key={i} fill={opt ? opt.color : PIE_COLORS[i % PIE_COLORS.length]} />;
                        })}
                      </Pie>
                      <Tooltip content={<PieTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                </Box>
                <Box sx={{ flex: 1, minWidth: 200 }}>
                  {statusChartData.map((entry, i) => {
                    const opt   = STATUS_OPTIONS.find(s => s.label === entry.name);
                    const color = opt ? opt.color : PIE_COLORS[i % PIE_COLORS.length];
                    const pct   = Math.round((entry.value / (filtered.length || 1)) * 100);
                    return (
                      <Box key={entry.name} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.2 }}>
                        <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: color, flexShrink: 0 }} />
                        <Typography variant="body2" color="#475569" sx={{ flex: 1, fontSize: '0.82rem' }}>{entry.name}</Typography>
                        <Typography variant="body2" fontWeight={700} color="#1e293b" sx={{ minWidth: 28, textAlign: 'right' }}>{entry.value}</Typography>
                        <Box sx={{ width: 80, height: 6, borderRadius: 1, bgcolor: '#f1f5f9', overflow: 'hidden' }}>
                          <Box sx={{ width: `${pct}%`, height: '100%', bgcolor: color, borderRadius: 1 }} />
                        </Box>
                        <Typography variant="caption" color="#94a3b8" sx={{ minWidth: 32, textAlign: 'right' }}>{pct}%</Typography>
                      </Box>
                    );
                  })}
                </Box>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// TAB 2 — PERFORMANCE INTELLIGENCE
// ═══════════════════════════════════════════════════════════════════════════════

const iCardStyle = (extra = {}) => ({
  background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 14,
  padding: '22px 24px', position: 'relative', overflow: 'hidden',
  color: '#1e293b', fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
  boxShadow: '0 2px 8px rgba(0,0,0,0.08)', ...extra,
});
const MiniBar = ({ pct, color }) => (
  <div style={{ background: '#e2e8f0', borderRadius: 4, height: 5, overflow: 'hidden', marginTop: 5 }}>
    <div style={{ width: `${Math.min(pct, 100)}%`, background: color, height: '100%', borderRadius: 4, transition: 'width 0.4s ease' }} />
  </div>
);
const IBadge = ({ label, color }) => (
  <span style={{ background: `${color}22`, color, border: `1px solid ${color}44`, borderRadius: 8, padding: '2px 9px', fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap' }}>
    {label}
  </span>
);
const GlowOrb = ({ color, size = 80, top = -20, right = -20 }) => (
  <div style={{ position: 'absolute', width: size, height: size, borderRadius: '50%', background: `radial-gradient(circle, ${color}30 0%, transparent 70%)`, top, right, pointerEvents: 'none' }} />
);
const ICardTitle = ({ children }) => (
  <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', color: '#64748b', marginBottom: 16 }}>{children}</div>
);
const BigNum = ({ value, color, label }) => (
  <div style={{ marginRight: 32, marginBottom: 8 }}>
    <div style={{ fontSize: 36, fontWeight: 800, color, lineHeight: 1 }}>{value}</div>
    <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>{label}</div>
  </div>
);

const OpenDealsWidget = ({ data }) => {
  const active = data.filter(d => !TERMINAL.includes(d.status));
  const totalValue = active.reduce((s, d) => s + (d.deal_value_usd || 0), 0);
  const nonTerminalStatuses = STATUS_OPTIONS.filter(s => !TERMINAL.includes(s.value));
  const buckets = nonTerminalStatuses.map(s => ({
    label: s.label, count: data.filter(d => d.status === s.value).length, color: s.color,
  })).filter(b => b.count > 0);
  const maxCount = Math.max(...buckets.map(b => b.count), 1);
  return (
    <div style={iCardStyle({ gridColumn: 'span 2' })}>
      <GlowOrb color={IC.a1} size={140} top={-40} right={-40} />
      <ICardTitle>Open Deals Pipeline</ICardTitle>
      <div style={{ display: 'flex', flexWrap: 'wrap', marginBottom: 24 }}>
        <BigNum value={active.length} color={IC.a1} label="Active Opportunities" />
        <BigNum value={fmtCurrency(totalValue)} color={IC.a4} label="Pipeline Value" />
        <BigNum value={active.length > 0 ? fmtCurrency(totalValue / active.length) : '$0'} color={IC.a3} label="Avg Deal Size" />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 10 }}>
        {buckets.map(b => (
          <div key={b.label} style={{ background: `${b.color}0d`, border: `1px solid ${b.color}25`, borderRadius: 10, padding: '12px 14px' }}>
            <div style={{ fontSize: 11, color: '#64748b', marginBottom: 3 }}>{b.label}</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: b.color }}>{b.count}</div>
            <MiniBar pct={(b.count / maxCount) * 100} color={b.color} />
          </div>
        ))}
      </div>
    </div>
  );
};

const StalledWidget = ({ data }) => {
  const stalled = data
    .filter(d => !TERMINAL.includes(d.status) && daysSince(d.presales_start_date) !== null && daysSince(d.presales_start_date) > 30)
    .sort((a, b) => (daysSince(b.presales_start_date) || 0) - (daysSince(a.presales_start_date) || 0));
  const urgency = (days) => {
    if (days > 90) return { label: 'Critical', color: IC.a5 };
    if (days > 60) return { label: 'High', color: IC.a3 };
    return { label: 'Watch', color: '#60a5fa' };
  };
  const td = { padding: '10px 12px', borderBottom: '1px solid #e2e8f020', fontSize: 13, color: '#1e293b' };
  return (
    <div style={iCardStyle({ gridColumn: 'span 2' })}>
      <GlowOrb color={IC.a5} size={120} top={-30} right={-30} />
      <ICardTitle>Stalled Deals — No Movement &gt; 30 Days</ICardTitle>
      <div style={{ display: 'flex', flexWrap: 'wrap', marginBottom: 20 }}>
        <BigNum value={stalled.length} color={IC.a5} label="Need Attention" />
        <BigNum value={fmtCurrency(stalled.reduce((s, d) => s + (d.deal_value_usd || 0), 0))} color={IC.a3} label="Value at Risk" />
      </div>
      {stalled.length === 0 ? (
        <div style={{ textAlign: 'center', color: IC.a4, padding: 24, fontSize: 14 }}>✅ All active deals started within the last 30 days</div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead><tr>
              {['Account', 'Opportunity', 'Region', 'Primary POC (GSD)', 'Status', 'Deal Value', 'Days Open', 'Risk'].map(h => (
                <th key={h} style={{ textAlign: 'left', padding: '8px 12px', color: '#64748b', fontWeight: 600, fontSize: 11, letterSpacing: '0.8px', textTransform: 'uppercase', borderBottom: '1px solid #e2e8f0' }}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {stalled.slice(0, 8).map(d => {
                const days = daysSince(d.presales_start_date);
                const u = urgency(days);
                return (
                  <tr key={d.id}>
                    <td style={{ ...td, fontWeight: 600 }}>{d.account_name}</td>
                    <td style={{ ...td, color: '#64748b' }}>{d.opportunity || '—'}</td>
                    <td style={td}><IBadge label={d.region || '—'} color="#60a5fa" /></td>
                    <td style={td}>{d['Primary POC from GSD'] || '—'}</td>
                    <td style={td}><IBadge label={d.status || 'N/A'} color={getStatusColor(d.status)} /></td>
                    <td style={{ ...td, color: IC.a4, fontWeight: 700 }}>{fmtCurrency(d.deal_value_usd)}</td>
                    <td style={{ ...td, color: u.color, fontWeight: 700 }}>{formatDays(d.presales_start_date)}</td>
                    <td style={td}><IBadge label={u.label} color={u.color} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {stalled.length > 8 && (
            <div style={{ fontSize: 12, color: '#64748b', marginTop: 10, textAlign: 'center' }}>+{stalled.length - 8} more stalled deals</div>
          )}
        </div>
      )}
    </div>
  );
};
const PresalesROIWidget = ({ data }) => {
  // Dynamically derive regions from data
  const regions = useMemo(() => [...new Set(data.map(d => d.region).filter(Boolean))].sort(), [data]);

  const byRegion = regions.map(region => {
    const all = data.filter(d => d.region === region);
    const won = all.filter(d => d.status === 'Won');
    const totalWeeks = all.reduce((s, d) => s + (d.period_of_presales_weeks || 0), 0);
    const wonValue = won.reduce((s, d) => s + (d.deal_value_usd || 0), 0);
    const totalValue = all.reduce((s, d) => s + (d.deal_value_usd || 0), 0);
    const roi = totalWeeks > 0 ? wonValue / totalWeeks : 0;
    const winRate = all.length > 0 ? (won.length / all.length) * 100 : 0;
    return { region, total: all.length, won: won.length, totalWeeks, wonValue, totalValue, roi, winRate };
  }).filter(r => r.total > 0);

  const maxRoi = Math.max(...byRegion.map(r => r.roi), 1);
  const totalWeeks = byRegion.reduce((s, r) => s + r.totalWeeks, 0);
  const totalWon = byRegion.reduce((s, r) => s + r.wonValue, 0);
  const roiColor = (roi) => { const p = roi / maxRoi; return p > 0.65 ? IC.a4 : p > 0.35 ? IC.a3 : IC.a5; };
  return (
    <div style={iCardStyle({ gridColumn: 'span 2' })}>
      <GlowOrb color={IC.a3} size={140} top={-40} right={-40} />
      <ICardTitle>Presales Effort vs Deals Won — ROI by Region</ICardTitle>
      <div style={{ display: 'flex', flexWrap: 'wrap', marginBottom: 24 }}>
        <BigNum value={`${totalWeeks}wk`} color={IC.a3} label="Total Presales Weeks" />
        <BigNum value={fmtCurrency(totalWon)} color={IC.a4} label="Total Won Value" />
        <BigNum value={totalWeeks > 0 ? fmtCurrency(totalWon / totalWeeks) : '$0'} color={IC.a1} label="Overall Rev / Week" />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
        {byRegion.map(r => {
          const color = roiColor(r.roi);
          return (
            <div key={r.region} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: '16px 18px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                <span style={{ fontWeight: 800, fontSize: 15 }}>{r.region}</span>
                <IBadge label={`${Math.round(r.winRate)}% WR`} color={color} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
                <div><div style={{ fontSize: 11, color: '#64748b' }}>Deals</div>
                  <div style={{ fontSize: 16, fontWeight: 700 }}>{r.total} <span style={{ fontSize: 11, color: IC.a4 }}>({r.won} won)</span></div></div>
                <div><div style={{ fontSize: 11, color: '#64748b' }}>Presales Wks</div>
                  <div style={{ fontSize: 16, fontWeight: 700 }}>{r.totalWeeks}</div></div>
                <div><div style={{ fontSize: 11, color: '#64748b' }}>Pipeline</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: IC.a1 }}>{fmtCurrency(r.totalValue)}</div></div>
                <div><div style={{ fontSize: 11, color: '#64748b' }}>Won</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: IC.a4 }}>{fmtCurrency(r.wonValue)}</div></div>
              </div>
              <div style={{ fontSize: 11, color: '#64748b', marginBottom: 4 }}>
                ROI: <span style={{ color, fontWeight: 700, fontSize: 13 }}>{fmtCurrency(r.roi)}/week</span>
              </div>
              <MiniBar pct={(r.roi / maxRoi) * 100} color={color} />
            </div>
          );
        })}
      </div>
    </div>
  );
};

const WonDealsWidget = ({ data }) => {
  const won    = data.filter(d => d.status === 'Won').length;
  const lost   = data.filter(d => d.status === 'Lost').length;
  const active = data.filter(d => !TERMINAL.includes(d.status)).length;
  const notReq = data.filter(d => d.status === 'Not Required').length;
  const total  = data.length || 1;
  const wonValue  = data.filter(d => d.status === 'Won').reduce((s, d) => s + (d.deal_value_usd || 0), 0);
  const lostValue = data.filter(d => d.status === 'Lost').reduce((s, d) => s + (d.deal_value_usd || 0), 0);
  const segments = [
    { label: 'Won',          count: won,    pct: Math.round((won    / total) * 100), color: IC.a4 },
    { label: 'Active',       count: active, pct: Math.round((active / total) * 100), color: IC.a1 },
    { label: 'Lost',         count: lost,   pct: Math.round((lost   / total) * 100), color: IC.a5 },
    { label: 'Not Required', count: notReq, pct: Math.round((notReq / total) * 100), color: '#94a3b8' },
  ];
  return (
    <div style={iCardStyle({ gridColumn: 'span 2' })}>
      <GlowOrb color={IC.a4} size={140} top={-40} right={-40} />
      <ICardTitle>Won Deals Meter</ICardTitle>
      <div style={{ display: 'flex', flexWrap: 'wrap', marginBottom: 20 }}>
        <BigNum value={won} color={IC.a4} label="Deals Won" />
        <BigNum value={fmtCurrency(wonValue)} color={IC.a4} label="Won Value" />
        <BigNum value={lost} color={IC.a5} label="Deals Lost" />
        <BigNum value={fmtCurrency(lostValue)} color={IC.a5} label="Lost Value" />
      </div>
      <div style={{ display: 'flex', height: 28, borderRadius: 8, overflow: 'hidden', marginBottom: 20 }}>
        {segments.filter(s => s.pct > 0).map(s => (
          <div key={s.label} title={`${s.label}: ${s.pct}%`}
            style={{ width: `${s.pct}%`, background: s.color, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'width 0.5s ease' }}>
            {s.pct >= 7 && <span style={{ fontSize: 10, fontWeight: 700, color: 'white' }}>{s.pct}%</span>}
          </div>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
        {segments.map(s => (
          <div key={s.label} style={{ background: `${s.color}0d`, border: `1.5px solid ${s.color}30`, borderRadius: 12, padding: '14px 16px', textAlign: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 6 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: s.color }} />
              <span style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>{s.label}</span>
            </div>
            <div style={{ fontSize: 28, fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.count}</div>
            <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>{s.pct}% of total</div>
          </div>
        ))}
      </div>
    </div>
  );
};

const IntelligenceTab = ({ opportunities }) => {
  const [regionFilter, setRegionFilter]       = useState('');
  const [subRegionFilter, setSubRegionFilter] = useState('');

  // Build sub-region map dynamically from data
  const subRegionByRegion = useMemo(() => buildSubRegionByRegion(opportunities), [opportunities]);
  const availableRegions  = useMemo(() => Object.keys(subRegionByRegion).sort(), [subRegionByRegion]);
  const availableSubRegions = useMemo(
    () => getSubRegions(subRegionByRegion, regionFilter),
    [subRegionByRegion, regionFilter]
  );

  const filtered = useMemo(
    () => opportunities.filter(d => {
      const matchesRegion    = !regionFilter    || d.region     === regionFilter;
      const matchesSubRegion = !subRegionFilter || d.sub_region === subRegionFilter;
      return matchesRegion && matchesSubRegion;
    }),
    [opportunities, regionFilter, subRegionFilter]
  );

  const stalledCount = filtered.filter(d =>
    !TERMINAL.includes(d.status) && daysSince(d.presales_start_date) !== null && daysSince(d.presales_start_date) > 30
  ).length;

  return (
    <Box sx={{ background: '#f8fafc', borderRadius: 3, p: 0, minHeight: '70vh' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography sx={{ fontSize: 11, fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: '#64748b' }}>Performance Intelligence</Typography>
          <Typography sx={{ fontSize: 20, fontWeight: 800, color: '#1e293b', mt: 0.5 }}>{filtered.length} Opportunities Analysed</Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', flexWrap: 'wrap' }}>
          {stalledCount > 0 && (
            <Chip label={`${stalledCount} Stalled`} size="small"
              sx={{ background: `${IC.a5}22`, color: IC.a5, border: `1px solid ${IC.a5}44`, fontWeight: 700, fontSize: 11 }} />
          )}
          <select value={regionFilter} onChange={e => { setRegionFilter(e.target.value); setSubRegionFilter(''); }}
            style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 10, color: '#1e293b', padding: '7px 14px', fontSize: 13, outline: 'none', cursor: 'pointer' }}>
            <option value="">All Regions</option>
            {availableRegions.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
          <select value={subRegionFilter} onChange={e => setSubRegionFilter(e.target.value)}
            style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 10, color: '#1e293b', padding: '7px 14px', fontSize: 13, outline: 'none', cursor: 'pointer' }}>
            <option value="">All Sub-Regions</option>
            {availableSubRegions.map(sr => <option key={sr} value={sr}>{sr}</option>)}
          </select>
          {(regionFilter || subRegionFilter) && (
            <button onClick={() => { setRegionFilter(''); setSubRegionFilter(''); }}
              style={{ background: '#EA433510', color: '#EA4335', border: '1px solid #EA433530', borderRadius: 10, padding: '7px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
              ✕ Clear
            </button>
          )}
        </Box>
      </Box>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
        <OpenDealsWidget data={filtered} />
        <WonDealsWidget data={filtered} />
        <StalledWidget data={filtered} />
        <PresalesROIWidget data={filtered} />
      </div>
    </Box>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// ROOT — UnifiedDashboard
// ═══════════════════════════════════════════════════════════════════════════════
const UnifiedDashboard = ({ opportunities = [] }) => {
  const [activeTab, setActiveTab] = useState(0);
  const openCount = opportunities.filter(o => !TERMINAL.includes(o.status)).length;
  const stalledCount = opportunities.filter(o =>
    !TERMINAL.includes(o.status) && daysSince(o.presales_start_date) !== null && daysSince(o.presales_start_date) > 30
  ).length;

  return (
    <Box sx={{ background: '#f8fafc', minHeight: '100vh', p: { xs: 2, md: 3 } }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h5" fontWeight="800" sx={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', letterSpacing: '-0.5px',
          }}>
            Presales Analytics
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {opportunities.length} total opportunities · {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Chip label={`${openCount} Active`} size="small"
            sx={{ background: '#4285F420', color: '#4285F4', fontWeight: 700, border: '1px solid #4285F440', fontSize: 12 }} />
          {stalledCount > 0 && (
            <Chip label={`${stalledCount} Stalled`} size="small"
              sx={{ background: '#EA433520', color: '#EA4335', fontWeight: 700, border: '1px solid #EA433540', fontSize: 12 }} />
          )}
        </Box>
      </Box>

      <Paper sx={{ borderRadius: 3, mb: 3, boxShadow: '0 2px 8px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
        <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)}
          sx={{
            '& .MuiTab-root': { fontWeight: 600, fontSize: '0.875rem', textTransform: 'none', minHeight: 52, px: 3 },
            '& .Mui-selected': { color: '#667eea' },
            '& .MuiTabs-indicator': { background: 'linear-gradient(90deg, #667eea, #764ba2)', height: 3, borderRadius: 2 },
          }}>
          <Tab icon={<DashboardIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="Overview" />
          <Tab icon={<InsightsIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="Performance Intelligence" />
          <Tab icon={<PublicIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="Global Trends" />
        </Tabs>
      </Paper>

      {activeTab === 0 && <OverviewTab opportunities={opportunities} />}
      {activeTab === 1 && <IntelligenceTab opportunities={opportunities} />}
      {activeTab === 2 && <WorldMapTab opportunities={opportunities} />}
    </Box>
  );
};

export default UnifiedDashboard;