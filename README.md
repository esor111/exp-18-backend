# Mock API Server

A Docker-containerized Express.js mock API server for a learning goals tracking application.

## Features

- RESTful API endpoints for managing learning topics and subtopics
- Progress tracking and earnings calculation
- Health check endpoint
- Docker support with health checks
- CORS enabled for frontend integration

## Quick Start

### Using Docker Compose (Recommended)

1. **Build and run the container:**
   ```bash
   docker-compose up --build
   ```

2. **Run in detached mode:**
   ```bash
   docker-compose up -d --build
   ```

3. **Stop the container:**
   ```bash
   docker-compose down
   ```

### Using Docker directly

1. **Build the image:**
   ```bash
   docker build -t mock-api-server .
   ```

2. **Run the container:**
   ```bash
   docker run -p 3001:3001 --name mock-api-server mock-api-server
   ```

3. **Stop and remove the container:**
   ```bash
   docker stop mock-api-server
   docker rm mock-api-server
   ```

### Local Development

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start the server:**
   ```bash
   npm start
   ```

3. **Start with hot reload:**
   ```bash
   npm run dev
   ```

## API Endpoints

Once running, the server will be available at `http://localhost:3001`

### Health Check
- `GET /health` - Server health status

### Dashboard
- `GET /api/dashboard` - Get dashboard data with totals and progress
- `PUT /api/dashboard/global-goal` - Update global earning goal

### Topics
- `GET /api/topics` - Get all topic categories
- `POST /api/topics` - Create a new topic
- `GET /api/topics/:topicId` - Get specific topic details
- `PUT /api/topics/:topicId` - Update topic

### Sub-Topics
- `POST /api/topics/:topicId/sub-topics` - Create subtopic under a topic
- `GET /api/sub-topics/:subTopicId` - Get subtopic details
- `PUT /api/sub-topics/:subTopicId` - Update subtopic
- `POST /api/sub-topics/:subTopicId/reps` - Log reps (+1 or -1)

### Categories
- `GET /api/categories` - Get all available categories

## Environment Variables

- `PORT` - Server port (default: 3001)
- `NODE_ENV` - Environment mode (default: production in Docker)

## Docker Health Check

The container includes a health check that verifies the `/health` endpoint every 30 seconds.

## Sample API Usage

```javascript
// Get dashboard data
fetch('http://localhost:3001/api/dashboard')
  .then(res => res.json())
  .then(data => console.log(data));

// Add a rep to a subtopic
fetch('http://localhost:3001/api/sub-topics/1-1/reps', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ reps: 1 })
})
.then(res => res.json())
.then(data => console.log(data));
```

## Development

The server includes:
- Request logging middleware
- CORS support for frontend integration
- Automatic calculation of earnings and progress
- Data validation for API requests
- Graceful shutdown handling

## Docker Network

The compose file creates a dedicated network (`api-network`) for potential integration with other services.
