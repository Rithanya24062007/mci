
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('node:path');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();
// ...existing code...


const app = express();
const PORT = process.env.PORT || 3000;

const db = require('./config/database');

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

// Admin login route (placed AFTER middleware so req.body is available)
app.post('/api/admin/login', (req, res) => {
  const { username, password } = req.body;
  if (username === 'admin' && password === 'admin123') {
    // Issue a JWT for admin
    const token = jwt.sign({ role: 'admin', username: 'admin' }, process.env.JWT_SECRET, { expiresIn: '2h' });
    return res.json({ success: true, token });
  }
  return res.status(401).json({ error: 'Invalid admin credentials' });
});

// JWT verification middleware
const verifyToken = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  
  if (!token) {
    return res.status(403).json({ error: 'No token provided' });
  }
  
  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).json({ error: 'Invalid token' });
    }
    req.userId = decoded.id;
    req.userType = decoded.type;
    next();
  });
};

// ==================== AUTHENTICATION ROUTES ====================
// Customer Login (with password)
app.post('/api/auth/customer/login', async (req, res) => {
  try {
    const { phone, password } = req.body;
    if (!phone || !password) {
      return res.status(400).json({ error: 'Phone and password are required' });
    }
    const result = await db.query('SELECT * FROM customers WHERE phone = $1', [phone]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    const customer = result.rows[0];
    if (!customer.password) {
      return res.status(400).json({ error: 'Account does not have a password. Please sign up again.' });
    }
    const valid = await bcrypt.compare(password, customer.password);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const token = jwt.sign(
      { id: customer.phone, type: 'customer', name: customer.name },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    res.json({
      success: true,
      token,
      user: {
        phone: customer.phone,
        name: customer.name,
        type: 'customer'
      }
    });
  } catch (error) {
    console.error('Customer login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});
// Customer Signup (with password)
app.post('/api/auth/customer/signup', async (req, res) => {
  try {
    const { name, phone, password } = req.body;
    if (!name || !phone || !password) {
      return res.status(400).json({ error: 'Name, phone, and password are required' });
    }
    // Check if customer exists
    const exists = await db.query('SELECT * FROM customers WHERE phone = $1', [phone]);
    if (exists.rows.length > 0) {
      return res.status(409).json({ error: 'Customer already exists. Please login.' });
    }
    // Hash password
    const hash = await bcrypt.hash(password, 10);
    const result = await db.query('INSERT INTO customers (name, phone, password) VALUES ($1, $2, $3) RETURNING id, name, phone', [name, phone, hash]);
    res.json({ success: true, customer: result.rows[0] });
  } catch (error) {
    console.error('Customer signup error:', error);
    res.status(500).json({ error: 'Signup failed' });
  }
});

// Customer Login/Register
app.post('/api/auth/customer', async (req, res) => {
  try {
    const { phone, name } = req.body;
    
    if (!phone || !name) {
      return res.status(400).json({ error: 'Phone and name are required' });
    }
    
    // Check if customer exists
    let result = await db.query(
      'SELECT * FROM customers WHERE phone = $1',
      [phone]
    );
    
    let customer;
    if (result.rows.length === 0) {
      // Create new customer
      result = await db.query(
        'INSERT INTO customers (phone, name) VALUES ($1, $2) RETURNING *',
        [phone, name]
      );
      customer = result.rows[0];
    } else {
      // Update existing customer name
      result = await db.query(
        'UPDATE customers SET name = $1 WHERE phone = $2 RETURNING *',
        [name, phone]
      );
      customer = result.rows[0];
    }
    
    // Generate JWT token
    const token = jwt.sign(
      { id: customer.phone, type: 'customer', name: customer.name },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    res.json({
      success: true,
      token,
      user: {
        phone: customer.phone,
        name: customer.name,
        type: 'customer'
      }
    });
  } catch (error) {
    console.error('Customer auth error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
});

// Staff Login
app.post('/api/auth/staff', async (req, res) => {
  try {
    const { staffId, password } = req.body;
    
    if (!staffId || !password) {
      return res.status(400).json({ error: 'Staff ID and password are required' });
    }
    
    // Get staff member
    const result = await db.query(
      'SELECT * FROM staff WHERE id = $1',
      [staffId]
    );
    

      // Customer Sign In (phone only)
      app.post('/api/auth/customer/signin', async (req, res) => {
        try {
          const { phone } = req.body;
          if (!phone) {
            return res.status(400).json({ error: 'Phone is required' });
          }
          const result = await db.query('SELECT * FROM customers WHERE phone = $1', [phone]);
          if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Customer not found. Please register.' });
          }
          const customer = result.rows[0];
          const token = jwt.sign(
            { id: customer.phone, type: 'customer', name: customer.name },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
          );
          res.json({
            success: true,
            token,
            user: {
              phone: customer.phone,
              name: customer.name,
              type: 'customer'
            }
          });
        } catch (error) {
          console.error('Customer sign in error:', error);
          res.status(500).json({ error: 'Authentication failed' });
        }
      });
    // ==================== ADMIN ROUTES ====================

    // Simple admin auth middleware (demo: use x-admin-token header)
    function adminAuth(req, res, next) {
      const adminToken = req.headers['x-admin-token'];
      if (adminToken && adminToken === process.env.ADMIN_TOKEN) {
        return next();
      }
      return res.status(401).json({ error: 'Unauthorized (admin)' });
    }

    // Admin: Create staff account
    app.post('/api/admin/staff', adminAuth, async (req, res) => {
      try {
        const { id, password, name, department } = req.body;
        if (!id || !password || !name) {
          return res.status(400).json({ error: 'Staff ID, password, and name are required' });
        }
        // Check if staff ID exists
        const exists = await db.query('SELECT * FROM staff WHERE id = $1', [id]);
        if (exists.rows.length > 0) {
          return res.status(409).json({ error: 'Staff ID already exists' });
        }
        // Hash password
        const hash = await bcrypt.hash(password, 10);
        const insert = await db.query('INSERT INTO staff (id, password, name, department) VALUES ($1, $2, $3, $4) RETURNING id, name, department', [id, hash, name, department || null]);
        res.json({ staff: insert.rows[0] });
      } catch (error) {
        console.error('Admin create staff error:', error);
        res.status(500).json({ error: 'Internal server error' });
      }
    });
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const staff = result.rows[0];
    
    // Verify password
    const validPassword = await bcrypt.compare(password, staff.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Generate JWT token
    const token = jwt.sign(
      { id: staff.id, type: 'staff', name: staff.name, department: staff.department },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    res.json({
      success: true,
      token,
      user: {
        id: staff.id,
        name: staff.name,
        department: staff.department,
        type: 'staff'
      }
    });
  } catch (error) {
    console.error('Staff auth error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
});

// ==================== STAFF ROUTES ====================

// Get all staff members
app.get('/api/staff', async (req, res) => {
  try {
    const result = await db.query(
      'SELECT id, name, department FROM staff ORDER BY name'
    );
    res.json({ success: true, staff: result.rows });
  } catch (error) {
    console.error('Error fetching staff:', error);
    res.status(500).json({ error: 'Failed to fetch staff' });
  }
});

// ==================== TOKEN ROUTES ====================

// Book a new token

// Book a new token (authenticated customer)
app.post('/api/tokens', verifyToken, async (req, res) => {
  try {
    const { staffId, purpose } = req.body;
    const customerPhone = req.userId;
    if (!staffId) {
      return res.status(400).json({ error: 'Staff ID is required' });
    }
    // Check if customer already has an active token
    const existingToken = await db.query(
      'SELECT * FROM tokens WHERE customer_phone = $1 AND status IN ($2, $3)',
      [customerPhone, 'waiting', 'called']
    );
    if (existingToken.rows.length > 0) {
      return res.status(400).json({ error: 'You already have an active token' });
    }
    // Get customer name
    const customerResult = await db.query(
      'SELECT name FROM customers WHERE phone = $1',
      [customerPhone]
    );
    const customerName = customerResult.rows[0].name;
    // Get next token number
    const tokenNumberResult = await db.query('SELECT get_next_token_number()');
    const tokenNumber = tokenNumberResult.rows[0].get_next_token_number;
    // Create token
    const result = await db.query(
      `INSERT INTO tokens (token_number, customer_phone, customer_name, staff_id, purpose)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [tokenNumber, customerPhone, customerName, staffId, purpose || null]
    );
    res.json({ success: true, token: result.rows[0] });
  } catch (error) {
    console.error('Error booking token:', error);
    res.status(500).json({ error: 'Failed to book token' });
  }
});

// Book a new token (anonymous, no login)
app.post('/api/tokens/anonymous', async (req, res) => {
  try {
    const { name, phone, staffId, purpose } = req.body;
    if (!name || !phone || !staffId) {
      return res.status(400).json({ error: 'Name, phone, and staffId are required' });
    }
    // Check if this phone already has an active token
    const existingToken = await db.query(
      'SELECT * FROM tokens WHERE customer_phone = $1 AND status IN ($2, $3)',
      [phone, 'waiting', 'called']
    );
    if (existingToken.rows.length > 0) {
      return res.status(400).json({ error: 'You already have an active token' });
    }
    // Optionally, upsert customer info
    const customerResult = await db.query('SELECT * FROM customers WHERE phone = $1', [phone]);
    if (customerResult.rows.length === 0) {
      await db.query('INSERT INTO customers (phone, name) VALUES ($1, $2)', [phone, name]);
    } else {
      await db.query('UPDATE customers SET name = $1 WHERE phone = $2', [name, phone]);
    }
    // Get next token number
    const tokenNumberResult = await db.query('SELECT get_next_token_number()');
    const tokenNumber = tokenNumberResult.rows[0].get_next_token_number;
    // Create token
    const result = await db.query(
      `INSERT INTO tokens (token_number, customer_phone, customer_name, staff_id, purpose)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [tokenNumber, phone, name, staffId, purpose || null]
    );
    res.json({ success: true, token: result.rows[0] });
  } catch (error) {
    console.error('Error booking anonymous token:', error);
    res.status(500).json({ error: 'Failed to book token' });
  }
});

// Get customer's current token
app.get('/api/tokens/my-token', verifyToken, async (req, res) => {
  try {
    const customerPhone = req.userId;
    
    const result = await db.query(
      `SELECT t.*, s.name as staff_name, s.department as staff_department
       FROM tokens t
       JOIN staff s ON t.staff_id = s.id
       WHERE t.customer_phone = $1 AND t.status IN ($2, $3)
       ORDER BY t.created_at DESC LIMIT 1`,
      [customerPhone, 'waiting', 'called']
    );
    
    if (result.rows.length === 0) {
      return res.json({ success: true, token: null });
    }
    
    const token = result.rows[0];
    
    // Calculate people ahead
    const aheadResult = await db.query(
      `SELECT COUNT(*) as count FROM tokens
       WHERE staff_id = $1 AND token_number < $2 
       AND status IN ($3, $4) AND DATE(created_at) = CURRENT_DATE`,
      [token.staff_id, token.token_number, 'waiting', 'called']
    );
    
    token.people_ahead = Number.parseInt(aheadResult.rows[0].count);
    token.estimated_wait = token.people_ahead * 5; // 5 minutes per token
    
    res.json({ success: true, token });
  } catch (error) {
    console.error('Error fetching token:', error);
    res.status(500).json({ error: 'Failed to fetch token' });
  }
});

// Cancel token
app.put('/api/tokens/:id/cancel', verifyToken, async (req, res) => {
  try {
    const tokenId = req.params.id;
    const customerPhone = req.userId;
    
    const result = await db.query(
      `UPDATE tokens SET status = $1 WHERE id = $2 AND customer_phone = $3 
       AND status IN ($4, $5) RETURNING *`,
      ['cancelled', tokenId, customerPhone, 'waiting', 'called']
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Token not found or cannot be cancelled' });
    }
    
    res.json({ success: true, token: result.rows[0] });
  } catch (error) {
    console.error('Error cancelling token:', error);
    res.status(500).json({ error: 'Failed to cancel token' });
  }
});

// Get staff appointments
app.get('/api/tokens/staff/:staffId', verifyToken, async (req, res) => {
  try {
    const staffId = req.params.staffId;
    
    const result = await db.query(
      `SELECT * FROM tokens
       WHERE staff_id = $1 AND DATE(created_at) = CURRENT_DATE
       ORDER BY 
         CASE status
           WHEN 'called' THEN 1
           WHEN 'waiting' THEN 2
           WHEN 'completed' THEN 3
           ELSE 4
         END,
         token_number ASC`,
      [staffId]
    );
    
    res.json({ success: true, tokens: result.rows });
  } catch (error) {
    console.error('Error fetching staff tokens:', error);
    res.status(500).json({ error: 'Failed to fetch appointments' });
  }
});

// Call next token
app.put('/api/tokens/call-next/:staffId', verifyToken, async (req, res) => {
  try {
    const staffId = req.params.staffId;
    
    // Check if staff is already serving someone
    const serving = await db.query(
      'SELECT * FROM tokens WHERE staff_id = $1 AND status = $2',
      [staffId, 'called']
    );
    
    if (serving.rows.length > 0) {
      return res.status(400).json({ error: 'Already serving a customer' });
    }
    
    // Find next waiting token
    const result = await db.query(
      `UPDATE tokens SET status = $1, called_at = CURRENT_TIMESTAMP
       WHERE id = (
         SELECT id FROM tokens
         WHERE staff_id = $2 AND status = $3 AND DATE(created_at) = CURRENT_DATE
         ORDER BY token_number ASC LIMIT 1
       ) RETURNING *`,
      ['called', staffId, 'waiting']
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'No waiting tokens' });
    }
    
    res.json({ success: true, token: result.rows[0] });
  } catch (error) {
    console.error('Error calling next token:', error);
    res.status(500).json({ error: 'Failed to call next token' });
  }
});

// Call specific token
app.put('/api/tokens/:id/call', verifyToken, async (req, res) => {
  try {
    const tokenId = req.params.id;
    const { staffId } = req.body;
    
    // Check if staff is already serving someone
    const serving = await db.query(
      'SELECT * FROM tokens WHERE staff_id = $1 AND status = $2',
      [staffId, 'called']
    );
    
    if (serving.rows.length > 0) {
      return res.status(400).json({ error: 'Already serving a customer' });
    }
    
    const result = await db.query(
      `UPDATE tokens SET status = $1, called_at = CURRENT_TIMESTAMP
       WHERE id = $2 AND staff_id = $3 AND status = $4 RETURNING *`,
      ['called', tokenId, staffId, 'waiting']
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Token not found or cannot be called' });
    }
    
    res.json({ success: true, token: result.rows[0] });
  } catch (error) {
    console.error('Error calling token:', error);
    res.status(500).json({ error: 'Failed to call token' });
  }
});

// Complete token
app.put('/api/tokens/:id/complete', verifyToken, async (req, res) => {
  try {
    const tokenId = req.params.id;
    
    const result = await db.query(
      `UPDATE tokens SET status = $1, completed_at = CURRENT_TIMESTAMP
       WHERE id = $2 AND status = $3 RETURNING *`,
      ['completed', tokenId, 'called']
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Token not found or not in called state' });
    }
    
    res.json({ success: true, token: result.rows[0] });
  } catch (error) {
    console.error('Error completing token:', error);
    res.status(500).json({ error: 'Failed to complete token' });
  }
});

// Get statistics
app.get('/api/stats', async (req, res) => {
  try {
    const today = await db.query(
      `SELECT 
         COUNT(*) as total,
         COUNT(*) FILTER (WHERE status = 'waiting') as waiting,
         COUNT(*) FILTER (WHERE status = 'called') as called,
         COUNT(*) FILTER (WHERE status = 'completed') as completed,
         COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled
       FROM tokens
       WHERE DATE(created_at) = CURRENT_DATE`
    );
    
    res.json({ success: true, stats: today.rows[0] });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

// ==================== QUEUE COUNT ROUTES (ESP32) ====================

// Update queue count (ESP32)
app.post('/api/queue/update', async (req, res) => {
  try {
    const { action } = req.body;
    
    if (action === 'entry') {
      await db.query(
        `UPDATE queue_count SET current_count = current_count + 1, 
         updated_at = CURRENT_TIMESTAMP WHERE id = 1`
      );
      console.log('Person entered queue');
    } else if (action === 'exit') {
      await db.query(
        `UPDATE queue_count SET current_count = GREATEST(current_count - 1, 0), 
         updated_at = CURRENT_TIMESTAMP WHERE id = 1`
      );
      console.log('Person exited queue');
    }
    
    const result = await db.query('SELECT current_count FROM queue_count WHERE id = 1');
    const currentCount = result.rows[0].current_count;
    
    console.log(`Current queue count: ${currentCount}`);
    
    res.json({ success: true, currentCount });
  } catch (error) {
    console.error('Error updating queue:', error);
    res.status(500).json({ error: 'Failed to update queue' });
  }
});

// Get current queue count
app.get('/api/queue/count', async (req, res) => {
  try {
    const result = await db.query('SELECT current_count FROM queue_count WHERE id = 1');
    const count = result.rows[0]?.current_count || 0;
    res.json({ count });
  } catch (error) {
    console.error('Error fetching queue count:', error);
    res.status(500).json({ error: 'Failed to fetch queue count' });
  }
});

// ==================== HTML ROUTES ====================

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// ==================== START SERVER ====================

app.listen(PORT, async () => {
  console.log('========================================');
  console.log('Token Reservation System');
  console.log('========================================');
  console.log(`✓ Server running on http://localhost:${PORT}`);
  console.log(`✓ Environment: ${process.env.NODE_ENV || 'development'}`);
  
  // Test database connection
  try {
    await db.query('SELECT NOW()');
    console.log('✓ Database connected successfully');
  } catch (error) {
    console.error('✗ Database connection failed:', error.message);
    console.error('  Please ensure PostgreSQL is running and configured correctly');
  }
  
  console.log('========================================');
});
