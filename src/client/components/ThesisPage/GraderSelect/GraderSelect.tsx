import React from 'react'
import { Stack, Typography } from '@mui/material'
import { AuthorData } from '@backend/types'
import { useTranslation } from 'react-i18next'
import SingleGraderSelect from './SingleGraderSelect'

const GraderSelect: React.FC<{
  graderSelections: AuthorData[]
  setGraderSelections: (newAuthors: AuthorData[]) => void
}> = ({ graderSelections, setGraderSelections }) => {
  const { t } = useTranslation()

  const handleSupervisorChange = (index: number, grader: AuthorData) => {
    const updatedSelections = [...graderSelections]
    updatedSelections[index] = grader
    setGraderSelections(updatedSelections)
  }

  return (
    <Stack
      spacing={3}
      sx={{
        borderStyle: 'none',
        borderWidth: '1px',
        borderTop: '1px solid',
      }}
      component="fieldset"
    >
      <Typography component="legend" sx={{ px: '1rem' }}>
        {t('thesisForm:graders')}
      </Typography>

      {graderSelections.map((selection, index) => (
        <SingleGraderSelect
          key={selection?.id ?? index}
          index={index + 1}
          required={index === 0}
          selection={selection}
          handleGraderChange={(grader) => handleSupervisorChange(index, grader)}
        />
      ))}
    </Stack>
  )
}

export default GraderSelect
