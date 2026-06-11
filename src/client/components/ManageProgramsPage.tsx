import React, { useState, useEffect } from 'react'
import { Navigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  Autocomplete,
  Box,
  Button,
  FormControl,
  TextField,
  Typography,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from '@mui/material'
import {
  ProgramData,
  TranslatedName,
  TranslationLanguage,
} from '@backend/types'
import usePrograms, { useUpdateProgramMutation } from '../hooks/usePrograms'
import useLoggedInUser from '../hooks/useLoggedInUser'

const ManageProgramsPage: React.FC = () => {
  const { t, i18n } = useTranslation()
  const { language } = i18n as { language: TranslationLanguage }
  const { user, isLoading: userLoading } = useLoggedInUser()

  const { programs, isLoading: programsLoading } = usePrograms({
    includeNotManaged: true,
  })

  const updateProgramMutation = useUpdateProgramMutation()

  const [selectedProgram, setSelectedProgram] = useState<ProgramData | null>(
    null
  )
  const [draftName, setDraftName] = useState<TranslatedName>({
    fi: '',
    en: '',
    sv: '',
  })
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false)

  useEffect(() => {
    if (selectedProgram) {
      setDraftName({
        fi: selectedProgram.name.fi || '',
        en: selectedProgram.name.en || '',
        sv: selectedProgram.name.sv || '',
      })
    } else {
      setDraftName({ fi: '', en: '', sv: '' })
    }
  }, [selectedProgram])

  const handleSaveClick = () => {
    setConfirmDialogOpen(true)
  }

  const handleConfirmSave = async () => {
    if (!selectedProgram) return

    await updateProgramMutation.mutateAsync({
      programId: selectedProgram.id,
      options: selectedProgram.options || {},
      name: draftName,
    })

    setSelectedProgram({
      ...selectedProgram,
      name: draftName,
    })

    setConfirmDialogOpen(false)
  }

  if (userLoading || programsLoading) return null
  if (!user?.isAdmin) return <Navigate to="/" />

  const isSaveDisabled =
    updateProgramMutation.isPending ||
    !selectedProgram ||
    (selectedProgram.name.fi === draftName.fi &&
      selectedProgram.name.en === draftName.en &&
      selectedProgram.name.sv === draftName.sv)

  return (
    <Box
      sx={{
        alignSelf: 'flex-start',
        width: '100%',
        bgcolor: 'background.paper',
      }}
    >
      <Box component="section" sx={{ px: '3rem', py: '2rem' }}>
        <Typography component="h1" variant="h4">
          {t('navbar:managePrograms')}
        </Typography>
        <Box
          sx={{
            maxWidth: '600px',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
            mt: '2rem',
            mx: 'auto',
          }}
        >
          <FormControl fullWidth>
            <Autocomplete
              id="manage-programs-search"
              noOptionsText={t('userSearchNoOptions', 'No programs found')}
              disablePortal
              options={programs ?? []}
              getOptionLabel={(p) => p.name[language] || p.name.en || ''}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label={t('navbar:program', 'Program')}
                  required
                />
              )}
              isOptionEqualToValue={(option, value) => option.id === value.id}
              value={selectedProgram}
              onChange={(_, value) => {
                setSelectedProgram(value)
              }}
            />
          </FormControl>

          {selectedProgram && (
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                gap: '1.5rem',
                mt: '1rem',
              }}
            >
              <Typography variant="h6">
                {t('manageProgramsPage:editTranslations', 'Edit translations')}
              </Typography>
              <TextField
                label={t('manageProgramsPage:finnishName', 'Finnish Name (FI)')}
                value={draftName.fi}
                onChange={(e) =>
                  setDraftName((prev) => ({ ...prev, fi: e.target.value }))
                }
                fullWidth
              />
              <TextField
                label={t('manageProgramsPage:englishName', 'English Name (EN)')}
                value={draftName.en}
                onChange={(e) =>
                  setDraftName((prev) => ({ ...prev, en: e.target.value }))
                }
                fullWidth
              />
              <TextField
                label={t('manageProgramsPage:swedishName', 'Swedish Name (SV)')}
                value={draftName.sv}
                onChange={(e) =>
                  setDraftName((prev) => ({ ...prev, sv: e.target.value }))
                }
                fullWidth
              />

              <Button
                type="button"
                variant="contained"
                onClick={handleSaveClick}
                disabled={isSaveDisabled}
                fullWidth
                sx={{ borderRadius: '0.5rem' }}
              >
                {t('submitButton')}
              </Button>
            </Box>
          )}
        </Box>
      </Box>

      <Dialog
        open={confirmDialogOpen}
        onClose={() => setConfirmDialogOpen(false)}
      >
        <DialogTitle>{t('manageProgramsPage:confirmSaveTitle')}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {t('manageProgramsPage:confirmSaveText')}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialogOpen(false)}>
            {t('cancelButton')}
          </Button>
          <Button
            onClick={handleConfirmSave}
            variant="contained"
            color="primary"
            disabled={updateProgramMutation.isPending}
          >
            {t('submitButton')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default ManageProgramsPage
