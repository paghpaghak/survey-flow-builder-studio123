import type { CreateSurveyResponseDto } from '@survey-platform/shared-types';
import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/api/mongodb';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const responseData = body as CreateSurveyResponseDto;

    // Валидация данных
    if (!responseData.surveyId || !responseData.version || !responseData.answers) {
      return NextResponse.json(
        { error: 'Необходимые поля отсутствуют' },
        { status: 400 }
      );
    }

    // Сохранение ответа в базу данных (MongoDB)
    const client = await clientPromise;
    const db = client.db('survey_db');
    const result = await db.collection('surveyResponses').insertOne({
      surveyId: responseData.surveyId,
      version: responseData.version,
      answers: responseData.answers,
      metadata: {
        ...responseData.metadata,
        completedAt: new Date().toISOString(),
      },
    });

    return NextResponse.json({ insertedId: result.insertedId }, { status: 201 });
  } catch (error) {
    console.error('Ошибка при сохранении ответа:', error);
    return NextResponse.json(
      { error: 'Ошибка при сохранении ответа' },
      { status: 500 }
    );
  }
} 