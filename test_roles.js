const axios = require('axios');

const roles = ['borrower', 'vendor', 'admin'];
const baseUrl = 'http://localhost:5001/api/auth';

async function testRoles() {
    for (const role of roles) {
        const email = `test_${role}_${Date.now()}@example.com`;
        try {
            console.log(`Testing registration for role: ${role}...`);
            const regRes = await axios.post(`${baseUrl}/register`, {
                name: `${role} User`,
                email,
                password: 'password123',
                role
            });
            console.log(`Registration success for ${role}:`, regRes.data.user.role);

            console.log(`Testing login for role: ${role}...`);
            const loginRes = await axios.post(`${baseUrl}/login`, {
                email,
                password: 'password123'
            });
            console.log(`Login success for ${role}:`, loginRes.data.user.role);
            console.log('---');
        } catch (error) {
            console.error(`Error for role ${role}:`, error.response?.data || error.message);
        }
    }
}

testRoles();
