# Quick Start Guide

## 🚀 Get Started in 3 Steps

### Step 1: Install Dependencies

Open PowerShell in the project directory and run:

```powershell
npm install
```

### Step 2: Start the Server

```powershell
npm start
```

You should see:
```
Server running on http://localhost:3000
Queue monitoring system active
```

### Step 3: Open in Browser

Navigate to: **http://localhost:3000**

---

## 👥 First Time Login

### As Customer:
1. Click **Customer** tab
2. Enter any phone number (e.g., 1234567890)
3. Enter your name
4. Click **Login / Register**

### As Staff:
1. Click **Staff** tab
2. Use these credentials:
   - **Staff ID:** staff1
   - **Password:** pass123
3. Click **Login**

---

## 📱 Customer Workflow

1. **Login** with phone and name
2. **Select Staff** from dropdown menu
3. **Add Purpose** (optional)
4. **Book Token** - You'll receive a token number
5. **Monitor Status** - See estimated wait time and queue position

---

## 👨‍💼 Staff Workflow

1. **Login** with staff credentials
2. **View Appointments** - See all tokens assigned to you
3. **Call Next Token** - Click to serve next customer
4. **Complete Service** - Mark token as done when finished

---

## 🔧 ESP32 Setup (Optional)

If you have ESP32 hardware:

1. Open Arduino IDE
2. Load `esp32_queue_monitor/esp32_queue_monitor.ino`
3. Update WiFi credentials
4. Update server URL with your computer's IP
5. Upload to ESP32

See [HARDWARE_SETUP.md](HARDWARE_SETUP.md) for detailed instructions.

---

## 📊 Features Overview

### Customer Features
- ✅ Book tokens for specific staff
- ✅ View estimated wait time
- ✅ See queue position
- ✅ Cancel tokens
- ✅ Real-time updates

### Staff Features
- ✅ View all appointments
- ✅ Call next token
- ✅ Complete services
- ✅ Filter by status
- ✅ Daily statistics

### Hardware Integration
- ✅ Auto entry/exit detection
- ✅ Real-time queue count
- ✅ WiFi connectivity

---

## 🎯 Testing the System

### Test Scenario 1: Customer Books Token

1. Login as customer
2. Select "John Doe - General" from dropdown
3. Click "Book Token"
4. You'll get Token #1

### Test Scenario 2: Staff Serves Customer

1. Login as staff (staff1/pass123)
2. You'll see the pending token
3. Click "Call Next Token"
4. Token status changes to "CALLED"
5. Click "Complete Service" when done

### Test Scenario 3: Multiple Customers

1. Open multiple browser windows (or use incognito)
2. Login as different customers
3. Book tokens for different staff
4. Switch to staff dashboard
5. See all appointments listed

---

## 🛠️ Common Issues

**Problem:** Server won't start
- **Solution:** Check if port 3000 is in use
- Run: `netstat -ano | findstr :3000`

**Problem:** Page not loading
- **Solution:** Ensure server is running
- Check URL is `http://localhost:3000`

**Problem:** Data disappears
- **Solution:** Don't clear browser cache
- LocalStorage data is browser-specific

**Problem:** Can't login as staff
- **Solution:** Use correct credentials
- Default: staff1 / pass123

---

## 📂 Project Files

```
mcir/
├── server.js                    # Backend server
├── package.json                 # Dependencies
├── README.md                    # Full documentation
├── QUICK_START.md              # This file
├── HARDWARE_SETUP.md           # ESP32 setup guide
├── public/                     # Frontend
│   ├── login.html
│   ├── customer-dashboard.html
│   ├── staff-dashboard.html
│   ├── css/style.css
│   └── js/
│       ├── login.js
│       ├── customer.js
│       └── staff.js
└── esp32_queue_monitor/
    └── esp32_queue_monitor.ino # Arduino code
```

---

## 🎓 Learning Resources

- **HTML/CSS/JS:** Frontend basics
- **Node.js/Express:** Backend server
- **LocalStorage:** Browser data storage
- **ESP32:** IoT hardware programming
- **HC-SR04:** Ultrasonic sensor usage

---

## 💡 Tips

1. **Keep server running** while using the application
2. **Don't clear browser cache** - data stored in localStorage
3. **Use Chrome DevTools** to inspect localStorage data (F12 → Application → Local Storage)
4. **Auto-refresh** is enabled - pages update every 5 seconds
5. **Test thoroughly** before deploying in production

---

## 🎉 You're Ready!

Your token reservation system is now set up and ready to use. Start the server and begin managing your queue!

For detailed information, see [README.md](README.md)

---

**Need Help?** Check the troubleshooting section in README.md
