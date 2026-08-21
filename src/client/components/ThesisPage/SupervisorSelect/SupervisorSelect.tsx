import { Box, Divider, Stack, Tooltip, Typography } from '@mui/material'
import { EmployeeUser as User } from '@backend/validators/userResponse'
import { SupervisionData } from '@backend/validators/thesisResponse'

import { v4 as uuidv4 } from 'uuid'
import { useTranslation } from 'react-i18next'
import { ZodIssue } from 'zod'
import AlertBox from '../../Common/AlertBox'
import SingleSupervisorSelect from './SingleSupervisorSelect'
import {
  getEqualSupervisorSelectionWorkloads,
  getTotalPercentage,
} from '../util'
import ExternalPersonInput from '../ExternalPerson'
import NewPersonControls from '../NewPersonControls'

interface SupervisorSelectProps {
  errors: ZodIssue[]
  setErrors: (errors: ZodIssue[]) => void
  supervisorSelections: SupervisionData[]
  setSupervisorSelections: (newSupervisions: SupervisionData[]) => void
  disabledMode: boolean
  allowEmpty?: boolean
}

const SupervisorSelect = ({
  errors,
  setErrors,
  supervisorSelections,
  setSupervisorSelections,
  disabledMode,
  allowEmpty = false,
}: SupervisorSelectProps) => {
  const { t } = useTranslation()

  const displayedSelections =
    !allowEmpty && supervisorSelections.length === 0
      ? [
          {
            user: null,
            percentage: 100,
            isExternal: false,
            isPrimarySupervisor: true,
          } as SupervisionData,
        ]
      : supervisorSelections

  const totalPercentage = getTotalPercentage(displayedSelections)
  const generalSupervisorErrors = errors.filter((error) =>
    error.path.join('-').endsWith('general-supervisor-error')
  )

  const handleSupervisorChange = (index: number, supervisor: Partial<User>) => {
    const updatedSelections = [...displayedSelections]
    updatedSelections[index].user = supervisor
    setSupervisorSelections(updatedSelections)

    const updatedErrors = errors.filter(
      (error) => !error.path.join('-').startsWith(`supervisions-${index}-user`)
    )
    setErrors(updatedErrors)
  }

  const handlePercentageChange = (index: number, percentage: number) => {
    const newPercentage = Number.isNaN(percentage) ? 0 : percentage
    if (newPercentage < 0 || newPercentage > 100) return

    const updatedSelections = [...displayedSelections]
    updatedSelections[index].percentage = newPercentage
    setSupervisorSelections(updatedSelections)

    const updatedErrors = errors.filter(
      (error) => error.message !== 'formErrors:supervisorPercentage'
    )
    setErrors(updatedErrors)
  }

  const handlePrimarySupervisorChange = (index: number) => {
    const updatedSelections = displayedSelections.map((selection, i) => ({
      ...selection,
      isPrimarySupervisor: i === index,
    }))

    setSupervisorSelections(updatedSelections)
  }

  const handleAddSupervisor = (isExternal: boolean) => {
    const numberOfSupervisors = displayedSelections.length + 1

    const updatedSelections = getEqualSupervisorSelectionWorkloads(
      numberOfSupervisors,
      displayedSelections
    )
    setSupervisorSelections([
      ...updatedSelections,
      {
        user: null,
        percentage: Math.floor((1 / numberOfSupervisors) * 100),
        isExternal,
        isPrimarySupervisor: numberOfSupervisors === 1,
        creationTimeIdentifier: uuidv4(), // This is a shit hack for dealing w/ React keys and an anti-pattern, but couldn't figure out anything else -- See #43 comments
      },
    ])
  }

  const handleRemoveSupervisor = (index: number) => {
    const initialSelections = [...displayedSelections]
    initialSelections.splice(index, 1)
    if (initialSelections.length === 0) {
      if (allowEmpty) {
        setSupervisorSelections([])
      }
      return
    }

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
        <AlertBox
          id="supervisions-general-supervisor-error"
          data-testid="supervisions-general-supervisor-error"
          severity="error"
          aria-live="polite"
          title={t('formErrors:supervisorGeneralErrorsTitle')}
        >
          {generalSupervisorErrors.map((error, index) => (
            <Typography variant="body2" key={error.message}>
              {`${t(`${error.message}Content`)} ${index < generalSupervisorErrors.length - 1 ? '\n\n' : ''}`}
            </Typography>
          ))}
        </AlertBox>
      )}

      {displayedSelections.map((selection, index) => {
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
                affiliation: t(
                  errors.find(
                    (error) =>
                      error.path.join('-') ===
                      `supervisions-${index}-user-affiliation`
                  )?.message
                ),
              }}
              inputProps={{
                required: true,
              }}
              iconButtonProps={{
                disabled: !allowEmpty && displayedSelections.length === 1,
              }}
              percentageInputProps={{
                required: true,
                error: Boolean(
                  errors.find(
                    (error) =>
                      error.message === 'formErrors:supervisorPercentage'
                  )
                ),
              }}
              editDisabled={!disabledMode && selection?.user?.id !== undefined}
            />
          )
        }

        return (
          <SingleSupervisorSelect
            key={
              selection.user?.id ??
              `supervisions-${selection.creationTimeIdentifier ?? index}`
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
                (!allowEmpty && displayedSelections.length === 1) ||
                (displayedSelections.length > 1 &&
                  selection.isPrimarySupervisor),
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
              color={
                displayedSelections.length > 0 && totalPercentage !== 100
                  ? 'error'
                  : ''
              }
            >
              {displayedSelections.length > 0
                ? t('thesisForm:totalSupervisionPercentage', {
                    totalPercentage,
                  })
                : t('thesisForm:totalSupervisionPercentage', {
                    totalPercentage: 0,
                  })}
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
