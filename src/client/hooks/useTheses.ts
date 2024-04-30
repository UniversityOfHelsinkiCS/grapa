import { useQuery } from '@tanstack/react-query'
import { ThesisData } from '@backend/types'
import apiClient from '../util/apiClient'

const useTheses = () => {
  const queryKey = ['theses']

  const queryFn = async (): Promise<ThesisData[]> => {
    const { data } = await apiClient.get(`/theses`)

    return data
  }

  const { data: theses, ...rest } = useQuery({ queryKey, queryFn })

  return { theses, ...rest }
}

export default useTheses
