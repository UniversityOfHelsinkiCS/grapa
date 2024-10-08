import { useQuery } from '@tanstack/react-query'
import { EventLog } from '@backend/db/models'

import apiClient from '../util/apiClient'

interface UseEventsParams {
  thesisId: string
}

const useEvents = (params: UseEventsParams) => {
  const queryKey = ['event-log', params.thesisId]

  const queryFn = async (): Promise<EventLog> => {
    const { data } = await apiClient.get(`/event-log/${params.thesisId}`)

    return data
  }

  const { data: events, ...rest } = useQuery({ queryKey, queryFn })

  return { events, ...rest }
}

export default useEvents
