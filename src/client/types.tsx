import { MutableRefObject } from 'react'
import { ThesisData as Thesis } from '@backend/validators/thesisResponse'
import { GridRowSelectionModel } from '@mui/x-data-grid'

export enum StatusLocale {
  DRAFT = 'thesisStages:draft',
  SUGGESTED = 'thesisStages:suggested',
  PLANNING = 'thesisStages:planned',
  IN_PROGRESS = 'thesisStages:inProgress',
  COMPLETED = 'thesisStages:completed',
  CANCELLED = 'thesisStages:cancelled',
  ETHESIS = 'thesisStages:ethesis',
  ETHESIS_SENT = 'thesisStages:ethesisSent',
}

export interface ThesisFooterProps {
  footerRef: MutableRefObject<HTMLDivElement>
  rowSelectionModel: GridRowSelectionModel
  handleEditThesis: (thesis: Thesis) => void
  handleDeleteThesis: (thesis: Thesis) => void
  isStudentView?: boolean
  onlySeminarSupervised?: boolean
  hideEdit?: boolean
  hideDelete?: boolean
}
