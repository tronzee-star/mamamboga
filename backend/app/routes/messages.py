from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.models import Message, User
from app import db

messages_bp = Blueprint('messages', __name__)

@messages_bp.route('/', methods=['POST'])
@jwt_required()
def send_message():
    user_id = get_jwt_identity()
    sender = User.query.get(user_id)
    
    if not sender:
        return jsonify({'error': 'User not found'}), 4
    
    data = request.get_json()
    
    # Validate required fields
    if 'receiver_id' not in data or 'content' not in data:
        return jsonify({'error': 'receiver_id and content are required'}), 400
    
    # Verify receiver exists
    receiver = User.query.get(data['receiver_id'])
    if not receiver:
        return jsonify({'error': 'Receiver not found'}), 404
    
    # Create message
    message = Message(
        sender_id=user_id,
        receiver_id=data['receiver_id'],
        order_id=data.get('order_id'),
        content=data['content']
    )
    
    db.session.add(message)
    db.session.commit()
    
    return jsonify({
        'message': 'Message sent successfully',
        'data': message.to_dict()
    }), 201

@messages_bp.route('/conversations/<int:other_user_id>', methods=['GET'])
@jwt_required()
def get_conversation(other_user_id):
    user_id = get_jwt_identity()
    
    # Verify other user exists
    other_user = User.query.get(other_user_id)
    if not other_user:
        return jsonify({'error': 'User not found'}), 404
    
    # Get messages between the two users
    messages = Message.query.filter(
        ((Message.sender_id == user_id) & (Message.receiver_id == other_user_id)) |
        ((Message.sender_id == other_user_id) & (Message.receiver_id == user_id))
    ).order_by(Message.created_at.asc()).all()
    
    # Mark received messages as read
    Message.query.filter_by(
        sender_id=other_user_id,
        receiver_id=user_id,
        is_read=False
    ).update({'is_read': True})
    db.session.commit()
    
    return jsonify({
        'messages': [message.to_dict() for message in messages]
    }), 200

@messages_bp.route('/conversations', methods=['GET'])
@jwt_required()
def get_conversations():
    user_id = get_jwt_identity()
    
    # Get all users the current user has conversations with
    sent_messages = Message.query.filter_by(sender_id=user_id).all()
    received_messages = Message.query.filter_by(receiver_id=user_id).all()
    
    user_ids = set()
    for msg in sent_messages:
        user_ids.add(msg.receiver_id)
    for msg in received_messages:
        user_ids.add(msg.sender_id)
    
    # Get user details for each conversation
    conversations = []
    for other_user_id in user_ids:
        other_user = User.query.get(other_user_id)
        if other_user:
            # Get last message
            last_message = Message.query.filter(
                ((Message.sender_id == user_id) & (Message.receiver_id == other_user_id)) |
                ((Message.sender_id == other_user_id) & (Message.receiver_id == user_id))
            ).order_by(Message.created_at.desc()).first()
            
            # Count unread messages
            unread_count = Message.query.filter_by(
                sender_id=other_user_id,
                receiver_id=user_id,
                is_read=False
            ).count()
            
            conversations.append({
                'user': other_user.to_dict(),
                'last_message': last_message.to_dict() if last_message else None,
                'unread_count': unread_count
            })
    
    # Sort by last message time
    conversations.sort(key=lambda x: x['last_message']['created_at'] if x['last_message'] else '', reverse=True)
    
    return jsonify({
        'conversations': conversations
    }), 200

@messages_bp.route('/<int:message_id>/read', methods=['PUT'])
@jwt_required()
def mark_message_read(message_id):
    user_id = get_jwt_identity()
    
    message = Message.query.get(message_id)
    
    if not message:
        return jsonify({'error': 'Message not found'}), 404
    
    # Only receiver can mark as read
    if message.receiver_id != user_id:
        return jsonify({'error': 'Access denied'}), 403
    
    message.is_read = True
    db.session.commit()
    
    return jsonify({
        'message': 'Message marked as read',
        'data': message.to_dict()
    }), 200
