import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { TextField } from '@mui/material'

import Popup from '../Common/Popup'

interface EditTopicModalProps {
  open: boolean
  onClose: () => void
  onSubmit: (newTopic: string) => Promise<void>
  initialTopic: string
}

const EditTopicModal = ({
  open,
  onClose,
  onSubmit,
  initialTopic,
}: EditTopicModalProps) => {
  const { t } = useTranslation()
  const [topic, setTopic] = useState(initialTopic)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async () => {
    if (!topic.trim()) {
      setError(t('thesisForm:topicMissingError', 'Topic cannot be empty'))
      return
    }

    try {
      setIsSubmitting(true)
      setError(null)
      await onSubmit(topic.trim())
      onClose()
    } catch {
      setError(t('thesisForm:serverError', 'Server error'))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Popup
      open={open}
      title={t('thesisForm:editTopicTitle', 'Edit topic')}
      onClose={onClose}
      onSubmit={handleSubmit}
      submitText={t('common:submitButton')}
      cancelText={t('common:cancelButton')}
      submitButtonProps={{ disabled: isSubmitting || !topic.trim() } as any}
      maxWidth="sm"
      fullWidth
    >
      <TextField
        autoFocus
        fullWidth
        margin="dense"
        id="topic"
        label={t('common:topicHeader')}
        value={topic}
        onChange={(e) => {
          setTopic(e.target.value)
          setError(null)
        }}
        error={Boolean(error)}
        helperText={error}
        variant="outlined"
      />
    </Popup>
  )
}

export default EditTopicModal
