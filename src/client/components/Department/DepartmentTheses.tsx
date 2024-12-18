import dayjs from 'dayjs'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Box, Stack } from '@mui/material'
import {
  DataGrid,
  getGridStringOperators,
  GridColDef,
  GridFilterModel,
  GridFilterOperator,
  GridSortModel,
  useGridApiRef,
} from '@mui/x-data-grid'
import { fiFI, enUS } from '@mui/x-data-grid/locales'

import {
  SupervisionData,
  ThesisData as Thesis,
  TranslationLanguage,
} from '@backend/types'

import { usePaginatedTheses } from '../../hooks/useTheses'
import useLoggedInUser from '../../hooks/useLoggedInUser'
import usePrograms from '../../hooks/usePrograms'

import ThesisToolbar from '../ThesisPage/ThesisToolbar'
import StatusFilter from '../ThesisPage/Filters/StatusFilter'

import { StatusLocale } from '../../types'
import { useDebounce } from '../../hooks/useDebounce'

const DEFAULT_PAGE_SIZE = 25

interface Props {
  filteringProgramId?: string
  filteringDepartmentId?: string
  noOwnThesesSwitch?: boolean
  noAddThesisButton?: boolean
  showExportOptions?: boolean
  pageSize?: number
}
const DepartmentTheses = ({
  filteringProgramId,
  filteringDepartmentId,
  noOwnThesesSwitch,
  noAddThesisButton,
  showExportOptions,
  pageSize,
}: Props) => {
  pageSize = pageSize ?? DEFAULT_PAGE_SIZE

  const apiRef = useGridApiRef()
  const { t, i18n } = useTranslation()
  const { language } = i18n as { language: TranslationLanguage }
  const { user: currentUser, isLoading: loggedInUserLoading } =
    useLoggedInUser()

  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize,
  })

  const [showOnlyOwnTheses, setShowOnlyOwnTheses] = useState(!noOwnThesesSwitch)

  const [filterStatus, setFilterStatus] = useState<string | null>(null)
  const [filterTopic, setFilterTopic] = useState<string | null>(null)
  const [filterAuthors, setFilterAuthors] = useState<string | null>(null)
  const [filterProgramName, setFilterProgramName] = useState<string | null>(
    null
  )
  const debouncedFilterTopic = useDebounce(filterTopic, 500)
  const debouncedFilterAuthors = useDebounce(filterAuthors, 500)
  const debouncedFilterProgramName = useDebounce(filterProgramName, 500)

  const [order, setOrder] = useState({})

  const {
    theses,
    totalCount,
    isLoading: isThesesLoading,
  } = usePaginatedTheses({
    order,
    programId: filteringProgramId,
    departmentId: filteringDepartmentId,
    status: filterStatus,
    topicPartial: debouncedFilterTopic,
    authorsPartial: debouncedFilterAuthors,
    programNamePartial: debouncedFilterProgramName,
    onlySupervised: showOnlyOwnTheses,
    offset: paginationModel.page * paginationModel.pageSize,
    limit: paginationModel.pageSize,
  })

  const mangledTheses: (Thesis & { supervision: SupervisionData })[] =
    theses?.flatMap((thesis) =>
      thesis.supervisions.map((supervision) => ({
        ...thesis,
        id: `${thesis.id}-${supervision.user.id}`,
        supervision,
      }))
    )

  const { programs, isLoading: isProgramLoading } = usePrograms({
    includeNotManaged: true,
  })

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

  const stringFilterOperators: GridFilterOperator[] = getGridStringOperators()
  const allowedFilterOperators = stringFilterOperators.filter(
    (operator) => operator.value === 'contains'
  )
  const columns: GridColDef<Thesis & { supervision: SupervisionData }>[] = [
    {
      field: 'programId',
      filterable: true,
      filterOperators: allowedFilterOperators,
      headerName: t('programHeader'),
      width: 250,
      valueGetter: (_, row) =>
        (programs ?? []).find((program) => program.id === row.programId)?.name[
          language
        ],
    },
    {
      field: 'topic',
      filterable: true,
      filterOperators: allowedFilterOperators,
      headerName: t('topicHeader'),
      width: 300,
    },
    {
      field: 'authors',
      filterable: true,
      filterOperators: allowedFilterOperators,
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
      field: 'supervision',
      filterable: false,
      headerName: t('supervisorHeader'),
      width: 300,
      valueGetter: (_, row: { supervision: SupervisionData }) =>
        `${row.supervision.user.lastName} ${row.supervision.user.firstName} ${row.supervision.user.email ? `(${row.supervision.user.email})` : ''}`,
    },
    {
      field: 'supervisionPercentage',
      filterable: false,
      headerName: t('supervisionPercentageHeader'),
      width: 100,
      valueGetter: (_, row: { supervision: SupervisionData }) =>
        row.supervision.percentage,
    },
    {
      field: 'status',
      headerName: t('statusHeader'),
      width: 150,
      type: 'string',
      valueGetter: (_, row) => t(StatusLocale[row.status]),
      filterOperators: [
        {
          value: 'isAnyOf',
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

  const skeletonRows: (Thesis & { supervision: SupervisionData })[] =
    Array.from({ length: 7 }).map((_, index) => ({
      programId: '',
      topic: '',
      authors: [] as Thesis['authors'],
      approvers: [] as Thesis['approvers'],
      status: 'PLANNING',
      startDate: '',
      targetDate: '',
      supervisions: [] as Thesis['supervisions'],
      supervision: {
        percentage: 0,
        isExternal: false,
        isPrimarySupervisor: false,
        user: {},
      },
      graders: [] as Thesis['graders'],
      id: index.toString(),
    }))

  const onFilterChange = useCallback((filterModel: GridFilterModel) => {
    // we allow only one filter at a time
    // so we can safely reset the filters
    setFilterStatus(null)
    setFilterTopic(null)
    setFilterAuthors(null)
    setFilterProgramName(null)

    if (filterModel.items.length === 0) {
      return
    }

    switch (filterModel.items[0].field) {
      case 'status':
        setFilterStatus(filterModel.items[0].value)
        break
      case 'topic':
        setFilterTopic(filterModel.items[0].value)
        break
      case 'authors':
        setFilterAuthors(filterModel.items[0].value)
        break
      case 'programId':
        setFilterProgramName(filterModel.items[0].value)
        break
      default:
        break
    }
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

  const isLoading = loggedInUserLoading || isThesesLoading || isProgramLoading
  return (
    <Stack spacing={3} sx={{ p: '1rem', width: '100%', maxWidth: '1920px' }}>
      <Box>
        <DataGrid
          // We want to disable virtualization to prevent a bug
          // that sometimes causes the grid to not render
          // more than 10 rows after switching the page
          disableVirtualization
          apiRef={apiRef}
          loading={isLoading}
          rows={isLoading ? skeletonRows : mangledTheses}
          rowCount={rowCount}
          getRowHeight={() => 44}
          columns={columns}
          columnHeaderHeight={36}
          filterMode="server"
          onFilterModelChange={onFilterChange}
          sortingMode="server"
          onSortModelChange={handleSortModelChange}
          hideFooterSelectedRowCount
          pageSizeOptions={[pageSize]}
          paginationMode="server"
          paginationModel={paginationModel}
          onPaginationModelChange={(newModel) => setPaginationModel(newModel)}
          localeText={
            dataGridLocale.components.MuiDataGrid.defaultProps.localeText
          }
          slots={{
            toolbar: ThesisToolbar,
          }}
          slotProps={{
            toolbar: {
              toggleShowOnlyOwnTheses: () =>
                setShowOnlyOwnTheses((prev) => !prev),
              showOnlyOwnTheses,
              noOwnThesesSwitch,
              noAddThesisButton,
              showExportOptions,
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
    </Stack>
  )
}

export default DepartmentTheses
