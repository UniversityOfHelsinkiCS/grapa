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
  IconButton,
  Menu,
  MenuItem,
  Stack,
  TablePagination,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material'
import { useTranslation } from 'react-i18next'
import { StatusLocale } from '../../types'
import dayjs from 'dayjs'
import {
  PriorityHigh,
  Star,
  MoreVert as MoreVertIcon,
} from '@mui/icons-material'
import usePrograms from '../../hooks/usePrograms'
import { PrethesisHelp } from '../PrethesisHelp/PrethesisHelp'

declare module '@tanstack/react-table' {
  interface ColumnMeta<TData, TValue> {
    getCellContext: (context: CellContext<TData, TValue>) => any | void
  }
}

const columnHelper = createColumnHelper<Thesis>()

interface Props {
  rows: Thesis[]
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
}

const PrethesisTable = ({
  rows,
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
}: Props) => {
  const { t, i18n } = useTranslation()
  const { language } = i18n as { language: TranslationLanguage }

  /* Pagination */
  const [pageNumber, setPageNumber] = React.useState(0)
  const [pageSize, setPageSize] = React.useState(25)

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

  if (!isStudentView) {
    React.useEffect(() => {
      onFilterChange(filterViews[activeFilterView].filterModel)
      onSortingChange(filterViews[activeFilterView].sortingModel)
    }, [])
  }

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
    selection.ids.size > 0 ? selection.ids.has(value) : false

  const columns = [
    columnHelper.accessor('program', {
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
    columnHelper.accessor('status', {
      size: 50,
      cell: (info) => (
        <Chip
          label={t(StatusLocale[info.getValue()])}
          variant="outlined"
          sx={{}}
        />
      ),
      meta: {
        getCellContext(context) {
          const status = context.row.original.status
          const useMilestones =
            context.row.original?.program?.options?.useMilestones

          const milestone = context.row.original?.milestone
          const milestone_version = context.row.original?.milestoneVersion

          const milestone_count =
            useMilestones && milestone_version != undefined
              ? context.row.original?.program?.options?.milestones?.versions[
                  milestone_version
                ].length
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
              ? dayjs(targetDate).diff(dayjs(), 'day')
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
          info.row.original.approvers.find(
            (approver) =>
              approver.id === user.id && info.row.original.status == 'PLANNING'
          ) ? (
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
        </Stack>
      ),
      header: '',
      enableResizing: true,
    }),
  ]

  const table = useReactTable({
    data: rows,
    columns,
    getCoreRowModel: getCoreRowModel(),
    columnResizeMode: 'onChange',
  })

  return (
    <Stack
      sx={{
        overflowX: 'scoll',
        p: 2,
      }}
    >
      <Stack direction="row" sx={{ gap: 2, mb: 2, alignItems: 'center' }}>
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
                  label={t(`thesesTableToolbar:filterViews:${filterView}:name`)}
                  onClick={() => {
                    onFilterChange(filterViews[filterView].filterModel)
                    onSortingChange(filterViews[filterView].sortingModel)
                    setActiveFilterView(filterView)
                  }}
                ></Chip>
              </Tooltip>
            ))}
          </Stack>
        )}

        {!noAddThesisButton && showHiddenNewThesisButton && (
          <Box sx={{ ml: 'auto' }}>
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

        {!isStudentView && (
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
                }, 400)
              )
            }}
          ></TextField>
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
                    <Stack direction="row">
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
                    </Stack>
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableHead>
          <TableBody>
            {rows.length > 0 ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  onClick={() => {
                    onSelection({
                      type: 'include',
                      ids: new Set([row.original.id]),
                    })
                  }}
                  selected={isSelected(row.original.id)}
                  sx={{
                    cursor: 'pointer',
                    ':hover': {
                      backgroundColor: '#e7e7e7',
                    },
                  }}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      {...(cell.getContext().cell.column.columnDef.meta && {
                        ...cell
                          .getContext()
                          .cell.column.columnDef.meta.getCellContext(
                            cell.getContext()
                          ),
                      })}
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
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
        count={totalCount}
        rowsPerPage={pageSize}
        page={pageNumber}
        onPageChange={(_event, page) => {
          onPaginationChange({ page: page, pageSize: pageSize })
          setPageNumber(page)
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
      ></TablePagination>
    </Stack>
  )
}

export default PrethesisTable
