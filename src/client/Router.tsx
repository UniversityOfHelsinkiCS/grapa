import { RouterProvider, createBrowserRouter } from 'react-router-dom'

import App from './App'
import ThesesPage from './components/ThesisPage/ThesesPage'
import RootBoundary from './components/Errors/RootBoundary'
import NotFound from './components/Errors/NotFound'

import NoAccess from './components/NoAccess'
import LoginAs from './components/LoginAs'
import Admin from './components/Admin/Admin'
import ProgramOverview from './components/ProgramOverview/ProgramOverview'
import ProgramManagement from './components/ProgramManagement/ProgramManagement'
import DepartmentAdmin from './components/DepartmentAdmin/DepartmentAdmin'
import DepartmentStatistics from './components/DepartmentStatistics/DepartmentStatistics'

import { BASE_PATH } from '../config'

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
          path: '/program-overview',
          element: <ProgramOverview />,
        },
        {
          path: '/department-admins',
          element: <DepartmentAdmin />,
        },
        {
          path: '/department-statistics',
          element: <DepartmentStatistics />,
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
