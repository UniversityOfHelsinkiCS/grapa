/**
 * @jest-environment jsdom
 */
import React from 'react'
import { render, screen } from '@testing-library/react'

// import SupervisorSelect from './SupervisorSelect'
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
        supervisorSelections={supervisorSelections}
        setSupervisorSelections={setSupervisorSelections}
      />
    )

    expect(screen.getByText('Lisää ohjaaja')).toBeInTheDocument()
  })

  it('renders the SupervisorSelect component with a supervisor', () => {
    render(
      <SupervisorSelect
        supervisorSelections={[
          { user: { id: 1, firstName: 'John', lastName: 'Doe', username: 'johndoe' }, percentage: 100 },
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
        supervisorSelections={[
          { user: { id: 1, firstName: 'John', lastName: 'Doe', username: 'johndoe' }, percentage: 50 },
          { user: { id: 2, firstName: 'Jane', lastName: 'Smith', username: 'janesmith' }, percentage: 50 },
        ]}
        setSupervisorSelections={setSupervisorSelections}
      />
    )
    expect(screen.getAllByRole('combobox')[0].value).toBe('John Doe  (johndoe)')
    expect(screen.getAllByRole('combobox')[1].value).toBe('Jane Smith  (janesmith)')

    expect(screen.getByText('Lisää ohjaaja')).toBeInTheDocument()
  })

  describe('interactions', () => {
    it('should call setSupervisorSelections when a supervision is added', () => {
      render(
        <SupervisorSelect
          supervisorSelections={supervisorSelections}
          setSupervisorSelections={setSupervisorSelections}
        />
      )

      const select = screen.getByText('Lisää ohjaaja')
      select.click()

      expect(setSupervisorSelections).toHaveBeenCalledTimes(1)
      expect(setSupervisorSelections).toHaveBeenCalledWith([
        { user: null, percentage: 100 },
      ])
    })

    it('should call setSupervisorSelections when a supervisor is removed', () => {
      render(
        <SupervisorSelect
          supervisorSelections={[
            { userId: 1, percentage: 100, firstName: 'John', lastName: 'Doe' },
          ]}
          setSupervisorSelections={setSupervisorSelections}
        />
      )

      const removeButton = screen.getByText('Poista')
      removeButton.click()

      expect(setSupervisorSelections).toHaveBeenCalledTimes(1)
      expect(setSupervisorSelections).toHaveBeenCalledWith([])
    })
  })
})
