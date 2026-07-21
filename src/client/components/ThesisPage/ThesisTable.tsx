import * as React from 'react'

import {
  createColumnHelper,
  getCoreRowModel,
  useReactTable,
  CellContext,
} from '@tanstack/react-table'

import { LoggedInUser as User } from '@backend/validators/userResponse'
import { TranslationLanguage } from '@backend/validators/departmentResponse'
import { ProgramData } from '@backend/validators/programResponse'
import { ThesisData as Thesis } from '@backend/validators/thesisResponse'

import Chip from '@mui/material/Chip'
import {
  Box,
  Button,
  Checkbox,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Menu,
  MenuItem,
  Stack,
  TextField,
  Tooltip,
  Typography,
  Select,
  FormControl,
  InputLabel,
  Tabs,
  Tab,
} from '@mui/material'
import { useTranslation } from 'react-i18next'
import { StatusLocale } from '../../types'
import dayjs from 'dayjs'
import {
  PriorityHigh,
  Star,
  MoreVert as MoreVertIcon,
  Bedtime,
  Close,
  Check,
  Download,
} from '@mui/icons-material'
import usePrograms from '../../hooks/usePrograms'
import { PrethesisHelp } from '../PrethesisHelp/PrethesisHelp'
import { useChangeThesisStatusMutation } from '../../hooks/useThesesMutation'
import {
  canApprove,
  canSetEthesisMilestones,
  needsStudentAction,
  needsEthesisAdminAction,
} from '../../util/permissions'
import { THESIS_STATUSES } from '../../../config'
import Popup from '../Common/Popup'

import PrethesisTable from '../Common/PrethesisTable'

declare module '@tanstack/react-table' {
  interface ColumnMeta<TData, TValue> {
    getCellContext: (context: CellContext<TData, TValue>) => any | void
  }
}

const columnHelper = createColumnHelper<Thesis>()

export const DEFAULT_PAGE_SIZE = 25

interface Props {
  rows: Thesis[]
  isLoading?: boolean
  totalCount: number
  onFilterChange: any
  onSortingChange: any
  onPaginationChange: any
  onSelection: any
  onSearch: any
  selection: any
  user: User
  filterViews: any
  initializeNewThesis: any
  isStudentView: boolean
  noAddThesisButton: boolean
  showSupervisors?: boolean
  availableMilestones?: number[]
  onExportCsv?: () => void
  showMilestonePercentage?: boolean
  hideFiltering?: boolean
  showEthesisDateColumn?: boolean
  showGraders?: boolean
}

const ThesisTable = ({
  rows,
  isLoading,
  totalCount,
  selection,
  onFilterChange,
  onSortingChange,
  onPaginationChange,
  onSelection,
  onSearch,
  user,
  filterViews,
  noAddThesisButton,
  initializeNewThesis,
  isStudentView,
  showSupervisors,
  availableMilestones = [],
  onExportCsv,
  showMilestonePercentage,
  hideFiltering = false,
  showEthesisDateColumn = false,
  showGraders = false,
}: Props) => {
  const { t, i18n } = useTranslation()
  const { language } = i18n as { language: TranslationLanguage }

  /* Pagination */
  const [pageNumber, setPageNumber] = React.useState(0)
  const [pageSize, setPageSize] = React.useState(DEFAULT_PAGE_SIZE)

  const changePage = React.useCallback(
    (page: number) => {
      setPageNumber(page)
      onPaginationChange({ page, pageSize })
    },
    [pageSize, onPaginationChange]
  )

  const { mutateAsync: changeThesisStatus } =
    useChangeThesisStatusMutation(isStudentView)
  const [pendingAction, setPendingAction] = React.useState<
    'approve' | 'newThesis' | null
  >(null)
  const [bulkSelection, setBulkSelection] = React.useState<Map<string, Thesis>>(
    new Map()
  )

  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null)
  const openMenu = Boolean(anchorEl)
  const handleMenuClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget)
  }
  const handleMenuClose = () => {
    setAnchorEl(null)
  }

  const handleNewThesisClick = () => {
    if (isStudentView) {
      setPendingAction('newThesis')
    } else {
      initializeNewThesis()
    }
  }

  /* FilterView */
  const getFirstFilterView = () => {
    if (!filterViews || !Array.isArray(filterViews) || filterViews.length === 0)
      return null
    return Object.keys(filterViews[0].items)[0]
  }

  const getFilterViewData = (viewId: string | null) => {
    if (!filterViews || !Array.isArray(filterViews) || !viewId) return null
    for (const group of filterViews) {
      if (group.items[viewId]) return group.items[viewId]
    }
    return null
  }

  const [activeBaseView, setActiveBaseView] = React.useState(
    !isStudentView ? getFirstFilterView() : null
  )
  const [activeToggles, setActiveToggles] = React.useState<string[]>([])

  const [debounceTimeout, setDebounceTimeout] = React.useState<any>(null)

  const [activeMilestoneFilter, setActiveMilestoneFilter] = React.useState<
    string | null
  >('all')

  const getCombinedFilterItems = (
    baseView: string | null,
    toggles: string[],
    milestone: string | null
  ) => {
    const items: any[] = []

    const baseData = getFilterViewData(baseView)
    if (baseData) items.push(...baseData.filterModel.items)

    for (const t of toggles) {
      const toggleData = getFilterViewData(t)
      if (toggleData) items.push(...toggleData.filterModel.items)
    }

    if (milestone && milestone !== 'all') {
      items.push({
        field: 'milestone',
        operator: 'equals',
        value: milestone,
      })
    }

    return items
  }

  if (!isStudentView) {
    React.useEffect(() => {
      const data = getFilterViewData(activeBaseView)
      if (data) {
        onFilterChange({
          items: getCombinedFilterItems(
            activeBaseView,
            activeToggles,
            activeMilestoneFilter
          ),
        })
        onSortingChange(data.sortingModel)
      }
    }, [])
  }

  /* Sorting */
  const activeData =
    !isStudentView && activeBaseView ? getFilterViewData(activeBaseView) : null

  const [sortedField, setSortedField] = React.useState<string | null>(
    activeData?.sortingModel[0]?.field || null
  )
  const [sortedDir, setSortedDir] = React.useState<'asc' | 'desc'>(
    activeData?.sortingModel[0]?.sort || 'asc'
  )

  const handleSortChange = (field: string, dir: 'asc' | 'desc') => {
    setSortedField(field)
    setSortedDir(dir)
    onSortingChange([
      {
        field,
        sort: dir,
      },
    ])
  }

  /* New thesis button */
  const { programs, isLoading: programsLoading } = !isStudentView
    ? usePrograms({
        includeNotManaged: true,
      })
    : { programs: [] as ProgramData[], isLoading: false }

  const favoritePrograms =
    programs?.filter((p) => user?.favoriteProgramIds?.includes(p.id)) || []
  const allFavProgramsAllowStudentStarted =
    favoritePrograms.length > 0 &&
    favoritePrograms.every((p) => p.options?.allowStudentStartedProcess)

  const showHiddenNewThesisButton =
    (programsLoading || allFavProgramsAllowStudentStarted) && !isStudentView

  /* Selection */
  const isSelected = (value: string) =>
    selection.ids && selection.ids.size > 0 ? selection.ids.has(value) : false

  const eligibleRows = React.useMemo(() => {
    return rows.filter((row) => canApprove(row, user))
  }, [rows, user])

  const previousData = React.useRef({
    rowCount: pageSize,
    totalCount: totalCount || 0,
    eligibleRowsLength: 0,
    rows: [] as Thesis[],
  })

  React.useEffect(() => {
    if (!isLoading) {
      previousData.current.rowCount = rows.length
      previousData.current.eligibleRowsLength = eligibleRows.length
      if (rows.length > 0) {
        previousData.current.rows = rows
      }
    }
    if (totalCount !== undefined) {
      previousData.current.totalCount = totalCount
    }
  }, [isLoading, rows.length, eligibleRows.length, totalCount])

  const skeletonCount =
    rows.length > 0 ? rows.length : Math.max(1, previousData.current.rowCount)

  const hasEligibleRowsToDisplay =
    isLoading && rows.length === 0
      ? previousData.current.eligibleRowsLength > 0
      : eligibleRows.length > 0

  const columns = [
    ...(isStudentView || (!hasEligibleRowsToDisplay && bulkSelection.size === 0)
      ? []
      : [
          columnHelper.display({
            id: 'select',
            size: 50,
            enableSorting: false,
            header: () => {
              const allSelected =
                eligibleRows.length > 0 &&
                eligibleRows.every((row) => bulkSelection.has(row.id))
              const someSelected =
                eligibleRows.some((row) => bulkSelection.has(row.id)) &&
                !allSelected

              return eligibleRows.length > 0 || bulkSelection.size > 0 ? (
                <Checkbox
                  size="small"
                  checked={
                    allSelected ||
                    (eligibleRows.length === 0 && bulkSelection.size > 0)
                  }
                  indeterminate={
                    someSelected ||
                    (eligibleRows.length === 0 && bulkSelection.size > 0)
                  }
                  onChange={(e) => {
                    if (e.target.checked) {
                      const newSelection = new Map(bulkSelection)
                      eligibleRows.forEach((row) =>
                        newSelection.set(row.id, row)
                      )
                      setBulkSelection(newSelection)
                    } else {
                      if (eligibleRows.length === 0) {
                        setBulkSelection(new Map())
                      } else {
                        const newSelection = new Map(bulkSelection)
                        eligibleRows.forEach((row) =>
                          newSelection.delete(row.id)
                        )
                        setBulkSelection(newSelection)
                      }
                    }
                  }}
                />
              ) : null
            },
            cell: ({ row }) => {
              const isEligible = canApprove(row.original, user)
              if (!isEligible) return null
              return (
                <Checkbox
                  size="small"
                  checked={bulkSelection.has(row.original.id)}
                  onChange={(e) => {
                    const newSelection = new Map(bulkSelection)
                    if (e.target.checked) {
                      newSelection.set(row.original.id, row.original)
                    } else {
                      newSelection.delete(row.original.id)
                    }
                    setBulkSelection(newSelection)
                  }}
                  onClick={(e) => e.stopPropagation()}
                />
              )
            },
          }),
        ]),
    columnHelper.accessor('program', {
      id: 'programId',
      size: 5,
      enableSorting: !isStudentView,
      cell: (info) => {
        const data = info.getValue()
        return data ? (
          <>
            <Tooltip title={data.name[language]}>
              <Chip
                label={data.id}
                variant="outlined"
                sx={{
                  fontFamily: 'monospace',
                }}
              />
            </Tooltip>
          </>
        ) : (
          ''
        )
      },
      header: t('programHeader'),
      enableResizing: true,
    }),
    columnHelper.accessor('topic', {
      size: 800,
      enableSorting: !isStudentView,
      cell: (info) => (
        <Typography variant="small">{info.getValue()}</Typography>
      ),
      header: t('topicHeader'),
      enableResizing: true,
    }),
    columnHelper.accessor('authors', {
      size: 300,
      enableSorting: !isStudentView,
      cell: (info) => (
        <Typography variant="small">
          {info
            .getValue()
            .toSorted((a, b) => a.lastName.localeCompare(b.lastName))
            .map(
              (author) =>
                `${author.lastName} ${author.firstName} ${author.studentNumber ? `(${author.studentNumber})` : ''}`
            )
            .join(', ')}
        </Typography>
      ),
      header: t('authorsHeader'),
      enableResizing: true,
    }),
    ...(showSupervisors
      ? [
          columnHelper.accessor('supervisions', {
            id: 'supervisor',
            size: 250,
            enableSorting: false,
            cell: (info) => (
              <Typography variant="small">
                {info
                  .getValue()
                  .map(
                    (supervision) =>
                      `${supervision.user?.lastName} ${supervision.user?.firstName}`
                  )
                  .join(', ')}
              </Typography>
            ),
            header: t('supervisorHeader'),
            enableResizing: true,
          }),
          columnHelper.accessor('supervisions', {
            id: 'supervisionPercentage',
            size: 100,
            enableSorting: false,
            cell: (info) => (
              <Typography variant="small">
                {info
                  .getValue()
                  .map((supervision) => `${supervision.percentage}%`)
                  .join(', ')}
              </Typography>
            ),
            header: t('supervisionPercentageHeader'),
            enableResizing: true,
          }),
        ]
      : []),
    ...(showGraders
      ? [
          columnHelper.accessor('graders', {
            id: 'graders',
            size: 200,
            enableSorting: false,
            cell: (info) => (
              <Typography variant="small">
                {info
                  .getValue()
                  .map(
                    (grader) =>
                      `${grader.user?.lastName} ${grader.user?.firstName}`
                  )
                  .join(', ')}
              </Typography>
            ),
            header: t('gradersHeader'),
            enableResizing: true,
          }),
        ]
      : []),
    columnHelper.accessor('status', {
      size: 50,
      enableSorting: !isStudentView,
      cell: (info) => {
        const status = info.getValue() as keyof typeof StatusLocale
        const isEthesisStudentStarted =
          status === 'ETHESIS' &&
          info.row.original?.program?.options?.allowStudentStartedProcess

        const translationKey = isEthesisStudentStarted
          ? 'thesisStages:ethesis_studentstarted'
          : StatusLocale[status]

        const targetDate = info.row.original?.targetDate

        const difference =
          targetDate && dayjs(targetDate).isBefore(dayjs())
            ? dayjs(targetDate).diff(dayjs(), 'day') * -1
            : 0

        const labelText = info.row.original?.isIdle
          ? `${t(translationKey)} (${t('thesisStages:idle')})`
          : difference >= 30 && info.row.original.status == 'IN_PROGRESS'
            ? `${t(translationKey)} (${t('thesisStages:late')})`
            : t(translationKey)

        return <Chip label={labelText} variant="outlined" sx={{}} />
      },
      meta: {
        getCellContext(context) {
          const status = context.row.original.status
          const useMilestones =
            context.row.original?.program?.options?.useMilestones

          const milestone = context.row.original?.milestone
          const milestone_version = context.row.original?.milestoneVersion

          const milestone_count =
            useMilestones && milestone_version != undefined
              ? context.row.original?.program?.options?.milestones?.versions?.[
                  milestone_version
                ]?.length
              : undefined

          return useMilestones &&
            milestone_count != undefined &&
            milestone != undefined &&
            status == 'IN_PROGRESS'
            ? {
                sx: {
                  div: {
                    backgroundColor: `hsl(100deg,${20 + (milestone / milestone_count) * 80}%,${100 - (milestone / milestone_count) * 60}%)`,
                  },
                },
              }
            : {}
        },
      },
      header: t('statusHeader'),
      enableResizing: true,
    }),
    ...(showMilestonePercentage
      ? [
          columnHelper.accessor('milestone', {
            id: 'milestonePercentage',
            size: 100,
            enableSorting: !isStudentView,
            cell: (info) => {
              const thesis = info.row.original
              const milestone = thesis?.milestone
              const milestone_version = thesis?.milestoneVersion
              const useMilestones = thesis?.program?.options?.useMilestones
              const milestone_count =
                useMilestones && milestone_version != undefined
                  ? thesis?.program?.options?.milestones?.versions?.[
                      milestone_version
                    ]?.length
                  : undefined

              if (
                milestone_count != undefined &&
                milestone != undefined &&
                milestone_count > 0
              ) {
                return (
                  <Typography variant="small">
                    {Math.round((milestone / milestone_count) * 100)}%
                  </Typography>
                )
              }
              return <Typography variant="small">-</Typography>
            },
            header: t('thesesPage:milestonePercentageHeader'),
            enableResizing: true,
          }),
        ]
      : []),
    ...(showEthesisDateColumn
      ? [
          columnHelper.accessor('ethesisDate', {
            size: 30,
            enableSorting: !isStudentView,
            cell: (info) => {
              const val = info.getValue()
              return (
                <Typography variant="small">
                  {val ? dayjs(val).format('YYYY-MM-DD') : '-'}
                </Typography>
              )
            },
            header: t('ethesisDateHeader'),
            enableResizing: true,
          }),
        ]
      : []),
    columnHelper.accessor('startDate', {
      size: 30,
      enableSorting: !isStudentView,
      cell: (info) => (
        <Typography variant="small">
          {dayjs(info.getValue()).format('YYYY-MM-DD')}
        </Typography>
      ),
      header: t('startDateHeader'),
      enableResizing: true,
    }),
    columnHelper.accessor('targetDate', {
      size: 30,
      enableSorting: !isStudentView,
      cell: (info) => (
        <Typography variant="small">
          {dayjs(info.getValue()).format('YYYY-MM-DD')}
        </Typography>
      ),
      header: t('targetDateHeader'),
      meta: {
        getCellContext: (context) => {
          const targetDate = context.row.original.targetDate
          const status = context.row.original.status
          const isIdle = context.row.original.isIdle
          const difference =
            targetDate && dayjs(targetDate).isBefore(dayjs())
              ? dayjs(targetDate).diff(dayjs(), 'day') * -1
              : 0
          return {
            sx: {
              backgroundColor: isIdle
                ? '#c8d7ff'
                : targetDate && status == 'IN_PROGRESS'
                  ? difference >= 180
                    ? '#ffc8c8'
                    : difference >= 30
                      ? '#fff6c8'
                      : ''
                  : '',
            },
          }
        },
      },
      enableResizing: true,
    }),
    ...((isLoading && rows.length === 0
      ? previousData.current.rows
      : rows
    ).some((row) => row.waysOfWorkingValidUntil)
      ? [
          columnHelper.accessor('waysOfWorkingValidUntil', {
            id: 'waysOfWorkingValidUntil',
            size: 30,
            enableSorting: !isStudentView,
            cell: (info) => (
              <Typography variant="small">
                {info.getValue()
                  ? dayjs(info.getValue() as string).format('YYYY-MM-DD')
                  : '-'}
              </Typography>
            ),
            header: () => (
              <Tooltip title={t('validUntilTooltip')} placement="top">
                <Box component="span">{t('validUntilHeader')}</Box>
              </Tooltip>
            ),
            enableResizing: true,
            meta: {
              getCellContext: (context) => {
                const validUntil = context.row.original.waysOfWorkingValidUntil
                const status = context.row.original.status
                if (!validUntil || status !== 'IN_PROGRESS') return {}
                const daysUntil = dayjs(validUntil).diff(dayjs(), 'day')
                return {
                  sx: {
                    backgroundColor:
                      daysUntil < 0
                        ? '#ffc8c8' // past due — red
                        : daysUntil <= 60
                          ? '#fff6c8' // within 2 months — yellow
                          : '',
                  },
                }
              },
            },
          }),
        ]
      : []),
    columnHelper.display({
      id: 'actions',
      size: 0,
      enableSorting: false,
      cell: (info) => (
        <Stack direction="row">
          {info.row.original.supervisions.filter(
            (supervision) =>
              supervision.user?.id == user?.id &&
              supervision.isPrimarySupervisor
          ).length != 0 ? (
            <Tooltip title={t('thesesPage:primarySupervisorTooltip')}>
              <IconButton>
                <Star
                  sx={{
                    color: 'primary.main',
                  }}
                ></Star>
              </IconButton>
            </Tooltip>
          ) : null}

          {(user &&
            (canApprove(info.row.original, user) ||
              canSetEthesisMilestones(info.row.original, user) ||
              needsEthesisAdminAction(info.row.original, user))) ||
          needsStudentAction(info.row.original, isStudentView) ? (
            <Tooltip title={t('thesesPage:actionRequiredTooltip')}>
              <IconButton>
                <PriorityHigh
                  sx={{
                    color: 'primary.main',
                  }}
                ></PriorityHigh>
              </IconButton>
            </Tooltip>
          ) : null}

          {info.row.original?.isIdle ? (
            <Tooltip title={t('thesisStages:idle')}>
              <IconButton>
                <Bedtime
                  sx={{
                    color: 'primary.main',
                  }}
                ></Bedtime>
              </IconButton>
            </Tooltip>
          ) : null}
        </Stack>
      ),
      header: '',
      enableResizing: true,
    }),
  ]

  const tableData =
    isLoading && rows.length === 0 ? previousData.current.rows : rows

  const table = useReactTable({
    data: tableData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    columnResizeMode: 'onChange',
  })

  const selectedTheses = Array.from(bulkSelection.values())
  const selectedApprovable = selectedTheses.filter((t) => canApprove(t, user))

  const toolbar = (
    <>
      {/* Row 1: Main Views and Actions */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          borderBottom: 1,
          borderColor: 'divider',
          mb: 2,
        }}
      >
        {/* Base View Tabs */}
        {!isStudentView &&
        filterViews &&
        Array.isArray(filterViews) &&
        filterViews[0] ? (
          <Tabs
            value={activeBaseView}
            onChange={(_, newValue) => {
              const viewData = filterViews[0].items[newValue]
              setActiveBaseView(newValue)
              setActiveToggles([])
              setActiveMilestoneFilter('all')

              const newDir = viewData.sortingModel[0]['sort']
              const newField = viewData.sortingModel[0]['field']
              handleSortChange(newField, newDir)

              onFilterChange({
                items: getCombinedFilterItems(newValue, [], 'all'),
              })
              changePage(0)
            }}
            sx={{
              minHeight: 'auto',
              '& .MuiTabs-indicator': {
                height: 3,
                borderTopLeftRadius: 3,
                borderTopRightRadius: 3,
              },
            }}
          >
            {Object.keys(filterViews[0].items).map((filterView) => (
              <Tab
                key={filterView}
                value={filterView}
                label={t(`thesesTableToolbar:filterViews:${filterView}:name`)}
                sx={{
                  textTransform: 'none',
                  minHeight: 'auto',
                  py: 1.5,
                  px: 3,
                  fontSize: '0.95rem',
                  fontWeight: activeBaseView === filterView ? 700 : 500,
                }}
              />
            ))}
          </Tabs>
        ) : (
          <Box />
        )}

        {/* Global Actions */}
        <Stack direction="row" sx={{ gap: 2, pb: 1, alignItems: 'center' }}>
          {selectedApprovable.length > 0 && (
            <Button
              variant="contained"
              color="primary"
              size="small"
              sx={{
                fontSize: '12px',
                height: 24,
                px: 2,
                fontWeight: 700,
                boxShadow: 0,
              }}
              onClick={() => setPendingAction('approve')}
            >
              {t('approveButton', 'Approve')} ({selectedApprovable.length})
            </Button>
          )}

          {!noAddThesisButton && !showHiddenNewThesisButton && (
            <Button
              variant="contained"
              size="small"
              sx={{
                fontSize: '12px',
                height: 24,
                px: 2,
                fontWeight: 700,
                boxShadow: 0,
              }}
              onClick={handleNewThesisClick}
            >
              {t('thesesTableToolbar:newThesisButton')}
            </Button>
          )}

          {!noAddThesisButton && showHiddenNewThesisButton && (
            <Box>
              <IconButton onClick={handleMenuClick} size="small">
                <MoreVertIcon />
              </IconButton>
              <Menu
                anchorEl={anchorEl}
                open={openMenu}
                onClose={handleMenuClose}
              >
                <MenuItem
                  onClick={() => {
                    handleMenuClose()
                    handleNewThesisClick()
                  }}
                >
                  {t('thesesTableToolbar:newThesisButton')}
                </MenuItem>
              </Menu>
            </Box>
          )}

          {!hideFiltering && (
            <PrethesisHelp
              text={t('help:table')}
              sx={{ height: 24 }}
            ></PrethesisHelp>
          )}
        </Stack>
      </Box>

      {/* Row 2: Table Filters and Search */}
      <Stack
        direction="row"
        sx={{ justifyContent: 'space-between', alignItems: 'center' }}
      >
        {/* Table Data Filters */}
        <Stack direction="row" sx={{ gap: 2, alignItems: 'center' }}>
          {!isStudentView &&
            filterViews &&
            Array.isArray(filterViews) &&
            filterViews[1] && (
              <Stack
                direction="row"
                sx={{ gap: 1, alignItems: 'center', flexWrap: 'wrap' }}
              >
                {filterViews[1].label && (
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: 600,
                      color: 'text.secondary',
                      mr: 0.5,
                    }}
                  >
                    {filterViews[1].label}:
                  </Typography>
                )}
                {Object.keys(filterViews[1].items).map((filterView) => {
                  const isChecked = activeToggles.includes(filterView)
                  return (
                    <Chip
                      key={filterView}
                      {...(isChecked && {
                        icon: <Check fontSize="small" />,
                      })}
                      label={t(
                        `thesesTableToolbar:filterViews:${filterView}:name`
                      )}
                      color={isChecked ? 'primary' : 'default'}
                      variant={isChecked ? 'filled' : 'outlined'}
                      onClick={() => {
                        let newToggles = [...activeToggles]
                        if (isChecked) {
                          newToggles = newToggles.filter(
                            (t) => t !== filterView
                          )
                        } else {
                          newToggles.push(filterView)
                        }
                        setActiveToggles(newToggles)
                        onFilterChange({
                          items: getCombinedFilterItems(
                            activeBaseView,
                            newToggles,
                            activeMilestoneFilter
                          ),
                        })
                        changePage(0)
                      }}
                    />
                  )
                })}
                {activeToggles.length > 0 && (
                  <IconButton
                    size="small"
                    onClick={() => {
                      setActiveToggles([])
                      onFilterChange({
                        items: getCombinedFilterItems(
                          activeBaseView,
                          [],
                          activeMilestoneFilter
                        ),
                      })
                      changePage(0)
                    }}
                    sx={{ padding: '2px' }}
                  >
                    <Close fontSize="small" />
                  </IconButton>
                )}
              </Stack>
            )}

          {!isStudentView && availableMilestones.length > 0 && (
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel id="milestone-filter-label">
                {t('thesesTableToolbar:milestone')}
              </InputLabel>
              <Select
                labelId="milestone-filter-label"
                id="milestone-filter"
                value={activeMilestoneFilter}
                label={t('thesesTableToolbar:milestone')}
                onChange={(e) => {
                  const val = e.target.value as string
                  setActiveMilestoneFilter(val)
                  onFilterChange({
                    items: getCombinedFilterItems(
                      activeBaseView,
                      activeToggles,
                      val
                    ),
                  })
                  changePage(0)
                }}
              >
                <MenuItem value="all">{t('thesesTableToolbar:all')}</MenuItem>
                {Array.from(
                  new Set([
                    ...availableMilestones,
                    ...(activeMilestoneFilter !== 'all'
                      ? [Number(activeMilestoneFilter)]
                      : []),
                  ])
                )
                  .sort((a, b) => a - b)
                  .map((milestoneVal) => (
                    <MenuItem key={milestoneVal} value={String(milestoneVal)}>
                      {milestoneVal}
                    </MenuItem>
                  ))}
              </Select>
            </FormControl>
          )}
        </Stack>

        {/* Search Input and Export */}
        {!isStudentView && (
          <Stack direction="row" sx={{ gap: 2, alignItems: 'center' }}>
            {onExportCsv && (
              <Tooltip title={t('common:exportCsvTooltip')} placement="top">
                <Button
                  variant="outlined"
                  color="secondary"
                  size="small"
                  startIcon={<Download />}
                  sx={{
                    height: 36,
                    fontWeight: 600,
                    textTransform: 'none',
                  }}
                  onClick={onExportCsv}
                >
                  {t('common:exportCsv')}
                </Button>
              </Tooltip>
            )}

            <TextField
              size="small"
              placeholder={t('thesesTableToolbar:search')}
              variant="outlined"
              onChange={(e) => {
                if (debounceTimeout != null) {
                  clearTimeout(debounceTimeout)
                }
                setDebounceTimeout(
                  setTimeout(() => {
                    onSearch(e.target.value)
                    changePage(0)
                  }, 400)
                )
              }}
            />
          </Stack>
        )}
      </Stack>
    </>
  )

  return (
    <>
      <PrethesisTable
        table={table}
        isLoading={isLoading}
        skeletonCount={skeletonCount}
        onRowClick={(row) => {
          onSelection({
            type: 'include',
            ids: new Set([row.original.id]),
          })
        }}
        isSelected={(row: any) =>
          isSelected(row.id) || bulkSelection.has(row.id)
        }
        isRowDimmed={(row) => !!row.original.isIdle}
        pagination={{
          totalCount: totalCount ?? previousData.current.totalCount,
          page: pageNumber,
          pageSize: pageSize,
          onPageChange: changePage,
          onPageSizeChange: (newPageSize) => {
            setPageSize(newPageSize)
            onPaginationChange({ page: pageNumber, pageSize: newPageSize })
          },
        }}
        sorting={{
          sortedField,
          sortedDir,
          onSortChange: handleSortChange,
        }}
        toolbar={toolbar}
      />
      <Popup
        open={pendingAction !== null}
        onClose={() => setPendingAction(null)}
        title={
          pendingAction === 'newThesis'
            ? t('thesesTableToolbar:newThesisPopupTitle')
            : t('approveButtonConfirmTitle')
        }
        onSubmit={async () => {
          if (pendingAction === 'newThesis') {
            setPendingAction(null)
            initializeNewThesis()
            return
          }
          if (pendingAction === 'approve') {
            await changeThesisStatus({
              theses: selectedApprovable,
              status: THESIS_STATUSES.IN_PROGRESS,
            })
            setBulkSelection(
              new Map(
                Array.from(bulkSelection.entries()).filter(
                  ([id]) => !selectedApprovable.find((t) => t.id === id)
                )
              )
            )
          }
          setPendingAction(null)
        }}
        submitText={
          pendingAction === 'newThesis'
            ? t('thesesTableToolbar:newThesisPopupSubmit')
            : t('submitButton')
        }
        cancelText={t('cancelButton')}
      >
        {pendingAction === 'newThesis' ? (
          <Typography>
            {t('thesesTableToolbar:newThesisPopupContent')}
          </Typography>
        ) : (
          <>
            <Typography>{t('approveBulkButtonConfirmContent')}</Typography>
            <Box sx={{ mt: 2, maxHeight: 300, overflowY: 'auto' }}>
              <List dense disablePadding>
                {selectedApprovable.map((thesis) => (
                  <ListItem
                    key={thesis.id}
                    disableGutters
                    sx={{ alignItems: 'flex-start' }}
                  >
                    <ListItemText
                      primary={
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {thesis.topic}
                        </Typography>
                      }
                      secondary={
                        <Typography variant="caption" color="text.secondary">
                          {thesis.authors
                            .toSorted((a, b) =>
                              a.lastName.localeCompare(b.lastName)
                            )
                            .map(
                              (author) =>
                                `${author.lastName} ${author.firstName} ${author.studentNumber ? `(${author.studentNumber})` : ''}`
                            )
                            .join(', ')}
                        </Typography>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            </Box>
          </>
        )}
      </Popup>
    </>
  )
}

export default ThesisTable
