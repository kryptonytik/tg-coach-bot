from datetime import datetime, timezone
from app.extensions import db


class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    telegram_id = db.Column(db.String(64), unique=True, nullable=False, index=True)
    username = db.Column(db.String(128), nullable=True)
    telegram_username = db.Column(db.String(128), nullable=True)
    first_name = db.Column(db.String(128), nullable=False)
    last_name = db.Column(db.String(128), nullable=True)
    role = db.Column(db.String(16), nullable=False, default="client")  # 'trainer' or 'client'
    created_at = db.Column(
        db.DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )

    # Relationships (back-references defined on child models)
    # clients_as_trainer -> backref from Client.trainer
    # sessions_as_trainer -> backref from WorkoutSession.trainer

    def to_dict(self):
        return {
            "id": self.id,
            "telegram_id": self.telegram_id,
            "username": self.username,
            "telegram_username": self.telegram_username,
            "first_name": self.first_name,
            "last_name": self.last_name,
            "role": self.role,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }

    def __repr__(self):
        return f"<User id={self.id} telegram_id={self.telegram_id!r} role={self.role!r}>"
