import React from 'react';
import { 
  FormControl, 
  FormLabel, 
  FormGroup, 
  FormControlLabel, 
  Checkbox, 
  FormHelperText,
  Box
} from '@mui/material';

const CheckboxSportsSelector = ({ options, value = [], onChange, error }) => {
  const handleChange = (sportId) => {
    const currentValue = Array.isArray(value) ? value : [];
    
    // If already selected, remove it
    if (currentValue.includes(sportId)) {
      onChange(currentValue.filter(id => id !== sportId));
    } 
    // Otherwise add it
    else {
      onChange([...currentValue, sportId]);
    }
  };

  return (
    <FormControl component="fieldset" error={Boolean(error)} sx={{ width: '100%' }}>
      <FormLabel component="legend">Επιλέξτε Αθλήματα</FormLabel>
      <FormGroup>
        {options.map(option => (
          <FormControlLabel
            key={option.value}
            control={
              <Checkbox 
                checked={Array.isArray(value) && value.includes(option.value)} 
                onChange={() => handleChange(option.value)}
              />
            }
            label={option.label}
          />
        ))}
      </FormGroup>
      {error && <FormHelperText error>{error}</FormHelperText>}
    </FormControl>
  );
};

export default CheckboxSportsSelector;