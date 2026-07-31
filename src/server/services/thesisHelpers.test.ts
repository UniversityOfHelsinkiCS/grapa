import { describe, it, expect, afterEach, vi } from 'vitest'
import {
  getEmployeeTitles,
  normalizeEmployeeTitlesPayload,
} from './thesisHelpers'

describe('getEmployeeTitles', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('returns empty titles when the employee gateway returns a non-array object', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ message: 'unexpected payload' }),
    } as unknown as Response)

    const result: any = await getEmployeeTitles('test-user')

    expect(result).toEqual({ username: 'test-user', titles: [] })
  })

  it('maps a wrapped data array returned by the employee gateway payload', () => {
    const result: any = normalizeEmployeeTitlesPayload(
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
