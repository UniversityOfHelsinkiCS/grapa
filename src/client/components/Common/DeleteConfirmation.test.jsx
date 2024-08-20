/**
 * @jest-environment jsdom
 */
import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import DeleteConfirmation from './DeleteConfirmation'


describe('DeleteConfirmation', () => {
  const mockSetOpen = jest.fn()
  const mockOnClose = jest.fn()
  const mockOnDelete = jest.fn()

  const props = {
    title: 'Delete Item',
    open: true,
    setOpen: mockSetOpen,
    onClose: mockOnClose,
    onDelete: mockOnDelete,
    children: <p>Are you sure you want to delete this item?</p>,
  }

  afterEach(() => {
    jest.clearAllMocks()
  })

  test('renders with correct title and children', () => {
    render(<DeleteConfirmation {...props} />)
    
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByTestId('delete-confirm-dialog-title')).toBeInTheDocument()
    expect(screen.getByTestId('delete-confirm-dialog-content')).toBeInTheDocument()
  })

  test('cancel button triggers setOpen with false', () => {
    render(<DeleteConfirmation {...props} />)
    
    fireEvent.click(screen.getByTestId('delete-cancel-button'))
    expect(mockSetOpen).toHaveBeenCalledWith(false)
  })

  test('delete button triggers onDelete', () => {
    render(<DeleteConfirmation {...props} />)
    
    fireEvent.click(screen.getByTestId('delete-confirm-button'))
    expect(mockOnDelete).toHaveBeenCalledTimes(1)
  })

  test('onClose is called when dialog is closed', () => {
    render(<DeleteConfirmation {...props} />)
    
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' })
    expect(mockOnClose).toHaveBeenCalledTimes(1)
  })

  test('dialog is not rendered when open is false', () => {
    render(<DeleteConfirmation {...props} open={false} />)
    
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})
