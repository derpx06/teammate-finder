function toCleanText(input, maxLength = 1600) {
  return String(input || '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLength);
}

function toSentenceCase(text) {
  return text.replace(/(^|[.!?]\s+)([a-z])/g, (match, prefix, letter) => `${prefix}${letter.toUpperCase()}`);
}

function fallbackImproveText(rawText, context = 'general') {
  const cleaned = toCleanText(rawText);
  if (!cleaned) return '';

  let improved = toSentenceCase(cleaned);
  if (!/[.!?]$/.test(improved)) {
    improved = `${improved}.`;
  }

  if (context === 'project') {
    return `This project focuses on ${improved.charAt(0).toLowerCase()}${improved.slice(1)} It aims to deliver clear user value, practical execution milestones, and strong collaboration outcomes.`;
  }

  if (context === 'profile') {
    return `I am ${improved.charAt(0).toLowerCase()}${improved.slice(1)} I am looking to collaborate on meaningful projects where I can contribute effectively and keep growing as a builder.`;
  }

  return improved;
}

function readGeminiTextResponse(payload) {
  return payload?.candidates?.[0]?.content?.parts
    ?.map((part) => String(part?.text || ''))
    .join('')
    .trim();
}

async function improveTextWithGemini(text, context = 'general', metadata = {}) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return { text: fallbackImproveText(text, context), mode: 'fallback' };
  }

  const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash-lite';
  const timeoutMs =
    Number(process.env.GEMINI_TIMEOUT_MS) > 0 ? Number(process.env.GEMINI_TIMEOUT_MS) : 12000;
  const maxAttempts = 2;

  const normalizedText = toCleanText(text);
  const promptPayload = {
    context,
    metadata,
    text: normalizedText,
  };

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
          model
        )}:generateContent?key=${encodeURIComponent(apiKey)}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          signal: controller.signal,
          body: JSON.stringify({
            systemInstruction: {
              parts: [
                {
                  text:
                    'You improve user-provided descriptions. Keep the original intent and facts. Return plain text only with no markdown.',
                },
              ],
            },
            contents: [
              {
                role: 'user',
                parts: [
                  {
                    text:
                      `Input JSON:\n${JSON.stringify(promptPayload)}\n` +
                      'Rewrite this description to be polished, clear, concise, and professional. Keep it to 2-4 sentences.',
                  },
                ],
              },
            ],
            generationConfig: {
              temperature: 0.35,
            },
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        throw new Error(
          `Gemini text enhancement failed (${response.status}): ${errorText.slice(0, 200)}`
        );
      }

      const payload = await response.json();
      const improvedText = toCleanText(readGeminiTextResponse(payload));
      if (!improvedText) {
        throw new Error('Gemini returned an empty response');
      }

      return { text: improvedText, mode: 'llm' };
    } catch (error) {
      if (attempt === maxAttempts) {
        return { text: fallbackImproveText(normalizedText, context), mode: 'fallback' };
      }
    } finally {
      clearTimeout(timeout);
    }
  }

  return { text: fallbackImproveText(normalizedText, context), mode: 'fallback' };
}

module.exports = {
  toCleanText,
  improveTextWithGemini,
};
