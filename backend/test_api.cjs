async function testApi() {
  try {
    const loginRes = await fetch('http://127.0.0.1:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@aditya.edu.in', password: 'admin123' })
    });
    
    const loginData = await loginRes.json();
    const token = loginData.accessToken;

    if (!token) return;

    const userRes = await fetch('http://127.0.0.1:5000/api/users', {
      headers: { Authorization: `Bearer ${token}` }
    });
    const userData = await userRes.json();
    console.log('HOD Users:', userData.users.filter(u => u.role === 'HOD'));

  } catch (error) {
    console.error('API Error:', error.message);
  }
}

testApi();
