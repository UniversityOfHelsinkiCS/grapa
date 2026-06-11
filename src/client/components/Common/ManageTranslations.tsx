import React, { useState, useEffect } from 'react'
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
import { TranslatedName, TranslationLanguage } from '@backend/types'

export interface TranslationItem {
  id: string
  name: TranslatedName
}

interface ManageTranslationsProps<T extends TranslationItem> {
  pageTitle: string
  autocompleteLabel: string
  noOptionsText: string
  items: T[]
  isPending: boolean
  onSave: (id: string, name: TranslatedName) => Promise<void>
  confirmTitle: string
  confirmText: string
}

const ManageTranslations = <T extends TranslationItem>({
  pageTitle,
  autocompleteLabel,
  noOptionsText,
  items,
  isPending,
  onSave,
  confirmTitle,
  confirmText,
}: ManageTranslationsProps<T>) => {
  const { t, i18n } = useTranslation()
  const { language } = i18n as { language: TranslationLanguage }

  const [selectedItem, setSelectedItem] = useState<T | null>(null)
  const [draftName, setDraftName] = useState<TranslatedName>({
    fi: '',
    en: '',
    sv: '',
  })
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false)

  useEffect(() => {
    if (selectedItem) {
      setDraftName({
        fi: selectedItem.name.fi || '',
        en: selectedItem.name.en || '',
        sv: selectedItem.name.sv || '',
      })
    } else {
      setDraftName({ fi: '', en: '', sv: '' })
    }
  }, [selectedItem])

  const handleSaveClick = () => {
    setConfirmDialogOpen(true)
  }

  const handleConfirmSave = async () => {
    if (!selectedItem) return

    await onSave(selectedItem.id, draftName)

    setSelectedItem({
      ...selectedItem,
      name: draftName,
    })

    setConfirmDialogOpen(false)
  }

  const isSaveDisabled =
    isPending ||
    !selectedItem ||
    (selectedItem.name.fi === draftName.fi &&
      selectedItem.name.en === draftName.en &&
      selectedItem.name.sv === draftName.sv)

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
          {pageTitle}
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
              id="manage-translations-search"
              noOptionsText={noOptionsText}
              disablePortal
              options={items}
              getOptionLabel={(p) => p.name[language] || p.name.en || ''}
              renderInput={(params) => (
                <TextField {...params} label={autocompleteLabel} required />
              )}
              isOptionEqualToValue={(option, value) => option.id === value.id}
              value={selectedItem}
              onChange={(_, value) => {
                setSelectedItem(value)
              }}
            />
          </FormControl>

          {selectedItem && (
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
                {t('submitButton', 'Save')}
              </Button>
            </Box>
          )}
        </Box>
      </Box>

      <Dialog
        open={confirmDialogOpen}
        onClose={() => setConfirmDialogOpen(false)}
      >
        <DialogTitle>{confirmTitle}</DialogTitle>
        <DialogContent>
          <DialogContentText>{confirmText}</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialogOpen(false)}>
            {t('cancelButton', 'Cancel')}
          </Button>
          <Button
            onClick={handleConfirmSave}
            variant="contained"
            color="primary"
            disabled={isPending}
          >
            {isPending ? t('saving') : t('submitButton')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default ManageTranslations
