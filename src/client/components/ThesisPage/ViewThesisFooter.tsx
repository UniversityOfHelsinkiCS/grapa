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
} from '@mui/material'
import Popup from '../Common/Popup'
import ArrowRightAltIcon from '@mui/icons-material/ArrowRightAlt'

import {
  FileData,
  GraderData,
  SeminarSupervisionData,
  SupervisionData,
  ThesisData as Thesis,
  TranslatedName,
  User,
} from '@backend/types'

import { StatusLocale, ThesisFooterProps } from '../../types'
import usePrograms from '../../hooks/usePrograms'
import useEvents from '../../hooks/useEvents'
import { useSingleThesis } from '../../hooks/useTheses'

import { BASE_PATH, THESIS_STATUSES } from '../../../config'
import EventsView from '../EventsView/EventsView'
import { useState } from 'react'
import { ExpandLess, ExpandMore } from '@mui/icons-material'
import { useChangeThesisStatusMutation } from '../../hooks/useThesesMutation'
import useLoggedInUser from '../../hooks/useLoggedInUser'
import { t } from 'i18next'
import { ProgressView } from './Progress/ProgressView'

const StatusRow = ({ thesis }: { thesis: Thesis }) => (
  <Box
    sx={{
      display: 'flex',
      flexDirection: 'row',
      justifyContent: 'space-between',
      px: 2,
      mt: 2,
      backgroundColor: '#E1E4E8',
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
      {t(StatusLocale[thesis.status])}
    </Typography>
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
  <List>
    {authors.map((author, index) => (
      <Typography
        key={author.id}
        component="p"
        variant="subtitle2"
        sx={{
          fontWeight: 700,
          textTransform: 'uppercase',
          color: '#586069',
        }}
      >
        {author.firstName} {author.lastName}
        {index < authors.length - 1 ? ' - ' : ''}
      </Typography>
    ))}
  </List>
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
        fontSize: '10pt',
        fontWeight: 600,
        textTransform: 'capitalize',
        gap: 1,
        mb: 2,
        color: 'primary.dark',
      }}
    >
      {program?.name[language as keyof TranslatedName]}
      {track && (
        <Typography
          component="span"
          sx={{
            display: 'flex',
            alignItems: 'center',
            fontSize: '10pt',
            fontWeight: 600,
            textTransform: 'capitalize',
            gap: 1,
          }}
        >
          <ArrowRightAltIcon fontSize="small" />
          {track.name[language as keyof TranslatedName]}
        </Typography>
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
    handleSubitToEthesis,
    isStudentView,
  } = props

  const thesisId = (rowSelectionModel.ids != undefined &&
  rowSelectionModel.ids.size > 0
    ? rowSelectionModel.ids.entries().next().value[0]
    : undefined) as unknown as string | undefined

  const { t } = useTranslation()
  const { user: currentUser } = useLoggedInUser()
  const [eventLogOpen, setEventLogOpen] = useState(false)
  const { thesis, isLoading: thesisLoading } = useSingleThesis(
    thesisId,
    isStudentView
  )
  const { events } = useEvents({ thesisId, enabled: !isStudentView })
  const { mutateAsync: changeThesisStatus } =
    useChangeThesisStatusMutation(isStudentView)

  const [pendingAction, setPendingAction] = useState<
    'approve' | 'sendDraft' | null
  >(null)

  const ethesisReady =
    currentUser &&
    thesis &&
    thesis.graders.length === 2 &&
    thesis.status === THESIS_STATUSES.IN_PROGRESS

  return (
    <>
      {thesis ? (
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
            <Typography
              component="h2"
              sx={{
                textTransform: 'uppercase',
                fontFamily: 'Roboto',
                mb: 2,
              }}
            >
              <Typography
                component="span"
                sx={{
                  fontSize: '12pt',
                  fontWeight: 600,
                  position: 'relative',
                  '&::after': {
                    content: '""',
                    position: 'absolute',
                    bottom: '4px',
                    left: 0,
                    zIndex: -1,
                    width: '100%',
                  },
                }}
              >
                {t('thesisPreview')}
              </Typography>
            </Typography>

            {thesis &&
              currentUser &&
              (isStudentView
                ? thesis.status === THESIS_STATUSES.DRAFT
                : true) && (
                <Box sx={{ display: 'flex', gap: 2 }}>
                  {Boolean(
                    !isStudentView &&
                    ((thesis.status === THESIS_STATUSES.PLANNING &&
                      thesis.approvers?.length &&
                      thesis.approvers[0].id === currentUser?.id) ||
                      (thesis.status === THESIS_STATUSES.SUGGESTED &&
                        thesis.supervisions?.some(
                          (s) => s.user.id === currentUser?.id
                        )))
                  ) && (
                    <Button
                      variant="outlined"
                      sx={{
                        color: '#000',
                        backgroundColor: '#fcd34d',
                        fontSize: '12px',
                        height: 24,
                        px: 2,
                        borderRadius: '1rem',
                        fontWeight: 600,
                      }}
                      onClick={() => setPendingAction('approve')}
                    >
                      {t('approveButton')}
                    </Button>
                  )}
                  {isStudentView && (
                    <Button
                      variant="outlined"
                      sx={{
                        borderColor: '#000',
                        fontSize: '12px',
                        color: '#000',
                        height: 24,
                        px: 2,
                        borderRadius: '1rem',
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
                </Box>
              )}
          </Stack>

          <Typography
            component="h3"
            sx={{
              fontSize: '1.5rem',
              fontWeight: 700,
              textTransform: 'uppercase',
            }}
          >
            {thesis.topic}
          </Typography>

          <Authors authors={thesis.authors} />

          <ProgressView
            thesis={thesis}
            isStudentView={isStudentView}
          ></ProgressView>

          <StatusRow thesis={thesis} />

          <Box sx={{ p: 2 }}>
            <ProgramTrack
              programId={thesis.programId}
              studyTrackId={thesis.studyTrackId!}
              isStudentView={isStudentView}
              thesisProgram={thesis.program}
            />

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
            {!thesis.program?.options?.hideSendToEthesis &&
              ethesisReady &&
              !isStudentView && (
                <Box
                  sx={{
                    marginTop: 5,
                    marginBottom: 5,

                    alignItems: 'center',
                    gap: 2,
                  }}
                >
                  <Typography style={{ marginBottom: 5 }}>
                    {t('thesisForm:submitEthesisLabel')}
                  </Typography>
                  <Button
                    variant="outlined"
                    onClick={() => handleSubitToEthesis(thesis)}
                    sx={{
                      color: '#fff',
                      backgroundColor: '#000',
                      borderColor: '#000',
                      fontSize: '12px',
                      height: 24,
                      px: 2,
                      borderRadius: '1rem',
                      fontWeight: 600,
                      '&:hover': {
                        backgroundColor: '#fff',
                        borderColor: '#000',
                        color: '#000',
                      },
                    }}
                  >
                    {t('thesisForm:submitEthesis')}
                  </Button>
                </Box>
              )}
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
              changeThesisStatus({
                theses: [thesis],
                status: THESIS_STATUSES.IN_PROGRESS,
              })
            } else if (pendingAction === 'sendDraft') {
              changeThesisStatus({
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
    </>
  )
}

export default ViewThesisFooter
