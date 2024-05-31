import { useQuery } from '@tanstack/react-query'
import { User } from '@backend/types'
import apiClient from '../util/apiClient'

const useUsers = (search: string) => {
  const queryKey = ['users', search]

  const queryFn = async (): Promise<User[]> => {
    if (!search || search.length < 5) {
      return []
    }

    const { data } = await apiClient.get(`/users?search=${search}`)

    return data
  }

  const { data: users, ...rest } = useQuery({
    queryKey,
    queryFn,
  })

  return { users, ...rest }
}

export default useUsers
