const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
dotenv.config();

mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/quicksolutions');

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, default: 'customer' }
});
const User = mongoose.models.User || mongoose.model('User', UserSchema);

async function check() {
  const hashedPassword = await bcrypt.hash('Customer@123', 10);
  await User.create({
    name: 'Test Customer',
    email: 'customer@example.com',
    password: hashedPassword,
    role: 'customer'
  });
  console.log('Customer created!');
  process.exit(0);
}

check();
