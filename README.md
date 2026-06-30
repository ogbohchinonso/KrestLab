# KrestLab — Full-Stack Browser IDE with AI Tutor

A self-hosted, production-ready code editor and learning platform. Write and run HTML, CSS, JavaScript, Python, TypeScript, Java, C++, Rust, Go, and SQL — all for free — with auth, saved snippets, sharing, and an AI tutor that builds a personalised curriculum, explains every concept, and walks you through a capstone project.

---

## Architecture

```
┌─────────────┐      ┌──────────────┐      ┌─────────────┐
│  Frontend    │ ───▶ │  Express API  │ ───▶ │  MongoDB     │
│  (static)    │      │  (Node.js)    │      │  (snippets,  │
│              │      │               │      │  users, ───  │
│              │      │               │      │  curricula)  │
└─────────────┘      └──────┬───────┘      └─────────────┘
                              │
                ┌─────────────┘
                ▼
        ┌──────────────┐              ┌────────────────┐
        │  Judge0 CE    │              │  DeepSeek API   │
        │  (self-hosted, │ ───────────▶ │  (AI Tutor:      │
        │  Docker)       │              │  curriculum,     │
        │  Python, Java, │              │  hints, review)  │
        │  C++, Rust...  │              └────────────────┘
        └──────────────┘
```

- **HTML/CSS/JS** run instantly client-side in a sandboxed `<iframe>` — no server round-trip.
- **Python, Java, C++, Rust, Go, TypeScript, SQL, etc.** run on a **self-hosted Judge0 CE** instance (Docker) — your own execution sandbox, no third-party API key, no rate limit beyond what you set.
- **AI Tutor** calls the DeepSeek API to generate a full multi-step curriculum + capstone project for any topic, explain concepts, give Socratic hints, and review submitted code.

---

## Folder structure

```
krestlab/
├── docker-compose.yml          ← orchestrates backend + MongoDB + Judge0
├── .env.example
├── backend/
│   ├── Dockerfile
│   ├── package.json
│   ├── server.js                ← Express entry point
│   ├── config/
│   │   ├── db.js                 ← MongoDB connection
│   │   └── languages.js          ← Judge0 language ID map
│   ├── middleware/
│   │   ├── auth.js               ← JWT protect / optionalAuth
│   │   └── validate.js           ← Joi request validation
│   ├── models/
│   │   ├── User.js
│   │   ├── Snippet.js
│   │   └── Curriculum.js
│   ├── routes/
│   │   ├── auth.js               ← register / login / me
│   │   ├── snippets.js           ← CRUD, share, fork
│   │   ├── execute.js            ← code execution proxy
│   │   ├── tutor.js              ← AI tutor actions
│   │   └── users.js              ← profile, password
│   └── services/
│       ├── judge0.js             ← Judge0 submission + polling
│       └── tutor.js              ← all DeepSeek API calls
└── frontend/
    ├── index.html                 ← the IDE
    ├── login.html
    ├── register.html
    ├── dashboard.html              ← snippets, learning paths, profile
    ├── css/
    │   ├── style.css
    │   ├── auth.css
    │   └── dashboard.css
    └── js/
        ├── config.js                ← API_BASE URL
        ├── auth.js                  ← token storage, login/register
        ├── api.js                   ← fetch wrapper for all endpoints
        ├── editor.js                 ← CodeMirror, 11 languages
        ├── console.js                 ← log rendering
        ├── runner.js                  ← routes execution: iframe vs server
        ├── tutor.js                    ← AI Tutor panel logic
        ├── snippets.js                 ← save/share modals
        ├── dashboard.js                  ← dashboard page logic
        └── app.js                        ← boot, Split.js, toolbar
```

---

## Setup

### 1. Prerequisites
- Docker + Docker Compose
- A [DeepSeek API key](https://platform.deepseek.com)

### 2. Configure environment

```bash
cp .env.example .env
```

Edit `.env` and fill in:
- `JWT_SECRET` — any long random string
- `DEEPSEEK_API_KEY` — your DeepSeek API key
- `JUDGE0_AUTH_TOKEN` — any string, secures your self-hosted Judge0 instance

### 3. Launch the full stack

```bash
docker compose up -d --build
```

This starts:
- `krestlab-api` on port `4000`
- `krestlab-mongo` (MongoDB) on port `27017`
- `krestlab-judge0` (execution engine) on port `2358`
- Judge0's worker, Postgres, and Redis containers

### 4. Serve the frontend

The frontend is static — no build step. For local dev:

```bash
cd frontend
npx serve .          # or: python3 -m http.server 3000
```

Update `frontend/js/config.js` if your API isn't on `localhost:4000`:

```js
window.KrestConfig = { API_BASE: 'https://api.yourdomain.com/api' };
```

### 5. Open the app

Visit `http://localhost:3000` (or wherever you served the frontend). Register an account, pick a language tab, and hit Run.

---

## Deploying to production

- **Backend** — deploy the `backend/` folder (with its Dockerfile) to Render, Railway, Fly.io, or a VPS with Docker. Point `MONGO_URI` at a managed MongoDB (Atlas free tier works).
- **Judge0** — either keep it self-hosted alongside your backend (same docker-compose, on a VPS with enough RAM — 2GB+ recommended), or swap `services/judge0.js`'s `JUDGE0_URL` to a managed Judge0 RapidAPI endpoint if you'd rather not maintain the execution sandbox yourself.
- **Frontend** — deploy `frontend/` as static files to Vercel, Netlify, GitHub Pages, or Cloudflare Pages. Update `config.js` to point at your live API URL.
- **CORS** — set `CLIENT_URL` in your backend `.env` to your deployed frontend's origin.

---

## Monetization hooks already wired (not yet enforced)

**All languages and the AI tutor are free** right now. The codebase still has the scaffolding ready for when you want to monetize differently:

- `User.usage.executions` tracks every execution per user (visible in dashboard later)
- Stripe SDK is installed and `.env` has placeholder keys — no checkout flow built yet
- `Snippet.isPublic` + community browsing (`GET /api/snippets/public`) is built — a natural place for a "featured snippets" or marketplace feature later
- XP/level system (`user.tutor.xp`) is live and could gate advanced curricula, badges, or a leaderboard

Ideas to revisit once you're ready to monetize: a paid "Teams" tier (shared workspaces, private curricula for students you mentor), a marketplace where users sell premium curricula/capstones, or sponsored company "challenge tracks" using your existing public-snippet infrastructure.

---

## Known limitations (intentionally not papered over)

- **Judge0 self-hosted** needs a reasonably resourced host (2GB+ RAM) because it spins up isolated sandboxes per submission. On a small free-tier VPS, expect execution latency.
- **AI-generated curricula** are not human-reviewed. Treat them as a strong first draft, not a vetted syllabus — useful for your stated goal of personalised, on-demand learning paths, but worth spot-checking for accuracy on advanced topics.
- **DeepSeek JSON reliability**: the curriculum generator asks the model to return strict JSON. DeepSeek is occasionally less consistent at this than Claude on long, structured prompts — `tutor.js` already catches parse failures gracefully, but if you see frequent "Failed to parse curriculum" errors, that's why. Worth retrying the request, or switching `DEEPSEEK_MODEL` to a newer DeepSeek release if one becomes available.
