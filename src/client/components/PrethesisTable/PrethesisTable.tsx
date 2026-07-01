import * as React from 'react'

import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
  CellContext,
} from '@tanstack/react-table'

import { ThesisData as Thesis, TranslationLanguage, User } from '@backend/types'

import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import Chip from '@mui/material/Chip'
import TableRow from '@mui/material/TableRow'
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
  Skeleton,
  Stack,
  TablePagination,
  TextField,
  Tooltip,
  Typography,
  Select,
  FormControl,
  InputLabel,
} from '@mui/material'
import { useTranslation } from 'react-i18next'
import { StatusLocale } from '../../types'
import dayjs from 'dayjs'
import {
  PriorityHigh,
  Star,
  MoreVert as MoreVertIcon,
  ArrowDownward,
  ArrowUpward,
  Sort,
  Bedtime,
} from '@mui/icons-material'
import usePrograms from '../../hooks/usePrograms'
import { PrethesisHelp } from '../PrethesisHelp/PrethesisHelp'
import { useChangeThesisStatusMutation } from '../../hooks/useThesesMutation'
import { canApprove, canSetEthesisStudentStarted } from '../../util/permissions'
import { THESIS_STATUSES } from '../../../config'
import Popup from '../Common/Popup'

declare module '@tanstack/react-table' {
  interface ColumnMeta<TData, TValue> {
    getCellContext: (context: CellContext<TData, TValue>) => any | void
  }
}

const columnHelper = createColumnHelper<Thesis>()

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
}

const PrethesisTable = ({
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
}: Props) => {
  const { t, i18n } = useTranslation()
  const { language } = i18n as { language: TranslationLanguage }

  /* Pagination */
  const [pageNumber, setPageNumber] = React.useState(0)
  const [pageSize, setPageSize] = React.useState(25)

  const changePage = React.useCallback(
    (page: number) => {
      setPageNumber(page)
      onPaginationChange({ page, pageSize })
    },
    [pageSize, onPaginationChange]
  )

  const { mutateAsync: changeThesisStatus } =
    useChangeThesisStatusMutation(isStudentView)
  const [pendingAction, setPendingAction] = React.useState<'approve' | null>(
    null
  )
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

  /* FilterView */
  const [activeFilterView, setActiveFilterView] = React.useState(
    !isStudentView && filterViews ? Object.keys(filterViews)[0] : null
  )

  const [debounceTimeout, setDebounceTimeout] = React.useState(null)

  const [activeMilestoneFilter, setActiveMilestoneFilter] = React.useState<
    string | null
  >('all')

  if (!isStudentView) {
    React.useEffect(() => {
      onFilterChange(filterViews[activeFilterView].filterModel)
      onSortingChange(filterViews[activeFilterView].sortingModel)
    }, [])
  }

  /* Sorting */

  const [sortedField, setSortedField] = React.useState(
    !isStudentView && filterViews && activeFilterView
      ? filterViews[activeFilterView].sortingModel[0]?.field || null
      : null
  )
  const [sortedDir, setSortedDir] = React.useState(
    !isStudentView && filterViews && activeFilterView
      ? filterViews[activeFilterView].sortingModel[0]?.sort || 'asc'
      : 'asc'
  )

  /* New thesis button */
  const { programs, isLoading: programsLoading } = !isStudentView
    ? usePrograms({
        includeNotManaged: true,
      })
    : { programs: [], isLoading: false }

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
      cell: (info) => (
        <Typography variant="small">{info.getValue()}</Typography>
      ),
      header: t('topicHeader'),
      enableResizing: true,
    }),
    columnHelper.accessor('authors', {
      size: 300,
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
    columnHelper.accessor('status', {
      size: 50,
      cell: (info) => {
        const status = info.getValue() as keyof typeof StatusLocale
        const isEthesisStudentStarted =
          status === 'ETHESIS' &&
          info.row.original?.program?.options?.allowStudentStartedProcess

        const translationKey = isEthesisStudentStarted
          ? 'thesisStages:ethesis_studentstarted'
          : StatusLocale[status]

        const labelText = info.row.original?.isIdle
          ? `${t(translationKey)} (${t('thesisStages:idle')})`
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
    columnHelper.accessor('startDate', {
      size: 30,
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
          const difference =
            targetDate && dayjs(targetDate).isBefore(dayjs())
              ? dayjs(targetDate).diff(dayjs(), 'day') * -1
              : 0
          return {
            sx: {
              backgroundColor:
                targetDate && status == 'IN_PROGRESS'
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
    columnHelper.accessor('supervisions', {
      size: 0,
      cell: (info) => (
        <Stack direction="row">
          {info
            .getValue()
            .filter(
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

          {user &&
          (canApprove(info.row.original, user) ||
            canSetEthesisStudentStarted(info.row.original, user)) ? (
            <Tooltip title={t('thesesPage:approvalRequiredTooltip')}>
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

  return (
    <Stack
      sx={{
        overflowX: 'scoll',
        p: 2,
      }}
    >
      <Stack direction="row" sx={{ gap: 2, mb: 2, alignItems: 'center' }}>
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
            onClick={initializeNewThesis}
          >
            {t('thesesTableToolbar:newThesisButton')}
          </Button>
        )}

        {!isStudentView && filterViews && (
          <Stack
            direction="row"
            sx={{
              gap: 1,
            }}
          >
            {Object.keys(filterViews).map((filterView) => (
              <Tooltip
                key={filterView}
                title={t(
                  `thesesTableToolbar:filterViews:${filterView}:tooltip`
                )}
              >
                <Chip
                  variant={
                    activeFilterView == filterView ? 'filled' : 'outlined'
                  }
                  size="small"
                  sx={{
                    fontSize: '0.85rem',
                  }}
                  label={t(`thesesTableToolbar:filterViews:${filterView}:name`)}
                  onClick={() => {
                    onFilterChange(filterViews[filterView].filterModel)
                    setSortedDir(
                      filterViews[filterView].sortingModel[0]['sort']
                    )
                    setSortedField(
                      filterViews[filterView].sortingModel[0]['field']
                    )
                    onSortingChange(filterViews[filterView].sortingModel)
                    setActiveFilterView(filterView)
                    setActiveMilestoneFilter('all')
                    changePage(0)
                  }}
                ></Chip>
              </Tooltip>
            ))}
          </Stack>
        )}

        {!isStudentView && availableMilestones.length > 0 && (
          <FormControl size="small" sx={{ ml: 'auto', minWidth: 150 }}>
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
                  items:
                    val !== 'all'
                      ? [
                          {
                            field: 'milestone',
                            operator: 'equals',
                            value: val,
                          },
                        ]
                      : [],
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

        {!isStudentView && (
          <TextField
            size="small"
            sx={{ ml: availableMilestones.length > 0 ? 0 : 'auto' }}
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
          ></TextField>
        )}

        {!noAddThesisButton && showHiddenNewThesisButton && (
          <Box sx={{ ml: isStudentView ? 'auto' : 0 }}>
            <IconButton onClick={handleMenuClick} size="small">
              <MoreVertIcon />
            </IconButton>
            <Menu anchorEl={anchorEl} open={openMenu} onClose={handleMenuClose}>
              <MenuItem
                onClick={() => {
                  handleMenuClose()
                  initializeNewThesis()
                }}
              >
                {t('thesesTableToolbar:newThesisButton')}
              </MenuItem>
            </Menu>
          </Box>
        )}

        <PrethesisHelp
          text={t('help:table')}
          sx={{ ml: 'auto', height: 24 }}
        ></PrethesisHelp>
      </Stack>
      <TableContainer>
        <Table
          size="small"
          sx={{
            tableLayout: 'auto',
          }}
        >
          <TableHead>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableCell
                    key={header.id}
                    style={{ width: `${header.getSize()}px` }}
                  >
                    <Stack
                      direction="row"
                      sx={{
                        alignItems: 'center',
                        gap: 1,
                      }}
                    >
                      <Typography
                        sx={{
                          fontWeight: 'bold',
                        }}
                      >
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                      </Typography>
                      {![
                        'supervisions',
                        'supervisor',
                        'supervisionPercentage',
                        'select',
                      ].includes(header.id) &&
                        !isStudentView && (
                          <IconButton
                            sx={{
                              opacity: sortedField == header.id ? 1 : 0.3,
                              ':hover': {
                                opacity: 0.5,
                              },
                            }}
                            onClick={() => {
                              const sortingDir =
                                sortedField == header.id
                                  ? sortedDir == 'asc'
                                    ? 'desc'
                                    : 'asc'
                                  : 'asc'
                              setSortedField(header.id)
                              setSortedDir(sortingDir)
                              onSortingChange([
                                {
                                  field: header.id,
                                  sort: sortingDir,
                                },
                              ])
                            }}
                          >
                            {sortedField == header.id ? (
                              sortedDir == 'desc' ? (
                                <ArrowDownward></ArrowDownward>
                              ) : (
                                <ArrowUpward></ArrowUpward>
                              )
                            ) : (
                              <Sort></Sort>
                            )}
                          </IconButton>
                        )}
                    </Stack>
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableHead>
          <TableBody>
            {isLoading ? (
              table.getRowModel().rows.length > 0 ? (
                table.getRowModel().rows.map((row, index) => (
                  <TableRow key={index}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id} sx={{ position: 'relative' }}>
                        <Box sx={{ visibility: 'hidden' }}>
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </Box>
                        <Box
                          sx={{
                            position: 'absolute',
                            top: 0,
                            bottom: 0,
                            left: 16,
                            right: 16,
                            display: 'flex',
                            alignItems: 'center',
                          }}
                        >
                          {cell.column.id === 'select' ? (
                            <Checkbox
                              size="small"
                              sx={{ visibility: 'hidden' }}
                            />
                          ) : (
                            <Skeleton
                              variant="rectangular"
                              height={32}
                              width="100%"
                              sx={{ borderRadius: 1 }}
                            />
                          )}
                        </Box>
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                Array.from(new Array(skeletonCount)).map((_, index) => (
                  <TableRow key={index}>
                    {table.getVisibleLeafColumns().map((column) => (
                      <TableCell key={column.id}>
                        {column.id === 'select' ? (
                          <Checkbox
                            size="small"
                            sx={{ visibility: 'hidden' }}
                          />
                        ) : (
                          <Skeleton
                            variant="rectangular"
                            height={32}
                            sx={{ borderRadius: 1 }}
                          />
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              )
            ) : rows.length > 0 ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  onClick={() => {
                    onSelection({
                      type: 'include',
                      ids: new Set([row.original.id]),
                    })
                  }}
                  selected={
                    isSelected(row.original.id) ||
                    bulkSelection.has(row.original.id)
                  }
                  sx={{
                    cursor: 'pointer',
                    ':hover': {
                      backgroundColor: '#e7e7e7',
                    },
                  }}
                >
                  {row.getVisibleCells().map((cell) => {
                    const isTextColumn = ![
                      'select',
                      'supervisions',
                      'status',
                    ].includes(cell.column.id)
                    const metaProps: any = cell.column.columnDef.meta
                      ? cell.column.columnDef.meta.getCellContext(
                          cell.getContext()
                        )
                      : {}

                    return (
                      <TableCell
                        key={cell.id}
                        {...metaProps}
                        sx={{
                          ...(metaProps?.sx || {}),
                          opacity:
                            row.original.isIdle && isTextColumn ? 0.5 : 1,
                        }}
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    )
                  })}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={1000} sx={{ textAlign: 'center' }}>
                  {' '}
                  <Typography>{t('thesesPage:noRows')}</Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        count={totalCount ?? previousData.current.totalCount}
        rowsPerPage={pageSize}
        page={pageNumber}
        onPageChange={(_event, page) => {
          changePage(page)
        }}
        onRowsPerPageChange={(_e: any, element: { props: { value: any } }) => {
          try {
            const new_row_count = element.props.value
            setPageSize(new_row_count)
            onPaginationChange({ page: pageNumber, pageSize: new_row_count })
          } catch {
            console.log('Page size change error')
          }
        }}
        component="div"
      />
      <Popup
        open={pendingAction !== null}
        onClose={() => setPendingAction(null)}
        title={t('approveButtonConfirmTitle', 'Confirm Approval')}
        onSubmit={async () => {
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
        submitText={t('submitButton')}
        cancelText={t('cancelButton')}
      >
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
                  primary={thesis.topic}
                  secondary={thesis.authors
                    .toSorted((a, b) => a.lastName.localeCompare(b.lastName))
                    .map(
                      (author) =>
                        `${author.lastName} ${author.firstName} ${author.studentNumber ? `(${author.studentNumber})` : ''}`
                    )
                    .join(', ')}
                  primaryTypographyProps={{ variant: 'body2', fontWeight: 500 }}
                  secondaryTypographyProps={{ variant: 'caption' }}
                />
              </ListItem>
            ))}
          </List>
        </Box>
      </Popup>
    </Stack>
  )
}

export default PrethesisTable
