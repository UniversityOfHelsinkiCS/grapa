import philosopher from '../assets/philosopher.jpeg'

const NoAccess: React.FC = () => (
  <div
    style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
    }}
  >
    <h1>No access</h1>
    <p>You do not have access to this page.</p>
    <img src={philosopher} alt="mluukkai-philosopher" />
  </div>
)

export default NoAccess
