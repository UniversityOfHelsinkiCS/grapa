import { Box, Link } from '@mui/material'
import { useTranslation } from 'react-i18next'
import styles from '../styles'

import toskaColor from '../assets/toscalogo_color.svg'

const Footer = () => {
  const { t } = useTranslation()
  const { footerStyles } = styles

  return (
    <Box
      component="footer"
      sx={(theme) => ({
        backgroundColor: theme.palette.toskaDark.main,
        color: theme.palette.toskaDark.contrastText,
      })}
    >
      <Box sx={footerStyles.supportBox}>
        <Box sx={footerStyles.imageBox}>
          <Link
            href="https://toska.dev"
            target="_blank"
            rel="noopener"
            underline="hover"
          >
            <img src={toskaColor} alt="Toska" width="70" />
          </Link>
        </Box>
        <Box sx={footerStyles.contactBox}>
          <p>{t('contactInfo')}: </p>
          <Link href="mailto:grp-toska@helsinki.fi">grp-toska@helsinki.fi</Link>
        </Box>
      </Box>
    </Box>
  )
}

export default Footer
