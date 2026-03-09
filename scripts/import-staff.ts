import { parse } from 'csv-parse/sync';
import { readFileSync } from 'fs';
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

interface StaffRecord {
  'Pers.No.': string;
  'Full Name': string;
  'Capability': string;
  'Work Email': string;
  'Office': string;
  'Department (Label)': string;
}

function cleanOfficeValue(office: string): string {
  return office
    .replace(/^KPMG LLP\s*/i, '')
    .replace(/^KPMG\s*/i, '')
    .trim();
}

async function importStaff(csvFilePath: string) {
  try {
    let fileContent = readFileSync(csvFilePath, 'utf-8');
    
    // Remove BOM if present
    if (fileContent.charCodeAt(0) === 0xFEFF) {
      fileContent = fileContent.substring(1);
    }
    
    const records: StaffRecord[] = parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });

    console.log(`Found ${records.length} staff records to import`);

    let imported = 0;
    let skipped = 0;
    let errors = 0;

    for (const record of records) {
      try {
        // Parse full name into first and last name
        const fullName = record['Full Name'].trim();
        const nameParts = fullName.split(/\s+/);
        const lastName = nameParts[nameParts.length - 1];
        const firstName = nameParts.slice(0, -1).join(' ');

        const staffNumber = record['Pers.No.']?.trim();
        const email = record['Work Email'].toLowerCase().trim();
        const departmentName = record['Department (Label)']?.trim();
        const capabilityName = record['Capability']?.trim();
        const office = cleanOfficeValue(record['Office']);

        if (!staffNumber || !email || !departmentName || !capabilityName) {
          console.warn(`Skipping record with missing fields - Staff: ${staffNumber}, Email: ${email}`);
          skipped++;
          continue;
        }

        // Find or create capability
        let capabilityResult = await pool.query(
          'SELECT capability_id FROM lockerhub.capabilities WHERE LOWER(name) = LOWER($1)',
          [capabilityName]
        );

        let capabilityId: number;
        if (capabilityResult.rows.length === 0) {
          // Create capability if it doesn't exist
          const newCapability = await pool.query(
            'INSERT INTO lockerhub.capabilities (name) VALUES ($1) RETURNING capability_id',
            [capabilityName]
          );
          capabilityId = newCapability.rows[0].capability_id;
          console.log(`Created capability: ${capabilityName}`);
        } else {
          capabilityId = capabilityResult.rows[0].capability_id;
        }

        // Find or create department
        let deptResult = await pool.query(
          'SELECT department_id FROM lockerhub.departments WHERE LOWER(name) = LOWER($1)',
          [departmentName]
        );

        let departmentId: number;
        if (deptResult.rows.length === 0) {
          // Create department if it doesn't exist
          const newDept = await pool.query(
            'INSERT INTO lockerhub.departments (name, capability_id) VALUES ($1, $2) RETURNING department_id',
            [departmentName, capabilityId]
          );
          departmentId = newDept.rows[0].department_id;
          console.log(`Created department: ${departmentName} under ${capabilityName}`);
        } else {
          departmentId = deptResult.rows[0].department_id;
        }

        // Check if user already exists
        const existingUser = await pool.query(
          'SELECT user_id FROM lockerhub.users WHERE email = $1 OR staff_number = $2',
          [email, staffNumber]
        );

        if (existingUser.rows.length > 0) {
          console.log(`User already exists: ${email}`);
          skipped++;
          continue;
        }

        // Insert pre-registered user (no password)
        await pool.query(
          `INSERT INTO lockerhub.users 
           (first_name, last_name, email, staff_number, department_id, office, 
            is_pre_registered, account_activated, role)
           VALUES ($1, $2, $3, $4, $5, $6, TRUE, FALSE, 'user')`,
          [
            firstName,
            lastName,
            email,
            staffNumber,
            departmentId,
            office,
          ]
        );

        console.log(`Imported: ${email}`);
        imported++;
      } catch (err) {
        console.error(`Error importing ${record['Work Email']}:`, err);
        errors++;
      }
    }

    console.log('\n=== Import Summary ===');
    console.log(`Imported: ${imported}`);
    console.log(`Skipped: ${skipped}`);
    console.log(`Errors: ${errors}`);
    console.log(`Total: ${records.length}`);
  } catch (error) {
    console.error('Failed to import staff:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run the import
const csvPath = process.argv[2] || './hc.csv';
console.log(`Importing staff from: ${csvPath}\n`);
importStaff(csvPath);
