import { validateThesisData } from './thesis'

describe('validateThesisData', () => {
  let req
  let res
  let next

  beforeEach(() => {
    req = {
      body: {},
    }
    res = {}
    next = jest.fn()
  })

  it('should call next if all required fields are present', () => {
    req.body = {
      topic: 'Test thesis',
      supervisions: [{ percentage: 100 }],
      authors: [{}],
      researchPlan: {},
      waysOfWorking: {},
      startDate: '2021-01-01',
      endDate: '2021-12-31',
    } 
    req.files = {
      researchPlan: [{}],
      waysOfWorking: [{}],
    }

    expect(validateThesisData(req, res, next)).toBeUndefined();
    expect(next).toHaveBeenCalledTimes(1)
  })
})
