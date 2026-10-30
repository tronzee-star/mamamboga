from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.models import Product, VendorProfile, User, Category
from app import db

products_bp = Blueprint('products', __name__)

@products_bp.route('/', methods=['POST'])
@jwt_required()
def create_product():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    if not user or user.role != 'vendor':
        return jsonify({'error': 'Only vendors can create products'}), 403
    
    if not user.vendor_profile:
        return jsonify({'error': 'Vendor profile not found'}), 404
    
    data = request.get_json()
    
    # Validate required fields
    required_fields = ['name', 'price', 'unit']
    for field in required_fields:
        if field not in data:
            return jsonify({'error': f'{field} is required'}), 400
    
    # Create product
    product = Product(
        vendor_id=user.vendor_profile.id,
        category_id=data.get('category_id'),
        name=data['name'],
        description=data.get('description', ''),
        price=data['price'],
        unit=data['unit'],
        available_quantity=data.get('available_quantity', 0),
        image=data.get('image'),
        is_available=data.get('is_available', True),
        purchase_cost=data.get('purchase_cost')
    )
    
    db.session.add(product)
    db.session.commit()
    
    return jsonify({
        'message': 'Product created successfully',
        'product': product.to_dict()
    }), 201

@products_bp.route('/', methods=['GET'])
def get_products():
    # Get query parameters for filtering
    category_id = request.args.get('category_id')
    vendor_id = request.args.get('vendor_id')
    search = request.args.get('search')
    location = request.args.get('location')
    
    query = Product.query.filter_by(is_available=True)
    
    if category_id:
        query = query.filter_by(category_id=category_id)
    
    if vendor_id:
        query = query.filter_by(vendor_id=vendor_id)
    
    if search:
        query = query.filter(Product.name.ilike(f'%{search}%'))
    
    # If location is provided, filter by vendor location
    if location:
        query = query.join(VendorProfile).filter(
            VendorProfile.location.ilike(f'%{location}%')
        )
    
    products = query.all()
    
    return jsonify({
        'products': [product.to_dict() for product in products]
    }), 200

@products_bp.route('/<int:product_id>', methods=['GET'])
def get_product(product_id):
    product = Product.query.get(product_id)
    
    if not product:
        return jsonify({'error': 'Product not found'}), 404
    
    return jsonify(product.to_dict()), 200

@products_bp.route('/<int:product_id>', methods=['PUT'])
@jwt_required()
def update_product(product_id):
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    if not user or user.role != 'vendor':
        return jsonify({'error': 'Only vendors can update products'}), 403
    
    product = Product.query.get(product_id)
    
    if not product:
        return jsonify({'error': 'Product not found'}), 404
    
    # Check if product belongs to the vendor
    if product.vendor_id != user.vendor_profile.id:
        return jsonify({'error': 'You can only update your own products'}), 403
    
    data = request.get_json()
    
    if 'name' in data:
        product.name = data['name']
    if 'description' in data:
        product.description = data['description']
    if 'price' in data:
        product.price = data['price']
    if 'unit' in data:
        product.unit = data['unit']
    if 'available_quantity' in data:
        product.available_quantity = data['available_quantity']
    if 'image' in data:
        product.image = data['image']
    if 'is_available' in data:
        product.is_available = data['is_available']
    if 'purchase_cost' in data:
        product.purchase_cost = data['purchase_cost']
    
    db.session.commit()
    
    return jsonify({
        'message': 'Product updated successfully',
        'product': product.to_dict()
    }), 200

@products_bp.route('/<int:product_id>', methods=['DELETE'])
@jwt_required()
def delete_product(product_id):
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    if not user or user.role != 'vendor':
        return jsonify({'error': 'Only vendors can delete products'}), 403
    
    product = Product.query.get(product_id)
    
    if not product:
        return jsonify({'error': 'Product not found'}), 404
    
    # Check if product belongs to the vendor
    if product.vendor_id != user.vendor_profile.id:
        return jsonify({'error': 'You can only delete your own products'}), 403
    
    db.session.delete(product)
    db.session.commit()
    
    return jsonify({'message': 'Product deleted successfully'}), 200

@products_bp.route('/categories', methods=['GET'])
def get_categories():
    categories = Category.query.all()
    
    return jsonify({
        'categories': [category.to_dict() for category in categories]
    }), 200

@products_bp.route('/categories', methods=['POST'])
@jwt_required()
def create_category():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    if not user or user.role != 'admin':
        return jsonify({'error': 'Only admins can create categories'}), 403
    
    data = request.get_json()
    
    if 'name' not in data:
        return jsonify({'error': 'Category name is required'}), 400
    
    category = Category(
        name=data['name'],
        description=data.get('description', '')
    )
    
    db.session.add(category)
    db.session.commit()
    
    return jsonify({
        'message': 'Category created successfully',
        'category': category.to_dict()
    }), 201
