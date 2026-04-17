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
    location: str = Field(..., min_length=2, max_length=100)
    status: TrialStatus


class TrialUpdate(BaseModel):
    crop: str = Field(..., min_length=2, max_length=50)
    location: str = Field(..., min_length=2, max_length=100)
    status: TrialStatus


class TrialResponse(BaseModel):
    id: int
    crop: str
    location: str
    status: TrialStatus

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


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


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
        location=trial.location,
        status=trial.status.value
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
    trial.location = trial_data.location
    trial.status = trial_data.status.value

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