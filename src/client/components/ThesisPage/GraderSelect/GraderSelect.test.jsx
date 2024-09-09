/**
 * @jest-environment jsdom
 */
import React from 'react'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'

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
  let setErrors

  const graderSelections = [
    { user: null, isPrimaryGrader: true, isExternal: false },
  ]
  let setGraderSelections

  beforeEach(() => {
    setErrors = jest.fn()
    setGraderSelections = jest.fn()

    initializeI18n()
  })

  it('renders the GraderSelect component', () => {
    render(
      <GraderSelect
        errors={[]}
        setErrors={setErrors}
        graderSelections={graderSelections}
        setGraderSelections={setGraderSelections}
      />
    )

    expect(screen.getByTestId('grader-select')).toBeInTheDocument()
    expect(screen.getByTestId('grader-select-input-1')).toBeInTheDocument()
    expect(screen.getByTestId('add-grader-button')).toBeInTheDocument()
  })

  it('renders the GraderSelect component with a grader', () => {
    render(
      <GraderSelect
        errors={[]}
        setErrors={setErrors}
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
            isExternal: false,
          },
          { user: null, isPrimaryGrader: false, isExternal: false },
        ]}
        setGraderSelections={setGraderSelections}
      />
    )

    expect(screen.getByTestId('grader-select')).toBeInTheDocument()
    expect(screen.getByTestId('grader-select-input-1')).toBeInTheDocument()
    expect(screen.getByTestId('grader-select-input-2')).toBeInTheDocument()

    expect(screen.getAllByRole('combobox')[0].value).toBe('John Doe ')
  })

  it('renders the GraderSelect component with multiple graders', () => {
    render(
      <GraderSelect
        errors={[]}
        setErrors={setErrors}
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
            isExternal: false,
          },
          {
            user: {
              id: 2,
              firstName: 'Jane',
              lastName: 'Smith',
              username: 'janesmith',
            },
            isPrimaryGrader: false,
            isExternal: false,
          },
        ]}
        setGraderSelections={setGraderSelections}
      />
    )
    expect(screen.getAllByRole('combobox')[0].value).toBe('John Doe ')
    expect(screen.getAllByRole('combobox')[1].value).toBe('Jane Smith ')
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
        setErrors={setErrors}
        graderSelections={[{ user: null, isPrimaryGrader: true, isExternal: false }]}
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
          setErrors={setErrors}
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
          isExternal: false,
        },
      ])
    })

    it('should call setGraderSelections when an external grader is added', async () => {
      render(
        <GraderSelect
          errors={[]}
          setErrors={setErrors}
          graderSelections={graderSelections}
          setGraderSelections={setGraderSelections}
        />
      )

      const graderOptions = screen.getByTestId('change-add-grader-button-action')
      fireEvent.click(graderOptions)

      await waitFor(() => {
        expect(screen.getByTestId('add-grader-menu-item-external')).toBeInTheDocument()
      })

      const externalSupervisor = screen.getByTestId('add-grader-menu-item-external')
      fireEvent.click(externalSupervisor)

      await waitFor(() => {
        expect(screen.getByTestId('add-grader-button')).toBeInTheDocument()
      })

      const select = screen.getByTestId('add-grader-button')
      fireEvent.click(select)

      await waitFor(() => {
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
            isExternal: false,
          }, 
          { user: null, isPrimaryGrader: false, isExternal: true },
        ])
      })
    })

    it('should call setGraderSelections when a grader is removed', async () => {
      render(
        <GraderSelect
          errors={[]}
          setErrors={setErrors}
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
              isExternal: false,
            },
            { user: null, isPrimaryGrader: false, isExternal: false },
          ]}
          setGraderSelections={setGraderSelections}
        />
      )

      const removeButton = screen.getAllByTestId('remove-grader-button')[0]
      fireEvent.click(removeButton)

      await waitFor(() => {
        expect(screen.getByTestId('delete-confirm-dialog')).toBeInTheDocument()
      })

      const confirmDeleteButton = screen.getByTestId('delete-confirm-button')
      fireEvent.click(confirmDeleteButton)

      await waitFor(() => {
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
            isExternal: false,
          },
        ])
      })
    })

    it('should not display the remove button for the primary grader', () => {
      render(
        <GraderSelect
          errors={[]}
          setErrors={setErrors}
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
              isExternal: false,
            },
          ]}
          setGraderSelections={setGraderSelections}
        />
      )

      const removeButton = screen.queryByTestId('remove-grader-button')
      expect(removeButton).toBeNull()
    })

    it('should call setErrors when an erroneuous grader field is changed', async () => {
      const select = render(
        <GraderSelect
          errors={[
            {
              code: 'custom',
              message: 'formErrors:graders',
              path: ['graders', 0, 'user'],
            },
          ]}
          setErrors={setErrors}
          graderSelections={[
            { user: null, isExternal: false, isPrimaryGrader: true },
          ]}
          setGraderSelections={setGraderSelections}
        />
      )

      const helperText = select.container.querySelector(
        '#graders-0-user-helper-text'
      )
      expect(helperText).toBeInTheDocument()

      const inputElement = select.container.querySelector('#graders-0-user')
      expect(inputElement).toHaveAttribute('aria-invalid', 'true')

      const graderSelect1 = screen.getByTestId('grader-select-input-1')
      const graderInput1 = within(graderSelect1).getByRole('combobox')

      graderSelect1.focus()

      fireEvent.change(graderInput1, { target: { value: 'Bob Luukkainen' } })
      fireEvent.keyDown(graderSelect1, { key: 'ArrowDown' })
      fireEvent.keyDown(graderSelect1, { key: 'Enter' })

      await waitFor(() => {
        expect(setErrors).toHaveBeenCalledTimes(1)
        expect(setErrors).toHaveBeenCalledWith([])
      })
    })
  })
})
