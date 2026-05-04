from sqlalchemy import Column, Date, Float, Integer, String, Time
from app.database import Base


class Donation(Base):
    __tablename__ = "donations"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), nullable=False)
    email = Column(String(255), nullable=True)
    contact_number = Column(String(25), nullable=True)
    amount = Column(Float, nullable=False)
    donation_date = Column(Date, nullable=False)
    donation_time = Column(Time, nullable=False)
