const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

// Initialize SQLite database
const dbPath = path.join(__dirname, 'app.db');
const db = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Create tables
const initDatabase = () => {
  // Users table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // User profiles table
  db.exec(`
    CREATE TABLE IF NOT EXISTS profiles (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      settings TEXT DEFAULT '{}',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    )
  `);

  // Generation history table
  db.exec(`
    CREATE TABLE IF NOT EXISTS generation_history (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      type TEXT NOT NULL CHECK (type IN ('code', 'app_plan', 'website', 'code_from_plan')),
      input TEXT NOT NULL,
      output TEXT,
      translated_prompt TEXT,
      explanation TEXT,
      language_code TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    )
  `);

  // Create indexes for better performance
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);
    CREATE INDEX IF NOT EXISTS idx_generation_history_user_id ON generation_history (user_id);
    CREATE INDEX IF NOT EXISTS idx_generation_history_created_at ON generation_history (created_at);
  `);

  console.log('Database initialized successfully');
};

// User authentication functions
const createUser = (email, password, name) => {
  const id = uuidv4();
  const passwordHash = bcrypt.hashSync(password, 10);
  
  const stmt = db.prepare(`
    INSERT INTO users (id, email, password_hash, name)
    VALUES (?, ?, ?, ?)
  `);
  
  try {
    stmt.run(id, email, passwordHash, name);
    
    // Create profile
    const profileStmt = db.prepare(`
      INSERT INTO profiles (id, user_id)
      VALUES (?, ?)
    `);
    profileStmt.run(uuidv4(), id);
    
    return { id, email, name };
  } catch (error) {
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      throw new Error('Email already exists');
    }
    throw error;
  }
};

const authenticateUser = (email, password) => {
  const stmt = db.prepare(`
    SELECT id, email, password_hash, name, created_at
    FROM users
    WHERE email = ?
  `);
  
  const user = stmt.get(email);
  
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    throw new Error('Invalid email or password');
  }
  
  const { password_hash, ...userWithoutPassword } = user;
  return userWithoutPassword;
};

const getUserById = (id) => {
  const stmt = db.prepare(`
    SELECT id, email, name, created_at
    FROM users
    WHERE id = ?
  `);
  
  return stmt.get(id);
};

const getUserProfile = (userId) => {
  const stmt = db.prepare(`
    SELECT p.*, u.name, u.email
    FROM profiles p
    JOIN users u ON p.user_id = u.id
    WHERE p.user_id = ?
  `);
  
  return stmt.get(userId);
};

const updateUserProfile = (userId, updates) => {
  const { name, settings } = updates;
  
  // Update user name if provided
  if (name) {
    const userStmt = db.prepare(`
      UPDATE users
      SET name = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    userStmt.run(name, userId);
  }
  
  // Update profile settings if provided
  if (settings) {
    const profileStmt = db.prepare(`
      UPDATE profiles
      SET settings = ?, updated_at = CURRENT_TIMESTAMP
      WHERE user_id = ?
    `);
    profileStmt.run(JSON.stringify(settings), userId);
  }
  
  return getUserProfile(userId);
};

// Generation history functions
const saveGenerationHistory = (userId, generationData) => {
  const id = uuidv4();
  const stmt = db.prepare(`
    INSERT INTO generation_history (
      id, user_id, type, input, output, translated_prompt, explanation, language_code
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  stmt.run(
    id,
    userId,
    generationData.type,
    generationData.input,
    generationData.output || null,
    generationData.translatedPrompt || null,
    generationData.explanation || null,
    generationData.languageCode || null
  );
  
  return id;
};

const getGenerationHistory = (userId, limit = 50) => {
  const stmt = db.prepare(`
    SELECT *
    FROM generation_history
    WHERE user_id = ?
    ORDER BY created_at DESC
    LIMIT ?
  `);
  
  return stmt.all(userId, limit);
};

// JWT token functions
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key';
const JWT_EXPIRES_IN = '7d'; // 7 days

const generateToken = (user) => {
  return jwt.sign(
    { 
      id: user.id, 
      email: user.email 
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
};

const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
};

// Initialize database on module load
initDatabase();

module.exports = {
  db,
  createUser,
  authenticateUser,
  getUserById,
  getUserProfile,
  updateUserProfile,
  saveGenerationHistory,
  getGenerationHistory,
  generateToken,
  verifyToken
};