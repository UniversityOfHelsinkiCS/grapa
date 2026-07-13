import {
  Box,
  Typography,
  Button,
  Card,
  Stack,
  DialogContentText,
} from '@mui/material'
import Popup from '../../Common/Popup'

import { useTranslation } from 'react-i18next'
import { useEditThesisMutation } from '../../../hooks/useThesesMutation'
import { useState } from 'react'
import { TranslationLanguage } from '@backend/types'

interface ProgressViewProps {
  thesis: any
  isStudentView?: boolean
}

export const ProgressView = ({
  thesis,
  isStudentView = false,
}: ProgressViewProps) => {
  const { t, i18n } = useTranslation()
  const { language } = i18n as { language: TranslationLanguage }
  const editThesisMutation = useEditThesisMutation(isStudentView)
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false)

  const useStudentStartedProcess =
    thesis.program.options?.allowStudentStartedProcess

  const programMilestones = thesis.program.options?.milestones?.versions?.at(
    thesis.milestoneVersion != null ? thesis.milestoneVersion : -1
  )

  const useMilestones =
    thesis.program.options?.useMilestones &&
    thesis.milestoneVersion != null &&
    programMilestones !== undefined

  const milestones =
    useMilestones && programMilestones
      ? programMilestones.map((milestone: { value: any }, index: number) => {
          const val = milestone.value
          const description =
            typeof val === 'string' ? val : val[language] || val.fi || ''

          return {
            description,
            milestone_index: index + 1,
            milestone: true,
            name: `${t('progressView:milestone')} ${index + 1}`,
          }
        })
      : []

  const startStatuses = thesis.program.options?.allowStudentStartedProcess
    ? [
        { statusId: 'DRAFT', name: t('thesisStages:draft') },
        { statusId: 'SUGGESTED', name: t('thesisStages:suggested') },
      ]
    : [{ statusId: 'PLANNING', name: t('thesisStages:planned') }]

  const steps = [
    ...startStatuses,
    { statusId: 'IN_PROGRESS', name: t('thesisStages:inProgress') },
    ...milestones,
    ...(!thesis.program.options?.hideSendToEthesis && !useStudentStartedProcess
      ? [{ statusId: 'ETHESIS_SENT', name: t('thesisStages:ethesisSent') }]
      : []),
    {
      statusId: 'ETHESIS',
      name: useStudentStartedProcess
        ? t('thesisStages:ethesis_studentstarted')
        : t('thesisStages:ethesis'),
    },
    { statusId: 'COMPLETED', name: t('thesisStages:completed') },
  ]

  const getCalculatedStep = () => {
    if (thesis.status === 'IN_PROGRESS') {
      const inProgressIdx = steps.findIndex((s) => s.statusId === 'IN_PROGRESS')
      return inProgressIdx !== -1
        ? inProgressIdx + 1 + (thesis.milestone || 0)
        : 0
    }

    const idx = steps.findIndex((s) => s.statusId === thesis.status)

    return idx !== -1 ? idx + 1 : 0
  }

  const inProgressIndex = steps.findIndex((s) => s.statusId === 'IN_PROGRESS')

  const getVisibleStep = (index: number) => {
    if (useMilestones && steps[index].milestone) {
      if (inProgressIndex < index) {
        return inProgressIndex !== -1
          ? inProgressIndex + 1 + '.' + Math.abs(inProgressIndex - index)
          : '?'
      }
    }

    if (index > inProgressIndex && useMilestones && programMilestones) {
      return index - programMilestones.length + 1
    }

    return index + 1
  }

  const milestoneStep = thesis.milestone || 0
  const step = getCalculatedStep()

  const saveMilestone = (delta: number) => {
    editThesisMutation.mutate({
      thesisId: thesis.id,
      data: {
        ...thesis,
        milestone: milestoneStep + delta,
      },
    })
  }

  const handleCancelConfirmation = () => {
    setConfirmDialogOpen(false)
  }

  const handleConfirmLastMilestone = () => {
    editThesisMutation.mutate(
      {
        thesisId: thesis.id,
        data: {
          ...thesis,
          milestone: milestoneStep + 1,
        },
      },
      {
        onSuccess: () => {
          setConfirmDialogOpen(false)
        },
      }
    )
  }

  return (
    <Box sx={{ width: '100%', marginTop: '0.5rem' }}>
      <Card
        variant="outlined"
        sx={{
          p: 2,
        }}
      >
        <Typography variant="h5" sx={{ mb: 2 }}>
          {t('progressView:title')}
        </Typography>

        <Stack
          direction="row"
          sx={{
            justifyContent: 'space-between',
          }}
        >
          {steps.map((label, index) => (
            <Box
              key={label.name}
              sx={{
                flexGrow: label.milestone ? 1 : 0.1,
                borderTop: steps[index].milestone
                  ? step > index
                    ? '0.25rem solid #005a94'
                    : '0.25rem solid #9e9e9e'
                  : 'none',
                maxWidth: '20rem',
                color:
                  step > index || (step == index && steps[step].milestone)
                    ? 'black'
                    : '#9e9e9e',
              }}
            >
              <Box
                sx={{
                  px: 2,
                  py: 2,
                  mt: steps[index].milestone ? 2 : 0,
                  maxWidth: '20rem',
                  backgroundColor: step - 1 == index ? '#cfe0eb' : null,
                }}
              >
                <Box
                  sx={{
                    backgroundColor: step > index ? 'primary.main' : '#9e9e9e',
                    width: '2rem',
                    height: '2rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 'bold',
                    color: 'white',
                    mb: 1,
                  }}
                >
                  {getVisibleStep(index)}
                </Box>
                <Typography
                  variant="subtitle2"
                  sx={{
                    fontWeight: 'bold',
                  }}
                >
                  {!label.milestone ? label.name + ' ' : null}
                </Typography>
                <Typography
                  sx={{
                    fontSize: 'small',
                  }}
                >
                  {label.description}
                </Typography>
              </Box>
            </Box>
          ))}
        </Stack>

        {thesis.status === 'IN_PROGRESS' &&
          step >= 1 &&
          (steps[step - 1].milestone ||
            (steps[step] && steps[step].milestone)) &&
          steps[step - 1]?.milestone_index !== milestones.length && (
            <Stack
              direction="row"
              sx={{
                gap: 1,
                mt: 3,
              }}
            >
              <Button
                variant="contained"
                disabled={!steps[step].milestone}
                onClick={() => {
                  if (steps[step]?.milestone_index === milestones.length) {
                    setConfirmDialogOpen(true)
                  } else {
                    saveMilestone(1)
                  }
                }}
              >
                {t('progressView:doneButton').replace(
                  '{0}',
                  steps[step]?.milestone_index
                    ? inProgressIndex + 1 + '.' + steps[step].milestone_index
                    : ''
                )}
              </Button>

              <Button
                variant="outlined"
                disabled={
                  (step >= 1 && !steps[step - 1]?.milestone) ||
                  editThesisMutation.isPending
                }
                onClick={() => saveMilestone(-1)}
              >
                {t('progressView:cancelButton')}
              </Button>
            </Stack>
          )}
      </Card>
      <Popup
        open={confirmDialogOpen}
        onClose={handleCancelConfirmation}
        title={t('progressView:lastMilestoneConfirmationTitle')}
        onSubmit={handleConfirmLastMilestone}
        submitText={t('common:approveButton')}
        submitColor="primary"
        submitDisabled={editThesisMutation.isPending}
        cancelText={t('common:cancelButton')}
      >
        <DialogContentText id="confirm-dialog-description">
          {t('progressView:lastMilestoneConfirmationText')}
        </DialogContentText>
      </Popup>
    </Box>
  )
}
