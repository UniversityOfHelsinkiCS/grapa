interface ColorProps {
  uploadSuccess?: boolean
  error?: boolean
  isDragReject: boolean
  isDragAccept: boolean
  defaultColor?: string
}

export const getColor = ({
  uploadSuccess = false,
  error = false,
  isDragReject,
  isDragAccept,
  defaultColor = 'primary.main',
}: ColorProps) => {
  if (error || isDragReject) {
    return 'error.main'
  }
  if (uploadSuccess || isDragAccept) {
    return 'success.main'
  }
  return defaultColor
}

export const getBgColor = ({
  uploadSuccess = false,
  error = false,
  isDragReject,
  isDragAccept,
}: ColorProps) => {
  if (error || isDragReject) {
    return '#fee2e2'
  }
  if (uploadSuccess || isDragAccept) {
    return '#dcfce7'
  }
  return '#e9f3ff'
}
