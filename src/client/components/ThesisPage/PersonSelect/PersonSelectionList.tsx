import React from 'react'
import { flushSync } from 'react-dom'
import { Box, Divider, Stack, Typography, Tooltip } from '@mui/material'
import { useTranslation } from 'react-i18next'

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
import { ErrorPath, ThesisFormErrors } from '../thesisFormErrors'
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
  errors: ThesisFormErrors
  disabledMode?: boolean
  maxItems?: number
  allowEmpty?: boolean
  allowMultiple?: boolean
  helperTextNode?: React.ReactNode
}

const PersonSelectionList = ({
  type,
  field,
  errors,
  disabledMode = false,
  maxItems = 5,
  allowEmpty = false,
  allowMultiple = true,
  helperTextNode,
}: PersonSelectionListProps) => {
  const { t } = useTranslation()

  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false)
  const [itemToDeleteIndex, setItemToDeleteIndex] = React.useState<
    number | null
  >(null)

  const [deleteConfirmed, setDeleteConfirmed] = React.useState(false)
  const addButtonId = `${field.name}-add-person`

  const openDeleteDialog = (index: number) => {
    setDeleteConfirmed(false)
    setItemToDeleteIndex(index)
    setDeleteDialogOpen(true)
  }

  const selections: BasePersonSelection[] = field.state.value || []

  const displayedSelections =
    !allowEmpty && selections.length === 0
      ? [
          {
            user: null,
            ...getPersonSelectionDefaults(type, 0, 1),
          } as BasePersonSelection,
        ]
      : selections

  const totalPercentage = getTotalPercentage(displayedSelections)

  const allowExternal = type !== 'seminarSupervisor' && selections.length > 0

  const withPrimarySupervisor = <
    T extends { isExternal?: boolean; isPrimarySupervisor?: boolean },
  >(
    supervisions: T[]
  ) => {
    if (
      supervisions.some(
        (supervision) =>
          supervision.isPrimarySupervisor && !supervision.isExternal
      )
    ) {
      return supervisions
    }

    const primaryIndex = supervisions.findIndex(
      (supervision) => !supervision.isExternal
    )

    return supervisions.map((supervision, index) => ({
      ...supervision,
      isPrimarySupervisor: index === primaryIndex,
    }))
  }

  const focusRow = (index: number, isExternal?: boolean) => {
    const inputId = isExternal
      ? `${field.name}-${index}-firstName`
      : `${field.name}-${index}-user`

    const target =
      document.getElementById(inputId) ?? document.getElementById(addButtonId)

    target?.focus()
  }

  const replaceSelections = (
    next: BasePersonSelection[],
    focusIndex: number
  ) => {
    const derived =
      type === 'supervisor'
        ? withPrimarySupervisor(
            getEqualSupervisorSelectionWorkloads(next.length, next)
          )
        : next

    flushSync(() => field.setValue(derived))

    focusRow(focusIndex, derived[focusIndex]?.isExternal)
  }

  const generalErrors = errors.at(field.name, 'general')

  const errorPath = (index: number): ErrorPath =>
    selections.length === 0
      ? [field.name, 'general']
      : [field.name, index, 'user']

  const handleAddPerson = (isExternal: boolean) => {
    const newIndex = selections.length
    const newItem: BasePersonSelection = {
      user: null,
      ...getPersonSelectionDefaults(type, newIndex, newIndex + 1),
      isExternal,
    }

    replaceSelections([...selections, newItem], newIndex)
  }

  const handleRemovePerson = (index: number) => {
    errors.clear(field.name)

    if (selections.length === 1 && !allowEmpty) {
      if (type === 'seminarSupervisor' && !allowMultiple) {
        const emptied = [...selections]
        emptied[index] = {
          ...emptied[index],
          user: null,
          isExternal: false,
        }
        replaceSelections(emptied, index)
      }
      return
    }

    const newSelections = [...selections]
    newSelections.splice(index, 1)

    if (type === 'grader' && index === 0 && newSelections.length > 0) {
      newSelections[0].isPrimaryGrader = true
    }

    replaceSelections(newSelections, Math.max(index - 1, 0))
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
          id={`${field.name}-general`}
          data-testid={`${type}-general-error`}
          severity="error"
          role="presentation"
          title={t(translationKeys[type].generalErrorsTitle)}
        >
          {generalErrors.map((error, index) => (
            <Typography variant="body2" key={error.message}>
              {`${t(`${error.message}Content`)} ${index < generalErrors.length - 1 ? '\n\n' : ''}`}
            </Typography>
          ))}
        </AlertBox>
      )}

      {displayedSelections.map((selection, index) => {
        const isExternal = selection.isExternal
        const key = `${type}-${index}`

        return (
          <React.Fragment key={key}>
            {isExternal ? (
              <ExternalPersonSelect
                type={type}
                index={index}
                selection={selection}
                field={field}
                disabledMode={disabledMode}
                errors={errors}
                errorPath={errorPath(index)}
                onRemove={() => openDeleteDialog(index)}
              />
            ) : (
              <SinglePersonSelect
                type={type}
                index={index}
                selection={selection}
                field={field}
                allowEmpty={allowEmpty}
                totalLength={displayedSelections.length}
                errors={errors}
                errorPath={errorPath(index)}
                onRemove={() => openDeleteDialog(index)}
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
            ...(allowExternal
              ? [
                  {
                    label: t(translationKeys[type].addExternal),
                    isExternal: true,
                  },
                ]
              : []),
          ]}
          handleAddPerson={handleAddPerson}
          buttonId={addButtonId}
        />
      )}

      {itemToDeleteIndex !== null && displayedSelections[itemToDeleteIndex] && (
        <Popup
          open={deleteDialogOpen}
          testId="delete-confirm"
          disableRestoreFocus={deleteConfirmed}
          onClose={() => {
            setDeleteDialogOpen(false)
            setItemToDeleteIndex(null)
          }}
          onSubmit={() => {
            setDeleteConfirmed(true)
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
