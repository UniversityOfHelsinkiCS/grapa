import { MutableRefObject } from 'react'
import { User, ThesisData as Thesis } from '@backend/types'
import { GridRowSelectionModel } from '@mui/x-data-grid/models/gridRowSelectionModel'

export enum StatusLocale {
  PLANNING = 'thesisStages:planned',
  IN_PROGRESS = 'thesisStages:inProgress',
  COMPLETED = 'thesisStages:completed',
  CANCELLED = 'thesisStages:cancelled',
  ETHESIS = 'thesisStages:ethesis',
  ETHESIS_SENT = 'thesisStages:ethesisSent',
}

export interface SupervisorSelection {
  user: Partial<User> | null
  percentage: number
  isExternal: boolean
  isPrimarySupervisor: boolean
  creationTimeIdentifier?: string
}

export interface ThesisFooterProps {
  footerRef: MutableRefObject<HTMLDivElement>
  rowSelectionModel: GridRowSelectionModel[]
  handleEditThesis: (thesis: Thesis) => void
  handleDeleteThesis: (thesis: Thesis) => void
  handleSubitToEthesis: (thesis: Thesis) => void
}
