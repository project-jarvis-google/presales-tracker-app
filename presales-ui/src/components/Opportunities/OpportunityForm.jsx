import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Grid,
  MenuItem,
  FormControlLabel,
  Checkbox,
  Alert,
} from '@mui/material';
import { STATUS_OPTIONS, REGION_OPTIONS, SUB_REGION_OPTIONS, CHARGING_OPTIONS } from '../../utils/constants';

const OpportunityForm = ({ open, onClose, onSubmit, initialData = null }) => {
  const [formData, setFormData] = useState({
    account_name: '',
    opportunity: '',
    region_location: '',
    region: '',
    sub_region: '',
    deal_value_usd: '',
    scoping_doc: '',
    vector_link: '',
    charging_on_vector: '',
    period_of_presales_weeks: '',
    status: '',
    assignee_from_gsd: '',
    pursuit_lead: '',
    delivery_manager: '',
    presales_start_date: '',
    expected_planned_start: '',
    sow_signature_date: '',
    staffing_completed_flag: false,
    staffing_poc: '',
    remarks: '',
  });

  const [errors, setErrors] = useState({});
  const [validationMessage, setValidationMessage] = useState('');

  useEffect(() => {
    if (initialData) {
      // Convert null values to empty strings for display in UI
      const formattedData = {
        account_name: initialData.account_name ?? '',
        opportunity: initialData.opportunity ?? '',
        region_location: initialData.region_location ?? '',
        region: initialData.region ?? '',
        sub_region: initialData.sub_region ?? '',
        deal_value_usd: initialData.deal_value_usd !== null && initialData.deal_value_usd !== undefined ? initialData.deal_value_usd : '',
        scoping_doc: initialData.scoping_doc ?? '',
        vector_link: initialData.vector_link ?? '',
        charging_on_vector: initialData.charging_on_vector ?? '',
        period_of_presales_weeks: initialData.period_of_presales_weeks !== null && initialData.period_of_presales_weeks !== undefined ? initialData.period_of_presales_weeks : '',
        status: initialData.status ?? '',
        assignee_from_gsd: initialData.assignee_from_gsd ?? '',
        pursuit_lead: initialData.pursuit_lead ?? '',
        delivery_manager: initialData.delivery_manager ?? '',
        presales_start_date: initialData.presales_start_date ?? '',
        expected_planned_start: initialData.expected_planned_start ?? '',
        sow_signature_date: initialData.sow_signature_date ?? '',
        staffing_completed_flag: initialData.staffing_completed_flag ?? false,
        staffing_poc: initialData.staffing_poc ?? '',
        remarks: initialData.remarks ?? '',
      };
      setFormData(formattedData);
    } else {
      setFormData({
        account_name: '',
        opportunity: '',
        region_location: '',
        region: '',
        sub_region: '',
        deal_value_usd: '',
        scoping_doc: '',
        vector_link: '',
        charging_on_vector: '',
        period_of_presales_weeks: '',
        status: '',
        assignee_from_gsd: '',
        pursuit_lead: '',
        delivery_manager: '',
        presales_start_date: '',
        expected_planned_start: '',
        sow_signature_date: '',
        staffing_completed_flag: false,
        staffing_poc: '',
        remarks: '',
      });
    }
    setErrors({});
    setValidationMessage('');
  }, [initialData, open]);

  const validateField = (name, value) => {
    const newErrors = { ...errors };

    switch (name) {
      case 'account_name':
        if (!value || value.trim() === '') {
          newErrors.account_name = 'Account name is required';
        } else {
          delete newErrors.account_name;
        }
        break;

      case 'deal_value_usd':
        if (value && isNaN(value)) {
          newErrors.deal_value_usd = 'Please enter a valid number (e.g., 50000)';
        } else if (value && parseFloat(value) < 0) {
          newErrors.deal_value_usd = 'Deal value cannot be negative';
        } else {
          delete newErrors.deal_value_usd;
        }
        break;

      case 'period_of_presales_weeks':
        if (value && isNaN(value)) {
          newErrors.period_of_presales_weeks = 'Please enter a valid number (e.g., 4)';
        } else if (value && parseInt(value) < 0) {
          newErrors.period_of_presales_weeks = 'Weeks cannot be negative';
        } else if (value && !Number.isInteger(parseFloat(value))) {
          newErrors.period_of_presales_weeks = 'Please enter a whole number';
        } else {
          delete newErrors.period_of_presales_weeks;
        }
        break;

      case 'vector_link':
        if (value && value.trim() !== '' && !isValidURL(value)) {
          newErrors.vector_link = 'Please enter a valid URL (e.g., https://example.com)';
        } else {
          delete newErrors.vector_link;
        }
        break;

      case 'presales_start_date':
      case 'expected_planned_start':
      case 'sow_signature_date':
        if (value && !isValidDate(value)) {
          newErrors[name] = 'Please enter a valid date';
        } else {
          delete newErrors[name];
        }
        break;

      default:
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isValidURL = (string) => {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  };

  const isValidDate = (dateString) => {
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : value;
    
    setFormData({
      ...formData,
      [name]: newValue,
    });

    if (type !== 'checkbox') {
      validateField(name, newValue);
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    validateField(name, value);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setValidationMessage('');

    let hasErrors = false;
    const fieldsToValidate = ['account_name', 'deal_value_usd', 'period_of_presales_weeks', 'vector_link'];
    
    fieldsToValidate.forEach(field => {
      if (!validateField(field, formData[field])) {
        hasErrors = true;
      }
    });

    if (hasErrors) {
      setValidationMessage('Please fix the errors above before submitting');
      return;
    }

    if (!formData.account_name || formData.account_name.trim() === '') {
      setValidationMessage('Account Name is required');
      setErrors({ ...errors, account_name: 'This field is required' });
      return;
    }

    // Clean data - send NULL for all empty values except account_name (required)
    const cleanedData = {};
    
    // String fields - send NULL if empty, trimmed string if has value
    const stringFields = [
      'account_name', 'opportunity', 'region_location', 'region', 'sub_region',
      'scoping_doc', 'vector_link', 'status', 'assignee_from_gsd',
      'pursuit_lead', 'delivery_manager', 'staffing_poc', 'remarks', 'charging_on_vector'
    ];
    
    stringFields.forEach(field => {
      const value = formData[field];
      if (value && typeof value === 'string' && value.trim() !== '') {
        cleanedData[field] = value.trim();
      } else {
        // Send NULL for empty fields (except account_name which is validated as required above)
        cleanedData[field] = null;
      }
    });

    // Ensure account_name is never null (it's required)
    if (!cleanedData.account_name) {
      cleanedData.account_name = formData.account_name.trim();
    }

    // Numeric fields - convert to number or send NULL
    if (formData.deal_value_usd !== '' && formData.deal_value_usd !== null && formData.deal_value_usd !== undefined) {
      const numValue = parseFloat(formData.deal_value_usd);
      cleanedData.deal_value_usd = isNaN(numValue) ? null : numValue;
    } else {
      cleanedData.deal_value_usd = null;
    }

    if (formData.period_of_presales_weeks !== '' && formData.period_of_presales_weeks !== null && formData.period_of_presales_weeks !== undefined) {
      const numValue = parseInt(formData.period_of_presales_weeks);
      cleanedData.period_of_presales_weeks = isNaN(numValue) ? null : numValue;
    } else {
      cleanedData.period_of_presales_weeks = null;
    }

    // Boolean field - always send boolean value
    cleanedData.staffing_completed_flag = Boolean(formData.staffing_completed_flag);

    // Date fields - send in YYYY-MM-DD format or NULL
    ['presales_start_date', 'expected_planned_start', 'sow_signature_date'].forEach(field => {
      if (formData[field] && formData[field].trim() !== '') {
        cleanedData[field] = formData[field];
      } else {
        cleanedData[field] = null;
      }
    });

    console.log('Submitting cleaned data (NULL for empty values):', cleanedData);
    onSubmit(cleanedData);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle
        sx={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          fontWeight: 700,
        }}
      >
        {initialData ? 'Edit Opportunity' : 'New Opportunity'}
      </DialogTitle>
      <DialogContent>
        {validationMessage && (
          <Alert severity="error" sx={{ mt: 2, mb: 2 }}>
            {validationMessage}
          </Alert>
        )}

        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              required
              label="Account Name"
              name="account_name"
              value={formData.account_name}
              onChange={handleChange}
              onBlur={handleBlur}
              error={!!errors.account_name}
              helperText={errors.account_name || 'Required field'}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Opportunity"
              name="opportunity"
              value={formData.opportunity}
              onChange={handleChange}
              placeholder="e.g., Q1 2024 Enterprise Deal"
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              select
              fullWidth
              label="Region"
              name="region"
              value={formData.region}
              onChange={handleChange}
            >
              <MenuItem value="">Select Region</MenuItem>
              {REGION_OPTIONS.map((option) => (
                <MenuItem key={option} value={option}>
                  {option}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              select
              fullWidth
              label="Sub Region"
              name="sub_region"
              value={formData.sub_region}
              onChange={handleChange}
            >
              <MenuItem value="">Select Sub Region</MenuItem>
              {SUB_REGION_OPTIONS.map((option) => (
                <MenuItem key={option} value={option}>
                  {option}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Region Location"
              name="region_location"
              value={formData.region_location}
              onChange={handleChange}
              placeholder="e.g., San Francisco, CA"
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              type="number"
              label="Deal Value (USD)"
              name="deal_value_usd"
              value={formData.deal_value_usd}
              onChange={handleChange}
              onBlur={handleBlur}
              error={!!errors.deal_value_usd}
              helperText={errors.deal_value_usd || 'Enter numbers only (e.g., 50000)'}
              inputProps={{ min: 0, step: 0.01 }}
              placeholder="50000"
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              select
              fullWidth
              label="Status"
              name="status"
              value={formData.status}
              onChange={handleChange}
            >
              <MenuItem value="">Select Status</MenuItem>
              {STATUS_OPTIONS.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              type="number"
              label="Period of Presales (Weeks)"
              name="period_of_presales_weeks"
              value={formData.period_of_presales_weeks}
              onChange={handleChange}
              onBlur={handleBlur}
              error={!!errors.period_of_presales_weeks}
              helperText={errors.period_of_presales_weeks || 'Enter whole numbers only (e.g., 4)'}
              inputProps={{ min: 0, step: 1 }}
              placeholder="4"
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Assignee from GSD"
              name="assignee_from_gsd"
              value={formData.assignee_from_gsd}
              onChange={handleChange}
              placeholder="e.g., John Doe"
              helperText="For multiple names, separate with commas"
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Pursuit Lead"
              name="pursuit_lead"
              value={formData.pursuit_lead}
              onChange={handleChange}
              placeholder="e.g., Jane Smith"
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Delivery Manager"
              name="delivery_manager"
              value={formData.delivery_manager}
              onChange={handleChange}
              placeholder="e.g., Mike Johnson"
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Staffing POC"
              name="staffing_poc"
              value={formData.staffing_poc}
              onChange={handleChange}
              placeholder="e.g., Sarah Williams"
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              type="date"
              label="Presales Start Date"
              name="presales_start_date"
              value={formData.presales_start_date}
              onChange={handleChange}
              onBlur={handleBlur}
              error={!!errors.presales_start_date}
              helperText={errors.presales_start_date || 'Select a date'}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              type="date"
              label="Expected Planned Start"
              name="expected_planned_start"
              value={formData.expected_planned_start}
              onChange={handleChange}
              onBlur={handleBlur}
              error={!!errors.expected_planned_start}
              helperText={errors.expected_planned_start || 'Select a date'}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              type="date"
              label="SOW Signature Date"
              name="sow_signature_date"
              value={formData.sow_signature_date}
              onChange={handleChange}
              onBlur={handleBlur}
              error={!!errors.sow_signature_date}
              helperText={errors.sow_signature_date || 'Select a date'}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Scoping Document"
              name="scoping_doc"
              value={formData.scoping_doc}
              onChange={handleChange}
              placeholder="URL or document name"
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Vector Link"
              name="vector_link"
              value={formData.vector_link}
              onChange={handleChange}
              onBlur={handleBlur}
              error={!!errors.vector_link}
              helperText={errors.vector_link || 'e.g., https://example.com'}
              placeholder="https://example.com"
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              select
              fullWidth
              label="Charging on Vector"
              name="charging_on_vector"
              value={formData.charging_on_vector}
              onChange={handleChange}
            >
              <MenuItem value="">Select Status</MenuItem>
              {CHARGING_OPTIONS.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid item xs={12} sm={6}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={formData.staffing_completed_flag}
                  onChange={handleChange}
                  name="staffing_completed_flag"
                  sx={{
                    color: '#667eea',
                    '&.Mui-checked': {
                      color: '#667eea',
                    },
                  }}
                />
              }
              label="Staffing Completed"
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Remarks"
              name="remarks"
              value={formData.remarks}
              onChange={handleChange}
              placeholder="Add any additional notes..."
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button 
          onClick={onClose}
          sx={{ 
            color: '#5F6368',
            '&:hover': {
              backgroundColor: '#F8F9FA',
            }
          }}
        >
          Cancel
        </Button>
        <Button 
          onClick={handleSubmit} 
          variant="contained"
          disabled={Object.keys(errors).length > 0}
          sx={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            '&:hover': {
              background: 'linear-gradient(135deg, #5568d3 0%, #6a3f8f 100%)',
            },
            '&:disabled': {
              background: '#E0E0E0',
              color: '#9E9E9E',
            }
          }}
        >
          {initialData ? 'Update' : 'Create'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default OpportunityForm;