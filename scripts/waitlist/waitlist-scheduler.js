/**
 * Waitlist Auto-Allocation Scheduler
 * 
 * Periodically processes the floor queue and auto-allocates available lockers
 * to users on the waitlist in FCFS order.
 */

const INTERVAL_MINUTES = parseInt(process.env.INTERVAL_MINUTES || '15', 10);
const INTERVAL_MS = INTERVAL_MINUTES * 60 * 1000;
const BOOKING_SERVICE_URL = process.env.BOOKING_SERVICE_URL || 'http://localhost:3002';
const INTERNAL_API_KEY = process.env.INTERNAL_API_KEY;
const ENDPOINT = '/bookings/queues/process';

async function processWaitlist() {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] Processing floor queues...`);
  
  try {
    const headers = { 'Content-Type': 'application/json' };

    if (INTERNAL_API_KEY) {
      headers['X-API-Key'] = INTERNAL_API_KEY;
    }
    
    const response = await fetch(`${BOOKING_SERVICE_URL}${ENDPOINT}`, {
      method: 'POST',
      headers
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const result = await response.json();
    console.log(`[${timestamp}] Success:`, JSON.stringify(result, null, 2));
    console.log(`[${timestamp}] Allocations made: ${result.allocations_made}`);
  } catch (error) {
    console.error(`[${timestamp}] Error:`, error.message);
  }
}

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('  Waitlist Scheduler Started');
console.log(`  Interval: ${INTERVAL_MINUTES} minutes`);
console.log(`  Target: ${BOOKING_SERVICE_URL}${ENDPOINT}`);
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

processWaitlist();

setInterval(processWaitlist, INTERVAL_MS);
