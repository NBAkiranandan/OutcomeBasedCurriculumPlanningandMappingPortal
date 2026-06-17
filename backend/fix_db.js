import mongoose from 'mongoose';

async function fixDb() {
  try {
    await mongoose.connect('mongodb://127.0.0.1:27017/obcpmp');
    console.log('Connected to DB');
    
    const db = mongoose.connection.db;
    const peoPsoCollection = db.collection('peopsos');
    
    const indexes = await peoPsoCollection.indexes();
    console.log('Indexes before:', indexes.map(i => i.name));
    
    // Check if regulationId_1 exists
    if (indexes.find(i => i.name === 'regulationId_1')) {
      await peoPsoCollection.dropIndex('regulationId_1');
      console.log('Successfully dropped regulationId_1 index.');
    } else {
      console.log('Index regulationId_1 not found.');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error fixing DB:', error);
    process.exit(1);
  }
}

fixDb();
