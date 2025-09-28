import {
  Modal,
  Box,
  Typography,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from '@mui/material'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useEditThesisMutation } from '../../hooks/useThesesMutation'
import usePrograms from '../../hooks/usePrograms'

interface ThesisModalProps {
  open: boolean
  onClose: () => void
  thesis: any
}

const formatDate = (dateString: string | undefined) => {
  if (!dateString) return 'N/A'

  const date = new Date(dateString)
  if (isNaN(date.getTime())) return 'Invalid Date'

  return date.toISOString().split('T')[0] // Returns YYYY-MM-DD format
}

const ThesisModal = ({ open, onClose, thesis }: ThesisModalProps) => {
  const editThesisMutation = useEditThesisMutation()
  const { programs } = usePrograms({ includeNotManaged: true })
  const { i18n } = useTranslation()
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false)

  const getProgramName = () => {
    if (!thesis?.programId || !programs) return 'N/A'
    const program = programs.find((p) => p.id === thesis.programId)
    if (!program?.name) return 'N/A'

    const language = i18n.language as keyof typeof program.name
    return program.name[language] || program.name.en || 'N/A'
  }

  const getStudyTrackName = () => {
    if (!thesis?.studyTrackId || !programs) return ''
    const program = programs.find((p) => p.id === thesis.programId)
    if (!program?.studyTracks) return ''

    const studyTrack = program.studyTracks.find(
      (track) => track.id === thesis.studyTrackId
    )
    if (!studyTrack?.name) return ''

    const language = i18n.language as keyof typeof studyTrack.name
    return `(${studyTrack.name[language] || studyTrack.name.en || 'NA'})`
  }

  const handleSetEthesis = () => {
    setConfirmDialogOpen(true)
  }

  const handleConfirmSetEthesis = () => {
    if (thesis) {
      const updatedThesis = {
        ...thesis,
        status: 'ETHESIS' as const,
        ethesisDate: new Date().toISOString(),
      }

      editThesisMutation.mutate(
        { thesisId: thesis.id, data: updatedThesis },
        {
          onSuccess: () => {
            // The query will be refetched automatically due to React Query
            setConfirmDialogOpen(false)
            onClose()
          },
        }
      )
    }
  }

  const handleCancelConfirmation = () => {
    setConfirmDialogOpen(false)
  }

  if (!thesis || thesis.authors.length === 0) {
    return null
  }

  const author = thesis.authors[0]

  return (
    <>
      <Modal open={open} aria-labelledby="thesis-modal-title">
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: { xs: '90%', sm: 600 },
            maxHeight: '80vh',
            overflow: 'auto',
            bgcolor: 'background.paper',
            boxShadow: 24,
            p: 4,
            borderRadius: 2,
          }}
        >
          {thesis && (
            <>
              <Typography id="thesis-modal-title" variant="h5" gutterBottom>
                {thesis.topic}
              </Typography>

              <Typography sx={{ mt: 2, mb: 1 }}>
                {`${author.firstName} ${author.lastName} (${author.studentNumber})`}
              </Typography>

              <Typography sx={{ fontStyle: 'italic', mt: 2, mb: 1 }}>
                {getProgramName()} {getStudyTrackName()}
              </Typography>

              <Typography>
                {thesis.status === 'ETHESIS_SENT' ? 'Submitted' : 'Saved'} to
                Ethesis {formatDate(thesis.ethesisDate)}
              </Typography>

              <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>
                Graders
              </Typography>
              {thesis.graders && thesis.graders.length > 0 ? (
                thesis.graders.map((grader: any, index: number) => (
                  <Typography key={index}>
                    {`${grader.user.firstName} ${grader.user.lastName} (${grader.user.email || 'N/A'})${
                      grader.isPrimaryGrader ? ' - Primary' : ''
                    }`}
                  </Typography>
                ))
              ) : (
                <Typography>N/A</Typography>
              )}

              <Box
                sx={{
                  mt: 3,
                  display: 'flex',
                  justifyContent:
                    thesis.status === 'ETHESIS_SENT'
                      ? 'space-between'
                      : 'flex-end',
                }}
              >
                {thesis.status === 'ETHESIS_SENT' && (
                  <Button
                    variant="contained"
                    color="warning"
                    onClick={handleSetEthesis}
                    disabled={editThesisMutation.isPending}
                  >
                    {editThesisMutation.isPending
                      ? 'Saving...'
                      : 'Save to Ethesis'}
                  </Button>
                )}
                <Button variant="outlined" onClick={onClose}>
                  Close
                </Button>
              </Box>
            </>
          )}
        </Box>
      </Modal>

      <Dialog
        open={confirmDialogOpen}
        onClose={handleCancelConfirmation}
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-description"
      >
        <DialogTitle id="confirm-dialog-title">Confirmation</DialogTitle>
        <DialogContent>
          <DialogContentText id="confirm-dialog-description">
            Are you sure you want to mark that this thesis has been saved
            Ethesis?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelConfirmation} color="inherit">
            Cancel
          </Button>
          <Button
            onClick={handleConfirmSetEthesis}
            color="warning"
            variant="contained"
            disabled={editThesisMutation.isPending}
          >
            {editThesisMutation.isPending ? 'Saving...' : 'Yes'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}

export default ThesisModal
