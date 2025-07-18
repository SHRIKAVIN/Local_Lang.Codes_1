const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

// Import routes
const authRoutes = require('./routes/auth');
const profileRoutes = require('./routes/profile');

// Import existing functionality
const { saveGenerationHistory } = require('./database');
const { authenticateToken } = require('./auth-middleware');

const app = express();
const PORT = process.env.PORT || 5007;

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'https://local-lang-codes-1.vercel.app'],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);

// Your existing API endpoints (updated to use SQLite)
app.post('/process', authenticateToken, async (req, res) => {
  try {
    const { user_input, user_language_code, choice } = req.body;
    const userId = req.user.id;

    if (!user_input || !user_language_code || !choice) {
      return res.status(400).json({ error: 'Missing required input fields' });
    }

    // Your existing translation and generation logic here
    // For now, I'll provide mock responses
    const translatedPrompt = `Translated: ${user_input}`;
    
    let result = { translatedPrompt };

    if (choice === 'code') {
      const codeOutput = `# Generated code for: ${user_input}\n\ndef main():\n    print("Hello, World!")\n    # Your implementation here\n    pass\n\nif __name__ == "__main__":\n    main()`;
      const explanation = `This code demonstrates: ${user_input}`;
      
      result = {
        ...result,
        codeOutput,
        explanation
      };

      // Save to database
      saveGenerationHistory(userId, {
        type: 'code',
        input: user_input,
        output: codeOutput,
        translatedPrompt,
        explanation,
        languageCode: user_language_code
      });

    } else if (choice === 'website') {
      const websiteHtml = `<html><head><title>Generated Website</title></head><body><h1>Website for: ${translatedPrompt}</h1></body></html>`;
      const explanation = `Website generated for: ${translatedPrompt}`;
      
      result = {
        ...result,
        websiteHtml,
        explanation
      };

      // Save to database
      saveGenerationHistory(userId, {
        type: 'website',
        input: user_input,
        output: websiteHtml,
        translatedPrompt,
        explanation,
        languageCode: user_language_code
      });
    }

    res.json(result);
  } catch (error) {
    console.error('Process error:', error);
    res.status(500).json({ error: 'An internal server error occurred' });
  }
});

app.post('/generate_app_plan', authenticateToken, async (req, res) => {
  try {
    const { user_input, user_language_code } = req.body;
    const userId = req.user.id;

    if (!user_input || !user_language_code) {
      return res.status(400).json({ error: 'Missing user_input or user_language_code' });
    }

    const translatedPrompt = `Translated: ${user_input}`;
    const appPlanOutput = `# App Plan for: ${user_input}\n\n## Introduction\nComprehensive plan for your application.\n\n## Features\n- Core functionality\n- User interface\n- Data management\n\n## Technologies\n- Frontend: React.js\n- Backend: Node.js\n- Database: SQLite\n\n## Implementation Steps\n1. Setup development environment\n2. Create database schema\n3. Build backend API\n4. Develop frontend\n5. Testing and deployment`;

    // Save to database
    saveGenerationHistory(userId, {
      type: 'app_plan',
      input: user_input,
      output: appPlanOutput,
      translatedPrompt,
      languageCode: user_language_code
    });

    res.json({
      translatedPrompt,
      appPlanOutput
    });
  } catch (error) {
    console.error('App plan generation error:', error);
    res.status(500).json({ error: 'An internal error occurred during app plan generation' });
  }
});

app.post('/generate-code-from-plan', authenticateToken, async (req, res) => {
  try {
    const { app_plan_text } = req.body;
    const userId = req.user.id;

    if (!app_plan_text) {
      return res.status(400).json({ error: 'App plan text is required' });
    }

    const codeOutput = `# Generated code from app plan\n\nimport React from 'react';\n\nfunction App() {\n  return (\n    <div className="App">\n      <h1>Your Application</h1>\n      <p>Generated from your app plan</p>\n    </div>\n  );\n}\n\nexport default App;`;

    // Save to database
    saveGenerationHistory(userId, {
      type: 'code_from_plan',
      input: app_plan_text,
      output: codeOutput,
      explanation: 'Code generated from app plan'
    });

    res.json({ codeOutput });
  } catch (error) {
    console.error('Code from plan generation error:', error);
    res.status(500).json({ error: 'An internal error occurred' });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running with SQLite database' });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT} with SQLite database`);
});

module.exports = app;