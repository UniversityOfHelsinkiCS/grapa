import { useNavigate } from 'react-router-dom'
import { Box, Button, Container, Typography } from '@mui/material'

const Unauthorized = () => {
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
          UNAUTHORIZED (401)
        </Typography>
        <Typography variant="h6">
          Sorry, but you do not have the needed access to this page.
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

export default Unauthorized
