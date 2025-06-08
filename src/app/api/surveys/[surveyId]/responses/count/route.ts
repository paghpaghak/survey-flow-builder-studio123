import { NextResponse } from 'next/server';
import clientPromise from '@/api/mongodb';
import { ObjectId } from 'mongodb';

interface RouteParams {
  params: {
    surveyId: string;
  };
}

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const client = await clientPromise;
    const db = client.db('survey_db');
    const surveyId = new ObjectId(params.surveyId);
    const count = await db.collection('surveyResponses').countDocuments({ surveyId });

    return NextResponse.json({ count });
  } catch (error) {
    console.error('Error getting survey response count:', error);
    return NextResponse.json(
      { error: 'Failed to get survey response count' },
      { status: 500 }
    );
  }
} 