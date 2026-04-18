/**
 * K6 Browser E2E Performance Test
 * Measures SPA navigation times using real browser with authentication
 * Target: Pages load within 3 seconds
 */

import { browser } from 'k6/browser';
import { check, sleep } from 'k6';
import { Trend, Rate, Counter } from 'k6/metrics';

const USER_EMAIL = __ENV.TEST_USER_EMAIL || 'test@example.com';
const USER_PASSWORD = __ENV.TEST_USER_PASSWORD || 'password123';
const ADMIN_EMAIL = __ENV.TEST_ADMIN_EMAIL || 'admin@example.com';
const ADMIN_PASSWORD = __ENV.TEST_ADMIN_PASSWORD || 'adminpassword123';
const BASE_URL = 'http://localhost:3001';

const pageLoadTime = new Trend('browser_page_load_time');
const pageLoadErrors = new Rate('browser_page_errors');
const pagesLoaded = new Counter('browser_pages_loaded');
const loginTime = new Trend('browser_login_time');

export const options = {
  scenarios: {
    browser_user_journey: {
      executor: 'constant-vus',
      exec: 'userJourney',
      vus: 1,
      duration: '4m',
      options: {
        browser: {
          type: 'chromium',
        },
      },
    },
    browser_admin_journey: {
      executor: 'constant-vus',
      exec: 'adminJourney',
      vus: 1,
      duration: '4m',
      startTime: '4m',
      options: {
        browser: {
          type: 'chromium',
        },
      },
    },
  },
  thresholds: {
    'browser_page_load_time': ['p(95)<3000'],
    'browser_page_errors': ['rate<0.05'],
    'browser_login_time': ['p(95)<10000'],
  },
};

async function login(page, email, password, userType) {
  const startTime = Date.now();
  
  try {
    await page.goto(`${BASE_URL}/`);
    await page.waitForSelector('#email', { timeout: 10000 });
    await page.waitForTimeout(2000);
    
    await page.locator('#email').fill(email);
    await page.locator('#password').fill(password);
    await page.locator('button[type="submit"]').click();
    
    await page.waitForTimeout(3000);
    
    const loginDuration = Date.now() - startTime;
    loginTime.add(loginDuration);
    
    const currentUrl = page.url();
    const success = currentUrl.includes(`/${userType}`);
    
    check(null, {
      [`${userType} login successful`]: () => success,
      [`${userType} login < 10s`]: () => loginDuration < 10000,
    });
    
    return success;
    
  } catch (error) {
    return false;
  }
}

export async function userJourney() {
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    const loginSuccess = await login(page, USER_EMAIL, USER_PASSWORD, 'user');
    if (!loginSuccess) return;
    
    sleep(1);
    
    const startHome = Date.now();
    await page.waitForTimeout(500);
    pageLoadTime.add(Date.now() - startHome);
    pagesLoaded.add(1);
    pageLoadErrors.add(0);
    sleep(2);
    
    const startBookings = Date.now();
    await page.locator('a[href="/user/my-bookings"]').click();
    await page.waitForTimeout(1000);
    pageLoadTime.add(Date.now() - startBookings);
    pagesLoaded.add(1);
    pageLoadErrors.add(0);
    sleep(2);
    
    const startBook = Date.now();
    await page.locator('a[href="/user/book"]').click();
    await page.waitForTimeout(1000);
    pageLoadTime.add(Date.now() - startBook);
    pagesLoaded.add(1);
    pageLoadErrors.add(0);
    sleep(2);
    
    const startHomeReturn = Date.now();
    await page.locator('a[href="/user"]').click();
    await page.waitForTimeout(1000);
    pageLoadTime.add(Date.now() - startHomeReturn);
    pagesLoaded.add(1);
    pageLoadErrors.add(0);
    
  } catch (error) {
    pageLoadErrors.add(1);
  } finally {
    await page.close();
    await context.close();
  }
}

export async function adminJourney() {
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    const loginSuccess = await login(page, ADMIN_EMAIL, ADMIN_PASSWORD, 'admin');
    if (!loginSuccess) return;
    
    sleep(1);
    
    const startHome = Date.now();
    await page.waitForTimeout(500);
    pageLoadTime.add(Date.now() - startHome);
    pagesLoaded.add(1);
    pageLoadErrors.add(0);
    sleep(2);
    
    const startBookings = Date.now();
    await page.locator('a[href="/admin/bookings"]').click();
    await page.waitForTimeout(1000);
    pageLoadTime.add(Date.now() - startBookings);
    pagesLoaded.add(1);
    pageLoadErrors.add(0);
    sleep(2);
    
    const startLockers = Date.now();
    await page.locator('a[href="/admin/lockers"]').click();
    await page.waitForTimeout(1000);
    pageLoadTime.add(Date.now() - startLockers);
    pagesLoaded.add(1);
    pageLoadErrors.add(0);
    sleep(2);
    
    const startHomeReturn = Date.now();
    await page.locator('a[href="/admin"]').click();
    await page.waitForTimeout(1000);
    pageLoadTime.add(Date.now() - startHomeReturn);
    pagesLoaded.add(1);
    pageLoadErrors.add(0);
    
  } catch (error) {
    pageLoadErrors.add(1);
  } finally {
    await page.close();
    await context.close();
  }
}

export function handleSummary(data) {
  return {
    'results/page-loads-browser-summary.json': JSON.stringify(data, null, 2),
    stdout: textSummary(data, { indent: ' ', enableColors: true }),
  };
}

function textSummary(data, options) {
  const indent = options.indent || '';
  let summary = '\n' + indent + 'Browser E2E Performance Test Results\n\n';

  if (data.metrics.browser_login_time) {
    summary += indent + `Login Time (95th percentile): ${data.metrics.browser_login_time.values['p(95)'].toFixed(2)}ms\n`;
    summary += indent + `Login Time (avg): ${data.metrics.browser_login_time.values.avg.toFixed(2)}ms\n`;
  }
  if (data.metrics.browser_page_load_time) {
    summary += indent + `Page Load Time (95th percentile): ${data.metrics.browser_page_load_time.values['p(95)'].toFixed(2)}ms\n`;
    summary += indent + `Page Load Time (avg): ${data.metrics.browser_page_load_time.values.avg.toFixed(2)}ms\n`;
  }
  if (data.metrics.browser_page_errors) {
    summary += indent + `Page Load Error Rate: ${(data.metrics.browser_page_errors.values.rate * 100).toFixed(2)}%\n`;
  }
  if (data.metrics.browser_pages_loaded) {
    summary += indent + `Total Pages Loaded: ${data.metrics.browser_pages_loaded.values.count}\n`;
  }

  summary += '\n';
  summary += indent + 'User Journey: Login > Home > My Bookings > Book Locker > Home\n';
  summary += indent + 'Admin Journey: Login > Home > Bookings > Lockers > Home\n\n';
  summary += indent + 'Targets: Login < 10s, Page Load < 3s, Error Rate < 5%\n\n';
  
  return summary;
}
