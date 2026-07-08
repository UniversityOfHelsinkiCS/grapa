import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import 'dayjs/locale/fi'
import {
  CircularProgress,
  Box,
  Tab,
  Tabs,
  Typography,
  Stack,
} from '@mui/material'
import usePrograms from '../../hooks/usePrograms'
import { useTranslation } from 'react-i18next'
import {
  ProgramData,
  TranslationLanguage,
  StudyTrackData,
  DepartmentData,
} from '@backend/types'
import ThesesPage from '../ThesisPage/ThesesPage'
import EntityManagement from './EntityManagement'
import useLoggedInUser from '../../hooks/useLoggedInUser'

import SingleProgramLogs from './SingleProgramLogs'
import ProgramConfigurations from './ProgramConfigurations'
import DepartmentStatistics from './DepartmentStatistics'
import useDepartments from '../../hooks/useDepartments'

type EntityType = 'program' | 'studyTrack' | 'department'

const EntityOverview = ({ entityType }: { entityType: EntityType }) => {
  const { t, i18n } = useTranslation()
  const { language } = i18n as { language: TranslationLanguage }
  const { programId, studyTrackId, departmentId } = useParams()

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

  const entities = (
    entityType === 'department'
      ? departmentsUserManages
      : entityType === 'studyTrack'
        ? studyTracksUserManages
        : programsUserManages
  ) as Array<ProgramData | StudyTrackData | DepartmentData>

  const currentId =
    entityType === 'department'
      ? departmentId
      : entityType === 'studyTrack'
        ? studyTrackId
        : programId

  const matchingEntity = entities?.find((entity) => entity.id === currentId)
  const selectedEntity =
    matchingEntity || (entities?.length ? entities[0] : null)

  const [tab, setTab] = useState<
    'theses' | 'managePermissions' | 'configurations' | 'logs' | 'statistics'
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
            <Typography component="h1" variant="h4">
              {selectedEntity.name[language]}
            </Typography>

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
                ) => setTab(nextTab)}
                variant="scrollable"
                scrollButtons
                allowScrollButtonsMobile
              >
                {entityType === 'department' && (
                  <Tab
                    label={t('departmentOverviewPage:supervisionStatisticsTab')}
                    value="statistics"
                  />
                )}
                <Tab
                  label={t(
                    entityType === 'department'
                      ? 'departmentOverviewPage:supervisionsTab'
                      : 'theses'
                  )}
                  value="theses"
                />
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
                  showSupervisors={entityType === 'department'}
                />
              </Box>
            )}

            {tab === 'managePermissions' && (
              <Box>
                <EntityManagement
                  filteringEntityId={selectedEntity.id}
                  hideTitle
                  entityType={entityType}
                />
              </Box>
            )}

            {tab === 'statistics' && entityType === 'department' && (
              <Box>
                <DepartmentStatistics
                  filteringDepartmentId={selectedEntity.id}
                  hideTitle
                />
              </Box>
            )}

            {tab === 'configurations' && entityType === 'program' && (
              <Box>
                <ProgramConfigurations program={selectedEntity} />
              </Box>
            )}

            {tab === 'logs' && entityType === 'program' && (
              <Box>
                <SingleProgramLogs program={selectedEntity} />
              </Box>
            )}
          </Stack>
        </>
      )}
    </Box>
  )
}

export default EntityOverview
