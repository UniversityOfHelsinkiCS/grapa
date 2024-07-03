/**
 * @jest-environment jsdom
 */
import React from 'react'
import { fireEvent, render, screen, within } from '@testing-library/react'

// import GraderSelect from './GraderSelect'
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

jest.unstable_mockModule('@mui/icons-material/Delete', () => ({
  default: jest.fn().mockReturnValue('DeleteIcon'),
}))

jest.unstable_mockModule('@mui/icons-material/ReportOutlined', () => ({
  default: jest.fn().mockReturnValue('ReportOutlinedIcon'),
}))

jest.unstable_mockModule('@mui/icons-material/ArrowDropDown', () => ({
  default: jest.fn().mockReturnValue('ArrowDropDownIcon'),
}))

const GraderSelect = (await import('./GraderSelect')).default

describe('GraderSelect', () => {
  const graderSelections = [
    { user: null, isPrimaryGrader: true },
    { user: null, isPrimaryGrader: false },
  ]
  let setGraderSelections

  beforeEach(() => {
    setGraderSelections = jest.fn()

    initializeI18n()
  })

  it('renders the GraderSelect component', () => {
    render(
      <GraderSelect
        errors={[]}
        graderSelections={graderSelections}
        setGraderSelections={setGraderSelections}
      />
    )

    expect(screen.getByTestId('grader-select')).toBeInTheDocument()
    expect(screen.getByTestId('grader-select-input-1')).toBeInTheDocument()
    expect(screen.getByTestId('grader-select-input-2')).toBeInTheDocument()
  })

  it('renders the GraderSelect component with a grader', () => {
    render(
      <GraderSelect
        errors={[]}
        graderSelections={[
          {
            user: {
              id: 1,
              firstName: 'John',
              lastName: 'Doe',
              username: 'johndoe',
              studentNumber: '12345',
            },
            isPrimaryGrader: true,
          },
          { user: null, isPrimaryGrader: false },
        ]}
        setGraderSelections={setGraderSelections}
      />
    )

    expect(screen.getByTestId('grader-select')).toBeInTheDocument()
    expect(screen.getByTestId('grader-select-input-1')).toBeInTheDocument()
    expect(screen.getByTestId('grader-select-input-2')).toBeInTheDocument()

    expect(screen.getAllByRole('combobox')[0].value).toBe('John Doe  (12345)')
  })

  it('renders the GraderSelect component with multiple supervisors', () => {
    render(
      <GraderSelect
        errors={[]}
        graderSelections={[
          {
            user: {
              id: 1,
              firstName: 'John',
              lastName: 'Doe',
              username: 'johndoe',
              studentNumber: '12345',
            },
            isPrimaryGrader: true,
          },
          {
            user: {
              id: 2,
              firstName: 'Jane',
              lastName: 'Smith',
              username: 'janesmith',
            },
            isPrimaryGrader: false,
          },
        ]}
        setGraderSelections={setGraderSelections}
      />
    )
    expect(screen.getAllByRole('combobox')[0].value).toBe('John Doe  (12345)')
    expect(screen.getAllByRole('combobox')[1].value).toBe('Jane Smith  ')
  })

  it('renders the GraderSelect component with an error', () => {
    const select = render(
      <GraderSelect
        errors={[
          {
            code: 'custom',
            message: 'formErrors:graders',
            path: ['graders', 0, 'user'],
          },
        ]}
        graderSelections={[{ user: null, isPrimaryGrader: true }]}
        setGraderSelections={setGraderSelections}
      />
    )

    const helperText = select.container.querySelector(
      '#graders-0-user-helper-text'
    )
    expect(helperText).toBeInTheDocument()

    const inputElement = select.container.querySelector('#graders-0-user')
    expect(inputElement).toHaveAttribute('aria-invalid', 'true')
  })

  describe('interactions', () => {
    it('should call setGraderSelections when a grader is added', () => {
      render(
        <GraderSelect
          errors={[]}
          graderSelections={graderSelections}
          setGraderSelections={setGraderSelections}
        />
      )

      const autocomplete = screen.getByTestId('grader-select-input-1')
      const input = within(autocomplete).getByRole('combobox')

      autocomplete.focus()
      // the value here can be any string you want, so you may also consider to
      // wrapper it as a function and pass in inputValue as parameter
      fireEvent.change(input, { target: { value: 'John Doe' } })
      fireEvent.keyDown(autocomplete, { key: 'ArrowDown' })
      fireEvent.keyDown(autocomplete, { key: 'Enter' })

      expect(setGraderSelections).toHaveBeenCalledTimes(1)
      expect(setGraderSelections).toHaveBeenCalledWith([
        {
          user: {
            id: 1,
            firstName: 'John',
            lastName: 'Doe',
            username: 'johndoe',
            studentNumber: '12345',
          },
          isPrimaryGrader: true,
        },
        { user: null, isPrimaryGrader: false },
      ])
    })
  })
})
