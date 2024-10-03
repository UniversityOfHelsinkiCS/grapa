import { useQuery } from '@tanstack/react-query'
import { EventLog } from '@backend/db/models'

import apiClient from '../util/apiClient'

interface UseEventsParams {
  thesisId: string
}

const useEvents = ({ thesisId }: UseEventsParams) => {
  const queryKey = ['event-log', thesisId]

  const queryFn = async (): Promise<EventLog> => {
    const { data } = await apiClient.get(`/event-log/${thesisId}`)

    return data
  }

  const { data: events, ...rest } = useQuery({
    queryKey,
    queryFn,
    enabled: !!thesisId,
  })

  return { events, ...rest }
}

export default useEvents
