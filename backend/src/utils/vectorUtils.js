const DEFAULT_TOP_K = 10;

function toFiniteNumber(value) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}

function cosineSimilarity(vecA = [], vecB = []) {
  if (!Array.isArray(vecA) || !Array.isArray(vecB)) return 0;
  if (vecA.length === 0 || vecB.length === 0) return 0;
  if (vecA.length !== vecB.length) return 0;

  let dotProduct = 0;
  let magnitudeA = 0;
  let magnitudeB = 0;

  for (let index = 0; index < vecA.length; index += 1) {
    const a = toFiniteNumber(vecA[index]);
    const b = toFiniteNumber(vecB[index]);
    if (a === null || b === null) return 0;

    dotProduct += a * b;
    magnitudeA += a * a;
    magnitudeB += b * b;
  }

  if (magnitudeA === 0 || magnitudeB === 0) return 0;
  return dotProduct / (Math.sqrt(magnitudeA) * Math.sqrt(magnitudeB));
}

function toPlainUser(userDoc) {
  if (!userDoc) return null;
  if (typeof userDoc.toObject === 'function') {
    return userDoc.toObject();
  }
  return { ...userDoc };
}

function searchLocalVectors(queryVector = [], allUsers = [], topK = DEFAULT_TOP_K) {
  if (!Array.isArray(queryVector) || queryVector.length === 0) return [];
  const normalizedTopK = Math.max(1, Number(topK) || DEFAULT_TOP_K);

  const ranked = (Array.isArray(allUsers) ? allUsers : [])
    .filter((user) => Array.isArray(user?.embedding) && user.embedding.length === queryVector.length)
    .map((user) => {
      const score = cosineSimilarity(queryVector, user.embedding);
      return { user, score };
    })
    .filter((entry) => Number.isFinite(entry.score))
    .sort((a, b) => b.score - a.score)
    .slice(0, normalizedTopK)
    .map(({ user, score }) => {
      const plainUser = toPlainUser(user) || {};
      delete plainUser.embedding;
      return {
        ...plainUser,
        semanticScore: Number(score.toFixed(6)),
      };
    });

  return ranked;
}

module.exports = {
  cosineSimilarity,
  searchLocalVectors,
};
