# Quick Setup Guide

## Prerequisites Checklist
- ✓ Node.js installed (check: `node --version`)
- ✓ PostgreSQL installed (check: `psql --version`)
- ✓ npm packages installed (check: `npm list` in project directory)

## Database Setup

### 1. Create Database
```bash
# Open PostgreSQL command line
psql -U postgres

# Create database
CREATE DATABASE queue_management;

# Exit
\q
```

### 2. Run Schema
```bash
psql -U postgres -d queue_management -f database/schema.sql
```

### 3. Seed Initial Data
```bash
psql -U postgres -d queue_management -f database/seed.sql
```

## Environment Configuration

The `.env` file is already created. Review and update:
- `DB_PASSWORD` - Your PostgreSQL password
- `JWT_SECRET` - Change to a secure random string
- `DEVICE_API_KEY` - Change to a secure random string

## Start the Application

```bash
npm start
```

The server will start on http://localhost:3000

## Access the System

### Customer Interface
URL: http://localhost:3000
- No login required
- Book tokens and track queue status

### Staff Login
URL: http://localhost:3000/login.html
Credentials (sample):
- Email: sarah.johnson@example.com
- Password: admin123

### Admin Login
URL: http://localhost:3000/login.html
Credentials:
- Email: admin@example.com
- Password: admin123

⚠️ **IMPORTANT**: Change all default passwords immediately!

## ESP32 Integration

### API Endpoint
POST http://localhost:3000/api/device/update

### Headers
```
x-device-key: esp32_device_secret_key_change_in_production_a1b2c3d4e5f6
Content-Type: application/json
```

### Payload Example
```json
{
  "device_id": "ESP32_001",
  "entry_sensor_value": 25,
  "exit_sensor_value": 18,
  "timestamp": "2026-03-01T12:00:00Z"
}
```

### Test with curl
```bash
curl -X POST http://localhost:3000/api/device/update ^
  -H "x-device-key: esp32_device_secret_key_change_in_production_a1b2c3d4e5f6" ^
  -H "Content-Type: application/json" ^
  -d "{\"device_id\":\"ESP32_001\",\"entry_sensor_value\":25,\"exit_sensor_value\":18,\"timestamp\":\"2026-03-01T12:00:00Z\"}"
```

## Troubleshooting

### Database Connection Error
- Check PostgreSQL is running: `pg_isready`
- Verify credentials in `.env`
- Ensure database exists: `psql -U postgres -l`

### Port Already in Use
- Change PORT in `.env` file
- Or kill process on port 3000: `netstat -ano | findstr :3000`

### Authentication Errors
- Check JWT_SECRET is set in `.env`
- Clear browser localStorage and try again
- Verify user exists in database

## Next Steps

1. ✅ Change default passwords
2. ✅ Update JWT_SECRET and DEVICE_API_KEY
3. ✅ Map ESP32 device in Admin Dashboard
4. ✅ Enable live tracking for a staff member
5. ✅ Test complete workflow

## Production Deployment

Before deploying to production:
- Set `NODE_ENV=production` in `.env`
- Use HTTPS (required for secure JWT transmission)
- Update CORS `ALLOWED_ORIGINS` to your domain
- Use strong passwords and secrets
- Set up database backups
- Configure firewall rules
- Use a process manager (PM2 recommended)

## Support

For issues or questions, refer to the main README.md file.
