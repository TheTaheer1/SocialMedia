# SST Social

SST Social is a full-stack social media application with posts, reels, stories, likes, comments, follows, notifications, profile images, Redux state management, and real-time updates through Socket.IO.

## Live application

- Frontend: https://social-media-lovat-delta.vercel.app/
- Backend: https://social-media-api-hr71.onrender.com
- Health check: https://social-media-api-hr71.onrender.com/health

The Render service is named `SocialMedia`. Its public URL keeps the original Render-generated hostname.

## Project structure

```text
client/vite-project/   React + Vite frontend
server/                Express + MongoDB backend
```

## Run locally

Install dependencies:

```bash
cd server
npm install

cd ../client/vite-project
npm install
```

Create `server/.env` from `server/.env.example` and fill in the values. Never commit this file.

Start the backend:

```bash
cd server
npm run dev
```

Start the frontend in another terminal:

```bash
cd client/vite-project
npm run dev
```

The local frontend runs at `http://localhost:5173` and the backend at `http://localhost:8089`.

## Environment variables

### Backend (`server/.env`)

```env
dbUrl=<MongoDB Atlas connection string>
JWT_SECRET=<long random secret>
CLOUDINARY_CLOUD_NAME=<Cloudinary cloud name>
CLOUDINARY_API_KEY=<Cloudinary API key>
CLOUDINARY_API_SECRET=<Cloudinary API secret>
CLIENT_URL=http://localhost:5173
PUBLIC_API_URL=http://localhost:8089
NODE_ENV=development
```

For Render, set `CLIENT_URL` to the Vercel URL and `PUBLIC_API_URL` to the Render URL. Render supplies `PORT` automatically.

### Frontend (`client/vite-project/.env`)

```env
VITE_API_URL=http://localhost:8089
```

In Vercel, set `VITE_API_URL` to the deployed Render backend URL.

## Main features

- Image posts and video reels with edit/delete controls.
- Stories with images or videos, 30-second story-video limit, 24-hour expiry, multiple-story ordering, and follower visibility.
- Likes and comments with counts, editing/deleting, and profile links.
- Follower/following lists and profile post/reel counts.
- Redux slices for authentication, profile, posts, reels, stories, comments, and notifications.
- Persistent login through secure HTTP-only cookies.
- Real-time new posts, reels, stories, likes, comments, and notifications over Socket.IO.
- `/health` endpoint for deployment monitoring.

## Deployment

### Vercel

Create a Vercel project from this repository with the root directory set to `client/vite-project`. Add `VITE_API_URL` using the Render backend URL. The included `vercel.json` handles React Router routes.

### Render

Create a Node web service from this repository with:

- Root directory: `server`
- Build command: `npm install`
- Start command: `npm start`

Add the backend environment variables, connect the MongoDB Atlas database, and set the Atlas IP access rules appropriately. For production security, prefer restricted network access and strong database credentials instead of permanently allowing `0.0.0.0/0`.

## Useful checks

```bash
curl -i https://social-media-api-hr71.onrender.com/health
```

The response should be HTTP `200` with `{ "status": "ok" }`.

Frontend checks:

```bash
cd client/vite-project
npm run lint
npm run build
```
