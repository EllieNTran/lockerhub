import type { Request, Response, RequestHandler } from 'express'

export const notFoundHandler: RequestHandler = (req: Request, res: Response) => {
  res.status(404).json({
    status: 'error',
    statusCode: 404,
    message: `Route ${req.method} ${req.originalUrl} not found`,
  })
}
