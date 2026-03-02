class CustomUnauthorizedError extends Error {
  statusCode: number

  constructor(message: string) {
    super(message)
    this.name = 'CustomUnauthorizedError'
    this.statusCode = 401
  }
}

export default CustomUnauthorizedError
