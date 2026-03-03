import NodeCache from 'node-cache'

const cache = new NodeCache({
  stdTTL: 600, // 10 minutes default
  checkperiod: 120, // Cleanup every 2 mins
})

export const cacheMiddleware = (ttl = 600) => (req, res, next) => {
  const key = `${req.method}:${req.originalUrl}`
  const cached = cache.get(key)

  if (cached) {
    return res.json(cached)
  }

  res.originalJson = res.json
  res.json = (data) => {
    cache.set(key, data, ttl)
    res.originalJson(data)
  }
  next()
}
