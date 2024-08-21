import { useState } from 'react'
import {
  GridEventListener,
  GridFooter,
  useGridApiEventHandler,
  useGridApiContext,
} from '@mui/x-data-grid'

import { ThesisData as Thesis } from '@backend/types'
import { Box, Typography } from '@mui/material'

const ViewThesisFooter = () => {
  const apiRef = useGridApiContext()
  const [thesis, setThesis] = useState<Thesis | null>(null)

  const handleRowClick: GridEventListener<'rowClick'> = (params) => {
    setThesis(params.row as Thesis)
  }

  useGridApiEventHandler(apiRef, 'rowClick', handleRowClick)

  return (
    <>
      <GridFooter />
      {thesis && (
        <Box sx={{ m: 2 }}>
          <Typography
            component="h2"
            sx={{
              textTransform: 'uppercase',
              fontFamily: 'Roboto',
              mb: 2,
            }}
          >
            <Typography
              component="span"
              sx={{
                fontSize: '12pt',
                fontWeight: 600,
                position: 'relative',
                '&::after': {
                  content: '""',
                  position: 'absolute',
                  bottom: '4px',
                  left: 0,
                  height: '6px',
                  backgroundColor: '#fcd34d',
                  zIndex: -1,
                  width: '100%',
                },
              }}
            >
              Thesis Preview
            </Typography>
          </Typography>
          <Typography
            component="h3"
            sx={{
              fontSize: '1.5rem',
              fontWeight: 700,
              textTransform: 'uppercase',
            }}
          >
            {thesis.topic}
          </Typography>
        </Box>
      )}
    </>
  )
}

export default ViewThesisFooter
