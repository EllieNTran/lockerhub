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

### After Import

Pre-registered users will need to:
1. Visit the login page
2. Click "Forgot Password" to activate their account
3. Receive an email with activation link
4. Set their password
5. Login with their credentials
