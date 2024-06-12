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
  children: React.ReactNode
}

const DeleteConfirmation = ({
  title,
  open,
  setOpen,
  onClose,
  onDelete,
  children,
}: DeleteConfirmationProps) => (
  <Dialog open={open} onClose={onClose}>
    <DialogTitle>{title}</DialogTitle>
    <DialogContent>{children}</DialogContent>
    <DialogActions>
      <Button type="button" onClick={() => setOpen(false)}>
        {t('cancelButton')}
      </Button>
      <Button
        type="button"
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
