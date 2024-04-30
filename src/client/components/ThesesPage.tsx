import dayjs from 'dayjs'
import Box from '@mui/material/Box'
import DeleteIcon from '@mui/icons-material/Delete'
import EditIcon from '@mui/icons-material/Edit'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import { DataGrid, GridActionsCellItem, GridColDef } from '@mui/x-data-grid'
import { useEffect, useState } from 'react'
import { ThesisData as Thesis } from '@backend/types'
import { useTranslation } from 'react-i18next'
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
} from '@mui/material'
import programs from './mockPorgrams'

const ThesesPage = () => {
  const { t } = useTranslation()
  const [theses, setTheses] = useState<Thesis[]>([])
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [editedTesis, setEditedThesis] = useState<Thesis | null>(null)
  const [deletedThesis, setDeletedThesis] = useState<Thesis | null>(null)

  // TODO: use react-query for data fetching
  useEffect(() => {
    fetch('/api/theses')
      .then((res) => res.json())
      .then((data) => {
        console.log(data)
        setTheses(data)
      })
  }, [])

  const columns: GridColDef<Thesis>[] = [
    { field: 'id', headerName: 'ID', width: 90 },
    {
      field: 'programId',
      headerName: t('programHeader'),
      width: 350,
      valueGetter: (value, row) =>
        programs.find((program) => program.key === row.programId)?.name.en,
      // editable: true,
    },
    {
      field: 'topic',
      headerName: t('topicHeader'),
      width: 350,
      // editable: true,
    },
    {
      field: 'status',
      headerName: t('statusHeader'),
      width: 310,
      // editable: true,number
    },
    {
      field: 'startDate',
      headerName: t('startDateHeader'),
      sortable: false,
      width: 360,
      valueGetter: (value, row) => dayjs(row.startDate).format('YYYY-MM-DD'),
      // valueGetter: (value, row) => `${row.firstName || ''} ${row.lastName || ''}`,
    },
    {
      field: 'targetDate',
      headerName: t('targetDateHeader'),
      description: 'This column has a value getter and is not sortable.',
      sortable: false,
      width: 360,
      valueGetter: (value, row) => dayjs(row.targetDate).format('YYYY-MM-DD'),
      // valueGetter: (value, row) => `${row.firstName || ''} ${row.lastName || ''}`,
    },
    {
      field: 'actions',
      type: 'actions',
      width: 80,
      getActions: (params) => [
        <GridActionsCellItem
          onClick={() => {
            setEditDialogOpen(true)
            setEditedThesis(params.row as Thesis)
          }}
          label={t('editButton')}
          key="edit"
          showInMenu
          icon={<EditIcon />}
          closeMenuOnClick
        />,
        <GridActionsCellItem
          onClick={() => {
            setDeleteDialogOpen(true)
            setDeletedThesis(params.row as Thesis)
          }}
          label={t('deleteButton')}
          key="delete"
          showInMenu
          icon={<DeleteIcon />}
          closeMenuOnClick
        />,
      ],
    },
  ]

  return (
    <>
      <Box sx={{ width: '80%' }}>
        <DataGrid
          rows={theses}
          columns={columns}
          initialState={{
            pagination: {
              paginationModel: {
                pageSize: 100,
              },
            },
          }}
          pageSizeOptions={[100]}
          disableRowSelectionOnClick
        />
      </Box>
      {editedTesis && (
        <Dialog
          fullWidth
          maxWidth="lg"
          open={editDialogOpen}
          onClose={() => {
            setEditDialogOpen(false)
            setEditedThesis(null)
          }}
          PaperProps={{
            component: 'form',
            onSubmit: (event: React.FormEvent<HTMLFormElement>) => {
              event.preventDefault()
              const formData = new FormData(event.currentTarget)
              const formJson = Object.fromEntries((formData as any).entries())

              // TODO: use react-query for data fetching
              fetch(`/api/theses/${editedTesis.id}`, {
                method: 'PUT',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify(formJson),
              })
                .then((res) => res.json())
                .then((data) => {
                  console.log(data)
                })

              setEditDialogOpen(false)
              setEditedThesis(null)
            },
          }}
        >
          <DialogTitle>{t('editThesisDialog')}</DialogTitle>
          <DialogContent>
            <Stack spacing={6}>
              <TextField
                autoFocus
                required
                margin="dense"
                id="topic"
                name="topic"
                // TODO: use react-i18next for all strings
                label={t('topicHeader')}
                type="email"
                value={editedTesis.topic}
                onChange={(event) => {
                  setEditedThesis((oldThesis) => ({
                    ...oldThesis,
                    topic: event.target.value,
                  }))
                }}
                fullWidth
                variant="standard"
              />
              <FormControl fullWidth>
                <InputLabel id="program-select-label">
                  {t('programHeader')}
                </InputLabel>
                <Select
                  value={editedTesis.programId}
                  label="Program"
                  name="programId"
                  onChange={(event) => {
                    setEditedThesis((oldThesis) => ({
                      ...oldThesis,
                      programId: event.target.value as Thesis['programId'],
                    }))
                  }}
                >
                  {programs.map((program) => (
                    <MenuItem key={program.key} value={program.key}>
                      {program.name.en}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl fullWidth>
                <InputLabel id="status-select-label">
                  {t('statusHeader')}
                </InputLabel>
                <Select
                  value={editedTesis.status}
                  label={t('statusHeader')}
                  name="status"
                  onChange={(event) => {
                    setEditedThesis((oldThesis) => ({
                      ...oldThesis,
                      status: event.target.value as Thesis['status'],
                    }))
                  }}
                >
                  <MenuItem value="PLANNING">Planning</MenuItem>
                  <MenuItem value="STARTED">Started</MenuItem>
                  <MenuItem value="IN_PROGRESS">In progress</MenuItem>
                  <MenuItem value="COMPLETED">Completed</MenuItem>
                  <MenuItem value="CANCELLED">Cancelled</MenuItem>
                </Select>
              </FormControl>
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <DatePicker
                  label={t('startDateHeader')}
                  name="startDate"
                  value={dayjs(editedTesis.startDate)}
                  onChange={(date) => {
                    setEditedThesis((oldThesis) => ({
                      ...oldThesis,
                      startDate: date.format('YYYY-MM-DD'),
                    }))
                  }}
                />
                <DatePicker
                  label={t('targetDateHeader')}
                  name="targetDate"
                  value={dayjs(editedTesis.targetDate)}
                  onChange={(date) => {
                    setEditedThesis((oldThesis) => ({
                      ...oldThesis,
                      targetDate: date.format('YYYY-MM-DD'),
                    }))
                  }}
                />
              </LocalizationProvider>
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => {
                setEditDialogOpen(false)
                setEditedThesis(null)
              }}
            >
              {t('cancelButton')}
            </Button>
            <Button type="submit">{t('editButton')}</Button>
          </DialogActions>
        </Dialog>
      )}
      {deletedThesis && (
        <Dialog
          open={deleteDialogOpen}
          onClose={() => {
            setDeleteDialogOpen(false)
            setDeletedThesis(null)
          }}
        >
          <DialogTitle>Delete thesis</DialogTitle>
          <DialogContent>
            Are you sure you want to delete the thesis with ID{' '}
            {deletedThesis.id}?
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteDialogOpen(false)}>
              {t('cancelButton')}
            </Button>
            <Button
              variant="contained"
              onClick={() => {
                fetch(`/api/theses/${deletedThesis.id}`, {
                  method: 'DELETE',
                }).then((data) => {
                  console.log(data)
                  setDeleteDialogOpen(false)
                  setDeletedThesis(null)
                })
              }}
            >
              {t('deleteButton')}
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </>
  )
}

export default ThesesPage
