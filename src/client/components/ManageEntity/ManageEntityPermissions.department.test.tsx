import { describe, it, expect, beforeEach, vi } from 'vitest'
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
      managedDepartmentIds: ['1'],
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
  default: vi.fn().mockReturnValue({ programs: [] }),
}))

vi.mock('../../hooks/useDepartments', () => ({
  default: vi.fn().mockReturnValue({
    departments: [
      {
        id: '1',
        name: {
          en: 'Department of Computer Science',
          fi: 'Tietojenkäsittelytieteen laitos',
        },
      },
      {
        id: '2',
        name: { en: 'Test department', fi: 'Testiosasto' },
      },
    ],
  }),
}))

vi.mock('../../hooks/useDepartmentAdmins', () => ({
  default: vi.fn().mockReturnValue({
    departmentAdmins: [
      {
        id: '1',
        departmentId: 1,
        userId: 1,
        department: {
          id: '1',
          name: {
            en: 'Department of Computer Science',
            fi: 'Tietojenkäsittelytieteen laitos',
          },
        },
        user: {
          id: '1',
          firstName: 'John',
          lastName: 'Doe',
          username: 'johndoe',
          departmentId: 1,
        },
      },
    ],
  }),
}))

vi.mock('../../hooks/useDepartmentAdminMutation', () => ({
  useCreateDepartmentAdminMutation: vi
    .fn()
    .mockReturnValue({ mutateAsync: vi.fn() } as never),
  useDeleteDepartmentAdminMutation: vi
    .fn()
    .mockReturnValue({ mutateAsync: vi.fn() } as never),
}))

vi.mock('../../hooks/useProgramManagements', () => ({
  default: vi.fn().mockReturnValue({ programManagements: [] }),
}))

vi.mock('../../hooks/useProgramManagementMutation', () => ({
  useCreateProgramManagementMutation: vi
    .fn()
    .mockReturnValue({ mutateAsync: vi.fn() }),
  useDeleteProgramManagementMutation: vi
    .fn()
    .mockReturnValue({ mutateAsync: vi.fn() }),
  useUpdateProgramManagementMutation: vi
    .fn()
    .mockReturnValue({ mutateAsync: vi.fn() }),
}))

vi.mock('../../hooks/useStudyTrackManagements', () => ({
  default: vi.fn().mockReturnValue({ studyTrackManagements: [] }),
}))

vi.mock('../../hooks/useStudyTrackManagementMutation', () => ({
  useCreateStudyTrackManagementMutation: vi
    .fn()
    .mockReturnValue({ mutateAsync: vi.fn() }),
  useDeleteStudyTrackManagementMutation: vi
    .fn()
    .mockReturnValue({ mutateAsync: vi.fn() }),
}))

vi.mock('@mui/icons-material/Delete', () => ({
  default: vi.fn().mockReturnValue('DeleteIcon'),
}))

vi.mock('react-router-dom', () => ({ Navigate: vi.fn() }))

const { useCreateDepartmentAdminMutation, useDeleteDepartmentAdminMutation } =
  await import('../../hooks/useDepartmentAdminMutation')
const ManageEntityPermissions = (await import('./ManageEntityPermissions'))
  .default

describe('ManageEntityPermissions (Department)', () => {
  let createDepartmentAdminMock: any
  let deleteDepartmentAdminMock: any

  beforeEach(() => {
    initializeI18n()

    createDepartmentAdminMock = vi.fn()
    deleteDepartmentAdminMock = vi.fn()

    vi.mocked(useCreateDepartmentAdminMutation).mockReturnValue({
      mutateAsync: createDepartmentAdminMock,
    } as never)
    vi.mocked(useDeleteDepartmentAdminMutation).mockReturnValue({
      mutateAsync: deleteDepartmentAdminMock,
    } as never)
  })

  it('renders all existing department admins', () => {
    render(<ManageEntityPermissions entityType="department" />)

    expect(screen.getByText('Yksikön ylläpitäjät')).toBeInTheDocument()
    expect(screen.getByText('Doe John')).toBeInTheDocument()
    expect(
      screen.getByText('Tietojenkäsittelytieteen laitos')
    ).toBeInTheDocument()
  })

  describe('when an existing department admins is deleted', () => {
    it('calls corresponding hook to delete department admin', async () => {
      render(<ManageEntityPermissions entityType="department" />)

      const user = userEvent.setup()

      const deleteButton = screen.getByTestId(
        'delete-department-management-button-1'
      )
      await user.click(deleteButton)

      await waitFor(() => {
        expect(screen.getByTestId('delete-confirm-dialog')).toBeInTheDocument()
      })

      const confirmButton = screen.getByTestId('delete-confirm-button')
      await user.click(confirmButton)

      await waitFor(() => {
        expect(deleteDepartmentAdminMock).toHaveBeenCalledTimes(1)
      })
    })
  })

  describe('when a new program management is created', () => {
    it('calls corresponding hook to create program management', async () => {
      render(<ManageEntityPermissions entityType="department" />)

      const adminSelect = screen.getByTestId('program-manager-select-input')
      const adminInput = within(adminSelect).getByRole('combobox')
      const adminSelectInput = screen.getAllByRole('combobox')[1]

      adminSelect.focus()
      fireEvent.change(adminInput, { target: { value: 'John Doe' } })
      fireEvent.keyDown(adminInput, { key: 'ArrowDown' })
      fireEvent.keyDown(adminInput, { key: 'Enter' })

      await userEvent.click(adminSelectInput)
      await userEvent.click(
        screen.getAllByText('Tietojenkäsittelytieteen laitos')[1]
      )

      const createButton = screen.getByTestId('add-program-management-button')
      expect(createButton).toBeInTheDocument()
      expect(createButton).toBeEnabled()
      await userEvent.click(createButton)

      expect(createDepartmentAdminMock).toHaveBeenCalledTimes(1)
    })
  })
})
