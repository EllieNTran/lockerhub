/**
 * K6 Health Check Test
 * Verifies all services are healthy and responding
 */

import http from 'k6/http'
import { check, sleep } from 'k6'
import { Trend, Counter } from 'k6/metrics'
import { config } from '../config.js'

const readinessTime = new Trend('readiness_time')
const healthCheckAttempts = new Counter('health_check_attempts')

export const options = {
  vus: 1,
  iterations: 1,
  thresholds: {
    'readiness_time': ['max<60000'],
  },
}

export default function () {
  const startTime = Date.now()
  let allServicesReady = false
  const maxWaitTime = 60000
  const checkInterval = 2000

  const services = [
    { name: 'API Gateway', url: `${config.API_BASE_URL}/health` },
    { name: 'Auth Service', url: `${config.AUTH_BASE_URL}/health` },
    { name: 'Booking Service', url: `${config.BOOKING_BASE_URL}/health` },
    { name: 'Admin Service', url: `${config.ADMIN_BASE_URL}/health` },
    { name: 'Notifications Service', url: `${config.NOTIFICATIONS_BASE_URL}/health` },
    { name: 'Analytics Service', url: `${config.ANALYTICS_BASE_URL}/health` },
  ]

  while (!allServicesReady && (Date.now() - startTime) < maxWaitTime) {
    healthCheckAttempts.add(1)
    const serviceStatuses = []

    for (const service of services) {
      try {
        const res = http.get(service.url, {
          timeout: '5s',
        })

        const isHealthy = res.status === 200
        serviceStatuses.push(isHealthy)
      } catch (error) {
        serviceStatuses.push(false)
      }
    }

    allServicesReady = serviceStatuses.every(status => status === true)

    if (!allServicesReady) {
      sleep(checkInterval / 1000)
    }
  }

  const totalStartupTime = Date.now() - startTime

  check({ totalStartupTime }, {
    'all services ready': () => allServicesReady,
    'readiness time < 60s': () => totalStartupTime < 60000,
  })

  readinessTime.add(totalStartupTime)

  if (allServicesReady) {
    const functionalityChecks = http.batch([
      ['GET', `${config.API_BASE_URL}/health`, null, { tags: { name: 'api_functional' } }],
      ['GET', `${config.AUTH_BASE_URL}/auth/metadata`, null, { tags: { name: 'auth_functional' } }],
      ['GET', `${config.BOOKING_BASE_URL}/health`, null, { tags: { name: 'booking_functional' } }],
      ['GET', `${config.ADMIN_BASE_URL}/health`, null, { tags: { name: 'admin_functional' } }],
      ['GET', `${config.NOTIFICATIONS_BASE_URL}/health`, null, { tags: { name: 'notifications_functional' } }],
      ['GET', `${config.ANALYTICS_BASE_URL}/health`, null, { tags: { name: 'analytics_functional' } }],
    ])

    const allFunctional = check(functionalityChecks, {
      'all services functional': (r) => r.every(res => res.status === 200),
    })
  }
}

export function handleSummary(data) {
  return {
    '/results/health-check-summary.json': JSON.stringify(data, null, 2),
    stdout: textSummary(data, { indent: ' ', enableColors: true }),
  }
}

function textSummary(data, options) {
  const indent = options.indent || ''
  let summary = '\n' + indent + 'System Health Check Results\n\n'

  if (data.metrics.readiness_time) {
    const readinessSeconds = (data.metrics.readiness_time.values.max / 1000).toFixed(2)
    summary += indent + `Total Readiness Time: ${readinessSeconds}s\n`

    if (data.metrics.readiness_time.values.max < 60000) {
      summary += indent + `Status: PASSED (all services healthy)\n`
    } else {
      summary += indent + `Status: FAILED (some services not ready)\n`
    }
  }

  if (data.metrics.health_check_attempts) {
    summary += indent + `Health Check Attempts: ${data.metrics.health_check_attempts.values.count}\n`
  }

  summary += '\n'
  return summary
}
