import { Alert, AlertProps, AlertTitle } from '@mui/material'

interface AlertBoxProps extends AlertProps {
  title?: string
}

const AlertBox = ({ title, children, sx, ...props }: AlertBoxProps) => {
  return (
    <Alert
      variant="outlined"
      sx={{
        whiteSpace: 'pre-line',
        ...(!children && { alignItems: 'center' }),
        ...sx,
      }}
      {...props}
    >
      {title && (
        <AlertTitle sx={{ ...(!children && { mb: 0 }) }}>{title}</AlertTitle>
      )}
      {children}
    </Alert>
  )
}

export default AlertBox
