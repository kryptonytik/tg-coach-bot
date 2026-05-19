from datetime import datetime, timezone
from app.extensions import db


class Questionnaire(db.Model):
    __tablename__ = "questionnaires"

    id = db.Column(db.Integer, primary_key=True)
    client_id = db.Column(
        db.Integer,
        db.ForeignKey("clients.id"),
        unique=True,
        nullable=False,
        index=True,
    )

    # Training history
    had_training_before = db.Column(db.Boolean, nullable=True)
    previous_sports = db.Column(db.Text, nullable=True)
    time_since_last_workout = db.Column(db.String(128), nullable=True)

    # Health & limitations
    physical_limitations = db.Column(db.Text, nullable=True)
    joint_pain = db.Column(db.Text, nullable=True)          # knees / elbows
    pressure_issues = db.Column(db.Text, nullable=True)
    surgeries = db.Column(db.Text, nullable=True)
    congenital_conditions = db.Column(db.Text, nullable=True)
    gi_issues = db.Column(db.Text, nullable=True)           # ЖКТ
    spine_conditions = db.Column(db.Text, nullable=True)    # scoliosis etc
    chest_pain = db.Column(db.Text, nullable=True)

    # Supplements & fitness level
    supplements = db.Column(db.Text, nullable=True)
    fitness_level = db.Column(db.Integer, nullable=True)    # 1-10

    # Biometrics
    age = db.Column(db.Integer, nullable=True)
    height = db.Column(db.Float, nullable=True)             # cm
    weight = db.Column(db.Float, nullable=True)             # kg

    created_at = db.Column(
        db.DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )
    updated_at = db.Column(
        db.DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    # Relationship
    client = db.relationship("Client", back_populates="questionnaire")

    def to_dict(self):
        return {
            "id": self.id,
            "client_id": self.client_id,
            "had_training_before": self.had_training_before,
            "previous_sports": self.previous_sports,
            "time_since_last_workout": self.time_since_last_workout,
            "physical_limitations": self.physical_limitations,
            "joint_pain": self.joint_pain,
            "pressure_issues": self.pressure_issues,
            "surgeries": self.surgeries,
            "congenital_conditions": self.congenital_conditions,
            "gi_issues": self.gi_issues,
            "spine_conditions": self.spine_conditions,
            "chest_pain": self.chest_pain,
            "supplements": self.supplements,
            "fitness_level": self.fitness_level,
            "age": self.age,
            "height": self.height,
            "weight": self.weight,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }

    def __repr__(self):
        return f"<Questionnaire id={self.id} client_id={self.client_id}>"
