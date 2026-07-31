import { describe, it, test, expect, beforeEach, vi } from 'vitest'
import * as React from 'react'
import userEvent from '@testing-library/user-event'
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react'

import initializeI18n from '../../util/il18n'

vi.mock('../../hooks/useLoggedInUser', () => ({
  default: vi.fn().mockReturnValue({
    user: {
      id: '1',
      firstName: 'John',
      lastName: 'Doe',
      username: 'johndoe',
      managedProgramIds: ['1'],
      departmentId: '1',
    },
  }),
}))

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

vi.mock('../../hooks/usePrograms', () => ({
  default: vi.fn().mockReturnValue({
    programs: [
      {
        id: '1',
        isManaged: true,
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
    ],
  }),
}))

vi.mock('../../hooks/useDepartments', () => ({
  default: vi.fn().mockReturnValue({ departments: [] }),
}))

vi.mock('../../hooks/useDepartmentAdmins', () => ({
  default: vi.fn().mockReturnValue({ departmentAdmins: [] }),
}))

vi.mock('../../hooks/useProgramManagements', () => ({
  default: vi.fn().mockReturnValue({
    programManagements: [
      {
        id: '1',
        programId: 1,
        userId: 1,
        isThesisApprover: false,
        program: {
          id: '1',
          name: {
            en: "Bachelor's Programme in Mathematical Sciences",
            fi: "Bachelor's Programme in Mathematical Sciences",
          },
        },
        user: {
          id: '1',
          firstName: 'John',
          lastName: 'Doe',
          username: 'johndoe',
        },
      },
    ],
  }),
}))

vi.mock('../../hooks/useStudyTrackManagements', () => ({
  default: vi.fn().mockReturnValue({
    studyTrackManagements: [
      {
        id: '1',
        studyTrackId: 'test-study-track1',
        userId: 1,
        isThesisApprover: false,
        studyTrack: {
          id: 'test-study-track1',
          name: {
            en: 'Test Track 1',
            fi: 'Testi opintosuunta 1',
          },
        },
        user: {
          id: '1',
          firstName: 'John',
          lastName: 'Doe',
          username: 'johndoe',
        },
      },
    ],
  }),
}))

vi.mock('../../hooks/useProgramManagementMutation', () => ({
  useCreateProgramManagementMutation: vi
    .fn()
    .mockReturnValue({ mutateAsync: vi.fn() } as never),
  useDeleteProgramManagementMutation: vi
    .fn()
    .mockReturnValue({ mutateAsync: vi.fn() } as never),
  useUpdateProgramManagementMutation: vi
    .fn()
    .mockReturnValue({ mutateAsync: vi.fn() } as never),
}))

vi.mock('../../hooks/useStudyTrackManagementMutation', () => ({
  useCreateStudyTrackManagementMutation: vi
    .fn()
    .mockReturnValue({ mutateAsync: vi.fn() } as never),
  useDeleteStudyTrackManagementMutation: vi
    .fn()
    .mockReturnValue({ mutateAsync: vi.fn() } as never),
  useUpdateStudyTrackManagementMutation: vi
    .fn()
    .mockReturnValue({ mutateAsync: vi.fn() } as never),
}))

vi.mock('../../hooks/useDepartmentAdminMutation', () => ({
  useCreateDepartmentAdminMutation: vi
    .fn()
    .mockReturnValue({ mutateAsync: vi.fn() } as never),
  useDeleteDepartmentAdminMutation: vi
    .fn()
    .mockReturnValue({ mutateAsync: vi.fn() } as never),
}))

vi.mock('@mui/icons-material/Delete', () => ({
  default: vi.fn().mockReturnValue('DeleteIcon'),
}))
vi.mock('@mui/icons-material/HowToReg', () => ({
  default: vi.fn().mockReturnValue('HowToRegIcon'),
}))
vi.mock('@mui/icons-material/HowToRegOutlined', () => ({
  default: vi.fn().mockReturnValue('HowToRegOutlinedIcon'),
}))

const {
  useCreateProgramManagementMutation,
  useDeleteProgramManagementMutation,
  useUpdateProgramManagementMutation,
} = await import('../../hooks/useProgramManagementMutation')
const ManageEntityPermissions = (await import('./ManageEntityPermissions'))
  .default

describe('ManageEntityPermissions component', () => {
  let createProgramManagementMock: any
  let deleteProgramManagementMock: any
  let updateProgramManagementMock: any

  beforeEach(() => {
    initializeI18n()

    createProgramManagementMock = vi.fn()
    deleteProgramManagementMock = vi.fn()
    updateProgramManagementMock = vi.fn()

    vi.mocked(useCreateProgramManagementMutation).mockReturnValue({
      mutateAsync: createProgramManagementMock,
    } as never)
    vi.mocked(useDeleteProgramManagementMutation).mockReturnValue({
      mutateAsync: deleteProgramManagementMock,
    } as never)
    vi.mocked(useUpdateProgramManagementMutation).mockReturnValue({
      mutateAsync: updateProgramManagementMock,
    } as never)
  })

  it('renders all existing program managements', () => {
    render(<ManageEntityPermissions filteringEntityId="PROG1" hideTitle />)

    expect(
      screen.getByTestId('program-manager-select-input')
    ).toBeInTheDocument()
    expect(screen.getByText('Doe John')).toBeInTheDocument()
    expect(
      screen.getByText("Bachelor's Programme in Mathematical Sciences")
    ).toBeInTheDocument()
  })

  describe('when an existing program management is deleted', () => {
    it('calls corresponding hook to delete program management', async () => {
      render(<ManageEntityPermissions />)

      const user = userEvent.setup()

      const deleteButton = screen.getByTestId(
        'delete-program-management-button-1'
      )
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
    it('calls corresponding hook to create program management', async () => {
      render(<ManageEntityPermissions />)

      const managerSelect = screen.getByTestId('program-manager-select-input')
      const managerInput = within(managerSelect).getByRole('combobox')
      const programSelectInput: any = screen.getAllByRole('combobox')[1]

      managerSelect.focus()
      fireEvent.change(managerInput, { target: { value: 'John Doe' } })
      fireEvent.keyDown(managerInput, { key: 'ArrowDown' })
      fireEvent.keyDown(managerInput, { key: 'Enter' })

      await userEvent.click(programSelectInput)
      await userEvent.click(
        screen.getAllByText("Bachelor's Programme in Mathematical Sciences")[1]
      )

      const createButton = screen.getByTestId('add-program-management-button')
      expect(createButton).toBeInTheDocument()
      await waitFor(() => expect(createButton).toBeEnabled())
      await userEvent.click(createButton)

      expect(createProgramManagementMock).toHaveBeenCalledTimes(1)
    })
  })

  describe('when an existing program management is updated', () => {
    it('calls corresponding hook to update program management', async () => {
      render(<ManageEntityPermissions />)

      const toggleThesisApproverButton = screen.getByTestId(
        'toggle-thesis-approver-button-1'
      )
      expect(toggleThesisApproverButton).toBeInTheDocument()
      expect(toggleThesisApproverButton).toBeEnabled()
      await userEvent.click(toggleThesisApproverButton)

      expect(updateProgramManagementMock).toHaveBeenCalledTimes(1)
      expect(updateProgramManagementMock).toHaveBeenCalledWith({
        programManagementId: '1',
        isThesisApprover: true,
      })
    })
  })
})
