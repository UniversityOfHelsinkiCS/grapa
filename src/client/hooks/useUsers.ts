import { useQuery } from '@tanstack/react-query'
import { User } from '@backend/types'
import apiClient from '../util/apiClient'

const useUsers = () => {
  const queryKey = ['users']

  const queryFn = async (): Promise<User[]> => {
    const { data } = await apiClient.get(`/users`)

    return data
  }

  const { data: users, ...rest } = useQuery({ queryKey, queryFn })

  return { users, ...rest }
}

export default useUsers
