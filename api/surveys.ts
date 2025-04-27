import { NextApiRequest, NextApiResponse } from 'next';
import clientPromise from './mongodb';

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
        const surveys = await db.collection('surveys').find({}).toArray();
        res.json(surveys);
        break;

      case 'POST':
        const survey = req.body;
        const result = await db.collection('surveys').insertOne({
          ...survey,
          createdAt: new Date(),
          updatedAt: new Date()
        });
        res.json(result);
        break;

      case 'PUT':
        const { id, ...updateData } = req.body;
        const updateResult = await db.collection('surveys').updateOne(
          { _id: id },
          { 
            $set: {
              ...updateData,
              updatedAt: new Date()
            }
          }
        );
        res.json(updateResult);
        break;

      case 'DELETE':
        const { surveyId } = req.query;
        const deleteResult = await db.collection('surveys').deleteOne({ _id: surveyId });
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