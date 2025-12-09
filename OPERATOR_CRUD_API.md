# Operator CRUD API Endpoints

## Admin Endpoints for Operator Management

### 1. Create Operator

**Admin creates a new operator account**

```http
POST /v1/operators
Authorization: Bearer <admin_token>
Content-Type: application/json

Body:
{
  "firstname": "John",
  "lastname": "Doe",
  "email": "operator@example.com",
  "phone": "1234567890",
  "country_code": "91",
  "password": "password123",
  "operator_business_name": "ABC Shuttle Services",
  "operator_license_number": "LIC123456",
  "operator_commission": 15,  // Commission percentage (optional, uses default if not provided)
  "company": "ABC Shuttle Services",
  "address_1": "123 Main Street",
  "address_2": "Suite 100",
  "city": "Mumbai",
  "pincode": "400001",
  "contact_no": "1234567890",
  "is_active": true,  // Optional: true = immediately active, false/undefined = pending
  "picture": "base64_image_or_url"  // Optional
}

Response (201 Created):
{
  "status": true,
  "message": "Operator created successfully.",
  "operator": {
    "_id": "...",
    "firstname": "John",
    "lastname": "Doe",
    "email": "operator@example.com",
    "role": "operator",
    "is_active": true
  }
}
```

**Features:**

- Admin can create operator and activate immediately (`is_active: true`)
- Or create as pending for later approval (`is_active: false`)
- Commission can be set per operator or uses default from settings
- Sends welcome email if created as active

---

### 2. Get Single Operator

**Get detailed information about a specific operator**

```http
GET /v1/operators/:operatorId
Authorization: Bearer <admin_token>

Response (200 OK):
{
  "status": true,
  "message": "Operator fetched successfully.",
  "data": {
    "_id": "...",
    "firstname": "John",
    "lastname": "Doe",
    "email": "operator@example.com",
    "phone": "1234567890",
    "role": "operator",
    "is_active": true,
    "operator_business_name": "ABC Shuttle Services",
    "operator_license_number": "LIC123456",
    "operator_commission": 15,
    "operator_status": "active",
    "operator_approved_at": "2025-12-09T10:30:00Z",
    "company": "ABC Shuttle Services",
    "address_1": "123 Main Street",
    "city": "Mumbai",
    "pincode": "400001",
    "stats": {
      "total_buses": 10,
      "total_drivers": 20,
      "total_schedules": 30,
      "total_bookings": 450,
      "earnings": {
        "pending": 50000,
        "processing": 10000,
        "completed": 200000,
        "failed": 0,
        "total": 260000,
        "available_for_payout": 50000
      }
    }
  }
}
```

**Features:**

- Returns complete operator profile
- Includes operator-specific details
- Shows real-time stats (buses, drivers, schedules, bookings)
- Includes earnings summary

---

### 3. Update Operator

**Update operator information**

```http
PUT /v1/operators/:operatorId
Authorization: Bearer <admin_token>
Content-Type: application/json

Body (all fields optional):
{
  "firstname": "John",
  "lastname": "Doe",
  "email": "newemail@example.com",
  "phone": "9876543210",
  "country_code": "91",
  "is_active": true,
  "operator_business_name": "ABC Shuttle Services Ltd",
  "operator_license_number": "LIC654321",
  "operator_commission": 20,  // Update commission percentage
  "operator_status": "active",  // pending|active|suspended|rejected
  "company": "ABC Shuttle Services Ltd",
  "address_1": "456 New Street",
  "address_2": "Floor 2",
  "city": "Delhi",
  "pincode": "110001",
  "contact_no": "9876543210",
  "picture": "base64_image_or_url"
}

Response (200 OK):
{
  "status": true,
  "message": "Operator updated successfully.",
  "operator": {
    "_id": "...",
    "firstname": "John",
    "lastname": "Doe",
    "email": "newemail@example.com",
    ...
  }
}
```

**Features:**

- All fields are optional - only send what needs to be updated
- Can update commission percentage
- Can change operator status
- If status changed to 'active', records approval timestamp and admin
- Supports image upload via multipart/form-data

---

### 4. List All Operators

**Get paginated list of all operators**

```http
GET /v1/operators?page=1&limit=10&operator_status=active
Authorization: Bearer <admin_token>

Query Parameters:
- page: number (default: 1)
- limit: number (default: 10)
- search: string (searches name, email, phone)
- operator_status: pending|active|suspended|rejected
- status: boolean (is_active filter)
- sortBy: string (field name)
- sortDesc: asc|desc
- createdAt: [startDate, endDate]

Response (200 OK):
{
  "items": [
    {
      "ids": "...",
      "firstname": "John",
      "lastname": "Doe",
      "fullname": "John Doe",
      "email": "operator@example.com",
      "phone": "1234567890",
      "role": "operator",
      "is_active": true,
      "operator_business_name": "ABC Shuttle Services",
      "operator_license_number": "LIC123456",
      "operator_status": "active",
      "operator_commission": 15,
      "operator_approved_at": "2025-12-09T10:30:00Z",
      "createdAt": "2025-12-01T08:00:00Z"
    }
  ],
  "totalRecords": 50,
  "page": 1,
  "limit": 10,
  "totalPages": 5
}
```

---

### 5. Approve Operator

**Approve a pending operator**

```http
POST /v1/operators/:operatorId/approve
Authorization: Bearer <admin_token>
Content-Type: application/json

Body (optional):
{
  "commission_percentage": 15  // Optional: override default commission
}

Response (200 OK):
{
  "status": true,
  "message": "Operator approved successfully"
}
```

**Features:**

- Sets `is_active: true`
- Sets `operator_status: 'active'`
- Records approval timestamp and admin who approved
- Sends approval email to operator
- Can optionally set custom commission percentage

---

### 6. Reject Operator

**Reject a pending operator application**

```http
POST /v1/operators/:operatorId/reject
Authorization: Bearer <admin_token>
Content-Type: application/json

Body:
{
  "rejection_reason": "Incomplete documentation"
}

Response (200 OK):
{
  "status": true,
  "message": "Operator rejected"
}
```

**Features:**

- Sets `operator_status: 'rejected'`
- Records rejection reason
- Sends rejection email to operator

---

### 7. Suspend Operator

**Suspend an active operator**

```http
POST /v1/operators/:operatorId/suspend
Authorization: Bearer <admin_token>

Response (200 OK):
{
  "status": true,
  "message": "Operator suspended successfully"
}
```

**Features:**

- Sets `is_active: false`
- Sets `operator_status: 'suspended'`
- Operator cannot login while suspended

---

## Comparison: Create vs Register

### `POST /operators/register` (Public - Self Registration)

- **Who**: Anyone (public endpoint)
- **Purpose**: Operator self-registration
- **Status**: Always creates as `pending` and `is_active: false`
- **Approval**: Requires admin approval
- **Email**: Sends "Registration Received" email

### `POST /operators` (Admin - Create)

- **Who**: Admin only
- **Purpose**: Admin creates operator account
- **Status**: Can create as `active` immediately or `pending`
- **Approval**: Can be pre-approved by admin
- **Email**: Sends "Welcome" email if created as active

---

## Usage Examples

### Example 1: Admin Creates Active Operator

```javascript
// Admin creates operator that's immediately active
POST /v1/operators
{
  "firstname": "Jane",
  "lastname": "Smith",
  "email": "jane@shuttles.com",
  "phone": "9876543210",
  "operator_business_name": "Jane's Shuttles",
  "operator_license_number": "LIC999",
  "operator_commission": 12,
  "is_active": true  // ← Immediately active
}

// Result: Operator can login immediately
```

### Example 2: Admin Creates Pending Operator

```javascript
// Admin creates operator for later approval
POST /v1/operators
{
  "firstname": "Bob",
  "lastname": "Johnson",
  "email": "bob@transport.com",
  "phone": "5555555555",
  "operator_business_name": "Bob's Transport",
  "operator_license_number": "LIC888",
  "is_active": false  // ← Pending approval
}

// Later, admin approves:
POST /v1/operators/:operatorId/approve
{
  "commission_percentage": 18
}
```

### Example 3: Update Operator Commission

```javascript
// Admin adjusts operator's commission rate
PUT /v1/operators/:operatorId
{
  "operator_commission": 25  // Increase to 25%
}

// All future bookings will use new commission rate
```

### Example 4: Get Operator with Stats

```javascript
// Admin views operator details
GET /v1/operators/:operatorId

// Response includes:
// - Profile info
// - Business details
// - Stats (buses, drivers, schedules, bookings)
// - Earnings summary
```

---

## Error Responses

### 404 Not Found

```json
{
  "status": false,
  "message": "Operator not found"
}
```

### 409 Conflict

```json
{
  "status": false,
  "message": "Email already registered"
}
```

### 403 Forbidden

```json
{
  "status": false,
  "message": "Access denied. Admin privileges required."
}
```

---

## Complete Operator Lifecycle

```
1. CREATE (Admin)
   POST /operators
   ↓
   Status: pending or active

2. APPROVE (if pending)
   POST /operators/:id/approve
   ↓
   Status: active, is_active: true

3. MANAGE
   PUT /operators/:id
   ↓
   Update details, commission, etc.

4. SUSPEND (if needed)
   POST /operators/:id/suspend
   ↓
   Status: suspended, is_active: false

5. REACTIVATE
   PUT /operators/:id
   { "is_active": true, "operator_status": "active" }
```

---

## Testing with cURL

### Create Operator

```bash
curl -X POST http://localhost:3000/v1/operators \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "firstname": "Test",
    "lastname": "Operator",
    "email": "test@operator.com",
    "phone": "1234567890",
    "operator_business_name": "Test Shuttles",
    "operator_license_number": "TEST123",
    "operator_commission": 15,
    "is_active": true
  }'
```

### Get Operator

```bash
curl -X GET http://localhost:3000/v1/operators/OPERATOR_ID \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

### Update Operator

```bash
curl -X PUT http://localhost:3000/v1/operators/OPERATOR_ID \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "operator_commission": 20,
    "operator_status": "active"
  }'
```

---

## Summary

✅ **3 New Admin Endpoints:**

- `POST /operators` - Create operator
- `GET /operators/:operatorId` - Get single operator
- `PUT /operators/:operatorId` - Update operator

✅ **Features:**

- Full CRUD operations for operators
- Flexible activation (immediate or pending)
- Commission management
- Status management
- Complete operator stats
- Email notifications
