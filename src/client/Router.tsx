import { Navigate, RouterProvider, createBrowserRouter } from 'react-router-dom'

import App from './App'
import ThesesPage from './components/ThesisPage/ThesesPage'
import RootBoundary from './components/Errors/RootBoundary'
import NotFound from './components/Errors/NotFound'

import NoAccess from './components/NoAccess'
import LoginAsPage from './components/LoginAsPage'
import EntityOverview from './components/Program/EntityOverview'
import SeminarPage from './components/Seminar/SeminarPage'

import { BASE_PATH } from '../config'
import Ethesis from './components/Ethesis'
import useLoggedInUser from './hooks/useLoggedInUser'
import ManageProgramsPage from './components/ManageProgramsPage'
import ManageDepartmentsPage from './components/ManageDepartmentsPage'
import AdminOtherPage from './components/AdminOtherPage'

const IndexRoute = () => {
  const { isLoading, hasStaffAccess } = useLoggedInUser()

  if (isLoading) return null

  if (!hasStaffAccess) {
    return <Navigate to="/my-theses" replace />
  }

  return <Navigate to="/supervised-theses" replace />
}

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
          element: <IndexRoute />,
          errorElement: <RootBoundary />,
        },
        {
          path: '/supervised-theses',
          element: <ThesesPage key="supervised" />,
          errorElement: <RootBoundary />,
        },
        {
          path: '/my-theses',
          element: <ThesesPage key="student" isStudentView />,
          errorElement: <RootBoundary />,
        },

        {
          path: '/programs',
          element: <EntityOverview entityType="program" />,
        },
        {
          path: '/programs/:programId',
          element: <EntityOverview entityType="program" />,
        },
        {
          path: '/study-tracks/:studyTrackId',
          element: <EntityOverview entityType="studyTrack" />,
        },

        {
          path: '/departments',
          element: <EntityOverview entityType="department" />,
        },
        {
          path: '/departments/:departmentId',
          element: <EntityOverview entityType="department" />,
        },
        {
          path: '/ethesis',
          element: <Ethesis />,
        },
        {
          path: '/seminar',
          element: <SeminarPage />,
        },
        {
          path: '/ethesis/admin',
          element: <Navigate to="/ethesis?tab=admins" replace />,
        },
        {
          path: '/manage-programs',
          element: <ManageProgramsPage />,
        },
        {
          path: '/manage-departments',
          element: <ManageDepartmentsPage />,
        },
        {
          path: '/all-theses',
          element: <ThesesPage key="all" noOwnThesesSwitch />,
          errorElement: <RootBoundary />,
        },
        {
          path: '/login-as',
          element: <LoginAsPage />,
        },
        {
          path: '/admin-other',
          element: <AdminOtherPage />,
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
