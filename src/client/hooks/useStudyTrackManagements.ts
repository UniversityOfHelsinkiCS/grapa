import { useQuery } from '@tanstack/react-query'
import { StudyTrackManagementData } from '@backend/validators/managementResponse'
import apiClient from '../util/apiClient'

type UseStudyTrackManagementsOptions =
  | {
      studyTrackId?: string
    }
  | undefined

const useStudyTrackManagements = (
  { studyTrackId }: UseStudyTrackManagementsOptions = {
    studyTrackId: undefined,
  }
) => {
  const queryKey = ['study-track-managements', studyTrackId]

  const queryFn = async (): Promise<StudyTrackManagementData[]> => {
    const { data } = await apiClient.get(`/study-track-managements`, {
      params: {
        studyTrackId,
      },
    })

    return data
  }

  const { data: studyTrackManagements, ...rest } = useQuery({
    queryKey,
    queryFn,
  })

  return { studyTrackManagements, ...rest }
}

export default useStudyTrackManagements
