const util = require('util')
const exec = util.promisify(require('child_process').exec)

async function waitForDatabase() {
  let maxAttempts = 20
  while (maxAttempts > 0) {
    try {
      const { stdout } = await exec(
        'docker exec postgres-test-db pg_isready -U postgres'
      )
      if (stdout.includes('accepting connections')) {
        console.log('Database is ready for connections.')
        break
      }
    } catch (error) {
      if (maxAttempts <= 1) {
        throw new Error('Database did not become ready in time: ' + error)
      }
      console.log('Waiting for database to become ready...')
    }
    maxAttempts--
    await new Promise((resolve) => setTimeout(resolve, 1000))
  }
}

module.exports = async () => {
  try {
    console.log('Removing the old container if it exists')
    await exec('docker rm -f postgres-test-db')
    console.log('Setting up test database')
    await exec(
      'docker run --name postgres-test-db -e PGDATA=/test-data -e POSTGRES_PASSWORD=postgres -p 5433:5432 -d postgres:15.6'
    )
    await waitForDatabase()
    await exec(
      'npx sequelize-cli db:migrate --url "postgres://postgres:postgres@localhost:5433/postgres"'
    )
    console.log('Test database setup complete')
  } catch (error) {
    console.error('Error setting up the database: ', error)
  }
}
