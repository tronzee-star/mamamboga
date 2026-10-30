# Mboga Connect

Your neighbourhood market, now online.

A digital marketplace built for Kenyan vendors, households and local fresh-produce businesses.

## Project Overview

Mboga Connect connects small-scale vegetable vendors (mama mboga) directly with customers within their local communities. The platform allows vendors to establish and manage their businesses online without necessarily owning or renting a physical shop.

## Tech Stack

- **Frontend**: React.js + Tailwind CSS
- **Backend**: Python Flask
- **Database**: PostgreSQL
- **Authentication**: Flask-JWT-Extended
- **Real-time Communication**: Flask-SocketIO
- **ORM**: Flask-SQLAlchemy
- **Migrations**: Flask-Migrate

## Project Structure

```
mama mboga/
├── backend/              # Flask backend
│   ├── app/
│   │   ├── models/      # Database models
│   │   ├── routes/      # API endpoints
│   │   ├── services/    # Business logic
│   │   └── utils/       # Utilities
│   ├── migrations/      # Database migrations
│   ├── config.py        # Configuration
│   └── run.py           # Entry point
├── frontend/            # React frontend
│   ├── src/
│   │   ├── components/  # Reusable components
│   │   ├── pages/       # Page components
│   │   ├── services/    # API services
│   │   └── utils/       # Utilities
│   └── public/
└── README.md
```

## Getting Started

### Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
python run.py
```

### Frontend Setup

```bash
cd frontend
npm install
npm start
```

## MVP Features

### Phase 1: Core MVP
- User registration and login
- Buyer and vendor account roles
- Vendor business profiles and locations
- Product listing and management
- Buyer marketplace and product search
- Location-based vendor discovery
- Shopping cart and checkout
- Order placement and management
- Vendor sales dashboard
- Basic inventory tracking
- Buyer-vendor messaging
- Delivery and collection options
- Basic ratings and reviews
- Administrator dashboard

## License

MIT
