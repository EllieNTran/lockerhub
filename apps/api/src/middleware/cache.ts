// Cache middleware - requires node-cache package to be installed
// Commented out until node-cache is added to dependencies
/*
import NodeCache from 'node-cache'
import type { Request, Response, NextFunction, RequestHandler } from 'express'

const cache = new NodeCache({
  stdTTL: 600, // 10 minutes default
  checkperiod: 120, // Cleanup every 2 mins
})

export const cacheMiddleware = (ttl = 600): RequestHandler => (req: Request, res: Response, next: NextFunction) => {
  const key = `${req.method}:${req.originalUrl}`
  const cached = cache.get(key)

  if (cached) {
    res.json(cached)
    return
  }

  const originalJson = res.json.bind(res)
  res.json = (data: any) => {
    cache.set(key, data, ttl)
    return originalJson(data)
  }
  next()
}
*/

// Placeholder export to prevent errors
import type { RequestHandler } from 'express'
export const cacheMiddleware = (_ttl = 600): RequestHandler => (_req, _res, next) => next()
