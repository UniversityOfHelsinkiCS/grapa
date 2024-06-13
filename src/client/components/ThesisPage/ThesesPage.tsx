import dayjs from 'dayjs'
import Box from '@mui/material/Box'
import DeleteIcon from '@mui/icons-material/Delete'
import EditIcon from '@mui/icons-material/Edit'
import { DataGrid, GridActionsCellItem, GridColDef } from '@mui/x-data-grid'
import { useState } from 'react'
import { ThesisData as Thesis } from '@backend/types'
import { useTranslation } from 'react-i18next'
import { Button, Stack } from '@mui/material'
import programs from '../mockPorgrams'
import useTheses from '../../hooks/useTheses'
import useLoggedInUser from '../../hooks/useLoggedInUser'
import {
  useCreateThesisMutation,
  useDeleteThesisMutation,
  useEditThesisMutation,
} from '../../hooks/useThesesMutation'
import ThesisEditForm from './ThesisEditForm'
import DeleteConfirmation from '../Common/DeleteConfirmation'

const ThesesPage = () => {
  const { t } = useTranslation()
  const { user, isLoading: loggedInUserLoading } = useLoggedInUser()

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [editedTesis, setEditedThesis] = useState<Thesis | null>(null)
  const [deletedThesis, setDeletedThesis] = useState<Thesis | null>(null)
  const [newThesis, setNewThesis] = useState<Thesis | null>(null)

  const { theses } = useTheses()
  const { mutateAsync: editThesis } = useEditThesisMutation()
  const { mutateAsync: deleteThesis } = useDeleteThesisMutation()
  const { mutateAsync: createThesis } = useCreateThesisMutation()

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
      width: 160,
      valueGetter: (value, row) => dayjs(row.startDate).format('YYYY-MM-DD'),
      // valueGetter: (value, row) => `${row.firstName || ''} ${row.lastName || ''}`,
    },
    {
      field: 'targetDate',
      headerName: t('targetDateHeader'),
      description: 'This column has a value getter and is not sortable.',
      sortable: false,
      width: 160,
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

  if (!theses || loggedInUserLoading) return null

  return (
    <Stack spacing={3} sx={{ p: '1rem', width: '100%', maxWidth: '1920px' }}>
      <Button
        variant="contained"
        size="large"
        sx={{ width: 200, borderRadius: '0.5rem' }}
        onClick={() => {
          setNewThesis({
            programId: programs[0].key,
            supervisions: [{ user, percentage: 100 }],
            authors: [],
            graders: [
              { user, isPrimaryGrader: true },
              { user: null, isPrimaryGrader: false },
            ],
            topic: '',
            status: 'PLANNING',
            startDate: dayjs().format('YYYY-MM-DD'),
            targetDate: dayjs().add(1, 'year').format('YYYY-MM-DD'),
          })
        }}
      >
        {t('newThesisButton')}
      </Button>
      <Box>
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
        <ThesisEditForm
          formTitle={t('thesisForm:editThesisFormTitle')}
          initialThesis={editedTesis}
          onSubmit={async (updatedThesis) => {
            await editThesis({ thesisId: editedTesis.id, data: updatedThesis })
            setEditedThesis(null)
          }}
          onClose={() => setEditedThesis(null)}
        />
      )}
      {newThesis && (
        <ThesisEditForm
          formTitle={t('thesisForm:newThesisFormTitle')}
          initialThesis={newThesis}
          onSubmit={async (variables) => {
            await createThesis(variables)
            setNewThesis(null)
          }}
          onClose={() => setNewThesis(null)}
        />
      )}
      {deletedThesis && (
        <DeleteConfirmation
          open={deleteDialogOpen}
          setOpen={setDeleteDialogOpen}
          onClose={() => {
            setDeleteDialogOpen(false)
            setDeletedThesis(null)
          }}
          onDelete={async () => {
            await deleteThesis(deletedThesis.id)
            setDeleteDialogOpen(false)
            setDeletedThesis(null)
          }}
          title={t('deleteThesisTitle')}
        >
          <Box>
            Are you sure you want to delete the thesis with ID{' '}
            {deletedThesis.id}?
          </Box>
        </DeleteConfirmation>
      )}
    </Stack>
  )
}

export default ThesesPage
