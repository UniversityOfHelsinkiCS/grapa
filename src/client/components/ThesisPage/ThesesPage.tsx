import dayjs from 'dayjs'
import Box from '@mui/material/Box'
import {
  DataGrid,
  DataGridProps,
  GridColDef,
  GridRowSelectionModel,
} from '@mui/x-data-grid'
import { useState } from 'react'
import { ThesisData as Thesis, TranslationLanguage } from '@backend/types'
import { Trans, useTranslation } from 'react-i18next'
import { Stack, TextField, Typography } from '@mui/material'
import { useTheses } from '../../hooks/useTheses'
import useLoggedInUser from '../../hooks/useLoggedInUser'
import {
  useCreateThesisMutation,
  useDeleteThesisMutation,
  useEditThesisMutation,
} from '../../hooks/useThesesMutation'
import ThesisEditForm from './ThesisEditForm'
import DeleteConfirmation from '../Common/DeleteConfirmation'
import usePrograms from '../../hooks/usePrograms'
import { getSortedPrograms } from './util'
import ViewThesisFooter from './ViewThesisFooter'
import ThesisToolbar from './ThesisToolbar'

const ThesesPage = () => {
  const { t, i18n } = useTranslation()
  const { language } = i18n as { language: TranslationLanguage }
  const { user, isLoading: loggedInUserLoading } = useLoggedInUser()

  const [rowSelectionModel, setRowSelectionModel] =
    useState<GridRowSelectionModel>([])
  const [deleteConfirmation, setDeleteConfirmation] = useState<string>('')
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [editedTesis, setEditedThesis] = useState<Thesis | null>(null)
  const [deletedThesis, setDeletedThesis] = useState<Thesis | null>(null)
  const [newThesis, setNewThesis] = useState<Thesis | null>(null)

  const { theses } = useTheses()
  const { programs } = usePrograms({ includeNotManaged: true })
  const { mutateAsync: editThesis } = useEditThesisMutation()
  const { mutateAsync: deleteThesis } = useDeleteThesisMutation()
  const { mutateAsync: createThesis } = useCreateThesisMutation()

  if (!programs || !theses || loggedInUserLoading) return null

  const columns: GridColDef<Thesis>[] = [
    {
      field: 'programId',
      headerName: t('programHeader'),
      width: 250,
      valueGetter: (_, row) =>
        programs.find((program) => program.id === row.programId)?.name[
          language
        ],
    },
    {
      field: 'topic',
      headerName: t('topicHeader'),
      width: 300,
    },
    {
      field: 'authors',
      headerName: t('authorsHeader'),
      width: 300,
      valueGetter: (_, row) =>
        row.authors
          .map(
            (author) =>
              `${author.firstName} ${author.lastName} ${author.studentNumber ? `(${author.studentNumber})` : ''}`
          )
          .join(', '),
    },
    {
      field: 'status',
      headerName: t('statusHeader'),
      width: 100,
    },
    {
      field: 'startDate',
      headerName: t('startDateHeader'),
      sortable: false,
      width: 140,
      valueGetter: (_, row) => dayjs(row.startDate).format('YYYY-MM-DD'),
    },
    {
      field: 'targetDate',
      headerName: t('targetDateHeader'),
      description: 'This column has a value getter and is not sortable.',
      sortable: false,
      width: 140,
      valueGetter: (_, row) => dayjs(row.targetDate).format('YYYY-MM-DD'),
    },
  ]

  const initializeNewThesis = () => {
    const favoritePrograms = programs.filter((program) => program.isFavorite)
    const otherPrograms = programs.filter((program) => !program.isFavorite)

    const sortedFavoritePrograms = getSortedPrograms(favoritePrograms, language)
    const sortedOtherPrograms = getSortedPrograms(otherPrograms, language)

    const programOptions = [...sortedFavoritePrograms, ...sortedOtherPrograms]

    setNewThesis({
      programId: programOptions[0].id,
      studyTrackId: programOptions[0].studyTracks[0]?.id,
      supervisions: [
        {
          user,
          percentage: 100,
          isExternal: false,
          isPrimarySupervisor: true,
        },
      ],
      authors: [],
      graders: [{ user, isPrimaryGrader: true, isExternal: false }],
      topic: '',
      status: 'PLANNING',
      startDate: dayjs().format('YYYY-MM-DD'),
      targetDate: dayjs().add(1, 'year').format('YYYY-MM-DD'),
    })
  }

  const initializeThesisDelete = () => {
    const thesisToDelete = theses.find(
      (thesis) => thesis.id === rowSelectionModel[0]
    )

    setDeletedThesis(thesisToDelete)
    setDeleteDialogOpen(true)
  }

  const initializeThesisEdit = () => {
    const thesisToEdit = theses.find(
      (thesis) => thesis.id === rowSelectionModel[0]
    )

    setEditedThesis(thesisToEdit)
  }

  const clearRowSelection = () => {
    setRowSelectionModel([])
  }

  return (
    <Stack spacing={3} sx={{ p: '1rem', width: '100%', maxWidth: '1920px' }}>
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
          autoHeight
          hideFooterSelectedRowCount
          pageSizeOptions={[100]}
          getRowHeight={() => 44}
          columnHeaderHeight={36}
          rowSelectionModel={rowSelectionModel}
          onRowSelectionModelChange={(newSelection: GridRowSelectionModel) =>
            setRowSelectionModel(newSelection)
          }
          slots={{
            toolbar: ThesisToolbar,
            footer: ViewThesisFooter as DataGridProps['slots']['footer'],
          }}
          slotProps={{
            toolbar: {
              createNewThesis: initializeNewThesis,
            },
            footer: {
              rowSelectionModel,
              handleEditThesis: initializeThesisEdit,
              handleDeleteThesis: initializeThesisDelete,
            },
          }}
          sx={{
            border: 'none',
            width: '100%',
            fontSize: '10pt',
            '& .MuiDataGrid-columnHeader': {
              backgroundColor: '#E1E4E8',
            },
            '& .MuiDataGrid-filler': {
              backgroundColor: '#E1E4E8',
            },
            '& .MuiDataGrid-columnHeaderTitle': {
              fontWeight: 500,
              fontFamily: 'Roboto',
            },
            '& .MuiDataGrid-row': {
              borderLeft: '1px solid #E1E4E8',
              borderRight: '1px solid #E1E4E8',
            },
          }}
        />
      </Box>
      {editedTesis && (
        <ThesisEditForm
          programs={programs ?? []}
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
          programs={programs ?? []}
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
            setDeleteConfirmation('')
          }}
          onDelete={async () => {
            setDeleteDialogOpen(false)
            setDeletedThesis(null)
            setDeleteConfirmation('')

            clearRowSelection()

            await deleteThesis(deletedThesis.id)
          }}
          title={t('removeThesisTitle')}
          deleteDisabled={
            deleteConfirmation?.toLowerCase() !==
            deletedThesis.topic.toLowerCase()
          }
        >
          <Box>
            {t('removeThesisConfirmationContent', {
              topic: deletedThesis.topic,
            })}

            <Box component="form" noValidate autoComplete="off" sx={{ mt: 4 }}>
              <Typography variant="body2" color="textSecondary">
                <Trans
                  i18nKey="removeConfirmation"
                  values={{ confirmationText: deletedThesis.topic }}
                />
              </Typography>
              <TextField
                id="delete-confirm-textfield"
                size="small"
                value={deleteConfirmation}
                onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                  setDeleteConfirmation(event.target.value)
                }}
                color="error"
                sx={{ mt: 2, width: '100%' }}
                InputProps={{
                  style: { borderRadius: '0.5rem' },
                }}
              />
            </Box>
          </Box>
        </DeleteConfirmation>
      )}
    </Stack>
  )
}

export default ThesesPage
