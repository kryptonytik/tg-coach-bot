from app.routes.trainer import trainer_bp
from app.routes.clients import clients_bp
from app.routes.workouts import workouts_bp
from app.routes.exercises import exercises_bp


def register_blueprints(app):
    """Register all route blueprints with the Flask application."""
    app.register_blueprint(trainer_bp)
    app.register_blueprint(clients_bp)
    app.register_blueprint(workouts_bp)
    app.register_blueprint(exercises_bp)
