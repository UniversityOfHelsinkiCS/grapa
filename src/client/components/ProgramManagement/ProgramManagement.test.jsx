/**
 * @jest-environment jsdom
 */
import * as React from 'react'
import userEvent from '@testing-library/user-event'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'

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

jest.unstable_mockModule('./src/client/hooks/usePrograms', () => ({
  default: jest.fn().mockReturnValue({
    programs: [
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
  }),
}))

jest.unstable_mockModule('./src/client/hooks/useProgramManagements', () => ({
  default: jest.fn().mockReturnValue({
    programManagements: [
      {
        id: 1,
        programId: 1,
        userId: 1,
        program: {
          id: 1,
          name: {
            en: "Bachelor's Programme in Mathematical Sciences",
            fi: "Bachelor's Programme in Mathematical Sciences",
          },
        },
        user: {
          id: 1,
          firstName: 'John',
          lastName: 'Doe',
          username: 'johndoe',
        },
      },
    ]
  }),
}))

jest.unstable_mockModule('./src/client/hooks/useProgramManagementMutation', () => ({
  useCreateProgramManagementMutation: jest.fn().mockReturnValue({
    mutateAsync: jest.fn(),
  }),
  useDeleteProgramManagementMutation: jest.fn().mockReturnValue({
    mutateAsync: jest.fn(),
  })
}))

jest.unstable_mockModule('@mui/icons-material/Delete', () => ({
  default: jest.fn().mockReturnValue('DeleteIcon'),
}))

const {
  useCreateProgramManagementMutation,
  useDeleteProgramManagementMutation,
} = (await import('../../hooks/useProgramManagementMutation'))
const ProgramManagement = (await import('./ProgramManagement')).default

describe('ProgramManagement', () => {
  let createProgramManagementMock
  let deleteProgramManagementMock

  beforeEach(() => {
    initializeI18n()

    createProgramManagementMock = jest.fn()
    deleteProgramManagementMock = jest.fn()

    useCreateProgramManagementMutation.mockReturnValue({
      mutateAsync: createProgramManagementMock,
    })
    useDeleteProgramManagementMutation.mockReturnValue({
      mutateAsync: deleteProgramManagementMock,
    })   

  })

  it('renders all existing program managements', () => {
    render(<ProgramManagement />)

    expect(screen.getByTestId('program-manager-select-input')).toBeInTheDocument()
    expect(screen.getByText('John Doe')).toBeInTheDocument()
    expect(screen.getByText("Bachelor's Programme in Mathematical Sciences")).toBeInTheDocument()
  })

  describe('when an existing program management is deleted', () => {
    it('calls corresponding hook to delete program management', async () => {
      render(<ProgramManagement />)

      const user = userEvent.setup()

      const deleteButton = screen.getByTestId('delete-program-management-button-1')
      await user.click(deleteButton)

      await waitFor(() => {
        expect(screen.getByTestId('delete-confirm-dialog')).toBeInTheDocument()
      })

      const confirmButton = screen.getByTestId('delete-confirm-button')
      await user.click(confirmButton)

      await waitFor(() => {
        expect(deleteProgramManagementMock).toHaveBeenCalledTimes(1)
      })
    })
  })

  describe('when a new program management is created', () => {
    it.skip('calls corresponding hook to create program management', async () => {
      render(<ProgramManagement />)

      const user = userEvent.setup()

      const managerSelect = screen.getByTestId('program-manager-select-input')
      const managerInput = within(managerSelect).getByRole('combobox')

      managerSelect.focus()

      fireEvent.change(managerInput, { target: { value: 'John Doe' } })
      fireEvent.keyDown(managerInput, { key: 'ArrowDown' })
      fireEvent.keyDown(managerInput, { key: 'Enter' })

      const programSelectInput = screen.getByTestId('program-select-input')
      await user.click(programSelectInput)
      await user.click(screen.getByText("Bachelor's Programme in Mathematical Sciences"))

      const createButton = screen.getByTestId('add-program-management-button')

      // Wait for the button to become enabled, if it's asynchronous
      await waitFor(() => expect(createButton).toBeEnabled())

      await user.click(createButton)

      expect(createProgramManagementMock).toHaveBeenCalledTimes(1)
    })

  })
})
