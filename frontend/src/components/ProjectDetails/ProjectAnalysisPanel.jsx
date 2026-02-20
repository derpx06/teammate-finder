import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Bot, Loader2, Sparkles, UserPlus, Users } from 'lucide-react';

function toPercent(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return '0.0%';
  return `${(numeric * 100).toFixed(1)}%`;
}

const ProjectAnalysisPanel = ({
  analysis = null,
  analyzing = false,
  onAnalyze,
  isOwner = false,
  invitingByUserId = {},
  onInviteUser,
  notifyMessage = '',
  onOpenPositions,
  openingPositions = false,
}) => {
  const navigate = useNavigate();
  const roleCandidateMatches = Array.isArray(analysis?.roleCandidateMatches)
    ? analysis.roleCandidateMatches
    : [];
  const teammateSuggestions = Array.isArray(analysis?.teammateSuggestions)
    ? analysis.teammateSuggestions
    : [];
  const projectSkillGap = Array.isArray(analysis?.projectSkillGap) ? analysis.projectSkillGap : [];

  return (
    <div className="surface-card rounded-2xl p-6 mb-6">
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-4">
        <div>
          <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Bot className="w-5 h-5 text-blue-600" />
            AI Project Analysis
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Analyze current team, skills, and openings. The agent can auto-update missing roles for owners.
          </p>
        </div>
        <button
          type="button"
          onClick={onAnalyze}
          disabled={analyzing}
          className="btn-primary inline-flex items-center gap-2 px-4 py-2 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {analyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          {analyzing ? 'Analyzing...' : 'Analyze Project'}
        </button>
      </div>

      {isOwner && analysis ? (
        <div className="mb-4">
          <button
            type="button"
            onClick={onOpenPositions}
            disabled={openingPositions}
            className="btn-primary inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {openingPositions ? <Loader2 className="w-4 h-4 animate-spin" /> : <Users className="w-4 h-4" />}
            {openingPositions ? 'Opening Positions...' : 'Open Suggested Positions'}
          </button>
        </div>
      ) : null}

      {notifyMessage ? (
        <div className="text-xs text-green-700 bg-green-50 border border-green-100 rounded-md p-2 mb-4">
          {notifyMessage}
        </div>
      ) : null}

      {analysis ? (
        <div className="space-y-5">
          <div className="grid sm:grid-cols-3 gap-3">
            <div className="border border-blue-100 bg-blue-50 rounded-lg p-3">
              <p className="text-[11px] text-blue-700 uppercase tracking-wide font-semibold">
                Required Skills
              </p>
              <p className="text-lg font-bold text-blue-900">
                {Array.isArray(analysis.requiredSkills) ? analysis.requiredSkills.length : 0}
              </p>
            </div>
            <div className="border border-emerald-100 bg-emerald-50 rounded-lg p-3">
              <p className="text-[11px] text-emerald-700 uppercase tracking-wide font-semibold">
                Candidates
              </p>
              <p className="text-lg font-bold text-emerald-900">
                {Array.isArray(analysis.candidates) ? analysis.candidates.length : 0}
              </p>
            </div>
            <div className="border border-violet-100 bg-violet-50 rounded-lg p-3">
              <p className="text-[11px] text-violet-700 uppercase tracking-wide font-semibold">
                Team Pair Ideas
              </p>
              <p className="text-lg font-bold text-violet-900">{teammateSuggestions.length}</p>
            </div>
          </div>

          <div className="rounded-xl border border-orange-200 bg-orange-50 p-3">
            <h4 className="text-sm font-semibold text-orange-900 mb-1">Skill Gap In Project</h4>
            {projectSkillGap.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {projectSkillGap.map((skill) => (
                  <span
                    key={skill}
                    className="text-[11px] px-2 py-1 rounded-md bg-white border border-orange-200 text-orange-700"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-orange-700">No major gap detected from current analysis.</p>
            )}
          </div>

          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-600" />
              Role-Based Candidate Slider
            </h4>
            {roleCandidateMatches.length === 0 ? (
              <p className="text-sm text-gray-500">No role-candidate matches available yet.</p>
            ) : (
              <div className="space-y-3">
                {roleCandidateMatches.map((entry) => (
                  <div key={entry?.role?.title || 'role'} className="surface-card-muted p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <h5 className="text-sm font-semibold text-gray-900">
                          {entry?.role?.title || 'Role'}
                        </h5>
                        <p className="text-xs text-gray-500">
                          Skills: {(entry?.role?.skills || []).join(', ') || 'N/A'}
                        </p>
                      </div>
                      <span className="text-[11px] px-2 py-1 rounded-md bg-blue-50 text-blue-700 border border-blue-100">
                        {Number(entry?.role?.spots) || 1} spot{Number(entry?.role?.spots) > 1 ? 's' : ''}
                      </span>
                    </div>

                    <div className="flex gap-3 overflow-x-auto pb-1">
                      {(Array.isArray(entry?.candidates) ? entry.candidates : []).map((candidate) => {
                        const candidateId = String(candidate?.id || '');
                        const inviteState = invitingByUserId?.[candidateId] || {};
                        return (
                          <div
                            key={candidateId || candidate?.email}
                            className={`min-w-[230px] max-w-[230px] surface-card-soft p-3 card-hover-lift ${
                              candidateId ? 'cursor-pointer hover:border-blue-300 transition-colors' : ''
                            }`}
                            role={candidateId ? 'button' : undefined}
                            tabIndex={candidateId ? 0 : undefined}
                            onClick={() => {
                              if (!candidateId) return;
                              navigate(`/user/${candidateId}`);
                            }}
                            onKeyDown={(event) => {
                              if (!candidateId) return;
                              if (event.key === 'Enter' || event.key === ' ') {
                                event.preventDefault();
                                navigate(`/user/${candidateId}`);
                              }
                            }}
                          >
                            <p className="text-sm font-semibold text-gray-900 truncate">
                              {candidate?.name || candidate?.email || 'Candidate'}
                            </p>
                            <p className="text-xs text-gray-500 truncate">{candidate?.role || 'Member'}</p>
                            <p className="text-xs text-emerald-700 font-semibold mt-1">
                              Match {toPercent(candidate?.blendedRoleScore)}
                            </p>
                            <p className="text-[11px] text-gray-600 mt-1">
                              Skills: {(candidate?.matchedRoleSkills || []).slice(0, 3).join(', ') || 'N/A'}
                            </p>
                            <button
                              type="button"
                              disabled={!isOwner || !candidateId || Boolean(inviteState.loading)}
                              onClick={(event) => {
                                event.stopPropagation();
                                onInviteUser?.(candidateId, entry?.role?.title || 'Contributor');
                              }}
                              className="mt-2 btn-primary w-full inline-flex items-center justify-center gap-1.5 px-2 py-1.5 text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <UserPlus className="w-3.5 h-3.5" />
                              {inviteState.loading ? 'Inviting...' : 'Invite'}
                            </button>
                            {inviteState.error ? (
                              <p className="text-[11px] text-red-600 mt-1">{inviteState.error}</p>
                            ) : null}
                            {inviteState.success ? (
                              <p className="text-[11px] text-green-600 mt-1">{inviteState.success}</p>
                            ) : null}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {teammateSuggestions.length > 0 ? (
            <div className="rounded-xl border border-violet-100 bg-violet-50 p-3">
              <h4 className="text-sm font-semibold text-violet-900 mb-1">Recommended teammate pairs</h4>
              <div className="space-y-1.5">
                {teammateSuggestions.slice(0, 4).map((suggestion, index) => (
                  <div key={`pair-${index}`} className="text-xs text-violet-800 bg-white border border-violet-100 rounded-md p-2">
                    <span className="font-semibold">
                      {(suggestion?.pair || []).map((member) => member?.name).filter(Boolean).join(' + ') || 'Team pair'}
                    </span>
                    <span> - {suggestion?.recommendation || 'Recommended pairing'}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
};

export default ProjectAnalysisPanel;
