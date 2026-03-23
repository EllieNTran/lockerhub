/**
 * Integration tests for notification routes
 * Using supertest to test Express routes end-to-end
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import request from 'supertest'
import express from 'express'
import notificationsRouter from '../../src/routes/notifications'
import * as authService from '../../src/services/auth'
import * as notificationService from '../../src/services/notifications'
import {
  validPasswordResetEmail,
  validActivationEmail,
  validNotificationRequest,
  userScopedNotificationRequest,
  sampleUserId,
  sampleNotificationId,
  createMockNotificationWithReadStatus,
} from '../fixtures'

const app = express()
app.use(express.json())
app.use('/notifications', notificationsRouter)

// Mock the services
vi.mock('../../src/services/auth')
vi.mock('../../src/services/notifications')
vi.mock('../../src/connectors/db')

describe('Notification Routes Integration Tests', () => {
  describe('POST /notifications/password-reset', () => {
    beforeEach(() => {
      vi.clearAllMocks()
    })

    it('should successfully send password reset email', async () => {
      /**
       * Verify end-to-end password reset email flow.
       * Mock service succeeds.
       * Expect 200 status with success message.
       */
      vi.mocked(authService.sendResetPasswordEmail).mockResolvedValue(undefined)

      const response = await request(app)
        .post('/notifications/password-reset')
        .send(validPasswordResetEmail)

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.message).toContain('Password reset email sent')
      expect(authService.sendResetPasswordEmail).toHaveBeenCalledWith(
        validPasswordResetEmail.email,
        validPasswordResetEmail.name,
        validPasswordResetEmail.resetLink,
      )
    })

    it('should return 400 for missing required fields', async () => {
      /**
       * Verify validation for required fields.
       * Expect 400 status for invalid request.
       */
      const response = await request(app)
        .post('/notifications/password-reset')
        .send({ email: 'test@example.com' }) // missing name and resetLink

      expect(response.status).toBe(400)
    })

    it('should return 500 on service error', async () => {
      /**
       * Verify error handling when email service fails.
       * Mock service throws error.
       */
      vi.mocked(authService.sendResetPasswordEmail).mockRejectedValue(
        new Error('Email service unavailable'),
      )

      const response = await request(app)
        .post('/notifications/password-reset')
        .send(validPasswordResetEmail)

      expect(response.status).toBe(500)
    })
  })

  describe('POST /notifications/activation', () => {
    beforeEach(() => {
      vi.clearAllMocks()
    })

    it('should successfully send activation email', async () => {
      /**
       * Verify end-to-end activation email flow.
       * Mock service succeeds.
       * Expect 200 status with success message.
       */
      vi.mocked(authService.sendActivationEmail).mockResolvedValue(undefined)

      const response = await request(app)
        .post('/notifications/activation')
        .send(validActivationEmail)

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.message).toContain('Activation email sent')
      expect(authService.sendActivationEmail).toHaveBeenCalledWith(
        validActivationEmail.email,
        validActivationEmail.name,
        validActivationEmail.activationLink,
      )
    })

    it('should return 400 for invalid request', async () => {
      /**
       * Verify validation for activation email.
       * Expect 400 status for missing fields.
       */
      const response = await request(app)
        .post('/notifications/activation')
        .send({ email: 'test@example.com' }) // missing name and activationLink

      expect(response.status).toBe(400)
    })
  })

  describe('GET /notifications/health', () => {
    it('should return health status', async () => {
      /**
       * Verify health check endpoint.
       * Expect 200 status with ok status.
       */
      const response = await request(app).get('/notifications/health')

      expect(response.status).toBe(200)
      expect(response.body.status).toBe('ok')
    })
  })

  describe('POST /notifications', () => {
    beforeEach(() => {
      vi.clearAllMocks()
    })

    it('should successfully create global notification', async () => {
      /**
       * Verify notification creation endpoint.
       * Mock service returns success.
       */
      vi.mocked(notificationService.createNotification).mockResolvedValue({
        notification_id: sampleNotificationId,
        success: true,
        message: 'Notification created successfully',
      })

      const response = await request(app)
        .post('/notifications')
        .send(validNotificationRequest)

      expect(response.status).toBe(201)
      expect(response.body.success).toBe(true)
      expect(response.body).toHaveProperty('notification_id')
    })

    it('should successfully create user-scoped notification', async () => {
      /**
       * Verify user-scoped notification creation.
       * Mock service handles user ID array.
       */
      vi.mocked(notificationService.createNotification).mockResolvedValue({
        notification_id: sampleNotificationId,
        success: true,
        message: 'Notification created successfully',
      })

      const response = await request(app)
        .post('/notifications')
        .send(userScopedNotificationRequest)

      expect(response.status).toBe(201)
      expect(response.body.success).toBe(true)
      expect(notificationService.createNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          scope: 'user',
          userIds: expect.arrayContaining([sampleUserId]),
        }),
      )
    })

    it('should return 400 for invalid scope', async () => {
      /**
       * Verify validation for notification scope.
       * Expect 400 for invalid scope value.
       */
      const response = await request(app)
        .post('/notifications')
        .send({
          ...validNotificationRequest,
          scope: 'invalid-scope',
        })

      expect(response.status).toBe(400)
    })
  })

  describe('PUT /notifications/:id/read', () => {
    beforeEach(() => {
      vi.clearAllMocks()
    })

    it('should successfully mark notification as read', async () => {
      /**
       * Verify marking notification as read.
       * Mock service returns success.
       */
      vi.mocked(notificationService.markAsRead).mockResolvedValue({
        success: true,
        message: 'Notification marked as read successfully',
      })

      const response = await request(app)
        .put(`/notifications/${sampleNotificationId}/read`)
        .send({ userId: sampleUserId })

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(notificationService.markAsRead).toHaveBeenCalledWith({
        userId: sampleUserId,
        notificationId: sampleNotificationId,
      })
    })

    it('should return 400 for missing userId', async () => {
      /**
       * Verify validation for required userId.
       */
      const response = await request(app)
        .put(`/notifications/${sampleNotificationId}/read`)
        .send({})

      expect(response.status).toBe(400)
    })

    it('should return 404 for already read notification', async () => {
      /**
       * Verify 404 response when notification is already marked as read.
       * Mock service returns success: false.
       */
      vi.mocked(notificationService.markAsRead).mockResolvedValue({
        success: false,
        message: 'Notification not found or already marked as read',
      })

      const response = await request(app)
        .put(`/notifications/${sampleNotificationId}/read`)
        .send({ userId: sampleUserId })

      expect(response.status).toBe(404)
      expect(response.body.success).toBe(false)
    })
  })

  describe('GET /notifications/user/:userId', () => {
    beforeEach(() => {
      vi.clearAllMocks()
    })

    it('should successfully retrieve user notifications', async () => {
      /**
       * Verify user notifications retrieval.
       * Mock service returns notification list.
       */
      const mockNotifications = [
        createMockNotificationWithReadStatus({ read: false }),
        createMockNotificationWithReadStatus({ read: true }),
      ]

      vi.mocked(notificationService.getUserNotifications).mockResolvedValue({
        notifications: mockNotifications,
        total: 2,
        unread: 1,
      })

      const response = await request(app).get(`/notifications/user/${sampleUserId}`)

      expect(response.status).toBe(200)
      expect(response.body.notifications).toHaveLength(2)
      expect(response.body.unread).toBe(1)
    })

    it('should return empty array for user with no notifications', async () => {
      /**
       * Verify handling of user with no notifications.
       */
      vi.mocked(notificationService.getUserNotifications).mockResolvedValue({
        notifications: [],
        total: 0,
        unread: 0,
      })

      const response = await request(app).get(`/notifications/user/${sampleUserId}`)

      expect(response.status).toBe(200)
      expect(response.body.notifications).toHaveLength(0)
      expect(response.body.unread).toBe(0)
    })

    it('should filter unread notifications when requested', async () => {
      /**
       * Verify unread filter query parameter.
       */
      const mockNotifications = [createMockNotificationWithReadStatus({ read: false })]

      vi.mocked(notificationService.getUserNotifications).mockResolvedValue({
        notifications: mockNotifications,
        total: 1,
        unread: 1,
      })

      const response = await request(app).get(
        `/notifications/user/${sampleUserId}?unreadOnly=true`,
      )

      expect(response.status).toBe(200)
      expect(response.body.notifications).toHaveLength(1)
      expect(notificationService.getUserNotifications).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: sampleUserId,
          unreadOnly: true,
        }),
      )
    })
  })
})
