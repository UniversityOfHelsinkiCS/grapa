import { Button, Tooltip } from '@mui/material'
import { TooltipProps, tooltipClasses } from '@mui/material/Tooltip'
import { styled } from '@mui/material/styles'
import { Fragment } from 'react/jsx-runtime'
import { useTranslation } from 'react-i18next'

const HtmlTooltip = styled(({ className, ...props }: TooltipProps) => (
  <Tooltip describeChild {...props} classes={{ popper: className }} />
))(({ theme }) => ({
  [`& .${tooltipClasses.tooltip}`]: {
    backgroundColor: '#f8f8f8',
    color: 'rgba(0, 0, 0, 0.87)',
    maxWidth: 500,
    fontSize: theme.typography.pxToRem(16),
    border: '1px solid #eaeaea',
  },
}))

interface Props {
  text: string
  sx?: any
}

export const PrethesisHelp = ({ text, sx }: Props) => {
  const { t } = useTranslation()
  return (
    <HtmlTooltip
      title={
        <Fragment>
          <div dangerouslySetInnerHTML={{ __html: text }}></div>
        </Fragment>
      }
    >
      <Button sx={sx} size="small" variant="contained">
        {t('help:button')}
      </Button>
    </HtmlTooltip>
  )
}
