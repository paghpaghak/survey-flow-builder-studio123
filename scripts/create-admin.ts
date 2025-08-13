import { MongoClient } from 'mongodb';
import * as bcrypt from 'bcryptjs';

// Вставляет тестовые учетные записи для всех ролей
// Email: test-<role>@test.com, Пароль: 12345678
const MONGODB_URI = 'mongodb+srv://database:database@cluster0.bf05rzr.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

const roles = ['admin', 'editor', 'expert', 'viewer'] as const;
type Role = (typeof roles)[number];

async function createTestUsers() {
  const client = new MongoClient(MONGODB_URI);
  await client.connect();

  const db = client.db('survey_db');
  const users = db.collection('users');

  let createdCount = 0;

  try {
    for (const role of roles) {
      const email = `test-${role}@test.com`;
      const username = `test-${role}`;

      const existing = await users.findOne({ $or: [{ email }, { username }] });
      if (existing) {
        console.log(`Учетная запись уже существует: ${email} / ${username}`);
        continue;
      }

      const passwordHash = await bcrypt.hash('12345678', 10);

      await users.insertOne({
        email,
        username,
        passwordHash,
        role: role as Role,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      console.log(`Создан пользователь: ${email} (роль: ${role})`);
      createdCount += 1;
    }

    console.log(`Готово. Создано новых пользователей: ${createdCount}.`);
  } finally {
    await client.close();
  }
}

createTestUsers().catch((error) => {
  console.error('Ошибка при создании тестовых пользователей:', error);
});
