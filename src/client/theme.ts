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

const colors = {
  main: '#005a94',
  hover: '#003152',
}

const themeOptions: ThemeOptions = {
  typography: {
    fontFamily: [
      '"Roboto"',
      '"Open Sans"',
      '"Helvetica"',
      '"Arial"',
      '"sans-serif"',
      '"Apple Color Emoji"',
      '"Segoe UI Emoji"',
      '"Segoe UI Symbol"',
    ].join(','),
    small: {
      fontSize: 'small',
    },
  },

  palette: {
    primary: {
      main: colors.main,
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
      defaultProps: {
        disableElevation: true,
      },
      styleOverrides: {
        root: {
          borderRadius: 0,
          boxShadow: 0,
          elevation: 0,
        },
        contained: {
          '&:hover': {
            backgroundColor: colors.hover,
          },
        },
        outlined: {
          borderWidth: '2px',
          borderColor: colors.main,
          color: colors.main,
          ':hover': {
            borderWidth: '2px',
            boxShadow: 0,
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

    MuiDataGrid: {
      styleOverrides: {
        root: {
          '& .cell.negative': {
            backgroundColor: '#ffc8c8',
          },
          '& .cell.positive': {
            backgroundColor: '#c8ffcd',
          },
        },
        toolbar: {
          padding: '0px',
        },
      },
    },
    MuiList: {
      styleOverrides: {
        root: {
          color: 'black',
        },
      },
    },
    MuiMenu: {
      defaultProps: {
        elevation: 10,
      },
      styleOverrides: {
        paper: {
          boxShadow: 1,
          borderRadius: '1rem',
        },
      },
    },
    MuiPopper: {
      styleOverrides: {},
    },
    MuiTab: {
      styleOverrides: {
        root: {
          fontWeight: 700,
        },
      },
    },
    MuiTypography: {
      styleOverrides: {
        h6: {
          fontWeight: 700,
        },
        h1: {
          fontWeight: 700,
        },
        h4: {
          fontWeight: 700,
        },
        h3: {
          fontWeight: 700,
        },
        h2: {
          fontWeight: 700,
        },
        h5: {
          fontWeight: 700,
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        filled: {
          backgroundColor: colors.main,
          color: 'white',
          ':hover': {
            backgroundColor: colors.hover,
          },
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
