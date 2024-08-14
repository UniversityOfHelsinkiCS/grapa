import { RouterProvider, createBrowserRouter } from 'react-router-dom'

import App from './App'
import ThesesPage from './components/ThesisPage/ThesesPage'
import RootBoundary from './components/Errors/RootBoundary'
import NotFound from './components/Errors/NotFound'

import { BASE_PATH } from '../config'
import ProgramManagement from './components/ProgramManagement/ProgramManagement'
import NoAccess from './components/NoAccess'
import LoginAs from './components/LoginAs'
import Admin from './components/Admin/Admin'

const router = createBrowserRouter(
  [
    {
      path: '/noaccess',
      element: <NoAccess />,
    },
    {
      path: '/',
      element: <App />,
      errorElement: <RootBoundary />,
      children: [
        {
          index: true,
          element: <ThesesPage />,
          errorElement: <RootBoundary />,
        },
        {
          path: '/program-managements',
          element: <ProgramManagement />,
        },
        {
          path: '/admin',
          element: <Admin />,
          errorElement: <RootBoundary />,
          children: [
            {
              index: true,
              element: <LoginAs />,
            },
          ],
        },
        {
          path: '*',
          element: <NotFound />,
        },
      ],
    },
  ],
  {
    basename: BASE_PATH,
  }
)

const Router = () => <RouterProvider router={router} />

export default Router
