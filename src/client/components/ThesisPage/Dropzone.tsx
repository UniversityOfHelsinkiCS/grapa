/* eslint-disable react/require-default-props */
/* eslint-disable no-nested-ternary */
import { useId } from 'react'
import { useDropzone } from 'react-dropzone-esm'
import { useTranslation } from 'react-i18next'

import { Box, FormHelperText, InputLabel, Typography } from '@mui/material'
import UploadFileRoundedIcon from '@mui/icons-material/UploadFileRounded'

interface ColorProps {
  error?: boolean
  isDragReject: boolean
  isDragAccept: boolean
  defaultColor?: string
}

const getColor = ({
  error = false,
  isDragReject,
  isDragAccept,
  defaultColor = 'primary.main',
}: ColorProps) => {
  if (error || isDragReject) {
    return 'error.main'
  }
  if (isDragAccept) {
    return 'success.main'
  }
  return defaultColor
}

const getBgColor = ({
  error = false,
  isDragReject,
  isDragAccept,
}: ColorProps) => {
  if (error || isDragReject) {
    return '#fee2e2'
  }
  if (isDragAccept) {
    return '#dcfce7'
  }
  return '#e9f3ff'
}

interface FileDropzoneProps {
  id: string
  label: string
  error: boolean
  required?: boolean
  helperText?: string
  handleFileUpload: (files: File[]) => void
  inputProps?: JSX.IntrinsicElements['input'] & { 'data-testid'?: string }
}

const FileDropzone = ({
  id,
  label,
  error,
  required = false,
  helperText = null,
  handleFileUpload,
  inputProps = {},
}: FileDropzoneProps) => {
  const { t } = useTranslation()
  const helperTextId = useId()

  const { getRootProps, getInputProps, isDragAccept, isDragReject } =
    useDropzone({
      accept: { 'application/pdf': ['.pdf'] },
      multiple: false,
      onDrop: (acceptedFile) => {
        handleFileUpload(acceptedFile)
      },
    })

  const borderColor = getColor({ error, isDragAccept, isDragReject })
  const backgroundColor = getBgColor({ error, isDragAccept, isDragReject })

  return (
    <Box sx={{ display: 'relative' }}>
      <InputLabel
        htmlFor={`${id}-input`}
        error={error}
        required={required}
        sx={{
          display: 'absolute',
          top: '0.75rem',
          backgroundColor: 'background.paper',
          width: 'fit-content',
          px: '0.5rem',
          ml: 1,
        }}
      >
        {label}
      </InputLabel>
      <Box
        id={id}
        sx={{
          minHeight: 'auto',
          width: '100%',
          display: 'flex',
          flexDirection: 'row',
          gap: '1rem',
          padding: '1.5rem 1.75rem',
          alignItems: 'center',
          border: '1px dashed',
          borderRadius: '0.45rem',
          borderColor,
          backgroundColor,
          transition: 'border .24s ease-in-out',
          cursor: 'pointer',
        }}
        {...getRootProps()}
      >
        <input
          {...getInputProps({
            ...inputProps,
            id: `${id}-input`,
            'aria-invalid': error,
            'aria-describedby': helperTextId,
            style: {
              clip: 'rect(0 0 0 0)',
              clipPath: 'inset(50%)',
              height: 1,
              overflow: 'hidden',
              position: 'absolute',
              bottom: 0,
              left: 0,
              whiteSpace: 'nowrap',
              width: 1,
            },
          })}
        />
        <UploadFileRoundedIcon
          className="dropzone-icon"
          fontSize="large"
          sx={{ color: borderColor }}
        />
        <Typography
          className="dropzone-text"
          variant="body2"
          sx={{ fontWeight: '600', fontSize: '10pt', color: 'text.primary' }}
        >
          {t('dropzone:uploadText')}
        </Typography>
      </Box>
      {helperText && (
        <FormHelperText
          id={helperTextId}
          error={error}
          margin="dense"
          variant="filled"
          required
        >
          {helperText}
        </FormHelperText>
      )}
    </Box>
  )
}

export default FileDropzone
