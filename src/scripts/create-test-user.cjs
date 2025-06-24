const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// !!! Укажи путь к своей модели пользователя !!!
// const { User } = require('../lib/models/user.model.ts');
const { User } = require('./user.model.js');

async function main() {
  const mongoUri = process.env.MONGODB_URI;
  console.log('MONGO URI:', mongoUri);
  await mongoose.connect(mongoUri);
  const email = 'test@example.com';
  const password = 'test';
  const passwordHash = await bcrypt.hash(password, 10);

  // Удаляем если уже есть
  await User.deleteOne({ email });

  // Создаём нового
  await User.create({
    email,
    passwordHash,
    role: 'admin',
  });

  console.log('Test user created');
  process.exit(0);
}

main();