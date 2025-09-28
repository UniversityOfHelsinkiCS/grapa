import { Modal, Box, Typography, Button } from '@mui/material'
import { useEditThesisMutation } from '../../hooks/useThesesMutation'

interface ThesisModalProps {
  open: boolean
  onClose: () => void
  thesis: any // You can replace this with proper ThesisData type
}

const formatDate = (dateString: string | undefined) => {
  if (!dateString) return 'N/A'

  const date = new Date(dateString)
  if (isNaN(date.getTime())) return 'Invalid Date'

  return date.toISOString().split('T')[0] // Returns YYYY-MM-DD format
}

const ThesisModal = ({ open, onClose, thesis }: ThesisModalProps) => {
  const editThesisMutation = useEditThesisMutation()

  const handleSetEthesis = () => {
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
            onClose()
          },
        }
      )
    }
  }

  return (
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

            <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>
              Author
            </Typography>
            <Typography>
              {thesis.authors && thesis.authors.length > 0
                ? `${thesis.authors[0].firstName} ${thesis.authors[0].lastName} (${thesis.authors[0].studentNumber || 'N/A'})`
                : 'N/A'}
            </Typography>

            <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>
              Study Programme
            </Typography>
            <Typography>{thesis.studyProgram?.name || 'N/A'}</Typography>

            <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>
              Study Track
            </Typography>
            <Typography>{thesis.studyTrack?.name || 'N/A'}</Typography>

            <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>
              Program ID
            </Typography>
            <Typography>{thesis.programId || 'N/A'}</Typography>

            <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>
              Study Track ID
            </Typography>
            <Typography>{thesis.studyTrackId || 'N/A'}</Typography>

            <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>
              Ethesis Date
            </Typography>
            <Typography>{formatDate(thesis.ethesisDate)}</Typography>

            <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>
              Graders
            </Typography>
            <Typography>
              {thesis.graders && thesis.graders.length > 0
                ? thesis.graders
                    .map(
                      (grader: any) =>
                        `${grader.user.firstName} ${grader.user.lastName} (${grader.user.email || 'N/A'})${
                          grader.isPrimaryGrader ? ' - Primary' : ''
                        }`
                    )
                    .join(', ')
                : 'N/A'}
            </Typography>

            <Box
              sx={{ mt: 3, display: 'flex', justifyContent: 'space-between' }}
            >
              <Button
                variant="contained"
                color="success"
                onClick={handleSetEthesis}
                disabled={
                  thesis.status === 'ETHESIS' || editThesisMutation.isPending
                }
              >
                {editThesisMutation.isPending ? 'Setting...' : 'Set as ETHESIS'}
              </Button>
              <Button variant="outlined" onClick={onClose}>
                Close
              </Button>
            </Box>
          </>
        )}
      </Box>
    </Modal>
  )
}

export default ThesisModal
