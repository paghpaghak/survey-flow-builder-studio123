import { NextResponse } from 'next/server';
import clientPromise from '@/api/mongodb';

export async function GET(
  request: Request,
  { params }: { params: { surveyId: string } }
) {
  try {
    const client = await clientPromise;
    const db = client.db('survey_db');
    const responses = await db.collection('surveyResponses')
      .find({ surveyId: params.surveyId })
      .sort({ 'metadata.completedAt': -1 })
      .toArray();

    return NextResponse.json(responses);
  } catch (error) {
    console.error('Ошибка при получении результатов:', error);
    return NextResponse.json(
      { error: 'Ошибка при получении результатов' },
      { status: 500 }
    );
  }
} 