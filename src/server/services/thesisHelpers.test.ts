import { describe, it, expect, afterEach, vi } from 'vitest'
import {
  getEmployeeTitles,
  normalizeEmployeeTitlesPayload,
  thesesToCsv,
} from './thesisHelpers'
import type { ThesisData } from '../types'

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

describe('thesesToCsv', () => {
  it('includes seminar instructors in their own column', () => {
    const thesis = {
      programId: 'KH50_005',
      topic: 'Test thesis',
      status: 'IN_PROGRESS',
      startDate: '2026-01-01',
      authors: [],
      approvers: [],
      graders: [],
      supervisions: [
        {
          user: { firstName: 'Sanna', lastName: 'Supervisor' },
          percentage: 100,
          isExternal: false,
          isPrimarySupervisor: true,
        },
      ],
      seminarSupervisions: [
        { user: { firstName: 'Aino', lastName: 'Seminar' }, isExternal: false },
        { user: { firstName: 'Eero', lastName: 'Leader' }, isExternal: false },
      ],
    } as unknown as ThesisData

    const [headerLine, rowLine] = thesesToCsv([thesis])
      .replace('\uFEFF', '')
      .split('\n')
    const headers = headerLine.split(',')
    const seminarIndex = headers.indexOf('Seminar instructors')

    expect(seminarIndex).toBe(headers.indexOf('Supervisors') + 1)
    expect(rowLine).toContain('"Seminar Aino, Leader Eero"')
    expect(rowLine).toContain('Supervisor Sanna')
  })
})
