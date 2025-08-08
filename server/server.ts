import 'dotenv/config';
import app from './app.js';
import { DatabaseConfig } from './config/database.js';

const port = process.env.PORT || 3001;

/**
 * Запуск сервера с подключением к базе данных
 */
async function startServer(): Promise<void> {
  try {
    // Подключаемся к MongoDB
    console.log('Connecting to MongoDB...');
    await DatabaseConfig.connect();
    console.log('✅ Connected to MongoDB successfully');
    
    // Инициализируем коллекции
    const db = DatabaseConfig.getDb();
    const collectionsInitialized = await DatabaseConfig.initializeCollections(db);
    
    if (collectionsInitialized) {
      console.log('✅ Database collections initialized successfully');
    } else {
      console.log('⚠️ Some collections failed to initialize');
    }
    
    // Запускаем сервер
    app.listen(port, () => {
      console.log(`🚀 Server running on port ${port}`);
      console.log(`📚 Swagger UI available at http://localhost:${port}/api-docs`);
      console.log(`🏥 Health check at http://localhost:${port}/api/health`);
    });
    
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Обработка graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🔄 Received SIGINT, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🔄 Received SIGTERM, shutting down gracefully...');
  process.exit(0);
});

// Запускаем сервер
startServer(); 