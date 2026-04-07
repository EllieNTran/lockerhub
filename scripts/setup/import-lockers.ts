/**
 * Import Lockers from CSV
 * 
 * Imports locker data from a CSV file into the database.
 * This is intended to be run as a one-time script using Facility Management's existing CSV.
 */

import { parse } from 'csv-parse/sync';
import { readFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { Pool } from 'pg';
import { config } from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3000'),
  database: process.env.DB_NAME || 'postgres',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
});

interface LockerRecord {
  'Floor'?: string;
  'Location'?: string;
  'Locker number '?: string;
  'Locker number'?: string;
  'Locker Number'?: string;
  'Key Number': string;
  'Staff number': string;
  'Name': string;
  'Email Address': string;
  'Function': string;
  'Start Date': string;
  'End Date': string;
  'Notes': string;
}

async function getAdminUserId(): Promise<string | null> {
  const result = await pool.query(
    `SELECT user_id FROM lockerhub.users WHERE role = 'admin' LIMIT 1`
  );
  return result.rows.length > 0 ? result.rows[0].user_id : null;
}

async function getFloorId(floorNumber: string): Promise<string | null> {
  let result = await pool.query(
    'SELECT floor_id FROM lockerhub.floors WHERE number = $1',
    [floorNumber]
  );
  
  if (result.rows.length > 0) {
    return result.rows[0].floor_id;
  }

  console.log(`Floor ${floorNumber} doesn't exist, creating it...`);
  
  const adminUserId = await getAdminUserId();
  if (!adminUserId) {
    console.error('No admin user found in database. Cannot create floor.');
    return null;
  }
  
  try {
    const insertResult = await pool.query(
      `INSERT INTO lockerhub.floors (number, status, created_by, updated_by)
       VALUES ($1, 'open', $2, $3)
       RETURNING floor_id`,
      [floorNumber, adminUserId, adminUserId]
    );
    
    console.log(`Created Floor ${floorNumber}`);
    return insertResult.rows[0].floor_id;
  } catch (error: any) {
    console.error(`Error creating floor ${floorNumber}:`, error.message);
    return null;
  }
}

async function lockerExists(lockerNumber: string): Promise<boolean> {
  const result = await pool.query(
    'SELECT 1 FROM lockerhub.lockers WHERE locker_number = $1',
    [lockerNumber]
  );
  return result.rows.length > 0;
}

async function keyExists(keyNumber: string): Promise<boolean> {
  const result = await pool.query(
    'SELECT 1 FROM lockerhub.keys WHERE key_number = $1',
    [keyNumber]
  );
  return result.rows.length > 0;
}

async function importLockersFromCSV(csvFilePath: string, floorNumber: string) {
  try {
    console.log(`\nProcessing ${csvFilePath}...`);
    let fileContent = readFileSync(csvFilePath, 'utf-8');

    if (fileContent.charCodeAt(0) === 0xFEFF) {
      fileContent = fileContent.substring(1);
    }
    
    const records: LockerRecord[] = parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      relax_column_count: true,
      relax_quotes: true,
    });

    console.log(`Found ${records.length} records`);

    const adminUserId = await getAdminUserId();
    if (!adminUserId) {
      console.error('No admin user found in database. Cannot import lockers.');
      return;
    }

    const floorId = await getFloorId(floorNumber);
    if (!floorId) {
      console.error(`Unable to get or create Floor ${floorNumber}. Check that at least one admin user exists.`);
      return;
    }

    let lockersAdded = 0;
    let keysAdded = 0;
    let skipped = 0;

    for (const record of records) {
      let lockerNumber = (record['Locker number '] || record['Locker number'] || record['Locker Number'] || '').trim();
      let keyNumber = (record['Key Number'] || '').trim();
      let location = (record['Location'] || '').trim();

      if (!lockerNumber || !keyNumber) {
        if (lockerNumber && !keyNumber) {
          console.log(`Skipping ${lockerNumber}: missing key number`);
        }
        skipped++;
        continue;
      }

      if (!/^[DL]/.test(lockerNumber)) {
        skipped++;
        continue;
      }

      // Remove extra spaces from locker numbers
      lockerNumber = lockerNumber.replace(/\s+/g, '');
      
      // Remove rogue punctuation from key numbers
      keyNumber = keyNumber.replace(/[^A-Z0-9]/gi, '');
      
      // Trim location to max 30 characters
      if (location.length > 30) {
        location = location.substring(0, 30);
      }

      if (lockerNumber.length > 20 || keyNumber.length > 6) {
        console.log(`Skipping ${lockerNumber}: field too long`);
        skipped++;
        continue;
      }

      if (keyNumber.toUpperCase() === 'FREE' || keyNumber === '#N/A') {
        console.log(`Skipping free locker: ${lockerNumber}`);
        skipped++;
        continue;
      }

      try {
        if (await lockerExists(lockerNumber)) {
          console.log(`Locker ${lockerNumber} already exists, skipping`);
          skipped++;
          continue;
        }

        const lockerResult = await pool.query(
          `INSERT INTO lockerhub.lockers (locker_number, floor_id, location, status, created_by, updated_by)
           VALUES ($1, $2, $3, 'available', $4, $4)
           RETURNING locker_id`,
          [lockerNumber, floorId, location, adminUserId]
        );

        const lockerId = lockerResult.rows[0].locker_id;
        lockersAdded++;

        if (await keyExists(keyNumber)) {
          console.log(`Key ${keyNumber} already exists, skipping key creation for ${lockerNumber}`);
        } else {
          await pool.query(
            `INSERT INTO lockerhub.keys (key_number, locker_id, status, created_by, updated_by)
             VALUES ($1, $2, 'available', $3, $3)`,
            [keyNumber, lockerId, adminUserId]
          );
          keysAdded++;
        }

        console.log(`Added locker ${lockerNumber} with key ${keyNumber} at ${location}`);
      } catch (error: any) {
        console.error(`Error inserting locker ${lockerNumber}:`, error.message);
        skipped++;
      }
    }

    console.log(`\nSummary for Floor ${floorNumber}:`);
    console.log(`   - Lockers added: ${lockersAdded}`);
    console.log(`   - Keys added: ${keysAdded}`);
    console.log(`   - Skipped: ${skipped}`);
  } catch (error) {
    console.error(`Error processing ${csvFilePath}:`, error);
  }
}

async function main() {
  try {
    const dataDir = join(__dirname, 'data');
    const files = readdirSync(dataDir).filter(f => f.endsWith('.csv') && f.startsWith('floor'));

    console.log(`Starting locker import...`);
    console.log(`Found ${files.length} floor CSV files`);

    for (const file of files.sort()) {
      // Extract floor identifier from filename (e.g., floor2.csv -> "2", floor10east.csv -> "10 East")
      const match = file.match(/floor([\d]+)([a-z]*)/);
      if (!match) {
        console.log(`Skipping ${file} - cannot extract floor number`);
        continue;
      }

      const floorNum = match[1];
      const direction = match[2];
      
      const floorNumber = direction 
        ? `${floorNum} ${direction.charAt(0).toUpperCase() + direction.slice(1)}`
        : floorNum;
      
      const csvPath = join(dataDir, file);
      
      await importLockersFromCSV(csvPath, floorNumber);
    }

    console.log(`\nImport complete!`);
  } catch (error) {
    console.error('Fatal error:', error);
  } finally {
    await pool.end();
  }
}

main();
