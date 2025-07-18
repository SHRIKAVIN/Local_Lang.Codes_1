const express = require('express');
const { getUserProfile, updateUserProfile, getGenerationHistory } = require('../database');
const { authenticateToken } = require('../auth-middleware');

const router = express.Router();

// Get user profile
router.get('/', authenticateToken, (req, res) => {
  try {
    const profile = getUserProfile(req.user.id);
    
    res.json({
      profile: {
        id: profile.id,
        name: profile.name,
        email: profile.email,
        settings: JSON.parse(profile.settings || '{}'),
        created_at: profile.created_at,
        updated_at: profile.updated_at
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// Update user profile
router.put('/', authenticateToken, (req, res) => {
  try {
    const updates = req.body;
    const updatedProfile = updateUserProfile(req.user.id, updates);
    
    res.json({
      message: 'Profile updated successfully',
      profile: {
        id: updatedProfile.id,
        name: updatedProfile.name,
        email: updatedProfile.email,
        settings: JSON.parse(updatedProfile.settings || '{}'),
        created_at: updatedProfile.created_at,
        updated_at: updatedProfile.updated_at
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Get generation history
router.get('/history', authenticateToken, (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const history = getGenerationHistory(req.user.id, limit);
    
    res.json({ history });
  } catch (error) {
    console.error('Get history error:', error);
    res.status(500).json({ error: 'Failed to fetch generation history' });
  }
});

module.exports = router;