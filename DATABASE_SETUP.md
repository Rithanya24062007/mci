# PostgreSQL Database Setup Guide

This guide will help you set up PostgreSQL database for the Token Reservation System.

## Prerequisites

- PostgreSQL 12 or higher installed on your system
- Node.js and npm installed
- Basic knowledge of database operations

## Step 1: Install PostgreSQL

### Windows

1. Download PostgreSQL from: https://www.postgresql.org/download/windows/
2. Run the installer
3. During installation:
   - Set a password for the `postgres` user (remember this!)
   - Default port: 5432
   - Install pgAdmin 4 (optional but recommended)

### Verify Installation

Open PowerShell or Command Prompt:
```powershell
psql --version
```

You should see something like: `psql (PostgreSQL) 15.x`

## Step 2: Create Database and User

### Option A: Using psql (Command Line)

1. Open Command Prompt as Administrator

2. Connect to PostgreSQL:
```powershell
psql -U postgres
```
Enter your postgres password when prompted.

3. Create the database:
```sql
CREATE DATABASE token_reservation;
```

4. Connect to the new database:
```sql
\c token_reservation
```

5. Run the schema file:
```sql
\i E:/project/mcir/database/schema.sql
```

OR copy and paste the contents of `database/schema.sql` into the psql prompt.

6. Exit psql:
```sql
\q
```

### Option B: Using pgAdmin 4 (GUI)

1. Open pgAdmin 4

2. Right-click on "Databases" → "Create" → "Database"
   - Name: `token_reservation`
   - Owner: `postgres`
   - Click "Save"

3. Right-click on `token_reservation` → "Query Tool"

4. Open and run `database/schema.sql`:
   - Click "Open File" icon
   - Navigate to `E:\project\mcir\database\schema.sql`
   - Click "Execute" (F5)

5. Verify tables were created:
   - Expand `token_reservation` → "Schemas" → "public" → "Tables"
   - You should see: `customers`, `staff`, `tokens`, `queue_count`

## Step 3: Configure Environment Variables

1. Copy the example environment file:
```powershell
cd E:\project\mcir
Copy-Item .env.example .env
```

2. Edit `.env` file with your database credentials:
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=token_reservation
DB_USER=postgres
DB_PASSWORD=your_postgres_password_here
JWT_SECRET=your_secret_key_here
PORT=3000
```

**Important:** Change `your_postgres_password_here` to your actual PostgreSQL password!

## Step 4: Install Dependencies

```powershell
npm install
```

This will install:
- `pg` - PostgreSQL client for Node.js
- `dotenv` - Environment variable loader
- `bcrypt` - Password hashing
- `jsonwebtoken` - JWT authentication

## Step 5: Verify Database Setup

Run this query in psql or pgAdmin to verify:

```sql
-- Check tables
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public';

-- Check staff members (should have 4 rows)
SELECT id, name, department FROM staff;

-- Check initial queue count (should be 0)
SELECT * FROM queue_count;
```

## Step 6: Start the Server

```powershell
npm start
```

You should see:
```
========================================
Token Reservation System
========================================
✓ Server running on http://localhost:3000
✓ Environment: development
✓ Connected to PostgreSQL database
✓ Database connected successfully
========================================
```

## Default Staff Credentials

All staff passwords are `pass123`:

| Staff ID | Name | Department | Password |
|----------|------|------------|----------|
| staff1 | John Doe | General | pass123 |
| staff2 | Jane Smith | Accounts | pass123 |
| staff3 | Mike Johnson | Loans | pass123 |
| staff4 | Sarah Williams | Customer Service | pass123 |

## Database Schema Overview

### Tables

**customers**
- `id` (SERIAL, Primary Key)
- `phone` (VARCHAR, Unique)
- `name` (VARCHAR)
- `registered_at` (TIMESTAMP)

**staff**
- `id` (VARCHAR, Primary Key)
- `name` (VARCHAR)
- `password` (VARCHAR - bcrypt hashed)
- `department` (VARCHAR)
- `created_at` (TIMESTAMP)

**tokens**
- `id` (SERIAL, Primary Key)
- `token_number` (INTEGER)
- `customer_phone` (VARCHAR, Foreign Key)
- `customer_name` (VARCHAR)
- `staff_id` (VARCHAR, Foreign Key)
- `purpose` (TEXT)
- `status` (VARCHAR: waiting, called, completed, cancelled)
- `created_at` (TIMESTAMP)
- `called_at` (TIMESTAMP)
- `completed_at` (TIMESTAMP)

**queue_count**
- `id` (INTEGER, Primary Key)
- `current_count` (INTEGER)
- `updated_at` (TIMESTAMP)

## API Authentication

The system now uses JWT (JSON Web Tokens) for authentication:

1. **Login** returns a token
2. Token is stored in `sessionStorage`
3. All API requests include token in `Authorization` header
4. Token expires after 24 hours

## Testing Database Connection

Create a test file `test-db.js`:

```javascript
const db = require('./config/database');

async function testConnection() {
    try {
        const result = await db.query('SELECT NOW()');
        console.log('✓ Database connection successful!');
        console.log('Current time:', result.rows[0].now);
        
        const staffResult = await db.query('SELECT COUNT(*) FROM staff');
        console.log('Staff count:', staffResult.rows[0].count);
        
        process.exit(0);
    } catch (error) {
        console.error('✗ Database connection failed:', error.message);
        process.exit(1);
    }
}

testConnection();
```

Run it:
```powershell
node test-db.js
```

## Troubleshooting

### Error: "password authentication failed"

**Solution:** 
- Check your password in `.env` file
- Verify PostgreSQL user credentials
- Try: `psql -U postgres` to test login

### Error: "database does not exist"

**Solution:**
```sql
-- Create database first
psql -U postgres
CREATE DATABASE token_reservation;
\q
```

### Error: "ECONNREFUSED"

**Solution:**
- Check if PostgreSQL service is running:
  ```powershell
  # Windows
  Get-Service -Name postgresql*
  
  # Start if stopped
  Start-Service postgresql-x64-15
  ```

### Error: "relation does not exist"

**Solution:**
- Run the schema.sql file again
- Verify you're connected to the correct database

### Port 5432 already in use

**Solution:**
- Check what's using the port:
  ```powershell
  netstat -ano | findstr :5432
  ```
- Change port in `.env` if needed

## Database Maintenance

### Backup Database

```powershell
pg_dump -U postgres token_reservation > backup.sql
```

### Restore Database

```powershell
psql -U postgres token_reservation < backup.sql
```

### Reset Database

```powershell
# Drop and recreate
psql -U postgres
DROP DATABASE token_reservation;
CREATE DATABASE token_reservation;
\c token_reservation
\i E:/project/mcir/database/schema.sql
\q
```

### View Logs

```sql
-- Today's tokens
SELECT * FROM tokens WHERE DATE(created_at) = CURRENT_DATE;

-- Current queue
SELECT * FROM queue_count;

-- Statistics
SELECT 
    status,
    COUNT(*) as count
FROM tokens
WHERE DATE(created_at) = CURRENT_DATE
GROUP BY status;
```

## Production Considerations

For production deployment:

1. **Change Default Passwords:**
   ```sql
   UPDATE staff SET password = '$2b$10$...' WHERE id = 'staff1';
   ```

2. **Use Strong JWT Secret:**
   - Generate random string for `JWT_SECRET`
   - Never commit `.env` to version control

3. **Enable SSL:**
   ```javascript
   // In config/database.js
   ssl: { rejectUnauthorized: false }
   ```

4. **Connection Pooling:**
   - Already configured in `config/database.js`
   - Adjust pool size based on load

5. **Regular Backups:**
   - Set up automated daily backups
   - Store backups securely

6. **Monitoring:**
   - Monitor connection pool usage
   - Track query performance
   - Set up alerts for errors

## Additional Resources

- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [node-postgres (pg) Guide](https://node-postgres.com/)
- [JWT Authentication](https://jwt.io/)

---

**Need Help?** Check the main [README.md](README.md) for more information.
