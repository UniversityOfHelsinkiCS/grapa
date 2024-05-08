import { NextFunction, Request, Response } from 'express'

const parseFormDataJson = (req: Request, _: Response, next: NextFunction) => {
  req.body = JSON.parse(req.body.json)
  next()
}

export default parseFormDataJson
