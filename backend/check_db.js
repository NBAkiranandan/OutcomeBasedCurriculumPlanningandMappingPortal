import mongoose from 'mongoose';
import CourseVersion from './backend/models/CourseVersion.js';
import Regulation from './backend/models/Regulation.js';
import dotenv from 'dotenv';

dotenv.config({ path: './backend/.env' });

async function checkDB() {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/obcpmp');
  
  const regs = await Regulation.find({});
  console.log('Total regulations:', regs.length);
  
  if (regs.length > 0) {
    const regId = regs[0]._id;
    console.log('Checking regulation:', regId);
    
    const versions = await CourseVersion.find({ regulationId: regId })
      .populate({
        path: 'courseId',
        populate: { path: 'departmentId' }
      })
      .populate('regulationId');
      
    console.log('Total course versions for this regulation:', versions.length);
    if (versions.length > 0) {
      console.log('Sample version:', JSON.stringify(versions[0], null, 2));
    }
  } else {
    console.log('No regulations found.');
  }
  
  mongoose.disconnect();
}

checkDB().catch(console.error);
