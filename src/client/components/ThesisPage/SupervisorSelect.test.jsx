/**
 * @jest-environment jsdom
 */
import React from 'react'
import { render, screen } from '@testing-library/react'

import SupervisorSelect from './SupervisorSelect'
import initializeI18n from '../../util/il18n'

describe('SupervisorSelect', () => {
  const supervisors = [
    { id: 1, firstName: 'John', lastName: 'Doe' },
    { id: 2, firstName: 'Jane', lastName: 'Smith' },
  ]
  const supervisorSelections = []
  let setSupervisorSelections

  beforeEach(() => {
    setSupervisorSelections = jest.fn()

    initializeI18n()
  })

  it('renders the SupervisorSelect component', () => {
    render(
      <SupervisorSelect
        supervisors={supervisors}
        supervisorSelections={supervisorSelections}
        setSupervisorSelections={setSupervisorSelections}
      />
    )

    expect(screen.getByText('Lisää ohjaaja')).toBeInTheDocument()
  })

  it('renders the SupervisorSelect component with a supervisor', () => {
    render(
      <SupervisorSelect
        supervisors={supervisors}
        supervisorSelections={[
          { userId: 1, percentage: 100, firstName: 'John', lastName: 'Doe' },
        ]}
        setSupervisorSelections={setSupervisorSelections}
      />
    )

    expect(screen.getByText('Valitse ohjaaja')).toBeInTheDocument()
    expect(screen.getByText('Osuus')).toBeInTheDocument()
    expect(screen.getByText('John Doe')).toBeInTheDocument()
    expect(screen.getByText('Lisää ohjaaja')).toBeInTheDocument()
  })

  it('renders the SupervisorSelect component with multiple supervisors', () => {
    render(
      <SupervisorSelect
        supervisors={supervisors}
        supervisorSelections={[
          { userId: 1, percentage: 50, firstName: 'John', lastName: 'Doe' },
          { userId: 2, percentage: 50, firstName: 'Jane', lastName: 'Smith' },
        ]}
        setSupervisorSelections={setSupervisorSelections}
      />
    )
    expect(screen.getByText('John Doe')).toBeInTheDocument()
    expect(screen.getByText('Jane Smith')).toBeInTheDocument()
    expect(screen.getByText('Lisää ohjaaja')).toBeInTheDocument()
  })

  describe('interactions', () => {
    it('should call setSupervisorSelections when a supervision is added', () => {
      render(
        <SupervisorSelect
          supervisors={supervisors}
          supervisorSelections={supervisorSelections}
          setSupervisorSelections={setSupervisorSelections}
        />
      )

      const select = screen.getByText('Lisää ohjaaja')
      select.click()

      expect(setSupervisorSelections).toHaveBeenCalledTimes(1)
      expect(setSupervisorSelections).toHaveBeenCalledWith([
        { userId: '', percentage: 100 },
      ])
    })

    it('should call setSupervisorSelections when a supervisor is removed', () => {
      render(
        <SupervisorSelect
          supervisors={supervisors}
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
