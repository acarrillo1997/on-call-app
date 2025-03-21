# API Documentation

This project includes Swagger documentation for all API endpoints. The documentation is available at `/api-docs` when running the application.

## Accessing the API Documentation

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Open your browser and navigate to: [http://localhost:3000/api-docs](http://localhost:3000/api-docs)

## Authentication

Most API endpoints require authentication. The API uses JWT tokens for authentication, which should be provided as a Bearer token in the Authorization header:

```
Authorization: Bearer YOUR_JWT_TOKEN
```

## Available API Categories

The API documentation is organized by the following categories:

- **Teams**: Endpoints for creating, retrieving, and managing teams
- **Team Members**: Endpoints for managing team membership
- **Incidents**: Endpoints for creating and managing incidents
- **Users**: Endpoints for user management
- **Auth**: Authentication endpoints
- **Schedules**: On-call schedule management
- **Invitations**: Team invitation endpoints

## Making API Requests

You can test API endpoints directly from the Swagger UI by:

1. Clicking on an endpoint to expand it
2. Clicking the "Try it out" button
3. Filling in any required parameters
4. Clicking "Execute" to make the request

## Local Development

To add documentation to new API endpoints, follow these guidelines:

1. Use JSDoc comments with the `@swagger` tag above each API handler function
2. Define the path, HTTP method, parameters, request body, and responses
3. Restart the development server to see your changes

Example:

```javascript
/**
 * @swagger
 * /api/resource:
 *   get:
 *     summary: Get all resources
 *     description: Retrieves all resources the user has access to
 *     tags:
 *       - Resources
 *     responses:
 *       200:
 *         description: A list of resources
 */
export async function GET(request) {
  // Handler implementation
}
``` 