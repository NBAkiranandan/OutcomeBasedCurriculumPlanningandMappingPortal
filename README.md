# OBCPMP - Outcome Based Curriculum Planning & Mapping Portal

OBCPMP is a comprehensive web portal designed to streamline Outcome Based Curriculum Planning and Mapping. The project consists of a full-stack architecture with a React-based frontend and an Express-based Node.js backend using MongoDB.

## Tech Stack

### Frontend
- **Framework:** React 18 with Vite
- **Styling:** Tailwind CSS
- **State Management:** Zustand, TanStack Query
- **Routing:** React Router DOM
- **Forms & Validation:** React Hook Form, Zod
- **Other Tools:** Framer Motion, Recharts, pdf-lib, docx

### Backend
- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** MongoDB (with Mongoose)
- **Security:** Helmet, Express Rate Limit, CORS, bcryptjs, jsonwebtoken
- **Parsing:** pdf-parse

## Project Structure

The project has been refactored into a clear separation of concerns:
- \`/frontend\`: Contains all React application code.
- \`/backend\`: Contains all Node.js server API logic.
- \`/scripts\`: Contains optional one-off utilities and scripts.

## Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn
- MongoDB (running locally or remote cluster)

### Installation

To install dependencies for both the frontend and backend simultaneously, run from the root directory:

\`\`\`bash
npm run install:all
\`\`\`

### Running the Project Locally

You can launch both the frontend and backend concurrently from the root directory with a single command:

\`\`\`bash
npm run dev:all
\`\`\`

This will start:
- Frontend Vite server (typically on \`http://localhost:5173\`)
- Backend Express server (with nodemon)

### Other Commands
From the root directory:
- \`npm run dev\` - Start only the frontend server
- \`npm run dev:backend\` - Start only the backend server
- \`npm run build\` - Build the frontend for production
- \`npm run lint\` - Lint the frontend codebase
- \`npm run seed\` - Run the backend database seeder

## Version Control
A strict \`.gitignore\` has been included to prevent committing build artifacts, environment variables, and \`node_modules\`. Make sure to configure your own \`.env\` files in both the \`frontend\` and \`backend\` folders based on your local environment setup before running the project.
