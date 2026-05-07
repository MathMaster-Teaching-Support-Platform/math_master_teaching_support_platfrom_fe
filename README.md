# Math Master FE 🎓🔥

<p align="center">
  <!-- Optional logo: replace path if your team has an official logo -->
  <img src="./public/logo.png" alt="Math Master Logo" width="96" />
</p>

<p align="center">
  <a href="#"><img src="https://img.shields.io/badge/React-19-61dafb?logo=react&logoColor=white" alt="React 19"></a>
  <a href="#"><img src="https://img.shields.io/badge/Vite-7-646cff?logo=vite&logoColor=white" alt="Vite 7"></a>
  <a href="#"><img src="https://img.shields.io/badge/TypeScript-Strict-3178c6?logo=typescript&logoColor=white" alt="TypeScript Strict"></a>
  <a href="#"><img src="https://img.shields.io/badge/License-MIT-green.svg" alt="License MIT"></a>
</p>

Math Master FE là ứng dụng frontend cho nền tảng hỗ trợ dạy và học Toán, phục vụ 3 nhóm người dùng chính: `student`, `teacher`, `admin`.
Hệ thống tập trung vào quản lý khóa học, đề kiểm tra, roadmap, mindmap, AI hỗ trợ giảng dạy và dashboard vận hành.
This project is designed for product teams and educators who need a scalable, role-based education platform UI.

## Prerequisites

Before you continue, ensure you meet the following requirements:

- You have installed **Node.js 18+** (recommend latest LTS).
- You have installed **npm 9+**.
- You can run backend services at least on:
  - `http://localhost:8080` (Spring Boot API)
  - `http://localhost:8001` (OCR service, optional but recommended)
- You have a basic understanding of React + TypeScript + REST APIs.

## Installation

1. Clone repository:
   ```bash
   git clone <repository-url>
   ```
2. Move to frontend folder:
   ```bash
   cd math_master_teaching_support_platfrom_fe/my-react-app
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Create local environment file:
   ```bash
   cp .env.example .env
   ```
5. Start development server:
   ```bash
   npm run dev
   ```

App runs at `http://localhost:3000`.

## Usage

### Run commands

- Start dev server:
  ```bash
  npm run dev
  ```
- Build production:
  ```bash
  npm run build
  ```
- Run ESLint:
  ```bash
  npm run lint
  ```
- Preview production build:
  ```bash
  npm run preview
  ```

### Common environment options

- `VITE_API_BASE_URL`: production API base URL.
- `VITE_API_PROXY_TARGET`: dev proxy target for `/api` (default `http://localhost:8080`).
- `VITE_OCR_PROXY_TARGET`: dev proxy target for OCR route `/api/v1/crawl-data`.
- `VITE_FIREBASE_*` + `VITE_FIREBASE_VAPID_PUBLIC_KEY`: push notification setup.

### API routing behavior

- Dev:
  - `/api` -> backend API
  - `/api/v1/crawl-data` -> OCR service (with rewrite to `/api/v1`)
- Prod:
  - uses `VITE_API_BASE_URL`

For advanced internal structure, see source folders: `src/routes`, `src/services`, `src/hooks`, `src/pages`.

## Contributing

1. Fork/create a branch from `main`:
   ```bash
   git checkout -b feat/your-feature-name
   ```
2. Follow coding conventions:
   - Keep TypeScript strict-safe.
   - Use `API_ENDPOINTS` in `src/config/api.config.ts` (no hardcoded URL in pages/components).
   - Keep API calls in `src/services`.
3. Verify locally:
   ```bash
   npm run lint
   npm run build
   ```
4. Commit clearly and open Pull Request with:
   - change summary
   - test notes
   - screenshots for UI changes

If your team maintains a dedicated contributor guide, add `CONTRIBUTING.md` and link it here.

## Contributors

- Math Master Frontend Team
- Product & Teaching Operations Team

> Add individual names/handles here for major contributors.

## Acknowledgments

- React, Vite, TypeScript, TanStack Query communities.
- Firebase Cloud Messaging for realtime push notifications.
- Open-source libraries used in this project (`lucide-react`, `recharts`, `framer-motion`, `katex`, `mind-elixir`, ...).

## Contact

Questions, collaboration, or support:

- Project team email: `mathmaster.team@example.com`
- Technical contact: `frontend-lead@example.com`

> Replace with your real contact channels (email, Discord, Slack, or website).

## License

This project is licensed under the **MIT License**.

If your organization uses another license, update this section and add a `LICENSE` file at repository root.

## Optional README Fire 🔥

- Add real project logo (replace `./public/logo.png`).
- Add screenshot/gif demo:
  - `docs/screenshots/home.png`
  - `docs/screenshots/teacher-assessment.png`
- Add CI badges (build, lint, test, release) using [Shields.io](https://shields.io/).
- Keep emoji usage moderate for readability (`🎓`, `🚀`, `🔥`, `✅`).
