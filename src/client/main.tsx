import React from 'react'
import ReactDOM from 'react-dom/client'
import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import CssBaseline from '@mui/material/CssBaseline'

import Router from './Router'

import queryClient from './util/queryClient'
import initializeSentry from './util/sentry'
import initializeI18n from './util/il18n'

initializeSentry()
initializeI18n()

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement)
root.render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <CssBaseline>
        <Router />
      </CssBaseline>
      <ReactQueryDevtools />
    </QueryClientProvider>
  </React.StrictMode>
)
