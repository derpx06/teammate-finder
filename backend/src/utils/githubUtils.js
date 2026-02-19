const { generateEmbedding, buildProfileText } = require('./embeddingUtils');

async function fetchGitHubJson(path, extraHeaders = {}) {
    const response = await fetch(`https://api.github.com${path}`, {
        headers: {
            'User-Agent': 'DevCraft-BroCoders',
            'Accept': 'application/vnd.github.v3+json',
            ...extraHeaders,
        },
    });

    const payload = await response.json().catch(() => null);
    if (!response.ok) {
        const error = new Error(payload?.message || 'GitHub API request failed');
        error.statusCode = response.status;
        throw error;
    }

    return payload;
}

async function fetchGitHubText(path, options = {}) {
    const { method = 'GET', body, accept = 'text/plain', extraHeaders = {} } = options;
    const response = await fetch(`https://api.github.com${path}`, {
        method,
        headers: {
            'User-Agent': 'DevCraft-BroCoders',
            Accept: accept,
            ...(body ? { 'Content-Type': 'application/json' } : {}),
            ...extraHeaders,
        },
        ...(body ? { body: JSON.stringify(body) } : {}),
    });

    const payload = await response.text();
    if (!response.ok) {
        let errorMessage = payload || 'GitHub API request failed';
        try {
            const parsedPayload = JSON.parse(payload);
            errorMessage = parsedPayload?.message || errorMessage;
        } catch (_error) {
            // Keep raw text payload as fallback.
        }

        const error = new Error(errorMessage);
        error.statusCode = response.status;
        throw error;
    }

    return payload;
}

async function resolveGitHubUsername(user) {
    if (!user) return null;

    let githubUsername = user.githubUsername;

    // Backward compatibility: resolve and store username for older linked users.
    if (!githubUsername && user.githubId) {
        try {
            const githubUser = await fetchGitHubJson(`/user/${encodeURIComponent(user.githubId)}`);
            githubUsername = githubUser?.login;
            if (githubUsername) {
                user.githubUsername = githubUsername;
                await user.save();
            }
        } catch (error) {
            console.error('Error resolving GitHub username:', error);
        }
    }

    return githubUsername;
}

function formatGitHubRepo(repo) {
    return {
        id: repo.id,
        name: repo.name,
        full_name: repo.full_name,
        description: repo.description,
        html_url: repo.html_url,
        homepage: repo.homepage,
        language: repo.language,
        visibility: repo.visibility,
        stargazers_count: repo.stargazers_count,
        forks_count: repo.forks_count,
        watchers_count: repo.watchers_count,
        open_issues_count: repo.open_issues_count,
        topics: Array.isArray(repo.topics) ? repo.topics : [],
        updated_at: repo.updated_at,
        pushed_at: repo.pushed_at,
    };
}

async function fetchGitHubProfileReadme(githubUsername) {
    try {
        const readme = await fetchGitHubJson(
            `/repos/${encodeURIComponent(githubUsername)}/${encodeURIComponent(githubUsername)}/readme`
        );

        let content = '';
        if (readme?.encoding === 'base64' && typeof readme.content === 'string') {
            content = Buffer.from(readme.content.replace(/\n/g, ''), 'base64').toString('utf8');
        }

        let renderedHtml = '';
        const normalizedContent = String(content || '').trim();
        if (normalizedContent) {
            try {
                renderedHtml = await fetchGitHubText('/markdown', {
                    method: 'POST',
                    accept: 'application/vnd.github.v3.html',
                    body: {
                        text: normalizedContent,
                        mode: 'gfm',
                        context: `${githubUsername}/${githubUsername}`,
                    },
                });
            } catch (renderError) {
                console.warn('Render GitHub README HTML error:', renderError?.message || renderError);
            }
        }

        return {
            content: normalizedContent,
            renderedHtml: String(renderedHtml || '').trim(),
            htmlUrl: readme?.html_url || '',
            sha: readme?.sha || '',
        };
    } catch (error) {
        if (error?.statusCode === 404) {
            return null;
        }
        throw error;
    }
}

async function buildGitHubSummaryForUser(user, githubUsername) {
    const [githubProfile, repos] = await Promise.all([
        fetchGitHubJson(`/users/${encodeURIComponent(githubUsername)}`),
        fetchGitHubJson(
            `/users/${encodeURIComponent(githubUsername)}/repos?sort=updated&per_page=100`,
            { Accept: 'application/vnd.github+json' }
        ),
    ]);

    const normalizedRepos = (Array.isArray(repos) ? repos : []).map(formatGitHubRepo);

    const languageMap = normalizedRepos.reduce((acc, repo) => {
        if (repo.language) {
            acc[repo.language] = (acc[repo.language] || 0) + 1;
        }
        return acc;
    }, {});

    const topLanguages = Object.entries(languageMap)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([language, repoCount]) => ({ language, repoCount }));

    const stats = {
        totalRepos: normalizedRepos.length,
        publicRepos: githubProfile?.public_repos || 0,
        followers: githubProfile?.followers || 0,
        following: githubProfile?.following || 0,
        totalStars: normalizedRepos.reduce((sum, repo) => sum + (repo.stargazers_count || 0), 0),
        totalForks: normalizedRepos.reduce((sum, repo) => sum + (repo.forks_count || 0), 0),
        totalWatchers: normalizedRepos.reduce((sum, repo) => sum + (repo.watchers_count || 0), 0),
        totalOpenIssues: normalizedRepos.reduce((sum, repo) => sum + (repo.open_issues_count || 0), 0),
        topLanguage: topLanguages[0]?.language || 'N/A',
        topLanguages,
    };

    let profileReadme = user.githubProfileReadme || null;
    try {
        const fetchedReadme = await fetchGitHubProfileReadme(githubUsername);
        const hasReadmeContent = Boolean(fetchedReadme?.content || fetchedReadme?.renderedHtml);

        if (hasReadmeContent) {
            const hasChanged =
                (user.githubProfileReadme?.sha || '') !== fetchedReadme.sha ||
                (user.githubProfileReadme?.content || '') !== fetchedReadme.content ||
                (user.githubProfileReadme?.renderedHtml || '') !== fetchedReadme.renderedHtml ||
                (user.githubProfileReadme?.htmlUrl || '') !== fetchedReadme.htmlUrl;

            if (hasChanged || !user.githubProfileReadme?.fetchedAt) {
                user.githubProfileReadme = {
                    content: fetchedReadme.content,
                    renderedHtml: fetchedReadme.renderedHtml,
                    htmlUrl: fetchedReadme.htmlUrl,
                    sha: fetchedReadme.sha,
                    fetchedAt: new Date(),
                };
            } else {
                user.githubProfileReadme.fetchedAt = new Date();
            }

            profileReadme = user.githubProfileReadme;
        } else if (user.githubProfileReadme?.content || user.githubProfileReadme?.renderedHtml) {
            user.githubProfileReadme = undefined;
            profileReadme = null;
        }
    } catch (readmeError) {
        console.warn('Fetch GitHub profile README error:', readmeError?.message || readmeError);
    }

    const summary = {
        profile: {
            login: githubProfile?.login,
            name: githubProfile?.name,
            avatar_url: githubProfile?.avatar_url,
            bio: githubProfile?.bio,
            company: githubProfile?.company,
            blog: githubProfile?.blog,
            location: githubProfile?.location,
            twitter_username: githubProfile?.twitter_username,
            html_url: githubProfile?.html_url,
            created_at: githubProfile?.created_at,
            updated_at: githubProfile?.updated_at,
        },
        stats,
        repos: normalizedRepos,
        profileReadme: profileReadme
            ? {
                content: profileReadme.content || '',
                renderedHtml: profileReadme.renderedHtml || '',
                htmlUrl: profileReadme.htmlUrl || '',
                fetchedAt: profileReadme.fetchedAt || null,
            }
            : null,
    };

    user.githubSummaryCache = {
        profile: summary.profile,
        stats: summary.stats,
        repos: summary.repos,
        profileReadme: summary.profileReadme,
        fetchedAt: new Date(),
    };
    user.markModified('githubSummaryCache');

    // Update embedding with new GitHub data
    try {
        const profileText = buildProfileText(user);
        user.embedding = await generateEmbedding(profileText);
    } catch (embError) {
        console.error('Error updating embedding after GitHub sync:', embError);
    }

    await user.save();

    return summary;
}

function getStoredGitHubSummary(user) {
    const cache = user?.githubSummaryCache;
    if (!cache || !cache.fetchedAt) {
        return null;
    }

    return {
        profile: cache.profile || {},
        stats: cache.stats || {},
        repos: Array.isArray(cache.repos) ? cache.repos : [],
        profileReadme: cache.profileReadme || null,
    };
}

module.exports = {
    resolveGitHubUsername,
    buildGitHubSummaryForUser,
    getStoredGitHubSummary,
    fetchGitHubJson,
    formatGitHubRepo
};
