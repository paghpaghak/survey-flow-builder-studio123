import express from 'express';
import cors from 'cors';
import { MongoClient, ObjectId, GridFSBucket } from 'mongodb';
import swaggerUi from 'swagger-ui-express';
import swaggerSpec from './swagger.js';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import type { UpdateSurveyRequest, SurveyResponse } from '@survey-platform/shared-types';
import { serializeDates } from './utils/serializeDates.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import cookieParser from 'cookie-parser';
import multer from 'multer';
import { Readable } from 'stream';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const port = process.env.PORT || 3001;

// CORS configuration
const corsOptions = {
  origin: ['http://localhost:8081', 'http://127.0.0.1:8081'], // Разрешенные источники
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], // Разрешенные методы
  allowedHeaders: ['Content-Type', 'Authorization'], // Разрешенные заголовки
  credentials: true, // Разрешить передачу учетных данных
  optionsSuccessStatus: 200 // Статус для OPTIONS запросов
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());
app.use((cookieParser as any)());

// Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Security header: X-Content-Type-Options
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  next();
});

// MongoDB connection
const uri = process.env.MONGODB_URI || 'mongodb+srv://database:database@cluster0.bf05rzr.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
const client = new MongoClient(uri, {
  ssl: true,
  tls: true,
  tlsAllowInvalidCertificates: true,
  tlsAllowInvalidHostnames: true
});

// Multer configuration для загрузки файлов в память
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB лимит
  },
});

// Initialize collections
async function initializeCollections(db) {
  try {
    // Создаем коллекцию surveys, если её нет
    const surveysCollection = db.collection('surveys');
    await surveysCollection.createIndex({ createdAt: -1 });
    await surveysCollection.createIndex({ title: 'text' });

    // Создаем коллекцию questions, если её нет
    const questionsCollection = db.collection('questions');
    await questionsCollection.createIndex({ type: 1 });
    await questionsCollection.createIndex({ title: 'text' });

    // Создаем коллекцию responses, если её нет
    const responsesCollection = db.collection('responses');
    await responsesCollection.createIndex({ surveyId: 1 });
    await responsesCollection.createIndex({ createdAt: -1 });

    console.log('Collections initialized successfully');
    return true;
  } catch (error) {
    console.error('Error initializing collections:', error);
    return false;
  }
}

/**
 * @swagger
 * /api/surveys:
 *   get:
 *     summary: Получить список всех опросов
 *     tags: [Surveys]
 *     responses:
 *       200:
 *         description: Список опросов
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Survey'
 */
app.get('/api/surveys', async (req, res) => {
  console.log('GET /api/surveys request received');
  try {
    console.log('Connecting to MongoDB...');
    await client.connect();
    const db = client.db('survey_db');
    console.log('Connected to MongoDB, fetching surveys...');
    const surveys = await db.collection('surveys')
      .find({})
      .sort({ createdAt: -1 })
      .toArray();
    console.log(`Found ${surveys.length} surveys`);
    // Преобразуем _id в id
    const surveysWithId = surveys.map(survey => ({
      ...survey,
      id: survey._id?.toString(),
    }));
    res.json(surveysWithId);
  } catch (error) {
    console.error('Error fetching surveys:', error);
    res.status(500).json({ error: 'Failed to fetch surveys' });
  }
});

/**
 * @swagger
 * /api/surveys/{id}:
 *   get:
 *     summary: Получить опрос по ID
 *     tags: [Surveys]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Опрос найден
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Survey'
 *       404:
 *         description: Опрос не найден
 */
app.get('/api/surveys/:id', async (req, res) => {
  try {
    await client.connect();
    const db = client.db('survey_db');
    const survey = await db.collection('surveys')
      .findOne({ _id: new ObjectId(req.params.id) });
    
    if (!survey) {
      return res.status(404).json({ error: 'Survey not found' });
    }
    
    res.json(survey);
  } catch (error) {
    console.error('Error fetching survey:', error);
    res.status(500).json({ error: 'Failed to fetch survey' });
  }
});

/**
 * @swagger
 * /api/surveys:
 *   post:
 *     summary: Создать новый опрос
 *     tags: [Surveys]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Survey'
 *     responses:
 *       201:
 *         description: Опрос создан
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Survey'
 */
app.post('/api/surveys', async (req, res) => {
  try {
    console.log('Creating new survey with data:', req.body);
    await client.connect();
    const db = client.db('survey_db');
    console.log('Connected to database:', db.databaseName);
    
    const survey = {
      ...req.body,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    console.log('Survey object to insert:', survey);
    const result = await db.collection('surveys').insertOne(survey);
    console.log('Insert result:', result);
    
    res.status(201).json({ ...survey, _id: result.insertedId });
  } catch (error) {
    console.error('Error creating survey:', error);
    res.status(500).json({ error: 'Failed to create survey' });
  }
});

/**
 * @swagger
 * /api/surveys/{id}:
 *   put:
 *     summary: Обновить опрос
 *     tags: [Surveys]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Survey'
 *     responses:
 *       200:
 *         description: Опрос обновлен
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Survey'
 *       404:
 *         description: Опрос не найден
 */
app.put('/api/surveys/:id', async (req, res) => {
  try {
    const surveyId = new ObjectId(req.params.id);
    const updateData = req.body;

    // Prepare update data by converting date strings to Date objects
    const serializedData = serializeDates(updateData);

    await client.connect();
    const db = client.db('survey_db');

    const result = await db.collection('surveys').updateOne(
      { _id: surveyId },
      { $set: serializedData }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'Survey not found' });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error updating survey:', error);
    res.status(500).json({ error: 'Failed to update survey' });
  }
});

/**
 * @swagger
 * /api/surveys/{id}:
 *   delete:
 *     summary: Удалить опрос
 *     tags: [Surveys]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Опрос удален
 *       404:
 *         description: Опрос не найден
 */
app.delete('/api/surveys/:id', async (req, res) => {
  try {
    await client.connect();
    const db = client.db('survey_db');
    const surveyObjectId = new ObjectId(req.params.id);
    const result = await db.collection('surveys')
      .deleteOne({ _id: surveyObjectId });
    
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Survey not found' });
    }

    // Каскадное удаление ответов
    const responsesResult = await db.collection('responses').deleteMany({ surveyId: surveyObjectId });

    res.status(200).json({
      message: 'Survey and related responses deleted',
      deletedSurvey: result.deletedCount,
      deletedResponses: responsesResult.deletedCount,
    });
  } catch (error) {
    console.error('Error deleting survey:', error);
    res.status(500).json({ error: 'Failed to delete survey' });
  }
});

/**
 * @swagger
 * /api/surveys/{surveyId}/responses:
 *   post:
 *     summary: Сохранить ответ на опрос
 *     tags: [Responses]
 *     parameters:
 *       - in: path
 *         name: surveyId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Response'
 *     responses:
 *       201:
 *         description: Ответ сохранен
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Response'
 */
app.post('/api/surveys/:id/responses', async (req, res) => {
  try {
    const surveyId = new ObjectId(req.params.id);
    const response = {
      surveyId,
      answers: req.body.answers,
      createdAt: new Date()
    };

    await client.connect();
    const db = client.db('survey_db');

    const result = await db.collection('responses').insertOne(response);
    res.status(201).json({ ...response, _id: result.insertedId });
  } catch (error) {
    console.error('Error saving survey response:', error);
    res.status(500).json({ error: 'Failed to save survey response' });
  }
});

/**
 * @swagger
 * /api/surveys/{surveyId}/responses:
 *   get:
 *     summary: Получить все ответы на опрос
 *     tags: [Responses]
 *     parameters:
 *       - in: path
 *         name: surveyId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Список ответов
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Response'
 */
app.get('/api/surveys/:surveyId/responses', async (req, res) => {
  try {
    await client.connect();
    const db = client.db('survey_db');
    const responses = await db.collection('responses')
      .find({ surveyId: new ObjectId(req.params.surveyId) })
      .sort({ createdAt: -1 })
      .toArray();
    
    res.json(responses);
  } catch (error) {
    console.error('Error fetching responses:', error);
    res.status(500).json({ error: 'Failed to fetch responses' });
  }
});

// Test endpoint
app.get('/api/test-connection', async (req, res) => {
  try {
    console.log('Attempting to connect to MongoDB...');
    console.log('Using URI:', uri);
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db('survey_db');
    const collections = await db.listCollections().toArray();
    
    res.json({
      success: true,
      message: 'Successfully connected to MongoDB',
      collections: collections.map(col => col.name)
    });
  } catch (error) {
    console.error('MongoDB connection error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to connect to MongoDB',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * @swagger
 * /api/init-db:
 *   post:
 *     summary: Инициализировать базу данных
 *     description: Создает необходимые коллекции и индексы в базе данных
 *     tags: [Database]
 *     responses:
 *       200:
 *         description: База данных успешно инициализирована
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       500:
 *         description: Ошибка при инициализации базы данных
 */
app.post('/api/init-db', async (req, res) => {
  try {
    await client.connect();
    const db = client.db('survey_db');
    const success = await initializeCollections(db);
    
    if (success) {
      res.json({
        success: true,
        message: 'Database collections initialized successfully'
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to initialize collections'
      });
    }
  } catch (error) {
    console.error('Error initializing database:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to initialize database',
      error: error.message
    });
  }
});

app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Вход пользователя
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Успешный вход
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   type: object
 *                 token:
 *                   type: string
 *       401:
 *         description: Неверный email или пароль
 */
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log('Login attempt:', email);
    await client.connect();
    const db = client.db('survey_db');
    const user = await db.collection('users').findOne({ email });
    console.log('User found:', user);
    if (!user) return res.status(401).json({ error: 'Неверный email или пароль' });

    const isValid = await bcrypt.compare(password, user.passwordHash);
    console.log('Password valid:', isValid);
    if (!isValid) return res.status(401).json({ error: 'Неверный email или пароль' });

    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    res
      .cookie('auth-token', token, {
        httpOnly: true,
        sameSite: 'strict',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60 * 1000 // 1 день
      })
      .json({
        user: {
          id: user._id,
          email: user.email,
          role: user.role,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
        token,
      });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Получить информацию о текущем пользователе
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Информация о пользователе
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   type: object
 *       401:
 *         description: Не авторизован
 */
app.get('/api/auth/me', async (req, res) => {
  try {
    // Получаем токен из cookie или заголовка Authorization
    const token = req.cookies?.['auth-token'] || req.headers['authorization']?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ error: 'Не авторизован' });

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    } catch (err) {
      return res.status(401).json({ error: 'Недействительный токен' });
    }

    await client.connect();
    const db = client.db('survey_db');
    const user = await db.collection('users').findOne({ _id: new ObjectId(decoded.userId) });
    if (!user) return res.status(404).json({ error: 'Пользователь не найден' });

    // Не возвращаем passwordHash
    const { passwordHash, ...userWithoutPassword } = user;
    res.json({ user: userWithoutPassword });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

/**
 * @swagger
 * /api/files/upload:
 *   post:
 *     summary: Загрузить файл
 *     tags: [Files]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *               surveyId:
 *                 type: string
 *               questionId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Файл успешно загружен
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 fileId:
 *                   type: string
 *                 filename:
 *                   type: string
 *                 size:
 *                   type: number
 *       400:
 *         description: Ошибка валидации
 */
app.post('/api/files/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Файл не предоставлен' });
    }

    const { surveyId, questionId } = req.body;
    if (!surveyId || !questionId) {
      return res.status(400).json({ error: 'surveyId и questionId обязательны' });
    }

    await client.connect();
    const db = client.db('survey_db');
    const bucket = new GridFSBucket(db, { bucketName: 'uploads' });

    // Создаем readable stream из buffer
    const uploadStream = bucket.openUploadStream(req.file.originalname, {
      metadata: {
        surveyId,
        questionId,
        originalName: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        uploadedAt: new Date(),
      },
    });

    const readableStream = new Readable();
    readableStream.push(req.file.buffer);
    readableStream.push(null);

    readableStream.pipe(uploadStream);

    uploadStream.on('finish', () => {
      res.json({
        fileId: uploadStream.id.toString(),
        filename: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype,
      });
    });

    uploadStream.on('error', (error) => {
      console.error('Upload error:', error);
      res.status(500).json({ error: 'Ошибка при загрузке файла' });
    });

  } catch (error) {
    console.error('File upload error:', error);
    res.status(500).json({ error: 'Ошибка сервера при загрузке файла' });
  }
});

/**
 * @swagger
 * /api/files/{fileId}:
 *   get:
 *     summary: Скачать файл
 *     tags: [Files]
 *     parameters:
 *       - in: path
 *         name: fileId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Файл найден
 *         content:
 *           application/octet-stream:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         description: Файл не найден
 */
app.get('/api/files/:fileId', async (req, res) => {
  try {
    const { fileId } = req.params;
    
    await client.connect();
    const db = client.db('survey_db');
    const bucket = new GridFSBucket(db, { bucketName: 'uploads' });

    // Получаем метаданные файла
    const files = await bucket.find({ _id: new ObjectId(fileId) }).toArray();
    if (files.length === 0) {
      return res.status(404).json({ error: 'Файл не найден' });
    }

    const file = files[0];

    // Устанавливаем заголовки для скачивания
    res.set({
      'Content-Type': file.metadata?.mimetype || 'application/octet-stream',
      'Content-Disposition': `attachment; filename="${file.filename}"`,
      'Content-Length': file.length,
    });

    // Создаем stream для скачивания
    const downloadStream = bucket.openDownloadStream(new ObjectId(fileId));
    
    downloadStream.on('error', (error) => {
      console.error('Download error:', error);
      if (!res.headersSent) {
        res.status(404).json({ error: 'Файл не найден' });
      }
    });

    downloadStream.pipe(res);

  } catch (error) {
    console.error('File download error:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Ошибка сервера при скачивании файла' });
    }
  }
});

/**
 * @swagger
 * /api/files/{fileId}/info:
 *   get:
 *     summary: Получить информацию о файле
 *     tags: [Files]
 *     parameters:
 *       - in: path
 *         name: fileId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Информация о файле
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 fileId:
 *                   type: string
 *                 filename:
 *                   type: string
 *                 size:
 *                   type: number
 *                 mimetype:
 *                   type: string
 *                 uploadedAt:
 *                   type: string
 *       404:
 *         description: Файл не найден
 */
app.get('/api/files/:fileId/info', async (req, res) => {
  try {
    const { fileId } = req.params;
    
    await client.connect();
    const db = client.db('survey_db');
    const bucket = new GridFSBucket(db, { bucketName: 'uploads' });

    const files = await bucket.find({ _id: new ObjectId(fileId) }).toArray();
    if (files.length === 0) {
      return res.status(404).json({ error: 'Файл не найден' });
    }

    const file = files[0];
    res.json({
      fileId: file._id.toString(),
      filename: file.filename,
      size: file.length,
      mimetype: file.metadata?.mimetype,
      uploadedAt: file.uploadDate,
      surveyId: file.metadata?.surveyId,
      questionId: file.metadata?.questionId,
    });

  } catch (error) {
    console.error('File info error:', error);
    res.status(500).json({ error: 'Ошибка сервера при получении информации о файле' });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
  console.log(`Swagger UI available at http://localhost:${port}/api-docs`);
}); 