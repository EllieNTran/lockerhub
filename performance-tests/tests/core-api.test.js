/**
 * K6 Core API Performance Test
 * Tests user and admin API response times (GET endpoints only)
 * Target: <2s response time
 */

import http from 'k6/http'
import { check, group, sleep } from 'k6'
import { Rate, Trend } from 'k6/metrics'
import { config } from '../config.js'

const apiResponseTime = new Trend('api_response_time')
const apiErrorRate = new Rate('api_errors')
const authSuccessRate = new Rate('auth_success')

function getCurrentDate() {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export const options = {
  stages: [
    { duration: '30s', target: 10 },
    { duration: '1m', target: 50 },
    { duration: '2m', target: 50 },
    { duration: '30s', target: 0 },
  ],
  thresholds: {
    'http_req_duration': ['p(95)<2000'],
    'api_response_time': ['p(95)<2000'],
    'api_errors': ['rate<0.05'],
    'auth_success': ['rate>0.95'],
  },
}

export function setup() {
  const userLoginRes = http.post(
    `${config.AUTH_BASE_URL}/auth/login`,
    JSON.stringify({
      email: config.testUser.email,
      password: config.testUser.password,
    }),
    {
      headers: { 'Content-Type': 'application/json' },
    }
  )

  const adminLoginRes = http.post(
    `${config.AUTH_BASE_URL}/auth/login`,
    JSON.stringify({
      email: config.testAdmin.email,
      password: config.testAdmin.password,
    }),
    {
      headers: { 'Content-Type': 'application/json' },
    }
  )

  const userSuccess = check(userLoginRes, {
    'user authentication successful': (r) => r.status === 200,
    'user token received': (r) => r.json('accessToken') !== undefined,
  })

  const adminSuccess = check(adminLoginRes, {
    'admin authentication successful': (r) => r.status === 200,
    'admin token received': (r) => r.json('accessToken') !== undefined,
  })

  authSuccessRate.add(userSuccess && adminSuccess)

  if (userSuccess && adminSuccess) {
    const userToken = userLoginRes.json('accessToken')
    const adminToken = adminLoginRes.json('accessToken')
    let lockerId = null
    let floorIds = []
    
    const adminHeaders = {
      'Authorization': `Bearer ${adminToken}`,
      'Content-Type': 'application/json',
    }
    
    // Fetch all floors to get valid floor_ids
    const floorsRes = http.get(`${config.BOOKING_BASE_URL}/bookings/floors`, {
      headers: adminHeaders,
    })
    
    if (floorsRes.status === 200) {
      try {
        const floorsData = floorsRes.json()
        if (floorsData.floors && floorsData.floors.length > 0) {
          floorIds = floorsData.floors.map(f => f.floor_id)
          console.log(`Found ${floorIds.length} floors for load distribution`)
        }
      } catch (e) {
        console.log('Could not parse floors response')
      }
    }
    
    const lockersRes = http.get(`${config.ADMIN_BASE_URL}/admin/lockers`, {
      headers: adminHeaders,
    })
    
    if (lockersRes.status === 200) {
      try {
        const lockersData = lockersRes.json()
        if (lockersData.lockers && lockersData.lockers.length > 0) {
          const today = getCurrentDate()
          let availableLockerIds = new Set()
          
          if (floorIds.length > 0) {
            const availableRes = http.get(
              `${config.BOOKING_BASE_URL}/bookings/lockers/available?floor_id=${floorIds[0]}&start_date=${today}&end_date=${today}`,
              { headers: adminHeaders }
            )
          
            if (availableRes.status === 200) {
              try {
                const availData = availableRes.json()
                if (availData.lockers && Array.isArray(availData.lockers)) {
                  availData.lockers.forEach(locker => {
                    availableLockerIds.add(locker.locker_id)
                  })
                }
              } catch (e) {}
            }
          }
          
          const availableLockerWithKey = lockersData.lockers.find(locker => 
            locker.key_number && 
            locker.key_status === 'available' &&
            locker.status === 'available' &&
            availableLockerIds.has(locker.locker_id)
          )
          
          if (availableLockerWithKey) {
            lockerId = availableLockerWithKey.locker_id
          } else {
            const lockerWithKey = lockersData.lockers.find(locker => 
              locker.key_number && 
              locker.key_status === 'available'
            )
            if (lockerWithKey) {
              lockerId = lockerWithKey.locker_id
            }
          }
        }
      } catch (e) {}
    }
    
    return { userToken, adminToken, lockerId, floorIds }
  }
  
  throw new Error('Authentication failed')
}

export default function (data) {
  const userToken = data.userToken
  const adminToken = data.adminToken
  const floorIds = data.floorIds || []
  const lockerId = data.lockerId

  if (!userToken || !adminToken) {
    apiErrorRate.add(1)
    sleep(1)
    return
  }

  const userHeaders = {
    'Authorization': `Bearer ${userToken}`,
    'Content-Type': 'application/json',
  }

  const adminHeaders = {
    'Authorization': `Bearer ${adminToken}`,
    'Content-Type': 'application/json',
  }
  group('Locker Availability Check', () => {
    if (floorIds.length === 0) {
      console.log('Skipping: No floor ID available')
      apiErrorRate.add(1)
      return
    }
    
    const randomFloorId = floorIds[Math.floor(Math.random() * floorIds.length)]
    
    const res = http.get(
      `${config.BOOKING_BASE_URL}/bookings/lockers/available?floor_id=${randomFloorId}&start_date=2026-05-01&end_date=2026-05-14`,
      {
        headers: userHeaders,
        tags: { endpoint: 'available_lockers' },
      }
    )

    const success = check(res, {
      'status is 200': (r) => r.status === 200,
      'response time < 2s': (r) => r.timings.duration < config.thresholds.coreApiResponse,
      'has locker data': (r) => {
        try {
          const data = r.json()
          return data && Array.isArray(data.lockers)
        } catch {
          return false
        }
      },
    })

    apiResponseTime.add(res.timings.duration)
    apiErrorRate.add(!success)
  })

  sleep(1)

  group('Booking Listing', () => {
    const res = http.get(`${config.BOOKING_BASE_URL}/bookings`, {
      headers: userHeaders,
      tags: { endpoint: 'list_bookings' },
    })

    const success = check(res, {
      'status is 200': (r) => r.status === 200,
      'response time < 2s': (r) => r.timings.duration < config.thresholds.coreApiResponse,
      'has booking data': (r) => {
        try {
          const data = r.json()
          return Array.isArray(data) || (data && Array.isArray(data.bookings))
        } catch {
          return false
        }
      },
    })

    apiResponseTime.add(res.timings.duration)
    apiErrorRate.add(!success)
  })

  sleep(1)

  group('Specific Locker Availability', () => {
    if (!lockerId) {
      apiErrorRate.add(1)
      return
    }
    
    const res = http.get(
      `${config.BOOKING_BASE_URL}/bookings/lockers/${lockerId}/availability?start_date=2026-05-01&end_date=2026-05-14`,
      {
        headers: userHeaders,
        tags: { endpoint: 'check_locker_availability' },
      }
    )

    const success = check(res, {
      'status is 200': (r) => r.status === 200,
      'response time < 2s': (r) => r.timings.duration < config.thresholds.coreApiResponse,
      'has availability data': (r) => {
        try {
          const data = r.json()
          return data && typeof data.available === 'boolean'
        } catch {
          return false
        }
      },
    })

    apiResponseTime.add(res.timings.duration)
    apiErrorRate.add(!success)
  })

  sleep(1)

  group('Admin - All Bookings', () => {
    const res = http.get(`${config.ADMIN_BASE_URL}/admin/lockers`, {
      headers: adminHeaders,
      tags: { endpoint: 'admin_all_lockers' },
    })

    const success = check(res, {
      'status is 200': (r) => r.status === 200,
      'response time < 2s': (r) => r.timings.duration < config.thresholds.coreApiResponse,
      'has locker data': (r) => {
        try {
          const data = r.json()
          return data && Array.isArray(data.lockers)
        } catch {
          return false
        }
      },
    })

    apiResponseTime.add(res.timings.duration)
    apiErrorRate.add(!success)
  })

  sleep(1)

  group('Admin - All Bookings', () => {
    const res = http.get(`${config.ADMIN_BASE_URL}/admin/bookings`, {
      headers: adminHeaders,
      tags: { endpoint: 'admin_all_bookings' },
    })

    const success = check(res, {
      'status is 200': (r) => r.status === 200,
      'response time < 2s': (r) => r.timings.duration < config.thresholds.coreApiResponse,
      'has booking data': (r) => {
        try {
          const data = r.json()
          return data && Array.isArray(data.bookings)
        } catch {
          return false
        }
      },
    })

    apiResponseTime.add(res.timings.duration)
    apiErrorRate.add(!success)
  })

  sleep(1)

  group('Admin - Locker Stats', () => {
    const res = http.get(`${config.ADMIN_BASE_URL}/admin/lockers/stats`, {
      headers: adminHeaders,
      tags: { endpoint: 'admin_locker_stats' },
    })

    const success = check(res, {
      'status is 200': (r) => r.status === 200,
      'response time < 2s': (r) => r.timings.duration < config.thresholds.coreApiResponse,
      'has stats data': (r) => {
        try {
          const data = r.json()
          return data && (data.total_lockers !== undefined)
        } catch {
          return false
        }
      },
    })

    apiResponseTime.add(res.timings.duration)
    apiErrorRate.add(!success)
  })

  sleep(1)

  group('Admin - Special Requests', () => {
    const res = http.get(`${config.ADMIN_BASE_URL}/admin/special-requests`, {
      headers: adminHeaders,
      tags: { endpoint: 'admin_special_requests' },
    })

    const success = check(res, {
      'status is 200': (r) => r.status === 200,
      'response time < 2s': (r) => r.timings.duration < config.thresholds.coreApiResponse,
      'has request data': (r) => {
        try {
          const data = r.json()
          return data && Array.isArray(data.requests)
        } catch {
          return false
        }
      },
    })

    apiResponseTime.add(res.timings.duration)
    apiErrorRate.add(!success)
  })

  sleep(2)
}

export function handleSummary(data) {
  console.log(textSummary(data))
  return {
    'results/core-api-summary.json': JSON.stringify(data, null, 2),
  }
}

function textSummary(data) {
  let summary = '\n=== Core API Performance Test ===\n'
  summary += '(GET Endpoints Only)\n\n'

  if (data.metrics.http_req_duration) {
    summary += `Response Time p(95): ${data.metrics.http_req_duration.values['p(95)'].toFixed(0)}ms\n`
  }
  if (data.metrics.api_response_time) {
    summary += `API Response avg: ${data.metrics.api_response_time.values.avg.toFixed(0)}ms\n`
  }
  if (data.metrics.api_errors) {
    summary += `Error Rate: ${(data.metrics.api_errors.values.rate * 100).toFixed(1)}%\n`
  }
  if (data.metrics.auth_success) {
    summary += `Auth Success: ${(data.metrics.auth_success.values.rate * 100).toFixed(1)}%\n`
  }

  summary += '\nTarget: < 2s, Error Rate < 5%\n\n'
  return summary
}
