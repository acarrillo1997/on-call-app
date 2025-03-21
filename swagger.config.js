const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'On-Call App API',
      version: '1.0.0',
      description: 'API documentation for the On-Call App',
    },
    servers: [
      {
        url: process.env.NODE_ENV === 'production' 
          ? 'https://your-production-domain.com' 
          : 'http://localhost:3000',
        description: process.env.NODE_ENV === 'production' ? 'Production server' : 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
  },
  apis: ['./app/api/**/*.js', './app/api/**/*.ts', './app/api/**/route.js', './app/api/**/route.ts'],
};

const specs = swaggerJsdoc(options);

module.exports = specs; 