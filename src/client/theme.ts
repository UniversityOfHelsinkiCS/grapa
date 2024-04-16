import '@fontsource/roboto/300.css'
import '@fontsource/roboto/400.css'
import '@fontsource/roboto/500.css'
import '@fontsource/roboto/700.css'

import { useMemo } from 'react'
import {
  createTheme,
  responsiveFontSizes,
  ThemeOptions,
} from '@mui/material/styles'

/**
 * Module augmentation to extend default theme with new colours: https://mui.com/material-ui/customization/palette/#customization
 */
declare module '@mui/material/styles' {
  interface Palette {
    toskaDark: Palette['primary']
    toskaPrimary: Palette['primary']
  }

  interface PaletteOptions {
    toskaDark: PaletteOptions['primary']
    toskaPrimary: PaletteOptions['primary']
  }
}

const themeOptions: ThemeOptions = {
  typography: {
    fontFamily: [
      '"Open Sans"',
      '"Helvetica"',
      '"Arial"',
      '"sans-serif"',
      '"Apple Color Emoji"',
      '"Segoe UI Emoji"',
      '"Segoe UI Symbol"',
    ].join(','),
  },

  palette: {
    primary: {
      main: '#107eab',
    },
    toskaDark: {
      main: '#1a202c',
      contrastText: '#fff',
    },
    toskaPrimary: {
      main: '#e99939',
      contrastText: '#1a202c',
    },
  },

  shape: {
    borderRadius: 0,
  },

  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 0,
        },
        outlined: {
          borderWidth: '2px',
          ':hover': {
            borderWidth: '2px',
          },
        },
      },
    },

    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 5,
        },
      },
    },
  },
}

export const useTheme = () => {
  const theme = useMemo(
    () => responsiveFontSizes(createTheme(themeOptions)),
    []
  )

  return theme
}

declare module '@mui/material/styles' {
  interface BreakpointOverrides {
    xs: true
    sm: true
    md: true
    lg: true
    xl: true
  }
}

export const BreakPointTheme = createTheme({
  breakpoints: {
    values: {
      xs: 640,
      sm: 768,
      md: 1024,
      lg: 1280,
      xl: 1536,
    },
  },
})
