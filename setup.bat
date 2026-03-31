@echo off
echo ============================================
echo Queue Management System - Complete Setup
echo ============================================
echo.

echo Step 1: Checking PostgreSQL connection...
psql -U postgres -c "SELECT version();" >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Cannot connect to PostgreSQL. Please ensure:
    echo   1. PostgreSQL is installed
    echo   2. PostgreSQL service is running
    echo   3. Password is correct in .env file
    pause
    exit /b 1
)
echo ✓ PostgreSQL connection successful

echo.
echo Step 2: Dropping existing database (if exists)...
psql -U postgres -c "DROP DATABASE IF EXISTS queue_management;" 2>nul
echo ✓ Database dropped

echo.
echo Step 3: Creating new database...
psql -U postgres -c "CREATE DATABASE queue_management;"
if %errorlevel% neq 0 (
    echo ERROR: Failed to create database
    pause
    exit /b 1
)
echo ✓ Database created

echo.
echo Step 4: Running schema...
psql -U postgres -d queue_management -f database\schema.sql
if %errorlevel% neq 0 (
    echo ERROR: Failed to run schema
    pause
    exit /b 1
)
echo ✓ Schema created

echo.
echo Step 5: Seeding initial data...
psql -U postgres -d queue_management -f database\seed.sql
if %errorlevel% neq 0 (
    echo ERROR: Failed to seed data
    pause
    exit /b 1
)
echo ✓ Data seeded

echo.
echo Step 6: Verifying setup...
psql -U postgres -d queue_management -c "SELECT COUNT(*) as staff_count FROM staff;"
psql -U postgres -d queue_management -c "SELECT COUNT(*) as user_count FROM users;"

echo.
echo ============================================
echo Setup Complete!
echo ============================================
echo.
echo Default Accounts:
echo   Admin:  admin@example.com / admin123
echo   Staff:  sarah.johnson@example.com / admin123
echo.
echo Next Steps:
echo   1. Run: npm start
echo   2. Open: http://localhost:3000
echo.
echo Press any key to start the server...
pause >nul

echo.
echo Starting server...
npm start
