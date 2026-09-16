import * as React from 'react'
import { Box, BoxProps } from '@mui/material'
import { visuallyHidden } from '@mui/utils'
import { useTranslation } from 'react-i18next'

/**
 * Text taken off the screen but left in the page for a screen reader
 */
export const VisuallyHidden = ({
  sx,
  ...props
}: BoxProps & { component?: React.ElementType }) => (
  <Box {...props} sx={{ ...visuallyHidden, ...sx }} />
)

/**
 * A bare value like "2025-01-01" or an email says nothing on its own when it
 * is read out, so the name of the thing is put in front of it
 */
export const HiddenLabel = ({ text }: { text: string }) => (
  <VisuallyHidden component="span">{`${text}, `}</VisuallyHidden>
)

export const NewTabHint = () => {
  const { t } = useTranslation()

  return (
    <VisuallyHidden component="span">{`, ${t('common:opensInNewTab')}`}</VisuallyHidden>
  )
}

export default HiddenLabel
