import * as React from 'react'
import { Button, Menu, MenuItem, Stack } from '@mui/material'
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown'

interface NewPersonControlsProps {
  personGroup: 'supervisor' | 'grader' | 'seminar-supervisor'
  options: { label: string; isExternal: boolean }[]
  handleAddPerson: (isExternal: boolean) => void
  ariaLabel: string
  buttonId?: string
}

const NewPersonControls = ({
  personGroup,
  options,
  handleAddPerson,
  ariaLabel,
  buttonId,
}: NewPersonControlsProps) => {
  const [anchorEl, setAnchorEl] = React.useState<HTMLButtonElement | null>(null)
  const [optionPicked, setOptionPicked] = React.useState(false)
  const open = Boolean(anchorEl)
  const menuId = `${personGroup}-split-button-menu`

  const handleClose = () => setAnchorEl(null)

  const handleMenuItemClick = (index: number) => {
    setOptionPicked(true)
    handleAddPerson(options[index].isExternal)
    handleClose()
  }

  return (
    <Stack style={{ alignItems: 'center' }}>
      <Button
        disableElevation
        variant="contained"
        id={buttonId}
        data-testid={`add-${personGroup}-button`}
        aria-controls={open ? menuId : undefined}
        aria-expanded={open ? 'true' : undefined}
        aria-haspopup="menu"
        sx={{
          borderRadius: '0.5rem',
          justifyContent: 'center',
          width: 'fit-content',
        }}
        onClick={(event) => {
          setOptionPicked(false)
          setAnchorEl(event.currentTarget)
        }}
      >
        {options[0].label}
        <ArrowDropDownIcon />
      </Button>

      <Menu
        id={menuId}
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        disableRestoreFocus={optionPicked}
        slotProps={{ list: { 'aria-label': ariaLabel } }}
      >
        {options.map((option, index) => (
          <MenuItem
            key={option.label}
            data-testid={`add-${personGroup}-menu-item-${option.isExternal ? 'external' : 'internal'}`}
            onClick={() => handleMenuItemClick(index)}
          >
            {option.label}
          </MenuItem>
        ))}
      </Menu>
    </Stack>
  )
}

export default NewPersonControls
