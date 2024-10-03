import { useId } from 'react'
import { NavLink } from 'react-router-dom'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import ExpandLessIcon from '@mui/icons-material/ExpandLess'
import NavigateNextIcon from '@mui/icons-material/NavigateNext'
import { Box, Button, Menu, MenuItem, Typography } from '@mui/material'

import { navStyles } from './NavBar'

interface PositionedMenuProps {
  open: boolean
  anchorEl: HTMLElement | null
  handleClick: (event: React.MouseEvent<HTMLElement>) => void
  handleClose: () => void
  label: string
  children: React.ReactNode
}

export const PositionedMenu = ({
  open,
  anchorEl,
  handleClick,
  handleClose,
  label,
  children,
}: PositionedMenuProps) => {
  const buttonId = useId()
  const menuId = useId()

  return (
    <Box>
      <Button
        id={buttonId}
        aria-controls={open ? menuId : undefined}
        aria-haspopup="true"
        aria-expanded={open ? 'true' : undefined}
        onClick={handleClick}
        sx={{ color: 'text.primary' }}
      >
        {label} {open ? <ExpandLessIcon /> : <ExpandMoreIcon />}
      </Button>
      <Menu
        id={menuId}
        aria-labelledby={buttonId}
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        elevation={0}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        {children}
      </Menu>
    </Box>
  )
}

interface PositionedMenuLinkItemProps {
  to: string
  onClick: () => void
  children: React.ReactNode
}

export const PositionedMenuLinkItem = ({
  to,
  onClick,
  children,
}: PositionedMenuLinkItemProps) => (
  <MenuItem component={NavLink} to={to} sx={navStyles.link} onClick={onClick}>
    <Typography
      sx={{ display: 'flex', gap: 2, textTransform: 'uppercase' }}
      variant="body2"
    >
      <NavigateNextIcon /> {children}
    </Typography>
  </MenuItem>
)
