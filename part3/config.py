import os


class Config:
    SECRET_KEY = os.getenv("SECRET_KEY", "default_secret_key")
    DEBUG = False

    # Demo accounts used by the application
    ADMIN_EMAIL = os.getenv("ADMIN_EMAIL", "admin@hbnb.io")
    ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "admin1234")

    DEMO_USER_EMAIL = os.getenv("DEMO_USER_EMAIL", "user@hbnb.io")
    DEMO_USER_PASSWORD = os.getenv("DEMO_USER_PASSWORD", "user1234")

    # On Render this reads DATABASE_URL from Neon.
    # Locally, it continues using the existing SQLite database.
    SQLALCHEMY_DATABASE_URI = os.getenv(
        "DATABASE_URL",
        "sqlite:///development.db"
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False


class DevelopmentConfig(Config):
    DEBUG = True


config = {
    "development": DevelopmentConfig,
    "default": DevelopmentConfig
}
