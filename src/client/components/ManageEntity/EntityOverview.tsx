import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import 'dayjs/locale/fi'
import {
  CircularProgress,
  Box,
  Tab,
  Tabs,
  Typography,
  Stack,
  Chip,
  Button,
} from '@mui/material'
import usePrograms from '../../hooks/usePrograms'
import { useTranslation } from 'react-i18next'
import {
  ProgramData,
  StudyTrackData,
} from '@backend/validators/programResponse'
import {
  TranslationLanguage,
  DepartmentData,
} from '@backend/validators/departmentResponse'
import ThesesPage from '../ThesisPage/ThesesPage'
import ManageEntityPermissions from './ManageEntityPermissions'
import useLoggedInUser from '../../hooks/useLoggedInUser'

import SingleProgramLogs from './SingleProgramLogs'
import ProgramConfigurations from './ProgramConfigurations'
import Statistics from './Statistics'
import Supervisions from './Supervisions'
import useDepartments from '../../hooks/useDepartments'
import ArrowOutwardIcon from '@mui/icons-material/ArrowOutward'

type EntityType = 'program' | 'studyTrack' | 'department'

const EntityOverview = ({ entityType }: { entityType: EntityType }) => {
  const { t, i18n } = useTranslation()
  const { language } = i18n as { language: TranslationLanguage }
  const { programId, studyTrackId, departmentId } = useParams()
  const [permissionsTab, setPermissionsTab] = useState<'main' | 'studyTracks'>(
    'main'
  )

  const { user } = useLoggedInUser()
  const { programs: allPrograms, isLoading: programsAreLoading } = usePrograms({
    includeNotManaged: true,
  })
  const { departments: managedDepartments, isLoading: departmentsAreLoading } =
    useDepartments({
      includeNotManaged: false,
    })

  const isLoading = programsAreLoading || departmentsAreLoading

  const programsUserManages: ProgramData[] =
    allPrograms?.filter((p) => user?.isAdmin || p.isManaged) || []
  const studyTracksUserManages: StudyTrackData[] =
    allPrograms
      ?.flatMap((p) => p.studyTracks || [])
      .filter((st) => st && (user?.isAdmin || st.isManaged)) || []
  const departmentsUserManages: DepartmentData[] = managedDepartments || []

  const entityConfig = {
    program: { entities: programsUserManages, id: programId },
    studyTrack: { entities: studyTracksUserManages, id: studyTrackId },
    department: { entities: departmentsUserManages, id: departmentId },
  }

  const { entities, id: currentId } = entityConfig[entityType]

  const matchingEntity = entities?.find((entity) => entity.id === currentId)
  const selectedEntity =
    matchingEntity || (entities?.length ? entities[0] : null)

  const [tab, setTab] = useState<
    | 'theses'
    | 'managePermissions'
    | 'configurations'
    | 'logs'
    | 'statistics'
    | 'supervisions'
  >('theses')

  useEffect(() => {
    setTab('theses')
  }, [selectedEntity?.id])

  if (isLoading || !selectedEntity) {
    return <CircularProgress />
  }

  return (
    <Box component="section" sx={{ px: '1rem', py: '2rem', width: '100%' }}>
      {Boolean(selectedEntity) && (
        <>
          <Stack sx={{ px: '1rem', py: '2rem' }} spacing={3}>
            <Stack direction="row" sx={{ gap: 2, alignItems: 'center' }}>
              {entityType == 'program' && selectedEntity?.id && (
                <Chip
                  label={selectedEntity?.id}
                  variant="outlined"
                  sx={{ fontFamily: 'monospace', fontWeight: 400 }}
                ></Chip>
              )}
              {entityType == 'studyTrack' &&
                //@ts-expect-error code and sisuId exist on it when type is studyTrack
                selectedEntity?.code && (
                  <Chip
                    //@ts-expect-error code and sisuId exist on it when type is studyTrack
                    label={selectedEntity?.code}
                    variant="outlined"
                    sx={{ fontFamily: 'monospace', fontWeight: 400 }}
                  ></Chip>
                )}
              <Typography component="h1" variant="h4">
                {selectedEntity.name[language]}
              </Typography>
            </Stack>

            {user?.isAdmin && entityType == 'studyTrack' && (
              <Link
                //@ts-expect-error code and sisuId exist on it when type is studyTrack
                to={`https://sisu.helsinki.fi/staff/studies/staff/hy-lv-77/studymodule/${selectedEntity.sisuId}/basicinfo`}
              >
                <Button variant="outlined" size="small">
                  <ArrowOutwardIcon></ArrowOutwardIcon>
                  Sisu
                </Button>
              </Link>
            )}

            {user?.isAdmin && entityType == 'program' && (
              <Link
                to={`https://oodikone.helsinki.fi/study-programme/${selectedEntity.id}?tab=1`}
              >
                <Button variant="outlined" size="small">
                  <ArrowOutwardIcon></ArrowOutwardIcon>
                  Oodikone
                </Button>
              </Link>
            )}
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Tabs
                value={tab}
                onChange={(
                  _,
                  nextTab:
                    | 'theses'
                    | 'managePermissions'
                    | 'configurations'
                    | 'logs'
                    | 'statistics'
                    | 'supervisions'
                ) => setTab(nextTab)}
                variant="scrollable"
                scrollButtons
                allowScrollButtonsMobile
              >
                <Tab
                  label={t('departmentOverviewPage:statisticsTab')}
                  value="statistics"
                />
                <Tab
                  label={t('departmentOverviewPage:supervisionsTab')}
                  value="supervisions"
                />
                <Tab label={t('theses')} value="theses" />
                <Tab
                  label={t('programOverviewPage:managePermissionsTab')}
                  value="managePermissions"
                />
                {entityType === 'program' && (
                  <Tab label={t('eventLog:title')} value="logs" />
                )}
                {entityType === 'program' && (
                  <Tab
                    label={t('programOverviewPage:configurationsTab')}
                    value="configurations"
                  />
                )}
              </Tabs>
            </Box>
            {tab === 'theses' && (
              <Box>
                <ThesesPage
                  filteringProgramId={
                    entityType === 'program' ? selectedEntity.id : undefined
                  }
                  filteringStudyTrackId={
                    entityType === 'studyTrack' ? selectedEntity.id : undefined
                  }
                  filteringDepartmentId={
                    entityType === 'department' ? selectedEntity.id : undefined
                  }
                  noOwnThesesSwitch
                  noAddThesisButton
                  showSupervisors
                  showMilestonePercentage
                />
              </Box>
            )}

            {tab === 'managePermissions' && (
              <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                {entityType === 'program' &&
                !(selectedEntity as ProgramData).options?.disableStudyTracks &&
                ((selectedEntity as ProgramData).studyTracks?.length ?? 0) >
                  0 ? (
                  <>
                    <Box
                      sx={{ borderBottom: 1, borderColor: 'divider', mb: 4 }}
                    >
                      <Tabs
                        value={permissionsTab}
                        onChange={(_e, newValue) => setPermissionsTab(newValue)}
                        sx={{
                          minHeight: 'auto',
                          '& .MuiTabs-indicator': {
                            height: 3,
                            borderTopLeftRadius: 3,
                            borderTopRightRadius: 3,
                          },
                        }}
                      >
                        <Tab
                          sx={{
                            textTransform: 'none',
                            minHeight: 'auto',
                            py: 1.5,
                            px: 3,
                            fontSize: '0.95rem',
                            fontWeight: permissionsTab === 'main' ? 700 : 500,
                          }}
                          label={t('manageEntityPermissions:programTitle')}
                          value="main"
                        />
                        <Tab
                          sx={{
                            textTransform: 'none',
                            minHeight: 'auto',
                            py: 1.5,
                            px: 3,
                            fontSize: '0.95rem',
                            fontWeight:
                              permissionsTab === 'studyTracks' ? 700 : 500,
                          }}
                          label={t('manageEntityPermissions:studyTrackTitle')}
                          value="studyTracks"
                        />
                      </Tabs>
                    </Box>
                    {permissionsTab === 'main' && (
                      <ManageEntityPermissions
                        filteringEntityId={selectedEntity.id}
                        hideTitle={true}
                        entityType={entityType}
                      />
                    )}
                    {permissionsTab === 'studyTracks' && (
                      <ManageEntityPermissions
                        filteringProgramId={selectedEntity.id}
                        hideTitle={true}
                        entityType="studyTrack"
                      />
                    )}
                  </>
                ) : (
                  <ManageEntityPermissions
                    filteringEntityId={selectedEntity.id}
                    hideTitle={true}
                    entityType={entityType}
                  />
                )}
              </Box>
            )}
            {tab === 'statistics' && (
              <Box>
                <Statistics
                  filteringDepartmentId={
                    entityType === 'department' ? selectedEntity.id : undefined
                  }
                  programId={
                    entityType === 'program' ? selectedEntity.id : undefined
                  }
                  studyTrackId={
                    entityType === 'studyTrack' ? selectedEntity.id : undefined
                  }
                  hideTitle
                />
              </Box>
            )}
            {tab === 'supervisions' && (
              <Box>
                <Supervisions
                  filteringDepartmentId={
                    entityType === 'department' ? selectedEntity.id : undefined
                  }
                  programId={
                    entityType === 'program' ? selectedEntity.id : undefined
                  }
                  studyTrackId={
                    entityType === 'studyTrack' ? selectedEntity.id : undefined
                  }
                />
              </Box>
            )}
            {tab === 'configurations' && entityType === 'program' && (
              <Box>
                <ProgramConfigurations
                  program={selectedEntity as ProgramData}
                />
              </Box>
            )}
            {tab === 'logs' && entityType === 'program' && (
              <Box>
                <SingleProgramLogs program={selectedEntity as ProgramData} />
              </Box>
            )}
          </Stack>
        </>
      )}
    </Box>
  )
}

export default EntityOverview
