/**
 * @jest-environment jsdom
 */
import userEvent from '@testing-library/user-event'
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react'

import initializeI18n from '../../util/il18n'

jest.unstable_mockModule('./src/client/hooks/useLoggedInUser', () => ({
  default: jest.fn().mockReturnValue({
    user: {
      id: 1,
      firstName: 'John',
      lastName: 'Doe',
      username: 'johndoe',
      managedDepartmentIds: ['1'],
      departmentId: '1',
    },
  }),
}))

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
  default: jest.fn().mockReturnValue({ programs: [] }),
}))

jest.unstable_mockModule('./src/client/hooks/useDepartments', () => ({
  default: jest.fn().mockReturnValue({
    departments: [
      {
        id: 1,
        name: {
          en: 'Department of Computer Science',
          fi: 'Tietojenkäsittelytieteen laitos',
        },
      },
      {
        id: 2,
        name: { en: 'Test department', fi: 'Testiosasto' },
      },
    ],
  }),
}))

jest.unstable_mockModule('./src/client/hooks/useDepartmentAdmins', () => ({
  default: jest.fn().mockReturnValue({
    departmentAdmins: [
      {
        id: 1,
        departmentId: 1,
        userId: 1,
        department: {
          id: 1,
          name: {
            en: 'Department of Computer Science',
            fi: 'Tietojenkäsittelytieteen laitos',
          },
        },
        user: {
          id: 1,
          firstName: 'John',
          lastName: 'Doe',
          username: 'johndoe',
          departmentId: 1,
        },
      },
    ],
  }),
}))

jest.unstable_mockModule(
  './src/client/hooks/useDepartmentAdminMutation',
  () => ({
    useCreateDepartmentAdminMutation: jest.fn().mockReturnValue({
      mutateAsync: jest.fn(),
    }),
    useDeleteDepartmentAdminMutation: jest.fn().mockReturnValue({
      mutateAsync: jest.fn(),
    }),
  })
)

jest.unstable_mockModule('./src/client/hooks/useProgramManagements', () => ({
  default: jest.fn().mockReturnValue({ programManagements: [] }),
}))

jest.unstable_mockModule(
  './src/client/hooks/useProgramManagementMutation',
  () => ({
    useCreateProgramManagementMutation: jest.fn().mockReturnValue({
      mutateAsync: jest.fn(),
    }),
    useDeleteProgramManagementMutation: jest.fn().mockReturnValue({
      mutateAsync: jest.fn(),
    }),
    useUpdateProgramManagementMutation: jest.fn().mockReturnValue({
      mutateAsync: jest.fn(),
    }),
  })
)

jest.unstable_mockModule('./src/client/hooks/useStudyTrackManagements', () => ({
  default: jest.fn().mockReturnValue({ studyTrackManagements: [] }),
}))

jest.unstable_mockModule(
  './src/client/hooks/useStudyTrackManagementMutation',
  () => ({
    useCreateStudyTrackManagementMutation: jest.fn().mockReturnValue({
      mutateAsync: jest.fn(),
    }),
    useDeleteStudyTrackManagementMutation: jest.fn().mockReturnValue({
      mutateAsync: jest.fn(),
    }),
  })
)

jest.unstable_mockModule('@mui/icons-material/Delete', () => ({
  default: jest.fn().mockReturnValue('DeleteIcon'),
}))

jest.unstable_mockModule('react-router-dom', () => ({ Navigate: jest.fn() }))

const { useCreateDepartmentAdminMutation, useDeleteDepartmentAdminMutation } =
  await import('../../hooks/useDepartmentAdminMutation')
const ManageEntityPermissions = (await import('./ManageEntityPermissions')).default

describe('ManageEntityPermissions (Department)', () => {
  let createDepartmentAdminMock
  let deleteDepartmentAdminMock

  beforeEach(() => {
    initializeI18n()

    createDepartmentAdminMock = jest.fn()
    deleteDepartmentAdminMock = jest.fn()

    useCreateDepartmentAdminMutation.mockReturnValue({
      mutateAsync: createDepartmentAdminMock,
    })
    useDeleteDepartmentAdminMutation.mockReturnValue({
      mutateAsync: deleteDepartmentAdminMock,
    })
  })

  it('renders all existing department admins', () => {
    render(<ManageEntityPermissions entityType="department" />)

    expect(
      screen.getByText('Yksikön ylläpitäjät')
    ).toBeInTheDocument()
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
