/**
 * @jest-environment jsdom
 */

import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'

// import SupervisorSelect from './SupervisorSelect'
import initializeI18n from '../../../util/il18n'

jest.unstable_mockModule('./src/client/hooks/useUsers', () => ({
  default: jest.fn().mockReturnValue({
    users: [
      {
        id: 1,
        firstName: 'John',
        lastName: 'Doe',
        username: 'johndoe',
        studentNumber: '12345',
      },
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

jest.unstable_mockModule('@mui/icons-material/Delete', () => ({
  default: jest.fn().mockReturnValue('DeleteIcon'),
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


const SupervisorSelect = (await import('./SupervisorSelect')).default

describe('SupervisorSelect', () => {
  let setErrors
  const supervisorSelections = []
  let setSupervisorSelections

  beforeEach(() => {
    setErrors = jest.fn()
    setSupervisorSelections = jest.fn()

    initializeI18n()
  })

  it('renders the SupervisorSelect component', () => {
    render(
      <SupervisorSelect
        errors={[]}
        setErrors={setErrors}
        supervisorSelections={supervisorSelections}
        setSupervisorSelections={setSupervisorSelections}
      />
    )

    expect(screen.getByTestId('add-supervisor-button')).toBeInTheDocument()
  })

  it('renders the SupervisorSelect component with a supervisor', () => {
    render(
      <SupervisorSelect
        errors={[]}
        setErrors={setErrors}
        supervisorSelections={[
          {
            user: {
              id: 1,
              firstName: 'John',
              lastName: 'Doe',
              username: 'johndoe',
              studentNumber: '12345',
            },
            percentage: 100,
            isExternal: false,
            isPrimarySupervisor: true,
          },
        ]}
        setSupervisorSelections={setSupervisorSelections}
      />
    )

    expect(screen.getByTestId('add-supervisor-button')).toBeInTheDocument()
    expect(screen.getByTestId('percentage-input')).toBeInTheDocument()
    expect(screen.getAllByRole('combobox')[0].value).toBe('John Doe ')
    expect(screen.getByTestId('add-supervisor-button')).toBeInTheDocument()
  })

  it('renders the SupervisorSelect component with multiple supervisors', () => {
    render(
      <SupervisorSelect
        errors={[]}
        setErrors={setErrors}
        supervisorSelections={[
          {
            user: {
              id: 1,
              firstName: 'John',
              lastName: 'Doe',
              username: 'johndoe',
              studentNumber: '12345',
            },
            percentage: 50,
            isExternal: false,
            isPrimarySupervisor: true,
          },
          {
            user: {
              id: 2,
              firstName: 'Jane',
              lastName: 'Smith',
              username: 'janesmith',
            },
            percentage: 50,
            isExternal: false,
            isPrimarySupervisor: false,
          },
        ]}
        setSupervisorSelections={setSupervisorSelections}
      />
    )
    expect(screen.getAllByRole('combobox')[0].value).toBe('John Doe ')
    expect(screen.getAllByRole('combobox')[1].value).toBe('Jane Smith ')

    expect(screen.getByTestId('add-supervisor-button')).toBeInTheDocument()
  })

  it('renders the SupervisorSelect component with an error', () => {
    const select = render(
      <SupervisorSelect
        errors={[
          {
            code: 'custom',
            message: 'formErrors:supervisors',
            path: ['supervisions', 0, 'user'],
          },
        ]}
        setErrors={setErrors}
        supervisorSelections={[
          { user: null, percentage: 100, isExternal: false, isPrimarySupervisor: true },
        ]}
        setSupervisorSelections={setSupervisorSelections}
      />
    )

    const helperText = select.container.querySelector(
      '#supervisions-0-user-helper-text'
    )
    expect(helperText).toBeInTheDocument()

    const inputElement = select.container.querySelector('#supervisions-0-user')
    expect(inputElement).toHaveAttribute('aria-invalid', 'true')
  })

  it('renders the SupervisorSelect component with an error when percentage is invalid', () => {
    render(
      <SupervisorSelect
        errors={[
          {
            code: "custom",
            message: "formErrors:supervisorPercentage",
            path: [
              "supervisions",
              "general",
              "supervisor",
              "error"
            ]
          }
        ]}
        setErrors={setErrors}
        supervisorSelections={[
          {
            user: {
              id: 1,
              firstName: 'John',
              lastName: 'Doe',
              username: 'johndoe',
              studentNumber: '12345',
            },
            percentage: 80,
            isExternal: false,
            isPrimarySupervisor: true,
          },
        ]}
        setSupervisorSelections={setSupervisorSelections}
      />
    )

    const percentageError = screen.getByTestId('supervisions-general-supervisor-error')
    expect(percentageError).toBeInTheDocument()
  })

  it('renders the SupervisorSelect component with an error when primary supervisor is missing', () => {
    render(
      <SupervisorSelect
        errors={[
          {
            code: "custom",
            message: "formErrors:primarySupervisor",
            path: [
              "supervisions",
              "general",
              "supervisor",
              "error"
            ]
          }
        ]}
        setErrors={setErrors}
        supervisorSelections={[
          {
            user: {
              id: 1,
              firstName: 'John',
              lastName: 'Doe',
              username: 'johndoe',
              studentNumber: '12345',
            },
            percentage: 100,
            isExternal: false,
            isPrimarySupervisor: false,
          },
        ]}
        setSupervisorSelections={setSupervisorSelections}
      />
    )

    const primaryError = screen.getByTestId('supervisions-general-supervisor-error')
    expect(primaryError).toBeInTheDocument()

    const primarySupervisorCheckbox = screen.getByRole('checkbox')
    expect(primarySupervisorCheckbox).toBeInTheDocument()
    expect(primarySupervisorCheckbox).not.toBeChecked()
    expect(primarySupervisorCheckbox).toHaveAttribute('aria-invalid', 'true')
  })
  
  describe('interactions', () => {
    it('should call setSupervisorSelections when a supervision is added', () => {
      render(
        <SupervisorSelect
          errors={[]}
          setErrors={setErrors}
          supervisorSelections={supervisorSelections}
          setSupervisorSelections={setSupervisorSelections}
        />
      )

      const select = screen.getByTestId('add-supervisor-button')
      select.click()

      expect(setSupervisorSelections).toHaveBeenCalledTimes(1)
      expect(setSupervisorSelections).toHaveBeenCalledWith([
        { user: null, percentage: 100, isExternal: false, isPrimarySupervisor: false, creationTimeIdentifier: expect.any(String) },
      ])
    })

    it('should call setSupervisorSelections when an external supervisor is added', async () => {
      render(
        <SupervisorSelect
          errors={[]}
          setErrors={setErrors}
          supervisorSelections={supervisorSelections}
          setSupervisorSelections={setSupervisorSelections}
        />
      )

      const supervisorOptions = screen.getByTestId('change-add-supervisor-button-action')
      fireEvent.click(supervisorOptions)

      await waitFor(() => {
        expect(screen.getByTestId('add-supervisor-menu-item-external')).toBeInTheDocument()
      })

      const externalSupervisor = screen.getByTestId('add-supervisor-menu-item-external')
      fireEvent.click(externalSupervisor)

      await waitFor(() => {
        expect(screen.getByTestId('add-supervisor-button')).toBeInTheDocument()
      })

      const select = screen.getByTestId('add-supervisor-button')
      fireEvent.click(select)

      await waitFor(() => {
        expect(setSupervisorSelections).toHaveBeenCalledTimes(1)
        expect(setSupervisorSelections).toHaveBeenCalledWith([
          { user: null, percentage: 100, isExternal: true, isPrimarySupervisor: false, creationTimeIdentifier: expect.any(String)},
        ])
      })
    })  

    it('should adjust the supervisor workload percentages accordingly', () => {
      render(
        <SupervisorSelect
          errors={[]}
          setErrors={setErrors}
          supervisorSelections={[
            {
              user: {
                id: 1,
                firstName: 'John',
                lastName: 'Doe',
                username: 'johndoe',
                studentNumber: '12345',
              },
              percentage: 50,
              isExternal: false,
              isPrimarySupervisor: true,
            },
            {
              user: {
                id: 2,
                firstName: 'Jane',
                lastName: 'Smith',
                username: 'janesmith',
              },
              percentage: 50,
              isExternal: false,
              isPrimarySupervisor: false,
            },
          ]}
          setSupervisorSelections={setSupervisorSelections}
        />
      )

      const select = screen.getByTestId('add-supervisor-button')
      select.click()

      expect(setSupervisorSelections).toHaveBeenCalledTimes(1)
      expect(setSupervisorSelections).toHaveBeenCalledWith([
        {
          user: {
            id: 1,
            firstName: 'John',
            lastName: 'Doe',
            username: 'johndoe',
            studentNumber: '12345',
          },
          percentage: 34,
          isExternal: false,
          isPrimarySupervisor: true,
        },
        {
          user: {
            id: 2,
            firstName: 'Jane',
            lastName: 'Smith',
            username: 'janesmith',
          },
          percentage: 33,
          isExternal: false,
          isPrimarySupervisor: false,
        },
        { user: null, percentage: 33, isExternal: false, isPrimarySupervisor: false, creationTimeIdentifier: expect.any(String)},
      ])
    })

    it('should adjust the supervisor workload percentages accordingly when an external supervisor is added', async () => {
      render(
        <SupervisorSelect
          errors={[]}
          setErrors={setErrors}
          supervisorSelections={[
            {
              user: {
                id: 1,
                firstName: 'John',
                lastName: 'Doe',
                username: 'johndoe',
                studentNumber: '12345',
              },
              percentage: 50,
              isExternal: false,
              isPrimarySupervisor: true,
            },
            {
              user: {
                id: 2,
                firstName: 'Jane',
                lastName: 'Smith',
                username: 'janesmith',
              },
              percentage: 50,
              isExternal: false,
              isPrimarySupervisor: false,
            },
          ]}
          setSupervisorSelections={setSupervisorSelections}
        />
      )

       const supervisorOptions = screen.getByTestId('change-add-supervisor-button-action')
      fireEvent.click(supervisorOptions)

      await waitFor(() => {
        expect(screen.getByTestId('add-supervisor-menu-item-external')).toBeInTheDocument()
      })

      const externalSupervisor = screen.getByTestId('add-supervisor-menu-item-external')
      fireEvent.click(externalSupervisor)

      await waitFor(() => {
        expect(screen.getByTestId('add-supervisor-button')).toBeInTheDocument()
      })

      const select = screen.getByTestId('add-supervisor-button')
      fireEvent.click(select)

      await waitFor(() => {
        expect(setSupervisorSelections).toHaveBeenCalledTimes(1)
        expect(setSupervisorSelections).toHaveBeenCalledWith([
          {
            user: {
              id: 1,
              firstName: 'John',
              lastName: 'Doe',
              username: 'johndoe',
              studentNumber: '12345',
            },
            percentage: 34,
            isExternal: false,
            isPrimarySupervisor: true,
          },
          {
            user: {
              id: 2,
              firstName: 'Jane',
              lastName: 'Smith',
              username: 'janesmith',
            },
            percentage: 33,
            isExternal: false,
            isPrimarySupervisor: false,
          },
          { user: null, percentage: 33, isExternal: true, isPrimarySupervisor: false, creationTimeIdentifier: expect.any(String) },
        ])
      })
    })

    it('should call setSupervisorSelections when a supervisor is removed', async () => {
      render(
        <SupervisorSelect
          errors={[]}
          setErrors={setErrors}
          supervisorSelections={[
            {
              user: {
                id: 1,
                firstName: 'John',
                lastName: 'Doe',
                username: 'johndoe',
                studentNumber: '12345',
              },
              percentage: 50,
              isExternal: false,
              isPrimarySupervisor: true,
            },
            {
              user: {
                id: 2,
                firstName: 'Jane',
                lastName: 'Smith',
                username: 'janesmith',
              },
              percentage: 50,
              isExternal: false,
              isPrimarySupervisor: false,
            },
          ]}
          setSupervisorSelections={setSupervisorSelections}
        />
      )

      // Click on the remove button to trigger the DeleteConfirmation dialog
      const removeButton = screen.getAllByTestId('remove-supervisor-button')[1]
      fireEvent.click(removeButton)

      // Wait for the DeleteConfirmation dialog to appear
      await waitFor(() => {
        expect(screen.getByTestId('delete-confirm-dialog')).toBeInTheDocument()
      })

      // Click on the confirm delete button
      const confirmDeleteButton = screen.getByTestId('delete-confirm-button')
      fireEvent.click(confirmDeleteButton)

      // Assert the function call and the updated state
      await waitFor(() => {
        expect(setSupervisorSelections).toHaveBeenCalledTimes(1)
        expect(setSupervisorSelections).toHaveBeenCalledWith([
          {
            user: {
              id: 1,
              firstName: 'John',
              lastName: 'Doe',
              username: 'johndoe',
              studentNumber: '12345',
            },
            percentage: 100,
            isExternal: false,
            isPrimarySupervisor: true,
          },
        ])
      })
    })

    it('should not allow to delete supervisor when there is only a single supervisor', () => {
      render(
        <SupervisorSelect
          errors={[]}
          setErrors={setErrors}
          supervisorSelections={[
            {
              user: {
                id: 1,
                firstName: 'John',
                lastName: 'Doe',
                username: 'johndoe',
                studentNumber: '12345',
              },
              percentage: 50,
              isExternal: false,
              isPrimarySupervisor: true,
            },
          ]}
          setSupervisorSelections={setSupervisorSelections}
        />
      )

      const removeButton = screen.getByTestId('remove-supervisor-button')
      expect(removeButton).toBeDisabled()

      expect(setSupervisorSelections).toHaveBeenCalledTimes(0)
    })

    it('should call setSupervisorSelections when a supervisor is marked as primary', async () => {
      render(
        <SupervisorSelect
          errors={[]}
          setErrors={setErrors}
          supervisorSelections={[
            {
              user: {
                id: 1,
                firstName: 'John',
                lastName: 'Doe',
                username: 'johndoe',
                studentNumber: '12345',
              },
              percentage: 50,
              isExternal: false,
              isPrimarySupervisor: true,
            },
            {
              user: {
                id: 2,
                firstName: 'Jane',
                lastName: 'Smith',
                username: 'janesmith',
              },
              percentage: 50,
              isExternal: false,
              isPrimarySupervisor: false,
            },
          ]}
          setSupervisorSelections={setSupervisorSelections}
        />
      )

      const select = screen.getAllByRole('checkbox')[1]
      fireEvent.click(select)

      await waitFor(() => {
        expect(setSupervisorSelections).toHaveBeenCalledTimes(1)
        expect(setSupervisorSelections).toHaveBeenCalledWith([
          {
            user: {
              id: 1,
              firstName: 'John',
              lastName: 'Doe',
              username: 'johndoe',
              studentNumber: '12345',
            },
            percentage: 50,
            isExternal: false,
            isPrimarySupervisor: false,
          },
          {
            user: {
              id: 2,
              firstName: 'Jane',
              lastName: 'Smith',
              username: 'janesmith',
            },
            percentage: 50,
            isExternal: false,
            isPrimarySupervisor: true,
          },
        ])
      })
    })

    it('should not be able to remove the primary supervisor', async () => {
      render(
        <SupervisorSelect
          errors={[]}
          setErrors={setErrors}
          supervisorSelections={[
            {
              user: {
                id: 1,
                firstName: 'John',
                lastName: 'Doe',
                username: 'johndoe',
                studentNumber: '12345',
              },
              percentage: 50,
              isExternal: false,
              isPrimarySupervisor: true,
            },
            {
              user: {
                id: 2,
                firstName: 'Jane',
                lastName: 'Smith',
                username: 'janesmith',
              },
              percentage: 50,
              isExternal: false,
              isPrimarySupervisor: false,
            },
          ]}
          setSupervisorSelections={setSupervisorSelections}
        />
      )

      const removeButton = screen.getAllByTestId('remove-supervisor-button')[0]
      expect(removeButton).toBeDisabled()

      expect(setSupervisorSelections).toHaveBeenCalledTimes(0)
    })

    it('should call setErrors when an erroneuous supervisor field is changed', async () => {
      const select = render(
        <SupervisorSelect
          errors={[
            {
              code: 'custom',
              message: 'formErrors:supervisors',
              path: ['supervisions', 0, 'user'],
            },
          ]}
          setErrors={setErrors}
          supervisorSelections={[
            { user: null, percentage: 100, isExternal: false, isPrimarySupervisor: true },
          ]}
          setSupervisorSelections={setSupervisorSelections}
        />
      )

      const helperText = select.container.querySelector(
        '#supervisions-0-user-helper-text'
      )
      expect(helperText).toBeInTheDocument()

      const inputElement = select.container.querySelector('#supervisions-0-user')
      expect(inputElement).toHaveAttribute('aria-invalid', 'true')

      const superVisorSelect1 = screen.getByTestId(
        'supervisor-select-input-1'
      )

      const superVisorInput1 = within(superVisorSelect1).getByRole('combobox')

      superVisorSelect1.focus()

      fireEvent.change(superVisorInput1, { target: { value: 'Jane Smith' } })
      fireEvent.keyDown(superVisorSelect1, { key: 'ArrowDown' })
      fireEvent.keyDown(superVisorSelect1, { key: 'Enter' })

      await waitFor(() => {
        expect(setErrors).toHaveBeenCalledTimes(1)
        expect(setErrors).toHaveBeenCalledWith([])
      })
    })
  })
})
