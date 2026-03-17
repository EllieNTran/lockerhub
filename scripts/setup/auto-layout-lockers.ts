/**
 * Auto Layout Lockers
 * 
 * Uses predefined floor layouts to automatically calculate and update the (x, y) coordinates of lockers in the database.
 * This is intended to be run as a one-time script after locker data has been imported.
 */

import { Pool } from 'pg';
import { config } from 'dotenv';

config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3000'),
  database: process.env.DB_NAME || 'postgres',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
});

const LOCKER_SIZE = 48;
const LOCKER_SPACING = 8;
const ZONE_LABEL_HEIGHT = 40;

// Floor layout definitions
const floorLayouts = {
  '2': {
    zones: [
      { id: '01', width: 300, height: 170 },
      { id: '02', width: 300, height: 170 },
      { id: '03', width: 480, height: 170 },
      { id: '04', width: 220, height: 170 },
      { id: '05', width: 200, height: 170 },
      { id: '06', width: 200, height: 170 },
      { id: '07', width: 200, height: 170 },
      { id: '08', width: 240, height: 170 },
      { id: '09', width: 240, height: 170 },
      { id: '10', width: 200, height: 170 },
    ],
  },
  '3': {
    zones: [
      { id: '01', width: 300, height: 170 },
      { id: '02', width: 320, height: 170 },
      { id: '03', width: 490, height: 170 },
    ],
  },
  '4': {
    zones: [
      { id: '01', width: 300, height: 170 },
      { id: '02', width: 320, height: 170 },
      { id: '03', width: 490, height: 170 },
    ],
  },
  '6': {
    zones: [
      { id: '01', width: 300, height: 170 },
      { id: '02', width: 320, height: 170 },
      { id: '03', width: 490, height: 170 },
    ],
  },
  '7': {
    zones: [
      { id: '01', width: 300, height: 170 },
      { id: '02', width: 320, height: 170 },
      { id: '03', width: 490, height: 170 },
    ],
  },
  '8': {
    zones: [
      { id: '01', width: 300, height: 170 },
      { id: '02', width: 320, height: 170 },
      { id: '03', width: 490, height: 170 },
    ],
  },
  '9': {
    zones: [
      { id: '01', width: 300, height: 170 },
      { id: '02', width: 320, height: 170 },
      { id: '03', width: 490, height: 170 },
    ],
  },
  '10': {
    zones: [
      { id: '01', width: 300, height: 170 },
      { id: '02', width: 320, height: 170 },
      { id: '03', width: 490, height: 170 },
    ],
  },
  '10E': {
    zones: [
      { id: '01', width: 260, height: 120 },
      { id: '02', width: 260, height: 120 },
      { id: '03', width: 420, height: 150 },
      { id: '04', width: 400, height: 150 },
    ],
  },
  '11': {
    zones: [
      { id: '01', width: 300, height: 170 },
      { id: '02', width: 300, height: 170 },
      { id: '03', width: 300, height: 170 },
      { id: '04', width: 300, height: 170 },
      { id: '05', width: 300, height: 170 },
      { id: '06', width: 300, height: 170 },
      { id: '07', width: 300, height: 170 },
      { id: '08', width: 300, height: 170 },
      { id: '09', width: 300, height: 170 },
      { id: '10', width: 300, height: 170 },
      { id: '11', width: 300, height: 170 },
      { id: '12', width: 300, height: 170 },
      { id: '13', width: 300, height: 170 },
      { id: '14', width: 300, height: 170 },
      { id: '15', width: 300, height: 170 },
      { id: '16', width: 300, height: 170 },
    ],
  },
  '11E': {
    zones: [
      { id: '01', width: 300, height: 180 },
      { id: '02', width: 300, height: 180 },
      { id: '03', width: 300, height: 180 },
      { id: '04', width: 300, height: 180 },
      { id: '05', width: 300, height: 180 },
    ],
  },
  '13E': {
    zones: [
      { id: '01', width: 380, height: 170 },
      { id: '02', width: 370, height: 170 },
      { id: '03', width: 360, height: 170 },
    ],
  },
};

interface Locker {
  locker_id: string;
  locker_number: string;
  x_coordinate: number | null;
  y_coordinate: number | null;
}

function getZoneFromLockerNumber(lockerNumber: string): string {
  const parts = lockerNumber.split('-');
  return parts[1]; // Returns zone ID (e.g., "02")
}

function calculateAutoLayout(
  lockers: Locker[],
  floorNumber: string
): Map<string, { x: number; y: number }> {
  const positions = new Map<string, { x: number; y: number }>();
  const layout = floorLayouts[floorNumber as keyof typeof floorLayouts];

  if (!layout) {
    console.warn(`No layout found for floor ${floorNumber}`);
    return positions;
  }

  // Group lockers by zone
  const lockersByZone = new Map<string, Locker[]>();
  lockers.forEach((locker) => {
    const zoneId = getZoneFromLockerNumber(locker.locker_number);
    if (!lockersByZone.has(zoneId)) {
      lockersByZone.set(zoneId, []);
    }
    lockersByZone.get(zoneId)!.push(locker);
  });

  // Calculate positions for each zone
  lockersByZone.forEach((zoneLockers, zoneId) => {
    const zone = layout.zones.find((z) => z.id === zoneId);
    if (!zone) {
      console.warn(`Zone ${zoneId} not found in floor ${floorNumber} layout`);
      return;
    }

    // Calculate how many lockers fit per row
    const lockersPerRow = Math.max(
      1,
      Math.floor((zone.width - LOCKER_SPACING) / (LOCKER_SIZE + LOCKER_SPACING))
    );

    // Sort lockers by number
    const sortedLockers = [...zoneLockers].sort((a, b) =>
      a.locker_number.localeCompare(b.locker_number)
    );

    sortedLockers.forEach((locker, index) => {
      const row = Math.floor(index / lockersPerRow);
      const col = index % lockersPerRow;

      const x = col * (LOCKER_SIZE + LOCKER_SPACING) + LOCKER_SPACING;
      const y =
        row * (LOCKER_SIZE + LOCKER_SPACING) +
        LOCKER_SPACING +
        ZONE_LABEL_HEIGHT;

      positions.set(locker.locker_id, { x, y });
    });
  });

  return positions;
}

async function autoLayoutAllLockers() {
  const client = await pool.connect();

  try {
    console.log('Fetching all lockers...');

    // Get all lockers
    const result = await client.query<Locker>(`
      SELECT locker_id, locker_number, x_coordinate, y_coordinate
      FROM lockerhub.lockers
      ORDER BY locker_number
    `);

    const lockers = result.rows;
    console.log(`Found ${lockers.length} lockers`);

    // Group by floor
    const lockersByFloor = new Map<string, Locker[]>();
    lockers.forEach((locker) => {
      // Extract floor from locker number (e.g., "DL11E-05-09" -> "11E")
      const match = locker.locker_number.match(/^(L|DL)([^-]+)/);
      let floorNumber = match ? match[2] : '';
      
      // Special case: Floor 2W lockers should use Floor 2 layout
      if (floorNumber === '2W') {
        floorNumber = '2';
      }
      
      if (floorNumber && !lockersByFloor.has(floorNumber)) {
        lockersByFloor.set(floorNumber, []);
      }
      if (floorNumber) {
        lockersByFloor.get(floorNumber)!.push(locker);
      }
    });

    let totalUpdated = 0;

    // Process each floor
    for (const [floorNumber, floorLockers] of lockersByFloor.entries()) {
      console.log(`\nProcessing Floor ${floorNumber}...`);
      console.log(`  Lockers: ${floorLockers.length}`);

      const positions = calculateAutoLayout(floorLockers, floorNumber);

      if (positions.size === 0) {
        console.log(`  Skipped (no layout configured)`);
        continue;
      }

      // Update coordinates in database
      await client.query('BEGIN');

      try {
        for (const [lockerId, pos] of positions.entries()) {
          await client.query(
            `UPDATE lockerhub.lockers 
             SET x_coordinate = $1, y_coordinate = $2 
             WHERE locker_id = $3`,
            [pos.x, pos.y, lockerId]
          );
        }

        await client.query('COMMIT');
        totalUpdated += positions.size;
        console.log(`  Updated ${positions.size} lockers`);
      } catch (error) {
        await client.query('ROLLBACK');
        console.error(`  Error updating floor ${floorNumber}:`, error);
      }
    }

    console.log(`\nTotal lockers auto-positioned: ${totalUpdated}`);
  } catch (error) {
    console.error('Error:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the script
autoLayoutAllLockers().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
