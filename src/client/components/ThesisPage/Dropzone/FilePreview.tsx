import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from '@mui/material'
import UploadFileIcon from '@mui/icons-material/UploadFile'

import { FileData } from '@backend/validators/thesisResponse'

import Popup from '../../Common/Popup'
import RemovableChip from '../../Common/RemovableChip'

import { BASE_PATH } from '../../../../config'

interface FilePreviewProps {
  file: File | FileData
  onDelete: () => void
  removeButtonId?: string
}

const FilePreview = ({ file, onDelete, removeButtonId }: FilePreviewProps) => {
  const { t } = useTranslation()
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  return (
    <>
      <RemovableChip
        icon={<UploadFileIcon />}
        variant="outlined"
        sx={{ maxWidth: 200 }}
        label={
          'filename' in file ? (
            <Link href={`${BASE_PATH}/api/attachments/${file.filename}`}>
              {file.name}
            </Link>
          ) : (
            file.name
          )
        }
        removeLabel={`${t('removeButton')} ${file.name}`}
        removeButtonId={removeButtonId}
        removeButtonTestId="remove-appendix-button"
        onRemove={() => setDeleteDialogOpen(true)}
      />
      <Popup
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onSubmit={() => {
          setDeleteDialogOpen(false)
          onDelete()
        }}
        title={t('thesisForm:removeAppendixConfirmationTitle')}
        submitText={t('common:deleteButton')}
        submitColor="error"
        cancelText={t('common:cancelButton')}
      >
        {t('thesisForm:removeAppendixConfirmationContent', { name: file.name })}
      </Popup>
    </>
  )
}

export default FilePreview
