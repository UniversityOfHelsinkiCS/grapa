import { useState } from 'react'
import { ErrorCode, useDropzone } from 'react-dropzone-esm'
import { useTranslation } from 'react-i18next'
import { Alert, Button, Link, Stack, Typography } from '@mui/material'
import { DescriptionOutlined, FileUploadOutlined } from '@mui/icons-material'
import { FileData } from '@backend/validators/thesisResponse'

import FilePreview from '../Dropzone/FilePreview'
import {
  BASE_PATH,
  MAX_MILESTONE_ATTACHMENTS,
  MAX_UPLOAD_SIZE_BYTES,
  MAX_UPLOAD_SIZE_MB,
} from '../../../../config'
import { useMilestoneAttachmentMutation } from '../../../hooks/useThesesMutation'

interface MilestoneAttachmentsProps {
  thesisId: string
  attachments: FileData[]
  canManage: boolean
  isStudentView: boolean
}

export const MilestoneAttachments = ({
  thesisId,
  attachments,
  canManage,
  isStudentView,
}: MilestoneAttachmentsProps) => {
  const { t } = useTranslation()
  const mutation = useMilestoneAttachmentMutation(isStudentView)
  const [rejection, setRejection] = useState<'invalid' | 'tooMany' | null>(null)
  const remaining = MAX_MILESTONE_ATTACHMENTS - attachments.length

  const { getInputProps, open } = useDropzone({
    accept: { 'application/pdf': ['.pdf'] },
    maxSize: MAX_UPLOAD_SIZE_BYTES,
    maxFiles: Math.max(remaining, 1),
    multiple: remaining > 1,
    noClick: true,
    noDrag: true,
    noKeyboard: true,
    // Rejected files are reported before the accepted ones, so the error is
    // cleared when the picker opens rather than here
    onDropAccepted: (files) => mutation.mutate({ thesisId, files }),
    onDropRejected: (fileRejections) =>
      setRejection(
        fileRejections.some(({ errors }) =>
          errors.some(({ code }) => code === ErrorCode.TooManyFiles)
        )
          ? 'tooMany'
          : 'invalid'
      ),
  })

  if (!canManage) {
    if (!attachments.length) return null

    return (
      <Stack sx={{ mt: 1, gap: 0.5, alignItems: 'flex-start' }}>
        {attachments.map((attachment) => (
          <Link
            key={attachment.filename}
            href={`${BASE_PATH}/api/${isStudentView ? 'student/' : ''}attachments/${attachment.filename}`}
            sx={{
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
        ))}
      </Stack>
    )
  }

  return (
    <Stack sx={{ mt: 1, gap: 1, alignItems: 'flex-start' }}>
      {attachments.map((attachment) => (
        <FilePreview
          key={attachment.filename}
          file={attachment}
          isStudentView={isStudentView}
          onDelete={() =>
            mutation.mutate({ thesisId, deleteFilename: attachment.filename })
          }
        />
      ))}
      {remaining > 0 && (
        <>
          <input {...getInputProps()} />
          <Button
            size="small"
            variant="outlined"
            startIcon={<FileUploadOutlined />}
            disabled={mutation.isPending}
            onClick={() => {
              setRejection(null)
              open()
            }}
          >
            {t('progressView:uploadFile')}
          </Button>
        </>
      )}
      <Typography sx={{ fontSize: 'small', color: 'text.secondary' }}>
        {t('progressView:milestoneFileCount', {
          count: attachments.length,
          max: MAX_MILESTONE_ATTACHMENTS,
        })}
      </Typography>
      {rejection === 'tooMany' ? (
        <Alert severity="error" sx={{ py: 0, fontSize: 'small' }}>
          {t('progressView:milestoneFileLimitError', {
            count: remaining,
            max: MAX_MILESTONE_ATTACHMENTS,
          })}
        </Alert>
      ) : (
        (rejection === 'invalid' || mutation.isError) && (
          <Alert severity="error" sx={{ py: 0, fontSize: 'small' }}>
            {t('progressView:milestoneFileError', { size: MAX_UPLOAD_SIZE_MB })}
          </Alert>
        )
      )}
    </Stack>
  )
}
