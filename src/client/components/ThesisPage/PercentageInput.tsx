import React from 'react'
import { TextField, InputAdornment, TextFieldProps } from '@mui/material'

interface PercentageInputProps {
  label: string
  value: number
  onChange: (percentage: number) => void
  // eslint-disable-next-line react/require-default-props
  percentageInputProps?: TextFieldProps
}

const PercentageInput = ({
  label,
  value,
  onChange: handlePercentageChange,
  percentageInputProps,
}: PercentageInputProps) => (
  <TextField
    type="number"
    sx={{ width: '12ch' }}
    InputProps={{
      inputProps: { min: 1, max: 100 },
      endAdornment: <InputAdornment position="end">%</InputAdornment>,
    }}
    label={label}
    value={value}
    onChange={(event) =>
      handlePercentageChange(parseInt(event.target.value, 10))
    }
    {...percentageInputProps}
  />
)

export default PercentageInput
