import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { ObjectId } from 'mongodb';

interface RouteParams {
  params: {
    surveyId: string;
  };
}

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const surveyId = new ObjectId(params.surveyId);
    const count = await db.surveyResponse.count({ surveyId });

    return NextResponse.json({ count });
  } catch (error) {
    console.error('Error getting survey response count:', error);
    return NextResponse.json(
      { error: 'Failed to get survey response count' },
      { status: 500 }
    );
  }
} 