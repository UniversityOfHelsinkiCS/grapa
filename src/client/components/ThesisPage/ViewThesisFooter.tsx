import dayjs from 'dayjs'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  GridEventListener,
  GridFooter,
  useGridApiEventHandler,
  useGridApiContext,
} from '@mui/x-data-grid'
import {
  Box,
  Grid,
  List,
  ListItem,
  ListItemText,
  Typography,
} from '@mui/material'
import ArrowRightAltIcon from '@mui/icons-material/ArrowRightAlt'

import {
  GraderData,
  SupervisionData,
  ThesisData as Thesis,
  TranslatedName,
  User,
} from '@backend/types'
import usePrograms from '../../hooks/usePrograms'

const HeaderRow = ({ thesis }: { thesis: Thesis }) => (
  <Box
    sx={{
      display: 'flex',
      flexDirection: 'row',
      justifyContent: 'space-between',
      px: 2,
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

const Supervisors = ({ supervisors }: { supervisors: SupervisionData[] }) => (
  <Grid item>
    <Typography
      component="h4"
      sx={{
        fontSize: '1rem',
        fontWeight: 700,
        textTransform: 'uppercase',
      }}
    >
      Supervisors
    </Typography>
    <List dense>
      {supervisors.map((supervisor) => (
        <ListItem key={supervisor.user.id}>
          <ListItemText
            primary={`${supervisor.user.firstName} ${supervisor.user.lastName} (${supervisor.percentage}%)`}
            secondary={supervisor.user.email}
          />
        </ListItem>
      ))}
    </List>
  </Grid>
)

const Graders = ({ graders }: { graders: GraderData[] }) => (
  <Grid item>
    <Typography
      component="h4"
      sx={{
        fontSize: '1rem',
        fontWeight: 700,
        textTransform: 'uppercase',
      }}
    >
      Graders
    </Typography>
    <List dense>
      {graders.map((grader) => (
        <ListItem key={grader.user.id}>
          <ListItemText
            primary={`${grader.user.firstName} ${grader.user.lastName}`}
            secondary={grader.user.email}
          />
        </ListItem>
      ))}
    </List>
  </Grid>
)

const ViewThesisFooter = () => {
  const apiRef = useGridApiContext()
  const [thesis, setThesis] = useState<Thesis | null>(null)

  const handleRowClick: GridEventListener<'rowClick'> = (params) => {
    setThesis(params.row as Thesis)
  }

  useGridApiEventHandler(apiRef, 'rowClick', handleRowClick)

  return (
    <>
      <GridFooter />
      {thesis && (
        <Box sx={{ m: 2 }}>
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
              Thesis Preview
            </Typography>
          </Typography>

          <HeaderRow thesis={thesis} />

          <Box sx={{ px: 2, py: 2 }}>
            <ProgramTrack
              programId={thesis.programId}
              studyTrackId={thesis.studyTrackId}
            />

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
          </Box>
        </Box>
      )}
    </>
  )
}

export default ViewThesisFooter
