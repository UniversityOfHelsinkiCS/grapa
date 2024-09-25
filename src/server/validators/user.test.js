import { validateUserThesesTableFiltersData } from './user'

describe('validateUserThesesTableFiltersData', () => {
  let req
  let res
  let next

  beforeEach(() => {
    req = {
      body: {
        thesesTableFilters: [
          {
              "field": "status",
              "operator": "contains",
              "id": 32027,
              "value": [
                "Suunniteltu",
                "Käynnissä"
              ]
          }
        ]
      },
    }
    res = {}
    next = jest.fn()
  })

  it('should call next if all required fields are present', () => {
    expect(validateUserThesesTableFiltersData(req, res, next)).toBeUndefined()
    expect(next).toHaveBeenCalledTimes(1)
  })

  it('should return an error if id is missing', () => {
    req.body.thesesTableFilters[0].id = undefined

    expect(() => validateUserThesesTableFiltersData(req, res, next)).toThrow(
      'Invalid theses table filters'
    )
    expect(next).toHaveBeenCalledTimes(0)
  })

  it('should return an error if id is not a number', () => {
    req.body.thesesTableFilters[0].id = '32027'

    expect(() => validateUserThesesTableFiltersData(req, res, next)).toThrow(
      'Invalid theses table filters'
    )
    expect(next).toHaveBeenCalledTimes(0)
  })

  it('should return an error if field is missing', () => {
    req.body.thesesTableFilters[0].field = undefined

    expect(() => validateUserThesesTableFiltersData(req, res, next)).toThrow(
      'Invalid theses table filters'
    )
    expect(next).toHaveBeenCalledTimes(0)
  })

  it('should return an error if field is not a string', () => {
    req.body.thesesTableFilters[0].field = 32027

    expect(() => validateUserThesesTableFiltersData(req, res, next)).toThrow(
      'Invalid theses table filters'
    )
    expect(next).toHaveBeenCalledTimes(0)
  })

  it('should return an error if operator is missing', () => {
    req.body.thesesTableFilters[0].operator = undefined

    expect(() => validateUserThesesTableFiltersData(req, res, next)).toThrow(
      'Invalid theses table filters'
    )
    expect(next).toHaveBeenCalledTimes(0)
  })

  it('should return an error if operator is not a string', () => {
    req.body.thesesTableFilters[0].operator = 32027

    expect(() => validateUserThesesTableFiltersData(req, res, next)).toThrow(
      'Invalid theses table filters'
    )
    expect(next).toHaveBeenCalledTimes(0)
  })
})
