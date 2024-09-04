import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Autocomplete,
  Box,
  Button,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
} from '@mui/material'
import DeleteIcon from '@mui/icons-material/Delete'
import { DataGrid, GridColDef } from '@mui/x-data-grid'

import { TranslationLanguage, DepartmentAdminData } from '@backend/types'

import { Navigate } from 'react-router-dom'
import useUsers from '../../hooks/useUsers'
import { useDebounce } from '../../hooks/useDebounce'
import useLoggedInUser from '../../hooks/useLoggedInUser'
import useDepartments from '../../hooks/useDepartments'
import useDepartmentAdmins from '../../hooks/useDepartmentAdmins'
import {
  useCreateDepartmentAdminMutation,
  useDeleteDepartmentAdminMutation,
} from '../../hooks/useDepartmentAdminMutation'

import DeleteConfirmation from '../Common/DeleteConfirmation'

const DepartmentAdmin = () => {
  const { user, isLoading: userLoading } = useLoggedInUser()
  const { t, i18n } = useTranslation()
  const { language } = i18n as { language: TranslationLanguage }

  const [departmentId, setDepartmendId] = useState(null)
  const [adminCandidate, setAdminCandidate] = useState(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deletedDepartmentAdmin, setDeletedDepartmentAdmin] = useState(null)

  const { departments } = useDepartments({ includeNotManaged: false })
  const { departmentAdmins } = useDepartmentAdmins()

  const { mutateAsync: createDepartmentAdmin } =
    useCreateDepartmentAdminMutation()
  const { mutateAsync: deleteDepartmentAdmin } =
    useDeleteDepartmentAdminMutation()

  const [userSearch, setUserSearch] = useState('')
  const debouncedSearch = useDebounce(userSearch, 700)
  const { users } = useUsers({ search: debouncedSearch, onlyEmployees: true })

  const handleAddDepartmentAdmin = async () => {
    if (adminCandidate && departmentId) {
      await createDepartmentAdmin({
        userId: adminCandidate.id,
        departmentId,
      })

      setAdminCandidate(null)
      setDepartmendId(null)
    }
  }

  if (userLoading || departments.length === 0 || !departmentAdmins) return null
  if (!user.isAdmin && !user.managedDepartmentIds?.length)
    return <Navigate to="/" />

  const columns: GridColDef<DepartmentAdminData>[] = [
    {
      field: 'user',
      headerName: t('userHeader'),
      flex: 1,
      valueGetter: ({ firstName, lastName, email }) =>
        `${firstName} ${lastName}${email ? ` (${email})` : ''}`,
    },
    {
      field: 'department',
      headerName: t('departmentHeader'),
      flex: 1,
      valueGetter: ({ name }) => name[language],
    },
    {
      field: 'actions',
      type: 'actions',
      headerName: '',
      sortable: false,
      renderCell: (params) => (
        <IconButton
          aria-label="delete"
          type="button"
          onClick={() => {
            setDeleteDialogOpen(true)
            setDeletedDepartmentAdmin(params.row as DepartmentAdminData)
          }}
          color="error"
          data-testid={`delete-department-admin-button-${params.row.userId}`}
        >
          <DeleteIcon fontSize="small" />
        </IconButton>
      ),
    },
  ]

  return (
    <Box component="section" sx={{ px: '3rem', py: '2rem', width: '100%' }}>
      <Typography
        data-testid="department-admin-page-title"
        component="h1"
        variant="h4"
      >
        {t('departmentAdminPage:pageTitle')}
      </Typography>
      <DataGrid
        sx={{ mt: '2rem' }}
        rows={departmentAdmins}
        columns={columns}
        pageSizeOptions={[100]}
        autoHeight
      />
      <Box
        sx={{
          maxWidth: '480px',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
          mt: '2rem',
          mx: 'auto',
        }}
      >
        <Typography component="h2" variant="h6">
          {t('departmentAdminPage:addDepartmentAdmin')}
        </Typography>
        <FormControl fullWidth>
          <Autocomplete
            id="department-admin"
            noOptionsText={t('userSearchNoOptions')}
            data-testid="department-admin-select-input"
            disablePortal
            options={users ?? []}
            getOptionLabel={(departmentAdmin) =>
              `${departmentAdmin.firstName} ${departmentAdmin.lastName} ${departmentAdmin.email ? `(${departmentAdmin.email})` : ''} ${departmentAdmin.username ? `(${departmentAdmin.username})` : ''}`
            }
            renderInput={(params) => (
              <TextField
                {...params}
                label={t('departmentAdminPage:adminHeader')}
                required
              />
            )}
            inputValue={userSearch}
            filterOptions={(x) => x}
            isOptionEqualToValue={(option, value) => option.id === value.id}
            value={adminCandidate}
            onChange={(_, value) => {
              setAdminCandidate(value)
            }}
            onInputChange={(_, value) => {
              setUserSearch(value)
            }}
          />
        </FormControl>
        <FormControl fullWidth>
          <InputLabel id="department-select-label">
            {t('departmentAdminPage:departmentHeader')}
          </InputLabel>
          <Select
            data-testid="department-select-input"
            labelId="department-select-label"
            label={t('departmentAdminPage:departmentHeader')}
            value={departmentId ?? ''}
            onChange={(e) => setDepartmendId(e.target.value as string)}
          >
            {departments.map((department) => (
              <MenuItem
                key={department.id}
                value={department.id}
                data-testid={`department-select-item-${department.id}`}
              >
                {department.name[language]}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <Button
          type="submit"
          variant="contained"
          data-testid="add-department-admin-button"
          disabled={!departmentId || !adminCandidate}
          onClick={handleAddDepartmentAdmin}
          fullWidth
          sx={{ borderRadius: '0.5rem' }}
        >
          {t('submitButton')}
        </Button>
      </Box>
      {deletedDepartmentAdmin && (
        <DeleteConfirmation
          open={deleteDialogOpen}
          setOpen={setDeleteDialogOpen}
          onClose={() => {
            setDeleteDialogOpen(false)
            setDeletedDepartmentAdmin(null)
          }}
          onDelete={async () => {
            await deleteDepartmentAdmin(deletedDepartmentAdmin.id)
            setDeleteDialogOpen(false)
            setDeletedDepartmentAdmin(null)
          }}
          title={t('departmentAdminPage:removeDepartmentAdminTitle')}
        >
          <Box>
            {t('departmentAdminPage:removeDepartmentAdminContent', {
              name: `${deletedDepartmentAdmin.user.firstName} ${deletedDepartmentAdmin.user.lastName}`,
              department: deletedDepartmentAdmin.department.name[language],
            })}
          </Box>
        </DeleteConfirmation>
      )}
    </Box>
  )
}

export default DepartmentAdmin
