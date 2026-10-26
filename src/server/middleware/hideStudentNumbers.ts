import { NextFunction, Response } from 'express'

import { RequestWithUser } from '../types'
import { HIDE_STUDENT_NUMBERS_HEADER_KEY } from '../../config'

const hideStudentNumbersMiddleware = (
  req: RequestWithUser,
  res: Response,
  next: NextFunction
) => {
  if (req.headers[HIDE_STUDENT_NUMBERS_HEADER_KEY] === 'true') {
    req.hideStudentNumbers = true

    res.json = (body) =>
      res
        .type('json')
        .send(
          JSON.stringify(body, (key, value) =>
            key === 'studentNumber' ? undefined : value
          )
        )
  }

  next()
}

export default hideStudentNumbersMiddleware
