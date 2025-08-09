import { MongoClient } from 'mongodb';
import bcrypt from 'bcryptjs';

const MONGODB_URI = 'mongodb+srv://database:database@cluster0.bf05rzr.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
const EMAIL = 'test@example.com';
const NEW_PASSWORD = '123456';

async function main() {
  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  const db = client.db('survey_db'); // если нужно, укажи имя БД явно
  const users = db.collection('users');

  const passwordHash = await bcrypt.hash(NEW_PASSWORD, 10);

  const result = await users.updateOne(
    { email: EMAIL },
    { $set: { passwordHash } }
  );

  if (result.modifiedCount === 1) {
    console.log('Пароль успешно обновлён!');
  } else {
    console.log('Пользователь не найден или пароль не изменён.');
  }

  await client.close();
}

main().catch(console.error);