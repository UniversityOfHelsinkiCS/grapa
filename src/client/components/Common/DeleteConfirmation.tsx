import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
} from '@mui/material'
import { t } from 'i18next'

interface DeleteConfirmationProps {
  title: string
  open: boolean
  setOpen: (open: boolean) => void
  onClose: () => void
  onDelete: () => void
  deleteDisabled?: boolean
  children: React.ReactNode
}

const DeleteConfirmation = ({
  title,
  open,
  setOpen,
  onClose,
  onDelete,
  deleteDisabled = false,
  children,
}: DeleteConfirmationProps) => (
  <Dialog data-testid="delete-confirm-dialog" open={open} onClose={onClose}>
    <DialogTitle data-testid="delete-confirm-dialog-title">{title}</DialogTitle>
    <DialogContent data-testid="delete-confirm-dialog-content">
      {children}
    </DialogContent>
    <DialogActions>
      <Button
        data-testid="delete-cancel-button"
        type="button"
        onClick={() => setOpen(false)}
      >
        {t('cancelButton')}
      </Button>
      <Button
        disabled={deleteDisabled}
        data-testid="delete-confirm-button"
        type="button"
        color="error"
        variant="contained"
        onClick={onDelete}
        sx={{ borderRadius: '0.5rem' }}
      >
        {t('deleteButton')}
      </Button>
    </DialogActions>
  </Dialog>
)

export default DeleteConfirmation
