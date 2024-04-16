import { RouterProvider, createBrowserRouter } from 'react-router-dom'

import App from './App'
import WelcomePage from './components/WelcomePage'
import RootBoundary from './components/Errors/RootBoundary'
import NotFound from './components/Errors/NotFound'

import { PUBLIC_URL } from '../config'

const router = createBrowserRouter(
  [
    {
      path: '/',
      element: <App />,
      errorElement: <RootBoundary />,
      children: [
        {
          index: true,
          element: <WelcomePage />,
          errorElement: <RootBoundary />,
        },
        {
          path: '*',
          element: <NotFound />,
        },
      ],
    },
  ],
  {
    basename: PUBLIC_URL,
  }
)

const Router = () => <RouterProvider router={router} />

export default Router
