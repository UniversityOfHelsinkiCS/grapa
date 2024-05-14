import supertest from 'supertest'

import app from '../index'
import { User } from '../db/models'

const request = supertest(app)

describe('testing the test', () => {
  it('should pass', async () => {
    const users = await User.findAll()
    expect(users).toEqual([])

    const response = await request.get('/api/theses')
    expect(response.status).toEqual(200)
    expect(response.body).toEqual([])
  })
})
