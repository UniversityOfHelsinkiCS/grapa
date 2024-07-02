import * as React from 'react'
import {
  Button,
  ButtonGroup,
  ClickAwayListener,
  Grow,
  MenuItem,
  MenuList,
  Paper,
  Popper,
} from '@mui/material'
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown'
import { useTranslation } from 'react-i18next'

interface NewSupervisorControlsProps {
  handleAddSupervisor: (isExternal: boolean) => void
}

const NewSupervisorControls = ({
  handleAddSupervisor,
}: NewSupervisorControlsProps) => {
  const { t } = useTranslation()

  const [open, setOpen] = React.useState(false)
  const anchorRef = React.useRef<HTMLDivElement>(null)
  const [selectedIndex, setSelectedIndex] = React.useState(0)

  const options = [
    {
      label: t('thesisForm:addSupervisor'),
      isExternal: false,
    },
    {
      label: t('thesisForm:addExternalSupervisor'),
      isExternal: true,
    },
  ]

  const handleClick = () => {
    const selectedAction = options[selectedIndex]

    handleAddSupervisor(selectedAction.isExternal)
  }

  const handleMenuItemClick = (
    event: React.MouseEvent<HTMLLIElement, MouseEvent>,
    index: number
  ) => {
    setSelectedIndex(index)
    setOpen(false)
  }

  const handleToggle = () => {
    setOpen((prevOpen) => !prevOpen)
  }

  const handleClose = (event: Event) => {
    if (
      anchorRef.current &&
      anchorRef.current.contains(event.target as HTMLElement)
    ) {
      return
    }

    setOpen(false)
  }

  return (
    <>
      <ButtonGroup
        disableElevation
        variant="contained"
        ref={anchorRef}
        aria-label="Button group with a nested menu"
        sx={{
          justifyContent: 'center',
        }}
      >
        <Button
          data-testid="add-supervisor-button"
          sx={{ borderRadius: '0.5rem' }}
          onClick={handleClick}
        >
          {options[selectedIndex].label}
        </Button>
        <Button
          data-testid="change-add-supervisor-button-action"
          size="small"
          aria-controls={open ? 'split-button-menu' : undefined}
          aria-expanded={open ? 'true' : undefined}
          aria-label={t('thesisForm:supervisorButtonGroupAriaLabel')}
          aria-haspopup="menu"
          onClick={handleToggle}
          sx={{ borderRadius: '0.5rem' }}
        >
          <ArrowDropDownIcon />
        </Button>
      </ButtonGroup>
      <Popper
        sx={{
          zIndex: 1,
        }}
        open={open}
        anchorEl={anchorRef.current}
        role={undefined}
        transition
        disablePortal
      >
        {({ TransitionProps, placement }) => (
          <Grow
            {...TransitionProps}
            style={{
              transformOrigin:
                placement === 'bottom' ? 'center top' : 'center bottom',
            }}
          >
            <Paper>
              <ClickAwayListener onClickAway={handleClose}>
                <MenuList id="split-button-menu" autoFocusItem>
                  {options.map((option, index) => (
                    <MenuItem
                      key={option.label}
                      data-testid={`add-supervisor-menu-item-${option.isExternal ? 'external' : 'internal'}`}
                      selected={index === selectedIndex}
                      onClick={(event) => handleMenuItemClick(event, index)}
                    >
                      {option.label}
                    </MenuItem>
                  ))}
                </MenuList>
              </ClickAwayListener>
            </Paper>
          </Grow>
        )}
      </Popper>
    </>
  )
}

export default NewSupervisorControls
