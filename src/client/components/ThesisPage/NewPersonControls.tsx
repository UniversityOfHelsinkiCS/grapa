import * as React from 'react'
import {
  Button,
  ClickAwayListener,
  Grow,
  MenuItem,
  MenuList,
  Paper,
  Popper,
  Stack,
} from '@mui/material'
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown'
import { useTranslation } from 'react-i18next'

interface NewPersonControlsProps {
  personGroup: 'supervisor' | 'grader'
  options: { label: string; isExternal: boolean }[]
  handleAddPerson: (isExternal: boolean) => void
  setEditDisabled: (editDisabled: boolean) => void
}

const NewPersonControls = ({
  personGroup,
  options,
  handleAddPerson,
  setEditDisabled,
}: NewPersonControlsProps) => {
  const { t } = useTranslation()

  const [open, setOpen] = React.useState(false)
  const anchorRef = React.useRef<HTMLButtonElement>(null)

  const handleClick = (selectedIndex: number) => {
    const selectedAction = options[selectedIndex]
    setEditDisabled(false)
    handleAddPerson(selectedAction.isExternal)
  }

  const handleMenuItemClick = (
    _: React.MouseEvent<HTMLLIElement, MouseEvent>,
    index: number
  ) => {
    handleClick(index)
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
    <Stack alignItems="center">
      <Button
        disableElevation
        variant="contained"
        ref={anchorRef}
        data-testid={`add-${personGroup}-button`}
        aria-controls={open ? `${personGroup}-button-menu` : undefined}
        aria-expanded={open ? 'true' : undefined}
        aria-label={t(`thesisForm:${personGroup}ButtonGroupAriaLabel`)}
        sx={{
          borderRadius: '0.5rem',
          justifyContent: 'center',
          width: 'fit-content',
        }}
        onClick={handleToggle}
      >
        {options[0].label}
        <ArrowDropDownIcon />
      </Button>

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
                <MenuList id={`${personGroup}-split-button-menu`} autoFocusItem>
                  {options.map((option, index) => (
                    <MenuItem
                      key={option.label}
                      data-testid={`add-${personGroup}-menu-item-${option.isExternal ? 'external' : 'internal'}`}
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
    </Stack>
  )
}

export default NewPersonControls
