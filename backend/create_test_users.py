from app import create_app, db
from app.models import User, VendorProfile, BuyerProfile

app = create_app('development')

with app.app_context():
    # Clear existing test users
    User.query.filter(User.email.in_(['buyer@test.com', 'vendor@test.com', 'admin@test.com'])).delete(synchronize_session=False)
    db.session.commit()
    
    # Create test buyer
    buyer = User(
        email='buyer@test.com',
        phone='+254711111111',
        name='Test Buyer',
        role='buyer'
    )
    buyer.set_password('password123')
    db.session.add(buyer)
    db.session.flush()
    
    buyer_profile = BuyerProfile(
        user_id=buyer.id,
        delivery_address='123 Test Street, Nairobi'
    )
    db.session.add(buyer_profile)
    
    # Create test vendor
    vendor = User(
        email='vendor@test.com',
        phone='+254722222222',
        name='Test Vendor',
        role='vendor'
    )
    vendor.set_password('password123')
    db.session.add(vendor)
    db.session.flush()
    
    vendor_profile = VendorProfile(
        user_id=vendor.id,
        business_name='Mama Mboga Fresh',
        business_description='Fresh vegetables and fruits delivered to your doorstep',
        location='Westlands, Nairobi',
        offers_delivery=True,
        delivery_charge=50.0
    )
    db.session.add(vendor_profile)
    
    # Create test admin
    admin = User(
        email='admin@test.com',
        phone='+254733333333',
        name='Admin User',
        role='admin'
    )
    admin.set_password('password123')
    db.session.add(admin)
    
    db.session.commit()
    
    print("Test users created successfully!")
    print("\n=== Test Credentials ===")
    print("\nBuyer:")
    print("  Email: buyer@test.com")
    print("  Password: password123")
    print("\nVendor:")
    print("  Email: vendor@test.com")
    print("  Password: password123")
    print("\nAdmin:")
    print("  Email: admin@test.com")
    print("  Password: password123")
