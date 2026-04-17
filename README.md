## 🚀 Features

- Create, edit, and delete trials
- Real-time dashboard with summary metrics
- Search and filter by crop, location, and status
- Sort by ID, crop, location, and status
- Input validation with meaningful error handling
- Persistent PostgreSQL database
- Interactive API documentation (Swagger)

---

## 📸 Screenshots

### Dashboard
![Dashboard](./screenshots/dashboard.png)

### Create Trial
![Create](./screenshots/create.png)

### Edit Trial
![Edit](./screenshots/edit.png)

### Search & Filter
![Filter](./screenshots/filter.png)

---

## 🏗️ Architecture

```text
React (Frontend)
        ↓
FastAPI (Backend API)
        ↓
PostgreSQL (Database via Docker)