import dayjs from 'dayjs'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { cloneDeep } from 'lodash-es'

import PriorityHighIcon from '@mui/icons-material/PriorityHigh'
import {
  Box,
  IconButton,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material'
import {
  DataGrid,
  DataGridProps,
  GridColDef,
  GridRowSelectionModel,
  useGridApiRef,
} from '@mui/x-data-grid'
import { fiFI, enUS } from '@mui/x-data-grid/locales'

import {
  ProgramData,
  ThesisData as Thesis,
  TranslationLanguage,
} from '@backend/types'

import { usePaginatedTheses } from '../../hooks/useTheses'
import useLoggedInUser from '../../hooks/useLoggedInUser'
import {
  useCreateThesisMutation,
  useDeleteThesisMutation,
  useEditThesisMutation,
} from '../../hooks/useThesesMutation'
import usePrograms from '../../hooks/usePrograms'

import ThesisEditForm from './ThesisEditForm'
import ThesisToolbar from './ThesisToolbar'
import ViewThesisFooter from './ViewThesisFooter'
import StatusFilter from './Filters/StatusFilter'
import DeleteConfirmation from '../Common/DeleteConfirmation'

import { getSortedByName } from './util'

import { StatusLocale } from '../../types'

const PAGE_SIZE = 25

const ThesesPage = () => {
  const apiRef = useGridApiRef()
  const footerRef = useRef<HTMLDivElement>(null)
  const { t, i18n } = useTranslation()
  const { language } = i18n as { language: TranslationLanguage }
  const { user: currentUser, isLoading: loggedInUserLoading } =
    useLoggedInUser()

  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: PAGE_SIZE,
  })

  const [rowSelectionModel, setRowSelectionModel] =
    useState<GridRowSelectionModel>([])
  const [deleteConfirmation, setDeleteConfirmation] = useState<string>('')
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [editedTesis, setEditedThesis] = useState<Thesis | null>(null)
  const [deletedThesis, setDeletedThesis] = useState<Thesis | null>(null)
  const [newThesis, setNewThesis] = useState<Thesis | null>(null)
  const [showOnlyOwnTheses, setShowOnlyOwnTheses] = useState(true)

  const {
    theses,
    totalCount,
    isLoading: isThesesLoading,
  } = usePaginatedTheses({
    onlySupervised: showOnlyOwnTheses,
    offset: paginationModel.page * paginationModel.pageSize,
    limit: paginationModel.pageSize,
  })

  const { programs, isLoading: isProgramLoading } = usePrograms({
    includeNotManaged: true,
  })

  const { mutateAsync: editThesis } = useEditThesisMutation()
  const { mutateAsync: deleteThesis } = useDeleteThesisMutation()
  const { mutateAsync: createThesis } = useCreateThesisMutation()

  const dataGridLocale = language === 'fi' ? fiFI : enUS

  const rowCountRef = useRef(totalCount || 0)

  const rowCount = useMemo(() => {
    if (totalCount !== undefined) {
      rowCountRef.current = totalCount
    }
    return rowCountRef.current
  }, [totalCount])

  // Restore filters from user settings
  useEffect(() => {
    if (currentUser.thesesTableFilters) {
      apiRef.current.restoreState({
        filter: {
          filterModel: currentUser.thesesTableFilters,
        },
      })
    }
  }, [currentUser.thesesTableFilters])

  useEffect(() => {
    if (rowSelectionModel.length > 0) {
      footerRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [rowSelectionModel])

  const initializeThesisDelete = (thesisToDelete: Thesis) => {
    setDeletedThesis(thesisToDelete)
    setDeleteDialogOpen(true)
  }

  const initializeThesisEdit = (thesisToEdit: Thesis) => {
    // NOTE: We need to clone the object to
    // prevent the form from updating the original object
    setEditedThesis(cloneDeep(thesisToEdit))
  }

  const columns: GridColDef<Thesis>[] = [
    {
      field: 'more-actions',
      type: 'actions',
      headerName: '',
      sortable: false,
      renderCell: (params) => {
        const currUserIsApprover =
          currentUser &&
          params.row.approvers.find(
            (approver) => approver.id === currentUser.id
          )
        return (
          Boolean(currUserIsApprover) && (
            <Tooltip title={t('thesesPage:approvalRequiredTooltip')}>
              <IconButton
                aria-label="toggle-thesis-approver"
                type="button"
                color="primary"
                data-testid={`toggle-thesis-approver-button-${params.row.id}`}
                onClick={() => initializeThesisEdit(params.row)}
              >
                <PriorityHighIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )
        )
      },
    },
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
              `${author.lastName} ${author.firstName} ${author.studentNumber ? `(${author.studentNumber})` : ''}`
          )
          .join(', '),
    },
    {
      field: 'status',
      headerName: t('statusHeader'),
      width: 100,
      type: 'string',
      valueGetter: (_, row) => t(StatusLocale[row.status]),
      filterOperators: [
        {
          value: 'contains',
          getApplyFilterFn: (filterItem) => {
            if (filterItem.value == null || filterItem.value.length === 0) {
              return null
            }

            return (cellValue) =>
              filterItem.value.some(
                (filterValue: StatusLocale) => cellValue === t(filterValue) // the filterValue is a locale key
              )
          },
          InputComponent: StatusFilter,
        },
      ],
    },
    {
      field: 'startDate',
      headerName: t('startDateHeader'),
      filterable: false,
      width: 140,
      valueGetter: (_, row) => dayjs(row.startDate).format('YYYY-MM-DD'),
    },
    {
      field: 'targetDate',
      headerName: t('targetDateHeader'),
      description: 'This column has a value getter and is not sortable.',
      filterable: false,
      width: 140,
      valueGetter: (_, row) => dayjs(row.targetDate).format('YYYY-MM-DD'),
    },
  ]

  const skeletonRows: Thesis[] = Array.from({ length: 7 }).map((_, index) => ({
    programId: '',
    topic: '',
    authors: [],
    approvers: [],
    status: 'PLANNING',
    startDate: '',
    targetDate: '',
    supervisions: [],
    graders: [],
    id: index.toString(),
  }))

  const initializeNewThesis = () => {
    const favoritePrograms = programs.filter((program) => program.isFavorite)
    const otherPrograms = programs.filter((program) => !program.isFavorite)

    const sortedFavoritePrograms = getSortedByName(
      favoritePrograms,
      language
    ) as ProgramData[]
    const sortedOtherPrograms = getSortedByName(
      otherPrograms,
      language
    ) as ProgramData[]

    const programOptions = [...sortedFavoritePrograms, ...sortedOtherPrograms]

    setNewThesis({
      programId: programOptions[0].id,
      studyTrackId: programOptions[0].studyTracks[0]?.id,
      supervisions: [
        {
          user: currentUser,
          percentage: 100,
          isExternal: false,
          isPrimarySupervisor: true,
        },
      ],
      authors: [],
      approvers: [],
      graders: [
        { user: currentUser, isPrimaryGrader: true, isExternal: false },
      ],
      topic: '',
      status: 'PLANNING',
      startDate: dayjs().format('YYYY-MM-DD'),
      targetDate: dayjs().add(1, 'year').format('YYYY-MM-DD'),
    })
  }

  const clearRowSelection = () => {
    setRowSelectionModel([])
  }

  const isLoading = loggedInUserLoading || isThesesLoading || isProgramLoading
  return (
    <Stack spacing={3} sx={{ p: '1rem', width: '100%', maxWidth: '1920px' }}>
      <Box>
        <DataGrid
          autoHeight
          apiRef={apiRef}
          loading={isLoading}
          rows={isLoading ? skeletonRows : theses}
          rowCount={rowCount}
          getRowHeight={() => 44}
          columns={columns}
          columnHeaderHeight={36}
          hideFooterSelectedRowCount
          pageSizeOptions={[PAGE_SIZE]}
          paginationMode="server"
          paginationModel={paginationModel}
          onPaginationModelChange={(newModel) => setPaginationModel(newModel)}
          rowSelectionModel={rowSelectionModel}
          onRowSelectionModelChange={(newSelection: GridRowSelectionModel) => {
            setRowSelectionModel(newSelection)
          }}
          localeText={
            dataGridLocale.components.MuiDataGrid.defaultProps.localeText
          }
          slots={{
            toolbar: ThesisToolbar,
            footer: ViewThesisFooter as DataGridProps['slots']['footer'],
          }}
          slotProps={{
            toolbar: {
              createNewThesis: initializeNewThesis,
              toggleShowOnlyOwnTheses: () =>
                setShowOnlyOwnTheses((prev) => !prev),
              showOnlyOwnTheses,
            },
            footer: {
              footerRef,
              rowSelectionModel,
              handleEditThesis: initializeThesisEdit,
              handleDeleteThesis: initializeThesisDelete,
            },
            loadingOverlay: {
              variant: 'skeleton',
              noRowsVariant: 'skeleton',
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
            '& .MuiDataGrid-row:hover': {
              cursor: 'pointer',
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

            <Box sx={{ mt: 4 }}>
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
