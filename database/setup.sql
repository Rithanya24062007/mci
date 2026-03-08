-- Complete Database Setup Script
-- Run this to create and initialize the database

-- Create database (run this as postgres superuser first)
-- CREATE DATABASE queue_management;

-- Connect to the database and run the rest:
-- \c queue_management;

-- Drop existing tables if they exist (for clean setup)
DROP TABLE IF EXISTS live_tracking_data CASCADE;
DROP TABLE IF EXISTS devices CASCADE;
DROP TABLE IF EXISTS tokens CASCADE;
DROP TABLE IF EXISTS staff_queue CASCADE;
DROP TABLE IF EXISTS staff CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS customers CASCADE;

-- Create users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'staff')),
    staff_id INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create staff table
CREATE TABLE staff (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    live_tracking_enabled BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create staff_queue table
CREATE TABLE staff_queue (
    staff_id INTEGER PRIMARY KEY REFERENCES staff(id) ON DELETE CASCADE,
    last_issued_token INTEGER DEFAULT 0,
    current_serving_token INTEGER DEFAULT 0,
    last_reset_date DATE DEFAULT CURRENT_DATE
);

-- Create customers table
CREATE TABLE customers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(15) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE,
    password_hash VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create tokens table
CREATE TABLE tokens (
    id SERIAL PRIMARY KEY,
    staff_id INTEGER NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
    token_number INTEGER NOT NULL,
    status VARCHAR(50) NOT NULL CHECK (status IN ('waiting', 'serving', 'completed')),
    customer_name VARCHAR(255),
    customer_phone VARCHAR(15),
    customer_id INTEGER REFERENCES customers(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(staff_id, token_number)
);

-- Create devices table
CREATE TABLE devices (
    id SERIAL PRIMARY KEY,
    device_id VARCHAR(255) UNIQUE NOT NULL,
    mapped_staff_id INTEGER REFERENCES staff(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create live_tracking_data table
CREATE TABLE live_tracking_data (
    id SERIAL PRIMARY KEY,
    staff_id INTEGER NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
    sensor_value DECIMAL(10, 2),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX idx_tokens_staff_id ON tokens(staff_id);
CREATE INDEX idx_tokens_status ON tokens(status);
CREATE INDEX idx_tokens_customer_id ON tokens(customer_id);
CREATE INDEX idx_tokens_customer_phone ON tokens(customer_phone);
CREATE INDEX idx_customers_phone ON customers(phone);
CREATE INDEX idx_customers_email ON customers(email);
CREATE INDEX idx_staff_active ON staff(is_active);
CREATE INDEX idx_staff_tracking ON staff(live_tracking_enabled);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_devices_device_id ON devices(device_id);
CREATE INDEX idx_live_tracking_staff_id ON live_tracking_data(staff_id);
CREATE INDEX idx_live_tracking_timestamp ON live_tracking_data(timestamp);

-- Add foreign key constraint for users.staff_id
ALTER TABLE users ADD CONSTRAINT fk_users_staff 
    FOREIGN KEY (staff_id) REFERENCES staff(id) ON DELETE SET NULL;

-- Insert initial admin user
-- Password: admin123 (hashed with bcrypt)
INSERT INTO users (name, email, password_hash, role, staff_id) 
VALUES (
    'System Admin', 
    'admin@example.com', 
    '$2b$10$YQ8P8TQOy.Zm5YxXJ9Rq1eLKhVHZGP8cXxJ9JnCxKGp8Zm5YxXJ9Rq',
    'admin', 
    NULL
);

-- Success message
SELECT 'Database setup completed successfully!' AS status;
SELECT 'You can now login with: admin@example.com / admin123' AS credentials;
