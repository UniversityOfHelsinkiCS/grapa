import { useNavigate } from 'react-router-dom'
import { Box, Button, Container, Typography } from '@mui/material'

const Error = () => {
  const navigate = useNavigate()

  return (
    <Box
      sx={{
        my: 8,
        minHeight: '100vh',
      }}
    >
      <Container>
        <Typography variant="h2" sx={{ my: 4, fontWeight: 'bold' }}>
          UNEXPECTED ERROR
        </Typography>
        <Typography variant="h6">
          Sorry, but something unexpected went wrong loading your page. We are
          looking into the issue.
        </Typography>
        <Button
          sx={{ mt: 4 }}
          variant="contained"
          onClick={() => navigate('/')}
        >
          Back Home
        </Button>
      </Container>
    </Box>
  )
}

export default Error
