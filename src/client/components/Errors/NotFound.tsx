import { useNavigate } from 'react-router-dom'
import { Box, Button, Container, Typography } from '@mui/material'

const NotFound = () => {
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
          NOT FOUND (404)
        </Typography>
        <Typography variant="h6">
          Sorry, but the page cannot be found. The page may have been moved or
          deleted.
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

export default NotFound
