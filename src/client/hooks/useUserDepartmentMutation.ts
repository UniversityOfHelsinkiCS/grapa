import { useMutation } from '@tanstack/react-query'
import apiClient from '../util/apiClient'
import queryClient from '../util/queryClient'

export const useUserDepartmentMutation = () => {
  const mutationFn = async ({ departmentId }: { departmentId: string }) => {
    await apiClient.put(`/user`, { departmentId })
  }

  const mutation = useMutation({
    mutationFn,
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: ['user'],
      }),
  })

  return mutation
}

export default useUserDepartmentMutation
