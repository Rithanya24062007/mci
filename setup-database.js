// Database setup script using Node.js
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function setupDatabase() {
    console.log('============================================');
    console.log('Queue Management System - Database Setup');
    console.log('============================================\n');

    // First, connect to postgres database to manage queue_management database
    const adminClient = new Client({
        host: 'localhost',
        port: 5432,
        user: 'postgres',
        password: '1234',
        database: 'postgres'
    });

    try {
        console.log('Step 1: Connecting to PostgreSQL...');
        await adminClient.connect();
        console.log('✓ Connected successfully\n');

        // Drop existing database if it exists
        console.log('Step 2: Dropping existing database (if exists)...');
        // First, terminate all connections to the database
        await adminClient.query(`
            SELECT pg_terminate_backend(pg_stat_activity.pid)
            FROM pg_stat_activity
            WHERE pg_stat_activity.datname = 'queue_management'
            AND pid <> pg_backend_pid();
        `);
        await adminClient.query('DROP DATABASE IF EXISTS queue_management;');
        console.log('✓ Database dropped\n');

        // Create new database
        console.log('Step 3: Creating new database...');
        await adminClient.query('CREATE DATABASE queue_management;');
        console.log('✓ Database created\n');

        await adminClient.end();

        // Now connect to the new database to run schema and seed
        const dbClient = new Client({
            host: 'localhost',
            port: 5432,
            user: 'postgres',
            password: '1234',
            database: 'queue_management'
        });

        await dbClient.connect();

        // Run schema
        console.log('Step 4: Running schema...');
        const schemaSQL = fs.readFileSync(path.join(__dirname, 'database', 'schema.sql'), 'utf8');
        await dbClient.query(schemaSQL);
        console.log('✓ Schema created\n');

        // Run seed data
        console.log('Step 5: Seeding initial data...');
        const seedSQL = fs.readFileSync(path.join(__dirname, 'database', 'seed.sql'), 'utf8');
        await dbClient.query(seedSQL);
        console.log('✓ Data seeded\n');

        // Verify setup
        console.log('Step 6: Verifying setup...');
        const staffCount = await dbClient.query('SELECT COUNT(*) as count FROM staff;');
        const userCount = await dbClient.query('SELECT COUNT(*) as count FROM users;');
        const deviceCount = await dbClient.query('SELECT COUNT(*) as count FROM devices;');
        
        console.log(`✓ Staff members: ${staffCount.rows[0].count}`);
        console.log(`✓ Users: ${userCount.rows[0].count}`);
        console.log(`✓ Devices: ${deviceCount.rows[0].count}\n`);

        await dbClient.end();

        console.log('============================================');
        console.log('Setup Complete!');
        console.log('============================================\n');
        console.log('Default Accounts:');
        console.log('  Admin:  admin@example.com / admin123');
        console.log('  Staff:  sarah.johnson@example.com / admin123\n');
        console.log('Next Steps:');
        console.log('  1. Run: npm start');
        console.log('  2. Open: http://localhost:3000\n');

    } catch (error) {
        console.error('\n❌ Error during setup:', error.message);
        process.exit(1);
    }
}

setupDatabase();
