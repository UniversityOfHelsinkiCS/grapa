import { Program } from '../db/models'
import { validateThesisData } from './thesis'

describe('validateThesisData', () => {
  let req
  let res
  let next

  const expectValidationError = async (message) => {
    await expect(validateThesisData(req, res, next)).rejects.toThrow(message)
    expect(next).toHaveBeenCalledTimes(0)
  }

  const expectNoValidationError = async () => {
    await expect(validateThesisData(req, res, next)).resolves.toBeUndefined()
    expect(next).toHaveBeenCalledTimes(1)
  }

  beforeEach(() => {
    jest.spyOn(Program, 'findByPk').mockResolvedValue({ options: {} })

    req = {
      body: {
        topic: 'Test thesis',
        programId: 'test-program',
        supervisions: [
          {
            user: {
              id: 'test-user',
              username: 'test-username',
              firstName: 'Test',
              lastName: 'User',
              email: 'test-email@test.fi',
            },
            percentage: 100,
            isPrimarySupervisor: true,
          },
        ],
        seminarSupervisions: [],
        authors: [
          {
            id: 'test-author',
            username: 'test-authorname',
            firstName: 'Test',
            lastName: 'Author',
            email: 'test-author@test.fi',
          },
        ],
        graders: [
          {
            user: {
              id: 'test-user',
              username: 'test-username',
              firstName: 'Test',
              lastName: 'User',
              email: 'test-email@test.fi',
            },
            isPrimaryGrader: true,
            isExternal: false,
          },
        ],
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

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('should call next if all required fields are present', async () => {
    await expectNoValidationError()
  })

  it('should return an error if topic is missing', async () => {
    req.body = {
      ...req.body,
      topic: undefined,
    }

    await expectValidationError('Thesis title is required')
  })

  it('should return an error if supervisions is missing', async () => {
    req.body = {
      ...req.body,
      supervisions: undefined,
    }

    await expectValidationError('At least one supervision is required')
  })

  it('should return an error if supervisions percentage sum is under 100', async () => {
    req.body = {
      ...req.body,
      supervisions: [
        {
          user: {
            id: 'test-user',
            username: 'test-username',
            firstName: 'Test',
            lastName: 'User',
            email: 'test-email@test.fi',
          },
          percentage: 90,
          isPrimarySupervisor: true,
        },
      ],
    }

    await expectValidationError('Supervision percentages must add up to 100')
  })

  it('should return an error if supervisions percentage sum is over 100', async () => {
    req.body = {
      ...req.body,
      supervisions: [
        {
          user: {
            id: 'test-user',
            username: 'test-username',
            firstName: 'Test',
            lastName: 'User',
            email: 'test-email@test.fi',
          },
          percentage: 110,
          isPrimarySupervisor: true,
        },
      ],
    }

    await expectValidationError('Supervision percentages must add up to 100')
  })

  it('should return an error if there are duplicate supervisors', async () => {
    req.body = {
      ...req.body,
      supervisions: [
        {
          user: {
            id: 'test-user',
            username: 'test-username',
            firstName: 'Test',
            lastName: 'User',
            email: 'test-email@test.fi',
          },
          percentage: 50,
          isPrimarySupervisor: true,
        },
        {
          user: {
            id: 'test-user-2',
            username: 'test-username-2',
            firstName: 'Test',
            lastName: 'User',
            email: 'test-email@test.fi',
          },
          percentage: 50,
          isPrimarySupervisor: false,
        },
      ],
    }

    await expectValidationError('Supervisors must be unique')
  })

  it('should return an error if primary supervisor is missing', async () => {
    req.body = {
      ...req.body,
      supervisions: [
        {
          user: {
            id: 'test-user',
            username: 'test-username',
            firstName: 'Test',
            lastName: 'User',
            email: 'test-email@test.fi',
          },
          percentage: 100,
        },
      ],
    }

    await expectValidationError('Primary supervisor is required')
  })

  it('should return an error if there are more than one primary supervisors', async () => {
    req.body = {
      ...req.body,
      supervisions: [
        {
          user: {
            id: 'test-user',
            username: 'test-username',
            firstName: 'Test',
            lastName: 'User',
            email: 'test-email@test.fi',
          },
          percentage: 50,
          isPrimarySupervisor: true,
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
          isPrimarySupervisor: true,
        },
      ],
    }

    await expectValidationError('Only one primary supervisor is allowed')
  })

  it('should return an error if authors is missing', async () => {
    req.body = {
      ...req.body,
      authors: undefined,
    }

    await expectValidationError('At least one author is required')
  })

  it('should return an error if graders is missing', async () => {
    req.body = {
      ...req.body,
      graders: undefined,
    }

    await expectValidationError('At least one grader is required')
  })

  it('should return an error if primary grader is missing', async () => {
    req.body = {
      ...req.body,
      graders: [
        {
          user: {
            id: 'test-user',
            username: 'test-username',
            firstName: 'Test',
            lastName: 'User',
            email: 'test-email@test.fi',
          },
        },
      ],
    }

    await expectValidationError('Primary grader must be set')
  })

  it('should return an error if there are duplicate graders', async () => {
    req.body = {
      ...req.body,
      graders: [
        {
          user: {
            id: 'test-user',
            username: 'test-username',
            firstName: 'Test',
            lastName: 'User',
            email: 'test-email@test.fi',
          },
        },
        {
          user: {
            id: 'test-user',
            username: 'test-username',
            firstName: 'Test',
            lastName: 'User',
            email: 'test-email@test.fi',
          },
        },
      ],
    }

    await expectValidationError('Graders must be unique')
  })

  it('should return an error if primary grader is external', async () => {
    req.body = {
      ...req.body,
      graders: [
        {
          user: {
            firstName: 'Test',
            lastName: 'User',
            email: 'test-user@test.fi',
            affiliation: 'Test affiliation',
          },
          isPrimaryGrader: true,
          isExternal: true,
        },
      ],
    }

    await expectValidationError('Primary grader cannot be an external user')
  })

  it('should return an error if there is two primary graders', async () => {
    req.body = {
      ...req.body,
      graders: [
        {
          user: {
            id: 'test-user',
            username: 'test-username',
            firstName: 'Test',
            lastName: 'User',
            email: 'test-email@test.fi',
          },
          isPrimaryGrader: true,
          isExternal: false,
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
          isExternal: false,
        },
      ],
    }

    await expectValidationError('Only one primary grader is allowed')
  })

  it('should return an error if the primary grader is external', async () => {
    req.body = {
      ...req.body,
      graders: [
        {
          user: {
            firstName: 'Test',
            lastName: 'User',
            email: 'test-affiliation@test.fi',
            affiliation: 'Test affiliation',
          },
          isPrimaryGrader: true,
          isExternal: true,
        },
      ],
    }

    await expectValidationError('Primary grader cannot be an external user')
  })

  it('should return an error if researchPlan is missing', async () => {
    req.body = {
      ...req.body,
      researchPlan: undefined,
    }
    req.files = {
      ...req.files,
      researchPlan: undefined,
    }

    await expectValidationError('Research plan is required')
  })

  it('should pass if researchPlan is missing from files but not from body', async () => {
    req.files = {
      ...req.files,
      researchPlan: undefined,
    }

    await expectNoValidationError()
  })

  it('should not return an error if waysOfWorking is missing', async () => {
    req.body = {
      ...req.body,
      waysOfWorking: undefined,
    }
    req.files = {
      ...req.files,
      waysOfWorking: undefined,
    }

    await expectNoValidationError()
  })

  it('should pass if waysOfWorking is missing from files but not from body', async () => {
    req.files = {
      ...req.files,
      waysOfWorking: undefined,
    }

    await expectNoValidationError()
  })

  it('should return an error if startDate is missing', async () => {
    req.body = {
      ...req.body,
      startDate: undefined,
    }

    await expectValidationError('Start date is required')
  })

  it('should return an error if targetDate is missing', async () => {
    req.body = {
      ...req.body,
      targetDate: undefined,
    }

    await expectValidationError('Target date is required')
  })

  it('should return an error if targetDate is before startDate', async () => {
    req.body = {
      ...req.body,
      startDate: '2021-12-31',
      targetDate: '2021-01-01',
    }

    await expectValidationError('Start date must be before target date')
  })

  it('should return an error if programId is missing', async () => {
    req.body = {
      ...req.body,
      programId: undefined,
    }

    await expectValidationError('Program is required')
  })

  it('should require seminar supervision when the program seminar setting is enabled', async () => {
    Program.findByPk.mockResolvedValue({ options: { seminar: true } })

    await expectValidationError('At least one seminar supervision is required')
  })

  it('should return an error if there are multiple seminar supervisors', async () => {
    req.body = {
      ...req.body,
      seminarSupervisions: [
        {
          user: {
            id: 'seminar-supervisor-1',
            username: 'seminar-supervisor-1',
            firstName: 'Seminar',
            lastName: 'Supervisor One',
            email: 'seminar@test.fi',
          },
          isExternal: false,
        },
        {
          user: {
            id: 'seminar-supervisor-2',
            username: 'seminar-supervisor-2',
            firstName: 'Seminar',
            lastName: 'Supervisor Two',
            email: 'seminar@test.fi',
          },
          isExternal: false,
        },
      ],
    }

    await expectValidationError('Exactly one seminar supervisor is allowed')
  })

  it('should return an error if seminar supervisor is external', async () => {
    req.body = {
      ...req.body,
      seminarSupervisions: [
        {
          user: {
            firstName: 'Seminar',
            lastName: 'Supervisor',
            email: 'seminar@test.fi',
            affiliation: 'Outside University',
          },
          isExternal: true,
        },
      ],
    }

    await expectValidationError('Seminar supervisor cannot be an external user')
  })

  it('should pass seminar supervision validation when one internal seminar supervision is present', async () => {
    Program.findByPk.mockResolvedValue({ options: { seminar: true } })
    req.body = {
      ...req.body,
      seminarSupervisions: [
        {
          user: {
            id: 'seminar-supervisor-1',
            username: 'seminar-supervisor-1',
            firstName: 'Seminar',
            lastName: 'Supervisor',
            email: 'seminar@test.fi',
          },
          isExternal: false,
        },
      ],
    }

    await expectNoValidationError()
  })
})
