const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001; // Using 3001 to avoid conflict with Next.js dev server

// --- Mock Data Store (from src/lib/mock-data.ts) ---
let nextTopicId = 4;
let nextSubtopicId = 100;

let globalGoal = 10000;
let topics = [
  {
    id: '1',
    title: 'Learn Advanced React Patterns',
    category: 'Programming',
    earnings: 0, // Recalculated
    completionPercentage: 0, // Recalculated
    notes: 'Focus on hooks, context, and performance optimization. These are crucial for building scalable and maintainable applications.',
    urls: ['https://react.dev/learn', 'https://kentcdodds.com/blog'],
    moneyPer5Reps: 50,
    isMoneyPer5RepsLocked: false,
    subtopics: [
      { id: '1-1', title: 'Master custom hooks', repsCompleted: 5, repsGoal: 18, notes: 'Read the official docs on custom hooks.', urls: ['https://react.dev/learn/reusing-logic-with-custom-hooks'], goalAmount: 180 },
      { id: '1-2', title: 'Understand useTransition', repsCompleted: 2, repsGoal: 18, notes: 'For non-urgent state updates.', urls: [], goalAmount: 90 },
      { id: '1-3', title: 'Implement state machines', repsCompleted: 0, repsGoal: 18, notes: 'Explore XState or Zustand for this.', urls: [], goalAmount: 180 },
    ],
  },
  {
    id: '2',
    title: 'Build a Full-Stack Next.js App',
    category: 'Programming',
    earnings: 0, // Recalculated
    completionPercentage: 0, // Recalculated
    notes: 'Create a complete application with authentication, database integration, and server-side rendering using Next.js.',
    urls: ['https://nextjs.org/docs'],
    moneyPer5Reps: 75,
    isMoneyPer5RepsLocked: true,
    subtopics: [
      { id: '2-1', title: 'Set up NextAuth.js', repsCompleted: 5, repsGoal: 18, notes: 'Use the new App Router setup.', urls: [], goalAmount: 270 },
      { id: '2-2', title: 'Connect to a database', repsCompleted: 1, repsGoal: 18, notes: 'Try using Prisma ORM.', urls: [], goalAmount: 180 },
    ],
  },
  {
    id: '3',
    title: 'Daily Fitness Routine',
    category: 'Health',
    earnings: 0, // Recalculated
    completionPercentage: 0, // Recalculated
    notes: 'Stay active and healthy with a consistent daily workout plan.',
    urls: [],
    moneyPer5Reps: 20,
    isMoneyPer5RepsLocked: false,
    subtopics: [
      { id: '3-1', title: 'Morning Run (km)', repsCompleted: 15, repsGoal: 18, notes: '', urls: [], goalAmount: 100 },
      { id: '3-2', title: 'Evening Workout (sets)', repsCompleted: 12, repsGoal: 18, notes: 'Focus on compound exercises.', urls: [], goalAmount: 100 },
    ],
  },
];

// --- Data Helper Functions ---
const getEarnedAmountForSubtopic = (subtopic) => {
    if (!subtopic || subtopic.repsGoal <= 0 || subtopic.goalAmount <= 0) return 0;
    const moneyPerRep = subtopic.goalAmount / subtopic.repsGoal;
    return subtopic.repsCompleted * moneyPerRep;
};

const recalculateTopic = (topic) => {
  if (!topic) return;
  if (!topic.subtopics) {
    topic.completionPercentage = 0;
    topic.earnings = 0;
    return;
  }
  const totalRepsCompleted = topic.subtopics.reduce((sum, st) => sum + st.repsCompleted, 0);
  const totalRepsGoal = topic.subtopics.reduce((sum, st) => sum + st.repsGoal, 0);
  
  topic.completionPercentage = totalRepsGoal > 0 ? Math.round((totalRepsCompleted / totalRepsGoal) * 100) : 0;
  topic.earnings = topic.subtopics.reduce((sum, st) => sum + getEarnedAmountForSubtopic(st), 0);
};

const calculateTotals = () => {
  (topics || []).forEach(recalculateTopic);
  const currentEarnings = (topics || []).reduce((sum, topic) => sum + (topic.earnings || 0), 0);
  const progress = globalGoal > 0 ? (currentEarnings / globalGoal) * 100 : 0;
  return { currentEarnings, progress };
};

// --- Middleware ---
app.use(cors());
app.use(express.json());
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// === API ROUTES ===

// 1. Dashboard API
app.get('/api/dashboard', (req, res) => {
  const { currentEarnings, progress } = calculateTotals();
  const dashboardData = {
    globalGoal,
    currentEarnings: Math.round(currentEarnings),
    progress: Math.round(progress),
    topics: (topics || []).map(({ id, title, category, earnings, completionPercentage }) => ({
      id,
      title,
      category,
      earnings: Math.round(earnings || 0),
      completionPercentage: Math.round(completionPercentage || 0),
    })),
  };
  res.json(dashboardData);
});

app.put('/api/dashboard/global-goal', (req, res) => {
  const { goal } = req.body;
  if (typeof goal !== 'number' || goal < 0) {
    return res.status(400).json({ message: 'Invalid goal amount' });
  }
  globalGoal = goal;
  res.json({ message: 'Global goal updated successfully', goal });
});

// 2. Topics API
app.get('/api/topics', (req, res) => {
  const categories = [...new Set(topics.map(t => t.category))];
  res.json(categories);
});

app.post('/api/topics', (req, res) => {
    const topicData = req.body;
    const newTopic = {
        id: String(nextTopicId++),
        earnings: 0,
        completionPercentage: 0,
        subtopics: [],
        isMoneyPer5RepsLocked: false,
        ...topicData,
    };
    topics.push(newTopic);
    res.status(201).json(newTopic);
});

app.get('/api/topics/:topicId', (req, res) => {
    const { topicId } = req.params;
    const topic = topics.find(t => t.id === topicId);
    if (!topic) {
        return res.status(404).json({ message: 'Topic not found' });
    }
    recalculateTopic(topic);
    res.json(JSON.parse(JSON.stringify(topic))); // Send deep copy
});

app.put('/api/topics/:topicId', (req, res) => {
    const { topicId } = req.params;
    const topicIndex = topics.findIndex(t => t.id === topicId);
    if (topicIndex === -1) {
        return res.status(404).json({ message: 'Topic not found' });
    }
    topics[topicIndex] = { ...topics[topicIndex], ...req.body };
    recalculateTopic(topics[topicIndex]);
    res.json(JSON.parse(JSON.stringify(topics[topicIndex])));
});

// 3. Sub-Topics API
app.post('/api/topics/:topicId/sub-topics', (req, res) => {
    const { topicId } = req.params;
    const subtopicData = req.body;
    const topic = topics.find(t => t.id === topicId);
    if (!topic) {
        return res.status(404).json({ message: 'Topic not found' });
    }
    const newSubtopic = {
        id: String(nextSubtopicId++),
        repsGoal: 18,
        repsCompleted: 0,
        notes: '',
        urls: [],
        ...subtopicData,
    };
    topic.subtopics.push(newSubtopic);
    recalculateTopic(topic);
    res.status(201).json({ message: 'Sub-topic created successfully', subTopic: newSubtopic });
});

app.get('/api/sub-topics/:subTopicId', (req, res) => {
    const { subTopicId } = req.params;
    for (const topic of topics) {
        const subtopic = topic.subtopics.find(st => st.id === subTopicId);
        if (subtopic) {
            return res.json(JSON.parse(JSON.stringify(subtopic)));
        }
    }
    return res.status(404).json({ message: 'Sub-topic not found' });
});

app.put('/api/sub-topics/:subTopicId', (req, res) => {
    const { subTopicId } = req.params;
    for (const topic of topics) {
        const subtopicIndex = topic.subtopics.findIndex(st => st.id === subTopicId);
        if (subtopicIndex !== -1) {
            topic.subtopics[subtopicIndex] = { ...topic.subtopics[subtopicIndex], ...req.body };
            recalculateTopic(topic);
            return res.json({ message: 'Sub-topic updated successfully', subTopic: topic.subtopics[subtopicIndex] });
        }
    }
    return res.status(404).json({ message: 'Sub-topic not found' });
});

app.post('/api/sub-topics/:subTopicId/reps', (req, res) => {
    const { subTopicId } = req.params;
    const { reps } = req.body;
    if (typeof reps !== 'number' || (reps !== 1 && reps !== -1)) {
        return res.status(400).json({ message: 'Invalid reps value. Must be 1 or -1.' });
    }

    for (const topic of topics) {
        const subtopic = topic.subtopics.find(st => st.id === subTopicId);
        if (subtopic) {
            const newReps = subtopic.repsCompleted + reps;
            if (newReps < 0 || newReps > subtopic.repsGoal) {
                return res.status(400).json({ message: 'Rep limit reached.' });
            }
            subtopic.repsCompleted = newReps;
            recalculateTopic(topic);
            const updatedTopic = JSON.parse(JSON.stringify(topic)); // Deep copy
            
            return res.json({ 
                message: 'Reps logged successfully', 
                updatedSubtopic: subtopic,
                updatedTopic: updatedTopic
            });
        }
    }
    return res.status(404).json({ message: 'Subtopic not found' });
});

// 4. Categories API
app.get('/api/categories', (req, res) => {
  const categories = [...new Set(topics.map(t => t.category))];
  res.json(categories);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
});

// Server Start
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Mock API server running at http://localhost:${PORT}`);
  console.log(`📊 Available endpoints:`);
  console.log(`   GET  /health`);
  console.log(`   GET  /api/dashboard`);
  console.log(`   PUT  /api/dashboard/global-goal`);
  console.log(`   GET  /api/topics`);
  console.log(`   POST /api/topics`);
  console.log(`   GET  /api/topics/:topicId`);
  console.log(`   PUT  /api/topics/:topicId`);
  console.log(`   POST /api/topics/:topicId/sub-topics`);
  console.log(`   GET  /api/sub-topics/:subTopicId`);
  console.log(`   PUT  /api/sub-topics/:subTopicId`);
  console.log(`   POST /api/sub-topics/:subTopicId/reps`);
  console.log(`   GET  /api/categories`);
});
