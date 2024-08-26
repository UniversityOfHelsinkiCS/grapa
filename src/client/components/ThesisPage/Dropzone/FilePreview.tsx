import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Chip, Link } from '@mui/material'
import UploadFileIcon from '@mui/icons-material/UploadFile'

import { FileData } from '@backend/types'

import DeleteConfirmation from '../../Common/DeleteConfirmation'

import { BASE_PATH } from '../../../../config'

interface FilePreviewProps {
  file: File | FileData
  onDelete: () => void
}

const FilePreview = ({ file, onDelete }: FilePreviewProps) => {
  const { t } = useTranslation()
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  return (
    <>
      <Chip
        label={
          'filename' in file ? (
            <Link href={`${BASE_PATH}/api/attachments/${file.filename}`}>
              {file.name}
            </Link>
          ) : (
            file.name
          )
        }
        icon={<UploadFileIcon />}
        variant="outlined"
        sx={{ maxWidth: 200 }}
        onDelete={() => setDeleteDialogOpen(true)}
      />
      <DeleteConfirmation
        open={deleteDialogOpen}
        setOpen={setDeleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onDelete={() => {
          setDeleteDialogOpen(false)
          onDelete()
        }}
        title={t('thesisForm:removeAppendixConfirmationTitle')}
      >
        {t('thesisForm:removeAppendixConfirmationContent', { name: file.name })}
      </DeleteConfirmation>
    </>
  )
}

export default FilePreview
