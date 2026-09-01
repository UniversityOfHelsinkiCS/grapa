import React from 'react'
import { Box, Divider, Stack, Typography, Tooltip } from '@mui/material'
import { useTranslation } from 'react-i18next'
import { v4 as uuidv4 } from 'uuid'

import NewPersonControls from '../NewPersonControls'
import SinglePersonSelect from './SinglePersonSelect'
import ExternalPersonSelect from './ExternalPersonSelect'
import { EmployeeUser as User } from '@backend/validators/userResponse'
import AlertBox from '../../Common/AlertBox'
import Popup from '../../Common/Popup'
import {
  getEqualSupervisorSelectionWorkloads,
  getTotalPercentage,
} from '../util'

import { getPersonSelectionDefaults } from '../thesisValidator'
import { AnyFieldApi } from '@tanstack/react-form'

export type PersonType = 'supervisor' | 'grader' | 'seminarSupervisor'

export interface BasePersonSelection {
  user: Partial<User> | null
  isExternal: boolean
  percentage?: number
  isPrimarySupervisor?: boolean
  isPrimaryGrader?: boolean
  creationTimeIdentifier?: string
}

const translationKeys = {
  supervisor: {
    title: 'thesisForm:supervisors',
    addPrimary: 'thesisForm:addSupervisor',
    addExternal: 'thesisForm:addExternalSupervisor',
    removeTitle: 'thesisForm:removeSupervisorConfirmationTitle',
    removeContent: 'thesisForm:removeSupervisorConfirmationContent',
    removeNoName: 'thesisForm:removeSupervisorConfirmationNoName',
    generalErrorsTitle: 'formErrors:supervisorGeneralErrorsTitle',
    ariaLabel: 'thesisForm:supervisorButtonGroupAriaLabel',
  },
  grader: {
    title: 'thesisForm:graders',
    addPrimary: 'thesisForm:addPrimaryGrader',
    addExternal: 'thesisForm:addSecondaryGrader',
    removeTitle: 'thesisForm:removeGraderConfirmationTitle',
    removeContent: 'thesisForm:removeGraderConfirmationContent',
    removeNoName: 'thesisForm:removeGraderConfirmationNoName',
    generalErrorsTitle: 'formErrors:graderGeneralErrorsTitle',
    ariaLabel: 'thesisForm:graderButtonGroupAriaLabel',
  },
  seminarSupervisor: {
    title: 'thesisForm:seminarSupervisor',
    addPrimary: 'thesisForm:addSeminarSupervisor',
    addExternal: '',
    removeTitle: 'thesisForm:removeSeminarSupervisorConfirmationTitle',
    removeContent: 'thesisForm:removeSeminarSupervisorConfirmationContent',
    removeNoName: 'thesisForm:removeSeminarSupervisorConfirmationNoName',
    generalErrorsTitle: 'formErrors:seminarSupervisorGeneralErrorsTitle',
    ariaLabel: 'thesisForm:seminar-supervisorButtonGroupAriaLabel',
  },
} as const

interface PersonSelectionListProps {
  type: PersonType
  field: AnyFieldApi // The field from @tanstack/react-form
  disabledMode?: boolean
  maxItems?: number
  allowEmpty?: boolean
  allowMultiple?: boolean
  helperTextNode?: React.ReactNode
  generalErrors?: string[]
}

const PersonSelectionList = ({
  type,
  field,
  disabledMode = false,
  maxItems = 5,
  allowEmpty = false,
  allowMultiple = true,
  helperTextNode,
  generalErrors = [],
}: PersonSelectionListProps) => {
  const { t } = useTranslation()

  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false)
  const [itemToDeleteIndex, setItemToDeleteIndex] = React.useState<
    number | null
  >(null)

  const selections: BasePersonSelection[] = field.state.value || []

  const displayedSelections =
    !allowEmpty && selections.length === 0
      ? [
          {
            user: null,
            creationTimeIdentifier: 'default-empty',
            ...getPersonSelectionDefaults(type, 0, 1),
          } as BasePersonSelection,
        ]
      : selections

  const totalPercentage = getTotalPercentage(displayedSelections)

  const handleAddPerson = (isExternal: boolean) => {
    const newLength = selections.length + 1
    const newItem: BasePersonSelection = {
      user: null,
      creationTimeIdentifier: uuidv4(),
      ...getPersonSelectionDefaults(type, selections.length, newLength),
      isExternal,
    }

    if (type === 'supervisor') {
      const updated = getEqualSupervisorSelectionWorkloads(
        newLength,
        selections
      )
      field.setValue([
        ...updated,
        {
          ...newItem,
          percentage: Math.floor((1 / newLength) * 100),
        },
      ])
    } else if (type === 'grader') {
      field.pushValue(newItem)
    } else {
      field.pushValue(newItem)
    }
  }

  const handleRemovePerson = (index: number) => {
    if (selections.length === 1 && !allowEmpty) {
      if (type === 'seminarSupervisor' && !allowMultiple) {
        const newSelections = [...selections]
        newSelections[index] = {
          ...newSelections[index],
          user: null,
          isExternal: false,
        }
        field.setValue(newSelections)
        return
      }
      if (allowEmpty) {
        field.setValue([])
      }
      return
    }

    const newSelections = [...selections]
    newSelections.splice(index, 1)

    if (type === 'supervisor') {
      const updated = getEqualSupervisorSelectionWorkloads(
        newSelections.length,
        newSelections
      )
      field.setValue(updated)
    } else if (type === 'grader') {
      if (index === 0 && newSelections.length > 0) {
        newSelections[0].isPrimaryGrader = true
      }
      field.setValue(newSelections)
    } else {
      field.setValue(newSelections)
    }
  }

  const handlePrimaryChange = (index: number) => {
    if (type === 'supervisor') {
      const newSelections = selections.map((s, i) => ({
        ...s,
        isPrimarySupervisor: i === index,
      }))
      field.setValue(newSelections)
    } else if (type === 'grader') {
      const newSelections = selections.map((s, i) => ({
        ...s,
        isPrimaryGrader: i === index,
      }))
      field.setValue(newSelections)
    }
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
        {t(translationKeys[type].title)}
      </Typography>

      {helperTextNode}

      {generalErrors.length > 0 && (
        <AlertBox
          id={`${type}-general-error`}
          data-testid={`${type}-general-error`}
          severity="error"
          aria-live="polite"
          title={t(translationKeys[type].generalErrorsTitle)}
        >
          {generalErrors.map((err, i) => (
            <Typography variant="body2" key={err}>
              {`${t(`${err}Content`)} ${i < generalErrors.length - 1 ? '\n\n' : ''}`}
            </Typography>
          ))}
        </AlertBox>
      )}

      {displayedSelections.map((selection, index) => {
        const isExternal = selection.isExternal
        const key =
          selection.user?.id ??
          `${type}-${selection.creationTimeIdentifier ?? index}`

        return (
          <React.Fragment key={key}>
            {isExternal ? (
              <ExternalPersonSelect
                type={type}
                index={index}
                selection={selection}
                field={field}
                disabledMode={disabledMode}
                onRemove={() => {
                  setItemToDeleteIndex(index)
                  setDeleteDialogOpen(true)
                }}
              />
            ) : (
              <SinglePersonSelect
                type={type}
                index={index}
                selection={selection}
                field={field}
                allowEmpty={allowEmpty}
                totalLength={displayedSelections.length}
                onRemove={() => {
                  setItemToDeleteIndex(index)
                  setDeleteDialogOpen(true)
                }}
                onPrimaryChange={() => handlePrimaryChange(index)}
              />
            )}
          </React.Fragment>
        )
      })}

      {type === 'supervisor' && (
        <Divider component="div" role="presentation" textAlign="right">
          <Tooltip
            title={t('thesisForm:supervisionPercentageTooltip')}
            placement="bottom"
            arrow
          >
            <Box tabIndex={-1} sx={{ display: 'flex', alignItems: 'center' }}>
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
      )}

      {displayedSelections.length < (allowMultiple ? maxItems : 1) && (
        <NewPersonControls
          personGroup={
            type === 'seminarSupervisor' ? 'seminar-supervisor' : type
          }
          ariaLabel={t(translationKeys[type].ariaLabel)}
          options={[
            {
              label: t(translationKeys[type].addPrimary),
              isExternal: false,
            },
            ...(type !== 'seminarSupervisor'
              ? [
                  {
                    label: t(translationKeys[type].addExternal),
                    isExternal: true,
                  },
                ]
              : []),
          ]}
          handleAddPerson={handleAddPerson}
        />
      )}

      {itemToDeleteIndex !== null && displayedSelections[itemToDeleteIndex] && (
        <Popup
          open={deleteDialogOpen}
          testId="delete-confirm"
          onClose={() => {
            setDeleteDialogOpen(false)
            setItemToDeleteIndex(null)
          }}
          onSubmit={() => {
            setDeleteDialogOpen(false)
            handleRemovePerson(itemToDeleteIndex)
            setItemToDeleteIndex(null)
          }}
          title={t(translationKeys[type].removeTitle)}
          submitText={t('common:deleteButton')}
          submitButtonProps={{ 'data-testid': 'delete-confirm-button' } as any}
          submitColor="error"
          cancelText={t('common:cancelButton')}
        >
          <Box>
            {displayedSelections[itemToDeleteIndex].user?.firstName ||
            displayedSelections[itemToDeleteIndex].user?.lastName
              ? t(translationKeys[type].removeContent, {
                  name: `${displayedSelections[itemToDeleteIndex].user?.firstName || ''} ${
                    displayedSelections[itemToDeleteIndex].user?.lastName || ''
                  }`.trim(),
                })
              : t(translationKeys[type].removeNoName, {
                  index: itemToDeleteIndex + 1,
                })}
          </Box>
        </Popup>
      )}
    </Stack>
  )
}

export default PersonSelectionList
