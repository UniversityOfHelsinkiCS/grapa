import { Navigate, RouterProvider, createBrowserRouter } from 'react-router-dom'

import App from './App'
import ThesesPage from './components/ThesisPage/ThesesPage'
import RootBoundary from './components/Errors/RootBoundary'
import NotFound from './components/Errors/NotFound'

import NoAccess from './components/NoAccess'
import LoginAs from './components/LoginAs'
import Admin from './components/Admin/Admin'
import ProgramOverview from './components/Program/ProgramOverview'
import DepartmentOverview from './components/Department/DepartmentOverview'

import { BASE_PATH } from '../config'
import Ethesis from './components/Ethesis'
import EthesisAdminPage from './components/Ethesis/AdminPage'

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
          element: <Navigate to="/program-overview" replace />,
        },
        {
          path: '/program-overview',
          element: <ProgramOverview />,
        },
        {
          path: '/department-admins',
          element: <Navigate to="/department-overview?tab=rights" replace />,
        },
        {
          path: '/department-statistics',
          element: (
            <Navigate to="/department-overview?tab=statistics" replace />
          ),
        },
        {
          path: '/department-overview',
          element: <DepartmentOverview />,
        },
        {
          path: '/ethesis',
          element: <Ethesis />,
        },
        {
          path: '/ethesis/admin',
          element: <EthesisAdminPage />,
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
