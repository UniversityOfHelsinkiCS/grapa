// eslint-disable-next-line @typescript-eslint/no-unused-vars
import React, { useState } from 'react'
import {
  Container,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Box,
  IconButton,
  Alert,
} from '@mui/material'
import { Delete as DeleteIcon, Add as AddIcon } from '@mui/icons-material'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import apiClient from '../../util/apiClient'

interface EthesisAdmin {
  id: string
  userId: string
  user: {
    id: string
    firstName: string
    lastName: string
    email: string
    username: string
  }
}

interface User {
  id: string
  firstName: string
  lastName: string
  email: string
  username: string
}

const EthesisAdminPage = () => {
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedAdmin, setSelectedAdmin] = useState<EthesisAdmin | null>(null)
  const [userSearch, setUserSearch] = useState('')
  const [searchResults, setSearchResults] = useState<User[]>([])
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [error, setError] = useState('')

  const queryClient = useQueryClient()

  // Fetch Ethesis admins
  const { data: admins, isLoading } = useQuery<EthesisAdmin[]>({
    queryKey: ['ethesis-admins'],
    queryFn: async () => {
      const { data } = await apiClient.get('/ethesis-admins')
      return data
    },
  })

  // Search users
  const searchUsers = async (searchTerm: string) => {
    if (searchTerm.length < 5) {
      setSearchResults([])
      return
    }

    try {
      const { data } = await apiClient.get('/users', {
        params: { search: searchTerm, limit: 10 },
      })
      setSearchResults(data || [])
    } catch (err) {
      console.error('Error searching users:', err)
      setSearchResults([])
    }
  }

  // Add admin mutation
  const addAdminMutation = useMutation({
    mutationFn: async (userId: string) => {
      const { data } = await apiClient.post('/ethesis-admins', { userId })
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ethesis-admins'] })
      setAddDialogOpen(false)
      setSelectedUser(null)
      setUserSearch('')
      setSearchResults([])
      setError('')
    },
    onError: (error: any) => {
      setError(error.response?.data || 'Error adding admin')
    },
  })

  // Delete admin mutation
  const deleteAdminMutation = useMutation({
    mutationFn: async (adminId: string) => {
      await apiClient.delete(`/ethesis-admins/${adminId}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ethesis-admins'] })
      setDeleteDialogOpen(false)
      setSelectedAdmin(null)
    },
    onError: (error: any) => {
      setError(error.response?.data || 'Error deleting admin')
    },
  })

  const handleAddAdmin = () => {
    if (selectedUser) {
      addAdminMutation.mutate(selectedUser.id)
    }
  }

  const handleDeleteAdmin = () => {
    if (selectedAdmin) {
      deleteAdminMutation.mutate(selectedAdmin.id)
    }
  }

  const handleUserSearchChange = (value: string) => {
    setUserSearch(value)
    searchUsers(value)
  }

  const handleUserSelect = (user: User) => {
    setSelectedUser(user)
    setUserSearch(`${user.firstName} ${user.lastName} (${user.email})`)
    setSearchResults([])
  }

  if (isLoading) {
    return (
      <Container maxWidth="lg" sx={{ py: 3 }}>
        <Typography>Loading...</Typography>
      </Container>
    )
  }

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 3,
        }}
      >
        <Typography variant="h4" component="h1">
          Ethesis Administrators
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setAddDialogOpen(true)}
        >
          Add Admin
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell
                sx={{ fontWeight: 'bold', backgroundColor: 'grey.100' }}
              >
                Name
              </TableCell>
              <TableCell
                sx={{ fontWeight: 'bold', backgroundColor: 'grey.100' }}
              >
                Email
              </TableCell>
              <TableCell
                sx={{ fontWeight: 'bold', backgroundColor: 'grey.100' }}
              >
                Username
              </TableCell>
              <TableCell
                sx={{ fontWeight: 'bold', backgroundColor: 'grey.100' }}
              >
                Actions
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {admins?.map((admin) => (
              <TableRow key={admin.id}>
                <TableCell>
                  {admin.user.firstName} {admin.user.lastName}
                </TableCell>
                <TableCell>{admin.user.email}</TableCell>
                <TableCell>{admin.user.username}</TableCell>
                <TableCell>
                  <IconButton
                    color="error"
                    onClick={() => {
                      setSelectedAdmin(admin)
                      setDeleteDialogOpen(true)
                    }}
                  >
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Add Admin Dialog */}
      <Dialog
        open={addDialogOpen}
        onClose={() => setAddDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Add Ethesis Administrator</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <TextField
              fullWidth
              label="Search Users"
              value={userSearch}
              onChange={(e) => handleUserSearchChange(e.target.value)}
              placeholder="Type at least 5 characters to search..."
            />

            {searchResults.length > 0 && (
              <Paper sx={{ mt: 1, maxHeight: 200, overflow: 'auto' }}>
                {searchResults.map((user) => (
                  <Box
                    key={user.id}
                    sx={{
                      p: 2,
                      cursor: 'pointer',
                      '&:hover': { backgroundColor: 'grey.100' },
                      borderBottom: '1px solid #eee',
                    }}
                    onClick={() => handleUserSelect(user)}
                  >
                    <Typography variant="body1">
                      {user.firstName} {user.lastName}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      {user.email}
                    </Typography>
                  </Box>
                ))}
              </Paper>
            )}

            {selectedUser && (
              <Box
                sx={{
                  mt: 2,
                  p: 2,
                  backgroundColor: 'grey.50',
                  borderRadius: 1,
                }}
              >
                <Typography variant="body1">
                  Selected: {selectedUser.firstName} {selectedUser.lastName}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  {selectedUser.email}
                </Typography>
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleAddAdmin}
            variant="contained"
            disabled={!selectedUser || addAdminMutation.isPending}
          >
            {addAdminMutation.isPending ? 'Adding...' : 'Add Admin'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to remove{' '}
            <strong>
              {selectedAdmin?.user.firstName} {selectedAdmin?.user.lastName}
            </strong>{' '}
            from Ethesis administrators?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleDeleteAdmin}
            color="error"
            variant="contained"
            disabled={deleteAdminMutation.isPending}
          >
            {deleteAdminMutation.isPending ? 'Removing...' : 'Remove'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  )
}

export default EthesisAdminPage
