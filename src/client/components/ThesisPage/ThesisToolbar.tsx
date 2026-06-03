import { format } from 'date-fns'
import { useTranslation } from 'react-i18next'
import {
  Button,
  Box,
  FormControlLabel,
  Switch,
  Chip,
  Divider,
} from '@mui/material'
import {
  GridSlotProps,
  GridToolbarExport,
  Toolbar,
  useGridApiContext,
} from '@mui/x-data-grid'

import useLoggedInUser from '../../hooks/useLoggedInUser'
import { useEffect, useState } from 'react'

const ThesisToolbar = (props: GridSlotProps['toolbar']) => {
  const apiRef = useGridApiContext()
  const { t } = useTranslation()
  const { user } = useLoggedInUser()

  const [filteredView, setFilteredView] = useState('active')
  const [usedQuickFilteredView, setUsedQuickFilteredView] = useState(true)
  const [autoFilterViewIteration, setAutoFilterViewIteration] = useState(0)

  const filterViews = {
    active: {
      filterModel: {
        items: [
          {
            field: 'status',
            operator: 'isAnyOf',
            value: ['PLANNING', 'SUGGESTED', 'IN_PROGRESS', 'ETHESIS_SENT'],
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

  const filterChips = Object.keys(filterViews).map((view) => (
    <Chip
      key={view}
      label={t(`thesesTableToolbar:filterViews:${view}`)}
      variant={filteredView == view ? 'filled' : 'outlined'}
      size="small"
      sx={{
        borderRadius: '0.5rem',
      }}
      onClick={() => {
        setFilteredView(view)
        setUsedQuickFilteredView(true)
      }}
    />
  ))

  const {
    createNewThesis,
    toggleShowOnlyOwnTheses,
    showOnlyOwnTheses,
    noOwnThesesSwitch,
    noAddThesisButton,
    showExportOptions,
    isStudentView,
    currentFilters,
  } = props

  // This implementation is a hack, the DataGrid does not expose enough information to implement this normally.
  // So this uses a incrementing counter to check if the modification to the filters originated from here.
  useEffect(() => {
    if (currentFilters == null || isStudentView) {
      return
    } else if (usedQuickFilteredView) {
      apiRef.current.setFilterModel({
        ...filterViews[filteredView].filterModel,
        autoFilteredView: autoFilterViewIteration + 1,
      })
      apiRef.current.setSortModel(filterViews[filteredView].sortingModel)
      setUsedQuickFilteredView(false)
    } else if (currentFilters.autoFilteredView == autoFilterViewIteration) {
      setFilteredView(null)
    } else if (currentFilters.autoFilteredView > autoFilterViewIteration) {
      setAutoFilterViewIteration(currentFilters.autoFilteredView)
    }
  }, [currentFilters, usedQuickFilteredView])

  const handleNewThesis = () => {
    createNewThesis()
  }

  return (
    <Toolbar sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
      <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
        {!noAddThesisButton && (
          <Button
            variant="contained"
            size="small"
            sx={{
              fontSize: '12px',
              height: 24,
              px: 2,
              // borderRadius: '1rem',
              fontWeight: 700,
              boxShadow: 0,
            }}
            onClick={handleNewThesis}
          >
            {t('thesesTableToolbar:newThesisButton')}
          </Button>
        )}
        {!noOwnThesesSwitch && !isStudentView && user?.isAdmin && (
          <FormControlLabel
            control={
              <Switch
                checked={!showOnlyOwnTheses}
                onChange={toggleShowOnlyOwnTheses}
              />
            }
            label={t('thesesTableToolbar:showAllThesesSwitch')}
          />
        )}
        {((!noOwnThesesSwitch && !isStudentView && user?.isAdmin) ||
          !noAddThesisButton) && (
          <Divider orientation="vertical" variant="fullWidth" flexItem />
        )}
        {!isStudentView && (
          <Box sx={{ gap: '0.25rem', display: 'flex' }}>{filterChips}</Box>
        )}
        {Boolean(
          !noOwnThesesSwitch &&
          !isStudentView &&
          !user?.isAdmin &&
          user?.managedProgramIds?.length
        ) && (
          <FormControlLabel
            control={
              <Switch
                checked={!showOnlyOwnTheses}
                onChange={toggleShowOnlyOwnTheses}
              />
            }
            label={t('thesesTableToolbar:showManagedProgramsThesesSwitch')}
          />
        )}
      </Box>
      <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
        {showExportOptions && (
          <GridToolbarExport
            csvOptions={{
              fileName: `department-overview-${format(new Date(), 'yyyy-MM-dd')}`,
              delimiter: ';',
            }}
          />
        )}
      </Box>
    </Toolbar>
  )
}

export default ThesisToolbar
