import hmac
import hashlib
import json
import time
import urllib.parse
from functools import wraps

from flask import request, jsonify, g, current_app
from app.extensions import db


def validate_telegram_init_data(init_data: str, bot_token: str):
    """
    Validate Telegram Mini App initData string.

    Returns parsed user dict if valid, None if invalid or expired (>24h).
    Reference: https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app
    """
    try:
        parsed = dict(urllib.parse.parse_qsl(init_data, keep_blank_values=True))
    except Exception:
        return None

    received_hash = parsed.pop("hash", None)
    if not received_hash:
        return None

    # Optionally reject stale data (24 hours)
    auth_date = parsed.get("auth_date")
    if auth_date:
        try:
            if time.time() - int(auth_date) > 86400:
                return None
        except (ValueError, TypeError):
            return None

    # Build data-check-string: sorted key=value pairs joined by \n
    data_check_string = "\n".join(
        f"{k}={v}" for k, v in sorted(parsed.items())
    )

    # Derive secret key: HMAC-SHA256("WebAppData", bot_token)
    secret_key = hmac.new(
        b"WebAppData", bot_token.encode(), hashlib.sha256
    ).digest()

    # Compute expected hash
    expected_hash = hmac.new(
        secret_key, data_check_string.encode(), hashlib.sha256
    ).hexdigest()


    if not hmac.compare_digest(expected_hash, received_hash):
        return None

    # Parse user JSON
    user_str = parsed.get("user")
    if not user_str:
        return None
    try:
        user_data = json.loads(user_str)
    except (json.JSONDecodeError, TypeError):
        return None

    return user_data


def _get_or_create_user(telegram_id: str, user_data: dict, role: str = "client"):
    """Fetch existing user or create a new one from Telegram data."""
    from app.models.user import User

    user = User.query.filter_by(telegram_id=str(telegram_id)).first()
    if user is None:
        user = User(
            telegram_id=str(telegram_id),
            username=user_data.get("username"),
            first_name=user_data.get("first_name", "Unknown"),
            last_name=user_data.get("last_name"),
            role=role,
        )
        db.session.add(user)
        db.session.commit()
    return user


def get_current_user():
    """
    Resolve the current user from the Authorization header.

    In DEV_MODE: ignores the token and returns (or auto-creates) a dev trainer.
    In production: validates Telegram initData and returns the matching User.

    Returns User or None.
    """
    from app.models.user import User

    dev_mode = current_app.config.get("DEV_MODE", False)

    if dev_mode:
        user = User.query.filter_by(telegram_id="dev_trainer").first()
        if user is None:
            user = User(
                telegram_id="dev_trainer",
                username="dev_trainer",
                first_name="Влад",
                last_name="(Dev)",
                role="trainer",
            )
            db.session.add(user)
            db.session.commit()
        return user

    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        return None

    init_data = auth_header[len("Bearer "):]
    bot_token = current_app.config.get("BOT_TOKEN", "")

    user_data = validate_telegram_init_data(init_data, bot_token)
    if user_data is None:
        return None

    telegram_id = user_data.get("id")
    if not telegram_id:
        return None

    user = User.query.filter_by(telegram_id=str(telegram_id)).first()
    if user is None:
        # Auto-register new client users on first login
        user = _get_or_create_user(str(telegram_id), user_data, role="client")

    return user


def auth_required(f):
    """Decorator: require any authenticated user."""
    @wraps(f)
    def decorated(*args, **kwargs):
        user = get_current_user()
        if user is None:
            return jsonify({"error": "Unauthorized"}), 401
        g.current_user = user
        return f(*args, **kwargs)
    return decorated


def trainer_required(f):
    """Decorator: require authenticated user with trainer role."""
    @wraps(f)
    def decorated(*args, **kwargs):
        user = get_current_user()
        if user is None:
            return jsonify({"error": "Unauthorized"}), 401
        if user.role != "trainer":
            return jsonify({"error": "Forbidden: trainer role required"}), 403
        g.current_user = user
        return f(*args, **kwargs)
    return decorated
