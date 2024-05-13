import { NextFunction, Response } from 'express'

const parseFormDataJson = (req: any, _: Response, next: NextFunction) => {
  req.body = JSON.parse(req.body.json)
  next()
}

export default parseFormDataJson
