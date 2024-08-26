/* eslint-disable react/require-default-props */
import React, { useId, useState } from 'react'
import { useDropzone } from 'react-dropzone-esm'
import { useTranslation } from 'react-i18next'

import {
  Box,
  CircularProgress,
  FormHelperText,
  InputLabel,
  Typography,
} from '@mui/material'
import FileUploadIcon from '@mui/icons-material/FileUpload'
import CheckIcon from '@mui/icons-material/Check'
import { FileData } from '@backend/types'
import { getBgColor, getColor } from './utils'

interface FileDropzoneProps {
  id: string
  label: string
  error: boolean
  required?: boolean
  helperText?: string
  uploadedFile?: File | FileData
  handleFileUpload: (files: File[]) => void
  inputProps?: JSX.IntrinsicElements['input'] & { 'data-testid'?: string }
}

const FileDropzone = ({
  id,
  label,
  error,
  required = false,
  helperText = null,
  uploadedFile,
  handleFileUpload,
  inputProps = {},
}: FileDropzoneProps) => {
  const { t } = useTranslation()
  const helperTextId = useId()

  const [uploading, setUploading] = useState(false)

  const uploadSuccess = Boolean(uploadedFile)

  const { getRootProps, getInputProps, isDragAccept, isDragReject } =
    useDropzone({
      accept: { 'application/pdf': ['.pdf'] },
      multiple: false,
      disabled: uploading || uploadSuccess,
      onDrop: (acceptedFiles) => {
        if (acceptedFiles.length > 0) {
          setUploading(true)

          handleFileUpload(acceptedFiles)
        }

        setUploading(false)
      },
    })

  const borderColor = getColor({
    uploadSuccess,
    error,
    isDragAccept,
    isDragReject,
  })
  const backgroundColor = getBgColor({
    uploadSuccess,
    error,
    isDragAccept,
    isDragReject,
  })

  return (
    <Box>
      <InputLabel
        htmlFor={`${id}-input`}
        error={error}
        required={required}
        sx={{
          width: 'fit-content',
          px: '0.5rem',
          color: 'text.primary',
          fontSize: '11pt',
          mb: '0.5rem',
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
          cursor: uploadSuccess ? 'default' : 'pointer',
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
        <Box sx={{ position: 'relative' }}>
          <Box
            sx={{
              backgroundColor: borderColor,
              borderRadius: '100%',
              width: '40px',
              height: '40px',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            {uploadedFile ? (
              <CheckIcon sx={{ color: 'background.paper' }} />
            ) : (
              <FileUploadIcon
                className="dropzone-icon"
                fontSize="small"
                sx={{ color: 'background.paper' }}
              />
            )}
          </Box>
          {uploading && (
            <CircularProgress
              size={48}
              sx={{
                color: 'success.main',
                position: 'absolute',
                zIndex: 1,
                left: -4,
                top: -4,
              }}
            />
          )}
        </Box>
        <Typography
          className="dropzone-text"
          variant="body2"
          sx={{ fontWeight: '600', fontSize: '10pt', color: 'text.primary' }}
        >
          {uploadSuccess
            ? t('dropzone:uploadSuccessText')
            : t('dropzone:uploadText')}
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
