import { useMutation } from '@tanstack/react-query'
import { DepartmentAdminData } from '@backend/types'
import apiClient from '../util/apiClient'
import queryClient from '../util/queryClient'

export const useCreateDepartmentAdminMutation = () => {
  const mutationFn = async (data: DepartmentAdminData) => {
    await apiClient.post(`/department-admins`, data)
  }

  const mutation = useMutation({
    mutationFn,
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: ['department-admins'],
      }),
  })

  return mutation
}

export const useDeleteDepartmentAdminMutation = () => {
  const mutationFn = async (departmentAdminId: string) => {
    await apiClient.delete(`/department-admins/${departmentAdminId}`)
  }

  const mutation = useMutation({
    mutationFn,
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: ['department-admins'],
      }),
  })

  return mutation
}
