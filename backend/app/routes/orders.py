from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.models import Order, OrderItem, Product, User, BuyerProfile, VendorProfile
from app import db

orders_bp = Blueprint('orders', __name__)

@orders_bp.route('/', methods=['POST'])
@jwt_required()
def create_order():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    if not user or user.role != 'buyer':
        return jsonify({'error': 'Only buyers can create orders'}), 403
    
    if not user.buyer_profile:
        return jsonify({'error': 'Buyer profile not found'}), 404
    
    data = request.get_json()
    
    # Validate required fields
    if 'vendor_id' not in data or 'items' not in data or 'delivery_option' not in data:
        return jsonify({'error': 'vendor_id, items, and delivery_option are required'}), 400
    
    if not data['items']:
        return jsonify({'error': 'Order must contain at least one item'}), 400
    
    # Verify vendor exists
    vendor = VendorProfile.query.get(data['vendor_id'])
    if not vendor:
        return jsonify({'error': 'Vendor not found'}), 404
    
    # Calculate total and validate items
    total_amount = 0.0
    order_items = []
    
    for item in data['items']:
        if 'product_id' not in item or 'quantity' not in item:
            return jsonify({'error': 'Each item must have product_id and quantity'}), 400
        
        product = Product.query.get(item['product_id'])
        if not product:
            return jsonify({'error': f'Product {item["product_id"]} not found'}), 404
        
        if product.vendor_id != vendor.id:
            return jsonify({'error': 'All products must be from the same vendor'}), 400
        
        if product.available_quantity < item['quantity']:
            return jsonify({'error': f'Insufficient quantity for {product.name}'}), 400
        
        subtotal = product.price * item['quantity']
        total_amount += subtotal
        
        order_items.append({
            'product_id': product.id,
            'quantity': item['quantity'],
            'price_at_order': product.price,
            'subtotal': subtotal
        })
    
    # Calculate delivery charge
    delivery_charge = 0.0
    if data['delivery_option'] == 'delivery' and vendor.offers_delivery:
        delivery_charge = vendor.delivery_charge
    
    total_amount += delivery_charge
    
    # Create order
    order = Order(
        buyer_id=user.buyer_profile.id,
        vendor_id=vendor.id,
        total_amount=total_amount,
        delivery_charge=delivery_charge,
        delivery_option=data['delivery_option'],
        delivery_address=data.get('delivery_address'),
        special_instructions=data.get('special_instructions'),
        payment_method=data.get('payment_method', 'cash'),
        status='new'
    )
    
    db.session.add(order)
    db.session.flush()  # Get order ID
    
    # Create order items
    for item_data in order_items:
        order_item = OrderItem(
            order_id=order.id,
            product_id=item_data['product_id'],
            quantity=item_data['quantity'],
            price_at_order=item_data['price_at_order'],
            subtotal=item_data['subtotal']
        )
        db.session.add(order_item)
        
        # Update product quantity
        product = Product.query.get(item_data['product_id'])
        product.available_quantity -= item_data['quantity']
    
    db.session.commit()
    
    return jsonify({
        'message': 'Order created successfully',
        'order': order.to_dict()
    }), 201

@orders_bp.route('/', methods=['GET'])
@jwt_required()
def get_orders():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    query = Order.query
    
    # Filter based on user role
    if user.role == 'buyer' and user.buyer_profile:
        query = query.filter_by(buyer_id=user.buyer_profile.id)
    elif user.role == 'vendor' and user.vendor_profile:
        query = query.filter_by(vendor_id=user.vendor_profile.id)
    else:
        return jsonify({'error': 'Invalid user role'}), 400
    
    # Get query parameters for filtering
    status = request.args.get('status')
    if status:
        query = query.filter_by(status=status)
    
    orders = query.order_by(Order.created_at.desc()).all()
    
    return jsonify({
        'orders': [order.to_dict() for order in orders]
    }), 200

@orders_bp.route('/<int:order_id>', methods=['GET'])
@jwt_required()
def get_order(order_id):
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    order = Order.query.get(order_id)
    
    if not order:
        return jsonify({'error': 'Order not found'}), 404
    
    # Check if user has access to this order
    if user.role == 'buyer' and order.buyer_id != user.buyer_profile.id:
        return jsonify({'error': 'Access denied'}), 403
    if user.role == 'vendor' and order.vendor_id != user.vendor_profile.id:
        return jsonify({'error': 'Access denied'}), 403
    
    # Get order items
    order_data = order.to_dict()
    order_data['items'] = [item.to_dict() for item in order.order_items]
    
    return jsonify(order_data), 200

@orders_bp.route('/<int:order_id>/status', methods=['PUT'])
@jwt_required()
def update_order_status(order_id):
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    if not user or user.role != 'vendor':
        return jsonify({'error': 'Only vendors can update order status'}), 403
    
    order = Order.query.get(order_id)
    
    if not order:
        return jsonify({'error': 'Order not found'}), 404
    
    if order.vendor_id != user.vendor_profile.id:
        return jsonify({'error': 'You can only update your own orders'}), 403
    
    data = request.get_json()
    
    if 'status' not in data:
        return jsonify({'error': 'Status is required'}), 400
    
    valid_statuses = ['new', 'accepted', 'preparing', 'ready', 'out_for_delivery', 'completed', 'cancelled']
    if data['status'] not in valid_statuses:
        return jsonify({'error': 'Invalid status'}), 400
    
    order.status = data['status']
    db.session.commit()
    
    return jsonify({
        'message': 'Order status updated successfully',
        'order': order.to_dict()
    }), 200
