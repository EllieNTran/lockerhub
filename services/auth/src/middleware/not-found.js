export const notFoundHandler = (req, res) => {
  res.status(404).json({
    error: {
      message: 'Resource not found',
      status: 404,
      path: req.originalUrl,
    },
  })
}
