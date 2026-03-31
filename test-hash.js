// Test script to verify bcrypt hash
const bcrypt = require('bcrypt');

const password = 'admin123';
const hashFromSeed = '$2b$10$rJZhVCjYgmLKGJZN3XMzGO3yHNqS5XqhZw5Z3wqQ5FD8Y7E8T.8bm';

console.log('Testing bcrypt hash...');
bcrypt.compare(password, hashFromSeed, (err, result) => {
    if (err) {
        console.error('Error:', err);
    } else {
        console.log(`Password '${password}' matches hash: ${result}`);
        
        if (!result) {
            console.log('\n❌ HASH IS INCORRECT! Generating new hash...\n');
            bcrypt.hash(password, 10, (err, newHash) => {
                if (err) {
                    console.error('Error generating hash:', err);
                } else {
                    console.log('Correct hash for "admin123":');
                    console.log(newHash);
                    console.log('\nUpdate seed.sql with this hash!');
                }
                process.exit(0);
            });
        } else {
            console.log('✅ Hash is correct!');
            process.exit(0);
        }
    }
});
