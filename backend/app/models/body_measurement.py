from datetime import datetime, date, timezone
from app.extensions import db


class BodyMeasurement(db.Model):
    __tablename__ = "body_measurements"

    id = db.Column(db.Integer, primary_key=True)
    client_id = db.Column(
        db.Integer, db.ForeignKey("clients.id"), nullable=False, index=True
    )
    date = db.Column(db.Date, nullable=False, default=date.today)
    weight = db.Column(db.Float, nullable=True)   # kg
    chest = db.Column(db.Float, nullable=True)    # cm
    waist = db.Column(db.Float, nullable=True)    # cm
    hips = db.Column(db.Float, nullable=True)     # cm
    arm = db.Column(db.Float, nullable=True)      # cm (bicep)
    thigh = db.Column(db.Float, nullable=True)    # cm
    notes = db.Column(db.Text, nullable=True)
    created_at = db.Column(
        db.DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )

    # Relationships
    client = db.relationship(
        "Client",
        backref=db.backref("measurements", lazy="dynamic", cascade="all, delete-orphan"),
    )

    def to_dict(self):
        return {
            "id": self.id,
            "client_id": self.client_id,
            "date": self.date.isoformat() if self.date else None,
            "weight": self.weight,
            "chest": self.chest,
            "waist": self.waist,
            "hips": self.hips,
            "arm": self.arm,
            "thigh": self.thigh,
            "notes": self.notes,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }

    def __repr__(self):
        return (
            f"<BodyMeasurement id={self.id} client_id={self.client_id}"
            f" date={self.date} weight={self.weight}>"
        )
