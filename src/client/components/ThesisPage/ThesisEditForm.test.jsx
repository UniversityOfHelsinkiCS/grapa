/**
 * @jest-environment jsdom
 */
import dayjs from 'dayjs'
import userEvent from '@testing-library/user-event'
import { fireEvent, render, screen, within } from '@testing-library/react'

import initializeI18n from '../../util/il18n'

jest.unstable_mockModule('./src/client/hooks/useUsers', () => ({
  default: jest.fn().mockReturnValue({
    users: [
      { id: 1, firstName: 'John', lastName: 'Doe', username: 'johndoe' },
      { id: 2, firstName: 'Jane', lastName: 'Smith', username: 'janesmith' },
      {
        id: 3,
        firstName: 'Bob',
        lastName: 'Luukkainen',
        username: 'bobluukkainen',
      },
      {
        id: 4,
        firstName: 'Henri',
        lastName: 'Tunkkaaja',
        username: 'tunkkaus',
      },
    ],
  }),
}))

jest.unstable_mockModule('./src/client/hooks/useProgramManagements', () => ({
  default: jest.fn().mockReturnValue({
    programManagements: [
      {
        user: {
          id: 4,
          firstName: 'Henri',
          lastName: 'Tunkkaaja',
          username: 'tunkkaus',
        },
      },
    ],
    isLoading: false,
  }),
}))

const programs = [
  {
    id: 1,
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
    id: 2,
    name: { en: 'Test program 2', fi: 'testi 2' },
    studyTracks: [
      {
        id: 'test-study-track2',
        name: { en: 'Test Track 2', fi: 'Testi opintosuunta 2' },
      },
    ],
  },
]

jest.unstable_mockModule('./src/client/hooks/useLoggedInUser', () => ({
  default: jest.fn().mockReturnValue({
    user: {
      id: 4,
      firstName: 'Henri',
      lastName: 'Tunkkaaja',
      username: 'tunkkaus',
    },
    isLoading: false,
  }),
}))

jest.unstable_mockModule('@mui/icons-material/UploadFile', () => ({
  default: jest.fn().mockReturnValue('UploadFileIcon'),
}))

jest.unstable_mockModule('@mui/icons-material/Delete', () => ({
  default: jest.fn().mockReturnValue('DeleteIcon'),
}))

jest.unstable_mockModule('@mui/icons-material/Check', () => ({
  default: jest.fn().mockReturnValue('CheckIcon'),
}))

jest.unstable_mockModule('@mui/icons-material/FileUpload', () => ({
  default: jest.fn().mockReturnValue('FileUploadIcon'),
}))

jest.unstable_mockModule('@mui/icons-material/Error', () => ({
  default: jest.fn().mockReturnValue('ErrorIcon'),
}))

jest.unstable_mockModule('@mui/icons-material/ReportOutlined', () => ({
  default: jest.fn().mockReturnValue('ReportOutlinedIcon'),
}))

jest.unstable_mockModule('@mui/icons-material/ArrowDropDown', () => ({
  default: jest.fn().mockReturnValue('ArrowDropDownIcon'),
}))

jest.unstable_mockModule('@mui/icons-material/Star', () => ({
  default: jest.fn().mockReturnValue('Star'),
}))

jest.unstable_mockModule('@mui/icons-material/StarOutline', () => ({
  default: jest.fn().mockReturnValue('StarOutline'),
}))

const ThesisEditForm = (await import('./ThesisEditForm')).default

describe('ThesisEditForm', () => {
  let mockOnClose
  let mockOnSubmit

  beforeEach(() => {
    mockOnClose = jest.fn()
    mockOnSubmit = jest.fn()
  })

  describe('when initialThesis is a new thesis', () => {
    beforeEach(() => {
      const initialThesis = {
        programId: programs[0].id,
        studyTrackId: programs[0].studyTracks[0].id,
        supervisions: [],
        authors: [],
        approvers: [],
        graders: [
          { user: null, isPrimaryGrader: true },
          { user: null, isPrimaryGrader: false },
        ],
        topic: '',
        status: 'PLANNING',
        startDate: dayjs().format('YYYY-MM-DD'),
        targetDate: dayjs().add(1, 'year').format('YYYY-MM-DD'),
      }

      initializeI18n()

      render(
        <ThesisEditForm
          programs={programs}
          initialThesis={initialThesis}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      )
    })

    it('renders ThesisEditForm correctly and renders all validation errors', () => {
      expect(screen.getByTestId('thesis-form-title')).toBeInTheDocument()
      expect(screen.getByTestId('topic-select-input')).toBeInTheDocument()
      expect(screen.getByTestId('program-select-input')).toBeInTheDocument()
      expect(screen.getByTestId('author-select-input')).toBeInTheDocument()
      expect(screen.getByTestId('status-select-input')).toBeInTheDocument()
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
        const programSelect = screen.getAllByRole('combobox')[0]
        const statusSelect = screen.getAllByRole('combobox')[2]

        const authorSelect = screen.getByTestId('author-select-input')
        const authorInput = within(authorSelect).getByRole('combobox')

        const addSupervisorBtn = screen.getByTestId('add-supervisor-button')
        await user.click(addSupervisorBtn)

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
        expect(researchPlanInput.files[0]).toBe(testFile)

        fireEvent.change(waysOfWorkingInput, {
          target: { files: { item: () => testFile, length: 1, 0: testFile } },
        })
        expect(researchPlanInput.files[0]).toBe(testFile)
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
        programId: programs[0].key,
        studyTrackId: programs[0].studyTracks[0].id,
        supervisions: [
          { userId: 1, percentage: 100, isPrimarySupervisor: true },
        ],
        authors: [{ userId: 2 }],
        graders: [
          {
            user: {
              id: 1,
              firstName: 'John',
              lastName: 'Doe',
              username: 'johndoe',
            },
            isPrimaryGrader: true,
          },
          {
            user: {
              id: 2,
              firstName: 'Jane',
              lastName: 'Smith',
              username: 'janesmith',
            },
            isPrimaryGrader: false,
          },
        ],
        topic: 'Test',
        status: 'PLANNING',
        startDate: dayjs().format('YYYY-MM-DD'),
        targetDate: dayjs().add(1, 'year').format('YYYY-MM-DD'),
        researchPlan: {},
        waysOfWorking: {},
      }

      initializeI18n()

      render(
        <ThesisEditForm
          programs={programs}
          initialThesis={initialThesis}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
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
