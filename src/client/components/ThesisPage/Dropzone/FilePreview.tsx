import { Chip, Link } from '@mui/material'
import UploadFileIcon from '@mui/icons-material/UploadFile'

import { FileData } from '@backend/types'
import { BASE_PATH } from '../../../../config'

interface FilePreviewProps {
  file: File | FileData
  onDelete: () => void
}

const FilePreview = ({ file, onDelete }: FilePreviewProps) => (
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
    onDelete={onDelete}
  />
)

export default FilePreview
