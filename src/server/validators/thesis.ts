import { NextFunction } from 'express'
import { ServerPostRequest, ServerPutRequest } from '@backend/types'
import CustomValidationError from '../errors/ValidationError'
import { getTotalPercentage } from '../util/helpers'

const validateUser = (user: any) => {
  if (!user) {
    throw new CustomValidationError('User is required', {
      user,
    })
  }
  if (!user.id) {
    throw new CustomValidationError('User id is required', {
      id: ['User id is required'],
    })
  }
  if (!user.firstName) {
    throw new CustomValidationError('First name is required', {
      firstName: ['First name is required'],
    })
  }
  if (!user.lastName) {
    throw new CustomValidationError('Last name is required', {
      lastName: ['Last name is required'],
    })
  }
  if (!user.username) {
    throw new CustomValidationError('Username is required', {
      username: ['Username is required'],
    })
  }
}

const validateExtUser = (user: any) => {
  if (!user.firstName) {
    throw new CustomValidationError('First name is required', {
      firstName: ['First name is required'],
    })
  }
  if (!user.lastName) {
    throw new CustomValidationError('Last name is required', {
      lastName: ['Last name is required'],
    })
  }
  if (!user.email) {
    throw new CustomValidationError('Email is required', {
      email: ['Email is required'],
    })
  }
  if (!user.affiliation) {
    throw new CustomValidationError('Affiliation is required', {
      affiliation: ['Affiliation is required'],
    })
  }
}

export const validateThesisData = (
  req: ServerPostRequest | ServerPutRequest,
  _: Express.Response,
  next: NextFunction
) => {
  const thesisData = req.body

  if (!thesisData.topic) {
    throw new CustomValidationError('Thesis title is required', {
      topic: ['Thesis topic is required'],
    })
  }

  if (!thesisData.supervisions || thesisData.supervisions.length === 0) {
    throw new CustomValidationError('At least one supervision is required', {
      supervisions: ['At least one supervision is required'],
    })
  }

  thesisData.supervisions.forEach(({ user, isExternal }) => {
    if (isExternal) {
      validateExtUser(user)
    } else {
      validateUser(user)
    }
  })

  const thesisPrimarySupervisors = thesisData.supervisions.filter(
    (supervision) => supervision.isPrimarySupervisor
  )
  if (thesisPrimarySupervisors.length === 0) {
    throw new CustomValidationError('Primary supervisor is required', {
      supervisions: ['Primary supervisor is required'],
    })
  }

  if (thesisPrimarySupervisors.length > 1) {
    throw new CustomValidationError('Only one primary supervisor is allowed', {
      supervisions: ['Only one primary supervisor is allowed'],
    })
  }

  if (!thesisData.authors || thesisData.authors.length === 0) {
    throw new CustomValidationError('At least one author is required', {
      authors: ['At least one author is required'],
    })
  }

  thesisData.authors.forEach((author) => {
    validateUser(author)
  })

  if (!thesisData.graders || thesisData.graders.length === 0) {
    throw new CustomValidationError('At least one grader is required', {
      graders: ['At least one grader is required'],
    })
  }

  thesisData.graders.forEach(({ user, isExternal }) => {
    if (isExternal) {
      validateExtUser(user)
    } else {
      validateUser(user)
    }
  })

  // primary grader must be set
  if (!thesisData.graders.some((grader) => grader.isPrimaryGrader)) {
    throw new CustomValidationError('Primary grader must be set', {
      graders: ['Primary grader must be set'],
    })
  }

  if (
    thesisData.graders.length > 1 &&
    thesisData.graders.every((grader) => grader.isPrimaryGrader)
  ) {
    throw new CustomValidationError('Only one primary grader is allowed', {
      graders: ['Only one primary grader is allowed'],
    })
  }

  const primaryGrader = thesisData.graders.find(
    (grader) => grader.isPrimaryGrader
  )
  if (primaryGrader.isExternal) {
    throw new CustomValidationError(
      'Primary grader cannot be an external user',
      {
        graders: ['Primary grader cannot be an external user'],
      }
    )
  }

  // sum of supervision percentages must add up to 100
  const totalPercentage = getTotalPercentage(thesisData.supervisions)
  if (totalPercentage !== 100) {
    throw new CustomValidationError(
      'Supervision percentages must add up to 100',
      { supervisions: ['Supervision percentages must add up to 100'] }
    )
  }

  const researchPlanFile = req.files.researchPlan
    ? req.files.researchPlan[0]
    : thesisData.researchPlan
  if (!researchPlanFile) {
    throw new CustomValidationError('Research plan is required', {
      researchPlan: ['Research plan is required'],
    })
  }

  const waysOfWorkingFile = req.files.waysOfWorking
    ? req.files.waysOfWorking[0]
    : thesisData.waysOfWorking
  if (!waysOfWorkingFile) {
    throw new CustomValidationError('Ways of working is required', {
      waysOfWorking: ['Ways of working is required'],
    })
  }

  if (!thesisData.startDate) {
    throw new CustomValidationError('Start date is required', {
      startDate: ['Start date is required'],
    })
  }

  if (!thesisData.targetDate) {
    throw new CustomValidationError('Target date is required', {
      targetDate: ['Target date is required'],
    })
  }

  if (thesisData.startDate > thesisData.targetDate) {
    throw new CustomValidationError('Start date must be before target date', {
      startDate: ['Start date must be before target date'],
      targetDate: ['Start date must be before target date'],
    })
  }

  if (!thesisData.programId) {
    throw new CustomValidationError('Program is required', {
      programId: ['Program is required'],
    })
  }

  next()
}
