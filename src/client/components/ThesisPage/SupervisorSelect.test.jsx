/**
 * @jest-environment jsdom
 */
import React from 'react'
import { render, screen } from '@testing-library/react'

import SupervisorSelect from './SupervisorSelect'

describe('SupervisorSelect', () => {
  const supervisors = [
    { id: 1, name: 'John Doe' },
    { id: 2, name: 'Jane Smith' },
  ]
  const supervisorSelections = []
  const setSupervisorSelections = jest.fn()

  it('renders the SupervisorSelect component', () => {
    render(
      <SupervisorSelect
        supervisors={supervisors}
        supervisorSelections={supervisorSelections}
        setSupervisorSelections={setSupervisorSelections}
      />
    )
    expect(screen.getByText('Add Supervisor')).toBeInTheDocument()
  })
})
