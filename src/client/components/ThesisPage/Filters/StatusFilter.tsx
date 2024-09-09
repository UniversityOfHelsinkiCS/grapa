import Box from '@mui/material/Box'
import { GridFilterInputValueProps } from '@mui/x-data-grid'

import { useTranslation } from 'react-i18next'
import {
  Checkbox,
  FormControl,
  InputLabel,
  ListItemText,
  MenuItem,
  Select,
  SelectChangeEvent,
} from '@mui/material'

import { StatusLocale } from '../../../types'

const StatusFilter = (props: GridFilterInputValueProps) => {
  const { t } = useTranslation()
  const { item, applyValue } = props

  const itemValue = item?.value ?? []

  const handleFilterChange = (event: SelectChangeEvent<any>) => {
    const eventValue = event.target.value
    const newValue =
      typeof eventValue === 'string'
        ? eventValue.split(',')
        : eventValue.flat().filter(Boolean)

    applyValue({ ...item, value: newValue })
  }

  return (
    <Box
      sx={{
        display: 'inline-flex',
        flexDirection: 'row',
        alignItems: 'center',
        height: 48,
        pl: '20px',
      }}
    >
      <FormControl variant="standard" sx={{ m: 1, width: 300 }}>
        <InputLabel id="status-filter-label">Value(s)</InputLabel>
        <Select
          labelId="status-filter-label"
          id="status-filter"
          multiple
          value={itemValue}
          onChange={handleFilterChange}
          renderValue={(selected) => (selected as string[]).join(', ')}
        >
          <MenuItem sx={{ m: 0, p: 0 }} value={t(StatusLocale.PLANNING)}>
            <Checkbox checked={itemValue.includes(t(StatusLocale.PLANNING))} />
            <ListItemText primary={t(StatusLocale.PLANNING)} />
          </MenuItem>
          <MenuItem sx={{ m: 0, p: 0 }} value={t(StatusLocale.IN_PROGRESS)}>
            <Checkbox
              checked={itemValue.includes(t(StatusLocale.IN_PROGRESS))}
            />
            <ListItemText primary={t(StatusLocale.IN_PROGRESS)} />
          </MenuItem>
          <MenuItem sx={{ m: 0, p: 0 }} value={t(StatusLocale.COMPLETED)}>
            <Checkbox checked={itemValue.includes(t(StatusLocale.COMPLETED))} />
            <ListItemText primary={t(StatusLocale.COMPLETED)} />
          </MenuItem>
          <MenuItem sx={{ m: 0, p: 0 }} value={t(StatusLocale.CANCELLED)}>
            <Checkbox checked={itemValue.includes(t(StatusLocale.CANCELLED))} />
            <ListItemText primary={t(StatusLocale.CANCELLED)} />
          </MenuItem>
        </Select>
      </FormControl>
    </Box>
  )
}

export default StatusFilter
