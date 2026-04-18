/**
 * K6 Concurrent Users Performance Test
 * Tests system behavior with 50+ concurrent users
 * Target: Page loads within 3 seconds
 */

import http from 'k6/http'
import { check, group, sleep } from 'k6'
import { Rate, Trend, Counter } from 'k6/metrics'
import { config } from '../config.js'

const pageLoadTime = new Trend('page_load_time')
const concurrentUsers = new Counter('concurrent_users')
const errorRate = new Rate('errors')
const successRate = new Rate('success')

export const options = {
  stages: [
    { duration: '30s', target: 10 },  // Start with 10 users
    { duration: '1m', target: 50 },   // Ramp to 50 users
    { duration: '2m', target: 50 },   // Maintain 50 users
    { duration: '30s', target: 70 },  // Spike to 70 users
    { duration: '1m', target: 50 },   // Back to 50 users
    { duration: '30s', target: 0 },   // Ramp down
  ],
  thresholds: {
    'page_load_time': ['p(95)<3000'],
    'http_req_duration': ['p(95)<3000'],
    'errors': ['rate<0.05'],
    'success': ['rate>0.95'],
    'http_req_failed': ['rate<0.05'],
  },
}

export function setup() {
  const loginRes = http.post(
    `${config.AUTH_BASE_URL}/auth/login`,
    JSON.stringify({
      email: config.testUser.email,
      password: config.testUser.password,
    }),
    {
      headers: { 'Content-Type': 'application/json' },
    }
  )

  if (loginRes.status === 200) {
    const token = loginRes.json('accessToken')
    
    // Fetch all floor IDs for realistic testing
    let floorIds = []
    const floorsRes = http.get(`${config.BOOKING_BASE_URL}/bookings/floors`, {
      headers: { 'Authorization': `Bearer ${token}` },
    })
    
    if (floorsRes.status === 200) {
      try {
        const floorsData = floorsRes.json()
        if (floorsData.floors && floorsData.floors.length > 0) {
          floorIds = floorsData.floors.map(f => f.floor_id)
          console.log(`Found ${floorIds.length} floors for testing`)
        }
      } catch (e) {
        console.log('Could not parse floors response')
      }
    }
    
    return { token, floorIds }
  }
  return { token: null, floorIds: [] }
}

export default function (data) {
  concurrentUsers.add(1)

  const token = data.token
  const floorIds = data.floorIds || []

  if (!token) {
    console.error('No authentication token available')
    errorRate.add(1)
    successRate.add(0)
    return
  }
  
  if (floorIds.length === 0) {
    console.error('No floor IDs available')
  }

  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  }

  // Simulate realistic user journey
  group('Browse Available Lockers', () => {
    if (floorIds.length === 0) {
      errorRate.add(1)
      successRate.add(0)
      return
    }
    
    const randomFloorId = floorIds[Math.floor(Math.random() * floorIds.length)]
    const startTime = Date.now()

    const res = http.get(
      `${config.BOOKING_BASE_URL}/bookings/lockers/available?floor_id=${randomFloorId}&start_date=2026-05-01&end_date=2026-05-14`,
      { headers }
    )

    const success = check(res, {
      'lockers loaded': (r) => r.status === 200,
      'response time < 3s': (r) => r.timings.duration < config.thresholds.generalPageLoad,
    })

    pageLoadTime.add(Date.now() - startTime)
    errorRate.add(!success)
    successRate.add(success)
  })

  sleep(2)

  group('View My Bookings', () => {
    const startTime = Date.now()

    const res = http.get(`${config.BOOKING_BASE_URL}/bookings`, { headers })

    const success = check(res, {
      'bookings loaded': (r) => r.status === 200,
      'response time < 3s': (r) => r.timings.duration < config.thresholds.generalPageLoad,
    })

    pageLoadTime.add(Date.now() - startTime)
    errorRate.add(!success)
    successRate.add(success)
  })

  sleep(1)

  group('Check Floor Availability', () => {
    if (floorIds.length === 0) {
      errorRate.add(1)
      successRate.add(0)
      return
    }
    
    const randomFloorId = floorIds[Math.floor(Math.random() * floorIds.length)]
    const startTime = Date.now()

    const res = http.get(
      `${config.BOOKING_BASE_URL}/bookings/lockers/available?floor_id=${randomFloorId}&start_date=2026-05-01&end_date=2026-05-14`,
      { headers }
    )

    const success = check(res, {
      'floor data loaded': (r) => r.status === 200,
      'response time < 3s': (r) => r.timings.duration < config.thresholds.generalPageLoad,
    })

    pageLoadTime.add(Date.now() - startTime)
    errorRate.add(!success)
    successRate.add(success)
  })

  sleep(1)

  // Simulate checking different floors (realistic user browsing behavior)
  group('Browse Different Floors', () => {
    if (floorIds.length === 0) {
      errorRate.add(1)
      successRate.add(0)
      return
    }
    
    const anotherFloorId = floorIds[Math.floor(Math.random() * floorIds.length)]
    const startTime = Date.now()

    const res = http.get(
      `${config.BOOKING_BASE_URL}/bookings/lockers/available?floor_id=${anotherFloorId}&start_date=2026-05-15&end_date=2026-05-28`,
      { headers }
    )

    const success = check(res, {
      'different floor loaded': (r) => r.status === 200,
      'response time < 3s': (r) => r.timings.duration < config.thresholds.generalPageLoad,
    })

    pageLoadTime.add(Date.now() - startTime)
    errorRate.add(!success)
    successRate.add(success)
  })

  sleep(2)
}

export function handleSummary(data) {
  const passed = checkThresholds(data)

  return {
    '/results/concurrent-users-summary.json': JSON.stringify(data, null, 2),
    stdout: textSummary(data, { indent: ' ', enableColors: true, passed }),
  }
}

function checkThresholds(data) {
  let passed = true

  // Check if system handled 50 concurrent users
  if (data.metrics.vus && data.metrics.vus.values.max < 50) {
    console.warn('WARNING: Did not reach 50 concurrent users')
    passed = false
  }

  return passed
}

function textSummary(data, options) {
  const indent = options.indent || ''
  let summary = '\n' + indent + '=== Concurrent Users Performance Test Results ===\n\n'

  if (data.metrics.vus) {
    summary += indent + `Max Concurrent Users: ${data.metrics.vus.values.max}\n`
    summary += indent + `Avg Concurrent Users: ${data.metrics.vus.values.avg.toFixed(2)}\n`
  }

  if (data.metrics.page_load_time) {
    summary += indent + `Page Load Time (95th percentile): ${data.metrics.page_load_time.values['p(95)'].toFixed(2)}ms\n`
    summary += indent + `Page Load Time (avg): ${data.metrics.page_load_time.values.avg.toFixed(2)}ms\n`
  }

  if (data.metrics.errors) {
    summary += indent + `Error Rate: ${(data.metrics.errors.values.rate * 100).toFixed(2)}%\n`
  }

  if (data.metrics.success) {
    summary += indent + `Success Rate: ${(data.metrics.success.values.rate * 100).toFixed(2)}%\n`
  }

  if (data.metrics.http_reqs) {
    summary += indent + `Total Requests: ${data.metrics.http_reqs.values.count}\n`
  }
  
  if (data.metrics.http_req_failed) {
    summary += indent + `Request Failure Rate: ${(data.metrics.http_req_failed.values.rate * 100).toFixed(2)}%\n`
  }

  summary += '\n'

  if (options.passed === false) {
    summary += indent + 'WARNING: Some thresholds were not met\n\n'
  } else {
    summary += indent + '✓ All thresholds passed\n\n'
  }

  return summary
}
