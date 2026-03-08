const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { verifyToken, verifyAdmin } = require('../middleware/auth');

// All admin routes require authentication and admin role
router.use(verifyToken);
router.use(verifyAdmin);

// POST /staff - Create new staff
router.post('/staff', adminController.createStaff);

// GET /staff/list - Get all staff
router.get('/staff/list', adminController.getAllStaff);

// PUT /staff/:id - Update staff status
router.put('/staff/:id', adminController.updateStaffStatus);

// PATCH /staff/:id/edit - Update staff details
router.patch('/staff/:id/edit', adminController.updateStaffDetails);

// DELETE /staff/:id - Delete staff
router.delete('/staff/:id', adminController.deleteStaff);

// PATCH /staff/:id/toggle-tracking - Toggle live tracking
router.patch('/staff/:id/toggle-tracking', adminController.toggleLiveTracking);

// POST /device/map - Map device to staff
router.post('/device/map', adminController.mapDevice);

// GET /customers/list - Get all customers
router.get('/customers/list', adminController.getAllCustomers);

// GET /customers/:id - Get customer details
router.get('/customers/:id', adminController.getCustomerDetails);

module.exports = router;
