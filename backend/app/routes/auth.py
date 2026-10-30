from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from app.models import User, VendorProfile, BuyerProfile
from app import db

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    
    # Validate required fields
    required_fields = ['email', 'phone', 'password', 'name', 'role']
    for field in required_fields:
        if field not in data:
            return jsonify({'error': f'{field} is required'}), 400
    
    # Check if email or phone already exists
    if User.query.filter_by(email=data['email']).first():
        return jsonify({'error': 'Email already registered'}), 400
    
    if User.query.filter_by(phone=data['phone']).first():
        return jsonify({'error': 'Phone number already registered'}), 400
    
    # Validate role
    if data['role'] not in ['buyer', 'vendor']:
        return jsonify({'error': 'Invalid role. Must be buyer or vendor'}), 400
    
    # Create user
    user = User(
        email=data['email'],
        phone=data['phone'],
        name=data['name'],
        role=data['role']
    )
    user.set_password(data['password'])
    
    db.session.add(user)
    db.session.commit()
    
    # Create profile based on role
    if data['role'] == 'vendor':
        if 'business_name' not in data or 'location' not in data:
            db.session.rollback()
            return jsonify({'error': 'business_name and location are required for vendors'}), 400
        
        vendor_profile = VendorProfile(
            user_id=user.id,
            business_name=data['business_name'],
            business_description=data.get('business_description', ''),
            location=data['location'],
            latitude=data.get('latitude'),
            longitude=data.get('longitude'),
            offers_delivery=data.get('offers_delivery', False),
            delivery_charge=data.get('delivery_charge', 0.0)
        )
        db.session.add(vendor_profile)
    else:
        buyer_profile = BuyerProfile(
            user_id=user.id,
            delivery_address=data.get('delivery_address'),
            latitude=data.get('latitude'),
            longitude=data.get('longitude')
        )
        db.session.add(buyer_profile)
    
    db.session.commit()
    
    # Generate access token
    access_token = create_access_token(identity=user.id)
    
    return jsonify({
        'message': 'Registration successful',
        'access_token': access_token,
        'user': user.to_dict()
    }), 201

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    
    if 'email' not in data or 'password' not in data:
        return jsonify({'error': 'Email and password are required'}), 400
    
    user = User.query.filter_by(email=data['email']).first()
    
    if not user or not user.check_password(data['password']):
        return jsonify({'error': 'Invalid email or password'}), 401
    
    if not user.is_active:
        return jsonify({'error': 'Account is deactivated'}), 401
    
    access_token = create_access_token(identity=user.id)
    
    return jsonify({
        'message': 'Login successful',
        'access_token': access_token,
        'user': user.to_dict()
    }), 200

@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def get_current_user():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    response_data = user.to_dict()
    
    # Add profile data based on role
    if user.role == 'vendor' and user.vendor_profile:
        response_data['vendor_profile'] = user.vendor_profile.to_dict()
    elif user.role == 'buyer' and user.buyer_profile:
        response_data['buyer_profile'] = user.buyer_profile.to_dict()
    
    return jsonify(response_data), 200
