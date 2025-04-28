export const apiUpdateSurvey = async (survey: Survey): Promise<Survey> => {
  try {
    const response = await fetch(`${API_URL}/surveys/${survey.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: survey.title,
        description: survey.description,
        questions: survey.questions,
      }),
    });

    if (!response.ok) {
      throw new Error('Ошибка при обновлении опроса');
    }

    return response.json();
  } catch (error) {
    console.error('Ошибка при обновлении опроса:', error);
    throw error;
  }
}; 