import { User } from '@backend/types'

export interface SupervisorSelection {
  user: User | null
  percentage: number
  isExternal: boolean
}
