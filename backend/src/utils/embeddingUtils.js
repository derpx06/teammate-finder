const MODEL_ID = 'Xenova/bge-base-en-v1.5';
const EMBEDDING_DIMENSION = 768;

let extractorPromise = null;

/**
 * Loads the Transformers.js pipeline for feature extraction.
 * Uses a singleton pattern to ensure the model is loaded only once.
 */
async function getExtractor() {
    if (!extractorPromise) {
        const { pipeline } = await import('@xenova/transformers');
        extractorPromise = pipeline('feature-extraction', MODEL_ID).catch((error) => {
            extractorPromise = null;
            console.error('Failed to load embedding model:', error);
            throw error;
        });
    }
    return extractorPromise;
}

/**
 * Generates a 768-dimensional embedding for the given text.
 * @param {string} text The text to embed.
 * @returns {Promise<number[]>} The embedding vector.
 */
async function generateEmbedding(text) {
    const normalizedText = String(text || '').trim();
    if (!normalizedText) {
        return Array(EMBEDDING_DIMENSION).fill(0);
    }

    try {
        const extractor = await getExtractor();
        const output = await extractor(normalizedText, {
            pooling: 'mean',
            normalize: true,
        });

        const vector = Array.from(output?.data || []).map((v) => Number(v));

        if (vector.length !== EMBEDDING_DIMENSION) {
            throw new Error(`Expected ${EMBEDDING_DIMENSION} dimensions, got ${vector.length}`);
        }

        return vector;
    } catch (error) {
        console.error('Error generating embedding:', error);
        throw error;
    }
}

/**
 * Builds a descriptive text string from a user object for embedding generation.
 * @param {Object} user User object with role, skills, bio, and interests.
 * @returns {string}
 */
function buildProfileText(user) {
    const role = String(user?.role || '').trim();
    const skills = Array.isArray(user?.skills) ? user.skills.join(', ') : '';
    const bio = String(user?.bio || '').trim();
    const interests = Array.isArray(user?.interests) ? user.interests.join(', ') : '';

    const githubBio = String(user?.githubSummaryCache?.profile?.bio || '').trim();
    const githubLanguages = Array.isArray(user?.githubSummaryCache?.stats?.topLanguages)
        ? user.githubSummaryCache.stats.topLanguages.map(l => l.language).join(', ')
        : '';
    const githubRepos = Array.isArray(user?.githubSummaryCache?.repos)
        ? user.githubSummaryCache.repos
            .slice(0, 5)
            .map(r => `${r.name}: ${r.description || ''}`)
            .join(' | ')
        : '';

    // Include a snippet of the profile README for richer context
    let githubReadmeSnippet = '';
    const readmeContent = user?.githubSummaryCache?.profileReadme?.content || '';
    if (readmeContent) {
        githubReadmeSnippet = readmeContent
            .replace(/[#*`]/g, '') // Remove simple markdown
            .substring(0, 500) // First 500 chars for context
            .replace(/\s+/g, ' ')
            .trim();
    }

    const parts = [
        role ? `Role: ${role}` : '',
        skills ? `Skills: ${skills}` : '',
        bio ? `Bio: ${bio}` : '',
        interests ? `Interests: ${interests}` : '',
        githubBio ? `GitHub Bio: ${githubBio}` : '',
        githubLanguages ? `GitHub Languages: ${githubLanguages}` : '',
        githubRepos ? `GitHub Projects: ${githubRepos}` : '',
        githubReadmeSnippet ? `GitHub Summary: ${githubReadmeSnippet}` : ''
    ].filter(Boolean);

    return parts.join('. ') || 'Software Developer';
}

module.exports = {
    generateEmbedding,
    buildProfileText,
    EMBEDDING_DIMENSION
};
