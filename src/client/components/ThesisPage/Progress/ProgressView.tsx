import { Box, Typography, Button, Card, Stack } from '@mui/material'

import { useTranslation } from 'react-i18next'

import { useState } from 'react'

export const ProgressView = (things: any) => {
  const { t } = useTranslation()
  const { thesis, editThesis } = things

  const useMilestones =
    thesis.program.options?.useMilestones && thesis.milestoneVersion != null

  const base_statuses = {
    CANCELLED: 0,
    DRAFT: 0,
    SUGGESTED: 0,
    PLANNING: 0,
  }

  const statuses = thesis.program.options?.allowStudentStartedProcess
    ? {
        ...base_statuses,
        DRAFT: 1,
        SUGGESTED: 2,
        IN_PROGRESS: 3,
        COMPLETED: 4,
        ETHESIS: 6,
        ETHESIS_SENT: 5,
      }
    : {
        ...base_statuses,
        PLANNING: 1,
        IN_PROGRESS: 2,
        COMPLETED: 5,
        ETHESIS: 4,
        ETHESIS_SENT: 3,
      }

  const programMilestones = thesis.program.options?.milestones?.versions.at(
    thesis.milestoneVersion ? thesis.milestoneVersion : -1
  )

  const milestones =
    useMilestones && programMilestones
      ? programMilestones.map((milestone: { value: any }, index: number) => {
          return {
            description: milestone.value,
            milestone_index: index + 1,
            milestone: true,
            name: `${t('progressView:milestone')} ${index + 1}`,
          }
        })
      : []

  const startStatuses = thesis.program.options?.allowStudentStartedProcess
    ? [
        {
          name: t('thesisStages:draft'),
        },
        {
          name: t('thesisStages:suggested'),
        },
      ]
    : [
        {
          name: t('thesisStages:planned'),
        },
      ]

  const steps = [
    ...startStatuses,
    {
      name: t('thesisStages:inProgress'),
    },
    ...milestones,
    ...(!thesis.program.options?.hideSendToEthesis
      ? [
          {
            name: t('thesisStages:ethesisSent'),
          },
        ]
      : []),
    {
      name: t('thesisStages:ethesis'),
    },
    {
      name: t('thesisStages:completed'),
    },
  ]

  const [milestoneStep, setMilestoneStep] = useState(
    thesis.milestone ? thesis.milestone : 0
  )

  const [step, setStep] = useState(
    statuses[thesis.status] + (thesis.milestone ? thesis.milestone : 0)
  )

  const saveMilestone = (delta: number) => {
    editThesis({
      thesisId: thesis.id,
      data: {
        ...thesis,
        milestone: milestoneStep + delta,
      },
    })
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
                px: 2,
                py: 2,
                maxWidth: '20rem',
                color:
                  step > index || (step == index && steps[step].milestone)
                    ? 'black'
                    : '#9e9e9e',
                backgroundColor:
                  step == index && steps[step].milestone ? '#cfe0eb' : null,
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
                {index + 1}
              </Box>
              <Typography
                variant="subtitle2"
                sx={{
                  fontWeight: 'bold',
                }}
              >
                {label.name}{' '}
                {index == step && steps[step].milestone && (
                  <Typography
                    sx={{
                      fontSize: 'small',
                      color: 'primary.main',
                    }}
                  >
                    {t('progressView:inProgress')}
                  </Typography>
                )}
              </Typography>
              <Typography
                sx={{
                  fontSize: 'small',
                }}
              >
                {label.description}
              </Typography>
            </Box>
          ))}
        </Stack>

        {step >= 1 &&
          (steps[step - 1].milestone ||
            (steps[step] && steps[step].milestone)) && (
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
                  setStep(step + 1)
                  setMilestoneStep(milestoneStep + 1)
                  saveMilestone(1)
                }}
              >
                {t('progressView:doneButton').replace(
                  '{0}',
                  steps[step].milestone_index ? steps[step].milestone_index : ''
                )}
              </Button>
              <Button
                variant="outlined"
                disabled={step >= 1 && !steps[step - 1].milestone}
                onClick={() => {
                  setStep(step - 1)
                  setMilestoneStep(milestoneStep - 1)
                  saveMilestone(-1)
                }}
              >
                {t('progressView:cancelButton')}
              </Button>
            </Stack>
          )}
      </Card>
    </Box>
  )
}
