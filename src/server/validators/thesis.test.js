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
        supervisions: [{ 
          user: {
            id: 'test-user',
            username: 'test-username',
            firstName: 'Test',
            lastName: 'User',
            email: 'test-email@test.fi',
          }, 
          percentage: 100, 
          isPrimarySupervisor: true 
        }],
        authors: [{
            id: 'test-author',
            username: 'test-authorname',
            firstName: 'Test',
            lastName: 'Author',
            email: 'test-author@test.fi',
        }],
        graders: [{
          user: {
            id: 'test-user',
            username: 'test-username',
            firstName: 'Test',
            lastName: 'User',
            email: 'test-email@test.fi',
          }, 
          isPrimaryGrader: true, 
          isExternal: false
        }],
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
      supervisions: [{ 
        user: {
            id: 'test-user',
            username: 'test-username',
            firstName: 'Test',
            lastName: 'User',
            email: 'test-email@test.fi',
          }, 
        percentage: 90, 
        isPrimarySupervisor: true
      }],
    }

    expect(() => validateThesisData(req, res, next)).toThrow(
      'Supervision percentages must add up to 100'
    )
    expect(next).toHaveBeenCalledTimes(0)
  })

  it('should return an error if supervisions percentage sum is over 100', () => {
    req.body = {
      ...req.body,
      supervisions: [{
        user: {
          id: 'test-user',
          username: 'test-username',
          firstName: 'Test',
          lastName: 'User',
          email: 'test-email@test.fi',
        }, 
        percentage: 110, 
        isPrimarySupervisor: true
      }],
    }

    expect(() => validateThesisData(req, res, next)).toThrow(
      'Supervision percentages must add up to 100'
    )
    expect(next).toHaveBeenCalledTimes(0)
  })

  it('should return an error if primary supervisor is missing', () => {
    req.body = {
      ...req.body,
      supervisions: [{ 
        user: {
          id: 'test-user',
          username: 'test-username',
          firstName: 'Test',
          lastName: 'User',
          email: 'test-email@test.fi',
        }, 
        percentage: 100
      }],
    }

    expect(() => validateThesisData(req, res, next)).toThrow(
      'Primary supervisor is required'
    )
    expect(next).toHaveBeenCalledTimes(0)
  })

  it('should return an error if there are more than one primary supervisors', () => {
    req.body = {
      ...req.body,
      supervisions: [{
        user: {
          id: 'test-user',
          username: 'test-username',
          firstName: 'Test',
          lastName: 'User',
          email: 'test-email@test.fi',
        }, 
        percentage: 50, 
        isPrimarySupervisor: true
      }, 
      { 
        user: {
          id: 'test-user-2',
          username: 'test-username-2',
          firstName: 'Test',
          lastName: 'User',
          email: 'test-email-2@test.fi',
        }, 
        percentage: 50, 
        isPrimarySupervisor: true
      }],
    }

    expect(() => validateThesisData(req, res, next)).toThrow(
      'Only one primary supervisor is allowed'
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

  it('should return an error if graders is missing', () => {
    req.body = {
      ...req.body,
      graders: undefined
    }

    expect(() => validateThesisData(req, res, next)).toThrow(
      'At least one grader is required'
    )
    expect(next).toHaveBeenCalledTimes(0)
  })

  it('should return an error if primary grader is missing', () => {
    req.body = {
      ...req.body,
      graders: [{
        user: {
          id: 'test-user',
          username: 'test-username',
          firstName: 'Test',
          lastName: 'User',
          email: 'test-email@test.fi',
        }, 
      }]
    }

    expect(() => validateThesisData(req, res, next)).toThrow(
      'Primary grader must be set'
    )
    expect(next).toHaveBeenCalledTimes(0)
  })

  it('should return an error if primary grader is external', () => {
    req.body = {
      ...req.body,
      graders: [{user: {
        firstName: 'Test',
        lastName: 'User',
        email: 'test-user@test.fi',
        affiliation: 'Test affiliation',
      }, isPrimaryGrader: true, isExternal: true}]
    }

    expect(() => validateThesisData(req, res, next)).toThrow(
      'Primary grader cannot be an external user'
    )
    expect(next).toHaveBeenCalledTimes(0)
  })

  it('should return an error if there is two primary graders', () => { 
    req.body = {
      ...req.body,
      graders: [{
        user: {
          id: 'test-user',
          username: 'test-username',
          firstName: 'Test',
          lastName: 'User',
          email: 'test-email@test.fi',
        }, 
        isPrimaryGrader: true, 
        isExternal: false
      },
      {
        user: {
          id: 'test-user-2',
          username: 'test-username-2',
          firstName: 'Test-2',
          lastName: 'User-2',
          email: 'test-email-2@test.fi',
        },        
        isPrimaryGrader: true,
        isExternal: false
      }]
    }

    expect(() => validateThesisData(req, res, next)).toThrow(
      'Only one primary grader is allowed'
    )
    expect(next).toHaveBeenCalledTimes(0)
  })

  it('should return an error if the primary grader is external', () => {
    req.body = {
      ...req.body,
      graders: [{
        user: {
          firstName: 'Test',
          lastName: 'User',
          email: 'test-affiliation@test.fi',
          affiliation: 'Test affiliation'
        }, 
        isPrimaryGrader: true, 
        isExternal: true
      }]
    }

    expect(() => validateThesisData(req, res, next)).toThrow(
      'Primary grader cannot be an external user'
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
