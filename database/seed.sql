-- Queue Management System - Initial Seed Data

-- Note: Password for all accounts is 'admin123'
-- Hash generated with bcrypt (10 rounds): $2b$10$tGFqmkxo/tR/Mh6ODArCbev4L2X4AHpubOsvDvPM8G.GognpJa2DK
-- ⚠️ CHANGE THIS PASSWORD IMMEDIATELY IN PRODUCTION!

-- Insert admin user (no associated staff)
INSERT INTO users (name, email, password_hash, role, staff_id)
VALUES 
    ('System Administrator', 'admin@example.com', '$2b$10$tGFqmkxo/tR/Mh6ODArCbev4L2X4AHpubOsvDvPM8G.GognpJa2DK', 'admin', NULL);

-- Insert sample staff members
INSERT INTO staff (name, is_active, live_tracking_enabled)
VALUES 
    ('Dr. Sarah Johnson', TRUE, FALSE),
    ('Dr. Michael Chen', TRUE, FALSE),
    ('Dr. Emily Rodriguez', TRUE, FALSE);

-- Insert staff user accounts (linked to staff records)
INSERT INTO users (name, email, password_hash, role, staff_id)
VALUES 
    ('Dr. Sarah Johnson', 'sarah.johnson@example.com', '$2b$10$tGFqmkxo/tR/Mh6ODArCbev4L2X4AHpubOsvDvPM8G.GognpJa2DK', 'staff', 1),
    ('Dr. Michael Chen', 'michael.chen@example.com', '$2b$10$tGFqmkxo/tR/Mh6ODArCbev4L2X4AHpubOsvDvPM8G.GognpJa2DK', 'staff', 2),
    ('Dr. Emily Rodriguez', 'emily.rodriguez@example.com', '$2b$10$tGFqmkxo/tR/Mh6ODArCbev4L2X4AHpubOsvDvPM8G.GognpJa2DK', 'staff', 3);

-- Staff queue entries are automatically created by trigger

-- Insert sample device (ESP32)
INSERT INTO devices (device_id, mapped_staff_id)
VALUES 
    ('ESP32_001', 1);

-- Insert some sample tokens for demonstration (optional - remove if you want clean start)
INSERT INTO tokens (staff_id, token_number, status, customer_name, created_at)
VALUES 
    (1, 1, 'completed', 'John Doe', NOW() - INTERVAL '30 minutes'),
    (1, 2, 'completed', 'Jane Smith', NOW() - INTERVAL '25 minutes'),
    (1, 3, 'serving', 'Bob Wilson', NOW() - INTERVAL '5 minutes'),
    (1, 4, 'waiting', 'Alice Brown', NOW() - INTERVAL '4 minutes'),
    (1, 5, 'waiting', 'Charlie Davis', NOW() - INTERVAL '3 minutes'),
    (2, 1, 'completed', 'David Lee', NOW() - INTERVAL '20 minutes'),
    (2, 2, 'serving', 'Emma Taylor', NOW() - INTERVAL '2 minutes');

-- Update staff_queue to match sample tokens
UPDATE staff_queue SET last_issued_token = 5, current_serving_token = 3 WHERE staff_id = 1;
UPDATE staff_queue SET last_issued_token = 2, current_serving_token = 2 WHERE staff_id = 2;
UPDATE staff_queue SET last_issued_token = 0, current_serving_token = 0 WHERE staff_id = 3;

-- Insert sample live tracking data (for testing)
INSERT INTO live_tracking_data (staff_id, entry_sensor_value, exit_sensor_value, calculated_occupancy, timestamp)
VALUES 
    (1, 25, 22, 3, NOW() - INTERVAL '10 seconds'),
    (1, 26, 22, 4, NOW() - INTERVAL '5 seconds'),
    (1, 26, 23, 3, NOW());

-- Display inserted data summary
SELECT 'Seed data inserted successfully!' as message;
SELECT 'Admin credentials: admin@example.com / admin123' as credentials;
SELECT 'Staff credentials: [name]@example.com / admin123' as staff_credentials;
SELECT '⚠️  CHANGE DEFAULT PASSWORDS IN PRODUCTION!' as warning;
