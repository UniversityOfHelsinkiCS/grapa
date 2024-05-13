import { ServerPostRequest, ServerPutRequest } from '@backend/types'
import { NextFunction } from 'express'

// eslint-disable-next-line import/prefer-default-export
export const validateThesisData = (
  req: ServerPostRequest | ServerPutRequest,
  _: Express.Response,
  next: NextFunction
) => {
  const thesisData = req.body

  if (!thesisData.topic) {
    throw new Error('Thesis title is required')
  }

  if (!thesisData.supervisions || thesisData.supervisions.length === 0) {
    throw new Error('At least one supervision is required')
  }

  if (!thesisData.authors || thesisData.authors.length === 0) {
    throw new Error('At least one author is required')
  }

  // sum of supervision percentages must add up to 100
  const totalPercentage = thesisData.supervisions.reduce(
    (total, supervision) => total + supervision.percentage,
    0
  )
  if (totalPercentage !== 100) {
    throw new Error('Supervision percentages must add up to 100')
  }

  const researchPlanFile = req.files.researchPlan
    ? req.files.researchPlan[0]
    : thesisData.researchPlan
  if (!researchPlanFile) {
    throw new Error('Research plan is required')
  }

  const waysOfWorkingFile = req.files.waysOfWorking
    ? req.files.waysOfWorking[0]
    : thesisData.waysOfWorking
  if (!waysOfWorkingFile) {
    throw new Error('Ways of working is required')
  }

  next()
}
