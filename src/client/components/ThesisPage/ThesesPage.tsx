import dayjs from 'dayjs'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { cloneDeep } from 'lodash-es'

import { Box, Stack, TextField, Typography } from '@mui/material'
import {
  GridFilterModel,
  GridRowId,
  GridRowSelectionModel,
  GridSortModel,
} from '@mui/x-data-grid'

import { ThesisData as Thesis } from '@backend/types'

import { usePaginatedTheses, useExportThesesCsv } from '../../hooks/useTheses'
import useLoggedInUser from '../../hooks/useLoggedInUser'
import {
  useCreateThesisMutation,
  useDeleteThesisMutation,
  useEditThesisMutation,
} from '../../hooks/useThesesMutation'
import usePrograms from '../../hooks/usePrograms'

import ThesisEditForm from './ThesisEditForm'
import ViewThesisFooter from './ViewThesisFooter'
import Popup from '../Common/Popup'
import { useDebounce } from '../../hooks/useDebounce'

import PrethesisTable, {
  DEFAULT_PAGE_SIZE,
} from '../PrethesisTable/PrethesisTable'

interface Props {
  filteringProgramId?: string
  filteringStudyTrackId?: string
  filteringDepartmentId?: string
  noOwnThesesSwitch?: boolean
  noAddThesisButton?: boolean
  onlySeminarSupervised?: boolean
  isStudentView?: boolean
  showSupervisors?: boolean
}
const ThesesPage = ({
  filteringProgramId,
  filteringStudyTrackId,
  filteringDepartmentId,
  noOwnThesesSwitch,
  noAddThesisButton,
  onlySeminarSupervised = false,
  isStudentView = false,
  showSupervisors = false,
}: Props) => {
  const footerRef = useRef<HTMLDivElement>(null)
  const { t } = useTranslation()
  const { user: currentUser, hasStaffAccess } = useLoggedInUser()

  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: DEFAULT_PAGE_SIZE,
  })

  const [rowSelectionModel, setRowSelectionModel] =
    useState<GridRowSelectionModel>({
      type: 'include', // or 'exclude'
      ids: new Set<GridRowId>([]),
    })
  const [deleteConfirmation, setDeleteConfirmation] = useState<string>('')
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [editedThesis, setEditedThesis] = useState<Thesis | null>(null)
  const [deletedThesis, setDeletedThesis] = useState<Thesis | null>(null)

  const [newThesis, setNewThesis] = useState<Thesis | null>(null)
  const [showOnlyOwnTheses] = useState(!noOwnThesesSwitch)

  const [filterStatus, setFilterStatus] = useState<string | null>(null)
  const [filterMilestone, setFilterMilestone] = useState<string | null>(null)
  const [filterMissingSecondGrader, setFilterMissingSecondGrader] =
    useState<boolean>(false)
  const [filterLastMilestone, setFilterLastMilestone] = useState<boolean>(false)
  const [
    filterEthesisReadyStudentStarted,
    setFilterEthesisReadyStudentStarted,
  ] = useState<boolean>(false)

  const [filterTopic, setFilterTopic] = useState<string | null>(null)
  const [filterAuthors, setFilterAuthors] = useState<string | null>(null)
  const [filterProgramName, setFilterProgramName] = useState<string | null>(
    null
  )
  const debouncedFilterTopic = useDebounce(filterTopic, 500)
  const debouncedFilterAuthors = useDebounce(filterAuthors, 500)
  const debouncedFilterProgramName = useDebounce(filterProgramName, 500)

  const [searchQuery, setSearchQuery] = useState('')

  const [order, setOrder] = useState({})

  const [, setCurrentFilters] = useState(null)

  const thesesQueryParams = {
    order,
    programId: filteringProgramId,
    studyTrackId: filteringStudyTrackId,
    departmentId: filteringDepartmentId,
    status: filterStatus,
    missingSecondGrader: filterMissingSecondGrader,
    lastMilestone: filterLastMilestone,
    ethesisReadyStudentStarted: filterEthesisReadyStudentStarted,
    milestone: filterMilestone !== null ? filterMilestone : undefined,
    topicPartial: debouncedFilterTopic,
    authorsPartial: debouncedFilterAuthors,
    programNamePartial: debouncedFilterProgramName,
    onlyAuthored: isStudentView,
    onlySupervised: isStudentView ? false : showOnlyOwnTheses,
    onlySeminarSupervised,
    offset: paginationModel.page * paginationModel.pageSize,
    limit: paginationModel.pageSize,
    useStudentApi: isStudentView && currentUser?.hasStudyRight,
    search: searchQuery.length > 0 ? searchQuery : undefined,
  }

  const {
    theses,
    totalCount,
    availableMilestones,
    availableActionNeeded,
    isLoading: isThesesLoading,
  } = usePaginatedTheses(thesesQueryParams)

  const { exportCsv } = useExportThesesCsv(thesesQueryParams)

  const showDurationColumn = useMemo(
    () =>
      currentUser?.isAdmin &&
      filterStatus != null &&
      (Array.isArray(filterStatus)
        ? filterStatus.length === 1 && filterStatus[0] === 'COMPLETED'
        : filterStatus === 'COMPLETED'),
    [currentUser?.isAdmin, filterStatus]
  )

  const averageDuration = useMemo(() => {
    if (!showDurationColumn || !theses?.length) return null
    const durations = theses
      .filter((t) => t.startDate && t.targetDate)
      .map((t) => dayjs(t.targetDate).diff(dayjs(t.startDate), 'day'))
    return durations.length
      ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
      : null
  }, [theses, showDurationColumn])

  const { programs } = usePrograms({
    includeNotManaged: true,
    enabled: hasStaffAccess || isStudentView,
    useStudentApi: isStudentView,
  })
  const managedPrograms = useMemo(
    () =>
      (programs ?? []).filter((program) => isStudentView || program.isManaged),
    [programs, isStudentView]
  )

  const { mutateAsync: editThesis } = useEditThesisMutation(isStudentView)
  const { mutateAsync: deleteThesis } = useDeleteThesisMutation(isStudentView)
  const { mutateAsync: createThesis } = useCreateThesisMutation(isStudentView)

  useEffect(() => {
    if (rowSelectionModel.ids && rowSelectionModel.ids.size > 0) {
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

  const initializeNewThesis = () => {
    if (isStudentView) {
      setNewThesis({
        programId: managedPrograms.length == 1 ? managedPrograms[0].id : null,
        studyTrackId: null,
        supervisions: [],
        seminarSupervisions: [],
        authors: [currentUser],
        approvers: [],
        graders: [],
        topic: '',
        status: 'DRAFT',
        startDate: dayjs().format('YYYY-MM-DD'),
        targetDate: dayjs().add(1, 'year').format('YYYY-MM-DD'),
      })
      return
    }

    if (!managedPrograms.length) return

    const favoritePrograms = managedPrograms.filter(
      (program) => program.isFavorite
    )
    const otherPrograms = managedPrograms.filter(
      (program) => !program.isFavorite
    )

    const programOptions = [...favoritePrograms, ...otherPrograms]

    setNewThesis({
      programId: programOptions[0].id,
      studyTrackId: programOptions[0]?.studyTracks?.[0]?.id ?? null,
      supervisions: [
        {
          user: currentUser,
          percentage: 100,
          isExternal: false,
          isPrimarySupervisor: true,
        },
      ],
      seminarSupervisions: [],
      authors: [],
      approvers: [],
      graders: [
        { user: currentUser, isPrimaryGrader: true, isExternal: false },
      ],
      topic: '',
      status: programOptions[0]?.options?.allowStudentStartedProcess
        ? 'DRAFT'
        : 'PLANNING',
      startDate: dayjs().format('YYYY-MM-DD'),
      targetDate: dayjs().add(1, 'year').format('YYYY-MM-DD'),
    })
  }

  const clearRowSelection = () => {
    setRowSelectionModel([])
  }

  const onFilterChange = useCallback((filterModel: GridFilterModel) => {
    // reset all filters first
    setFilterStatus(null)
    setFilterMilestone(null)
    setFilterMissingSecondGrader(false)
    setFilterLastMilestone(false)
    setFilterEthesisReadyStudentStarted(false)
    setFilterTopic(null)
    setFilterAuthors(null)
    setFilterProgramName(null)

    setCurrentFilters(filterModel)

    if (filterModel.items.length === 0) {
      return
    }

    filterModel.items.forEach((item) => {
      switch (item.field) {
        case 'status':
          setFilterStatus(item.value)
          break
        case 'milestone':
          setFilterMilestone(item.value)
          break
        case 'missingSecondGrader':
          setFilterMissingSecondGrader(true)
          break
        case 'lastMilestone':
          setFilterLastMilestone(true)
          break
        case 'ethesisReadyStudentStarted':
          setFilterEthesisReadyStudentStarted(true)
          break
        case 'topic':
          setFilterTopic(item.value)
          break
        case 'authors':
          setFilterAuthors(item.value)
          break
        case 'programId':
          setFilterProgramName(item.value)
          break
        default:
          break
      }
    })
  }, [])

  const handleSortModelChange = useCallback((sortModel: GridSortModel) => {
    if (sortModel.length === 0) {
      setOrder({})
      return
    } else {
      setOrder({
        sortBy: sortModel[0].field,
        sortOrder: sortModel[0].sort,
      })
    }
  }, [])

  return (
    <Stack spacing={3} sx={{ px: 3, width: '100%', maxWidth: '1920px' }}>
      {showDurationColumn && averageDuration != null && (
        <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
          {t('averageDuration', { days: averageDuration })}
        </Typography>
      )}

      <Box>
        <PrethesisTable
          rows={theses ?? []}
          isLoading={isThesesLoading}
          totalCount={totalCount}
          selection={rowSelectionModel}
          onFilterChange={onFilterChange}
          onPaginationChange={(newModel) => setPaginationModel(newModel)}
          onSelection={(newSelection: GridRowSelectionModel) => {
            setRowSelectionModel(newSelection)
          }}
          onSearch={(value: string) => {
            setSearchQuery(value)
          }}
          onSortingChange={handleSortModelChange}
          user={currentUser}
          isStudentView={isStudentView}
          initializeNewThesis={initializeNewThesis}
          availableMilestones={availableMilestones}
          noAddThesisButton={noAddThesisButton}
          showSupervisors={showSupervisors}
          onExportCsv={() =>
            exportCsv(`theses-export-${dayjs().format('YYYY-MM-DD')}.csv`)
          }
          filterViews={[
            {
              items: {
                active: {
                  filterModel: {
                    items: [
                      {
                        field: 'status',
                        operator: 'isAnyOf',
                        value: [
                          'DRAFT',
                          'SUGGESTED',
                          'PLANNING',
                          'IN_PROGRESS',
                          'ETHESIS',
                          'ETHESIS_SENT',
                        ],
                      },
                    ],
                  },
                  sortingModel: [
                    {
                      field: 'startDate',
                      sort: 'desc',
                    },
                  ],
                },
                inactive: {
                  filterModel: {
                    items: [
                      {
                        field: 'status',
                        operator: 'isAnyOf',
                        value: ['COMPLETED', 'CANCELLED'],
                      },
                    ],
                  },
                  sortingModel: [
                    {
                      field: 'targetDate',
                      sort: 'desc',
                    },
                  ],
                },
                all: {
                  filterModel: {
                    items: [],
                  },
                  sortingModel: [
                    {
                      field: 'startDate',
                      sort: 'desc',
                    },
                  ],
                },
              },
            },
            {
              label: t('thesesTableToolbar:actionNeeded'),
              items: {
                ...(availableActionNeeded?.suggested
                  ? {
                      suggested: {
                        filterModel: {
                          items: [
                            {
                              field: 'status',
                              operator: 'isAnyOf',
                              value: ['SUGGESTED'],
                            },
                          ],
                        },
                        sortingModel: [
                          {
                            field: 'startDate',
                            sort: 'desc',
                          },
                        ],
                      },
                    }
                  : {}),
                ...(availableActionNeeded?.missingSecondGrader
                  ? {
                      missingSecondGrader: {
                        filterModel: {
                          items: [
                            {
                              field: 'missingSecondGrader',
                              operator: 'is',
                              value: true,
                            },
                          ],
                        },
                        sortingModel: [
                          {
                            field: 'startDate',
                            sort: 'desc',
                          },
                        ],
                      },
                    }
                  : {}),
                ...(availableActionNeeded?.lastMilestone
                  ? {
                      lastMilestone: {
                        filterModel: {
                          items: [
                            {
                              field: 'lastMilestone',
                              operator: 'is',
                              value: true,
                            },
                          ],
                        },
                        sortingModel: [
                          {
                            field: 'startDate',
                            sort: 'desc',
                          },
                        ],
                      },
                    }
                  : {}),
                ...(availableActionNeeded?.ethesisReadyStudentStarted
                  ? {
                      ethesisReadyStudentStarted: {
                        filterModel: {
                          items: [
                            {
                              field: 'ethesisReadyStudentStarted',
                              operator: 'is',
                              value: true,
                            },
                          ],
                        },
                        sortingModel: [
                          {
                            field: 'startDate',
                            sort: 'desc',
                          },
                        ],
                      },
                    }
                  : {}),
              },
            },
          ].filter((group) => Object.keys(group.items).length > 0)}
        ></PrethesisTable>
        <Box ref={footerRef}>
          <ViewThesisFooter
            rowSelectionModel={rowSelectionModel}
            handleEditThesis={initializeThesisEdit}
            handleDeleteThesis={initializeThesisDelete}
            isStudentView={isStudentView}
            onlySeminarSupervised={onlySeminarSupervised}
          ></ViewThesisFooter>
        </Box>
      </Box>
      {editedThesis && (
        <ThesisEditForm
          programs={
            programs?.filter(
              (p) =>
                isStudentView || p.isManaged || p.id === editedThesis.programId
            ) ?? []
          }
          formTitle={t('thesisForm:editThesisFormTitle')}
          initialThesis={editedThesis}
          onSubmit={async (updatedThesis) => {
            await editThesis({ thesisId: editedThesis.id, data: updatedThesis })
            setEditedThesis(null)
          }}
          onClose={() => setEditedThesis(null)}
          isStudentView={isStudentView}
        />
      )}
      {newThesis && (
        <ThesisEditForm
          programs={managedPrograms}
          formTitle={t('thesisForm:newThesisFormTitle')}
          initialThesis={newThesis}
          onSubmit={async (variables) => {
            await createThesis(variables)
            setNewThesis(null)
          }}
          onClose={() => setNewThesis(null)}
          isStudentView={isStudentView}
        />
      )}

      {deletedThesis && (
        <Popup
          open={deleteDialogOpen}
          onClose={() => {
            setDeleteDialogOpen(false)
            setDeletedThesis(null)
            setDeleteConfirmation('')
          }}
          onSubmit={async () => {
            setDeleteDialogOpen(false)
            setDeletedThesis(null)
            setDeleteConfirmation('')

            clearRowSelection()

            await deleteThesis(deletedThesis.id)
          }}
          title={t('removeThesisTitle')}
          submitText={t('common:deleteButton')}
          submitColor="error"
          cancelText={t('common:cancelButton')}
          submitDisabled={
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
                style={{ borderRadius: '0.5rem' }}
              />
            </Box>
          </Box>
        </Popup>
      )}
    </Stack>
  )
}

export default ThesesPage
