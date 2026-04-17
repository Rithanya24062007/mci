-- ============================================================================
-- Queue Management System - Complete Database Setup
-- ============================================================================
-- This file creates the full schema and seeds representative data so the
-- backend, dashboards, and device routes can run from a single SQL file.
-- Run this on a fresh PostgreSQL database.
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
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS staff CASCADE;

-- ============================================================================
-- STEP 2: CREATE TABLES
-- ============================================================================

CREATE TABLE staff (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    counter_name VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    live_tracking_enabled BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'staff')),
    staff_id INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_users_staff FOREIGN KEY (staff_id) REFERENCES staff(id) ON DELETE SET NULL
);

CREATE TABLE staff_queue (
    staff_id INTEGER PRIMARY KEY REFERENCES staff(id) ON DELETE CASCADE,
    last_issued_token INTEGER DEFAULT 0,
    current_serving_token INTEGER DEFAULT 0,
    last_reset_date DATE DEFAULT CURRENT_DATE
);

CREATE TABLE customers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE,
    password_hash VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE tokens (
    id SERIAL PRIMARY KEY,
    staff_id INTEGER NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
    token_number INTEGER NOT NULL,
    status VARCHAR(50) NOT NULL CHECK (status IN ('waiting', 'serving', 'completed')),
    customer_name VARCHAR(255),
    customer_phone VARCHAR(20),
    customer_id INTEGER REFERENCES customers(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    UNIQUE(staff_id, token_number)
);

CREATE TABLE devices (
    id SERIAL PRIMARY KEY,
    device_id VARCHAR(255) UNIQUE NOT NULL,
    mapped_staff_id INTEGER REFERENCES staff(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE live_count (
    device_id VARCHAR(100) PRIMARY KEY,
    staff_id INTEGER REFERENCES staff(id) ON DELETE CASCADE,
    count INTEGER NOT NULL DEFAULT 0,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE sensor_events (
    id SERIAL PRIMARY KEY,
    device_id VARCHAR(100) NOT NULL,
    staff_id INTEGER REFERENCES staff(id) ON DELETE SET NULL,
    event_type VARCHAR(10) NOT NULL CHECK (event_type IN ('entry', 'exit')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE live_tracking_data (
    id SERIAL PRIMARY KEY,
    staff_id INTEGER NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
    sensor_value DECIMAL(10, 2),
    entry_sensor_value INTEGER,
    exit_sensor_value INTEGER,
    calculated_occupancy INTEGER,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- STEP 3: CREATE INDEXES
-- ============================================================================

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_staff_id ON users(staff_id);

CREATE INDEX idx_staff_active ON staff(is_active);
CREATE INDEX idx_staff_tracking ON staff(live_tracking_enabled);

CREATE INDEX idx_customers_phone ON customers(phone);
CREATE INDEX idx_customers_email ON customers(email);

CREATE INDEX idx_tokens_staff_id ON tokens(staff_id);
CREATE INDEX idx_tokens_status ON tokens(status);
CREATE INDEX idx_tokens_customer_id ON tokens(customer_id);
CREATE INDEX idx_tokens_customer_phone ON tokens(customer_phone);
CREATE INDEX idx_tokens_created_at ON tokens(created_at);

CREATE INDEX idx_devices_device_id ON devices(device_id);
CREATE INDEX idx_devices_mapped_staff_id ON devices(mapped_staff_id);

CREATE INDEX idx_live_count_staff_id ON live_count(staff_id);

CREATE INDEX idx_sensor_events_device_id ON sensor_events(device_id);
CREATE INDEX idx_sensor_events_staff_id ON sensor_events(staff_id);
CREATE INDEX idx_sensor_events_created_at ON sensor_events(created_at);

CREATE INDEX idx_live_tracking_staff_id ON live_tracking_data(staff_id);
CREATE INDEX idx_live_tracking_timestamp ON live_tracking_data(timestamp);

INSERT INTO users (name, email, password_hash, role, staff_id)
VALUES
    ('System Administrator', 'admin@queuepro.com', '$2b$10$jeWozsKmtFFGxFAqdVvaauBn.RZbJl6FT3upJNf8IpOqQFQETI66G', 'admin', NULL);

-- ============================================================================
-- STEP 5: COMPLETION MESSAGE
-- ============================================================================

SELECT 'Database setup completed successfully!' AS status;
SELECT 'Tables created: users, staff, staff_queue, customers, tokens, devices, live_count, sensor_events, live_tracking_data' AS info;
SELECT 'Default admin login: admin@queuepro.com / admin123' AS credentials;
SELECT 'Remember to change the default password after first login.' AS warning;

-- ============================================================================
-- END OF DATABASE SETUP
-- ============================================================================
