# On-Call Management App

A web application for managing on-call schedules and incident response, using Next.js and Hanko for authentication.

## Features

- Secure authentication with Hanko (passwordless, passkeys support)
- Dashboard with incident statistics
- On-call schedule management
- Incident tracking and management
- Team management
- User profile and settings

## Technology Stack

- **Frontend**: Next.js, React, TypeScript, Tailwind CSS
- **Authentication**: Hanko (passwordless authentication)
- **UI Components**: Shadcn UI

## Getting Started

### Prerequisites

- Node.js 18.17 or later
- npm or yarn
- Hanko account (free tier available)

### Installation

1. Clone this repository:
   ```bash
   git clone https://github.com/YOUR_USERNAME/on-call-app.git
   cd on-call-app
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```

3. Set up environment variables:
   - Copy `.env.local.example` to `.env.local`:
     ```bash
     cp .env.local.example .env.local
     ```
   - Fill in your Hanko API URL from your Hanko Cloud Console

4. Run the development server:
   ```bash
   npm run dev
   # or
   yarn dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

## Setting Up Hanko Authentication

1. Create an account at [Hanko Console](https://cloud.hanko.io/)
2. Set up a new project
3. Copy your Hanko API URL to the `.env.local` file
4. Configure allowed origins in your Hanko Cloud Console settings

## Database Setup

This project uses PostgreSQL for data persistence. Follow these steps to set up the database:

1. Install PostgreSQL on your machine if you haven't already.
2. Create a PostgreSQL database:
   ```bash
   createdb oncall
   ```
3. Update your `.env` file with the correct database connection URL:
   ```
   DATABASE_URL="postgresql://username:password@localhost:5432/oncall"
   ```
   Replace `username` and `password` with your PostgreSQL credentials.

4. Run migrations to create the database schema:
   ```bash
   npm run prisma:migrate
   ```

5. Generate the Prisma client:
   ```bash
   npm run prisma:generate
   ```

To explore your database with a visual interface, you can use Prisma Studio:
```bash
npm run prisma:studio
```

## License

[MIT](LICENSE) 