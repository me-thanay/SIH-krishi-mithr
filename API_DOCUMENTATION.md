# Krishi Mithr - API Documentation

## Database System Overview

The Krishi Mithr application uses a comprehensive database system built with Prisma ORM and SQLite. The system includes:

### Database Models

1. **User** - Core user information
2. **AgriculturalProfile** - Detailed farming profile
3. **Crop** - Crop information and specifications
4. **UserCrop** - User's crop cultivation records
5. **Subsidy** - Government subsidy information
6. **WeatherQuery** - Weather data queries
7. **MarketQuery** - Market price queries
8. **SoilAnalysis** - Soil analysis records
9. **CropAdvisory** - Crop advisory records
10. **VoiceQuery** - Voice interaction records

## Authentication Endpoints

### POST /api/auth/signup
Register a new user with agricultural profile.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe",
  "phone": "9876543210",
  "agriculturalProfile": {
    "farmSize": "5 acres",
    "crops": ["Rice", "Wheat"],
    "location": "Village Name",
    "state": "Maharashtra",
    "district": "Pune",
    "soilType": "Black Soil",
    "irrigationType": "Drip Irrigation",
    "farmingExperience": "5 years",
    "annualIncome": "₹2-5 lakhs",
    "governmentSchemes": ["PM-KISAN"]
  }
}
```

**Response:**
```json
{
  "success": true,
  "user": { ... },
  "message": "User created successfully"
}
```

### POST /api/auth/login
Authenticate user and get JWT token.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "user": { ... },
  "token": "jwt_token_here",
  "message": "Login successful"
}
```

### GET /api/auth/profile
Get user profile with agricultural data (requires authentication).

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "user_id",
    "email": "user@example.com",
    "name": "John Doe",
    "agriculturalProfile": { ... },
    "userCrops": [ ... ],
    "weatherQueries": [ ... ],
    "marketQueries": [ ... ]
  }
}
```

## Crop Management Endpoints

### GET /api/crops
Get all available crops with filtering options.

**Query Parameters:**
- `category` - Filter by crop category (cereal, vegetable, cash, etc.)
- `season` - Filter by season (kharif, rabi, zaid)
- `search` - Search by crop name
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 20)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "crop_id",
      "name": "Rice",
      "scientificName": "Oryza sativa",
      "category": "cereal",
      "season": "kharif",
      "duration": 120,
      "waterRequirement": "High",
      "soilType": "Clay, Loamy",
      "climate": "Tropical, Subtropical",
      "yieldPerAcre": "2000-4000 kg",
      "marketPrice": 25.50,
      "description": "Staple food crop grown in flooded fields"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "pages": 5
  }
}
```

### GET /api/crops/[id]
Get specific crop details.

### POST /api/crops
Create new crop (admin only).

### PUT /api/crops/[id]
Update crop information (admin only).

### DELETE /api/crops/[id]
Delete crop (admin only).

## User Crop Management

### GET /api/user/crops
Get user's crop cultivation records (requires authentication).

**Query Parameters:**
- `status` - Filter by status (planted, growing, harvested, failed)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "user_crop_id",
      "userId": "user_id",
      "cropId": "crop_id",
      "plantedDate": "2024-01-15T00:00:00.000Z",
      "harvestDate": null,
      "quantity": 2.5,
      "status": "growing",
      "notes": "Planted in field A",
      "crop": {
        "name": "Rice",
        "scientificName": "Oryza sativa",
        "category": "cereal"
      }
    }
  ]
}
```

### POST /api/user/crops
Add crop to user's farm (requires authentication).

**Request Body:**
```json
{
  "cropId": "crop_id",
  "plantedDate": "2024-01-15",
  "quantity": 2.5,
  "notes": "Planted in field A"
}
```

### PUT /api/user/crops/[id]
Update user crop record (requires authentication).

### DELETE /api/user/crops/[id]
Remove crop from user's farm (requires authentication).

## Subsidy Management

### GET /api/subsidies
Get all available subsidies with filtering.

**Query Parameters:**
- `category` - Filter by subsidy category
- `state` - Filter by state
- `district` - Filter by district
- `cropType` - Filter by crop type
- `search` - Search by subsidy name
- `page` - Page number
- `limit` - Items per page

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "subsidy_id",
      "name": "PM-KISAN Scheme",
      "description": "Direct income support to farmers",
      "eligibility": "{\"criteria\":[\"Landholding farmers\"],\"documents\":[\"Land records\"]}",
      "amount": "₹6000 per year",
      "category": "income_support",
      "state": null,
      "district": null,
      "cropType": null,
      "minFarmSize": "0.1 acres",
      "maxFarmSize": "2 acres",
      "validFrom": "2024-01-01T00:00:00.000Z",
      "validTo": "2024-12-31T00:00:00.000Z",
      "isActive": true
    }
  ],
  "pagination": { ... }
}
```

### GET /api/user/subsidies
Get subsidies relevant to user's profile (requires authentication).

**Response:**
```json
{
  "success": true,
  "data": [ ... ],
  "message": "Subsidies filtered based on your profile"
}
```

## User Profile Management

### GET /api/user/profile
Get user's agricultural profile (requires authentication).

### PUT /api/user/profile
Update user's profile and agricultural information (requires authentication).

**Request Body:**
```json
{
  "name": "Updated Name",
  "phone": "9876543210",
  "agriculturalProfile": {
    "farmSize": "10 acres",
    "crops": ["Rice", "Wheat", "Cotton"],
    "location": "Updated Village",
    "state": "Maharashtra",
    "district": "Pune",
    "soilType": "Black Soil",
    "irrigationType": "Sprinkler Irrigation",
    "farmingExperience": "10 years",
    "annualIncome": "₹5-10 lakhs",
    "governmentSchemes": ["PM-KISAN", "Soil Health Card"]
  }
}
```

## Error Handling

All endpoints return consistent error responses:

```json
{
  "error": "Error message",
  "success": false
}
```

Common HTTP status codes:
- `200` - Success
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (authentication required)
- `404` - Not Found
- `500` - Internal Server Error

## Authentication

Most endpoints require JWT authentication. Include the token in the Authorization header:

```
Authorization: Bearer <jwt_token>
```

Tokens expire after 7 days and need to be refreshed by logging in again.

## Database Seeding

The database comes pre-populated with:
- 8 common crops (Rice, Wheat, Maize, Tomato, Potato, Onion, Sugarcane, Cotton)
- 6 government subsidies (PM-KISAN, Soil Health Card, Crop Insurance, etc.)

To re-seed the database:
```bash
npm run db:seed
```

## Environment Variables

Required environment variables:
- `DATABASE_URL` - SQLite database file path
- `JWT_SECRET` - Secret key for JWT tokens
- `NODE_ENV` - Environment (development/production)

## Database Commands

```bash
# Generate Prisma client
npm run db:generate

# Push schema changes
npm run db:push

# Seed database
npm run db:seed
```
