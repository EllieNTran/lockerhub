# Import Scripts

## Staff Import

Import staff members from CSV file into the database.

### CSV Format

The CSV file should have the following columns:
- `Pers.No.` - Unique staff identifier
- `Full Name` - Staff member's full name (will be split into first/last name, last word = last name)
- `Capability` - Capability name (will be created if it doesn't exist)
- `Work Email` - Staff member's email address
- `Office` - Office location
- `Department (Label)` - Department name (will be created under capability if it doesn't exist)

### Usage

1. Install dependencies:
```bash
cd scripts
npm install
```

2. Set environment variables (or use .env file):
```bash
export DB_HOST=localhost
export DB_PORT=3000
export DB_NAME=postgres
export DB_USER=postgres
export DB_PASSWORD=postgres
```

3. Run the import:
```bash
npx ts-node import-staff.ts path/to/staff.csv
```

### What happens during import?

1. ✅ Creates capabilities if they don't exist
2. ✅ Creates departments under capabilities if they don't exist
3. ✅ Cleans office values (removes prefixes)
4. ✅ Splits full name into first and last name
5. ✅ Creates users with `is_pre_registered = true` and `account_activated = false`
6. ✅ No password is set (users must activate account to set password)
7. ✅ Skips users that already exist (by email or staff_number)
8. ✅ Provides detailed import summary

---

## Auto-Layout Lockers

Automatically calculate and save positions for all lockers based on their floor and zone layout.

### What it does

1. ✅ Fetches all lockers from the database
2. ✅ Groups lockers by floor and zone
3. ✅ Calculates optimal grid positions within each zone
4. ✅ Saves x_coordinate and y_coordinate to the database
5. ✅ Positions lockers with proper spacing (8px) and zone label clearance (40px)

### Usage

1. Make sure environment variables are set (same as staff import)

2. Run the auto-layout script:
```bash
npm run auto-layout
```

or

```bash
npx tsx auto-layout-lockers.ts
```

### When to run

- **Once** after initial locker import to set default positions
- After adding new lockers to the database
- To reset all locker positions to default layout

### Floor Layouts

Currently configured for:
- **Floor 2**: 10 zones with varying capacities
- **Floor 3**: 3 zones (10 lockers each)
- **Floor 4**: 3 zones (10 lockers each)
- **Floor 11**: 16 zones (10 lockers each)
- **Floor 11 East**: 5 zones (10 lockers each)

### After Running

Once positions are saved:
- Admins can use the Locker Configuration page to fine-tune positions
- Drag and drop to adjust individual locker placements
- Changes are saved as zone-relative coordinates

---

## Locker Import

Import lockers and keys from CSV files for each floor into the database.

### CSV Format

The CSV files should be named `floor{number}.csv` (e.g., `floor2.csv`, `floor10.csv`, `floor10east.csv`) and placed in the `data/` directory.

Required columns:
- `Floor` - Location identifier (e.g., "2W", "3E")
- `Locker number` or `Locker number ` - Unique locker identifier (e.g., "L2W-01-01")
- `Key Number` - Unique key identifier (e.g., "AA712")

Optional columns (for reference):
- `Staff number`, `Name`, `Email Address`, `Function`, `Start Date`, `End Date`, `Notes`

### Prerequisites

**IMPORTANT**: At least one admin user must exist in the database (floors will be created automatically by the admin user).

### Usage

1. Place CSV files in `scripts/data/` directory (e.g., `floor2.csv`, `floor3.csv`, etc.)

2. Set environment variables (or use .env file):
```bash
export DB_HOST=localhost
export DB_PORT=3000
export DB_NAME=postgres
export DB_USER=postgres
export DB_PASSWORD=postgres
```

3. Run the import:
```bash
npm run import-lockers
```

### What happens during import?

1. ✅ Automatically processes all `floor*.csv` files in the `data/` directory
2. ✅ Extracts floor number from filename (e.g., floor2.csv → Floor 2)
3. ✅ Creates floor if it doesn't exist (using first admin user)
4. ✅ Creates lockers with unique locker numbers
5. ✅ Creates keys associated with each locker
6. ✅ Skips FREE/placeholder entries (where Key Number is "FREE" or "#N/A")
7. ✅ Skips duplicate lockers and keys
8. ✅ Sets location from the Floor column
9. ✅ Sets initial status to 'available'
10. ✅ Provides detailed summary for each floor
