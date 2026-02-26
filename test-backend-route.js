// Quick test to check if the backend route exists
const http = require('http');

const options = {
  hostname: 'localhost',
  port: 80,
  path: '/api/user/select-restaurant',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  }
};

const req = http.request(options, (res) => {
  console.log(`Status: ${res.statusCode}`);
  
  if (res.statusCode === 404) {
    console.log('❌ Route NOT found - Backend server needs to be restarted!');
    console.log('\nTo fix:');
    console.log('1. Stop backend server (Ctrl+C)');
    console.log('2. Run: cd project/backend && npm start');
  } else {
    console.log('✅ Route exists!');
  }
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('Response:', data);
  });
});

req.on('error', (error) => {
  console.error('❌ Cannot connect to backend server');
  console.error('Make sure backend is running on port 80');
  console.error('Error:', error.message);
});

req.write(JSON.stringify({ userId: 1, restaurantId: 1 }));
req.end();
