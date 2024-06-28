import React from 'react'
import ReportOutlinedIcon from '@mui/icons-material/ReportOutlined'
import { Box, Divider, Stack, Tooltip, Typography } from '@mui/material'
import { User, SupervisionData } from '@backend/types'
import { SupervisorSelection } from '@frontend/types'
import { useTranslation } from 'react-i18next'
import { ZodIssue } from 'zod'
import SingleSupervisorSelect from './SingleSupervisorSelect'
import {
  getEqualSupervisorSelectionWorkloads,
  getTotalPercentage,
} from '../util'
import ExternalPersonInput from '../ExternalPerson'
import NewSupervisorControls from './NewSupervisorControls'

const SupervisorSelect: React.FC<{
  errors: ZodIssue[]
  supervisorSelections: SupervisorSelection[]
  setSupervisorSelections: (newSupervisions: SupervisionData[]) => void
}> = ({ errors, supervisorSelections, setSupervisorSelections }) => {
  const { t } = useTranslation()

  const totalPercentage = getTotalPercentage(supervisorSelections)

  const handleSupervisorChange = (index: number, supervisor: User) => {
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

  const handleAddSupervisor = (isExternal: boolean) => {
    const numberOfSupervisors = supervisorSelections.length + 1

    const updatedSelections = getEqualSupervisorSelectionWorkloads(
      numberOfSupervisors,
      supervisorSelections
    )

    setSupervisorSelections([
      ...updatedSelections,
      {
        user: null,
        percentage: Math.floor((1 / numberOfSupervisors) * 100),
        isExternal,
      },
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
      {supervisorSelections.map((selection, index) => {
        const SupervisorElement = selection.isExternal
          ? ExternalPersonInput
          : SingleSupervisorSelect

        return (
          <SupervisorElement
            key={selection.user?.id ?? `supervisions-${index}`}
            index={index}
            inputGroup="supervisions"
            selection={selection}
            handleSupervisorChange={(value) =>
              handleSupervisorChange(index, value)
            }
            handleRemoveSupervisor={() => handleRemoveSupervisor(index)}
            handlePercentageChange={(percentage) =>
              handlePercentageChange(index, percentage)
            }
            inputProps={{
              required: true,
              helperText: t(
                errors.find(
                  (error) =>
                    error.path.join('-') === `supervisions-${index}-user`
                )?.message
              ),
              error: Boolean(
                errors.find(
                  (error) =>
                    error.path.join('-') === `supervisions-${index}-user`
                )
              ),
            }}
            iconButtonProps={{
              disabled: supervisorSelections.length === 1,
            }}
          />
        )
      })}

      <Divider component="div" role="presentation" textAlign="right">
        <Tooltip
          title="Työjakauman tulee olla yhteensä 100%"
          placement="bottom"
          arrow
        >
          <Box
            id="supervisions-percentage"
            data-testid="supervisions-percentage-error"
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
        <NewSupervisorControls handleAddSupervisor={handleAddSupervisor} />
      )}
    </Stack>
  )
}

export default SupervisorSelect
