import { useQuery } from 'react-query'

import { User } from '@backend/types'

import apiClient from '../util/apiClient'

const useLoggedInUser = () => {
  const queryKey = 'user'

  const query = async (): Promise<User> => {
    const { data } = await apiClient.get('/users/')

    return data
  }

  const { data: user, ...rest } = useQuery(queryKey, query)

  return { user, ...rest }
}

export default useLoggedInUser
