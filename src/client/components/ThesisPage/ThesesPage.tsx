import dayjs from 'dayjs'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { cloneDeep } from 'lodash-es'

import { Box, Stack, TextField, Typography } from '@mui/material'
import {
  PaginationState,
  RowSelectionState,
  SortingState,
  ColumnFiltersState,
} from '@tanstack/react-table'

import { ThesisData as Thesis } from '@backend/validators/thesisResponse'

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

import ThesisTable, { DEFAULT_PAGE_SIZE } from './ThesisTable'

interface Props {
  filteringProgramId?: string
  filteringStudyTrackId?: string
  filteringDepartmentId?: string
  noOwnThesesSwitch?: boolean
  noAddThesisButton?: boolean
  onlySeminarSupervised?: boolean
  isStudentView?: boolean
  showSupervisors?: boolean
  showMilestonePercentage?: boolean
  filteringStatuses?: string[]
  hideFiltering?: boolean
  hideStudentStartedEthesis?: boolean
  showEthesisDateColumn?: boolean
  hideEdit?: boolean
  hideDelete?: boolean
  showGraders?: boolean
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
  showMilestonePercentage = false,
  filteringStatuses,
  hideFiltering = false,
  hideStudentStartedEthesis = false,
  showEthesisDateColumn = false,
  hideEdit = false,
  hideDelete = false,
  showGraders = false,
}: Props) => {
  const footerRef = useRef<HTMLDivElement>(null)
  const { t } = useTranslation()
  const { user: currentUser, hasStaffAccess } = useLoggedInUser()

  const [paginationModel, setPaginationModel] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: DEFAULT_PAGE_SIZE,
  })

  const [rowSelectionModel, setRowSelectionModel] = useState<RowSelectionState>(
    {}
  )
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
  const [filterIsThesisLate, setFilterIsThesisLate] = useState<boolean>(false)
  const [filterIsThesisVeryLate, setFilterIsThesisVeryLate] =
    useState<boolean>(false)

  const [searchQuery, setSearchQuery] = useState('')

  const [order, setOrder] = useState({})

  const [, setCurrentFilters] = useState(null)

  const thesesQueryParams = {
    order,
    programId: filteringProgramId,
    studyTrackId: filteringStudyTrackId,
    departmentId: filteringDepartmentId,
    status: filterStatus || filteringStatuses,
    missingSecondGrader: filterMissingSecondGrader,
    lastMilestone: filterLastMilestone,
    ethesisReadyStudentStarted: filterEthesisReadyStudentStarted,
    hideStudentStartedEthesis,
    isThesisLate: filterIsThesisLate,
    isThesisVeryLate: filterIsThesisVeryLate,
    milestone: filterMilestone !== null ? filterMilestone : undefined,

    onlyAuthored: isStudentView,
    onlySupervised: isStudentView ? false : showOnlyOwnTheses,
    onlySeminarSupervised,
    offset: paginationModel.pageIndex * paginationModel.pageSize,
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
    if (Object.keys(rowSelectionModel).some((id) => rowSelectionModel[id])) {
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
    setRowSelectionModel({})
  }

  const onFilterChange = useCallback((filterModel: ColumnFiltersState) => {
    // reset all filters first
    setFilterStatus(null)
    setFilterMilestone(null)
    setFilterMissingSecondGrader(false)
    setFilterLastMilestone(false)
    setFilterEthesisReadyStudentStarted(false)
    setFilterIsThesisLate(false)
    setFilterIsThesisVeryLate(false)

    setCurrentFilters(filterModel)

    if (filterModel.length === 0) {
      return
    }

    filterModel.forEach((item) => {
      switch (item.id) {
        case 'status':
          setFilterStatus(item.value as string)
          break
        case 'milestone':
          setFilterMilestone(item.value as string)
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
        case 'isThesisLate':
          setFilterIsThesisLate(true)
          break
        case 'isThesisVeryLate':
          setFilterIsThesisVeryLate(true)
          break

        default:
          break
      }
    })
  }, [])

  const handleSortModelChange = useCallback((sortModel: SortingState) => {
    if (sortModel.length === 0) {
      setOrder({})
      return
    }
    setOrder({
      sortBy: sortModel[0].id,
      sortOrder: sortModel[0].desc ? 'desc' : 'asc',
    })
  }, [])

  return (
    <Stack spacing={3} sx={{ px: 3, width: '100%', maxWidth: '1920px' }}>
      {showDurationColumn && averageDuration != null && (
        <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
          {t('averageDuration', { days: averageDuration })}
        </Typography>
      )}

      <Box>
        <ThesisTable
          rows={theses ?? []}
          isLoading={isThesesLoading}
          totalCount={totalCount}
          selection={rowSelectionModel}
          onFilterChange={onFilterChange}
          onPaginationChange={(newModel: PaginationState) =>
            setPaginationModel(newModel)
          }
          onSelection={(newSelection: RowSelectionState) => {
            setRowSelectionModel(newSelection)
          }}
          onSearch={(value: string) => {
            setSearchQuery(value)
          }}
          onSortingChange={handleSortModelChange}
          user={currentUser}
          hideFiltering={hideFiltering}
          isStudentView={isStudentView}
          initializeNewThesis={initializeNewThesis}
          availableMilestones={availableMilestones}
          noAddThesisButton={noAddThesisButton}
          showSupervisors={showSupervisors}
          showGraders={showGraders}
          showMilestonePercentage={
            showMilestonePercentage && theses?.some((t) => t.milestone != null)
          }
          showEthesisDateColumn={showEthesisDateColumn}
          onExportCsv={() =>
            exportCsv(`theses-export-${dayjs().format('YYYY-MM-DD')}.csv`)
          }
          filterViews={
            hideFiltering
              ? []
              : [
                  {
                    items:
                      filteringStatuses && filteringStatuses.length > 0
                        ? {
                            ...filteringStatuses.reduce(
                              (acc, status) => {
                                let key = status.toLowerCase()
                                if (key === 'ethesis_sent') key = 'ethesisSent'

                                acc[key] = {
                                  filterModel: [
                                    {
                                      id: 'status',
                                      value: status,
                                    },
                                  ],
                                  sortingModel: [
                                    { id: 'startDate', desc: true },
                                  ],
                                }
                                return acc
                              },
                              {} as Record<string, any>
                            ),
                            all: {
                              filterModel: {
                                items: [],
                              },
                              sortingModel: [
                                { field: 'startDate', sort: 'desc' },
                              ],
                            },
                          }
                        : {
                            active: {
                              filterModel: [
                                {
                                  id: 'status',
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
                              sortingModel: [{ id: 'startDate', desc: true }],
                            },
                            inactive: {
                              filterModel: [
                                {
                                  id: 'status',
                                  value: ['COMPLETED', 'CANCELLED'],
                                },
                              ],
                              sortingModel: [{ id: 'targetDate', desc: true }],
                            },
                            all: {
                              filterModel: [],
                              sortingModel: [{ id: 'startDate', desc: true }],
                            },
                          },
                  },
                  {
                    label: t('thesesTableToolbar:actionNeeded'),
                    items: {
                      ...(availableActionNeeded?.suggested
                        ? {
                            suggested: {
                              filterModel: [
                                {
                                  id: 'status',
                                  value: ['SUGGESTED'],
                                },
                              ],
                              sortingModel: [{ id: 'startDate', desc: true }],
                            },
                          }
                        : {}),
                      ...(availableActionNeeded?.missingSecondGrader
                        ? {
                            missingSecondGrader: {
                              filterModel: [
                                {
                                  id: 'missingSecondGrader',
                                  value: true,
                                },
                              ],
                              sortingModel: [{ id: 'startDate', desc: true }],
                            },
                          }
                        : {}),
                      ...(availableActionNeeded?.lastMilestone
                        ? {
                            lastMilestone: {
                              filterModel: [
                                {
                                  id: 'lastMilestone',
                                  value: true,
                                },
                              ],
                              sortingModel: [{ id: 'startDate', desc: true }],
                            },
                          }
                        : {}),
                      ...(availableActionNeeded?.ethesisReadyStudentStarted
                        ? {
                            ethesisReadyStudentStarted: {
                              filterModel: [
                                {
                                  id: 'ethesisReadyStudentStarted',
                                  value: true,
                                },
                              ],
                              sortingModel: [{ id: 'startDate', desc: true }],
                            },
                          }
                        : {}),
                      ...(availableActionNeeded?.isThesisLate
                        ? {
                            isThesisLate: {
                              filterModel: [
                                {
                                  id: 'isThesisLate',
                                  value: true,
                                },
                              ],
                              sortingModel: [{ id: 'targetDate', desc: false }],
                            },
                          }
                        : {}),
                      ...(availableActionNeeded?.isThesisVeryLate
                        ? {
                            isThesisVeryLate: {
                              filterModel: [
                                {
                                  id: 'isThesisVeryLate',
                                  value: true,
                                },
                              ],
                              sortingModel: [{ id: 'targetDate', desc: false }],
                            },
                          }
                        : {}),
                    },
                  },
                ].filter((group) => Object.keys(group.items).length > 0)
          }
        ></ThesisTable>
        <Box ref={footerRef}>
          <ViewThesisFooter
            footerRef={footerRef}
            rowSelectionModel={rowSelectionModel}
            handleEditThesis={initializeThesisEdit}
            handleDeleteThesis={initializeThesisDelete}
            isStudentView={isStudentView}
            onlySeminarSupervised={onlySeminarSupervised}
            hideEdit={hideEdit}
            hideDelete={hideDelete}
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
