/**
 * @jest-environment jsdom
 */
import React from 'react'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'

// import SupervisorSelect from './SupervisorSelect'
import initializeI18n from '../../../util/il18n'

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
        username: 'tunkkaus'
      }
    ],
  }),
}))


jest.unstable_mockModule('./src/client/hooks/useLoggedInUser', () => ({
  default: jest.fn().mockReturnValue({
    user: {id: 4, firstName: 'Henri', lastName: 'Tunkkaaja', username: 'tunkkaus'},
    isLoading: false,
  },),
}))

jest.unstable_mockModule('@mui/icons-material/Delete', () => ({
  default: jest.fn().mockReturnValue('DeleteIcon'),
}))

jest.unstable_mockModule('@mui/icons-material/ReportOutlined', () => ({
  default: jest.fn().mockReturnValue('ReportOutlinedIcon'),
}))

const SupervisorSelect = (await import('./SupervisorSelect')).default

describe('SupervisorSelect', () => {
  const supervisorSelections = []
  let setSupervisorSelections

  beforeEach(() => {
    setSupervisorSelections = jest.fn()


    initializeI18n()
  })

  it('renders the SupervisorSelect component', () => {
    render(
      <SupervisorSelect
        errors={[]}
        supervisorSelections={supervisorSelections}
        setSupervisorSelections={setSupervisorSelections}
      />
    )

    expect(screen.getByText('Lisää ohjaaja')).toBeInTheDocument()
  })

  it('renders the SupervisorSelect component with a supervisor', () => {
    render(
      <SupervisorSelect
        errors={[]}
        supervisorSelections={[
          { user: { id: 1, firstName: 'John', lastName: 'Doe', username: 'johndoe' }, percentage: 100, external: false },
        ]}
        setSupervisorSelections={setSupervisorSelections}
      />
    )

    expect(screen.getByText('Valitse ohjaaja')).toBeInTheDocument()
    expect(screen.getByText('Osuus')).toBeInTheDocument()
    expect(screen.getAllByRole('combobox')[0].value).toBe('John Doe  (johndoe)')
    expect(screen.getByText('Lisää ohjaaja')).toBeInTheDocument()
  })

  it('renders the SupervisorSelect component with multiple supervisors', () => {
    render(
      <SupervisorSelect
        errors={[]}
        supervisorSelections={[
          { user: { id: 1, firstName: 'John', lastName: 'Doe', username: 'johndoe' }, percentage: 50, external: false },
          { user: { id: 2, firstName: 'Jane', lastName: 'Smith', username: 'janesmith' }, percentage: 50, external: false },
        ]}
        setSupervisorSelections={setSupervisorSelections}
      />
    )
    expect(screen.getAllByRole('combobox')[0].value).toBe('John Doe  (johndoe)')
    expect(screen.getAllByRole('combobox')[1].value).toBe('Jane Smith  (janesmith)')

    expect(screen.getByText('Lisää ohjaaja')).toBeInTheDocument()
  })

  it('renders the SupervisorSelect component with an error', () => {
    const select = render(
      <SupervisorSelect
        errors={[
          {code: 'custom', message: 'formErrors:supervisors', path: ['supervisions', 0, 'user']}
        ]}
        supervisorSelections={[
          { user: null, percentage: 100, external: false }
        ]}
        setSupervisorSelections={setSupervisorSelections}
      />
    )


    const helperText = select.container.querySelector('#supervisions-0-user-helper-text')
    expect(helperText).toBeInTheDocument()

    const inputElement = select.container.querySelector('#supervisions-0-user')
    expect(inputElement).toHaveAttribute('aria-invalid', 'true')
  })

  it('renders the SupervisorSelect component with an error when percentage is invalid', () => {
    render(
      <SupervisorSelect
        errors={[
          {code: 'custom', message: 'formErrors:supervisors', path: ['supervisions', 0, 'percentage']}
        ]}
        supervisorSelections={[
          { user: { id: 1, firstName: 'John', lastName: 'Doe', username: 'johndoe' }, percentage: 80, external: false }
        ]}
        setSupervisorSelections={setSupervisorSelections}
      />
    )

    const percentageError = screen.getByTestId('supervisions-percentage-error')
    expect(percentageError).toBeInTheDocument()

  })

  describe('interactions', () => {
    it('should call setSupervisorSelections when a supervision is added', () => {
      render(
        <SupervisorSelect
          errors={[]}
          supervisorSelections={supervisorSelections}
          setSupervisorSelections={setSupervisorSelections}
        />
      )

      const select = screen.getByText('Lisää ohjaaja')
      select.click()

      expect(setSupervisorSelections).toHaveBeenCalledTimes(1)
      expect(setSupervisorSelections).toHaveBeenCalledWith([
        { user: null, percentage: 100, external: false },
      ])
    })

    it('should adjust the supervisor workload percentages accordingly', () => {
      render(
        <SupervisorSelect
          errors={[]}
          supervisorSelections={[
            { user: { id: 1, firstName: 'John', lastName: 'Doe', username: 'johndoe' }, percentage: 50, external: false },
            { user: { id: 2, firstName: 'Jane', lastName: 'Smith', username: 'janesmith' }, percentage: 50, external: false },
          ]}
          setSupervisorSelections={setSupervisorSelections}
        />
      )

      const select = screen.getByText('Lisää ohjaaja')
      select.click()

      expect(setSupervisorSelections).toHaveBeenCalledTimes(1)
      expect(setSupervisorSelections).toHaveBeenCalledWith([
        { user: { id: 1, firstName: 'John', lastName: 'Doe', username: 'johndoe' }, percentage: 34, external: false },
        { user: { id: 2, firstName: 'Jane', lastName: 'Smith', username: 'janesmith' }, percentage: 33, external: false },
        { user: null, percentage: 33, external: false },
      ])
    })

    it('should call setSupervisorSelections when a supervisor is removed', async () => {
      render(
        <SupervisorSelect
          errors={[]}
          supervisorSelections={[
            { user: { id: 1, firstName: 'John', lastName: 'Doe', username: 'johndoe' }, percentage: 50, external: false },
            { user: { id: 2, firstName: 'Jane', lastName: 'Smith', username: 'janesmith' }, percentage: 50, external: false },
          ]}
          setSupervisorSelections={setSupervisorSelections}
        />
      )
  
      // Click on the remove button to trigger the DeleteConfirmation dialog
      const removeButton = screen.getAllByTestId('remove-supervisor-button')[0]
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
          { user: { id: 2, firstName: 'Jane', lastName: 'Smith', username: 'janesmith' }, percentage: 100, external: false }
        ])
      })
    })

    it('should not allow to delete supervisor when there is only a single supervisor', () => {
      render(
        <SupervisorSelect
          errors={[]}
          supervisorSelections={[{ user: { id: 1, firstName: 'John', lastName: 'Doe', username: 'johndoe' }, percentage: 50, external: false },]}
          setSupervisorSelections={setSupervisorSelections}
        />
      )

      const removeButton = screen.getByTestId('remove-supervisor-button')
      expect(removeButton).toBeDisabled()

      expect(setSupervisorSelections).toHaveBeenCalledTimes(0)
    })
  })
})
