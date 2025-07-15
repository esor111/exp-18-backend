const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Supabase configuration
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

// --- Database Helper Functions ---
const getEarnedAmountForSubtopic = (subtopic) => {
    if (!subtopic || subtopic.reps_goal <= 0 || subtopic.goal_amount <= 0) return 0;
    const moneyPerRep = subtopic.goal_amount / subtopic.reps_goal;
    return subtopic.reps_completed * moneyPerRep;
};

const calculateTopicStats = (subtopics) => {
    if (!subtopics || subtopics.length === 0) {
        return { completionPercentage: 0, earnings: 0 };
    }
    
    const totalRepsCompleted = subtopics.reduce((sum, st) => sum + st.reps_completed, 0);
    const totalRepsGoal = subtopics.reduce((sum, st) => sum + st.reps_goal, 0);
    const completionPercentage = totalRepsGoal > 0 ? Math.round((totalRepsCompleted / totalRepsGoal) * 100) : 0;
    const earnings = subtopics.reduce((sum, st) => sum + getEarnedAmountForSubtopic(st), 0);
    
    return { completionPercentage, earnings };
};

const transformTopicFromDB = (topic, subtopics = []) => {
    const { completionPercentage, earnings } = calculateTopicStats(subtopics);
    
    return {
        id: topic.id,
        title: topic.title,
        category: topic.category,
        earnings: Math.round(earnings),
        completionPercentage: Math.round(completionPercentage),
        notes: topic.notes || '',
        urls: topic.urls || [],
        moneyPer5Reps: topic.money_per_5_reps,
        isMoneyPer5RepsLocked: topic.is_money_per_5_reps_locked,
        subtopics: subtopics.map(st => ({
            id: st.id,
            title: st.title,
            repsCompleted: st.reps_completed,
            repsGoal: st.reps_goal,
            notes: st.notes || '',
            urls: st.urls || [],
            goalAmount: st.goal_amount
        }))
    };
};

const transformSubtopicFromDB = (subtopic) => ({
    id: subtopic.id,
    title: subtopic.title,
    repsCompleted: subtopic.reps_completed,
    repsGoal: subtopic.reps_goal,
    notes: subtopic.notes || '',
    urls: subtopic.urls || [],
    goalAmount: subtopic.goal_amount
});

// --- Middleware ---
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
app.get('/api/dashboard', async (req, res) => {
    try {
        // Get global goal
        const { data: globalGoalData, error: globalGoalError } = await supabase
            .from('global_settings')
            .select('setting_value')
            .eq('setting_name', 'global_goal')
            .single();

        if (globalGoalError) {
            throw globalGoalError;
        }

        const globalGoal = parseInt(globalGoalData.setting_value);

        // Get all topics with their subtopics
        const { data: topics, error: topicsError } = await supabase
            .from('topics')
            .select(`
                *,
                subtopics (*)
            `)
            .order('created_at');

        if (topicsError) {
            throw topicsError;
        }

        // Transform topics and calculate totals
        const transformedTopics = topics.map(topic => {
            const { completionPercentage, earnings } = calculateTopicStats(topic.subtopics);
            return {
                id: topic.id,
                title: topic.title,
                category: topic.category,
                earnings: Math.round(earnings),
                completionPercentage: Math.round(completionPercentage)
            };
        });

        const currentEarnings = transformedTopics.reduce((sum, topic) => sum + topic.earnings, 0);
        const progress = globalGoal > 0 ? (currentEarnings / globalGoal) * 100 : 0;

        res.json({
            globalGoal,
            currentEarnings: Math.round(currentEarnings),
            progress: Math.round(progress),
            topics: transformedTopics
        });
    } catch (error) {
        console.error('Dashboard error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

app.put('/api/dashboard/global-goal', async (req, res) => {
    try {
        const { goal } = req.body;
        if (typeof goal !== 'number' || goal < 0) {
            return res.status(400).json({ message: 'Invalid goal amount' });
        }

        const { error } = await supabase
            .from('global_settings')
            .update({ setting_value: goal })
            .eq('setting_name', 'global_goal');

        if (error) {
            throw error;
        }

        res.json({ message: 'Global goal updated successfully', goal });
    } catch (error) {
        console.error('Update global goal error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// 2. Topics API
app.get('/api/topics', async (req, res) => {
    try {
        const { data: topics, error } = await supabase
            .from('topics')
            .select('*');

        if (error) throw error;
        res.json(topics);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/topics', async (req, res) => {
    try {
        const topicData = req.body;
        
        const { data: newTopic, error } = await supabase
            .from('topics')
            .insert([{
                title: topicData.title,
                category: topicData.category,
                notes: topicData.notes || '',
                urls: topicData.urls || [],
                money_per_5_reps: topicData.moneyPer5Reps || 50,
                is_money_per_5_reps_locked: topicData.isMoneyPer5RepsLocked || false
            }])
            .select()
            .single();

        if (error) {
            throw error;
        }

        const transformedTopic = transformTopicFromDB(newTopic, []);
        res.status(201).json(transformedTopic);
    } catch (error) {
        console.error('Create topic error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

app.get('/api/topics/:topicId', async (req, res) => {
    try {
        const { topicId } = req.params;

        const { data: topic, error } = await supabase
            .from('topics')
            .select(`
                *,
                subtopics (*)
            `)
            .eq('id', topicId)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                return res.status(404).json({ message: 'Topic not found' });
            }
            throw error;
        }

        const transformedTopic = transformTopicFromDB(topic, topic.subtopics);
        res.json(transformedTopic);
    } catch (error) {
        console.error('Get topic error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

app.put('/api/topics/:topicId', async (req, res) => {
    try {
        const { topicId } = req.params;
        const updateData = req.body;

        // Convert camelCase to snake_case for database
        const dbUpdateData = {};
        if (updateData.title) dbUpdateData.title = updateData.title;
        if (updateData.category) dbUpdateData.category = updateData.category;
        if (updateData.notes !== undefined) dbUpdateData.notes = updateData.notes;
        if (updateData.urls !== undefined) dbUpdateData.urls = updateData.urls;
        if (updateData.moneyPer5Reps !== undefined) dbUpdateData.money_per_5_reps = updateData.moneyPer5Reps;
        if (updateData.isMoneyPer5RepsLocked !== undefined) dbUpdateData.is_money_per_5_reps_locked = updateData.isMoneyPer5RepsLocked;

        const { data: updatedTopic, error } = await supabase
            .from('topics')
            .update(dbUpdateData)
            .eq('id', topicId)
            .select(`
                *,
                subtopics (*)
            `)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                return res.status(404).json({ message: 'Topic not found' });
            }
            throw error;
        }

        const transformedTopic = transformTopicFromDB(updatedTopic, updatedTopic.subtopics);
        res.json(transformedTopic);
    } catch (error) {
        console.error('Update topic error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// 3. Sub-Topics API
app.post('/api/topics/:topicId/sub-topics', async (req, res) => {
    try {
        const { topicId } = req.params;
        const subtopicData = req.body;

        // Check if topic exists
        const { data: topic, error: topicError } = await supabase
            .from('topics')
            .select('id')
            .eq('id', topicId)
            .single();

        if (topicError) {
            if (topicError.code === 'PGRST116') {
                return res.status(404).json({ message: 'Topic not found' });
            }
            throw topicError;
        }

        const { data: newSubtopic, error } = await supabase
            .from('subtopics')
            .insert([{
                topic_id: topicId,
                title: subtopicData.title,
                reps_goal: subtopicData.repsGoal || 18,
                reps_completed: subtopicData.repsCompleted || 0,
                notes: subtopicData.notes || '',
                urls: subtopicData.urls || [],
                goal_amount: subtopicData.goalAmount
            }])
            .select()
            .single();

        if (error) {
            throw error;
        }

        const transformedSubtopic = transformSubtopicFromDB(newSubtopic);
        res.status(201).json({ 
            message: 'Sub-topic created successfully', 
            subTopic: transformedSubtopic 
        });
    } catch (error) {
        console.error('Create subtopic error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

app.get('/api/sub-topics/:subTopicId', async (req, res) => {
    try {
        const { subTopicId } = req.params;

        const { data: subtopic, error } = await supabase
            .from('subtopics')
            .select('*')
            .eq('id', subTopicId)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                return res.status(404).json({ message: 'Sub-topic not found' });
            }
            throw error;
        }

        const transformedSubtopic = transformSubtopicFromDB(subtopic);
        res.json(transformedSubtopic);
    } catch (error) {
        console.error('Get subtopic error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

app.put('/api/sub-topics/:subTopicId', async (req, res) => {
    try {
        const { subTopicId } = req.params;
        const updateData = req.body;

        // Convert camelCase to snake_case for database
        const dbUpdateData = {};
        if (updateData.title) dbUpdateData.title = updateData.title;
        if (updateData.repsGoal !== undefined) dbUpdateData.reps_goal = updateData.repsGoal;
        if (updateData.repsCompleted !== undefined) dbUpdateData.reps_completed = updateData.repsCompleted;
        if (updateData.notes !== undefined) dbUpdateData.notes = updateData.notes;
        if (updateData.urls !== undefined) dbUpdateData.urls = updateData.urls;
        if (updateData.goalAmount !== undefined) dbUpdateData.goal_amount = updateData.goalAmount;

        const { data: updatedSubtopic, error } = await supabase
            .from('subtopics')
            .update(dbUpdateData)
            .eq('id', subTopicId)
            .select()
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                return res.status(404).json({ message: 'Sub-topic not found' });
            }
            throw error;
        }

        const transformedSubtopic = transformSubtopicFromDB(updatedSubtopic);
        res.json({ 
            message: 'Sub-topic updated successfully', 
            subTopic: transformedSubtopic 
        });
    } catch (error) {
        console.error('Update subtopic error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

app.post('/api/sub-topics/:subTopicId/reps', async (req, res) => {
    try {
        const { subTopicId } = req.params;
        const { reps } = req.body;

        if (typeof reps !== 'number' || (reps !== 1 && reps !== -1)) {
            return res.status(400).json({ message: 'Invalid reps value. Must be 1 or -1.' });
        }

        // Get current subtopic
        const { data: subtopic, error: subtopicError } = await supabase
            .from('subtopics')
            .select('*')
            .eq('id', subTopicId)
            .single();

        if (subtopicError) {
            if (subtopicError.code === 'PGRST116') {
                return res.status(404).json({ message: 'Subtopic not found' });
            }
            throw subtopicError;
        }

        const newReps = subtopic.reps_completed + reps;
        if (newReps < 0 || newReps > subtopic.reps_goal) {
            return res.status(400).json({ message: 'Rep limit reached.' });
        }

        // Update subtopic
        const { data: updatedSubtopic, error: updateError } = await supabase
            .from('subtopics')
            .update({ reps_completed: newReps })
            .eq('id', subTopicId)
            .select()
            .single();

        if (updateError) {
            throw updateError;
        }

        // Get updated topic with all subtopics
        const { data: updatedTopic, error: topicError } = await supabase
            .from('topics')
            .select(`
                *,
                subtopics (*)
            `)
            .eq('id', subtopic.topic_id)
            .single();

        if (topicError) {
            throw topicError;
        }

        const transformedSubtopic = transformSubtopicFromDB(updatedSubtopic);
        const transformedTopic = transformTopicFromDB(updatedTopic, updatedTopic.subtopics);

        res.json({
            message: 'Reps logged successfully',
            updatedSubtopic: transformedSubtopic,
            updatedTopic: transformedTopic
        });
    } catch (error) {
        console.error('Log reps error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// 4. Categories API
app.get('/api/categories', async (req, res) => {
    try {
        const { data: topics, error } = await supabase
            .from('topics')
            .select('category')
            .order('category');

        if (error) {
            throw error;
        }

        const categories = [...new Set(topics.map(t => t.category))];
        res.json(categories);
    } catch (error) {
        console.error('Get categories error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
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
    console.log(`✅ Supabase API server running at http://localhost:${PORT}`);
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
    console.log(`🔗 Connected to Supabase: ${supabaseUrl}`);
});