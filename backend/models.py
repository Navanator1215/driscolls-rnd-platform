from sqlalchemy import Column, Integer, String
from database import Base

class Trial(Base):
    __tablename__ = "trials"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    crop = Column(String, index=True)
    location = Column(String, index=True)
    status = Column(String, index=True)