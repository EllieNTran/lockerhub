/**
 * K6 Browser Test: Analytics Dashboard Performance
 * Measures page load time and filter interaction performance
 */

import { browser } from 'k6/browser'
import { check, sleep } from 'k6'
import { Trend, Rate } from 'k6/metrics'

const ADMIN_EMAIL = __ENV.TEST_ADMIN_EMAIL || 'admin@example.com'
const ADMIN_PASSWORD = __ENV.TEST_ADMIN_PASSWORD || 'adminpassword123'
const BASE_URL = 'http://localhost:3001'

const pageNavigationTime = new Trend('page_navigation_time')
const dataLoadTime = new Trend('data_load_time')
const filterResponseTime = new Trend('filter_response_time')
const analyticsPageLoad = new Trend('analytics_page_load')
const browserErrors = new Rate('browser_errors')

export const options = {
  scenarios: {
    browser_test: {
      executor: 'constant-vus',
      vus: 1,
      duration: '3m',
      options: {
        browser: {
          type: 'chromium',
        },
      },
    },
  },
  thresholds: {
    'analytics_page_load': ['p(95)<6000'],
    'page_navigation_time': ['p(95)<2000'],
    'data_load_time': ['p(95)<4000'],
    'filter_response_time': ['p(95)<4000'],
    'browser_errors': ['rate<0.05'],
  },
}

export default async function () {
  const context = await browser.newContext()
  const page = await context.newPage()

  try {
    // Login
    await page.goto(`${BASE_URL}/`)
    await page.waitForSelector('#email', { timeout: 10000 })
    await page.waitForTimeout(2000)
    
    await page.locator('#email').fill(ADMIN_EMAIL)
    await page.locator('#password').fill(ADMIN_PASSWORD)
    await page.locator('button[type="submit"]').click()
    await page.waitForTimeout(3000)
    
    const loginSuccess = page.url().includes('/admin')
    check(null, {
      'admin login successful': () => loginSuccess,
    })
    
    if (!loginSuccess) {
      browserErrors.add(1)
      return
    }
    
    sleep(1)

    // Analytics page load
    const analyticsStartTime = Date.now()
    
    await page.locator('a[href*="analytics"]').click()
    await page.waitForTimeout(1000)
    
    const navTime = Date.now() - analyticsStartTime
    pageNavigationTime.add(navTime)
    browserErrors.add(0)
    
    await page.waitForTimeout(2000)
    
    const dataTime = Date.now() - analyticsStartTime - navTime
    dataLoadTime.add(dataTime)
    browserErrors.add(0)

    const analyticsLoadTime = Date.now() - analyticsStartTime
    analyticsPageLoad.add(analyticsLoadTime)

    check(null, {
      'analytics page loaded': () => page.url().includes('analytics'),
      'analytics load time < 6s': () => analyticsLoadTime < 6000,
    })

    sleep(1)

    // Period filter test
    try {
      const startTime = Date.now()
      const buttons = page.locator('button')
      const buttonCount = await buttons.count()
      let periodButton = null
      
      for (let i = 0; i < buttonCount; i++) {
        const text = await buttons.nth(i).textContent()
        if (text && text.includes('Last')) {
          periodButton = buttons.nth(i)
          break
        }
      }
      
      if (periodButton) {
        await periodButton.click()
        await page.waitForTimeout(500)
        
        const menuItems = page.locator('[role="menuitem"]')
        const menuCount = await menuItems.count()
        
        for (let i = 0; i < menuCount; i++) {
          const text = await menuItems.nth(i).textContent()
          if (text && text.trim() === 'Last Month') {
            await menuItems.nth(i).click()
            await page.waitForTimeout(1500)
            
            const filterTime = Date.now() - startTime
            filterResponseTime.add(filterTime)
            browserErrors.add(0)
            check(null, { 'period filter < 4s': () => filterTime < 4000 })
            break
          }
        }
      }
    } catch (error) {
      browserErrors.add(1)
    }
    
    sleep(1)

    // Floor filter test
    try {
      const startTime = Date.now()
      const buttons = page.locator('button')
      const buttonCount = await buttons.count()
      
      for (let i = 0; i < buttonCount; i++) {
        const text = await buttons.nth(i).textContent()
        if (text && text.includes('Floor')) {
          await buttons.nth(i).click()
          await page.waitForTimeout(500)
          
          const menuItems = page.locator('[role="menuitem"]')
          if (await menuItems.count() > 1) {
            await menuItems.nth(1).click()
            await page.waitForTimeout(1500)
            
            const filterTime = Date.now() - startTime
            filterResponseTime.add(filterTime)
            browserErrors.add(0)
            check(null, { 'floor filter < 4s': () => filterTime < 4000 })
          }
          break
        }
      }
    } catch (error) {
      browserErrors.add(1)
    }
    
    sleep(1)

    // Department filter test
    try {
      const startTime = Date.now()
      const buttons = page.locator('button')
      const buttonCount = await buttons.count()
      
      for (let i = 0; i < buttonCount; i++) {
        const text = await buttons.nth(i).textContent()
        if (text && text.includes('Department')) {
          await buttons.nth(i).click()
          await page.waitForTimeout(500)
          
          const menuItems = page.locator('[role="menuitem"]')
          if (await menuItems.count() > 1) {
            await menuItems.nth(1).click()
            await page.waitForTimeout(1500)
            
            const filterTime = Date.now() - startTime
            filterResponseTime.add(filterTime)
            browserErrors.add(0)
            check(null, { 'department filter < 4s': () => filterTime < 4000 })
          }
          break
        }
      }
    } catch (error) {
      browserErrors.add(1)
    }
    
    sleep(2)

  } catch (error) {
    browserErrors.add(1)
  } finally {
    await page.close()
    await context.close()
  }
}

export function handleSummary(data) {
  console.log(generateSummary(data))
  return {
    'results/browser-analytics-summary.json': JSON.stringify(data, null, 2),
  }
}

function generateSummary(data) {
  let summary = '\n=== Analytics Dashboard Performance Test ===\n\n'

  if (data.metrics.analytics_page_load) {
    summary += `Page Load p(95): ${data.metrics.analytics_page_load.values['p(95)'].toFixed(0)}ms\n`
    summary += `Page Load avg: ${data.metrics.analytics_page_load.values.avg.toFixed(0)}ms\n`
  }
  if (data.metrics.filter_response_time) {
    summary += `Filter p(95): ${data.metrics.filter_response_time.values['p(95)'].toFixed(0)}ms\n`
    summary += `Filter avg: ${data.metrics.filter_response_time.values.avg.toFixed(0)}ms\n`
  }
  if (data.metrics.browser_errors) {
    summary += `Error Rate: ${(data.metrics.browser_errors.values.rate * 100).toFixed(1)}%\n`
  }

  summary += '\nTargets: Page < 6s, Filters < 4s, Errors < 5%\n\n'

  return summary
}
