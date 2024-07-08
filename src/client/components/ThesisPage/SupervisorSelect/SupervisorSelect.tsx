import React from 'react'
import {
  Alert,
  AlertTitle,
  Box,
  Divider,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material'
import { User, SupervisionData } from '@backend/types'
import { SupervisorSelection } from '@frontend/types'
import { v4 as uuidv4 } from 'uuid'
import { useTranslation } from 'react-i18next'
import { ZodIssue } from 'zod'
import SingleSupervisorSelect from './SingleSupervisorSelect'
import {
  getEqualSupervisorSelectionWorkloads,
  getTotalPercentage,
} from '../util'
import ExternalPersonInput from '../ExternalPerson'
import NewPersonControls from '../NewPersonControls'

const SupervisorSelect: React.FC<{
  errors: ZodIssue[]
  supervisorSelections: SupervisorSelection[]
  setSupervisorSelections: (newSupervisions: SupervisionData[]) => void
}> = ({ errors, supervisorSelections, setSupervisorSelections }) => {
  const { t } = useTranslation()

  const totalPercentage = getTotalPercentage(supervisorSelections)
  const generalSupervisorErrors = errors.filter((error) =>
    error.path.join('-').endsWith('general-supervisor-error')
  )

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

  const handlePrimarySupervisorChange = (index: number) => {
    const updatedSelections = supervisorSelections.map((selection, i) => ({
      ...selection,
      isPrimarySupervisor: i === index,
    }))

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
        isPrimarySupervisor: false,
        creationTimeIdentifier: uuidv4(), // This is a shit hack for dealing w/ React keys and an anti-pattern, but couldn't figure out anything else -- See #43 comments
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

      {generalSupervisorErrors.length > 0 && (
        <Alert
          id="supervisions-general-supervisor-error"
          data-testid="supervisions-general-supervisor-error"
          severity="error"
          aria-live="polite"
          sx={{ whiteSpace: 'pre-line' }}
        >
          <AlertTitle>
            {t('formErrors:supervisorGeneralErrorsTitle')}
          </AlertTitle>
          {generalSupervisorErrors.map((error, index) => (
            <Typography variant="body2" key={error.message}>
              {`${t(`${error.message}Content`)} ${index < generalSupervisorErrors.length - 1 ? '\n\n' : ''}`}
            </Typography>
          ))}
        </Alert>
      )}

      {supervisorSelections.map((selection, index) => {
        const { isExternal } = selection

        if (isExternal) {
          return (
            <ExternalPersonInput
              key={
                selection.user?.id ??
                `supervisions-${selection?.creationTimeIdentifier ?? index}`
              }
              index={index}
              inputGroup="supervisions"
              selection={selection}
              handlePersonChange={(value) =>
                handleSupervisorChange(index, value)
              }
              handleRemovePerson={() => handleRemoveSupervisor(index)}
              handlePercentageChange={(percentage) =>
                handlePercentageChange(index, percentage)
              }
              inputErrors={{
                firstName: t(
                  errors.find(
                    (error) =>
                      error.path.join('-') ===
                      `supervisions-${index}-user-firstName`
                  )?.message
                ),
                lastName: t(
                  errors.find(
                    (error) =>
                      error.path.join('-') ===
                      `supervisions-${index}-user-lastName`
                  )?.message
                ),
                email: t(
                  errors.find(
                    (error) =>
                      error.path.join('-') ===
                      `supervisions-${index}-user-email`
                  )?.message
                ),
              }}
              inputProps={{
                required: true,
              }}
              iconButtonProps={{
                disabled: supervisorSelections.length === 1,
              }}
            />
          )
        }

        return (
          <SingleSupervisorSelect
            key={
              selection.user?.id ??
              `supervisions-${selection.creationTimeIdentifier}`
            }
            index={index}
            selection={selection}
            handleSupervisorChange={(value) =>
              handleSupervisorChange(index, value)
            }
            handleRemoveSupervisor={() => handleRemoveSupervisor(index)}
            handlePercentageChange={(percentage) =>
              handlePercentageChange(index, percentage)
            }
            handlePrimarySupervisorChange={() =>
              handlePrimarySupervisorChange(index)
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
              disabled:
                supervisorSelections.length === 1 ||
                selection.isPrimarySupervisor,
            }}
            percentageInputProps={{
              required: true,
              error: Boolean(
                errors.find(
                  (error) => error.message === 'formErrors:supervisorPercentage'
                )
              ),
            }}
            primarySupervisorProps={{
              error: Boolean(
                errors.find(
                  (error) => error.message === 'formErrors:primarySupervisor'
                )
              ),
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
            tabIndex={-1}
            sx={{ display: 'flex', alignItems: 'center' }}
          >
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
        <NewPersonControls
          personGroup="supervisor"
          options={[
            {
              label: t('thesisForm:addSupervisor'),
              isExternal: false,
            },
            {
              label: t('thesisForm:addExternalSupervisor'),
              isExternal: true,
            },
          ]}
          handleAddPerson={handleAddSupervisor}
        />
      )}
    </Stack>
  )
}

export default SupervisorSelect
