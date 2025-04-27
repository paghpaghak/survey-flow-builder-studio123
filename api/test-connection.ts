import { NextApiRequest, NextApiResponse } from 'next';
import clientPromise from './mongodb';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    console.log('Attempting to connect to MongoDB...');
    console.log('MongoDB URI:', process.env.MONGODB_URI ? 'Present' : 'Missing');
    
    const client = await clientPromise;
    console.log('MongoDB client created successfully');
    
    const db = client.db('survey_db');
    console.log('Database connection established');
    
    const collections = await db.listCollections().toArray();
    console.log('Collections retrieved successfully');
    
    res.status(200).json({
      success: true,
      message: 'Successfully connected to MongoDB',
      collections: collections.map(col => col.name)
    });
  } catch (error) {
    console.error('MongoDB connection error:', error);
    console.error('Error details:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    
    res.status(500).json({
      success: false,
      message: 'Failed to connect to MongoDB',
      error: error instanceof Error ? error.message : 'Unknown error',
      details: process.env.NODE_ENV === 'development' ? {
        name: error instanceof Error ? error.name : 'Unknown',
        stack: error instanceof Error ? error.stack : undefined
      } : undefined
    });
  }
} 