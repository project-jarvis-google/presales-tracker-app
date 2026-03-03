import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Button, Grid, MenuItem, FormControlLabel, Checkbox, Alert,
} from '@mui/material';
import {
  STATUS_OPTIONS, REGION_OPTIONS, SUB_REGION_BY_REGION, CHARGING_OPTIONS,
} from '../../utils/constants';

// ── JS key  →  exact DB column name mapping ──────────────────────────────────
// Used when sending data to the API. The API receives these as JSON keys and
// maps them to DB columns via models.py / crud.py.
//
// DB columns with spaces / special chars:
//   "Primary POC from GSD"   → js key: primary_poc_from_gsd
//   "supporting team"        → js key: supporting_team
//   "Estimation/pricing sheet" → js key: estimation_pricing_sheet
//   "supporting docs"        → js key: supporting_docs

const EMPTY_FORM = {
  account_name: '',
  opportunity: '',
  region_location: '',
  region: '',
  sub_region: '',
  deal_value_usd: '',
  estimation_pricing_sheet: '',   // DB: "Estimation/pricing sheet"
  scoping_doc: '',
  supporting_docs: '',            // DB: "supporting docs"
  vector_link: '',
  charging_on_vector: '',
  period_of_presales_weeks: '',
  status: '',
  primary_poc_from_gsd: '',       // DB: "Primary POC from GSD"
  supporting_team: '',            // DB: "supporting team"
  pursuit_lead: '',
  delivery_manager: '',
  presales_start_date: '',
  expected_planned_start: '',
  sow_signature_date: '',
  staffing_completed_flag: false,
  staffing_poc: '',
  remarks: '',
};

const OpportunityForm = ({ open, onClose, onSubmit, initialData = null }) => {
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [validationMessage, setValidationMessage] = useState('');

  // Sub-regions filtered by selected region
  const availableSubRegions = formData.region
    ? (SUB_REGION_BY_REGION[formData.region] || [])
    : [];

  useEffect(() => {
    if (initialData) {
      setFormData({
        account_name:             initialData.account_name ?? '',
        opportunity:              initialData.opportunity ?? '',
        region_location:          initialData.region_location ?? '',
        region:                   initialData.region ?? '',
        sub_region:               initialData.sub_region ?? '',
        deal_value_usd:           initialData.deal_value_usd ?? '',
        // DB col names with spaces come back from API with those exact keys
        estimation_pricing_sheet: initialData['Estimation/pricing sheet'] ?? initialData.estimation_pricing_sheet ?? '',
        scoping_doc:              initialData.scoping_doc ?? '',
        supporting_docs:          initialData['supporting docs'] ?? initialData.supporting_docs ?? '',
        vector_link:              initialData.vector_link ?? '',
        charging_on_vector:       initialData.charging_on_vector ?? '',
        period_of_presales_weeks: initialData.period_of_presales_weeks ?? '',
        status:                   initialData.status ?? '',
        primary_poc_from_gsd:     initialData['Primary POC from GSD'] ?? initialData.primary_poc_from_gsd ?? '',
        supporting_team:          initialData['supporting team'] ?? initialData.supporting_team ?? '',
        pursuit_lead:             initialData.pursuit_lead ?? '',
        delivery_manager:         initialData.delivery_manager ?? '',
        presales_start_date:      initialData.presales_start_date ?? '',
        expected_planned_start:   initialData.expected_planned_start ?? '',
        sow_signature_date:       initialData.sow_signature_date ?? '',
        staffing_completed_flag:  initialData.staffing_completed_flag ?? false,
        staffing_poc:             initialData.staffing_poc ?? '',
        remarks:                  initialData.remarks ?? '',
      });
    } else {
      setFormData(EMPTY_FORM);
    }
    setErrors({});
    setValidationMessage('');
  }, [initialData, open]);

  const validateField = (name, value) => {
    const newErrors = { ...errors };
    switch (name) {
      case 'account_name':
        if (!value || !value.trim()) newErrors.account_name = 'Account name is required';
        else delete newErrors.account_name;
        break;
      case 'deal_value_usd':
        if (value && isNaN(value)) newErrors.deal_value_usd = 'Enter a valid number';
        else if (value && parseFloat(value) < 0) newErrors.deal_value_usd = 'Cannot be negative';
        else delete newErrors.deal_value_usd;
        break;
      case 'period_of_presales_weeks':
        if (value && isNaN(value)) newErrors.period_of_presales_weeks = 'Enter a valid number';
        else if (value && parseInt(value) < 0) newErrors.period_of_presales_weeks = 'Cannot be negative';
        else if (value && !Number.isInteger(parseFloat(value))) newErrors.period_of_presales_weeks = 'Whole numbers only';
        else delete newErrors.period_of_presales_weeks;
        break;
      case 'vector_link':
        if (value && value.trim() && !isValidURL(value)) newErrors.vector_link = 'Enter a valid URL';
        else delete newErrors.vector_link;
        break;
      default: break;
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isValidURL = (s) => { try { new URL(s); return true; } catch (_) { return false; } };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : value;

    if (name === 'region') {
      const validSubs = SUB_REGION_BY_REGION[value] || [];
      setFormData({
        ...formData,
        region: newValue,
        sub_region: validSubs.includes(formData.sub_region) ? formData.sub_region : '',
      });
    } else {
      setFormData({ ...formData, [name]: newValue });
    }

    if (type !== 'checkbox') validateField(name, newValue);
  };

  const handleBlur = (e) => validateField(e.target.name, e.target.value);

  const handleSubmit = (e) => {
    e.preventDefault();
    setValidationMessage('');

    const fieldsToValidate = ['account_name', 'deal_value_usd', 'period_of_presales_weeks', 'vector_link'];
    let hasErrors = false;
    fieldsToValidate.forEach(f => { if (!validateField(f, formData[f])) hasErrors = true; });
    if (hasErrors) { setValidationMessage('Please fix the errors above'); return; }
    if (!formData.account_name?.trim()) {
      setValidationMessage('Account Name is required');
      setErrors(e => ({ ...e, account_name: 'Required' }));
      return;
    }

    // ── Build payload with EXACT DB column names ──────────────────────────
    const str = (v) => (v && String(v).trim() !== '') ? String(v).trim() : null;
    const num = (v, parser) => { const n = parser(v); return isNaN(n) ? null : n; };

    const payload = {
      // Standard snake_case columns
      account_name:             str(formData.account_name),
      opportunity:              str(formData.opportunity),
      region_location:          str(formData.region_location),
      region:                   str(formData.region),
      sub_region:               str(formData.sub_region),
      deal_value_usd:           formData.deal_value_usd !== '' ? num(formData.deal_value_usd, parseFloat) : null,
      scoping_doc:              str(formData.scoping_doc),
      vector_link:              str(formData.vector_link),
      charging_on_vector:       str(formData.charging_on_vector),
      period_of_presales_weeks: formData.period_of_presales_weeks !== '' ? num(formData.period_of_presales_weeks, parseInt) : null,
      status:                   str(formData.status),
      pursuit_lead:             str(formData.pursuit_lead),
      delivery_manager:         str(formData.delivery_manager),
      presales_start_date:      str(formData.presales_start_date),
      expected_planned_start:   str(formData.expected_planned_start),
      sow_signature_date:       str(formData.sow_signature_date),
      staffing_completed_flag:  Boolean(formData.staffing_completed_flag),
      staffing_poc:             str(formData.staffing_poc),
      remarks:                  str(formData.remarks),

      // Columns that have spaces / special chars in the DB
      // The backend models.py maps these JS keys → real DB column names
      primary_poc_from_gsd:     str(formData.primary_poc_from_gsd),    // → "Primary POC from GSD"
      supporting_team:          str(formData.supporting_team),          // → "supporting team"
      estimation_pricing_sheet: str(formData.estimation_pricing_sheet), // → "Estimation/pricing sheet"
      supporting_docs:          str(formData.supporting_docs),          // → "supporting docs"
    };

    onSubmit(payload);
  };

  const fieldSx = {
    '& .MuiOutlinedInput-root': {
      '&.Mui-focused fieldset': { borderColor: '#667eea' },
    },
    '& .MuiInputLabel-root.Mui-focused': { color: '#667eea' },
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', fontWeight: 700 }}>
        {initialData ? 'Edit Opportunity' : 'New Opportunity'}
      </DialogTitle>

      <DialogContent>
        {validationMessage && <Alert severity="error" sx={{ mt: 2, mb: 1 }}>{validationMessage}</Alert>}

        <Grid container spacing={2} sx={{ mt: 1 }}>

          {/* Account & Opportunity */}
          <Grid item xs={12} sm={6}>
            <TextField fullWidth required label="Account Name" name="account_name"
              value={formData.account_name} onChange={handleChange} onBlur={handleBlur}
              error={!!errors.account_name} helperText={errors.account_name || 'Required'} sx={fieldSx} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField fullWidth label="Opportunity" name="opportunity"
              value={formData.opportunity} onChange={handleChange} sx={fieldSx}
              placeholder="e.g., Q1 2024 Enterprise Deal" />
          </Grid>

          {/* Region + filtered Sub Region */}
          <Grid item xs={12} sm={6}>
            <TextField select fullWidth label="Region" name="region"
              value={formData.region} onChange={handleChange} sx={fieldSx}>
              <MenuItem value="">Select Region</MenuItem>
              {REGION_OPTIONS.map(r => <MenuItem key={r} value={r}>{r}</MenuItem>)}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField select fullWidth label="Sub Region" name="sub_region"
              value={formData.sub_region} onChange={handleChange} sx={fieldSx}
              helperText={formData.region ? `Sub-regions for ${formData.region}` : 'Select a region first'}>
              <MenuItem value="">Select Sub Region</MenuItem>
              {availableSubRegions.map(r => <MenuItem key={r} value={r}>{r}</MenuItem>)}
            </TextField>
          </Grid>

          {/* Region Location */}
          <Grid item xs={12} sm={6}>
            <TextField fullWidth label="Region Location" name="region_location"
              value={formData.region_location} onChange={handleChange} sx={fieldSx}
              placeholder="e.g., Singapore" />
          </Grid>

          {/* Deal Value */}
          <Grid item xs={12} sm={6}>
            <TextField fullWidth type="number" label="Deal Value (USD)" name="deal_value_usd"
              value={formData.deal_value_usd} onChange={handleChange} onBlur={handleBlur}
              error={!!errors.deal_value_usd} helperText={errors.deal_value_usd || 'Numbers only'}
              inputProps={{ min: 0, step: 0.01 }} sx={fieldSx} />
          </Grid>

          {/* Estimation/pricing sheet — DB: "Estimation/pricing sheet" */}
          <Grid item xs={12} sm={6}>
            <TextField fullWidth label="Estimation / Pricing Sheet" name="estimation_pricing_sheet"
              value={formData.estimation_pricing_sheet} onChange={handleChange} sx={fieldSx}
              placeholder="URL or sheet name" />
          </Grid>

          {/* Status */}
          <Grid item xs={12} sm={6}>
            <TextField select fullWidth label="Status" name="status"
              value={formData.status} onChange={handleChange} sx={fieldSx}>
              <MenuItem value="">Select Status</MenuItem>
              {STATUS_OPTIONS.map(o => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
            </TextField>
          </Grid>

          {/* Period of Presales */}
          <Grid item xs={12} sm={6}>
            <TextField fullWidth type="number" label="Period of Presales (Weeks)" name="period_of_presales_weeks"
              value={formData.period_of_presales_weeks} onChange={handleChange} onBlur={handleBlur}
              error={!!errors.period_of_presales_weeks} helperText={errors.period_of_presales_weeks || 'Whole numbers only'}
              inputProps={{ min: 0, step: 1 }} sx={fieldSx} />
          </Grid>

          {/* Primary POC from GSD — DB: "Primary POC from GSD" */}
          <Grid item xs={12} sm={6}>
            <TextField fullWidth label="Primary POC from GSD" name="primary_poc_from_gsd"
              value={formData.primary_poc_from_gsd} onChange={handleChange} sx={fieldSx}
              placeholder="e.g., John Doe" />
          </Grid>

          {/* Supporting Team — DB: "supporting team" */}
          <Grid item xs={12} sm={6}>
            <TextField fullWidth label="Supporting Team" name="supporting_team"
              value={formData.supporting_team} onChange={handleChange} sx={fieldSx}
              placeholder="e.g., Jane Smith, Mike Lee"
              helperText="Separate multiple names with commas" />
          </Grid>

          {/* Pursuit Lead */}
          <Grid item xs={12} sm={6}>
            <TextField fullWidth label="Pursuit Lead" name="pursuit_lead"
              value={formData.pursuit_lead} onChange={handleChange} sx={fieldSx} />
          </Grid>

          {/* Delivery Manager */}
          <Grid item xs={12} sm={6}>
            <TextField fullWidth label="Delivery Manager" name="delivery_manager"
              value={formData.delivery_manager} onChange={handleChange} sx={fieldSx} />
          </Grid>

          {/* Staffing POC */}
          <Grid item xs={12} sm={6}>
            <TextField fullWidth label="Staffing POC" name="staffing_poc"
              value={formData.staffing_poc} onChange={handleChange} sx={fieldSx} />
          </Grid>

          {/* Dates */}
          <Grid item xs={12} sm={6}>
            <TextField fullWidth type="date" label="Presales Start Date" name="presales_start_date"
              value={formData.presales_start_date} onChange={handleChange}
              InputLabelProps={{ shrink: true }} sx={fieldSx} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField fullWidth type="date" label="Expected Planned Start" name="expected_planned_start"
              value={formData.expected_planned_start} onChange={handleChange}
              InputLabelProps={{ shrink: true }} sx={fieldSx} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField fullWidth type="date" label="SOW Signature Date" name="sow_signature_date"
              value={formData.sow_signature_date} onChange={handleChange}
              InputLabelProps={{ shrink: true }} sx={fieldSx} />
          </Grid>

          {/* Scoping Doc */}
          <Grid item xs={12} sm={6}>
            <TextField fullWidth label="Scoping Document" name="scoping_doc"
              value={formData.scoping_doc} onChange={handleChange} sx={fieldSx}
              placeholder="URL or document name" />
          </Grid>

          {/* Supporting Docs — DB: "supporting docs" */}
          <Grid item xs={12} sm={6}>
            <TextField fullWidth label="Supporting Docs" name="supporting_docs"
              value={formData.supporting_docs} onChange={handleChange} sx={fieldSx}
              placeholder="URL or document name" />
          </Grid>

          {/* Vector Link */}
          <Grid item xs={12} sm={6}>
            <TextField fullWidth label="Vector Link" name="vector_link"
              value={formData.vector_link} onChange={handleChange} onBlur={handleBlur}
              error={!!errors.vector_link} helperText={errors.vector_link || 'e.g., https://example.com'}
              sx={fieldSx} />
          </Grid>

          {/* Charging on Vector */}
          <Grid item xs={12} sm={6}>
            <TextField select fullWidth label="Charging on Vector" name="charging_on_vector"
              value={formData.charging_on_vector} onChange={handleChange} sx={fieldSx}>
              <MenuItem value="">Select</MenuItem>
              {CHARGING_OPTIONS.map(o => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
            </TextField>
          </Grid>

          {/* Staffing Completed */}
          <Grid item xs={12} sm={6}>
            <FormControlLabel
              control={
                <Checkbox checked={formData.staffing_completed_flag} onChange={handleChange}
                  name="staffing_completed_flag"
                  sx={{ color: '#667eea', '&.Mui-checked': { color: '#667eea' } }} />
              }
              label="Staffing Completed"
            />
          </Grid>

          {/* Remarks */}
          <Grid item xs={12}>
            <TextField fullWidth multiline rows={3} label="Remarks" name="remarks"
              value={formData.remarks} onChange={handleChange} sx={fieldSx}
              placeholder="Add any additional notes..." />
          </Grid>

        </Grid>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} sx={{ color: '#5F6368' }}>Cancel</Button>
        <Button onClick={handleSubmit} variant="contained"
          disabled={Object.keys(errors).length > 0}
          sx={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            '&:hover': { background: 'linear-gradient(135deg, #5568d3 0%, #6a3f8f 100%)' },
            '&:disabled': { background: '#E0E0E0', color: '#9E9E9E' },
          }}>
          {initialData ? 'Update' : 'Create'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default OpportunityForm;