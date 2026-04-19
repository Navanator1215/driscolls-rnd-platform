from sqlalchemy import Column, Integer, String, Text
from database import Base


class Trial(Base):
    __tablename__ = "trials"

    id = Column(Integer, primary_key=True, index=True)
    crop = Column(String, nullable=False)
    variety = Column(String, nullable=True)
    location = Column(String, nullable=False)
    objective = Column(String, nullable=True)
    season = Column(String, nullable=True)
    status = Column(String, nullable=False)
    notes = Column(Text, nullable=True)
    ai_recommendation = Column(String, nullable=True)
    ai_next_action = Column(Text, nullable=True)