import useLoggedInUser from '../../hooks/useLoggedInUser'
import NoAccess from '../NoAccess'
import ThesesPage from '../ThesisPage/ThesesPage'

const SeminarPage = () => {
  const { user, isLoading } = useLoggedInUser()

  if (isLoading) return null

  if (!user?.hasSeminarSupervisions) {
    return <NoAccess />
  }

  return (
    <ThesesPage noOwnThesesSwitch noAddThesisButton onlySeminarSupervised />
  )
}

export default SeminarPage
