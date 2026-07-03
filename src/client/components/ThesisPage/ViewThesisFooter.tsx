import dayjs from 'dayjs'
import { useTranslation } from 'react-i18next'
import { GridSlotProps } from '@mui/x-data-grid'
import {
  Box,
  Button,
  Collapse,
  Grid,
  Link,
  List,
  ListItem,
  ListItemText,
  Paper,
  Skeleton,
  Stack,
  Typography,
  Tooltip,
  Chip,
  Alert,
  Divider,
} from '@mui/material'
import Popup from '../Common/Popup'

import {
  FileData,
  GraderData,
  SeminarSupervisionData,
  SupervisionData,
  ThesisData as Thesis,
  TranslatedName,
  User,
  TranslationLanguage,
  ThesisStatus,
} from '@backend/types'

import { ThesisFooterProps } from '../../types'
import usePrograms from '../../hooks/usePrograms'
import useEvents from '../../hooks/useEvents'
import { useSingleThesis } from '../../hooks/useTheses'

import { BASE_PATH, THESIS_STATUSES } from '../../../config'
import EventsView from '../EventsView/EventsView'
import { useState } from 'react'
import { ChevronRight, ExpandLess, ExpandMore } from '@mui/icons-material'
import {
  useChangeThesisStatusMutation,
  useEditThesisMutation,
} from '../../hooks/useThesesMutation'
import useLoggedInUser from '../../hooks/useLoggedInUser'
import { ProgressView } from './Progress/ProgressView'
import { canApprove, canSetEthesisStudentStarted } from '../../util/permissions'

const StatusRow = ({ thesis }: { thesis: Thesis }) => (
  <Box
    sx={{
      display: 'flex',
      flexDirection: 'row',
      px: 2,
      mt: 2,
      fontSize: '10pt',
    }}
  >
    <Typography
      component="span"
      sx={{
        fontSize: '10pt',
        fontWeight: 600,
        textTransform: 'capitalize',
      }}
    >
      {dayjs(thesis.startDate).format('YYYY-MM-DD')} -{' '}
      {dayjs(thesis.targetDate).format('YYYY-MM-DD')}
    </Typography>
  </Box>
)

const Authors = ({ authors }: { authors: User[] }) => (
  <Typography component="p">
    {authors.map((author, index) => (
      <Typography
        key={author.id}
        component="span"
        variant="subtitle2"
        sx={{
          fontWeight: 400,
        }}
      >
        {author.firstName} {author.lastName}{' '}
        {author.studentNumber ? `(${author.studentNumber})` : ''}
        {index < authors.length - 1 ? ', ' : ''}
      </Typography>
    ))}
  </Typography>
)

const ProgramTrack = ({
  programId,
  studyTrackId,
  isStudentView,
  thesisProgram,
}: {
  programId: string
  studyTrackId: string
  isStudentView?: boolean
  thesisProgram?: any
}) => {
  const { i18n } = useTranslation()
  const { programs, isLoading: programsLoading } = usePrograms({
    includeNotManaged: true,
    enabled: !isStudentView,
  })

  if ((!programs && !thesisProgram) || programsLoading) return null

  const { language } = i18n
  const program = programs?.find((p) => p.id === programId) ?? thesisProgram
  const track = program?.studyTracks?.find((t) => t.id === studyTrackId)

  return (
    <Typography
      component="span"
      sx={{
        display: 'flex',
        alignItems: 'center',
        fontSize: '11pt',
        fontWeight: 500,
        textTransform: 'capitalize',
        gap: 1,
        mb: 2,
        color: 'black',
      }}
    >
      <Chip
        variant="outlined"
        sx={{ fontFamily: 'monospace' }}
        label={program?.id}
      />
      {program?.name[language as keyof TranslatedName]}
      {track && (
        <>
          <ChevronRight fontSize="small" />
          <Typography
            component="span"
            sx={{
              display: 'flex',
              alignItems: 'center',
              fontSize: '11pt',
              fontWeight: 400,
              textTransform: 'capitalize',
              gap: 1,
            }}
          >
            {track.name[language as keyof TranslatedName]}
          </Typography>
        </>
      )}
    </Typography>
  )
}

const Supervisors = ({ supervisors }: { supervisors: SupervisionData[] }) => {
  const { t } = useTranslation()

  return (
    <Grid>
      <Typography
        component="h4"
        sx={{
          fontSize: '1rem',
          fontWeight: 700,
          textTransform: 'uppercase',
        }}
      >
        {t('thesisForm:supervisors')}
      </Typography>
      <List dense>
        {supervisors.map((supervisor) => {
          const primaryText = `${supervisor.user.firstName} ${supervisor.user.lastName} (${supervisor.percentage}%)`
          const secondaryText = supervisor.user.affiliation
            ? `${supervisor.user.email} (${supervisor.user.affiliation})`
            : `${supervisor.user.email}`

          return (
            <ListItem key={supervisor.user.id}>
              <ListItemText primary={primaryText} secondary={secondaryText} />
            </ListItem>
          )
        })}
      </List>
    </Grid>
  )
}

const Graders = ({ graders }: { graders: GraderData[] }) => {
  const { t, i18n } = useTranslation()
  const { language } = i18n
  return (
    <Grid>
      <Typography
        component="h4"
        sx={{
          fontSize: '1rem',
          fontWeight: 700,
          textTransform: 'uppercase',
        }}
      >
        {t('thesisForm:graders')}
      </Typography>
      <List dense>
        {graders.map((grader) => {
          const title = grader.title.fi
            ? `(${grader.title[language as keyof TranslatedName]})`
            : ''
          const primaryText = `${grader.user?.firstName} ${grader.user?.lastName} ${title}`
          const secondaryText = grader.user?.affiliation
            ? `${grader.user?.email} (${grader.user?.affiliation})`
            : `${grader.user?.email}`

          return (
            <ListItem key={grader.user.id}>
              <ListItemText primary={primaryText} secondary={secondaryText} />
            </ListItem>
          )
        })}
      </List>
    </Grid>
  )
}

const SeminarSupervisor = ({
  seminarSupervisions,
}: {
  seminarSupervisions: SeminarSupervisionData[]
}) => {
  const { t } = useTranslation()

  if (!seminarSupervisions.length) return null

  const isPlural = seminarSupervisions.length > 1

  return (
    <Grid>
      <Typography
        component="h4"
        sx={{
          fontSize: '1rem',
          fontWeight: 700,
          textTransform: 'uppercase',
        }}
      >
        {isPlural
          ? t('thesisForm:seminarSupervisorsLabel')
          : t('thesisForm:seminarSupervisor')}
      </Typography>
      <List dense>
        {seminarSupervisions.map((seminarSupervisor) => {
          const primaryText = `${seminarSupervisor.user.firstName} ${seminarSupervisor.user.lastName}`
          const secondaryText = seminarSupervisor.user.affiliation
            ? `${seminarSupervisor.user.email} (${seminarSupervisor.user.affiliation})`
            : `${seminarSupervisor.user.email}`

          return (
            <ListItem key={seminarSupervisor.user.id}>
              <ListItemText primary={primaryText} secondary={secondaryText} />
            </ListItem>
          )
        })}
      </List>
    </Grid>
  )
}

const Attachments = ({
  researchPlan = undefined,
  waysOfWorking = undefined,
}: {
  researchPlan?: FileData | File | undefined
  waysOfWorking?: FileData | File | undefined
}) => {
  const { t } = useTranslation()

  return (
    <Box>
      <Typography
        component="h4"
        sx={{
          fontSize: '1rem',
          fontWeight: 700,
          textTransform: 'uppercase',
        }}
      >
        {t('thesisForm:appendices')}
      </Typography>
      <Stack sx={{ mt: 2, gap: 1 }}>
        {researchPlan && 'filename' in researchPlan && (
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <Typography variant="body2">
              {t('thesisForm:researchPlan')}:
            </Typography>
            <Link
              href={`${BASE_PATH}/api/attachments/${researchPlan.filename}`}
            >
              {researchPlan.name}
            </Link>
          </Box>
        )}
        {waysOfWorking && 'filename' in waysOfWorking && (
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <Typography variant="body2">
              {t('thesisForm:waysOfWorking')}:
            </Typography>
            <Link
              href={`${BASE_PATH}/api/attachments/${waysOfWorking.filename}`}
            >
              {waysOfWorking.name}
            </Link>
          </Box>
        )}
      </Stack>
    </Box>
  )
}

const PreviewSkeleton = () => (
  <Box sx={{ m: 2 }}>
    <Stack
      direction="row"
      spacing={2}
      sx={{
        mb: 2,
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      <Skeleton variant="text" width={200} height={24} />
    </Stack>
    <Skeleton variant="text" width="70%" height={36} />
    <Skeleton variant="text" width={320} height={24} />

    <Box sx={{ mt: 2 }}>
      <Skeleton variant="rectangular" width="100%" height={20} />
    </Box>

    <Box sx={{ p: 2 }}>
      <Skeleton variant="rectangular" width="40%" height={16} />

      <Grid
        container
        sx={{
          mt: 4,
          gap: 4,
        }}
      >
        <Grid>
          <Skeleton variant="rectangular" width={240} height={24} />
          <Box sx={{ mt: 2 }}>
            <Skeleton variant="rectangular" width={240} height={16} />
            <Skeleton
              variant="rectangular"
              sx={{ mt: 1 }}
              width={240}
              height={14}
            />
          </Box>
          <Box sx={{ mt: 2 }}>
            <Skeleton variant="rectangular" width={240} height={16} />
            <Skeleton
              variant="rectangular"
              sx={{ mt: 1 }}
              width={240}
              height={14}
            />
          </Box>
        </Grid>
        <Grid>
          <Skeleton variant="rectangular" width={240} height={24} />
          <Box sx={{ mt: 2 }}>
            <Skeleton variant="rectangular" width={240} height={16} />
            <Skeleton
              variant="rectangular"
              sx={{ mt: 1 }}
              width={240}
              height={14}
            />
          </Box>
          <Box sx={{ mt: 2 }}>
            <Skeleton variant="rectangular" width={240} height={16} />
            <Skeleton
              variant="rectangular"
              sx={{ mt: 1 }}
              width={240}
              height={14}
            />
          </Box>
        </Grid>
      </Grid>
      <Grid
        container
        sx={{
          mt: 4,
          gap: 4,
        }}
      >
        <Grid>
          <Skeleton variant="rectangular" width={240} height={24} />
          <Box sx={{ mt: 2 }}>
            <Skeleton variant="rectangular" width={380} height={16} />
            <Skeleton
              variant="rectangular"
              sx={{ mt: 1 }}
              width={380}
              height={16}
            />
          </Box>
        </Grid>
      </Grid>
    </Box>
  </Box>
)

const ViewThesisFooter = (
  props: GridSlotProps['footer'] & ThesisFooterProps
) => {
  const {
    rowSelectionModel,
    handleEditThesis,
    handleDeleteThesis,
    isStudentView,
  } = props

  const thesisId = (rowSelectionModel.ids != undefined &&
  rowSelectionModel.ids.size > 0
    ? rowSelectionModel.ids.entries().next().value[0]
    : undefined) as unknown as string | undefined

  const { t, i18n } = useTranslation()
  const { language } = i18n as unknown as { language: TranslationLanguage }
  const { user: currentUser } = useLoggedInUser()
  const [eventLogOpen, setEventLogOpen] = useState(false)
  const { thesis, isLoading: thesisLoading } = useSingleThesis(
    thesisId,
    isStudentView
  )
  const { events } = useEvents({ thesisId, enabled: !isStudentView })
  const { mutateAsync: changeThesisStatus } =
    useChangeThesisStatusMutation(isStudentView)
  const { mutateAsync: editThesis } = useEditThesisMutation(isStudentView)

  const [pendingAction, setPendingAction] = useState<
    'approve' | 'sendDraft' | null
  >(null)

  const [ethesisDialogOpen, setEthesisDialogOpen] = useState(false)
  const [ethesisTargetStatus, setEthesisTargetStatus] =
    useState<ThesisStatus | null>(null)

  const isBachelor = thesis?.program?.options?.isBachelorProgram === true
  const ethesisReady =
    currentUser &&
    thesis &&
    (isBachelor ? thesis.graders.length >= 1 : thesis.graders.length >= 2) &&
    thesis.status === THESIS_STATUSES.IN_PROGRESS

  const difference =
    currentUser &&
    thesis?.targetDate &&
    dayjs(thesis.targetDate).isBefore(dayjs())
      ? dayjs(thesis.targetDate).diff(dayjs(), 'day') * -1
      : 0
  const isLate = difference && difference > 0

  return (
    <>
      {thesis ? (
        <Box sx={{ m: 2 }}>
          <Divider></Divider>
          <Stack
            direction="row"
            spacing={2}
            sx={{
              my: 2,
              alignItems: 'center',
              justifyContent: 'end',
            }}
          >
            {thesis && currentUser && (
              <Box sx={{ display: 'flex', gap: 2 }}>
                {thesis.isIdle && (
                  <Button
                    variant="outlined"
                    sx={{
                      fontSize: '12px',
                      height: 24,
                      px: 2,
                      fontWeight: 600,
                    }}
                    onClick={() => {
                      void editThesis({
                        thesisId: thesis.id as string,
                        data: { ...thesis, isIdle: false },
                      })
                    }}
                  >
                    {t('wakeUpFromSleepButton')}
                  </Button>
                )}
                {canApprove(thesis, currentUser!) && (
                  <Button
                    variant="outlined"
                    sx={{
                      color: '#000',
                      backgroundColor: '#fcd34d',
                      borderColor: '#000',
                      fontSize: '12px',
                      height: 24,
                      px: 2,
                      fontWeight: 600,
                    }}
                    onClick={() => setPendingAction('approve')}
                  >
                    {t('approveButton')}
                  </Button>
                )}
                {isStudentView && thesis.status === THESIS_STATUSES.DRAFT && (
                  <Button
                    variant="outlined"
                    sx={{
                      borderColor: '#000',
                      fontSize: '12px',
                      color: '#000',
                      height: 24,
                      px: 2,
                      fontWeight: 600,
                      '&:hover': {
                        backgroundColor: '#000',
                        borderColor: '#000',
                        color: '#FFF',
                      },
                    }}
                    onClick={() => setPendingAction('sendDraft')}
                  >
                    {t('sendDraftButton')}
                  </Button>
                )}
                {!thesis.program?.options?.hideSendToEthesis &&
                  !isStudentView &&
                  (thesis.program?.options?.useMilestones
                    ? canSetEthesisStudentStarted(thesis, currentUser!)
                    : thesis.status === THESIS_STATUSES.IN_PROGRESS) && (
                    <Tooltip
                      title={
                        !ethesisReady
                          ? t('thesisForm:needSecondGraderForEthesis')
                          : ''
                      }
                    >
                      <Box component="span">
                        <Button
                          variant="outlined"
                          disabled={!ethesisReady}
                          onClick={() => {
                            setEthesisTargetStatus(
                              thesis.program?.options
                                ?.allowStudentStartedProcess
                                ? (THESIS_STATUSES.ETHESIS as ThesisStatus)
                                : THESIS_STATUSES.ETHESIS_SENT
                            )
                            setEthesisDialogOpen(true)
                          }}
                          sx={{
                            color: '#fff',
                            backgroundColor: '#000',
                            borderColor: '#000',
                            fontSize: '12px',
                            height: 24,
                            px: 2,
                            fontWeight: 600,
                            '&:hover': {
                              backgroundColor: '#fff',
                              borderColor: '#000',
                              color: '#000',
                            },
                            '&.Mui-disabled': {
                              color: 'rgba(255, 255, 255, 0.5)',
                              backgroundColor: 'rgba(0, 0, 0, 0.5)',
                            },
                          }}
                        >
                          {thesis.program?.options?.allowStudentStartedProcess
                            ? t('thesisForm:setEthesisStudentStarted')
                            : t('thesisForm:setSentToEthesis')}
                        </Button>
                      </Box>
                    </Tooltip>
                  )}
                {(!isStudentView ||
                  thesis.status === THESIS_STATUSES.DRAFT) && (
                  <Button
                    variant="outlined"
                    sx={{
                      fontSize: '12px',
                      height: 24,
                      px: 2,
                      fontWeight: 600,
                    }}
                    onClick={() => handleEditThesis(thesis)}
                  >
                    {t('editButton')}
                  </Button>
                )}

                {(!isStudentView ||
                  thesis.status === THESIS_STATUSES.DRAFT) && (
                  <Button
                    variant="contained"
                    color="error"
                    sx={{
                      fontSize: '12px',
                      height: 24,
                      px: 2,
                      boxShadow: 0,
                      fontWeight: 600,
                    }}
                    onClick={() => handleDeleteThesis(thesis)}
                  >
                    {t('deleteButton')}
                  </Button>
                )}
              </Box>
            )}
          </Stack>

          <Stack
            direction="row"
            sx={{ justifyContent: 'space-between', alignItems: 'baseline' }}
          >
            <ProgramTrack
              programId={thesis.programId}
              studyTrackId={thesis.studyTrackId!}
              isStudentView={isStudentView}
              thesisProgram={thesis.program}
            />
            <StatusRow thesis={thesis} />
          </Stack>

          <Typography
            component="h3"
            sx={{
              fontSize: '1.5rem',
              fontWeight: 800,
            }}
          >
            {thesis.topic}
          </Typography>

          <Authors authors={thesis.authors} />

          {thesis.status == 'IN_PROGRESS' && isLate != false && (
            <Alert
              severity={difference > 180 ? 'error' : 'warning'}
              sx={{ my: 1.5 }}
            >
              {t('viewThesisFooter:thesisLate').replace(
                '{difference}',
                difference
              )}{' '}
              {dayjs(thesis.startDate).format('YYYY-MM-DD')}
            </Alert>
          )}

          {thesis.status == 'COMPLETED' && isLate != false && (
            <Alert severity="info" sx={{ my: 1.5 }}>
              {t('viewThesisFooter:thesisComplete')}
            </Alert>
          )}

          {thesis.isIdle && (
            <Alert severity="info" sx={{ my: 1.5 }}>
              {t('viewThesisFooter:thesisIdle')}
            </Alert>
          )}

          <ProgressView
            thesis={thesis}
            isStudentView={isStudentView}
          ></ProgressView>

          <Box sx={{ p: 2 }}>
            <Grid
              container
              sx={{
                mt: 4,
                gap: 4,
              }}
            >
              <Supervisors supervisors={thesis.supervisions} />
              <SeminarSupervisor
                seminarSupervisions={thesis.seminarSupervisions ?? []}
              />
              <Graders graders={thesis.graders} />
            </Grid>

            <Attachments
              researchPlan={thesis?.researchPlan}
              waysOfWorking={thesis?.waysOfWorking}
            />
          </Box>

          {Boolean(events && events.length) &&
            !isStudentView &&
            currentUser.isAdmin && (
              <Paper
                elevation={0}
                sx={{
                  p: 2,
                  mb: 2,
                  border: '1px solid',
                  borderColor: 'divider',
                }}
              >
                <Typography
                  component="legend"
                  sx={{
                    cursor: 'pointer',
                    color: 'text.primary',
                    display: 'flex',
                    alignItems: 'flex-start',
                  }}
                  onClick={() => setEventLogOpen(!eventLogOpen)}
                >
                  <span style={{ marginRight: '0.5rem' }}>
                    {eventLogOpen ? <ExpandLess /> : <ExpandMore />}
                  </span>
                  {t('eventLog:title')}
                </Typography>
                <Collapse in={eventLogOpen}>
                  <EventsView events={events} />
                </Collapse>
              </Paper>
            )}
        </Box>
      ) : (
        thesisLoading && <PreviewSkeleton />
      )}

      {thesis && (
        <Popup
          open={pendingAction !== null}
          onClose={() => setPendingAction(null)}
          title={
            pendingAction === 'approve'
              ? t('approveButtonConfirmTitle', 'Confirm Approval')
              : t('sendDraftButtonConfirmTitle', 'Confirm Send Draft')
          }
          onSubmit={() => {
            if (pendingAction === 'approve') {
              void changeThesisStatus({
                theses: [thesis],
                status: THESIS_STATUSES.IN_PROGRESS,
              })
            } else if (pendingAction === 'sendDraft') {
              void changeThesisStatus({
                theses: [thesis],
                status: THESIS_STATUSES.SUGGESTED,
              })
            }
            setPendingAction(null)
          }}
          submitText={t('submitButton')}
          cancelText={t('cancelButton')}
        >
          <Typography>
            {pendingAction === 'approve'
              ? t('approveButtonConfirmContent')
              : t('sendDraftButtonConfirmContent')}
          </Typography>
        </Popup>
      )}

      {thesis && (
        <Popup
          open={ethesisDialogOpen}
          onClose={() => {
            setEthesisDialogOpen(false)
            setEthesisTargetStatus(null)
          }}
          onSubmit={() => {
            setEthesisDialogOpen(false)
            if (ethesisTargetStatus) {
              void changeThesisStatus({
                theses: [thesis],
                status: ethesisTargetStatus,
              })
            }
            setEthesisTargetStatus(null)
          }}
          title={
            thesis.program?.options?.allowStudentStartedProcess
              ? t('thesisForm:toSubmitEthesisStudentStarted')
              : t('thesisForm:toSubmitEthesis')
          }
          submitText={t('common:submitButton')}
          cancelText={t('common:cancelButton')}
        >
          <Box sx={{ mt: 1, maxHeight: 300, overflowY: 'auto' }}>
            <List dense disablePadding>
              <ListItem disableGutters sx={{ alignItems: 'flex-start' }}>
                <ListItemText
                  primary={t('common:topicHeader')}
                  secondary={thesis.topic}
                  primaryTypographyProps={{ variant: 'body2', fontWeight: 500 }}
                  secondaryTypographyProps={{
                    variant: 'caption',
                    color: 'text.secondary',
                  }}
                />
              </ListItem>

              <ListItem disableGutters sx={{ alignItems: 'flex-start' }}>
                <ListItemText
                  primary={t('author')}
                  secondary={thesis.authors
                    .toSorted((a, b) => a.lastName.localeCompare(b.lastName))
                    .map(
                      (author) =>
                        `${author.lastName} ${author.firstName} ${
                          author.studentNumber
                            ? `(${author.studentNumber})`
                            : ''
                        }`
                    )
                    .join(', ')}
                  primaryTypographyProps={{ variant: 'body2', fontWeight: 500 }}
                  secondaryTypographyProps={{
                    variant: 'caption',
                    color: 'text.secondary',
                  }}
                />
              </ListItem>

              {thesis.graders.length > 0 && (
                <ListItem disableGutters sx={{ alignItems: 'flex-start' }}>
                  <ListItemText
                    primary={t('thesisForm:graders')}
                    secondary={thesis.graders.map((grader) => (
                      <span key={grader.user.id} style={{ display: 'block' }}>
                        {grader.user.lastName} {grader.user.firstName},{' '}
                        {grader.title[language]}
                      </span>
                    ))}
                    primaryTypographyProps={{
                      variant: 'body2',
                      fontWeight: 500,
                    }}
                    secondaryTypographyProps={{
                      variant: 'caption',
                      color: 'text.secondary',
                    }}
                  />
                </ListItem>
              )}
            </List>
          </Box>
        </Popup>
      )}
    </>
  )
}

export default ViewThesisFooter
