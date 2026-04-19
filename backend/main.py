from enum import Enum

from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from database import SessionLocal, engine
import models

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Driscoll's R&D Platform")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class TrialStatus(str, Enum):
    active = "Active"
    planned = "Planned"
    completed = "Completed"


class TrialCreate(BaseModel):
    crop: str = Field(..., min_length=2, max_length=50)
    variety: str | None = Field(default="")
    location: str = Field(..., min_length=2, max_length=100)
    objective: str | None = Field(default="")
    season: str | None = Field(default="")
    status: TrialStatus
    notes: str | None = Field(default="")
    ai_recommendation: str | None = Field(default="")
    ai_next_action: str | None = Field(default="")


class TrialUpdate(BaseModel):
    crop: str = Field(..., min_length=2, max_length=50)
    variety: str | None = Field(default="")
    location: str = Field(..., min_length=2, max_length=100)
    objective: str | None = Field(default="")
    season: str | None = Field(default="")
    status: TrialStatus
    notes: str | None = Field(default="")
    ai_recommendation: str | None = Field(default="")
    ai_next_action: str | None = Field(default="")


class TrialResponse(BaseModel):
    id: int
    crop: str
    variety: str | None = None
    location: str
    objective: str | None = None
    season: str | None = None
    status: TrialStatus
    notes: str | None = None
    ai_recommendation: str | None = None
    ai_next_action: str | None = None

    class Config:
        from_attributes = True


class TrialListResponse(BaseModel):
    trials: list[TrialResponse]
    count: int


class MessageResponse(BaseModel):
    message: str


class TrialCreateResponse(BaseModel):
    message: str
    trial: TrialResponse


class TrialUpdateResponse(BaseModel):
    message: str
    trial: TrialResponse


class AIRecommendationRequest(BaseModel):
    crop: str = Field(..., min_length=2, max_length=50)
    location: str = Field(..., min_length=2, max_length=100)
    notes: str = Field(..., min_length=5, max_length=500)


class AIRecommendationResponse(BaseModel):
    recommended_status: TrialStatus
    confidence: int
    explanation: str
    next_action: str


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def recommend_status(crop: str, location: str, notes: str) -> dict:
    text = notes.lower()
    crop_lower = crop.lower()
    location_lower = location.lower()

    scores = {
        "Active": 0,
        "Planned": 0,
        "Completed": 0,
    }

    evidence = []

    completed_signals = {
        "harvest complete": 4,
        "completed": 3,
        "finished": 3,
        "finalized": 4,
        "wrapped up": 3,
        "done": 2,
        "trial complete": 4,
        "closed out": 4,
    }

    planned_signals = {
        "planned": 3,
        "not started": 4,
        "upcoming": 3,
        "schedule": 2,
        "prepare": 2,
        "preparation": 3,
        "awaiting": 2,
        "to begin": 3,
        "next week": 2,
        "next month": 2,
        "setup": 2,
    }

    active_signals = {
        "observed": 2,
        "monitoring": 3,
        "in progress": 4,
        "collecting data": 4,
        "flowering": 2,
        "fruiting": 2,
        "pest pressure": 4,
        "disease pressure": 4,
        "irrigation": 2,
        "stress": 2,
        "active": 2,
        "ongoing": 3,
        "sampling": 3,
        "tracking": 2,
        "underway": 4,
        "being collected": 4,
    }

    for keyword, weight in completed_signals.items():
        if keyword in text:
            scores["Completed"] += weight
            evidence.append(f"completion indicator '{keyword}'")

    for keyword, weight in planned_signals.items():
        if keyword in text:
            scores["Planned"] += weight
            evidence.append(f"planning indicator '{keyword}'")

    for keyword, weight in active_signals.items():
        if keyword in text:
            scores["Active"] += weight
            evidence.append(f"active-trial indicator '{keyword}'")

    if crop_lower in ["strawberry", "blueberry", "blackberry", "raspberry"]:
        scores["Active"] += 1
        evidence.append("berry crop context supports active field monitoring")

    if "field" in location_lower:
        scores["Active"] += 1
        evidence.append("field-based location suggests live trial execution")

    if len(notes.split()) > 12:
        scores["Active"] += 1
        evidence.append("longer notes suggest ongoing trial observations")

    top_status = max(scores, key=scores.get)
    top_score = scores[top_status]
    second_score = sorted(scores.values(), reverse=True)[1]

    if top_score == 0:
        return {
            "recommended_status": "Active",
            "confidence": 55,
            "explanation": (
                "The notes do not strongly indicate a planned or completed state, "
                "so Active is the safest recommendation."
            ),
            "next_action": "Add more detailed trial observations to improve recommendation quality.",
        }

    margin = top_score - second_score
    confidence = min(95, 60 + (top_score * 5) + (margin * 5))

    short_evidence = ", ".join(evidence[:2]) if evidence else "general trial context"

    if top_status == "Completed":
        explanation = (
            f"The recommendation is Completed because the notes point to a finish-stage trial, "
            f"supported by {short_evidence}."
        )
        next_action = "Archive the trial, summarize results, and prepare final reporting."

    elif top_status == "Planned":
        explanation = (
            f"The recommendation is Planned because the notes suggest setup or future execution, "
            f"supported by {short_evidence}."
        )
        next_action = "Confirm readiness, finalize setup, and document the trial objective."

    else:
        explanation = (
            f"The recommendation is Active because the notes indicate the trial is underway, "
            f"supported by {short_evidence}."
        )
        next_action = "Continue monitoring observations, record updates, and review interventions if needed."

    return {
        "recommended_status": top_status,
        "confidence": confidence,
        "explanation": explanation,
        "next_action": next_action,
    }


@app.get("/", response_model=MessageResponse)
def root():
    return {"message": "Driscoll's R&D Platform API is running"}


@app.get("/trials", response_model=TrialListResponse)
def get_trials(db: Session = Depends(get_db)):
    trials = db.query(models.Trial).all()
    return {
        "trials": trials,
        "count": len(trials)
    }


@app.get("/trials/{trial_id}", response_model=TrialResponse)
def get_trial(trial_id: int, db: Session = Depends(get_db)):
    trial = db.query(models.Trial).filter(models.Trial.id == trial_id).first()

    if not trial:
        raise HTTPException(status_code=404, detail="Trial not found")

    return trial


@app.post("/trials", response_model=TrialCreateResponse)
def create_trial(trial: TrialCreate, db: Session = Depends(get_db)):
    db_trial = models.Trial(
        crop=trial.crop,
        variety=trial.variety,
        location=trial.location,
        objective=trial.objective,
        season=trial.season,
        status=trial.status.value,
        notes=trial.notes,
        ai_recommendation=trial.ai_recommendation,
        ai_next_action=trial.ai_next_action,
    )
    db.add(db_trial)
    db.commit()
    db.refresh(db_trial)

    return {
        "message": "Trial created successfully",
        "trial": db_trial
    }


@app.put("/trials/{trial_id}", response_model=TrialUpdateResponse)
def update_trial(trial_id: int, trial_data: TrialUpdate, db: Session = Depends(get_db)):
    trial = db.query(models.Trial).filter(models.Trial.id == trial_id).first()

    if not trial:
        raise HTTPException(status_code=404, detail="Trial not found")

    trial.crop = trial_data.crop
    trial.variety = trial_data.variety
    trial.location = trial_data.location
    trial.objective = trial_data.objective
    trial.season = trial_data.season
    trial.status = trial_data.status.value
    trial.notes = trial_data.notes
    trial.ai_recommendation = trial_data.ai_recommendation
    trial.ai_next_action = trial_data.ai_next_action

    db.commit()
    db.refresh(trial)

    return {
        "message": f"Trial {trial_id} updated successfully",
        "trial": trial
    }


@app.delete("/trials/{trial_id}", response_model=MessageResponse)
def delete_trial(trial_id: int, db: Session = Depends(get_db)):
    trial = db.query(models.Trial).filter(models.Trial.id == trial_id).first()

    if not trial:
        raise HTTPException(status_code=404, detail="Trial not found")

    db.delete(trial)
    db.commit()

    return {"message": f"Trial {trial_id} deleted successfully"}


@app.post("/ai/recommend-status", response_model=AIRecommendationResponse)
def ai_recommend_status(payload: AIRecommendationRequest):
    result = recommend_status(payload.crop, payload.location, payload.notes)
    return result