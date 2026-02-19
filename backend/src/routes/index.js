const express = require('express');
const authRoutes = require('./authRoutes');

const router = express.Router();

router.use('/auth', authRoutes);
const userRoutes = require('./userRoutes');
const chatRoutes = require('./chatRoutes');
const messageRoutes = require('./messageRoutes');
const projectRoutes = require('./projectRoutes');
const notificationRoutes = require('./notificationRoutes');

router.use('/user', userRoutes);
router.use('/chat', chatRoutes);
router.use('/message', messageRoutes);
router.use('/project', projectRoutes);
router.use('/notification', notificationRoutes);

router.get('/', (_req, res) => {
  res.status(200).json({
    message: 'API is up and running',
  });
});

module.exports = router;
