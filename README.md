# ProtectQube AI Ops - Frontend Dashboard App

Web Dashboard diagnostik & pemantauan telemetri real-time untuk armada SmartBox Edge Gateway. Dibangun menggunakan Next.js (App Router), React, Tailwind CSS, dan Lucide Icons.

## Tech Stack
* **Framework:** Next.js (App Router)
* **Language:** TypeScript
* **Styling:** Tailwind CSS & Vanilla CSS Design System
* **Icons:** Lucide React
* **Data Visualization:** Recharts
* **State & Data Fetching:** TanStack React Query

## Cara Menjalankan

### 1. Setup Environment
Salin template environment file:
```bash
cp .env.example .env
```
Pastikan `NEXT_PUBLIC_API_BASE_URL` mengarah ke backend FastAPI (default: `http://localhost:8000/api/v1`).

### 2. Install Dependencies
```bash
npm install
```

### 3. Jalankan Development Server
```bash
npm run dev
```
Aplikasi dapat diakses di [http://localhost:3000](http://localhost:3000).

### 4. Build Production
```bash
npm run build
npm run start
```
