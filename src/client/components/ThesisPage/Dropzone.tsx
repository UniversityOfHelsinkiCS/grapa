/* eslint-disable react/require-default-props */
/* eslint-disable no-nested-ternary */

import { useDropzone } from 'react-dropzone'
import { useTranslation } from 'react-i18next'
import { Box, FormHelperText, InputLabel, Typography } from '@mui/material'
import CloudUploadIcon from '@mui/icons-material/CloudUpload'
import { useId } from 'react'

const getColor = (props: any) => {
  if (props.error || props.isDragReject) {
    return 'error.main'
  }
  if (props.isDragAccept) {
    return 'primary.main'
  }
  return 'text.secondary'
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

  const { getRootProps, getInputProps, isFocused, isDragAccept, isDragReject } =
    useDropzone({
      accept: { 'application/pdf': ['.pdf'] },
      multiple: false,
      onDrop: (acceptedFile) => {
        handleFileUpload(acceptedFile)
      },
    })

  const borderColor = getColor({ error, isFocused, isDragAccept, isDragReject })
  const backgroundColor = isDragAccept
    ? '#dbeafe'
    : isDragReject
      ? '#fee2e2'
      : 'background.paper'

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
          height: '200px',
          width: { xs: '100%', md: '50%' },
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
          padding: '1rem',
          justifyContent: 'center',
          alignItems: 'center',
          textAlign: 'center',
          border: '2px dashed',
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
        <Typography
          className="dropzone-text"
          variant="body2"
          color={error ? 'error' : 'text.secondary'}
        >
          {t('dropzone:uploadText')}
        </Typography>
        <CloudUploadIcon
          className="dropzone-icon"
          fontSize="medium"
          color={error ? 'error' : 'action'}
        />
      </Box>
      {error && (
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
