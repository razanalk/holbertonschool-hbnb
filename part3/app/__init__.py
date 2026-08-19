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
    """Ensure a default admin user exists."""
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


def get_or_create_review_user(first_name, email):
    """Create a sample reviewer only if it does not exist."""
    user = facade.get_user_by_email(email)

    if user:
        return user

    return facade.create_user(
        {
            "first_name": first_name,
            "last_name": "Reviewer",
            "email": email,
            "password": "reviewer1234",
        }
    )


def get_or_create_amenity(name):
    """Return an existing amenity or create it."""
    for amenity in facade.get_all_amenities():
        if amenity.name.lower() == name.lower():
            return amenity

    return facade.create_amenity({"name": name})


def seed_demo_content(app):
    """Create or update the public demo places and reviews."""
    owner = facade.get_user_by_email(app.config["ADMIN_EMAIL"])
    demo_user = facade.get_user_by_email(app.config["DEMO_USER_EMAIL"])

    if not owner or not demo_user:
        return

    reviewers = {
        "Ali": get_or_create_review_user("Ali", "ali.review@hbnb.io"),
        "Najla": get_or_create_review_user("Najla", "najla.review@hbnb.io"),
        "Layan": get_or_create_review_user("Layan", "layan.review@hbnb.io"),
        "Omar": get_or_create_review_user("Omar", "omar.review@hbnb.io"),
    }

    amenity_names = [
        "Wi-Fi",
        "Private parking",
        "Private courtyard",
        "Comfortable bedroom",
        "Traditional Najdi seating",
        "Modern kitchen",
        "Outdoor seating",
    ]

    amenities = {
        name: get_or_create_amenity(name).id
        for name in amenity_names
    }

    listings = [
        {
            "title": "Najdi Heritage Stay",
            "description": (
                "A traditional Najdi chalet with a warm private courtyard, "
                "heritage-inspired details, and a peaceful atmosphere."
            ),
            "price": 10,
            "latitude": 24.7136,
            "longitude": 46.6753,
            "amenities": [
                amenities["Private courtyard"],
                amenities["Comfortable bedroom"],
                amenities["Wi-Fi"],
                amenities["Private parking"],
                amenities["Traditional Najdi seating"],
            ],
        },
        {
            "title": "Riyadh Heritage Stay",
            "description": (
                "A modern stay inspired by the traditional architecture "
                "of Riyadh, combining local character with modern comfort."
            ),
            "price": 50,
            "latitude": 24.7200,
            "longitude": 46.6800,
            "amenities": [
                amenities["Outdoor seating"],
                amenities["Comfortable bedroom"],
                amenities["Wi-Fi"],
                amenities["Private parking"],
                amenities["Modern kitchen"],
            ],
        },
        {
            "title": "Najdi Courtyard House",
            "description": (
                "A charming courtyard house inspired by traditional Najdi "
                "homes, ideal for a relaxing and memorable stay."
            ),
            "price": 100,
            "latitude": 24.7000,
            "longitude": 46.6500,
            "amenities": [
                amenities["Private courtyard"],
                amenities["Traditional Najdi seating"],
                amenities["Comfortable bedroom"],
                amenities["Wi-Fi"],
                amenities["Private parking"],
            ],
        },
    ]

    places_by_title = {
        place.title: place
        for place in facade.get_all_places()
    }

    for listing in listings:
        existing_place = places_by_title.get(listing["title"])

        if existing_place:
            facade.update_place(existing_place.id, listing)
        else:
            place_data = listing.copy()
            place_data["owner_id"] = owner.id
            facade.create_place(place_data)

    old_demo_review_texts = {
        (
            "Beautiful place with a peaceful atmosphere. "
            "The Najdi design makes the stay feel special."
        ),
        (
            "A clean, comfortable stay with lovely traditional details "
            "and a great location."
        ),
        (
            "The courtyard was my favorite part of the stay. "
            "Very peaceful and beautifully designed."
        ),
    }

    for review in facade.get_all_reviews():
        if (
            review.user_id == demo_user.id
            and review.text in old_demo_review_texts
        ):
            facade.delete_review(review.id)

    reviews = [
        {
            "title": "Najdi Heritage Stay",
            "reviewer": "Ali",
            "text": (
                "Beautiful place with a peaceful atmosphere. "
                "The Najdi design makes the stay feel special."
            ),
            "rating": 5,
        },
        {
            "title": "Najdi Heritage Stay",
            "reviewer": "Najla",
            "text": (
                "I loved the traditional details and the private courtyard. "
                "It felt peaceful and welcoming."
            ),
            "rating": 5,
        },
        {
            "title": "Riyadh Heritage Stay",
            "reviewer": "Layan",
            "text": (
                "A clean, comfortable stay with lovely traditional details "
                "and a great location."
            ),
            "rating": 5,
        },
        {
            "title": "Najdi Courtyard House",
            "reviewer": "Omar",
            "text": (
                "The courtyard was my favorite part of the stay. "
                "Very peaceful and beautifully designed."
            ),
            "rating": 5,
        },
    ]

    all_reviews = facade.get_all_reviews()

    for review_data in reviews:
        place = next(
            (
                item for item in facade.get_all_places()
                if item.title == review_data["title"]
            ),
            None,
        )

        reviewer = reviewers[review_data["reviewer"]]

        if not place:
            continue

        already_exists = any(
            review.user_id == reviewer.id
            and review.place_id == place.id
            for review in all_reviews
        )

        if not already_exists:
            new_review = facade.create_review(
                {
                    "text": review_data["text"],
                    "rating": review_data["rating"],
                    "place_id": place.id,
                    "user_id": reviewer.id,
                }
            )

            all_reviews.append(new_review)


def create_app(config_class=DevelopmentConfig):
    app = Flask(__name__)
    app.config.from_object(config_class)

    CORS(app)

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
        seed_demo_content(app)

    return app
