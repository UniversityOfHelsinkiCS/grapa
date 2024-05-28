/**
 * @jest-environment jsdom
 */
import * as React from 'react'
import dayjs from 'dayjs'
import userEvent from '@testing-library/user-event'
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react'

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
    ],
  }),
}))
jest.unstable_mockModule('@mui/icons-material/CloudUpload', () => ({
  default: jest.fn().mockReturnValue('CloudUploadIcon'),
}))
jest.unstable_mockModule('@mui/icons-material/UploadFile', () => ({
  default: jest.fn().mockReturnValue('UploadFileIcon'),
}))
jest.unstable_mockModule('@mui/icons-material/Error', () => ({
  default: jest.fn().mockReturnValue('ErrorIcon'),
}))

const ThesisEditForm = (await import('./ThesisEditForm')).default

describe('ThesisEditForm', () => {
  let mockOnClose
  let mockOnSubmit

  const programs = [{ key: 'KH50_001', name: 'Test Program' }]

  beforeEach(() => {
    mockOnClose = jest.fn()
    mockOnSubmit = jest.fn()
  })

  describe('when initialThesis is a new thesis', () => {
    beforeEach(() => {
      const initialThesis = {
        programId: programs[0].key,
        supervisions: [{ userId: 1, percentage: 100 }],
        authors: [],
        topic: '',
        status: 'PLANNING',
        startDate: dayjs().format('YYYY-MM-DD'),
        targetDate: dayjs().add(1, 'year').format('YYYY-MM-DD'),
      }

      initializeI18n()

      render(
        <ThesisEditForm
          initialThesis={initialThesis}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      )
    })

    it('renders ThesisEditForm correctly, renders all validation error, and submit button is disabled', () => {
      expect(screen.getByText('Muokkaa gradu')).toBeInTheDocument()
      expect(screen.getByText('Aihe')).toBeInTheDocument()
      expect(screen.getByText('Ohjelma')).toBeInTheDocument()
      expect(screen.getByText('Tekijä')).toBeInTheDocument()
      expect(screen.getByText('Vaihe')).toBeInTheDocument()
      expect(screen.getByText('Lataa tutkimussuunnitelma')).toBeInTheDocument()
      expect(screen.getByText('Lataa työskentelysopimus')).toBeInTheDocument()
      expect(screen.getByText('Lisää ohjaaja')).toBeInTheDocument()

      expect(
        screen.getByText('Tutkimussuunnitelma puuttuu')
      ).toBeInTheDocument()
      expect(screen.getByText('Työskentelysopimus puuttuu')).toBeInTheDocument()

      expect(screen.getByRole('button', { name: 'Tallenna' })).toBeDisabled()
    })

    describe('when all required fields are filled', () => {
      beforeEach(async () => {
        const user = userEvent.setup()

        const topicInput = screen.getByRole('textbox', { name: 'Aihe' })
        const programSelect = screen.getAllByRole('combobox')[0]
        const authorSelect = screen.getAllByRole('combobox')[1]
        const statusSelect = screen.getAllByRole('combobox')[2]

        const researchPlanInput = screen
          .getByRole('button', {
            name: 'CloudUploadIcon Lataa tutkimussuunnitelma',
          })
          .querySelector('input')

        const waysOfWorkingInput = screen
          .getByRole('button', {
            name: 'CloudUploadIcon Lataa työskentelysopimus',
          })
          .querySelector('input')

        // Fill all required fields
        await user.type(topicInput, 'Test')
        await user.click(programSelect)
        await user.click(
          screen.getAllByText(
            "Bachelor's Programme in Mathematical Sciences"
          )[0]
        )

        await user.click(authorSelect)
        await waitFor(() => {
          expect(screen.getByText('janesmith')).toBeInTheDocument()
        })
        await user.click(screen.getByText('janesmith'))

        await user.click(statusSelect)
        await user.click(screen.getAllByText('Planning')[0])

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
      })

      it('renders Submit button enabled and when clicked, calls onSubmit', async () => {
        expect(
          screen.queryByText('Tutkimussuunnitelma puuttuu')
        ).not.toBeInTheDocument()
        expect(
          screen.queryByText('Työskentelysopimus puuttuu')
        ).not.toBeInTheDocument()
        expect(
          screen.queryByText('Varmista, että ohjaajien yhteisprosentti on 100')
        ).not.toBeInTheDocument()

        const submitButton = screen.getByText('Tallenna').closest('button')

        expect(submitButton).toBeEnabled()

        await userEvent.click(submitButton)

        expect(mockOnSubmit).toHaveBeenCalledTimes(1)
      })
    })
  })

  describe('when initialThesis is an existing thesis', () => {
    beforeEach(() => {
      const initialThesis = {
        programId: programs[0].key,
        supervisions: [{ userId: 1, percentage: 100 }],
        authors: [{ userId: 2 }],
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
          initialThesis={initialThesis}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      )
    })

    it('renders ThesisEditForm correctly, renders no validation error, and submit button is enabled', () => {
      expect(screen.getByText('Muokkaa gradu')).toBeInTheDocument()
      expect(screen.getByText('Aihe')).toBeInTheDocument()
      expect(screen.getByText('Ohjelma')).toBeInTheDocument()
      expect(screen.getByText('Tekijä')).toBeInTheDocument()
      expect(screen.getByText('Vaihe')).toBeInTheDocument()
      expect(screen.getByText('Lataa tutkimussuunnitelma')).toBeInTheDocument()
      expect(screen.getByText('Lataa työskentelysopimus')).toBeInTheDocument()
      expect(screen.getByText('Lisää ohjaaja')).toBeInTheDocument()

      expect(
        screen.queryByText('Tutkimussuunnitelma puuttuu')
      ).not.toBeInTheDocument()
      expect(
        screen.queryByText('Työskentelysopimus puuttuu')
      ).not.toBeInTheDocument()
      expect(
        screen.queryByText('Varmista, että ohjaajien yhteisprosentti on 100')
      ).not.toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Tallenna' })).toBeEnabled()
    })
  })
})
