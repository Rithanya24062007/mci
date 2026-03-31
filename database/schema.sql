-- Token Reservation System Database Schema

-- Create database (run this separately first)
-- CREATE DATABASE token_reservation;

-- Connect to the database
-- \c token_reservation;

-- Customers table
CREATE TABLE IF NOT EXISTS customers (
    id SERIAL PRIMARY KEY,
    phone VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
        password VARCHAR(255)
    );

-- Staff table
CREATE TABLE IF NOT EXISTS staff (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    password VARCHAR(255) NOT NULL,
    department VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tokens table
CREATE TABLE IF NOT EXISTS tokens (
    id SERIAL PRIMARY KEY,
    token_number INTEGER NOT NULL,
    customer_phone VARCHAR(20) NOT NULL REFERENCES customers(phone),
    customer_name VARCHAR(100) NOT NULL,
    staff_id VARCHAR(50) NOT NULL REFERENCES staff(id),
    purpose TEXT,
    status VARCHAR(20) DEFAULT 'waiting' CHECK (status IN ('waiting', 'called', 'completed', 'cancelled')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    called_at TIMESTAMP,
    completed_at TIMESTAMP,
    CONSTRAINT fk_customer FOREIGN KEY (customer_phone) REFERENCES customers(phone) ON DELETE CASCADE,
    CONSTRAINT fk_staff FOREIGN KEY (staff_id) REFERENCES staff(id) ON DELETE CASCADE
);

-- Queue count table (for ESP32 tracking)
CREATE TABLE IF NOT EXISTS queue_count (
    id INTEGER PRIMARY KEY DEFAULT 1,
    current_count INTEGER DEFAULT 0,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT single_row CHECK (id = 1)
);

-- Insert initial queue count
INSERT INTO queue_count (id, current_count) VALUES (1, 0)
ON CONFLICT (id) DO NOTHING;

-- Insert default staff members
-- Note: All staff passwords are 'pass123' (hashed with bcrypt)
INSERT INTO staff (id, name, password, department) VALUES
('staff1', 'John Doe', '$2b$10$VDhjiRfBmmcR1iD4/4l2AOejN3sc01Ry4gOMcZMtlQKwcO6LPivye', 'General'),
('staff2', 'Jane Smith', '$2b$10$VDhjiRfBmmcR1iD4/4l2AOejN3sc01Ry4gOMcZMtlQKwcO6LPivye', 'Accounts'),
('staff3', 'Mike Johnson', '$2b$10$VDhjiRfBmmcR1iD4/4l2AOejN3sc01Ry4gOMcZMtlQKwcO6LPivye', 'Loans'),
('staff4', 'Sarah Williams', '$2b$10$VDhjiRfBmmcR1iD4/4l2AOejN3sc01Ry4gOMcZMtlQKwcO6LPivye', 'Customer Service')
ON CONFLICT (id) DO NOTHING;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_tokens_customer_phone ON tokens(customer_phone);
CREATE INDEX IF NOT EXISTS idx_tokens_staff_id ON tokens(staff_id);
CREATE INDEX IF NOT EXISTS idx_tokens_status ON tokens(status);
CREATE INDEX IF NOT EXISTS idx_tokens_created_at ON tokens(created_at);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);

-- Function to automatically update token number daily
CREATE OR REPLACE FUNCTION get_next_token_number()
RETURNS INTEGER AS $$
DECLARE
    next_number INTEGER;
BEGIN
    SELECT COALESCE(MAX(token_number), 0) + 1 
    INTO next_number
    FROM tokens 
    WHERE DATE(created_at) = CURRENT_DATE;
    
    RETURN next_number;
END;
$$ LANGUAGE plpgsql;

-- Comments for documentation
COMMENT ON TABLE customers IS 'Stores customer information';
COMMENT ON TABLE staff IS 'Stores staff member information';
COMMENT ON TABLE tokens IS 'Stores token bookings and their status';
COMMENT ON TABLE queue_count IS 'Tracks current queue count from ESP32 sensors';

COMMENT ON COLUMN tokens.status IS 'Token status: waiting, called, completed, or cancelled';
COMMENT ON COLUMN tokens.token_number IS 'Sequential token number that resets daily';
