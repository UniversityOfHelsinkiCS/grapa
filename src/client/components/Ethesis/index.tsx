import { Tab, Tabs, Typography, Box, Stack } from '@mui/material'
import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import EthesisAdminPage from './AdminPage'
import useLoggedInUser from '../../hooks/useLoggedInUser'
import ThesesPage from '../ThesisPage/ThesesPage'

type EthesisTab = 'overview' | 'admins'

const parseEthesisTab = (
  tab: string | null,
  canManageAdmins: boolean
): EthesisTab => {
  if (tab === 'admins' && canManageAdmins) {
    return 'admins'
  }

  return 'overview'
}

export const EthesisOverview = () => {
  return (
    <Box>
      <ThesesPage
        noOwnThesesSwitch
        noAddThesisButton
        hideStudentStartedEthesis
        showEthesisDateColumn
        showGraders
        hideEdit
        hideDelete
        filteringStatuses={['ETHESIS_SENT', 'ETHESIS']}
      />
    </Box>
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
    <Box component="section" sx={{ px: '1rem', py: '2rem', width: '100%' }}>
      <Stack sx={{ px: '1rem', py: '2rem' }} spacing={3}>
        <Typography component="h1" variant="h4">
          Ethesis
        </Typography>

        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
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

        {tab === 'overview' && <EthesisOverview />}
        {tab === 'admins' && canManageAdmins && (
          <EthesisAdminPage disableContainer hideTitle />
        )}
      </Stack>
    </Box>
  )
}

export default Ethesis
