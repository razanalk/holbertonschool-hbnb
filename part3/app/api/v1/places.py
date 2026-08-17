from flask_restx import Namespace, Resource, fields
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from app.services import facade

api = Namespace('places', description='Place operations')

# Define the models for related entities
amenity_model = api.model('PlaceAmenity', {
    'id': fields.Integer(description='Amenity ID'),
    'name': fields.String(description='Name of the amenity')
})

user_model = api.model('PlaceUser', {
    'id': fields.String(description='User ID'),
    'first_name': fields.String(description='First name of the owner'),
    'last_name': fields.String(description='Last name of the owner'),
    'email': fields.String(description='Email of the owner')
})

review_model = api.model('PlaceReview', {
    'id': fields.Integer(description='Review ID'),
    'text': fields.String(description='Text of the review'),
    'rating': fields.Integer(description='Rating of the place (1-5)'),
    'user_id': fields.String(description='ID of the user')
})

# owner_id is intentionally absent here: ownership is derived from
# the JWT identity in PlaceList.post(), not accepted from the client,
# so it must not be a required (or even accepted) input field.
place_model = api.model('Place', {
    'title': fields.String(
        required=True, description='Title of the place'
    ),
    'description': fields.String(description='Description of the place'),
    'price': fields.Float(required=True, description='Price per night'),
    'latitude': fields.Float(
        required=True, description='Latitude of the place'
    ),
    'longitude': fields.Float(
        required=True, description='Longitude of the place'
    ),
    'owner': fields.Nested(user_model, description='Owner of the place'),
    'amenities': fields.List(
        fields.Integer, required=False,
        description="List of amenities ID's"
    ),
    'reviews': fields.List(
        fields.Nested(review_model), description='List of reviews'
    ),
})

place_update_model = api.model('PlaceUpdate', {
    'title': fields.String(
        required=False, description='Title of the place'
    ),
    'description': fields.String(
        required=False, description='Description of the place'
    ),
    'price': fields.Float(required=False, description='Price per night'),
    'latitude': fields.Float(
        required=False, description='Latitude of the place'
    ),
    'longitude': fields.Float(
        required=False, description='Longitude of the place'
    ),
    'amenities': fields.List(
        fields.Integer, required=False,
        description="List of amenities ID's"
    ),
})

def place_summary(place):
    return {
        'id': place.id,
        'title': place.title,
        'description': place.description,
        'price': place.price,
        'latitude': place.latitude,
        'longitude': place.longitude,
    }

def place_created(place):
    return {
        'id': place.id,
        'title': place.title,
        'description': place.description,
        'price': place.price,
        'latitude': place.latitude,
        'longitude': place.longitude,
        'owner_id': place.owner_id,
    }


def serialize_place(place):
    """Build the full place representation for a single-place GET.

    place.owner/place.reviews are same-request-only convenience
    attributes (no db.ForeignKey/relationship() yet -- that's the
    next task), so a place fetched fresh in a later request won't
    have them. owner and reviews are instead looked up fresh through
    the facade by the persisted owner_id/place.id; amenities has no
    persisted association yet at all, so it's read from the
    in-memory attribute (only accurate within the request that
    created/updated it) until the relationships task adds the join
    table.
    """
    data = place.to_dict()

    owner = facade.get_user(place.owner_id)
    data['owner'] = {
        'id': owner.id,
        'first_name': owner.first_name,
        'last_name': owner.last_name,
        'email': owner.email,
    } if owner else None

    data['amenities'] = [
        {
            'id': a.id,
            'name': a.name
        }
        for a in getattr(place, 'amenities', [])
    ]

    data['reviews'] = [
        {
            'id': r.id,
            'text': r.text,
            'rating': r.rating,
            'user_id': r.user_id,
        }
        for r in facade.get_reviews_by_place(place.id)
    ]

    return data


@api.route('/')
class PlaceList(Resource):

    @jwt_required()
    @api.expect(place_model, validate=True)
    @api.response(201, 'Place successfully created')
    @api.response(400, 'Invalid input data')
    def post(self):
        """Register a new place"""

        current_user = get_jwt_identity()

        data = api.payload
        data["owner_id"] = current_user

        try:
            new_place = facade.create_place(data)
        except (ValueError, TypeError) as e:
            return {'error': str(e)}, 400

        return place_created(new_place), 201

    @api.response(200, 'List of places retrieved successfully')
    def get(self):
        """Retrieve a list of all places"""

        places = facade.get_all_places()

        return [place_summary(p) for p in places], 200


@api.route('/<int:place_id>')
class PlaceResource(Resource):

    @api.response(200, 'Place details retrieved successfully')
    @api.response(404, 'Place not found')
    def get(self, place_id):
        """Get place details by ID"""

        place = facade.get_place(place_id)

        if not place:
            return {'error': 'Place not found'}, 404

        return serialize_place(place), 200

    @jwt_required()
    @api.expect(place_update_model, validate=True)
    @api.response(200, 'Place updated successfully')
    @api.response(404, 'Place not found')
    @api.response(400, 'Invalid input data')
    def put(self, place_id):
        """Update a place's information"""

        place = facade.get_place(place_id)

        if not place:
            return {'error': 'Place not found'}, 404

        current_user = get_jwt_identity()
        is_admin = get_jwt().get('is_admin', False)

        if not is_admin and place.owner_id != current_user:
            return {"error": "Unauthorized action"}, 403

        try:
            facade.update_place(place_id, api.payload)
        except (ValueError, TypeError) as e:
            return {'error': str(e)}, 400

        return {'message': 'Place updated successfully'}, 200


@api.route('/<int:place_id>/reviews')
class PlaceReviewList(Resource):

    @api.response(200, 'List of reviews for the place retrieved successfully')
    @api.response(404, 'Place not found')
    def get(self, place_id):
        """Get all reviews for a specific place"""

        place = facade.get_place(place_id)

        if not place:
            return {'error': 'Place not found'}, 404

        reviews = facade.get_reviews_by_place(place_id)

        return [
            {
                'id': r.id,
                'text': r.text,
                'rating': r.rating
            }
            for r in reviews
        ], 200
