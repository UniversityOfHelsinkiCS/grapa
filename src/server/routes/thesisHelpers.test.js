import {
  getEmployeeTitles,
  normalizeEmployeeTitlesPayload,
} from './thesisHelpers'

describe('getEmployeeTitles', () => {
  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('returns empty titles when the employee gateway returns a non-array object', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({ message: 'unexpected payload' }),
    })

    const result = await getEmployeeTitles('test-user')

    expect(result).toEqual({ username: 'test-user', titles: [] })
  })

  it('maps a wrapped data array returned by the employee gateway payload', () => {
    const result = normalizeEmployeeTitlesPayload(
      {
        data: [
          {
            username: 'test-user',
            titles: [{ fi: 'professori', en: 'Professor', sv: 'professor' }],
          },
        ],
      },
      'test-user'
    )

    expect(result).toEqual({
      username: 'test-user',
      titles: [{ fi: 'professori', en: 'Professor', sv: 'professor' }],
    })
  })
})
