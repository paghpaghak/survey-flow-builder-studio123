import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { ObjectId } from 'mongodb';

export async function GET(
  request: Request,
  { params }: { params: { surveyId: string } }
) {
  try {
    console.log('Fetching responses for survey:', params.surveyId);
    
    // Преобразуем строку surveyId в ObjectId
    const surveyObjectId = new ObjectId(params.surveyId);
    
    const responses = await db.surveyResponse.findMany({
      where: {
        surveyId: surveyObjectId.toString(),
      },
      orderBy: {
        metadata: {
          completedAt: 'desc',
        },
      },
    });

    console.log('Found responses:', responses);

    if (!responses) {
      console.log('No responses found');
      return NextResponse.json({ responses: [] });
    }

    // Преобразуем ObjectId в строки для ответа и нормализуем metadata
    const formattedResponses = responses.map(response => ({
      ...response,
      id: response.id?.toString?.() || response._id?.toString?.() || '',
      surveyId: response.surveyId?.toString?.() || '',
      metadata: {
        ...(response.metadata || {}),
        completedAt: response.metadata?.completedAt || response.createdAt || response.created_at || new Date().toISOString(),
        duration: response.metadata?.duration || 0,
        device: response.metadata?.device || '-',
        browser: response.metadata?.browser || '-',
      }
    }));

    return NextResponse.json({ responses: formattedResponses });
  } catch (error) {
    console.error('Ошибка при получении ответов:', error);
    return NextResponse.json(
      { error: 'Ошибка при получении ответов' },
      { status: 500 }
    );
  }
} 