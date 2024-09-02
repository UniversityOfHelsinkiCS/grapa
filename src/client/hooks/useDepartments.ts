import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'

import { getSortedPrograms } from '../components/ThesisPage/util'

import apiClient from '../util/apiClient'

import { DepartmentData as Department } from '../../server/types'

const useDepartments = () => {
  const { i18n } = useTranslation()
  const { language } = i18n

  const queryKey = ['departments']

  const queryFn = async (): Promise<Department[]> => {
    const { data } = await apiClient.get(`/departments`)

    return data
  }

  const { data: departments, ...rest } = useQuery({ queryKey, queryFn })

  return { departments: getSortedPrograms(departments, language), ...rest }
}

export default useDepartments
