import mongoose from 'mongoose';

const MONGO_URI = 'mongodb+srv://nbakiranandan8055_db_user:Akira8055@cluster1.99bdnnp.mongodb.net/obcpmp?retryWrites=true&w=majority&appName=Cluster1';

async function fixRoles() {
  await mongoose.connect(MONGO_URI);
  console.log('Connected to Atlas DB');

  const db = mongoose.connection.db;

  // Fix coordinator role (was incorrectly set to "Faculty")
  const coordResult = await db.collection('users').updateOne(
    { email: 'coord.cse@aditya.edu.in' },
    { $set: { role: 'Coordinator' } }
  );
  console.log('Coordinator update result:', coordResult.matchedCount, 'matched,', coordResult.modifiedCount, 'modified');

  // Verify all users
  const users = await db.collection('users').find({}, { projection: { name: 1, email: 1, role: 1 } }).toArray();
  console.log('\nAll users after fix:');
  users.forEach(u => console.log(`  ${u.email}  ->  ${u.role}`));

  await mongoose.disconnect();
  console.log('\nDone!');
}

fixRoles().catch(err => { console.error(err); process.exit(1); });
