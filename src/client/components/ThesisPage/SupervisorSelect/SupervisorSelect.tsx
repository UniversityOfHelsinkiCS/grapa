import React from 'react'
import ReportOutlinedIcon from '@mui/icons-material/ReportOutlined'
import { Box, Button, Divider, Stack, Tooltip, Typography } from '@mui/material'
import { AuthorData, SupervisionData } from '@backend/types'
import { SupervisorSelection } from '@frontend/types'
import { useTranslation } from 'react-i18next'
import { ZodIssue } from 'zod'
import SingleSupervisorSelect from './SingleSupervisorSelect'
import {
  getEqualSupervisorSelectionWorkloads,
  getTotalPercentage,
} from '../util'

const SupervisorSelect: React.FC<{
  errors: ZodIssue[]
  supervisorSelections: SupervisorSelection[]
  setSupervisorSelections: (newSupervisions: SupervisionData[]) => void
}> = ({ errors, supervisorSelections, setSupervisorSelections }) => {
  const { t } = useTranslation()

  const totalPercentage = getTotalPercentage(supervisorSelections)

  const handleSupervisorChange = (index: number, supervisor: AuthorData) => {
    const updatedSelections = [...supervisorSelections]
    updatedSelections[index].user = supervisor
    setSupervisorSelections(updatedSelections)
  }

  const handlePercentageChange = (index: number, percentage: number) => {
    if (Number.isNaN(percentage) || percentage < 0 || percentage > 100) return

    const updatedSelections = [...supervisorSelections]
    updatedSelections[index].percentage = percentage
    setSupervisorSelections(updatedSelections)
  }

  const handleAddSupervisor = () => {
    const numberOfSupervisors = supervisorSelections.length + 1

    const updatedSelections = getEqualSupervisorSelectionWorkloads(
      numberOfSupervisors,
      supervisorSelections
    )

    setSupervisorSelections([
      ...updatedSelections,
      { user: null, percentage: Math.floor((1 / numberOfSupervisors) * 100) },
    ])
  }

  const handleRemoveSupervisor = (index: number) => {
    const initialSelections = [...supervisorSelections]
    initialSelections.splice(index, 1)
    if (initialSelections.length === 0) return // Do not allow removing all supervisors

    const numberOfSupervisors = initialSelections.length
    const updatedSelections = getEqualSupervisorSelectionWorkloads(
      numberOfSupervisors,
      initialSelections
    )

    setSupervisorSelections(updatedSelections)
  }

  return (
    <Stack
      spacing={3}
      sx={{
        borderStyle: 'none',
        borderWidth: '1px',
        borderTop: '1px solid',
      }}
      component="fieldset"
    >
      <Typography component="legend" sx={{ px: '1rem' }}>
        {t('thesisForm:supervisors')}
      </Typography>
      {supervisorSelections.map((selection, index) => (
        <SingleSupervisorSelect
          key={selection.user?.id ?? `supervisor-${index}`}
          index={index}
          selection={selection}
          handleSupervisorChange={(supervisor) =>
            handleSupervisorChange(index, supervisor)
          }
          handleRemoveSupervisor={() => handleRemoveSupervisor(index)}
          handlePercentageChange={(percentage) =>
            handlePercentageChange(index, percentage)
          }
          inputProps={{
            required: true,
            helperText: errors.find(
              (error) => error.path.join('-') === `supervisions-${index}-user`
            )?.message,
            error: Boolean(
              errors.find(
                (error) => error.path.join('-') === `supervisions-${index}-user`
              )
            ),
          }}
          iconButtonProps={{
            disabled: supervisorSelections.length === 1,
          }}
        />
      ))}

      <Divider component="div" role="presentation" textAlign="right">
        <Tooltip
          title="Työjakauman tulee olla yhteensä 100%"
          placement="bottom"
          arrow
        >
          <Box
            id="supervisions-percentage"
            tabIndex={-1}
            sx={{ display: 'flex', alignItems: 'center' }}
          >
            {totalPercentage !== 100 && (
              <ReportOutlinedIcon color="error" sx={{ mr: '0.5rem' }} />
            )}
            <Typography
              variant="overline"
              color={totalPercentage !== 100 ? 'error' : ''}
            >
              {t('thesisForm:totalSupervisionPercentage', { totalPercentage })}
            </Typography>
          </Box>
        </Tooltip>
      </Divider>

      {supervisorSelections.length < 5 && (
        <Button
          data-testid="add-supervisor-button"
          type="button"
          onClick={handleAddSupervisor}
        >
          {t('thesisForm:addSupervisor')}
        </Button>
      )}
    </Stack>
  )
}

export default SupervisorSelect
