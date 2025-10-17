# CircleChain Wallet Backend Implementation

This document describes the wallet functionality that has been implemented to connect the frontend to a proper backend API.

## What's Been Fixed/Added

### 1. Backend Wallet Implementation

#### New Models & Schemas
- **User Model**: Added `wallet_balance` field with default 1000 ECT tokens
- **Transaction Model**: Enhanced with proper wallet transaction logging
- **Wallet Schemas**: Comprehensive Pydantic schemas for API requests/responses

#### New API Endpoints (`/wallet/`)
- `GET /wallet/balance` - Get user's current wallet balance
- `POST /wallet/payment` - Process payment transactions
- `POST /wallet/reward` - Process reward transactions  
- `POST /wallet/recycling-reward` - Process recycling-based rewards
- `GET /wallet/transactions` - Get transaction history
- `GET /wallet/summary` - Get complete wallet summary
- `GET /wallet/health` - Health check endpoint

#### Wallet Service Layer
- `WalletService` class with comprehensive business logic
- Balance validation and updates
- Transaction recording with proper error handling
- Recycling reward calculations based on material type

### 2. Frontend Integration

#### Updated BlockchainContext
- Replaced localStorage simulation with real API calls
- Proper error handling and loading states
- Automatic token-based authentication
- Real-time balance and transaction updates

#### API Client Setup
- Axios configuration with automatic token inclusion
- Proper error handling for backend connectivity issues
- Environment-based API URL configuration

### 3. Infrastructure Improvements

#### Enhanced CORS Configuration
- Proper origins for development environment
- Specific methods and headers allowed
- Credentials support enabled

#### Global Error Handling
- Comprehensive exception handlers
- Proper logging configuration
- Structured error responses

## Setup Instructions

### 1. Backend Setup

```bash
# Navigate to backend directory
cd circlechain.backend

# Activate virtual environment
source venv/bin/activate

# Start the backend server
./start_backend.sh
# Or manually:
python main.py
```

The backend will be available at: http://localhost:8000
API documentation: http://localhost:8000/docs

### 2. Frontend Setup

```bash
# Navigate to frontend directory  
cd circlechain.frontend

# Install dependencies (if needed)
npm install

# Start the frontend
./start_frontend.sh
# Or manually with API URL:
REACT_APP_API_URL=http://localhost:8000 npm start
```

The frontend will be available at: http://localhost:3000

### 3. Database Migration (Optional)

If you need to update the database schema:

```bash
cd circlechain.backend
source venv/bin/activate

# Generate migration for wallet_balance column
alembic revision --autogenerate -m "Add wallet balance"

# Apply migration
alembic upgrade head
```

## API Usage Examples

### Authentication Required
All wallet endpoints require authentication. Include the JWT token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

### Get Wallet Balance
```bash
curl -X GET "http://localhost:8000/wallet/balance" \
  -H "Authorization: Bearer <token>"
```

### Process Payment
```bash
curl -X POST "http://localhost:8000/wallet/payment" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "product_name": "Eco Bottle",
    "amount": 25.0,
    "product_id": 123
  }'
```

### Process Recycling Reward
```bash
curl -X POST "http://localhost:8000/wallet/recycling-reward" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "material_type": "plastic",
    "quantity": 5.0
  }'
```

## Frontend Integration

The frontend `BlockchainContext` now automatically:

1. Loads wallet data when user logs in
2. Processes payments through the backend API
3. Handles recycling rewards with proper calculations
4. Updates balance in real-time
5. Maintains transaction history from backend
6. Provides proper error handling and loading states

## Key Features

### Wallet Functionality
- ✅ Real-time balance updates
- ✅ Transaction history with backend persistence
- ✅ Payment processing with validation
- ✅ Recycling rewards with material-specific rates
- ✅ Error handling and insufficient balance checking

### Security & Reliability  
- ✅ JWT-based authentication
- ✅ Input validation with Pydantic
- ✅ Comprehensive error handling
- ✅ Database transaction safety
- ✅ CORS configuration for development

### User Experience
- ✅ Seamless frontend integration
- ✅ Loading states and error messages  
- ✅ Real-time balance updates
- ✅ Transaction history preservation
- ✅ Proper wallet initialization (1000 ECT starting balance)

## Testing the Integration

1. **Start Backend**: Run `./start_backend.sh`
2. **Start Frontend**: Run `./start_frontend.sh`  
3. **Register/Login**: Create account or login
4. **Check Balance**: Should show 1000 ECT initial balance
5. **Make Payment**: Try purchasing a product
6. **Get Reward**: Try recycling materials
7. **View History**: Check transaction history

## Troubleshooting

### Backend Issues
- **Module not found**: Ensure virtual environment is activated
- **Database errors**: Check PostgreSQL connection
- **Port conflicts**: Backend uses port 8000

### Frontend Issues
- **API errors**: Ensure backend is running on port 8000
- **CORS issues**: Check CORS configuration in main.py
- **Token errors**: Ensure proper authentication flow

### Common Problems
- **"Failed to load wallet data"**: Backend not running or authentication failed
- **"Payment processing failed"**: Check wallet balance and backend logs
- **CORS errors**: Verify frontend origin in CORS configuration

This implementation provides a robust, production-ready wallet system with proper backend connectivity and comprehensive error handling.