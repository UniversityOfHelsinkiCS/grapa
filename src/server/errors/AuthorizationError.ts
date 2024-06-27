class CustomAuthorizationError extends Error {
  statusCode: number

  errors: Record<string, string[]>

  constructor(message: string, errors: any) {
    super(message)
    this.name = 'CustomAuthorizationError'
    this.statusCode = 403
    this.errors = errors // Include the Zod validation error object error issues
  }
}

export default CustomAuthorizationError
