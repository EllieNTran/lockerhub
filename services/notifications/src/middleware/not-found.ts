import type { Request, Response, RequestHandler } from 'express'

export const notFoundHandler: RequestHandler = (req: Request, res: Response) => {
  res.status(404).json({
    error: {
      message: 'Resource not found',
      status: 404,
      path: req.originalUrl,
    },
  })
}
