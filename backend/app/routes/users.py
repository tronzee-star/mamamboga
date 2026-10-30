from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.models import User, VendorProfile, BuyerProfile
from app import db

users_bp = Blueprint('users', __name__)

@users_bp.route('/profile', methods=['PUT'])
@jwt_required()
def update_profile():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    data = request.get_json()
    
    # Update user basic info
    if 'name' in data:
        user.name = data['name']
    if 'phone' in data:
        # Check if phone is already taken by another user
        existing = User.query.filter_by(phone=data['phone']).first()
        if existing and existing.id != user_id:
            return jsonify({'error': 'Phone number already in use'}), 400
        user.phone = data['phone']
    
    # Update role-specific profile
    if user.role == 'vendor' and user.vendor_profile:
        vendor_profile = user.vendor_profile
        
        if 'business_name' in data:
            vendor_profile.business_name = data['business_name']
        if 'business_description' in data:
            vendor_profile.business_description = data['business_description']
        if 'location' in data:
            vendor_profile.location = data['location']
        if 'latitude' in data:
            vendor_profile.latitude = data['latitude']
        if 'longitude' in data:
            vendor_profile.longitude = data['longitude']
        if 'profile_image' in data:
            vendor_profile.profile_image = data['profile_image']
        if 'is_available' in data:
            vendor_profile.is_available = data['is_available']
        if 'offers_delivery' in data:
            vendor_profile.offers_delivery = data['offers_delivery']
        if 'delivery_areas' in data:
            vendor_profile.delivery_areas = data['delivery_areas']
        if 'delivery_charge' in data:
            vendor_profile.delivery_charge = data['delivery_charge']
    
    elif user.role == 'buyer' and user.buyer_profile:
        buyer_profile = user.buyer_profile
        
        if 'delivery_address' in data:
            buyer_profile.delivery_address = data['delivery_address']
        if 'latitude' in data:
            buyer_profile.latitude = data['latitude']
        if 'longitude' in data:
            buyer_profile.longitude = data['longitude']
    
    db.session.commit()
    
    return jsonify({
        'message': 'Profile updated successfully',
        'user': user.to_dict()
    }), 200

@users_bp.route('/vendors', methods=['GET'])
def get_vendors():
    # Get query parameters for filtering
    location = request.args.get('location')
    is_available = request.args.get('is_available')
    
    query = VendorProfile.query
    
    if location:
        query = query.filter(VendorProfile.location.ilike(f'%{location}%'))
    
    if is_available == 'true':
        query = query.filter(VendorProfile.is_available == True)
    
    vendors = query.all()
    
    return jsonify({
        'vendors': [vendor.to_dict() for vendor in vendors]
    }), 200

@users_bp.route('/vendors/<int:vendor_id>', methods=['GET'])
def get_vendor_profile(vendor_id):
    vendor = VendorProfile.query.get(vendor_id)
    
    if not vendor:
        return jsonify({'error': 'Vendor not found'}), 404
    
    # Get vendor's products
    from app.models import Product
    products = Product.query.filter_by(vendor_id=vendor_id, is_available=True).all()
    
    vendor_data = vendor.to_dict()
    vendor_data['products'] = [product.to_dict() for product in products]
    
    return jsonify(vendor_data), 200
