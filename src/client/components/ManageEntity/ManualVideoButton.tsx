import { useState } from 'react'
import { Box, Button, Tooltip } from '@mui/material'
import PlayCircleOutlinedIcon from '@mui/icons-material/PlayCircleOutlined'
import { useTranslation } from 'react-i18next'
import Popup from '../Common/Popup'
import { ManualVideo } from '../../hooks/useManualVideos'

const ManualVideoButton = ({ video }: { video?: ManualVideo }) => {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)

  if (!video) return null

  const seconds = Math.round((video.durationMs ?? 0) / 1000)
  const length = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`

  return (
    <>
      <Tooltip title={video.title} describeChild>
        <Button
          size="small"
          startIcon={<PlayCircleOutlinedIcon />}
          onClick={() => setOpen(true)}
          data-testid={`manual-video-${video.slug}`}
          sx={{ flexShrink: 0, textTransform: 'none' }}
        >
          {t('programOverviewPage:watchVideo')}
          {video.durationMs ? ` (${length})` : ''}
        </Button>
      </Tooltip>

      <Popup
        open={open}
        onClose={() => setOpen(false)}
        title={video.title}
        cancelText={t('closeButton')}
        maxWidth="md"
        fullWidth
        testId="manual-video"
      >
        {open && (
          <Box
            component="video"
            src={video.url}
            controls
            autoPlay
            sx={{ width: '100%', display: 'block' }}
          />
        )}
      </Popup>
    </>
  )
}

export default ManualVideoButton
