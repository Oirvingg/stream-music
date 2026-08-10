import 'dotenv/config';
import fetch from 'node-fetch';

const payload = {
  name: 'Test User',
  email: `test${Date.now()}@example.com`,
  password: 'password123'
};

console.log('📤 Enviando:', JSON.stringify(payload, null, 2));

try {
  const res = await fetch('http://localhost:3000/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  
  const data = await res.json();
  console.log(`\n📥 Status ${res.status}:`, JSON.stringify(data, null, 2));
} catch (error) {
  console.error('❌ Error:', error.message);
}
