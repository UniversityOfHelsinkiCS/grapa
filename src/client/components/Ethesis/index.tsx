import {
  Tab,
  Tabs,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Chip,
  RadioGroup,
  FormControlLabel,
  Radio,
  Box,
  Container,
} from '@mui/material'
import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { usePaginatedTheses } from '../../hooks/useTheses'
import ThesisModal from './Modal'
import EthesisAdminPage from './AdminPage'
import { StatusLocale } from '../../types'
import { t } from 'i18next'
import { useTranslation } from 'react-i18next'
import { TranslatedName } from '@backend/types'
import useLoggedInUser from '../../hooks/useLoggedInUser'

const formatDate = (dateString: string | undefined) => {
  if (!dateString) return 'N/A'

  const date = new Date(dateString)
  if (isNaN(date.getTime())) return 'Invalid Date'

  return date.toISOString().split('T')[0] // Returns YYYY-MM-DD format
}

type EthesisTab = 'overview' | 'admins'

interface EthesisOverviewProps {
  disableContainer?: boolean
  hideTitle?: boolean
}

const parseEthesisTab = (
  tab: string | null,
  canManageAdmins: boolean
): EthesisTab => {
  if (tab === 'admins' && canManageAdmins) {
    return 'admins'
  }

  return 'overview'
}

export const EthesisOverview = ({
  disableContainer = false,
  hideTitle = false,
}: EthesisOverviewProps) => {
  const { i18n } = useTranslation()
  const [statusFilter, setStatusFilter] = useState<'NEW' | 'ALL'>('NEW')
  const [selectedThesis, setSelectedThesis] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)
  const { language } = i18n
  // Determine which statuses to include based on the filter
  const status =
    statusFilter === 'NEW' ? ['ETHESIS_SENT'] : ['ETHESIS', 'ETHESIS_SENT']

  const order = {
    sortBy: 'ethesisDate',
    sortOrder: 'desc' as const,
  }

  const paginationModel = {
    page: 0,
    pageSize: 20,
  }

  const { theses: unsortedTheses, isLoading: isThesesLoading } =
    usePaginatedTheses({
      order,
      status,
      offset: paginationModel.page * paginationModel.pageSize,
      limit: paginationModel.pageSize,
      onlySupervised: false,
    })

  const theses = unsortedTheses
    ? [...unsortedTheses].sort((a, b) => {
        if (a.status !== b.status) {
          if (a.status === 'ETHESIS_SENT' && b.status === 'ETHESIS') return -1
          if (a.status === 'ETHESIS' && b.status === 'ETHESIS_SENT') return 1
        }

        const dateA = a.ethesisDate ? new Date(a.ethesisDate).getTime() : 0
        const dateB = b.ethesisDate ? new Date(b.ethesisDate).getTime() : 0
        return dateB - dateA
      })
    : []

  const handleRowClick = (thesis: any) => {
    setSelectedThesis(thesis)
    setModalOpen(true)
  }

  const handleCloseModal = () => {
    setModalOpen(false)
    setSelectedThesis(null)
  }

  if (isThesesLoading) {
    return null
  }

  const content = (
    <>
      {!hideTitle && (
        <Typography variant="h5" gutterBottom>
          {status.length === 1 ? 'New ' : 'All '} theses submitted to Etheses
        </Typography>
      )}

      <Box
        sx={{
          mb: 3,
          display: 'flex',
          alignItems: 'center',
          gap: 2,
        }}
      >
        <Typography variant="body1">Show:</Typography>
        <RadioGroup
          row
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as 'NEW' | 'ALL')}
        >
          <FormControlLabel value="NEW" control={<Radio />} label="new" />
          <FormControlLabel value="ALL" control={<Radio />} label="all" />
        </RadioGroup>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell
                sx={{ fontWeight: 'bold', backgroundColor: 'grey.100' }}
              >
                Topic
              </TableCell>
              <TableCell
                sx={{ fontWeight: 'bold', backgroundColor: 'grey.100' }}
              >
                Author
              </TableCell>
              <TableCell
                sx={{ fontWeight: 'bold', backgroundColor: 'grey.100' }}
              >
                Graders
              </TableCell>
              <TableCell
                sx={{ fontWeight: 'bold', backgroundColor: 'grey.100' }}
              >
                Status
              </TableCell>
              <TableCell
                sx={{ fontWeight: 'bold', backgroundColor: 'grey.100' }}
              >
                Date
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {theses.map((thesis) => (
              <TableRow
                key={thesis.id}
                onClick={() => handleRowClick(thesis)}
                sx={{
                  cursor: 'pointer',
                  '&:hover': { backgroundColor: 'grey.50' },
                }}
              >
                <TableCell>{thesis.topic}</TableCell>
                <TableCell>
                  {thesis.authors
                    .map((author) => `${author.firstName} ${author.lastName}`)
                    .join(', ')}
                </TableCell>
                <TableCell>
                  {thesis.graders
                    .map(
                      (grader) =>
                        `${grader.user.firstName} ${grader.user.lastName}${
                          grader.title
                            ? `, ${grader.title[language as keyof TranslatedName]}`
                            : ''
                        }`
                    )
                    .join('; ')}
                </TableCell>
                <TableCell>
                  <Chip
                    label={t(StatusLocale[thesis.status])}
                    color={thesis.status === 'ETHESIS' ? 'success' : 'warning'}
                    size="small"
                  />
                </TableCell>
                <TableCell>{formatDate(thesis.ethesisDate)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <ThesisModal
        open={modalOpen}
        onClose={handleCloseModal}
        thesis={selectedThesis}
      />
    </>
  )

  if (disableContainer) {
    return content
  }

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      {content}
    </Container>
  )
}

const Ethesis = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const { user } = useLoggedInUser()
  const canManageAdmins = Boolean(user?.isAdmin)
  const [tab, setTab] = useState<EthesisTab>(
    parseEthesisTab(searchParams.get('tab'), canManageAdmins)
  )

  useEffect(() => {
    const nextTab = parseEthesisTab(searchParams.get('tab'), canManageAdmins)
    setTab(nextTab)

    if (searchParams.get('tab') === 'admins' && nextTab !== 'admins') {
      const nextSearchParams = new URLSearchParams(searchParams)
      nextSearchParams.delete('tab')
      setSearchParams(nextSearchParams, { replace: true })
    }
  }, [canManageAdmins, searchParams, setSearchParams])

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      <Typography component="h1" variant="h4" gutterBottom>
        Ethesis
      </Typography>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs
          value={tab}
          onChange={(_, nextTab: EthesisTab) => {
            const nextSearchParams = new URLSearchParams(searchParams)

            if (nextTab === 'overview') {
              nextSearchParams.delete('tab')
            } else {
              nextSearchParams.set('tab', nextTab)
            }

            setSearchParams(nextSearchParams)
          }}
          variant="scrollable"
          scrollButtons
          allowScrollButtonsMobile
        >
          <Tab label="Overview" value="overview" />
          {canManageAdmins && <Tab label="Admins" value="admins" />}
        </Tabs>
      </Box>

      {tab === 'overview' && <EthesisOverview disableContainer hideTitle />}
      {tab === 'admins' && canManageAdmins && (
        <EthesisAdminPage disableContainer hideTitle />
      )}
    </Container>
  )
}

export default Ethesis
