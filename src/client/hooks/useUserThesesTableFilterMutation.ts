import { useMutation } from '@tanstack/react-query'
import { GridFilterModel } from '@mui/x-data-grid'

import apiClient from '../util/apiClient'

import queryClient from '../util/queryClient'

const useUserThesesTableFilterMutation = () => {
  const mutationFn = async ({
    thesesTableFilters,
  }: {
    thesesTableFilters: GridFilterModel
  }) => {
    await apiClient.put(`/user/theses-table-filters`, { thesesTableFilters })
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

export default useUserThesesTableFilterMutation
