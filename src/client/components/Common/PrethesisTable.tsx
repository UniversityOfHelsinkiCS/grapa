import * as React from 'react'
import { Table as ReactTable, flexRender, Row } from '@tanstack/react-table'

import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import {
  Box,
  Checkbox,
  IconButton,
  Skeleton,
  Stack,
  TablePagination,
  Typography,
} from '@mui/material'
import { ArrowDownward, ArrowUpward, Sort } from '@mui/icons-material'
import { useTranslation } from 'react-i18next'

interface Props<TData> {
  table: ReactTable<TData>
  isLoading?: boolean
  skeletonCount?: number
  onRowClick?: (row: Row<TData>) => void
  isSelected?: (rowId: string) => boolean
  isRowDimmed?: (row: Row<TData>) => boolean
  pagination?: {
    totalCount: number
    page: number
    pageSize: number
    onPageChange: (page: number) => void
    onPageSizeChange: (pageSize: number) => void
  }
  sorting?: {
    sortedField: string | null
    sortedDir: 'asc' | 'desc'
    onSortChange: (field: string, dir: 'asc' | 'desc') => void
  }
  toolbar?: React.ReactNode
  noDataText?: string
}

export function PrethesisTable<TData>({
  table,
  isLoading,
  skeletonCount = 10,
  onRowClick,
  isSelected,
  isRowDimmed,
  pagination,
  sorting,
  toolbar,
  noDataText,
}: Props<TData>) {
  const { t } = useTranslation()
  const rows = table.getRowModel().rows
  const noRowsText = noDataText || t('thesesPage:noRows')

  return (
    <Stack
      sx={{
        overflowX: 'scroll',
        p: 2,
      }}
    >
      {toolbar && (
        <Stack direction="column" sx={{ mb: 2 }}>
          {toolbar}
        </Stack>
      )}

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
                {headerGroup.headers.map((header) => {
                  const canSort = header.column.getCanSort()

                  return (
                    <TableCell
                      key={header.id}
                      colSpan={header.colSpan}
                      style={{ width: `${header.getSize()}px` }}
                      align={header.colSpan > 1 ? 'center' : 'left'}
                      sx={{
                        borderLeft:
                          header.colSpan > 1
                            ? '1px solid rgba(224, 224, 224, 1)'
                            : 'none',
                        borderRight:
                          header.colSpan > 1
                            ? '1px solid rgba(224, 224, 224, 1)'
                            : 'none',
                        pb: 2,
                      }}
                    >
                      <Stack
                        direction="row"
                        sx={{
                          alignItems: 'center',
                          justifyContent:
                            header.colSpan > 1 ? 'center' : 'flex-start',
                          gap: 1,
                        }}
                      >
                        <Typography
                          sx={{
                            fontWeight: 'bold',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {header.isPlaceholder
                            ? null
                            : flexRender(
                                header.column.columnDef.header,
                                header.getContext()
                              )}
                        </Typography>
                        {!header.isPlaceholder && canSort && (
                          <IconButton
                            sx={{
                              opacity: (
                                sorting
                                  ? sorting.sortedField === header.id
                                  : header.column.getIsSorted()
                              )
                                ? 1
                                : 0.3,
                              ':hover': {
                                opacity: 0.5,
                              },
                            }}
                            onClick={
                              sorting
                                ? () => {
                                    const newDir =
                                      sorting.sortedField === header.id
                                        ? sorting.sortedDir === 'asc'
                                          ? 'desc'
                                          : 'asc'
                                        : 'asc'
                                    sorting.onSortChange(header.id, newDir)
                                  }
                                : header.column.getToggleSortingHandler()
                            }
                          >
                            {(
                              sorting
                                ? sorting.sortedField === header.id
                                : header.column.getIsSorted()
                            ) ? (
                              (
                                sorting
                                  ? sorting.sortedDir === 'desc'
                                  : header.column.getIsSorted() === 'desc'
                              ) ? (
                                <ArrowDownward />
                              ) : (
                                <ArrowUpward />
                              )
                            ) : (
                              <Sort />
                            )}
                          </IconButton>
                        )}
                      </Stack>
                    </TableCell>
                  )
                })}
              </TableRow>
            ))}
          </TableHead>
          <TableBody>
            {isLoading ? (
              rows.length > 0 ? (
                rows.map((row, index) => (
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
              rows.map((row) => {
                const dimmed = isRowDimmed ? isRowDimmed(row) : false
                return (
                  <TableRow
                    key={row.id}
                    onClick={() => {
                      if (onRowClick) onRowClick(row)
                    }}
                    selected={
                      isSelected ? isSelected(row.original as any) : false
                    }
                    sx={{
                      cursor: onRowClick ? 'pointer' : 'default',
                      ':hover': {
                        backgroundColor: onRowClick ? '#e7e7e7' : 'inherit',
                      },
                    }}
                  >
                    {row.getVisibleCells().map((cell) => {
                      const isTextColumn = ![
                        'select',
                        'supervisions',
                        'status',
                        'actions',
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
                            opacity: dimmed && isTextColumn ? 0.5 : 1,
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
                )
              })
            ) : (
              <TableRow>
                <TableCell colSpan={1000} sx={{ textAlign: 'center' }}>
                  <Typography>{noRowsText}</Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
      {pagination && (
        <TablePagination
          count={pagination.totalCount}
          rowsPerPage={pagination.pageSize}
          page={pagination.page}
          onPageChange={(_event, page) => {
            pagination.onPageChange(page)
          }}
          onRowsPerPageChange={(event: React.ChangeEvent<HTMLInputElement>) => {
            try {
              const new_row_count = parseInt(event.target.value, 10)
              pagination.onPageSizeChange(new_row_count)
            } catch {
              console.log('Page size change error')
            }
          }}
          component="div"
        />
      )}
    </Stack>
  )
}

export default PrethesisTable
