-- ============================================================================
-- Queue Management System - Complete Database Setup
-- ============================================================================
-- This file contains ALL database commands in one place
-- Run this on a fresh PostgreSQL installation to set up the entire system
-- ============================================================================

-- ============================================================================
-- STEP 1: DROP EXISTING TABLES (Clean Setup)
-- ============================================================================
DROP TABLE IF EXISTS sensor_events CASCADE;
DROP TABLE IF EXISTS live_count CASCADE;
DROP TABLE IF EXISTS live_tracking_data CASCADE;
DROP TABLE IF EXISTS devices CASCADE;
DROP TABLE IF EXISTS tokens CASCADE;
DROP TABLE IF EXISTS staff_queue CASCADE;
DROP TABLE IF EXISTS customers CASCADE;
DROP TABLE IF EXISTS staff CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- ============================================================================
-- STEP 2: CREATE TABLES
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Users Table (Admin and Staff accounts)
-- ----------------------------------------------------------------------------
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'staff')),
    staff_id INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------------------------
-- Staff Table (Counter staff members)
-- ----------------------------------------------------------------------------
CREATE TABLE staff (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    counter_name VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    live_tracking_enabled BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------------------------
-- Staff Queue Table (Token counters for each staff - with daily reset)
-- ----------------------------------------------------------------------------
CREATE TABLE staff_queue (
    staff_id INTEGER PRIMARY KEY REFERENCES staff(id) ON DELETE CASCADE,
    last_issued_token INTEGER DEFAULT 0,
    current_serving_token INTEGER DEFAULT 0,
    last_reset_date DATE DEFAULT CURRENT_DATE
);

-- ----------------------------------------------------------------------------
-- Customers Table (Customer authentication)
-- ----------------------------------------------------------------------------
CREATE TABLE customers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(15) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE,
    password_hash VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------------------------
-- Tokens Table (Queue tokens issued to customers)
-- ----------------------------------------------------------------------------
CREATE TABLE tokens (
    id SERIAL PRIMARY KEY,
    staff_id INTEGER NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
    token_number INTEGER NOT NULL,
    status VARCHAR(50) NOT NULL CHECK (status IN ('waiting', 'serving', 'completed')),
    customer_name VARCHAR(255),
    customer_phone VARCHAR(15),
    customer_id INTEGER REFERENCES customers(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    UNIQUE(staff_id, token_number)
);

-- ----------------------------------------------------------------------------
-- Devices Table (ESP32 IoT devices)
-- ----------------------------------------------------------------------------
CREATE TABLE devices (
    id SERIAL PRIMARY KEY,
    device_id VARCHAR(255) UNIQUE NOT NULL,
    mapped_staff_id INTEGER REFERENCES staff(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------------------------
-- Live Count Table (Real-time people count per device)
-- ----------------------------------------------------------------------------
CREATE TABLE live_count (
    device_id VARCHAR(100) PRIMARY KEY,
    staff_id INTEGER REFERENCES staff(id) ON DELETE CASCADE,
    count INTEGER NOT NULL DEFAULT 0,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------------------------
-- Sensor Events Table (Individual entry/exit events log)
-- ----------------------------------------------------------------------------
CREATE TABLE sensor_events (
    id SERIAL PRIMARY KEY,
    device_id VARCHAR(100) NOT NULL,
    staff_id INTEGER REFERENCES staff(id) ON DELETE SET NULL,
    event_type VARCHAR(10) NOT NULL CHECK (event_type IN ('entry', 'exit')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------------------------
-- Live Tracking Data Table (Historical sensor readings)
-- ----------------------------------------------------------------------------
CREATE TABLE live_tracking_data (
    id SERIAL PRIMARY KEY,
    staff_id INTEGER NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
    sensor_value DECIMAL(10, 2),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- STEP 3: CREATE INDEXES (Optimize Query Performance)
-- ============================================================================

-- Users table indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_staff_id ON users(staff_id);

-- Staff table indexes
CREATE INDEX idx_staff_active ON staff(is_active);
CREATE INDEX idx_staff_tracking ON staff(live_tracking_enabled);

-- Customers table indexes
CREATE INDEX idx_customers_phone ON customers(phone);
CREATE INDEX idx_customers_email ON customers(email);

-- Tokens table indexes
CREATE INDEX idx_tokens_staff_id ON tokens(staff_id);
CREATE INDEX idx_tokens_status ON tokens(status);
CREATE INDEX idx_tokens_customer_id ON tokens(customer_id);
CREATE INDEX idx_tokens_customer_phone ON tokens(customer_phone);
CREATE INDEX idx_tokens_created_at ON tokens(created_at);

-- Devices table indexes
CREATE INDEX idx_devices_device_id ON devices(device_id);
CREATE INDEX idx_devices_mapped_staff_id ON devices(mapped_staff_id);

-- Live count table indexes
CREATE INDEX idx_live_count_staff_id ON live_count(staff_id);

-- Sensor events table indexes
CREATE INDEX idx_sensor_events_device_id ON sensor_events(device_id);
CREATE INDEX idx_sensor_events_staff_id ON sensor_events(staff_id);
CREATE INDEX idx_sensor_events_created_at ON sensor_events(created_at);

-- Live tracking data table indexes
CREATE INDEX idx_live_tracking_staff_id ON live_tracking_data(staff_id);
CREATE INDEX idx_live_tracking_timestamp ON live_tracking_data(timestamp);

-- ============================================================================
-- STEP 4: ADD FOREIGN KEY CONSTRAINTS
-- ============================================================================
ALTER TABLE users ADD CONSTRAINT fk_users_staff 
    FOREIGN KEY (staff_id) REFERENCES staff(id) ON DELETE SET NULL;

-- ============================================================================
-- STEP 5: INSERT INITIAL ADMIN USER
-- ============================================================================

-- Default Admin Credentials
-- Email: admin@queuepro.com
-- Password: admin123
-- IMPORTANT: Change this password immediately after first login in production!

INSERT INTO users (name, email, password_hash, role, staff_id) 
VALUES (
    'System Administrator', 
    'admin@queuepro.com', 
    '$2b$10$jeWozsKmtFFGxFAqdVvaauBn.RZbJl6FT3upJNf8IpOqQFQETI66G',
    'admin', 
    NULL
);

-- ============================================================================
-- STEP 6: VERIFICATION & COMPLETION MESSAGE
-- ============================================================================
SELECT 'Database setup completed successfully!' AS status;
SELECT 'Tables Created:' AS info;
SELECT '  - users (admin and staff accounts)' AS tables;
SELECT '  - staff (counter staff members)' AS tables;
SELECT '  - staff_queue (token counters with daily reset)' AS tables;
SELECT '  - customers (customer accounts)' AS tables;
SELECT '  - tokens (queue tokens)' AS tables;
SELECT '  - devices (ESP32 IoT devices)' AS tables;
SELECT '  - live_count (real-time people count)' AS tables;
SELECT '  - sensor_events (entry/exit event logs)' AS tables;
SELECT '  - live_tracking_data (historical sensor data)' AS tables;
SELECT '' AS blank;
SELECT 'Default Admin Credentials:' AS credentials;
SELECT '  Email: admin@queuepro.com' AS email;
SELECT '  Password: admin123' AS password;
SELECT '' AS blank;
SELECT '⚠️  IMPORTANT: Change the admin password after first login!' AS warning;

-- ============================================================================
-- USEFUL MAINTENANCE COMMANDS
-- ============================================================================

-- Reset admin password to admin123:
-- UPDATE users 
-- SET password_hash = '$2b$10$jeWozsKmtFFGxFAqdVvaauBn.RZbJl6FT3upJNf8IpOqQFQETI66G'
-- WHERE email = 'admin@queuepro.com';

-- View all tables:
-- SELECT table_name FROM information_schema.tables 
-- WHERE table_schema = 'public' ORDER BY table_name;

-- View all indexes:
-- SELECT indexname, tablename FROM pg_indexes 
-- WHERE schemaname = 'public' ORDER BY tablename, indexname;

-- ============================================================================
-- END OF DATABASE SETUP
-- ============================================================================
