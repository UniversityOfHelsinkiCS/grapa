import { useQuery } from '@tanstack/react-query'
import apiClient from '../util/apiClient'
import { ProgramData as Program } from '../../server/types'

const usePrograms = () => {
  const queryKey = ['programs']

  const queryFn = async (): Promise<Program[]> => {
    const { data } = await apiClient.get(`/programs`)

    return data
  }

  const { data: programs, ...rest } = useQuery({ queryKey, queryFn })

  return { programs, ...rest }
}

export default usePrograms
