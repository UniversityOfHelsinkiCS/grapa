import { useState } from 'react'
import { useDropzone } from 'react-dropzone-esm'
import { useTranslation } from 'react-i18next'
import { Alert, Button, Link, Stack } from '@mui/material'
import { DescriptionOutlined, FileUploadOutlined } from '@mui/icons-material'
import { FileData } from '@backend/validators/thesisResponse'

import FilePreview from '../Dropzone/FilePreview'
import {
  BASE_PATH,
  MAX_UPLOAD_SIZE_BYTES,
  MAX_UPLOAD_SIZE_MB,
} from '../../../../config'
import { useMilestoneAttachmentMutation } from '../../../hooks/useThesesMutation'

interface MilestoneAttachmentProps {
  thesisId: string
  attachment?: FileData
  canManage: boolean
  isStudentView: boolean
}

export const MilestoneAttachment = ({
  thesisId,
  attachment,
  canManage,
  isStudentView,
}: MilestoneAttachmentProps) => {
  const { t } = useTranslation()
  const mutation = useMilestoneAttachmentMutation(isStudentView)
  const [rejected, setRejected] = useState(false)

  const { getInputProps, open } = useDropzone({
    accept: { 'application/pdf': ['.pdf'] },
    maxSize: MAX_UPLOAD_SIZE_BYTES,
    multiple: false,
    noClick: true,
    noDrag: true,
    noKeyboard: true,
    onDropAccepted: ([file]) => {
      setRejected(false)
      mutation.mutate({ thesisId, file })
    },
    onDropRejected: () => setRejected(true),
  })

  if (!canManage) {
    if (!attachment) return null

    return (
      <Link
        href={`${BASE_PATH}/api/${isStudentView ? 'student/' : ''}attachments/${attachment.filename}`}
        sx={{
          mt: 1,
          display: 'inline-flex',
          alignItems: 'center',
          gap: 0.5,
          fontSize: 'small',
          wordBreak: 'break-word',
        }}
      >
        <DescriptionOutlined fontSize="small" aria-hidden />
        {attachment.name}
      </Link>
    )
  }

  return (
    <Stack sx={{ mt: 1, gap: 1, alignItems: 'flex-start' }}>
      {attachment ? (
        <FilePreview
          file={attachment}
          isStudentView={isStudentView}
          onDelete={() => mutation.mutate({ thesisId })}
        />
      ) : (
        <>
          <input {...getInputProps()} />
          <Button
            size="small"
            variant="outlined"
            startIcon={<FileUploadOutlined />}
            disabled={mutation.isPending}
            onClick={open}
          >
            {t('progressView:uploadFile')}
          </Button>
        </>
      )}
      {(rejected || mutation.isError) && (
        <Alert severity="error" sx={{ py: 0, fontSize: 'small' }}>
          {t('progressView:milestoneFileError', { size: MAX_UPLOAD_SIZE_MB })}
        </Alert>
      )}
    </Stack>
  )
}
