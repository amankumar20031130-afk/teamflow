# Team Task Manager

A full-stack web app for managing projects and tasks with your team. Built with the MERN stack.

## What it does

- Create projects and invite team members
- Assign tasks, set priorities and due dates
- Track progress with a Kanban board (To Do → In Progress → In Review → Done)
- Each project has its own Admin/Member roles
- Personal dashboard showing all your assigned tasks and overdue items

## Tech Stack

- **Frontend** – React 18, React Router v6, Axios
- **Backend** – Node.js, Express.js
- **Database** – MongoDB with Mongoose
- **Auth** – JWT (JSON Web Tokens)

## Getting Started

### Requirements

- Node.js v18+
- A MongoDB database (local or [MongoDB Atlas](https://www.mongodb.com/atlas))

### Setup

**1. Clone the repo**
```bash
git clone https://github.com/YOUR_USERNAME/team-task-manager.git
cd team-task-manager
```

**2. Install dependencies**
```bash
npm run install-all
```

**3. Create the server environment file**

Create a `.env` file inside the `server/` folder:

```
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=pick_any_long_random_string
JWT_EXPIRE=7d
NODE_ENV=development
CLIENT_URL=http://localhost:3000
```

**4. Run the app**
```bash
npm run dev
```

- Frontend runs on `http://localhost:3000`
- Backend runs on `http://localhost:5000`

## Project Roles

Every project has two roles:

| Role | Permissions |
|---|---|
| **Admin** | Add/remove members, manage project settings, create tasks |
| **Member** | View project, create and update tasks |

The person who creates a project is automatically the owner (admin).

## Folder Structure

```
team-task-manager/
├── client/          # React frontend
│   └── src/
│       ├── pages/
│       ├── components/
│       ├── context/
│       └── utils/
├── server/          # Express backend
│   └── src/
│       ├── controllers/
│       ├── models/
│       ├── routes/
│       ├── middleware/
│       └── utils/
├── package.json     # Root scripts
└── railway.json     # Deployment config
```

## Deployment (Railway)

1. Push your code to GitHub
2. Go to [railway.app](https://railway.app) and create a new project from your repo
3. Add these environment variables in Railway:

```
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
JWT_EXPIRE=7d
NODE_ENV=production
PORT=5000
```

4. Railway will build and deploy automatically

> Make sure your MongoDB Atlas cluster allows connections from any IP (`0.0.0.0/0`) under Network Access settings.

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/signup` | Register |
| POST | `/api/auth/login` | Login |
| GET | `/api/projects` | Get user's projects |
| POST | `/api/projects` | Create project |
| POST | `/api/projects/:id/members` | Add member |
| GET | `/api/tasks/project/:id` | Get project tasks |
| POST | `/api/tasks/project/:id` | Create task |
| PUT | `/api/tasks/:id` | Update task |
| GET | `/api/tasks/my` | Get my tasks |
