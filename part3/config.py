import os


class Config:
    SECRET_KEY = os.getenv("SECRET_KEY", "default_secret_key")
    DEBUG = False

    # is_admin can't be set through the public API (see
    # HBnBFacade.create_user), and storage is in-memory, so there is
    # no way to obtain an admin JWT without a seeded admin account.
    # These credentials are for local/dev use only -- override them
    # via env vars for anything resembling a real deployment.
    ADMIN_EMAIL = os.getenv("ADMIN_EMAIL", "admin@hbnb.io")
    ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "admin1234")
    DEMO_USER_EMAIL = os.getenv("DEMO_USER_EMAIL", "user@hbnb.io")
    DEMO_USER_PASSWORD = os.getenv("DEMO_USER_PASSWORD", "user1234")

class DevelopmentConfig(Config):
    DEBUG = True
    SQLALCHEMY_DATABASE_URI = 'sqlite:///development.db'
    SQLALCHEMY_TRACK_MODIFICATIONS = False


config = {
    "development": DevelopmentConfig,
    "default": DevelopmentConfig
}
