import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  request: Request,
  { params }: { params: { surveyId: string } }
) {
  try {
    const responses = await db.surveyResponse.findMany({
      where: {
        surveyId: params.surveyId,
      },
      orderBy: {
        metadata: {
          completedAt: 'desc',
        },
      },
    });

    return NextResponse.json(responses);
  } catch (error) {
    console.error('Ошибка при получении результатов:', error);
    return NextResponse.json(
      { error: 'Ошибка при получении результатов' },
      { status: 500 }
    );
  }
} 