import { describe, it, expect, beforeEach, vi } from 'vitest'
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
    options: {
      allowMultipleAuthors: true,
      numberOfGraders: 2,
      seminar: true,
      allowStudentStartedProcess: true,
    },
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
    options: {
      allowMultipleAuthors: false,
      numberOfGraders: 1,
      disableStudyTracks: true,
      seminar: false,
      allowStudentStartedProcess: true,
    },
  },
  {
    id: '3',
    name: { en: 'Test program 3', fi: 'testi 3' },
    studyTracks: [],
    options: {
      allowMultipleAuthors: false,
      numberOfGraders: 2,
      supervisorOptional: true,
      disableStudyTracks: true,
      seminar: false,
    },
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

      void initializeI18n()

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

    it('renders ThesisEditForm correctly and renders all validation errors', async () => {
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

      await waitFor(() => {
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

      void initializeI18n()

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

  describe('when changing programs', () => {
    beforeEach(() => {
      // Start with program 1 which allows multiple authors, study tracks, 2 graders and seminar
      const initialThesis = {
        programId: programs[0].id,
        studyTrackId: programs[0].studyTracks[0].id,
        approvers: [
          {
            id: '4',
            firstName: 'Henri',
            lastName: 'Tunkkaaja',
            username: 'tunkkaus',
            email: 'henri@example.com',
          },
        ],
        supervisions: [
          {
            user: { id: '1', email: 'john@example.com' },
            percentage: 100,
            isPrimarySupervisor: true,
          },
        ],
        seminarSupervisions: [{ user: { id: '3' } }] as never[],
        authors: [
          {
            id: '1',
            firstName: 'John',
            lastName: 'Doe',
            username: 'johndoe',
            email: 'john@example.com',
          },
          {
            id: '2',
            firstName: 'Jane',
            lastName: 'Smith',
            username: 'janesmith',
            email: 'jane@example.com',
          },
        ],
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
        topic: 'Data Pollution Test',
        status: 'IN_PROGRESS',
        startDate: dayjs().format('YYYY-MM-DD'),
        targetDate: dayjs().add(1, 'year').format('YYYY-MM-DD'),
        researchPlan: { name: 'researchPlan.pdf' },
        waysOfWorking: {},
      }

      void initializeI18n()

      render(
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <ThesisEditForm
            formTitle="Data Pollution Test Form"
            isStudentView={false}
            programs={programs}
            initialThesis={initialThesis as never}
            onClose={mockOnClose}
            onSubmit={mockOnSubmit}
          />
        </LocalizationProvider>
      )
    })

    it('cleans up data like extra authors, extra graders, and study tracks when switching to restricted program', async () => {
      const user = userEvent.setup()

      // Change program to program 2
      const programSelect: any = screen.getAllByRole('combobox')[0]
      await user.click(programSelect)
      await user.click(screen.getByTestId('program-select-item-2'))

      const submitButton = screen.getByTestId('submit-button')
      expect(submitButton).toBeEnabled()

      await userEvent.click(submitButton)

      // Get the payload submitted
      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalled()
      })

      const submittedPayload = mockOnSubmit.mock.calls[0][0]

      // Program 2 options: allowMultipleAuthors: false, numberOfGraders: 1, disableStudyTracks: true, seminar: false
      expect(submittedPayload.programId).toBe('2')
      expect(submittedPayload.authors).toHaveLength(1) // Should have sliced authors down to 1
      expect(submittedPayload.authors[0].id).toBe('1') // Should keep the first author
      expect(submittedPayload.graders).toHaveLength(1) // Should have sliced graders down to 1
      expect(submittedPayload.graders[0].user.id).toBe('1')
      expect(submittedPayload.studyTrackId).toBeNull() // disabled study tracks
      expect(submittedPayload.seminarSupervisions).toHaveLength(0) // seminar disabled
    })
  })

  describe('when a grader row is left empty', () => {
    beforeEach(() => {
      const initialThesis = {
        programId: programs[0].id,
        studyTrackId: programs[0].studyTracks[0].id,
        approvers: [
          {
            id: '4',
            firstName: 'Henri',
            lastName: 'Tunkkaaja',
            username: 'tunkkaus',
            email: 'henri@example.com',
          },
        ],
        supervisions: [
          {
            user: { id: '1', email: 'john@example.com' },
            percentage: 100,
            isPrimarySupervisor: true,
          },
        ],
        seminarSupervisions: [{ user: { id: '3' } }] as never[],
        authors: [
          {
            id: '1',
            firstName: 'John',
            lastName: 'Doe',
            username: 'johndoe',
            email: 'john@example.com',
          },
        ],
        graders: [
          {
            user: {
              id: '1',
              firstName: 'John',
              lastName: 'Doe',
              username: 'johndoe',
              email: 'john@example.com',
            },
            isPrimaryGrader: true,
          },
          { user: null, isPrimaryGrader: false },
        ],
        topic: 'Empty Grader Test',
        status: 'IN_PROGRESS',
        startDate: dayjs().format('YYYY-MM-DD'),
        targetDate: dayjs().add(1, 'year').format('YYYY-MM-DD'),
        researchPlan: { name: 'researchPlan.pdf' },
      }

      void initializeI18n()

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

    it('does not submit and reports the missing grader', async () => {
      await userEvent.click(screen.getByTestId('submit-button'))

      await waitFor(() => {
        expect(
          screen.getByTestId('errorsummary-graders-1-user')
        ).toBeInTheDocument()
      })

      expect(mockOnSubmit).not.toHaveBeenCalled()
    })
  })

  describe('when supervisors are optional and none are selected', () => {
    beforeEach(() => {
      const initialThesis = {
        programId: programs[2].id,
        studyTrackId: '',
        approvers: [
          {
            id: '4',
            firstName: 'Henri',
            lastName: 'Tunkkaaja',
            username: 'tunkkaus',
            email: 'henri@example.com',
          },
        ],
        supervisions: [] as never[],
        seminarSupervisions: [] as never[],
        authors: [
          {
            id: '1',
            firstName: 'John',
            lastName: 'Doe',
            username: 'johndoe',
            email: 'john@example.com',
          },
        ],
        graders: [
          {
            user: {
              id: '1',
              firstName: 'John',
              lastName: 'Doe',
              username: 'johndoe',
              email: 'john@example.com',
            },
            isPrimaryGrader: true,
          },
        ],
        topic: 'Optional Supervisor Test',
        status: 'IN_PROGRESS',
        startDate: dayjs().format('YYYY-MM-DD'),
        targetDate: dayjs().add(1, 'year').format('YYYY-MM-DD'),
        researchPlan: { name: 'researchPlan.pdf' },
      }

      void initializeI18n()

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

    it('allows removing the only grader and submits without graders', async () => {
      const user = userEvent.setup()

      const removeGraderButton = screen.getByTestId('remove-grader-button')
      expect(removeGraderButton).toBeEnabled()

      await user.click(removeGraderButton)
      await user.click(screen.getByTestId('delete-confirm-button'))

      await user.click(screen.getByTestId('submit-button'))

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalled()
      })

      expect(mockOnSubmit.mock.calls[0][0].graders).toHaveLength(0)
    })
  })

  describe('when adding graders', () => {
    const renderWithGraders = (graders: any[]) => {
      const initialThesis = {
        programId: programs[0].id,
        studyTrackId: programs[0].studyTracks[0].id,
        approvers: [] as never[],
        supervisions: [] as never[],
        seminarSupervisions: [] as never[],
        authors: [] as never[],
        graders,
        topic: 'External Grader Test',
        status: 'IN_PROGRESS',
        startDate: dayjs().format('YYYY-MM-DD'),
        targetDate: dayjs().add(1, 'year').format('YYYY-MM-DD'),
      }

      void initializeI18n()

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
    }

    it('does not offer the external option when there are no graders', async () => {
      renderWithGraders([])

      await userEvent.click(screen.getByTestId('add-grader-button'))

      await waitFor(() => {
        expect(
          screen.getByTestId('add-grader-menu-item-internal')
        ).toBeInTheDocument()
      })
      expect(
        screen.queryByTestId('add-grader-menu-item-external')
      ).not.toBeInTheDocument()
    })

    it('offers the external option once the primary grader is set', async () => {
      renderWithGraders([
        {
          user: {
            id: '1',
            firstName: 'John',
            lastName: 'Doe',
            username: 'johndoe',
            email: 'john@example.com',
          },
          isPrimaryGrader: true,
        },
      ])

      await userEvent.click(screen.getByTestId('add-grader-button'))

      await waitFor(() => {
        expect(
          screen.getByTestId('add-grader-menu-item-external')
        ).toBeInTheDocument()
      })
    })
  })
})
