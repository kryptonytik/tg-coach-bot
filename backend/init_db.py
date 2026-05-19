"""Run once during Render build to create tables and seed data."""
import os
from dotenv import load_dotenv
load_dotenv()

from app import create_app
from app.extensions import db
from app.seed import run_seed

app = create_app()
with app.app_context():
    db.create_all()
    run_seed()
    print("DB initialized and seeded.")
