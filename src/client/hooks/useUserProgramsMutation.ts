import { useMutation } from '@tanstack/react-query'
import apiClient from '../util/apiClient'
import queryClient from '../util/queryClient'

const useUserProgramsMutation = () => {
  const mutationFn = async ({
    favoriteProgramIds,
  }: {
    favoriteProgramIds: string[]
  }) => {
    await apiClient.put(`/user/favoritePrograms`, { favoriteProgramIds })
  }

  const mutation = useMutation({
    mutationFn,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['user'],
      })

      queryClient.invalidateQueries({
        queryKey: ['programs'],
      })
    },
  })

  return mutation
}

export default useUserProgramsMutation
