import { Express } from 'express';

export const swaggerSpec = {
  openapi: '3.0.0',
  info: {
    title: 'Survey Platform API',
    version: '1.0.0',
    description: 'API для платформы опросов',
  },
  servers: [
    {
      url: 'http://localhost:3001',
      description: 'Development server',
    },
  ],
  paths: {
    '/api/surveys': {
      get: {
        summary: 'Получить список всех опросов',
        tags: ['Surveys'],
        responses: {
          '200': {
            description: 'Список опросов',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: {
                    $ref: '#/components/schemas/Survey',
                  },
                },
              },
            },
          },
        },
      },
      post: {
        summary: 'Создать новый опрос',
        tags: ['Surveys'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/CreateSurveyRequest',
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'Опрос создан',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Survey',
                },
              },
            },
          },
        },
      },
    },
  },
  components: {
    schemas: {
      Survey: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          title: { type: 'string' },
          description: { type: 'string' },
          status: { type: 'string', enum: ['draft', 'published', 'archived'] },
          currentVersion: { type: 'number' },
          versions: {
            type: 'array',
            items: { $ref: '#/components/schemas/SurveyVersion' },
          },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      SurveyVersion: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          version: { type: 'number' },
          status: { type: 'string' },
          title: { type: 'string' },
          description: { type: 'string' },
          pages: {
            type: 'array',
            items: { $ref: '#/components/schemas/Page' },
          },
          questions: {
            type: 'array',
            items: { $ref: '#/components/schemas/Question' },
          },
        },
      },
      Page: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          title: { type: 'string' },
          description: { type: 'string' },
          questions: {
            type: 'array',
            items: { $ref: '#/components/schemas/Question' },
          },
        },
      },
      Question: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          pageId: { type: 'string' },
          title: { type: 'string' },
          type: { type: 'string' },
          required: { type: 'boolean' },
          description: { type: 'string' },
          options: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                text: { type: 'string' },
              },
            },
          },
        },
      },
      CreateSurveyRequest: {
        type: 'object',
        required: ['title', 'description', 'status'],
        properties: {
          title: { type: 'string' },
          description: { type: 'string' },
          status: { type: 'string', enum: ['draft', 'published', 'archived'] },
          currentVersion: { type: 'number' },
          versions: {
            type: 'array',
            items: { $ref: '#/components/schemas/SurveyVersion' },
          },
        },
      },
    },
  },
};

export default swaggerSpec;
