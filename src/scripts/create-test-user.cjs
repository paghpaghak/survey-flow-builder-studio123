const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// !!! Укажи путь к своей модели пользователя !!!
const { User } = require('../lib/models/user.model');

async function main() {
  await mongoose.connect('mongodb://localhost:27017/survey_db');
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