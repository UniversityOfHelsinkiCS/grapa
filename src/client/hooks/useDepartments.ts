import { useQuery } from '@tanstack/react-query'
import apiClient from '../util/apiClient'
import { ProgramData as Program } from '../../server/types'

const useDepartments = () => {
  const queryKey = ['departments']

  const queryFn = async (): Promise<Program[]> => {
    const { data } = await apiClient.get(`/departments`)

    return data
  }

  const { data: departments, ...rest } = useQuery({ queryKey, queryFn })

  return { departments, ...rest }
}

export default useDepartments
