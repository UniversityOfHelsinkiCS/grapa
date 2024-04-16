class ZodValidationError extends Error {
  statusCode: number

  errors: Record<string, string[]>

  constructor(message: string, errors: any) {
    super(message)
    this.name = 'ZodValidationError'
    this.statusCode = 400
    this.errors = errors // Include the Zod validation error object error issues
  }
}

export default ZodValidationError
