import express from 'express'

const thesisRouter = express.Router()

thesisRouter.get('/', async (_, res) => res.send(['thesis 1', 'thesis 2']))

export default thesisRouter
