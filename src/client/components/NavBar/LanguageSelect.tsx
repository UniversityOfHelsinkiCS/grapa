import { useTranslation } from 'react-i18next'
import CheckIcon from '@mui/icons-material/Check'
import { ListSubheader, MenuItem } from '@mui/material'

import { LANGUAGES } from './util'
import { SELECTED_LANGUAGE_STORAGE_KEY } from '../../../config'

const LanguageSelect = () => {
  const { t, i18n } = useTranslation()
  const { language } = i18n

  const handleLanguageChange = (newLanguage: string) => {
    i18n.changeLanguage(newLanguage)
    localStorage.setItem(SELECTED_LANGUAGE_STORAGE_KEY, newLanguage)
  }

  return (
    <>
      <ListSubheader disableSticky>
        {t('navbar:languageSubHeader')}
      </ListSubheader>
      {LANGUAGES.map((lang) => (
        <MenuItem
          key={lang.code}
          onClick={() => handleLanguageChange(lang.code)}
          aria-current={lang.code === language}
          data-cy={`select-language-${lang.name.toLowerCase()}`}
          sx={{ justifyContent: 'space-between', px: 4 }}
        >
          {lang.name} {lang.code === language && <CheckIcon color="primary" />}
        </MenuItem>
      ))}
    </>
  )
}

export default LanguageSelect
