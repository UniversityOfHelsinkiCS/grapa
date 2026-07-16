import dayjs from 'dayjs'
import { useTranslation, Trans } from 'react-i18next'
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
  ButtonBase,
} from '@mui/material'
import Popup from '../Common/Popup'
import {
  FileData,
  ThesisData as Thesis,
  TranslatedName,
  User,
  TranslationLanguage,
  ThesisStatus,
  ProgramData,
} from '@backend/types'

import { ThesisFooterProps } from '../../types'
import usePrograms from '../../hooks/usePrograms'
import useEvents from '../../hooks/useEvents'
import { useSingleThesis } from '../../hooks/useTheses'

import { BASE_PATH, THESIS_STATUSES } from '../../../config'
import EventsView from '../EventsView/EventsView'
import EditTopicModal from './EditTopicModal'
import { useState } from 'react'
import {
  Bedtime,
  Check,
  ChevronRight,
  DescriptionOutlined,
  ExpandLess,
  ExpandMore,
  PriorityHigh,
  Send,
} from '@mui/icons-material'
import {
  useChangeThesisStatusMutation,
  useEditThesisMutation,
} from '../../hooks/useThesesMutation'
import useLoggedInUser from '../../hooks/useLoggedInUser'
import { ProgressView } from './Progress/ProgressView'
import {
  canApprove,
  canSetEthesisMilestones,
  isProgramApprover,
  isStudentDraftActionRequired,
  isStudentEthesisActionRequired,
  isEthesisReady,
  isMissingGradersActionRequired,
  isStudyTrackManager,
  isEthesisAdmin,
  needsEthesisAdminAction,
} from '../../util/permissions'
import { NavLink } from 'react-router-dom'
import { PersonList } from './Person/PersonList'
import ThesisModal from '../Ethesis/Modal'

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
  currentUser,
  thesis,
}: {
  programId: string
  studyTrackId: string
  isStudentView?: boolean
  thesisProgram?: ProgramData
  currentUser?: User
  thesis?: Thesis
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
        gap: 0.5,
        mb: 2,
        color: 'black',
      }}
    >
      <Chip
        variant="outlined"
        sx={{ fontFamily: 'monospace' }}
        label={program?.id}
      />
      <ButtonBase
        component={NavLink}
        to={`/programs/${thesis ? thesis.programId : ''}`}
        disabled={
          !currentUser ||
          (currentUser &&
            thesis &&
            !currentUser.isAdmin &&
            !isProgramApprover(thesis, currentUser))
        }
        sx={{
          transition: '0.1s',
          borderRadius: '0.25rem',
          ':hover': {
            backgroundColor: '#00000023',
          },
        }}
      >
        <Typography
          sx={{
            fontSize: '11pt',
            fontWeight: 500,
            textTransform: 'capitalize',
            p: 1,
          }}
        >
          {program?.name[language as keyof TranslatedName]}
        </Typography>
      </ButtonBase>
      {track && (
        <>
          <ChevronRight fontSize="small" />
          <ButtonBase
            component={NavLink}
            to={`/study-tracks/${thesis ? thesis.studyTrackId : ''}`}
            disabled={
              !currentUser ||
              (currentUser &&
                thesis &&
                !currentUser.isAdmin &&
                !isProgramApprover(thesis, currentUser) &&
                !isStudyTrackManager(thesis, currentUser))
            }
            sx={{
              transition: '0.1s',
              borderRadius: '0.25rem',
              ':hover': {
                backgroundColor: '#00000023',
              },
            }}
          >
            <Typography
              component="span"
              sx={{
                fontSize: '11pt',
                fontWeight: 400,
                textTransform: 'capitalize',
                p: 1,
              }}
            >
              {track.name[language as keyof TranslatedName]}
            </Typography>
          </ButtonBase>
        </>
      )}
    </Typography>
  )
}

const Attachments = ({
  researchPlan = undefined,
  waysOfWorking = undefined,
  isStudentView,
}: {
  researchPlan?: FileData | File | undefined
  waysOfWorking?: FileData | File | undefined
  isStudentView?: boolean
}) => {
  const { t } = useTranslation()

  const files = [
    { file: researchPlan, translation: t('thesisForm:researchPlan') },
    { file: waysOfWorking, translation: t('thesisForm:waysOfWorking') },
  ].filter(
    (fileContainer) => fileContainer.file && 'filename' in fileContainer.file
  )

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
      <Stack sx={{ mt: 2, gap: 1 }} direction="row">
        {files.map((fileContainer) => (
          <Link
            href={`${BASE_PATH}/api/${isStudentView ? 'student/' : ''}attachments/${(fileContainer.file as FileData).filename}`}
            sx={{ textDecoration: 'none' }}
            key={fileContainer.translation}
          >
            <Paper variant="outlined" sx={{}}>
              <Stack
                direction="row"
                sx={{
                  py: 1,
                  px: 2,
                  minWidth: '10rem',
                  alignItems: 'center',
                  gap: 2,
                  ':hover': { backgroundColor: '#EEE' },
                }}
              >
                <DescriptionOutlined></DescriptionOutlined>
                <Stack>
                  <Typography sx={{ fontSize: '10pt', fontWeight: 600 }}>
                    {fileContainer.translation}
                  </Typography>
                  <Typography>{researchPlan.name}</Typography>
                </Stack>
              </Stack>
            </Paper>
          </Link>
        ))}
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
    onlySeminarSupervised,
    hideEdit,
    hideDelete,
  }: ThesisFooterProps = props

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
    isStudentView,
    onlySeminarSupervised
  )
  const showEventLogs = thesis?.program?.options?.showEventLogs === true

  const { events } = useEvents({
    thesisId,
    enabled: !isStudentView && eventLogOpen,
  })
  const { mutateAsync: changeThesisStatus } =
    useChangeThesisStatusMutation(isStudentView)
  const { mutateAsync: editThesis } = useEditThesisMutation(isStudentView)

  const [pendingAction, setPendingAction] = useState<
    'approve' | 'sendDraft' | 'wakeUp' | 'reject' | null
  >(null)

  const [editTopicModalOpen, setEditTopicModalOpen] = useState(false)
  const [ethesisDialogOpen, setEthesisDialogOpen] = useState(false)
  const [ethesisAdminModalOpen, setEthesisAdminModalOpen] = useState(false)
  const [ethesisTargetStatus, setEthesisTargetStatus] =
    useState<ThesisStatus | null>(null)

  const ethesisReady = thesis && currentUser && isEthesisReady(thesis)

  const difference =
    currentUser &&
    thesis?.targetDate &&
    dayjs(thesis.targetDate).isBefore(dayjs())
      ? dayjs(thesis.targetDate).diff(dayjs(), 'day') * -1
      : 0
  const isLate = difference && difference > 30

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
                    onClick={() => setPendingAction('wakeUp')}
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
                {canApprove(thesis, currentUser!) &&
                  thesis.program?.options?.allowStudentStartedProcess && (
                    <Button
                      variant="outlined"
                      sx={{
                        color: '#000',
                        backgroundColor: '#fc674d',
                        borderColor: '#000',
                        fontSize: '12px',
                        height: 24,
                        px: 2,
                        fontWeight: 600,
                      }}
                      onClick={() => setPendingAction('reject')}
                    >
                      {t('rejectButton')}
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
                    ? canSetEthesisMilestones(thesis, currentUser!)
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
                {isEthesisAdmin(currentUser!) &&
                  thesis.status === THESIS_STATUSES.ETHESIS_SENT && (
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
                      onClick={() => setEthesisAdminModalOpen(true)}
                    >
                      Save to Ethesis
                    </Button>
                  )}
                {(!isStudentView || thesis.status === THESIS_STATUSES.DRAFT) &&
                  !hideEdit && (
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

                {isStudentView &&
                  thesis.status === THESIS_STATUSES.IN_PROGRESS &&
                  !hideEdit && (
                    <Button
                      variant="outlined"
                      sx={{
                        fontSize: '12px',
                        height: 24,
                        px: 2,
                        fontWeight: 600,
                      }}
                      onClick={() => setEditTopicModalOpen(true)}
                    >
                      {t('thesisForm:editTopicTitle', 'Edit topic')}
                    </Button>
                  )}

                {(!isStudentView || thesis.status === THESIS_STATUSES.DRAFT) &&
                  !hideDelete && (
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
              currentUser={currentUser}
              thesis={thesis}
            />
            <StatusRow thesis={thesis} />
          </Stack>

          <Stack
            direction="row"
            sx={{ alignItems: 'center', gap: 1, flexWrap: 'wrap' }}
          >
            <Typography
              component="h3"
              sx={{
                fontSize: '1.5rem',
                fontWeight: 800,
              }}
            >
              {thesis.topic}
            </Typography>
            {thesis?.program?.options && (
              <Chip
                size="small"
                variant="outlined"
                label={
                  thesis?.program?.options?.isBachelorProgram
                    ? t('viewThesisFooter:bachelorsThesis')
                    : t('viewThesisFooter:mastersThesis')
                }
              ></Chip>
            )}
          </Stack>

          <Authors authors={thesis.authors} />

          {thesis.status == 'IN_PROGRESS' && isLate != false && (
            <Alert
              severity={difference > 180 ? 'error' : 'warning'}
              sx={{ my: 1.5 }}
            >
              {t('viewThesisFooter:thesisLate').replace(
                '{difference}',
                difference.toString()
              )}{' '}
              {dayjs(thesis.targetDate).format('YYYY-MM-DD')}
            </Alert>
          )}

          {thesis.status == 'COMPLETED' && (
            <Alert severity="info" sx={{ my: 1.5 }} icon={<Check />}>
              {t('viewThesisFooter:thesisComplete')}
            </Alert>
          )}

          {thesis.isIdle && (
            <Alert severity="info" sx={{ my: 1.5 }} icon={<Bedtime />}>
              {t('viewThesisFooter:thesisIdle')}
            </Alert>
          )}

          {thesis && currentUser && canApprove(thesis, currentUser) && (
            <Alert color="warning" icon={<PriorityHigh />} sx={{ my: 1.5 }}>
              {t('viewThesisFooter:requiresApproval')}
            </Alert>
          )}

          {thesis &&
            currentUser &&
            (isMissingGradersActionRequired(thesis, currentUser) ? (
              <Alert color="warning" icon={<PriorityHigh />} sx={{ my: 1.5 }}>
                {t('viewThesisFooter:missingGradersActionRequired')}
              </Alert>
            ) : canSetEthesisMilestones(thesis, currentUser) ? (
              <Alert color="warning" icon={<PriorityHigh />} sx={{ my: 1.5 }}>
                {t('viewThesisFooter:requiresEthesisPermission')}
              </Alert>
            ) : needsEthesisAdminAction(thesis, currentUser) ? (
              <Alert color="warning" icon={<PriorityHigh />} sx={{ my: 1.5 }}>
                {t('viewThesisFooter:requiresEthesisAdminAction')}
              </Alert>
            ) : null)}

          {thesis &&
            currentUser &&
            isStudentDraftActionRequired(thesis, isStudentView) && (
              <Alert color="info" icon={<Send />} sx={{ my: 1.5 }}>
                {t('viewThesisFooter:studentActionRequired')}
              </Alert>
            )}

          {thesis &&
            currentUser &&
            isStudentEthesisActionRequired(thesis, isStudentView) && (
              <Alert color="info" icon={<Send />} sx={{ my: 1.5 }}>
                <Trans
                  i18nKey="viewThesisFooter:studentEthesisActionRequired"
                  components={{
                    1: (
                      <Link
                        href={t('viewThesisFooter:ethesisInstructionsLink')}
                        target="_blank"
                        rel="noopener noreferrer"
                      />
                    ),
                  }}
                />
              </Alert>
            )}

          <ProgressView
            thesis={thesis}
            isStudentView={isStudentView}
          ></ProgressView>

          <Stack
            direction="row"
            sx={{
              mt: 4,
              gap: 4,
            }}
          >
            <PersonList
              title={t('thesisForm:supervisors')}
              users={thesis.supervisions}
            />
            <PersonList
              title={t('thesisForm:seminarSupervisorsLabel')}
              users={thesis.seminarSupervisions ?? []}
            />
            <PersonList
              title={t('thesisForm:graders')}
              users={thesis.graders ?? []}
              showTitle={true}
            />
            <PersonList
              title={t('common:author')}
              showStudentNumber={true}
              users={
                thesis.authors.map((author) => {
                  return { user: author }
                }) ?? []
              }
            />
          </Stack>

          <Attachments
            researchPlan={thesis?.researchPlan}
            waysOfWorking={thesis?.waysOfWorking}
            isStudentView={isStudentView}
          />

          {!isStudentView && (currentUser?.isAdmin || showEventLogs) && (
            <Paper
              elevation={0}
              sx={{
                p: 2,
                mb: 2,
                mt: 2,
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
              : pendingAction === 'wakeUp'
                ? t('wakeUpFromSleepButtonConfirmTitle', 'Confirm Wake Up')
                : pendingAction === 'sendDraft'
                  ? t('sendDraftButtonConfirmTitle', 'Confirm Send Draft')
                  : t(
                      'rejectButtonConfirmTitle',
                      'Confirm Rejection of Suggestion'
                    )
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
            } else if (pendingAction === 'wakeUp') {
              void editThesis({
                thesisId: thesis.id as string,
                data: { ...thesis, isIdle: false },
              })
            } else if (pendingAction === 'reject') {
              void changeThesisStatus({
                theses: [thesis],
                status: THESIS_STATUSES.DRAFT,
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
              : pendingAction === 'wakeUp'
                ? t('wakeUpFromSleepButtonConfirmContent')
                : pendingAction === 'sendDraft'
                  ? t('sendDraftButtonConfirmContent')
                  : t('rejectButtonConfirmContent')}
          </Typography>
        </Popup>
      )}

      {thesis && editTopicModalOpen && (
        <EditTopicModal
          open={editTopicModalOpen}
          initialTopic={thesis.topic}
          onClose={() => setEditTopicModalOpen(false)}
          onSubmit={async (newTopic) => {
            await editThesis({
              thesisId: thesis.id as string,
              data: {
                ...thesis,
                topic: newTopic,
              },
            })
          }}
        />
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
                  primary={
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {t('common:topicHeader')}
                    </Typography>
                  }
                  secondary={
                    <Typography variant="caption" color="text.secondary">
                      {thesis.topic}
                    </Typography>
                  }
                />
              </ListItem>

              <ListItem disableGutters sx={{ alignItems: 'flex-start' }}>
                <ListItemText
                  primary={
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {t('author')}
                    </Typography>
                  }
                  secondary={
                    <Typography variant="caption" color="text.secondary">
                      {thesis.authors
                        .toSorted((a, b) =>
                          a.lastName.localeCompare(b.lastName)
                        )
                        .map(
                          (author) =>
                            `${author.lastName} ${author.firstName} ${
                              author.studentNumber
                                ? `(${author.studentNumber})`
                                : ''
                            }`
                        )
                        .join(', ')}
                    </Typography>
                  }
                />
              </ListItem>

              {thesis.graders.length > 0 && (
                <ListItem disableGutters sx={{ alignItems: 'flex-start' }}>
                  <ListItemText
                    primary={
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {t('thesisForm:graders')}
                      </Typography>
                    }
                    secondary={
                      <Typography variant="caption" color="text.secondary">
                        {thesis.graders.map((grader) => (
                          <span
                            key={grader.user.id}
                            style={{ display: 'block' }}
                          >
                            {grader.user.lastName} {grader.user.firstName},{' '}
                            {grader.title[language]}
                          </span>
                        ))}
                      </Typography>
                    }
                  />
                </ListItem>
              )}
            </List>
          </Box>
        </Popup>
      )}

      {thesis && (
        <ThesisModal
          open={ethesisAdminModalOpen}
          onClose={() => setEthesisAdminModalOpen(false)}
          thesis={thesis}
        />
      )}
    </>
  )
}

export default ViewThesisFooter
