import { MouseEvent, ReactNode } from 'react'
import { Box, Chip, ChipProps, IconButton } from '@mui/material'
import CancelIcon from '@mui/icons-material/Cancel'

interface RemovableChipProps extends Omit<ChipProps, 'label' | 'onDelete'> {
  label: ReactNode
  removeLabel: string
  onRemove: (event: MouseEvent<HTMLButtonElement>) => void
  removeButtonId?: string
  removeButtonTestId?: string
}

const RemovableChip = ({
  label,
  removeLabel,
  onRemove,
  removeButtonId,
  removeButtonTestId,
  sx,
  ...chipProps
}: RemovableChipProps) => (
  <Chip
    {...chipProps}
    sx={[
      {
        '& .MuiChip-label': {
          display: 'flex',
          alignItems: 'center',
          gap: '0.25rem',
          overflow: 'hidden',
        },
      },
      ...(Array.isArray(sx) ? sx : [sx]),
    ]}
    label={
      <>
        <Box
          component="span"
          sx={{
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {label}
        </Box>
        <IconButton
          id={removeButtonId}
          data-testid={removeButtonTestId}
          aria-label={removeLabel}
          onClick={onRemove}
          size="small"
          sx={{
            p: 0,
            color: 'action.active',
            opacity: 0.26,
            '&:hover, &:focus-visible': { opacity: 0.4 },
          }}
        >
          <CancelIcon sx={{ fontSize: '1.25rem' }} />
        </IconButton>
      </>
    }
  />
)

export default RemovableChip
