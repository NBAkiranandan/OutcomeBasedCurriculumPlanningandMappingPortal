async function testMinorStream() {
  try {
    const loginRes = await fetch('http://127.0.0.1:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@aditya.edu.in', password: 'admin123' })
    });
    const loginData = await loginRes.json();
    const token = loginData.accessToken;

    const deptRes = await fetch('http://127.0.0.1:5000/api/programs/departments', { headers: { Authorization: `Bearer ${token}` } });
    const deptData = await deptRes.json();
    const deptId = deptData.departments[0]._id;

    const regRes = await fetch('http://127.0.0.1:5000/api/regulations', { headers: { Authorization: `Bearer ${token}` } });
    const regData = await regRes.json();
    const regulationId = regData.regulations[0]._id;

    console.log('Creating minor stream for Dept:', deptId, 'Regulation:', regulationId);

    const createRes = await fetch('http://127.0.0.1:5000/api/minor-streams', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ name: 'Test Minor Stream 2', departmentId: deptId, regulationId: regulationId, courses: [] })
    });
    
    const createData = await createRes.json();
    console.log('Create Response:', createData);

    const listRes = await fetch(`http://127.0.0.1:5000/api/minor-streams?departmentId=${deptId}&regulationId=${regulationId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const listData = await listRes.json();
    console.log('List Response:', listData);

  } catch (error) {
    console.error('API Error:', error.message);
  }
}

testMinorStream();
