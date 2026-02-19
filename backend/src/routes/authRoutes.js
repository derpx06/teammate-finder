const express = require('express');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const passport = require('passport');

const User = require('../models/User');
const { protect } = require('../middleware/authMiddleware');
// const usersByEmail = new Map(); // Removed in-memory storage
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || 'http://localhost:5173';
const GITHUB_CONNECT_STATE_TTL_MS = 10 * 60 * 1000;
const githubConnectStateStore = new Map();

const router = express.Router();

function normalizeEmail(email) {
  return String(email).trim().toLowerCase();
}

function getJwtSecret() {
  return process.env.JWT_SECRET || 'dev_secret_change_me';
}

function serializeAuthUser(user) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    onboardingCompleted: user.onboardingCompleted,
    githubConnected: Boolean(user.githubId || user.githubUsername),
    githubUsername: user.githubUsername,
    googleConnected: Boolean(user.googleId),
    createdAt: user.createdAt,
  };
}

function buildFrontendOAuthRedirect(params = {}) {
  const query = new URLSearchParams(params).toString();
  return `${FRONTEND_ORIGIN}/oauth/callback${query ? `?${query}` : ''}`;
}

function cleanupExpiredGitHubConnectState() {
  const now = Date.now();
  for (const [token, state] of githubConnectStateStore.entries()) {
    if (!state || state.expiresAt <= now) {
      githubConnectStateStore.delete(token);
    }
  }
}

router.post('/signup', async (req, res) => {
  const { email, password, confirmPassword } = req.body;

  if (!email || !password || !confirmPassword) {
    return res.status(400).json({ error: 'Email, password, and confirmPassword are required' });
  }

  if (!EMAIL_REGEX.test(String(email).trim())) {
    return res.status(400).json({ error: 'Please provide a valid email address' });
  }

  if (String(password).length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters long' });
  }

  if (password !== confirmPassword) {
    return res.status(400).json({ error: 'Passwords do not match' });
  }

  const normalizedEmail = normalizeEmail(email);
  const userExists = await User.findOne({ email: normalizedEmail });
  if (userExists) {
    return res.status(409).json({ error: 'An account with this email already exists' });
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await User.create({
    email: normalizedEmail,
    passwordHash,
  });

  const token = jwt.sign({ sub: user.id, email: user.email }, getJwtSecret(), {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

  return res.status(201).json({
    message: 'Signup successful',
    token,
    user: serializeAuthUser(user),
  });
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const normalizedEmail = normalizeEmail(email);
  const user = await User.findOne({ email: normalizedEmail });
  if (!user) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  // Check if user has a password set (OAuth users might not)
  if (!user.passwordHash) {
    return res.status(401).json({ error: 'This account uses social login. Please sign in with Google or GitHub.' });
  }

  const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
  if (!isPasswordValid) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  const token = jwt.sign({ sub: user.id, email: user.email }, getJwtSecret(), {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

  return res.status(200).json({
    message: 'Login successful',
    token,
    user: serializeAuthUser(user),
  });
});


router.post('/github/connect-url', protect, async (req, res) => {
  cleanupExpiredGitHubConnectState();
  const stateToken = crypto.randomBytes(24).toString('hex');
  githubConnectStateStore.set(stateToken, {
    userId: String(req.user._id),
    expiresAt: Date.now() + GITHUB_CONNECT_STATE_TTL_MS,
  });

  const backendOrigin = `${req.protocol}://${req.get('host')}`;
  return res.status(200).json({
    url: `${backendOrigin}/api/auth/github/connect?stateToken=${stateToken}`,
  });
});

router.delete('/github/connection', protect, async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  user.githubId = undefined;
  user.githubUsername = undefined;
  user.githubProfileReadme = undefined;
  user.githubSummaryCache = undefined;
  await user.save();

  const token = jwt.sign({ sub: user.id, email: user.email }, getJwtSecret(), {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

  return res.status(200).json({
    message: 'GitHub disconnected successfully',
    token,
    user: serializeAuthUser(user),
  });
});

// GitHub OAuth Routes
router.get('/github/connect', (req, res, next) => {
  cleanupExpiredGitHubConnectState();
  const stateToken = String(req.query.stateToken || '');
  const state = githubConnectStateStore.get(stateToken);
  if (!state) {
    return res.redirect(
      buildFrontendOAuthRedirect({
        mode: 'github_connect',
        status: 'error',
        error: 'invalid_or_expired_state',
      })
    );
  }

  if (state.expiresAt <= Date.now()) {
    githubConnectStateStore.delete(stateToken);
    return res.redirect(
      buildFrontendOAuthRedirect({
        mode: 'github_connect',
        status: 'error',
        error: 'state_expired',
      })
    );
  }

  return passport.authenticate('github', {
    scope: ['user:email'],
    state: `connect:${stateToken}`,
  })(req, res, next);
});

router.get(
  '/github',
  passport.authenticate('github', { scope: ['user:email'] })
);

router.get(
  '/github/callback',
  passport.authenticate('github', {
    session: false,
    failureRedirect: `${FRONTEND_ORIGIN}/auth?error=github_failed`,
  }),
  async (req, res) => {
    // req.user contains the profile returned by GitHub
    const profile = req.user;
    const state = String(req.query.state || '');

    // GitHub connect flow for an already authenticated local account
    if (state.startsWith('connect:')) {
      const stateToken = state.replace('connect:', '');
      const linkState = githubConnectStateStore.get(stateToken);
      githubConnectStateStore.delete(stateToken);

      if (!linkState || linkState.expiresAt <= Date.now()) {
        return res.redirect(
          buildFrontendOAuthRedirect({
            mode: 'github_connect',
            status: 'error',
            error: 'invalid_or_expired_state',
          })
        );
      }

      const existingGitHubUser = await User.findOne({ githubId: profile.id });
      if (existingGitHubUser && String(existingGitHubUser._id) !== String(linkState.userId)) {
        return res.redirect(
          buildFrontendOAuthRedirect({
            mode: 'github_connect',
            status: 'error',
            error: 'github_account_already_linked',
          })
        );
      }

      const user = await User.findById(linkState.userId);
      if (!user) {
        return res.redirect(
          buildFrontendOAuthRedirect({
            mode: 'github_connect',
            status: 'error',
            error: 'user_not_found',
          })
        );
      }

      user.githubId = profile.id;
      user.githubUsername = profile.username;

      if (!user.name) {
        user.name = profile.displayName || profile.username || user.name;
      }
      await user.save();

      // Trigger background sync for GitHub data and embeddings
      const { buildGitHubSummaryForUser } = require('../utils/githubUtils');
      buildGitHubSummaryForUser(user, profile.username).catch(err => {
        console.error('Background GitHub sync failed:', err);
      });

      const token = jwt.sign({ sub: user.id, email: user.email }, getJwtSecret(), {
        expiresIn: process.env.JWT_EXPIRES_IN || '7d',
      });

      return res.redirect(
        buildFrontendOAuthRedirect({
          mode: 'github_connect',
          status: 'success',
          token,
          user: JSON.stringify(serializeAuthUser(user)),
        })
      );
    }

    // Get email from profile
    // GitHub profile emails might be in emails array if private
    let email = profile.emails && profile.emails[0] ? profile.emails[0].value : null;

    if (!email) {
      return res.redirect(`${FRONTEND_ORIGIN}/auth?error=no_email_from_github`);
    }

    const normalizedEmail = normalizeEmail(email);
    let user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      // Create new user for GitHub login
      user = await User.create({
        email: normalizedEmail,
        githubId: profile.id,
        githubUsername: profile.username,
      });
      if (!user.name) {
        user.name = profile.displayName || profile.username;
        await user.save();
      }
    } else if (!user.githubId) {
      user.githubId = profile.id;
      user.githubUsername = profile.username;
      await user.save();
    }

    // Trigger background sync for GitHub data and embeddings
    const { buildGitHubSummaryForUser } = require('../utils/githubUtils');
    buildGitHubSummaryForUser(user, profile.username).catch(err => {
      console.error('Background GitHub sync failed (login):', err);
    });

    // Generate Token
    const token = jwt.sign({ sub: user.id, email: user.email }, getJwtSecret(), {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    });

    // Redirect to frontend with token
    // In production, consider a more secure way (e.g., cookie or short-lived code exchanging for token)
    res.redirect(
      buildFrontendOAuthRedirect({
        token,
        user: JSON.stringify(serializeAuthUser(user)),
      })
    );
  }
);

// Google OAuth Routes
router.get(
  '/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

router.get(
  '/google/callback',
  passport.authenticate('google', {
    session: false,
    failureRedirect: `${FRONTEND_ORIGIN}/auth?error=google_failed`,
  }),
  async (req, res) => {
    const profile = req.user;
    const email = profile.emails && profile.emails[0] ? profile.emails[0].value : null;

    if (!email) {
      return res.redirect(`${FRONTEND_ORIGIN}/auth?error=no_email_from_google`);
    }

    const normalizedEmail = normalizeEmail(email);
    let user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      user = await User.create({
        email: normalizedEmail,
        googleId: profile.id,
      });
    } else if (!user.googleId) {
      // If user exists but doesn't have googleId, link it
      user.googleId = profile.id;
      await user.save();
    }

    const token = jwt.sign({ sub: user.id, email: user.email }, getJwtSecret(), {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    });

    res.redirect(
      buildFrontendOAuthRedirect({
        token,
        user: JSON.stringify(serializeAuthUser(user)),
      })
    );
  }
);

module.exports = router;
