import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Survey Flow Builder API',
      version: '1.0.0',
      description: 'API для создания и управления опросами',
    },
    servers: [
      {
        url: 'http://localhost:3001',
        description: 'Development server',
      },
    ],
    components: {
      schemas: {
        Survey: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              description: 'Уникальный идентификатор опроса'
            },
            title: {
              type: 'string',
              description: 'Название опроса'
            },
            description: {
              type: 'string',
              description: 'Описание опроса'
            },
            questions: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/Question'
              }
            },
            createdAt: {
              type: 'string',
              format: 'date-time'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time'
            }
          }
        },
        Question: {
          type: 'object',
          properties: {
            id: {
              type: 'string'
            },
            type: {
              type: 'string',
              enum: ['text', 'number', 'radio', 'checkbox', 'select', 'date', 'time', 'datetime', 'phone', 'email', 'parallel_group']
            },
            title: {
              type: 'string'
            },
            description: {
              type: 'string'
            },
            required: {
              type: 'boolean'
            },
            settings: {
              type: 'object',
              additionalProperties: true
            },
            parallelQuestions: {
              type: 'array',
              items: {
                type: 'string'
              }
            }
          }
        },
        Response: {
          type: 'object',
          properties: {
            _id: {
              type: 'string'
            },
            surveyId: {
              type: 'string'
            },
            answers: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  questionId: {
                    type: 'string'
                  },
                  value: {
                    type: 'string'
                  }
                }
              }
            },
            createdAt: {
              type: 'string',
              format: 'date-time'
            }
          }
        }
      }
    }
  },
  apis: ['./server/index.ts'], // путь к файлу с API
};

export default swaggerJsdoc(options); 