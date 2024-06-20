const { exec } = require('node:child_process')

module.exports = async () => {
  console.log('Tearing down test database')
  await exec('docker stop postgres-test-db && docker rm postgres-test-db')
}
