import { validateThesisData } from './thesis'

describe('validateThesisData', () => {
  let req
  let res
  let next

  beforeEach(() => {
    req = {
      body: {
        topic: 'Test thesis',
        programId: 'test-program',
        supervisions: [{ percentage: 100 }],
        authors: [{}],
        researchPlan: {},
        waysOfWorking: {},
        startDate: '2021-01-01',
        targetDate: '2021-12-31',
      },
      files: {
        researchPlan: [{}],
        waysOfWorking: [{}],
      },
    }
    res = {}
    next = jest.fn()
  })

  it('should call next if all required fields are present', () => {
    expect(validateThesisData(req, res, next)).toBeUndefined()
    expect(next).toHaveBeenCalledTimes(1)
  })

  it('should return an error if topic is missing', () => {
    req.body = {
      ...req.body,
      topic: undefined
    }

    expect(() => validateThesisData(req, res, next)).toThrow(
      'Thesis title is required'
    )
    expect(next).toHaveBeenCalledTimes(0)
  })

  it('should return an error if supervisions is missing', () => {
    req.body = {
      ...req.body,
      supervisions: undefined
    }

    expect(() => validateThesisData(req, res, next)).toThrow(
      'At least one supervision is required'
    )
    expect(next).toHaveBeenCalledTimes(0)
  })

  it('should return an error if supervisions percentage sum is under 100', () => {
    req.body = {
      ...req.body,
      supervisions: [{ percentage: 90 }],
    }

    expect(() => validateThesisData(req, res, next)).toThrow(
      'Supervision percentages must add up to 100'
    )
    expect(next).toHaveBeenCalledTimes(0)
  })

  it('should return an error if supervisions percentage sum is over 100', () => {
    req.body = {
      ...req.body,
      supervisions: [{ percentage: 110 }],
    }

    expect(() => validateThesisData(req, res, next)).toThrow(
      'Supervision percentages must add up to 100'
    )
    expect(next).toHaveBeenCalledTimes(0)
  })

  it('should return an error if authors is missing', () => {
    req.body = {
      ...req.body,
      authors: undefined
    }

    expect(() => validateThesisData(req, res, next)).toThrow(
      'At least one author is required'
    )
    expect(next).toHaveBeenCalledTimes(0)
  })

  it('should return an error if researchPlan is missing', () => {
    req.body = {
      ...req.body,
      researchPlan: undefined
    }
    req.files = {
      ...req.files,
      researchPlan: undefined
    }

    expect(() => validateThesisData(req, res, next)).toThrow(
      'Research plan is required'
    )
    expect(next).toHaveBeenCalledTimes(0)
  })

  it('should pass if researchPlan is missing from files but not from body', () => {
    req.files = {
      ...req.files,
      researchPlan: undefined
    }

    expect(() => validateThesisData(req, res, next)).not.toThrow()
    expect(next).toHaveBeenCalledTimes(1)
  })

  it('should return an error if waysOfWorking is missing', () => {
    req.body = {
      ...req.body,
      waysOfWorking: undefined
    }
    req.files = {
      ...req.files,
      waysOfWorking: undefined
    }

    expect(() => validateThesisData(req, res, next)).toThrow(
      'Ways of working is required'
    )
    expect(next).toHaveBeenCalledTimes(0)
  })

  it('should pass if waysOfWorking is missing from files but not from body', () => {
    req.files = {
      ...req.files,
      waysOfWorking: undefined
    }

    expect(() => validateThesisData(req, res, next)).not.toThrow()
    expect(next).toHaveBeenCalledTimes(1)
  })

  it('should return an error if startDate is missing', () => {
    req.body = {
      ...req.body,
      startDate: undefined
    }

    expect(() => validateThesisData(req, res, next)).toThrow(
      'Start date is required'
    )
    expect(next).toHaveBeenCalledTimes(0)
  })

  it('should return an error if targetDate is missing', () => {
    req.body = {
      ...req.body,
      targetDate: undefined
    }

    expect(() => validateThesisData(req, res, next)).toThrow(
      'Target date is required'
    )
    expect(next).toHaveBeenCalledTimes(0)
  })

  it('should return an error if targetDate is before startDate', () => {
    req.body = {
      ...req.body,
      startDate: '2021-12-31',
      targetDate: '2021-01-01',
    }

    expect(() => validateThesisData(req, res, next)).toThrow(
      'Start date must be before target date'
    )
    expect(next).toHaveBeenCalledTimes(0)
  })

  it('should return an error if programId is missing', () => {
    req.body = {
      ...req.body,
      programId: undefined
    }

    expect(() => validateThesisData(req, res, next)).toThrow(
      'Program is required'
    )
    expect(next).toHaveBeenCalledTimes(0)
  })
})
