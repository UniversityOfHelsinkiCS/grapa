import { AuthorData } from '@backend/types'

export interface SupervisorSelection {
  user: AuthorData | null
  percentage: number
}
