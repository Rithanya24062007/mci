# Token Reservation System - PostgreSQL Version

A comprehensive token reservation system with **PostgreSQL database** and ESP32 integration for crowd control in banks and public places. The system uses ultrasonic sensors to monitor queue entry and exit, and provides a web interface for customers to book tokens and staff to manage appointments.

## 🆕 What's New - PostgreSQL Integration

- ✅ **Persistent Data Storage** - All data stored in PostgreSQL database
- ✅ **JWT Authentication** - Secure token-based authentication
- ✅ **Password Hashing** - bcrypt encryption for staff passwords
- ✅ **RESTful API** - Complete API endpoints for all operations
- ✅ **Database Relationships** - Proper foreign keys and constraints
- ✅ **Automatic Token Numbers** - Daily reset with PostgreSQL function
- ✅ **Connection Pooling** - Optimized database connections

## Features

### Customer Features
- 🔐 Simple phone-based login/registration
- 📱 Book tokens for specific staff members
- ⏱️ View estimated wait time and queue position
- 👥 See number of people ahead in queue
- ❌ Cancel tokens
- 📊 Real-time queue status updates

### Staff Features
- 🔐 Secure staff login with password
- 📋 View all appointments assigned to them
- 🔔 Call next token in queue
- ✅ Mark tokens as completed
- 📊 View daily statistics (pending, completed)
- 🔍 Filter appointments by status

### Hardware Integration
- 📡 ESP32 with dual ultrasonic sensors
- 🚪 Automatic entry/exit detection
- 📈 Real-time queue count updates
- 🌐 WiFi connectivity to server

## Technology Stack

### Frontend
- HTML5
- CSS3 (Responsive Design)
- Vanilla JavaScript
- SessionStorage for auth tokens

### Backend
- Node.js
- Express.js
- PostgreSQL Database
- JWT Authentication
- bcrypt Password Hashing
- CORS enabled

### Hardware
- ESP32 Development Board
- 2x HC-SR04 Ultrasonic Sensors
- WiFi connectivity

## Prerequisites

- **Node.js** (v14 or higher)
- **PostgreSQL** (v12 or higher)
- **npm** (Node Package Manager)
- **Arduino IDE** (for ESP32 programming) - optional

## Quick Start

### 1. Install PostgreSQL

Download and install PostgreSQL from: https://www.postgresql.org/download/

During installation, remember your `postgres` user password!

### 2. Create Database

Open Command Prompt or PowerShell:

```powershell
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE token_reservation;

# Connect to database
\c token_reservation

# Load schema (update path to your location)
\i E:/project/mcir/database/schema.sql

# Exit
\q
```

### 3. Configure Environment

Copy `.env.example` to `.env` and update with your PostgreSQL credentials:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=token_reservation
DB_USER=postgres
DB_PASSWORD=your_postgres_password
JWT_SECRET=your_secret_key
PORT=3000
```

### 4. Install Dependencies

```powershell
cd E:\project\mcir
npm install
```

### 5. Test Database Connection

```powershell
node test-db.js
```

You should see:
```
✓ Database connection successful!
✓ Tables found: customers, staff, tokens, queue_count
✓ Staff members: 4
✓ Current queue count: 0
🎉 Database is ready to use!
```

### 6. Start the Server

```powershell
npm start
```

Output:
```
========================================
Token Reservation System
========================================
✓ Server running on http://localhost:3000
✓ Environment: development
✓ Database connected successfully
========================================
```

### 7. Access the Application

Open your browser: **http://localhost:3000**

## Default Login Credentials

### Staff Login
All staff passwords are `pass123`:

| Staff ID | Name | Department | Password |
|----------|------|------------|----------|
| staff1 | John Doe | General | pass123 |
| staff2 | Jane Smith | Accounts | pass123 |
| staff3 | Mike Johnson | Loans | pass123 |
| staff4 | Sarah Williams | Customer Service | pass123 |

### Customer Login
- Use any phone number and name
- System will auto-register new customers

## Project Structure

```
mcir/
├── server.js                      # Main server with API routes
├── package.json                   # Dependencies
├── .env.example                   # Environment template
├── .env                          # Your configuration (not in git)
├── test-db.js                    # Database connection test
├── config/
│   └── database.js               # PostgreSQL connection pool
├── database/
│   └── schema.sql                # Database schema
├── public/                        # Frontend files
│   ├── login.html                # Login page
│   ├── customer-dashboard.html   # Customer interface
│   ├── staff-dashboard.html      # Staff interface
│   ├── css/
│   │   └── style.css            # Styling
│   └── js/
│       ├── login.js             # Login logic with API calls
│       ├── customer.js          # Customer dashboard with API
│       └── staff.js             # Staff dashboard with API
├── esp32_queue_monitor/
│   └── esp32_queue_monitor.ino  # ESP32 Arduino code
├── README.md                     # This file
├── DATABASE_SETUP.md             # Detailed database guide
├── HARDWARE_SETUP.md             # ESP32 hardware guide
└── QUICK_START.md               # Quick start guide

```

## API Endpoints

### Authentication
- `POST /api/auth/customer` - Customer login/register
- `POST /api/auth/staff` - Staff login

### Staff
- `GET /api/staff` - Get all staff members

### Tokens
- `POST /api/tokens` - Book new token (auth required)
- `GET /api/tokens/my-token` - Get customer's current token (auth required)
- `PUT /api/tokens/:id/cancel` - Cancel token (auth required)
- `GET /api/tokens/staff/:staffId` - Get staff appointments (auth required)
- `PUT /api/tokens/call-next/:staffId` - Call next token (auth required)
- `PUT /api/tokens/:id/call` - Call specific token (auth required)
- `PUT /api/tokens/:id/complete` - Complete token (auth required)

### Statistics
- `GET /api/stats` - Get today's statistics

### Queue (ESP32)
- `POST /api/queue/update` - Update queue count
- `GET /api/queue/count` - Get current queue count

## Database Schema

### Tables

**customers**: Customer information
- `id`, `phone` (unique), `name`, `registered_at`

**staff**: Staff members
- `id`, `name`, `password` (hashed), `department`, `created_at`

**tokens**: Token bookings
- `id`, `token_number`, `customer_phone`, `staff_id`, `purpose`, `status`, timestamps

**queue_count**: Real-time queue tracking
- `id`, `current_count`, `updated_at`

See [DATABASE_SETUP.md](DATABASE_SETUP.md) for detailed schema information.

## ESP32 Hardware Setup

See [HARDWARE_SETUP.md](HARDWARE_SETUP.md) for complete wiring guide and installation instructions.

### Quick Hardware Setup

1. Connect Entry Sensor:
   - VCC → 5V, GND → GND
   - Trigger → GPIO 5, Echo → GPIO 18

2. Connect Exit Sensor:
   - VCC → 5V, GND → GND
   - Trigger → GPIO 19, Echo → GPIO 21

3. Update WiFi credentials in `esp32_queue_monitor.ino`

4. Upload to ESP32

## How to Use

### For Customers

1. **Login** - Enter phone number and name
2. **Select Staff** - Choose from dropdown
3. **Book Token** - Add purpose (optional) and submit
4. **Monitor** - View token status and wait time
5. **Cancel** - Cancel anytime before service starts

### For Staff

1. **Login** - Use staff ID and password
2. **View Queue** - See all pending appointments
3. **Call Next** - Click to serve next customer
4. **Complete** - Mark service as done
5. **Filter** - View by status (waiting/called)

## Security Features

- ✅ JWT token authentication
- ✅ Password hashing with bcrypt
- ✅ SQL injection prevention (parameterized queries)
- ✅ Token expiration (24 hours)
- ✅ Environment variable protection

## Development

### Running in Development

```powershell
npm start
```

### Database Backup

```powershell
pg_dump -U postgres token_reservation > backup.sql
```

### Database Restore

```powershell
psql -U postgres token_reservation < backup.sql
```

### Reset Database

```powershell
psql -U postgres
DROP DATABASE token_reservation;
CREATE DATABASE token_reservation;
\c token_reservation
\i E:/project/mcir/database/schema.sql
\q
```

## Troubleshooting

### Server won't start

- Check if PostgreSQL is running
- Verify `.env` credentials
- Run `node test-db.js` to test connection

### Database connection error

```powershell
# Check PostgreSQL service
Get-Service -Name postgresql*

# Start if stopped
Start-Service postgresql-x64-15
```

### Can't login as staff

- Verify credentials: `staff1` / `pass123`
- Check database has staff records:
  ```sql
  SELECT * FROM staff;
  ```

### Port 3000 in use

```powershell
# Find process using port
netstat -ano | findstr :3000

# Change PORT in .env file
```

### ESP32 not connecting

- Check WiFi credentials
- Verify server URL has correct IP
- Ensure both on same network
- Check Serial Monitor (115200 baud)

See [DATABASE_SETUP.md](DATABASE_SETUP.md) for more troubleshooting tips.

## Migration from LocalStorage

If you were using the localStorage version:

1. Data won't automatically migrate
2. All data now stored in PostgreSQL
3. Need to re-register customers
4. Staff credentials unchanged (staff1/pass123)
5. More reliable and persistent storage

## Production Deployment

For production use:

1. **Change Default Passwords**
   ```sql
   -- Generate new password hash
   -- Use bcrypt with rounds=10
   ```

2. **Update JWT Secret**
   - Use strong random string
   - Never commit to version control

3. **Enable HTTPS**
   - Use SSL/TLS certificates
   - Update server configuration

4. **Database Security**
   - Create dedicated database user
   - Grant minimal permissions
   - Enable SSL connection

5. **Environment Variables**
   - Use secure secret management
   - Never expose .env file

## Future Enhancements

- [ ] SMS notifications
- [ ] Email notifications  
- [ ] Admin dashboard
- [ ] Multiple branch support
- [ ] Mobile app
- [ ] Display board integration
- [ ] Analytics and reporting
- [ ] QR code token generation

## Documentation

- [DATABASE_SETUP.md](DATABASE_SETUP.md) - Complete database setup guide
- [HARDWARE_SETUP.md](HARDWARE_SETUP.md) - ESP32 hardware guide
- [QUICK_START.md](QUICK_START.md) - Quick start guide

## Support

For issues:
1. Check troubleshooting sections
2. Review [DATABASE_SETUP.md](DATABASE_SETUP.md)
3. Verify all prerequisites installed
4. Check logs for error messages

## License

This project is open source and available for educational purposes.

## Author

Developed for crowd control management in public spaces with PostgreSQL database integration.

---

**⚠️ Important:** This system now requires PostgreSQL database. The localStorage version is no longer active. All data is persisted in the database for reliability and scalability.
