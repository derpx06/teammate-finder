# DevCraft-BroCoders

Collaborative developer platform to create projects, recruit teammates, run AI-assisted project planning, and collaborate in real-time.

## Core Features
- Auth: Email/password + Google/GitHub OAuth
- Onboarding + profile: skills, interests, availability, GitHub enrichment
- Find Teammates:
  - classic search + filters
  - semantic (vector) search with keyword fallback
  - connect + follow actions
- Project lifecycle:
  - create project, post open roles, apply/invite, accept/reject flows
  - roadmap editing (owner + members), progress tracking
  - project/team chats via Socket.IO
- Virtual CTO:
  - generates project blueprint (title, stack, roles, roadmap)
  - stream endpoint for progressive responses
  - candidate recommendations + teammate pairing suggestions
- AI Project Analysis:
  - owner-triggered analysis on Project Details
  - auto role suggestions + skill-gap detection
  - persisted `latestAnalysis` on project (owner-only visibility)
  - one-click "open suggested positions" from analysis
- Profile project recommendations:
  - recommends open roles based on user skills
  - direct apply flow from profile cards
- Unified candidate details popup:
  - same detailed modal across Find Teammates, Project Analysis, Virtual CTO chat, Dashboard suggestions, and team cards

## Agent Working
### Virtual CTO Agent Flow
1. User submits an idea in Create Project or Dashboard widget.
2. Backend creates a base plan (title, description, stack, roles, roadmap).
3. Gemini (`gemini-2.5-flash-lite`) enhances plan quality and structure.
4. Candidate matching runs using:
   - semantic embeddings/vector similarity
   - skill overlap scoring
   - keyword fallback when needed
5. Agent returns:
   - technical plan + roadmap
   - required skills + role cards
   - candidate recommendations
   - teammate pair suggestions
6. Result can stream in real-time via `POST /api/project/virtual-cto/stream`.
7. Plan can be converted into a real project and invites can be sent immediately.

### Project Analysis Agent Flow
1. Owner runs `Analyze Project` from Project Details.
2. Agent uses project context:
   - current roles/openings
   - team composition
   - project description/category/commitment
3. It detects skill gaps and role shortages, suggests candidates, and computes role-candidate matches.
4. Analysis is persisted as `latestAnalysis` on the project.
5. Owner can re-run analysis anytime; latest run overwrites prior snapshot.
6. Owner can click `Open Suggested Positions` to publish analyzed openings.

## Tech Stack
- Frontend
  - React 19
  - Vite 7
  - Tailwind CSS
  - Framer Motion
  - React Router DOM
  - Socket.IO Client
- Backend
  - Node.js + Express
  - Mongoose (MongoDB)
  - Socket.IO Server
  - Passport (Google/GitHub OAuth strategies)
  - JWT auth
- AI + Matching
  - Gemini API (`gemini-2.5-flash-lite`) for Virtual CTO enhancement
  - Local embedding generation and vector similarity search
  - Hybrid ranking: semantic + skills + keyword fallback
- Data/Infrastructure
  - MongoDB for users, projects, notifications, chats, messages
  - In-memory cache for Virtual CTO package responses

## Repository Structure
```text
.
|- backend/    # Express API, routes/models, Socket.IO server
|- frontend/   # React Vite client
|- README.md
```

## Prerequisites
- Node.js 18+ (latest LTS recommended)
- npm 9+
- MongoDB (local or hosted)

## Local Setup

### 1) Backend
```bash
cd backend
npm install
```

Create `backend/.env` (copy from `backend/.env.example` and replace values):
```env
PORT=5000
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173
FRONTEND_ORIGIN=http://localhost:5173
MONGO_URI=mongodb://127.0.0.1:27017/devcraft
JWT_SECRET=replace_with_a_strong_secret
JWT_EXPIRES_IN=7d

GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

GEMINI_API_KEY=
GEMINI_MODEL=gemini-2.5-flash-lite
GEMINI_TIMEOUT_MS=12000
VIRTUAL_CTO_CACHE_TTL_MS=300000
```

Run:
```bash
npm run dev
```

### 2) Frontend
```bash
cd frontend
npm install
```

Optional `frontend/.env`:
```env
VITE_API_BASE_URL=http://localhost:5000
VITE_WS_BASE_URL=ws://localhost:5000
```

Run:
```bash
npm run dev
```

## Local URLs
- Frontend: `http://localhost:5173`
- Backend API base: `http://localhost:5000/api`
- Health: `http://localhost:5000/health`

## Scripts

### Backend (`backend/package.json`)
- `npm run dev` - run with nodemon
- `npm start` - run with node
- `npm run check` - syntax check (`node --check`)
- `npm run migrate:embeddings` - embeddings migration script

### Frontend (`frontend/package.json`)
- `npm run dev` - Vite dev
- `npm run build` - production build
- `npm run lint` - ESLint
- `npm run preview` - preview build

## API Modules (High Level)
- `/api/auth` - authentication + OAuth
- `/api/user` - profile, teammates, semantic search, follow/connect
- `/api/project` - projects, roles, applications, invites, analysis, Virtual CTO
- `/api/chat` - chat creation/access
- `/api/message` - chat messages
- `/api/notification` - invites/applications/connection actions

## Notable Project Endpoints
- `POST /api/project/virtual-cto/plan`
- `POST /api/project/virtual-cto/stream` (NDJSON stream)
- `POST /api/project/:id/analyze` (owner only; saves `latestAnalysis`)
- `POST /api/project/:id/open-positions` (owner only; publish analyzed roles)
- `POST /api/project/:id/apply`
- `POST /api/project/:id/invite`

## Realtime Events (Socket.IO)
- Client emits: `setup`, `join chat`, `new message`, `typing`, `stop typing`
- Server emits: `connected`, `message received`

## Security/Deployment Notes
- Replace all secrets before running outside local dev.
- Rotate any API key that was exposed accidentally.
- Update OAuth callback URLs when deploying (currently local defaults).
- Do not commit `.env` secrets.


<img width="1919" height="909" alt="Screenshot 2026-02-19 173343" src="https://github.com/user-attachments/assets/c53c97ca-c7aa-49a4-8f93-43ad09051a37" />

<img width="1919" height="914" alt="Screenshot 2026-02-19 173509" src="https://github.com/user-attachments/assets/52c77a72-34d2-4c79-997c-b469e6f693ef" />




<img width="1900" height="908" alt="Screenshot 2026-02-19 173610" src="https://github.com/user-attachments/assets/802309c7-d613-4289-8ee7-ac38103ac0a2" />


<img width="1901" height="912" alt="Screenshot 2026-02-19 173640" src="https://github.com/user-attachments/assets/879866c3-82ff-45f3-9d7e-75d8e4359708" />


<img width="1600" height="766" alt="image" src="https://github.com/user-attachments/assets/134319bf-941c-4c5c-8123-36390f41abd9" />


<img width="1899" height="913" alt="Screenshot 2026-02-19 173801" src="https://github.com/user-attachments/assets/01aef4c9-3cb4-4d55-9bc6-37346cb04ed9" />



<img width="1900" height="910" alt="image" src="https://github.com/user-attachments/assets/ea4ca8de-b65f-41e9-9f3b-6ec435275d79" />
