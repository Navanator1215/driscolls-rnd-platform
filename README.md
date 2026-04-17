## 🏗️ Architecture

```text
React (Frontend)
        ↓
FastAPI (Backend API)
        ↓
PostgreSQL (Database via Docker)
```

## 📦 Tech Stack

- **Frontend:** React + Vite
- **Backend:** FastAPI (Python)
- **Database:** PostgreSQL (Docker)
- **ORM:** SQLAlchemy
- **Validation:** Pydantic

## ⚙️ Setup Instructions

### 1. Open the project

```bash
cd driscolls-rnd-platform
```

### 2. Backend Setup

```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install fastapi uvicorn sqlalchemy psycopg2-binary
python -m uvicorn main:app --reload
```

### 3. Database (Docker)

```bash
docker run --name postgres-db ^
-e POSTGRES_PASSWORD=postgres123 ^
-e POSTGRES_DB=driscolls_rnd ^
-p 5433:5432 -d postgres
```

### 4. Frontend Setup

Open a second terminal:

```bash
cd frontend
npm install
npm run dev
```

### 5. Open the app

Frontend:
```text
http://localhost:5173
```

Backend docs:
```text
http://127.0.0.1:8000/docs
```

## 🔌 API Endpoints

- `GET /trials`
- `GET /trials/{id}`
- `POST /trials`
- `PUT /trials/{id}`
- `DELETE /trials/{id}`

## 🎯 Why This Project Matters

This project demonstrates key skills relevant to a modern R&D software engineering role:

- Building full-stack applications
- Designing and consuming REST APIs
- Connecting frontend, backend, and database layers
- Applying validation and structured response models
- Supporting data-driven workflow tools

## 🚀 Future Improvements

- Role-based access control
- AI-assisted trial recommendations
- Search and filtering at the API level
- Charts and analytics
- Integration with external scientific or field data systems

## 👨‍💻 Author

Antonio Navarro