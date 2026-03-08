# Queue Management System

A comprehensive queue management system with real-time token tracking, staff management, and IoT device integration.

## Features
- 🎫 Token queue management with daily automatic reset
- 👥 Multi-counter staff support
- 📱 Customer portal for token booking
- 📊 Real-time queue status display
- 🔌 ESP32 IoT device integration for people counting
- 👨‍💼 Admin dashboard for staff and device management
- 🔐 Secure authentication for admin, staff, and customers

## Setup Instructions

### 1. Configure Database
Edit `backend/.env` file and update PostgreSQL credentials:
```
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_postgres_password
DB_NAME=queue_management
```

### 2. Install Dependencies
```bash
cd backend
npm install
```

### 3. Database Setup (Complete)
Run the single comprehensive SQL file that creates everything:

**Option A: Using psql command line**
```bash
psql -U postgres -d postgres -c "CREATE DATABASE queue_management;"
psql -U postgres -d queue_management -f ../database/complete_database.sql
```

**Option B: Using PostgreSQL GUI (pgAdmin, DBeaver, etc.)**
1. Create a new database named `queue_management`
2. Open and execute `database/complete_database.sql`

The script will:
- Drop existing tables (if any)
- Create all necessary tables
- Add indexes for performance
- Insert default admin user
- Display setup completion message

### 4. Start Backend Server
```bash
npm start
```

Or for development with auto-reload:
```bash
npm run dev
```

### 5. Access the Application
- **Public Display**: `http://localhost:3000/` or open `frontend/index.html`
- **Admin Dashboard**: Login with admin credentials
- **Staff Dashboard**: Login with staff credentials
- **Customer Portal**: `frontend/customer-auth.html`

## Default Admin Credentials
- **Email**: `admin@queuepro.com`
- **Password**: `admin123`

⚠️ **IMPORTANT**: Change the admin password immediately after first login!

## Database Tables

The system includes the following tables:
- **users** - Admin and staff accounts
- **staff** - Counter staff members with configuration
- **staff_queue** - Token counters (resets daily at midnight)
- **customers** - Customer accounts for booking
- **tokens** - Queue tokens with status tracking
- **devices** - ESP32 IoT devices registration
- **live_count** - Real-time people count per device
- **sensor_events** - Entry/exit event logs
- **live_tracking_data** - Historical sensor readings

## API Endpoints

### Public Routes
- `GET /public/staff` - Get active staff list
- `GET /public/staff/:id/queue` - Get queue info for specific staff
- `POST /public/book` - Book a token
- `GET /public/staff/:id/current` - Get current serving token

### Authentication
- `POST /auth/login` - User login (admin/staff)
- `POST /auth/customer/register` - Customer registration
- `POST /auth/customer/login` - Customer login

### Admin Routes (require admin authentication)
- `POST /admin/staff` - Create new staff
- `GET /admin/staff/list` - Get all staff
- `PUT /admin/staff/:id` - Update staff details
- `PATCH /admin/staff/:id/toggle-tracking` - Toggle live tracking
- `POST /admin/device/map` - Map ESP32 device to staff

### Staff Routes (require staff authentication)
- `GET /staff/queue` - Get own queue data
- `POST /staff/next` - Move to next token
- `GET /staff/:id/tracking-status` - Get tracking status
- `GET /staff/:id/live-data` - Get live tracking data

### Device Routes (for ESP32 devices)
- `POST /device/register` - Register new device
- `POST /device/push` - Push sensor data
- `GET /device/:deviceId/status` - Get device status

### Customer Routes (require customer authentication)
- `GET /customer/profile` - Get customer profile
- `GET /customer/tokens` - Get customer's active tokens
- `POST /customer/book` - Book a token (authenticated)

## Daily Queue Reset

The system automatically resets all token counters to zero at the start of each new day:
- Tokens start from 1 each day
- Previous day's uncompleted tokens are marked as completed
- Reset happens automatically when the first booking or staff login occurs after midnight
- No manual intervention required

## ESP32 IoT Integration

The system supports ESP32 devices with dual ultrasonic sensors for people counting:
- Automatic entry/exit detection
- Real-time count updates
- Device-to-staff mapping
- Historical data logging

## Project Structure
```
mcir/
├── backend/
│   ├── config/          # Database configuration
│   ├── controllers/     # Route controllers
│   ├── middleware/      # Authentication middleware
│   ├── routes/          # API routes
│   ├── utils/           # Utility functions (queue reset, etc.)
│   └── server.js        # Main server file
├── frontend/
│   ├── css/            # Stylesheets
│   ├── js/             # Frontend JavaScript
│   ├── index.html      # Public display
│   ├── login.html      # Login page
│   ├── admin-dashboard.html
│   ├── staff-dashboard.html
│   └── customer-auth.html
├── database/
│   └── complete_database.sql  # Complete database setup
└── esp32/
    └── people_counter/  # Arduino code for ESP32
```

## Development

### Running Migrations
If you need to add features, create migration scripts in `backend/`:
```bash
node migrate_script_name.js
```

### Testing
1. Start the backend server
2. Open `frontend/index.html` in a browser
3. Test token booking and queue management

## Security Notes

- All passwords are hashed using bcrypt
- JWT tokens are used for authentication
- Admin, staff, and customer roles are properly segregated
- SQL injection protection via parameterized queries
- CORS enabled for frontend integration

## Troubleshooting

**Database connection failed**
- Check PostgreSQL is running
- Verify credentials in `.env` file
- Ensure database `queue_management` exists

**Migration failed**
- Check PostgreSQL user permissions
- Verify database exists before running migrations

**Frontend not connecting to backend**
- Ensure backend server is running on port 3000
- Check for CORS errors in browser console
- Verify API_BASE_URL in frontend JavaScript files

## License

MIT License - feel free to use for your projects!
