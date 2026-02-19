import React, { useEffect, useMemo, useState } from 'react';
import { Briefcase, Loader2, Sparkles, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../../config/api';

function toLowerSkillSet(skills = []) {
  return new Set(
    (Array.isArray(skills) ? skills : [])
      .map((skill) => String(skill || '').trim().toLowerCase())
      .filter(Boolean)
  );
}

const ProfileProjectRecommendations = ({ userId = '', userSkills = [] }) => {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [applyingKey, setApplyingKey] = useState('');
  const [applyMessage, setApplyMessage] = useState('');
  const [applyError, setApplyError] = useState('');
  const [appliedMap, setAppliedMap] = useState({});

  useEffect(() => {
    const fetchRecommendationsBase = async () => {
      setLoading(true);
      setError('');
      try {
        const token = localStorage.getItem('authToken');
        const response = await fetch(`${API_BASE_URL}/api/project/bazaar`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch recommended projects');
        }
        setItems(Array.isArray(data.items) ? data.items : []);
      } catch (fetchError) {
        setError(fetchError.message || 'Failed to fetch recommended projects');
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendationsBase();
  }, []);

  const recommendations = useMemo(() => {
    const mySkills = toLowerSkillSet(userSkills);
    const normalizedUserId = String(userId || '');
    const scored = (Array.isArray(items) ? items : [])
      .filter((item) => String(item?.owner?.id || '') !== normalizedUserId)
      .filter((item) => Number(item?.spots) > 0)
      .map((item) => {
        const roleSkills = Array.isArray(item?.skills) ? item.skills : [];
        const normalizedRoleSkills = roleSkills
          .map((skill) => String(skill || '').trim().toLowerCase())
          .filter(Boolean);
        const matchedSkills = roleSkills.filter((skill) =>
          mySkills.has(String(skill || '').trim().toLowerCase())
        );
        const matchCount = matchedSkills.length;
        const roleSkillCount = normalizedRoleSkills.length;
        const matchScore = roleSkillCount > 0 ? Math.round((matchCount / roleSkillCount) * 100) : 0;

        return {
          ...item,
          matchScore,
          matchedSkills,
        };
      })
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 6);

    return scored;
  }, [items, userId, userSkills]);

  const handleApply = async (item) => {
    const projectId = String(item?.projectId || '').trim();
    const roleTitle = String(item?.roleTitle || '').trim();
    const applyKey = `${projectId}:${roleTitle}`.toLowerCase();
    if (!projectId || !roleTitle) return;

    setApplyError('');
    setApplyMessage('');
    setApplyingKey(applyKey);
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_BASE_URL}/api/project/${projectId}/apply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ roleTitle }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || 'Failed to apply for this role');
      }

      setAppliedMap((prev) => ({ ...prev, [applyKey]: true }));
      setApplyMessage(
        `Applied for ${roleTitle} in ${item.projectTitle}. The project owner can accept your application from their side.`
      );
    } catch (actionError) {
      setApplyError(actionError.message || 'Failed to apply for role');
    } finally {
      setApplyingKey('');
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between gap-3 mb-4">
        <div>
          <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-blue-600" />
            Recommended Projects
          </h3>
          <p className="text-xs text-gray-500 mt-1">
            Ranked using your skills and current open positions.
          </p>
        </div>
      </div>

      {error ? (
        <div className="mb-3 text-xs text-red-700 bg-red-50 border border-red-100 rounded-md p-2.5">
          {error}
        </div>
      ) : null}

      {applyError ? (
        <div className="mb-3 text-xs text-red-700 bg-red-50 border border-red-100 rounded-md p-2.5">
          {applyError}
        </div>
      ) : null}

      {applyMessage ? (
        <div className="mb-3 text-xs text-green-700 bg-green-50 border border-green-100 rounded-md p-2.5">
          {applyMessage}
        </div>
      ) : null}

      {loading ? (
        <div className="py-8 flex items-center justify-center text-gray-500 text-sm">
          <Loader2 className="w-4 h-4 animate-spin mr-2" />
          Loading recommendations...
        </div>
      ) : recommendations.length === 0 ? (
        <div className="text-sm text-gray-500 bg-gray-50 border border-dashed border-gray-200 rounded-xl p-4">
          No matching open positions found yet.
        </div>
      ) : (
        <div className="space-y-3">
          {recommendations.map((item) => {
            const roleTitle = String(item?.roleTitle || '').trim();
            const projectId = String(item?.projectId || '').trim();
            const applyKey = `${projectId}:${roleTitle}`.toLowerCase();
            const isApplying = applyingKey === applyKey;
            const isApplied = Boolean(appliedMap[applyKey]);

            return (
              <div key={item.id} className="rounded-xl border border-gray-100 bg-gray-50 p-3.5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs text-blue-700 font-semibold uppercase tracking-wide">
                      {item.projectCategory || 'General'}
                    </p>
                    <h4 className="text-sm font-bold text-gray-900 truncate">{item.projectTitle}</h4>
                    <p className="text-xs text-gray-600 mt-0.5">
                      {roleTitle} • Match {Number(item.matchScore) || 0}%
                    </p>
                  </div>
                  <span className="text-[11px] px-2 py-1 rounded-md bg-white border border-gray-200 text-gray-700 whitespace-nowrap">
                    {item.spots} spot{Number(item.spots) > 1 ? 's' : ''} open
                  </span>
                </div>

                <div className="mt-2 flex flex-wrap gap-1.5">
                  {(Array.isArray(item.skills) ? item.skills : []).slice(0, 6).map((skill) => {
                    const isMatched = (item.matchedSkills || []).some(
                      (matched) => String(matched).toLowerCase() === String(skill).toLowerCase()
                    );
                    return (
                      <span
                        key={`${item.id}-${skill}`}
                        className={`text-[11px] px-2 py-1 rounded-md border ${
                          isMatched
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                            : 'bg-white border-gray-200 text-gray-600'
                        }`}
                      >
                        {skill}
                      </span>
                    );
                  })}
                </div>

                <div className="mt-3 flex items-center justify-between gap-2">
                  <div className="text-[11px] text-gray-500 inline-flex items-center gap-1">
                    <Users size={12} />
                    Owner: {item.owner?.name || 'Project Owner'}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => navigate(`/project/${item.projectId}`)}
                      className="px-2.5 py-1.5 text-xs font-semibold rounded-md bg-white border border-gray-200 text-gray-700 hover:bg-gray-100"
                    >
                      View
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApply(item)}
                      disabled={isApplying || isApplied}
                      className="px-2.5 py-1.5 text-xs font-semibold rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed inline-flex items-center gap-1.5"
                    >
                      <Briefcase size={12} />
                      {isApplying ? 'Applying...' : isApplied ? 'Applied' : 'Apply'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ProfileProjectRecommendations;

