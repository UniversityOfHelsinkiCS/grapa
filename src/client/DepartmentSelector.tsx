import React, { useState } from 'react'
import {
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Typography,
} from '@mui/material'
import useDepartments from './hooks/useDepartments'
// eslint-disable-next-line import/no-named-as-default
import useUserDepartmentMutation from './hooks/useUserDepartmentMutation'

const DepartmentSelector: React.FC = () => {
  const [selectedDepartment, setSelectedDepartment] = useState('')
  const { departments } = useDepartments()
  const { mutateAsync: saveDepartment } = useUserDepartmentMutation()

  const handleDepartmentChange = (
    event: React.ChangeEvent<{ value: unknown }>
  ) => {
    setSelectedDepartment(event.target.value as string)
  }

  const handleSubmit = async () => {
    await saveDepartment({ departmentId: selectedDepartment })
  }

  if (!departments) return null

  return (
    <Stack spacing={3} sx={{ p: '1rem', width: '650px', maxWidth: '1920px' }}>
      <Typography variant="h6">Select Department</Typography>
      <Typography>
        Before proceeding, you have to select a department you belong to
      </Typography>
      <FormControl fullWidth>
        <InputLabel id="department-label">Department</InputLabel>
        <Select
          labelId="department-label"
          id="department-select"
          value={selectedDepartment}
          onChange={handleDepartmentChange}
        >
          {departments.map((department) => (
            <MenuItem key={department.id} value={department.id}>
              {department.name.en}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      <Button variant="contained" color="primary" onClick={handleSubmit}>
        Submit
      </Button>
    </Stack>
  )
}

export default DepartmentSelector
