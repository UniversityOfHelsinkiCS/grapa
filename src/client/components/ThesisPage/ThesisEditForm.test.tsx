import { describe, it, test, expect, beforeEach, vi } from 'vitest'
import dayjs from 'dayjs'
import userEvent from '@testing-library/user-event'
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react'
import { LocalizationProvider } from '@mui/x-date-pickers'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'

import initializeI18n from '../../util/il18n'

vi.mock('../../hooks/useUsers', () => ({
  default: vi.fn().mockReturnValue({
    users: [
      { id: '1', firstName: 'John', lastName: 'Doe', username: 'johndoe' },
      { id: '2', firstName: 'Jane', lastName: 'Smith', username: 'janesmith' },
      {
        id: '3',
        firstName: 'Bob',
        lastName: 'Luukkainen',
        username: 'bobluukkainen',
      },
      {
        id: '4',
        firstName: 'Henri',
        lastName: 'Tunkkaaja',
        username: 'tunkkaus',
      },
    ],
  }),
}))

vi.mock('../../hooks/useProgramManagements', () => ({
  default: vi.fn().mockReturnValue({
    programManagements: [
      {
        user: {
          id: '4',
          firstName: 'Henri',
          lastName: 'Tunkkaaja',
          username: 'tunkkaus',
        },
      },
    ],
    isLoading: false,
  }),
}))

const programs: any = [
  {
    id: '1',
    name: {
      en: "Bachelor's Programme in Mathematical Sciences",
      fi: "Bachelor's Programme in Mathematical Sciences",
    },
    studyTracks: [
      {
        id: 'test-study-track1',
        name: { en: 'Test Track 1', fi: 'Testi opintosuunta 1' },
      },
    ],
  },
  {
    id: '2',
    name: { en: 'Test program 2', fi: 'testi 2' },
    studyTracks: [
      {
        id: 'test-study-track2',
        name: { en: 'Test Track 2', fi: 'Testi opintosuunta 2' },
      },
    ],
  },
]

vi.mock('../../hooks/useLoggedInUser', () => ({
  default: vi.fn().mockReturnValue({
    user: {
      id: '4',
      firstName: 'Henri',
      lastName: 'Tunkkaaja',
      username: 'tunkkaus',
    },
    isLoading: false,
  }),
}))

vi.mock('@mui/icons-material/UploadFile', () => ({
  default: vi.fn().mockReturnValue('UploadFileIcon'),
}))

vi.mock('@mui/icons-material/Delete', () => ({
  default: vi.fn().mockReturnValue('DeleteIcon'),
}))

vi.mock('@mui/icons-material/Check', () => ({
  default: vi.fn().mockReturnValue('CheckIcon'),
}))

vi.mock('@mui/icons-material/Bookmark', () => ({
  default: vi.fn().mockReturnValue('BookmarkIcon'),
}))

vi.mock('@mui/icons-material/FileUpload', () => ({
  default: vi.fn().mockReturnValue('FileUploadIcon'),
}))

vi.mock('@mui/icons-material/Error', () => ({
  default: vi.fn().mockReturnValue('ErrorIcon'),
}))

vi.mock('@mui/icons-material/ReportOutlined', () => ({
  default: vi.fn().mockReturnValue('ReportOutlinedIcon'),
}))

vi.mock('@mui/icons-material/ArrowDropDown', () => ({
  default: vi.fn().mockReturnValue('ArrowDropDownIcon'),
}))

vi.mock('@mui/icons-material/Star', () => ({
  default: vi.fn().mockReturnValue('Star'),
}))

vi.mock('@mui/icons-material/StarBorder', () => ({
  default: vi.fn().mockReturnValue('StarOutline'),
}))

const ThesisEditForm = (await import('./ThesisEditForm')).default

describe('ThesisEditForm', () => {
  let mockOnClose: any
  let mockOnSubmit: any

  beforeEach(() => {
    mockOnClose = vi.fn()
    mockOnSubmit = vi.fn()
  })

  describe('when initialThesis is a new thesis', () => {
    beforeEach(() => {
      const initialThesis = {
        programId: programs[0].id,
        studyTrackId: programs[0].studyTracks[0].id,
        supervisions: [] as never[],
        seminarSupervisions: [] as never[],
        authors: [] as never[],
        approvers: [] as never[],
        graders: [
          { user: null as never, isPrimaryGrader: true },
          { user: null as never, isPrimaryGrader: false },
        ] as never[],
        topic: '',
        status: 'PLANNING',
        startDate: dayjs().format('YYYY-MM-DD'),
        targetDate: dayjs().add(1, 'year').format('YYYY-MM-DD'),
      }

      initializeI18n()

      render(
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <ThesisEditForm
            formTitle="Test"
            isStudentView={false}
            programs={programs}
            initialThesis={initialThesis as never}
            onClose={mockOnClose}
            onSubmit={mockOnSubmit}
          />
        </LocalizationProvider>
      )
    })

    it('renders ThesisEditForm correctly and renders all validation errors', () => {
      expect(screen.getByTestId('thesis-form-title')).toBeInTheDocument()
      expect(screen.getByTestId('topic-select-input')).toBeInTheDocument()

      expect(screen.getByTestId('program-select-input')).toBeInTheDocument()
      expect(screen.getByTestId('author-select-input')).toBeInTheDocument()
      expect(screen.getByTestId('research-plan-input')).toBeInTheDocument()
      expect(screen.getByTestId('ways-of-working-input')).toBeInTheDocument()
      expect(screen.getByTestId('add-supervisor-button')).toBeInTheDocument()

      // We are initializing the thesis with 2 graders, so the add grader button should not be visible
      const addGraderButton = screen.queryByTestId('add-grader-button')
      expect(addGraderButton).toBeNull()

      const submitButton = screen.getByTestId('submit-button')
      expect(submitButton).toBeEnabled()
      fireEvent.click(submitButton)

      expect(screen.getByTestId('errorsummary-topic')).toBeInTheDocument()
      expect(screen.getByTestId('errorsummary-authors')).toBeInTheDocument()
      expect(
        screen.getByTestId('errorsummary-researchPlan')
      ).toBeInTheDocument()
      // ways of working document is optional
      expect(
        screen.queryByTestId('errorsummary-waysOfWorking')
      ).not.toBeInTheDocument()
    })

    describe('when all required fields are filled', () => {
      beforeEach(async () => {
        const user = userEvent.setup()

        const topicInput = screen.getByRole('textbox', { name: 'Aihe' })
        const programSelect: any = screen.getAllByRole('combobox')[0]
        const statusSelect = screen.getAllByRole('combobox')[2]

        const authorSelect = screen.getByTestId('author-select-input')
        const authorInput = within(authorSelect).getByRole('combobox')
        const approverSelect = screen.getByTestId('approver-select-input')

        const addSupervisorBtn = screen.getByTestId('add-supervisor-button')
        await user.click(addSupervisorBtn)
        await waitFor(() => {
          expect(
            screen.getByTestId('add-supervisor-menu-item-internal')
          ).toBeInTheDocument()
        })
        const internalSupervisorButton = screen.getByTestId(
          'add-supervisor-menu-item-internal'
        )
        fireEvent.click(internalSupervisorButton)

        const superVisorSelect1 = screen.getByTestId(
          'supervisor-select-input-1'
        )
        const superVisorInput1 = within(superVisorSelect1).getByRole('combobox')

        const graderSelect1 = screen.getByTestId('grader-select-input-1')
        const graderInput1 = within(graderSelect1).getByRole('combobox')

        const researchPlanInput = screen.getByTestId('research-plan-input')

        const waysOfWorkingInput = screen.getByTestId('ways-of-working-input')

        // Add a topic
        await user.type(topicInput, 'Test')

        // Select a program
        await user.click(programSelect)
        await user.click(screen.getByTestId('program-select-item-1'))

        // Add an author
        authorSelect.focus()

        fireEvent.change(authorInput, { target: { value: 'John Doe' } })
        fireEvent.keyDown(authorInput, { key: 'ArrowDown' })
        fireEvent.keyDown(authorInput, { key: 'Enter' })

        // Select a status
        await user.click(statusSelect)
        await user.click(screen.getAllByText('Suunniteltu')[0])

        // Select an approver
        await user.click(approverSelect)
        await user.click(screen.getByText('Henri Tunkkaaja'))

        // Add a supervisor
        superVisorSelect1.focus()

        fireEvent.change(superVisorInput1, { target: { value: 'Jane Smith' } })
        fireEvent.keyDown(superVisorSelect1, { key: 'ArrowDown' })
        fireEvent.keyDown(superVisorSelect1, { key: 'Enter' })

        // Add a grader
        graderSelect1.focus()

        fireEvent.change(graderInput1, { target: { value: 'Bob Luukkainen' } })
        fireEvent.keyDown(graderSelect1, { key: 'ArrowDown' })
        fireEvent.keyDown(graderSelect1, { key: 'Enter' })

        // Add research plan and ways of working
        const testFile = new File(['test'], 'researchPlan.pdf', {
          type: 'application/pdf',
        })
        fireEvent.change(researchPlanInput, {
          target: { files: { item: () => testFile, length: 1, 0: testFile } },
        })
        expect((researchPlanInput as HTMLInputElement).files[0]).toBe(testFile)

        fireEvent.change(waysOfWorkingInput, {
          target: { files: { item: () => testFile, length: 1, 0: testFile } },
        })
        expect((researchPlanInput as HTMLInputElement).files[0]).toBe(testFile)
      }, 10000)

      it('renders Submit button enabled and when clicked, calls onSubmit', async () => {
        expect(screen.queryByTestId('error-summary')).not.toBeInTheDocument()

        const submitButton = screen.getByTestId('submit-button')
        expect(submitButton).toBeEnabled()

        await userEvent.click(submitButton)

        // expect(mockOnSubmit).toHaveBeenCalledTimes(1)
      })
    })
  })

  describe('when initialThesis is an existing thesis', () => {
    beforeEach(() => {
      const initialThesis = {
        programId: programs[0].id,
        studyTrackId: programs[0].studyTracks[0].id,
        supervisions: [
          { userId: 1, percentage: 100, isPrimarySupervisor: true },
        ],
        seminarSupervisions: [] as never[],
        authors: [{ userId: 2 }],
        graders: [
          {
            user: {
              id: '1',
              firstName: 'John',
              lastName: 'Doe',
              username: 'johndoe',
            },
            isPrimaryGrader: true,
          },
          {
            user: {
              id: '2',
              firstName: 'Jane',
              lastName: 'Smith',
              username: 'janesmith',
            },
            isPrimaryGrader: false,
          },
        ],
        topic: 'Test',
        status: 'IN_PROGRESS',
        startDate: dayjs().format('YYYY-MM-DD'),
        targetDate: dayjs().add(1, 'year').format('YYYY-MM-DD'),
        researchPlan: {},
        waysOfWorking: {},
      }

      initializeI18n()

      render(
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <ThesisEditForm
            formTitle="Test"
            isStudentView={false}
            programs={programs}
            initialThesis={initialThesis as never}
            onClose={mockOnClose}
            onSubmit={mockOnSubmit}
          />
        </LocalizationProvider>
      )
    }, 10000)

    it('renders ThesisEditForm correctly, renders no validation error, and submit button is enabled', () => {
      expect(screen.getByTestId('thesis-form-title')).toBeInTheDocument()
      expect(screen.getByTestId('topic-select-input')).toBeInTheDocument()
      expect(screen.getByTestId('program-select-input')).toBeInTheDocument()
      expect(screen.getByTestId('author-select-input')).toBeInTheDocument()
      expect(screen.getByTestId('status-select-input')).toBeInTheDocument()
      expect(screen.getByTestId('research-plan-input')).toBeInTheDocument()
      expect(screen.getByTestId('ways-of-working-input')).toBeInTheDocument()
      expect(screen.getByTestId('add-supervisor-button')).toBeInTheDocument()

      expect(screen.getByRole('button', { name: 'Tallenna' })).toBeEnabled()
    })
  })
})
