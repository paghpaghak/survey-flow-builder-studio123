import { MongoClient } from 'mongodb';
import * as bcrypt from 'bcryptjs';

const MONGODB_URI   = 'mongodb+srv://database:database@cluster0.bf05rzr.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
const email         = process.env.ADMIN_EMAIL!;
const password      = process.env.ADMIN_PASSWORD!;
const username      = process.env.ADMIN_USERNAME || email; // например, admin

async function createAdmin() {
  const client = new MongoClient(MONGODB_URI);
  await client.connect();

  const db    = client.db('survey_db');
  const users = db.collection('users');

  // Проверка на существующий email или username
  const existing = await users.findOne({ $or: [{ email }, { username }] });
  if (existing) {
    console.log('Администратор с таким email или username уже существует');
    await client.close();
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);

  await users.insertOne({
    email,
    username,
    passwordHash,
    role: 'admin',
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  await client.close();
  console.log('Администратор создан');
}

createAdmin().catch(console.error);
