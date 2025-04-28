import express from 'express';
import cors from 'cors';
import { MongoClient, ObjectId } from 'mongodb';
import swaggerUi from 'swagger-ui-express';
import swaggerSpec from './swagger.js';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

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

// Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// MongoDB connection
const uri = process.env.MONGODB_URI || 'mongodb+srv://database:database@cluster0.bf05rzr.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
const client = new MongoClient(uri, {
  ssl: true,
  tls: true,
  tlsAllowInvalidCertificates: true,
  tlsAllowInvalidHostnames: true
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
    await client.connect();
    const db = client.db('survey_db');
    
    console.log('Получены данные для обновления:', JSON.stringify(req.body, null, 2));

    // Создаем карту всех вопросов для быстрого доступа
    const questionsMap = new Map();
    if (Array.isArray(req.body.questions)) {
      req.body.questions.forEach((q: any) => {
        questionsMap.set(q.id, { ...q });
      });
    }

    // Подготавливаем данные для обновления
    const updateData = {
      ...req.body,
      updatedAt: new Date(),
      versions: req.body.versions.map((version: any) => {
        // Обрабатываем вопросы в версии
        const versionQuestions = Array.isArray(version.questions) ? version.questions : [];
        versionQuestions.forEach((q: any) => {
          if (!questionsMap.has(q.id)) {
            questionsMap.set(q.id, { ...q });
          }
        });

        return {
          ...version,
          pages: version.pages.map((page: any) => {
            // Находим вопросы, принадлежащие этой странице
            const pageQuestions = Array.from(questionsMap.values())
              .filter((q: any) => q.pageId === page.id)
              .map((q: any) => ({
                ...q,
                pageId: page.id // Гарантируем правильный pageId
              }));

            console.log(`Страница ${page.id}: найдено ${pageQuestions.length} вопросов`);

            return {
              ...page,
              questions: pageQuestions
            };
          })
        };
      })
    };
    
    // Удаляем _id, чтобы не было ошибки при обновлении
    delete updateData._id;

    console.log('Подготовленные данные:', JSON.stringify(updateData, null, 2));

    // Используем findOneAndUpdate для атомарного обновления
    const result = await db.collection('surveys')
      .findOneAndUpdate(
        { _id: new ObjectId(req.params.id) },
        { $set: updateData },
        { 
          returnDocument: 'after',
          upsert: false
        }
      );
    
    if (!result.value) {
      console.error('Опрос не найден:', req.params.id);
      return res.status(404).json({ error: 'Survey not found' });
    }
    
    // Сериализация дат в Survey и SurveyVersion
    function serializeDates(obj) {
      if (!obj || typeof obj !== 'object') return obj;
      const newObj = Array.isArray(obj) ? [] : {};
      for (const key in obj) {
        if (!Object.prototype.hasOwnProperty.call(obj, key)) continue;
        const value = obj[key];
        if (value instanceof Date) {
          newObj[key] = value.toISOString();
        } else if (Array.isArray(value)) {
          newObj[key] = value.map(serializeDates);
        } else if (typeof value === 'object' && value !== null) {
          newObj[key] = serializeDates(value);
        } else {
          newObj[key] = value;
        }
      }
      return newObj;
    }
    
    const response = serializeDates(result.value);
    console.log('Отправляем ответ:', JSON.stringify(response, null, 2));
    res.json(response);
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
    const result = await db.collection('surveys')
      .deleteOne({ _id: new ObjectId(req.params.id) });
    
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Survey not found' });
    }
    
    res.status(204).send();
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
app.post('/api/surveys/:surveyId/responses', async (req, res) => {
  try {
    await client.connect();
    const db = client.db('survey_db');
    const response = {
      surveyId: new ObjectId(req.params.surveyId),
      answers: req.body.answers,
      createdAt: new Date()
    };
    
    const result = await db.collection('responses').insertOne(response);
    res.status(201).json({ ...response, _id: result.insertedId });
  } catch (error) {
    console.error('Error saving response:', error);
    res.status(500).json({ error: 'Failed to save response' });
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

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
  console.log(`Swagger UI available at http://localhost:${port}/api-docs`);
}); 