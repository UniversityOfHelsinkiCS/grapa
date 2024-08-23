/* eslint-disable react/require-default-props */
/* eslint-disable no-nested-ternary */

import { useDropzone } from 'react-dropzone'
import { useTranslation } from 'react-i18next'
import { Box, Typography } from '@mui/material'
import CloudUploadIcon from '@mui/icons-material/CloudUpload'

const getColor = (props: any) => {
  if (props.isDragAccept) {
    return 'primary.main'
  }
  if (props.isDragReject) {
    return 'error.main'
  }
  return 'text.secondary'
}

interface FileDropzoneProps {
  id: string
  handleFileUpload: (files: File[]) => void
  inputProps?: JSX.IntrinsicElements['input']
}

const FileDropzone = ({
  id,
  handleFileUpload,
  inputProps = {},
}: FileDropzoneProps) => {
  const { t } = useTranslation()

  const { getRootProps, getInputProps, isFocused, isDragAccept, isDragReject } =
    useDropzone({
      accept: { 'application/pdf': ['.pdf'] },
      multiple: false,
      onDrop: (acceptedFile) => handleFileUpload(acceptedFile),
    })

  const borderColor = getColor({ isFocused, isDragAccept, isDragReject })
  const backgroundColor = isDragAccept
    ? '#dbeafe'
    : isDragReject
      ? '#fee2e2'
      : 'background.paper'

  return (
    <Box
      id={id}
      sx={{
        height: '200px',
        width: { xs: '100%', md: '50%' },
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem',
        padding: '1rem',
        justifyContent: 'center',
        alignItems: 'center',
        textAlign: 'center',
        border: '2px dashed',
        borderColor,
        backgroundColor,
        transition: 'border .24s ease-in-out',
        cursor: 'pointer',
        '&:focus': {
          borderColor: 'primary.main',
          '& .dropzone-text': {
            color: 'text.primary',
          },
          '& .dropzone-icon': {
            color: 'text.primary',
          },
        },
        '&:hover': {
          borderColor: 'primary.main',
          '& .dropzone-text': {
            color: 'text.primary',
          },
          '& .dropzone-icon': {
            color: 'text.primary',
          },
        },
      }}
      {...getRootProps()}
    >
      <input {...inputProps} {...getInputProps()} />
      <Typography
        className="dropzone-text"
        variant="body2"
        color="text.secondary"
      >
        {t('dropzone:uploadText')}
      </Typography>
      <CloudUploadIcon className="dropzone-icon" fontSize="medium" />
    </Box>
  )
}

export default FileDropzone
