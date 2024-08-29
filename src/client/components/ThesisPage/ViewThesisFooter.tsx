/* eslint-disable react/require-default-props */
import dayjs from 'dayjs'
import { useTranslation } from 'react-i18next'
import { GridFooter, GridSlotProps } from '@mui/x-data-grid'
import {
  Box,
  Button,
  Grid,
  Link,
  List,
  ListItem,
  ListItemText,
  Skeleton,
  Stack,
  Typography,
} from '@mui/material'
import ArrowRightAltIcon from '@mui/icons-material/ArrowRightAlt'

import {
  FileData,
  GraderData,
  SupervisionData,
  ThesisData as Thesis,
  TranslatedName,
  User,
} from '@backend/types'

import { ThesisFooterProps } from '../../types'
import usePrograms from '../../hooks/usePrograms'
import { useSingleThesis } from '../../hooks/useTheses'

import { BASE_PATH } from '../../../config'

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
      {thesis.status}
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
}: {
  programId: string
  studyTrackId: string
}) => {
  const { i18n } = useTranslation()
  const { programs, isLoading: programsLoading } = usePrograms({
    includeNotManaged: true,
  })

  if (!programs || programsLoading) return null

  const { language } = i18n
  const program = programs.find((p) => p.id === programId)
  const track = program?.studyTracks.find((t) => t.id === studyTrackId)

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
    <Grid item>
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
  const { t } = useTranslation()

  return (
    <Grid item>
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
          const primaryText = `${grader.user?.firstName} ${grader.user?.lastName}`
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
        <Grid item>
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
        <Grid item>
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
        <Grid item>
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
  const { rowSelectionModel, handleEditThesis, handleDeleteThesis } = props

  const { t } = useTranslation()
  const { thesis, isLoading: thesisLoading } = useSingleThesis(
    rowSelectionModel[0]
  )

  return (
    <>
      <GridFooter />
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
                    height: '6px',
                    backgroundColor: '#fcd34d',
                    zIndex: -1,
                    width: '100%',
                  },
                }}
              >
                {t('thesisPreview')}
              </Typography>
            </Typography>

            {thesis && (
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button
                  variant="outlined"
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
                  onClick={handleEditThesis}
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
                    borderRadius: '1rem',
                    fontWeight: 600,
                  }}
                  onClick={handleDeleteThesis}
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

          <StatusRow thesis={thesis} />

          <Box sx={{ p: 2 }}>
            <ProgramTrack
              programId={thesis.programId}
              studyTrackId={thesis.studyTrackId}
            />

            <Grid
              container
              sx={{
                mt: 4,
                gap: 4,
              }}
            >
              <Supervisors supervisors={thesis.supervisions} />
              <Graders graders={thesis.graders} />
            </Grid>

            <Attachments
              researchPlan={thesis?.researchPlan}
              waysOfWorking={thesis?.waysOfWorking}
            />
          </Box>
        </Box>
      ) : (
        thesisLoading && <PreviewSkeleton />
      )}
    </>
  )
}

export default ViewThesisFooter
