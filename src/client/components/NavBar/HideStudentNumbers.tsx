import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ListItemText, ListSubheader, MenuItem, Switch } from '@mui/material'

import queryClient from '../../util/queryClient'
import { HIDE_STUDENT_NUMBERS_LOCAL_STORAGE_KEY } from '../../../config'

const HideStudentNumbers = () => {
  const { t } = useTranslation()
  const [hidden, setHidden] = useState(
    () =>
      localStorage.getItem(HIDE_STUDENT_NUMBERS_LOCAL_STORAGE_KEY) === 'true'
  )

  const handleToggle = () => {
    const newHidden = !hidden
    if (newHidden) {
      localStorage.setItem(HIDE_STUDENT_NUMBERS_LOCAL_STORAGE_KEY, 'true')
    } else {
      localStorage.removeItem(HIDE_STUDENT_NUMBERS_LOCAL_STORAGE_KEY)
    }
    setHidden(newHidden)

    // Student numbers are stripped by the backend, so refetch everything
    void queryClient.invalidateQueries()
  }

  return (
    <>
      <ListSubheader disableSticky>
        {t('navbar:privacySubHeader')}
      </ListSubheader>
      <MenuItem
        onClick={handleToggle}
        role="menuitemcheckbox"
        aria-checked={hidden}
        sx={{ px: 4 }}
      >
        <ListItemText primary={t('navbar:hideStudentNumbers')} />
        <Switch
          checked={hidden}
          edge="end"
          slotProps={{
            input: { tabIndex: -1, 'aria-hidden': true, readOnly: true },
          }}
        />
      </MenuItem>
    </>
  )
}

export default HideStudentNumbers
