import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Autocomplete,
  Box,
  Button,
  FormControl,
  FormControlLabel,
  Switch,
  TextField,
  Typography,
  DialogContentText,
} from '@mui/material'
import Popup from '../Common/Popup'
import { TranslatedName, TranslationLanguage } from '@backend/types'

export interface ManageableItem {
  id: string
  name: TranslatedName
  enabled?: boolean
}

interface ManageEntityAdminProps<T extends ManageableItem> {
  showEditTranslations?: boolean
  pageTitle: string
  autocompleteLabel: string
  noOptionsText: string
  items: T[]
  isPending: boolean
  onSave: (id: string, name: TranslatedName, enabled?: boolean) => Promise<void>
  confirmTitle: string
  confirmText: string
}

const ManageEntityAdmin = <T extends ManageableItem>({
  showEditTranslations = true,
  pageTitle,
  autocompleteLabel,
  noOptionsText,
  items,
  isPending,
  onSave,
  confirmTitle,
  confirmText,
}: ManageEntityAdminProps<T>) => {
  const { t, i18n } = useTranslation()
  const { language } = i18n as { language: TranslationLanguage }

  const [selectedItem, setSelectedItem] = useState<T | null>(null)
  const [draftName, setDraftName] = useState<TranslatedName>({
    fi: '',
    sv: '',
    en: '',
  })
  const [draftEnabled, setDraftEnabled] = useState<boolean>(true)
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false)

  useEffect(() => {
    if (selectedItem) {
      setDraftName({
        fi: selectedItem.name.fi || '',
        sv: selectedItem.name.sv || '',
        en: selectedItem.name.en || '',
      })
      setDraftEnabled(selectedItem.enabled ?? true)
    } else {
      setDraftName({ fi: '', sv: '', en: '' })
      setDraftEnabled(true)
    }
  }, [selectedItem])

  const handleSaveClick = () => {
    setConfirmDialogOpen(true)
  }

  const handleConfirmSave = async () => {
    if (!selectedItem) return

    await onSave(selectedItem.id, draftName, draftEnabled)

    setSelectedItem({
      ...selectedItem,
      name: draftName,
      enabled: draftEnabled,
    })

    setConfirmDialogOpen(false)
  }

  const isSaveDisabled =
    isPending ||
    !selectedItem ||
    (selectedItem.name.fi === draftName.fi &&
      selectedItem.name.en === draftName.en &&
      selectedItem.name.sv === draftName.sv &&
      (selectedItem.enabled ?? true) === draftEnabled)

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
                {t('common:otherSettings', 'Other settings')}
              </Typography>
              <FormControlLabel
                control={
                  <Switch
                    checked={draftEnabled}
                    onChange={(e) => setDraftEnabled(e.target.checked)}
                  />
                }
                label={t('common:enabled', 'Enabled')}
              />

              {showEditTranslations && (
                <>
                  <Typography variant="h6" sx={{ mt: 2 }}>
                    {t(
                      'manageProgramsPage:editTranslations',
                      'Edit translations'
                    )}
                  </Typography>
                  <TextField
                    label={t(
                      'manageProgramsPage:finnishName',
                      'Finnish Name (FI)'
                    )}
                    value={draftName.fi}
                    onChange={(e) =>
                      setDraftName((prev) => ({ ...prev, fi: e.target.value }))
                    }
                    fullWidth
                  />
                  <TextField
                    label={t(
                      'manageProgramsPage:englishName',
                      'English Name (EN)'
                    )}
                    value={draftName.en}
                    onChange={(e) =>
                      setDraftName((prev) => ({ ...prev, en: e.target.value }))
                    }
                    fullWidth
                  />
                  <TextField
                    label={t(
                      'manageProgramsPage:swedishName',
                      'Swedish Name (SV)'
                    )}
                    value={draftName.sv}
                    onChange={(e) =>
                      setDraftName((prev) => ({ ...prev, sv: e.target.value }))
                    }
                    fullWidth
                  />
                </>
              )}
              <Button
                type="button"
                variant="contained"
                onClick={handleSaveClick}
                disabled={isSaveDisabled}
                fullWidth
                sx={{ borderRadius: '0.5rem' }}
              >
                {t('common:saveButton', 'Save')}
              </Button>
            </Box>
          )}
        </Box>
      </Box>

      <Popup
        open={confirmDialogOpen}
        onClose={() => setConfirmDialogOpen(false)}
        title={confirmTitle}
        onSubmit={handleConfirmSave}
        submitText={isPending ? t('common:saving') : t('common:saveButton')}
        submitDisabled={isPending}
        cancelText={t('cancelButton', 'Cancel')}
      >
        <DialogContentText>{confirmText}</DialogContentText>
      </Popup>
    </Box>
  )
}

export default ManageEntityAdmin
