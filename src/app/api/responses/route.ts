import { NextResponse } from 'next/server';
import { CreateSurveyResponseDto } from '@/types/survey-response';
import { db } from '@/lib/db';

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

    // Сохранение ответа в базу данных
    const response = await db.surveyResponse.create({
      data: {
        surveyId: responseData.surveyId,
        version: responseData.version,
        answers: responseData.answers,
        metadata: {
          ...responseData.metadata,
          completedAt: new Date().toISOString(),
        },
      },
    });

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error('Ошибка при сохранении ответа:', error);
    return NextResponse.json(
      { error: 'Ошибка при сохранении ответа' },
      { status: 500 }
    );
  }
} 