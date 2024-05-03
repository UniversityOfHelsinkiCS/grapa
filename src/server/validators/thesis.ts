import { ThesisData } from '@backend/types'

// eslint-disable-next-line import/prefer-default-export
export const validateThesisData = (thesisData: ThesisData) => {
  if (!thesisData.topic) {
    throw new Error('Thesis title is required')
  }

  if (!thesisData.supervisions || thesisData.supervisions.length === 0) {
    throw new Error('At least one supervision is required')
  }

  if (!thesisData.supervisions || thesisData.supervisions.length === 0) {
    throw new Error('At least one supervision is required')
  }

  // sum of supervision percentages must add up to 100
  const totalPercentage = thesisData.supervisions.reduce(
    (total, supervision) => total + supervision.percentage,
    0
  )
  if (totalPercentage !== 100) {
    throw new Error('Supervision percentages must add up to 100')
  }
}
