import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import { Box, Divider, Drawer, IconButton, List } from '@mui/material'

interface MobileMenuProps {
  isOpen: boolean
  handleClose: () => void
  children: React.ReactNode
}

const MobileMenu = ({ isOpen, handleClose, children }: MobileMenuProps) => (
  <Box component="nav">
    <Drawer
      variant="temporary"
      anchor="right"
      open={isOpen}
      onClose={handleClose}
      ModalProps={{
        keepMounted: true,
      }}
      sx={{
        zIndex: (theme) => theme.zIndex.drawer + 1,
        display: { xs: 'block', sm: 'none' },
        '& .MuiDrawer-paper': { boxSizing: 'border-box', width: '60%' },
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-start',
          ...(theme) => theme.mixins.toolbar,
          px: 1,
          height: '100px',
        }}
      >
        <IconButton onClick={handleClose}>
          <ChevronRightIcon />
        </IconButton>
      </Box>
      <Divider />
      <List
        onClick={handleClose}
        sx={{ textAlign: 'left', textTransform: 'uppercase' }}
      >
        {children}
      </List>
    </Drawer>
  </Box>
)

export default MobileMenu
