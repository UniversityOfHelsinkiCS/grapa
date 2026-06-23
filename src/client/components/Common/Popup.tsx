import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  ButtonProps,
  DialogProps,
} from '@mui/material'
import { ReactNode, useRef } from 'react'

interface PopupProps extends Omit<
  DialogProps,
  'title' | 'onSubmit' | 'content'
> {
  open: boolean
  onClose: () => void
  title?: ReactNode
  children: ReactNode
  actions?: ReactNode
  onSubmit?: () => void
  onCancel?: () => void
  submitText?: ReactNode
  cancelText?: ReactNode
  submitColor?: ButtonProps['color']
  submitDisabled?: boolean
  submitVariant?: ButtonProps['variant']
  testId?: string
}

const Popup = ({ open, onClose, testId = 'popup', ...props }: PopupProps) => {
  const cachedProps = useRef(props)
  if (open) {
    cachedProps.current = props
  }
  const displayProps = open ? props : cachedProps.current

  const {
    title,
    children,
    actions,
    onSubmit,
    onCancel,
    submitText,
    cancelText,
    submitColor = 'primary',
    submitDisabled = false,
    submitVariant = 'contained',
    ...dialogProps
  } = displayProps
  return (
    <Dialog
      data-testid={`${testId}-dialog`}
      open={open}
      onClose={onClose}
      {...dialogProps}
    >
      {title && (
        <DialogTitle data-testid={`${testId}-title`}>{title}</DialogTitle>
      )}
      <DialogContent data-testid={`${testId}-content`}>
        {children}
      </DialogContent>
      <DialogActions>
        {actions ? (
          actions
        ) : (
          <>
            <Button
              data-testid={`${testId}-cancel-button`}
              onClick={onCancel || onClose}
            >
              {cancelText || 'Cancel'}
            </Button>
            {onSubmit && (
              <Button
                data-testid={`${testId}-submit-button`}
                onClick={onSubmit}
                color={submitColor}
                variant={submitVariant}
                disabled={submitDisabled}
                sx={{ borderRadius: '0.5rem' }}
              >
                {submitText || 'Submit'}
              </Button>
            )}
          </>
        )}
      </DialogActions>
    </Dialog>
  )
}

export default Popup
