import { Sequelize } from 'sequelize'
import * as dotenv from 'dotenv'

dotenv.config({
    path: '../.env'
})

const DATABASE_URL = process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5433/postgres'
const DB_CONNECTION_RETRY_LIMIT = 10

export const sequelize = new Sequelize(DATABASE_URL, { logging: false })

const testConnection = async () => {
  await sequelize.authenticate()
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

export const connectToDatabase = async (attempt = 0) => {
  try {
    await testConnection()
  } catch (err) {
    if (attempt === DB_CONNECTION_RETRY_LIMIT) {
      console.error(`Connection to database failed after ${attempt} attempts`, {
        error: err.stack,
      })

      return process.exit(1)
    }
    console.info(
      `Connection to database failed! Attempt ${attempt} of ${DB_CONNECTION_RETRY_LIMIT}`
    )
    console.error('Database error: ', err)
    await sleep(5000)

    return connectToDatabase(attempt + 1)
  }

  return null
}


await connectToDatabase()


if (process.argv.length == 2){    
    const output = await sequelize.query("SELECT * FROM application_configuration")
    
    console.log("Current application configuration\n----------------------------------")
    for(const index in output[0]){
        const row = output[0][index]
        console.log(row.id,"=" ,row.value)
    }
}
else if (process.argv.length >= 3){
    const command = process.argv[2]

    if (command == "get") {
        if (process.argv.length == 4){
            const name = process.argv[3]
            const output = await sequelize.query({query: "SELECT * FROM application_configuration WHERE id=?", values:[name]})
            for(const index in output[0]){
                const row = output[0][index]
                console.log(row.id,"=" ,row.value)
            }
        }
        else{
            console.error("Invalid number of arguments")
            process.exit(1)
        }
    }
    else if (command == "set"){
        if (process.argv.length == 5){
            const name = process.argv[3]
            const value = process.argv[4]
            await sequelize.query({query:`INSERT INTO application_configuration (id, value) VALUES (?, ?) ON CONFLICT (id) DO UPDATE SET value = EXCLUDED.value`, values:[name, value]})
            console.log("OK")
        }
        else{
            console.error("Invalid number of arguments")
            process.exit(1)
        }
    }
}

process.exit(0)