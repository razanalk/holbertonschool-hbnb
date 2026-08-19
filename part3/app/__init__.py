from flask import Flask
from flask_cors import CORS
from flask_restx import Api
from flask_bcrypt import Bcrypt
from flask_jwt_extended import JWTManager
from flask_sqlalchemy import SQLAlchemy
from config import DevelopmentConfig

bcrypt = Bcrypt()
jwt = JWTManager()
db = SQLAlchemy()

from app.api.v1.users import api as users_ns
from app.api.v1.amenities import api as amenities_ns
from app.api.v1.places import api as places_ns
from app.api.v1.reviews import api as reviews_ns
from app.api.v1.auth import api as auth_ns
from app.services import facade


def seed_admin(app):
    """Ensure a default admin user exists.

    is_admin is never settable through the public API, so without
    this there would be no way to ever obtain an admin JWT to test
    (or use) the admin-only endpoints. Runs once at startup; on
    later startups the email lookup below finds the row already
    committed from a previous run and returns early.
    """
    email = app.config["ADMIN_EMAIL"]
    if facade.get_user_by_email(email):
        return

    facade.create_user(
        {
            "first_name": "Admin",
            "last_name": "User",
            "email": email,
            "password": app.config["ADMIN_PASSWORD"],
        },
        is_admin=True,
    )

def seed_demo_user(app):
    """Ensure a normal demo user exists."""
    email = app.config["DEMO_USER_EMAIL"]

    if facade.get_user_by_email(email):
        return

    facade.create_user(
        {
            "first_name": "Demo",
            "last_name": "User",
            "email": email,
            "password": app.config["DEMO_USER_PASSWORD"],
        }
    )

def create_app(config_class=DevelopmentConfig):
    app = Flask(__name__)
    app.config.from_object(config_class)

    CORS(app)

    # Use Flask SECRET_KEY for JWT
    app.config["JWT_SECRET_KEY"] = app.config["SECRET_KEY"]

    bcrypt.init_app(app)
    jwt.init_app(app)
    db.init_app(app)

    api = Api(
        app,
        version="1.0",
        title="HBnB API",
        description="HBnB Application API",
        doc="/api/v1/"
    )

    api.add_namespace(users_ns, path="/api/v1/users")
    api.add_namespace(amenities_ns, path="/api/v1/amenities")
    api.add_namespace(places_ns, path="/api/v1/places")
    api.add_namespace(reviews_ns, path="/api/v1/reviews")
    api.add_namespace(auth_ns, path="/api/v1/auth")

    with app.app_context():
        db.create_all()
        seed_admin(app)
        seed_demo_user(app)
    return app
