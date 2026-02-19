const path = require('path');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const User = require('../src/models/User');

const MODEL_ID = 'Xenova/bge-base-en-v1.5';
const EMBEDDING_DIMENSION = 768;

function buildProfileText(user) {
  const role = String(user?.role || '').trim();
  const skills = Array.isArray(user?.skills) ? user.skills.join(', ') : '';
  const bio = String(user?.bio || '').trim();
  const interests = Array.isArray(user?.interests) ? user.interests.join(', ') : '';

  return `Role: ${role}, Skills: ${skills}, Bio: ${bio}, Interests: ${interests}`.trim();
}

async function createEmbedding(extractor, text) {
  const output = await extractor(text, {
    pooling: 'mean',
    normalize: true,
  });

  const vector = Array.from(output?.data || []).map((value) => Number(value));
  if (vector.length !== EMBEDDING_DIMENSION) {
    throw new Error(
      `Expected ${EMBEDDING_DIMENSION}-dimensional embedding, received ${vector.length}`
    );
  }

  if (vector.some((value) => !Number.isFinite(value))) {
    throw new Error('Embedding contains non-numeric values');
  }

  return vector;
}

async function run() {
  if (!process.env.MONGO_URI) {
    throw new Error('MONGO_URI is missing in backend/.env');
  }

  await mongoose.connect(process.env.MONGO_URI);
  console.log(`MongoDB connected: ${mongoose.connection.host}`);

  const { pipeline } = await import('@xenova/transformers');
  console.log(`Loading model: ${MODEL_ID}`);
  const extractor = await pipeline('feature-extraction', MODEL_ID);
  console.log('Model loaded');

  const usersToProcess = await User.find({
    $expr: {
      $ne: [{ $size: { $ifNull: ['$embedding', []] } }, EMBEDDING_DIMENSION],
    },
  }).select('name email role skills bio interests');

  const total = usersToProcess.length;
  console.log(`Users requiring backfill: ${total}`);

  let processed = 0;
  let failed = 0;

  for (const user of usersToProcess) {
    const profileText = buildProfileText(user) || 'Role: Member, Skills: , Bio: , Interests: ';
    try {
      const embedding = await createEmbedding(extractor, profileText);
      user.embedding = embedding;
      await user.save();
      processed += 1;
      console.log(`Processed ${processed}/${total}: ${user.email || user._id}`);
    } catch (error) {
      failed += 1;
      console.error(
        `Failed for ${user.email || user._id}: ${error?.message || 'unknown error'}`
      );
    }
  }

  console.log(`Backfill complete. Success: ${processed}, Failed: ${failed}, Total: ${total}`);
  await mongoose.disconnect();
}

run()
  .then(() => {
    process.exit(0);
  })
  .catch(async (error) => {
    console.error(`Embedding migration failed: ${error?.message || error}`);
    try {
      await mongoose.disconnect();
    } catch (_disconnectError) {
      // Ignore disconnect errors after failure.
    }
    process.exit(1);
  });
