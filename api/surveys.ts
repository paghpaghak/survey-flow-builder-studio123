import { NextApiRequest, NextApiResponse } from 'next';
import clientPromise from './mongodb';
import { ObjectId } from 'mongodb';

interface MongoDocument {
  _id: ObjectId;
  [key: string]: any; // Для остальных полей документа
}

// Функция для преобразования _id в id
const transformMongoDocument = <T extends { id?: string }>(doc: MongoDocument | null): T | null => {
  if (!doc) return null;
  const transformed = { ...doc, id: doc._id.toString() } as Partial<typeof doc> & { id: string };
  delete transformed._id;
  return transformed as T;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Настройка CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const client = await clientPromise;
    const db = client.db('survey_db');

    switch (req.method) {
      case 'GET':
        if (req.query.id) {
          // Получение конкретного опроса по ID
          const survey = await db.collection('surveys').findOne(
            { _id: new ObjectId(req.query.id as string) }
          );
          
          if (!survey) {
            res.status(404).json({ error: 'Survey not found' });
            return;
          }

          // Преобразуем документ и отправляем ответ
          const transformedSurvey = transformMongoDocument(survey);
          console.log('Transformed survey:', transformedSurvey);
          res.json(transformedSurvey);
        } else {
          // Получение списка всех опросов
          const surveys = await db.collection('surveys').find({}).toArray();
          const transformedSurveys = surveys.map(transformMongoDocument);
          res.json(transformedSurveys);
        }
        break;

      case 'POST':
        const survey = req.body;
        const result = await db.collection('surveys').insertOne({
          ...survey,
          createdAt: new Date(),
          updatedAt: new Date()
        });
        const insertedSurvey = await db.collection('surveys').findOne({ _id: result.insertedId });
        res.json(transformMongoDocument(insertedSurvey));
        break;

      case 'PUT':
        const { id, ...updateData } = req.body;
        const updateResult = await db.collection('surveys').findOneAndUpdate(
          { _id: new ObjectId(id) },
          { 
            $set: {
              ...updateData,
              updatedAt: new Date()
            }
          },
          { returnDocument: 'after' }
        );
        res.json(transformMongoDocument(updateResult.value));
        break;

      case 'DELETE':
        const { surveyId } = req.query;
        const deleteResult = await db.collection('surveys').deleteOne(
          { _id: new ObjectId(surveyId as string) }
        );
        res.json(deleteResult);
        break;

      default:
        res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
} 