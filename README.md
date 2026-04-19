<<<<<<< HEAD
# 🍓 Driscoll’s R&D Platform (AI-Assisted Trial Management)

A full-stack R&D workflow platform designed to simulate how agricultural research teams manage and analyze field trials.

This application connects structured data, APIs, and an AI-assisted decision layer to support real-world research workflows.

---

## 🚀 Key Features

- Create, edit, and manage field trials
- R&D-focused data model (crop, variety, objective, season)
- Real-time dashboard with summary metrics
- Search, filter, and sort trial data
- PostgreSQL-backed persistent storage
- RESTful API with FastAPI
- Interactive API documentation (Swagger)

### 🤖 AI Decision Support

- Analyzes trial notes to recommend status
- Provides confidence scoring
- Generates contextual explanations
- Suggests next actions
- Integrates directly into the trial creation workflow

=======
## 🚀 Features

- Create, edit, and delete trials
- Real-time dashboard with summary metrics
- Search and filter by crop, location, and status
- Sort by ID, crop, location, and status
- Input validation with meaningful error handling
- Persistent PostgreSQL database
- Interactive API documentation (Swagger)

>>>>>>> 833892c5413b1419fea178627110b4218e10ce5c
---

## 📸 Screenshots

### Dashboard
![Dashboard](./screenshots/dashboard.png)

### Create Trial
![Create](./screenshots/create.png)

### Edit Trial
![Edit](./screenshots/edit.png)

<<<<<<< HEAD
### AI Recommendation
![AI](./screenshots/filter.png)
=======
### Search & Filter
![Filter](./screenshots/filter.png)
>>>>>>> 833892c5413b1419fea178627110b4218e10ce5c

---

## 🏗️ Architecture

```text
React (Frontend)
        ↓
FastAPI (Backend API)
        ↓
PostgreSQL (Database via Docker)