import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
} from '@mui/material'
import { t } from 'i18next'

interface ConfirmationProps {
  title: string
  open: boolean
  setOpen: (open: boolean) => void
  onClose: () => void
  onSubmit: () => void
  children: React.ReactNode
}

const EthesisConfirmation = ({
  title,
  open,
  setOpen,
  onClose,
  onSubmit,
  children,
}: ConfirmationProps) => (
  <Dialog data-testid="ethesis-confirm-dialog" open={open} onClose={onClose}>
    <DialogTitle data-testid="ethesis-confirm-dialog-title">
      {title}
    </DialogTitle>
    <DialogContent data-testid="ethesis-confirm-dialog-content">
      {children}
    </DialogContent>
    <DialogActions>
      <Button
        data-testid="ethesis-cancel-button"
        type="button"
        onClick={() => setOpen(false)}
      >
        {t('cancelButton')}
      </Button>
      <Button
        data-testid="ethesis-confirm-button"
        type="button"
        color="error"
        variant="contained"
        onClick={onSubmit}
        sx={{ borderRadius: '0.5rem' }}
      >
        {t('thesisForm:send')}
      </Button>
    </DialogActions>
  </Dialog>
)

export default EthesisConfirmation
