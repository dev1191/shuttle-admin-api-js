# Operator API Quick Reference

## Base URL

```
http://localhost:3000/v1
```

---

## Public Endpoints

### Register Operator

```http
POST /operators/register

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
  "company": "ABC Shuttle Services",
  "address_1": "123 Main Street",
  "address_2": "Suite 100",
  "city": "Mumbai",
  "pincode": "400001",
  "contact_no": "1234567890"
}

Response:
{
  "status": true,
  "message": "Operator registration submitted successfully. Awaiting admin approval.",
  "operator": { ... }
}
```

---

## Admin Endpoints

**Requires**: `getAuth('master.admin')`

### List All Operators

```http
GET /operators?page=1&limit=10&operator_status=pending

Query Params:
- page: number (default: 1)
- limit: number (default: 10)
- search: string (searches name, email, phone)
- operator_status: pending|active|suspended|rejected
- sortBy: string
- sortDesc: asc|desc

Response:
{
  "items": [...],
  "totalRecords": 50,
  "page": 1,
  "limit": 10
}
```

### Approve Operator

```http
POST /operators/:operatorId/approve

Body:
{
  "commission_percentage": 15  // Optional, override default
}

Response:
{
  "status": true,
  "message": "Operator approved successfully"
}
```

### Reject Operator

```http
POST /operators/:operatorId/reject

Body:
{
  "rejection_reason": "Incomplete documentation"
}

Response:
{
  "status": true,
  "message": "Operator rejected"
}
```

### Suspend Operator

```http
POST /operators/:operatorId/suspend

Response:
{
  "status": true,
  "message": "Operator suspended successfully"
}
```

---

## Operator Endpoints

**Requires**: `getAuth('operator')`

### Get Profile

```http
GET /operators/profile

Response:
{
  "status": true,
  "operator": {
    "_id": "...",
    "firstname": "John",
    "lastname": "Doe",
    "email": "operator@example.com",
    "operator_business_name": "ABC Shuttle Services",
    "operator_status": "active",
    "operator_commission_percentage": 15,
    "stats": {
      "total_buses": 10,
      "total_drivers": 20,
      "total_schedules": 30,
      "total_bookings": 450,
      "earnings": {
        "pending": 50000,
        "processing": 10000,
        "completed": 200000,
        "total": 260000,
        "available_for_payout": 50000
      }
    }
  }
}
```

### Update Profile

```http
PUT /operators/profile

Body:
{
  "firstname": "John",
  "lastname": "Doe",
  "phone": "9876543210",
  "operator_business_name": "ABC Shuttle Services Ltd",
  "operator_license_number": "LIC123456",
  "address_1": "456 New Street",
  "city": "Mumbai",
  "pincode": "400002"
}

Response:
{
  "status": true,
  "message": "Profile updated successfully",
  "operator": { ... }
}
```

### Get Dashboard

```http
GET /operators/dashboard

Response:
{
  "status": true,
  "dashboard": {
    "earnings": {
      "today": 5000,
      "week": 35000,
      "month": 150000,
      "total": {
        "pending": 50000,
        "processing": 10000,
        "completed": 200000,
        "failed": 0,
        "total": 260000,
        "available_for_payout": 50000
      }
    },
    "bookings": {
      "today": 15,
      "total": 450,
      "active": 25
    },
    "resources": {
      "buses": 10,
      "drivers": 20,
      "schedules": 30
    },
    "recent_bookings": [
      {
        "pnr_no": "PNR123456",
        "customer": "Jane Smith",
        "route": "Mumbai to Pune",
        "amount": 500,
        "status": "SCHEDULED"
      }
    ]
  }
}
```

### Get Earnings

```http
GET /operators/earnings?page=1&limit=20&payout_status=pending

Query Params:
- page: number (default: 1)
- limit: number (default: 20)
- payout_status: pending|processing|completed|failed
- startDate: YYYY-MM-DD
- endDate: YYYY-MM-DD

Response:
{
  "status": true,
  "items": [
    {
      "booking_pnr": "PNR123456",
      "booking_amount": 1000,
      "platform_commission_percentage": 15,
      "platform_commission": 150,
      "operator_earnings": 850,
      "payout_status": "pending",
      "createdAt": "2025-12-09"
    }
  ],
  "totalRecords": 100,
  "page": 1,
  "limit": 20,
  "summary": {
    "pending": 50000,
    "processing": 10000,
    "completed": 200000,
    "failed": 0,
    "total": 260000,
    "available_for_payout": 50000
  }
}
```

### Request Payout

```http
POST /operators/payout/request

Body:
{
  "amount": 50000,
  "payout_method": "bank_transfer",  // bank_transfer|upi|wallet|cheque|other
  "notes": "Monthly payout request"
}

Response:
{
  "status": true,
  "message": "Payout request submitted successfully",
  "amount": 50000
}

Errors:
- 400: Insufficient balance
- 400: Amount below minimum payout threshold
```

---

## Modified Existing Endpoints

### Create Bus

```http
POST /buses

Body:
{
  "operatorId": "operator_id_here",  // NEW: Required (auto-filled for operators)
  "bustypeId": "...",
  "buslayoutId": "...",
  "name": "Bus 001",
  "reg_no": "MH01AB1234",
  "brand": "Tata",
  "model_no": "Starbus",
  "status": "Active"
}

Note: If logged in as operator, operatorId is automatically set to req.user._id
```

### List Buses

```http
GET /buses?page=1&limit=10&operatorId=xxx

Query Params:
- operatorId: string (admin only - filter by specific operator)

Note: Operators automatically see only their own buses
```

### Create Driver

```http
POST /drivers

Body:
{
  "operatorId": "operator_id_here",  // NEW: Required (auto-filled for operators)
  "firstname": "Driver",
  "lastname": "Name",
  "email": "driver@example.com",
  "phone": "1234567890",
  "type": "driver",
  "status": true
}

Note: If logged in as operator, operatorId is automatically set to req.user._id
```

### List Drivers

```http
GET /drivers?page=1&limit=10&operatorId=xxx

Query Params:
- operatorId: string (admin only - filter by specific operator)

Note: Operators automatically see only their own drivers
```

### Create Bus Schedule

```http
POST /bus-schedules

Body:
{
  "operatorId": "operator_id_here",  // NEW: Required (auto-filled for operators)
  "routeId": "...",
  "busId": "...",  // Must belong to the operator
  "every": ["monday", "wednesday", "friday"],
  "start_date": "2025-12-10",
  "end_date": "2026-12-10",
  "stops": [
    {
      "stopId": "...",
      "departure_time": 480,  // minutes from midnight (8:00 AM)
      "arrival_time": null,
      "order": 1
    }
  ],
  "status": true
}

Note:
- If logged in as operator, operatorId is automatically set to req.user._id
- System validates that busId belongs to the operator
```

### List Bus Schedules

```http
GET /bus-schedules?page=1&limit=10&operatorId=xxx

Query Params:
- operatorId: string (admin only - filter by specific operator)
- routeId: string

Note: Operators automatically see only their own schedules
```

---

## Authentication

### Get Token

```http
POST /auth/login

Body:
{
  "email": "operator@example.com",
  "password": "password123"
}

Response:
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "_id": "...",
    "email": "operator@example.com",
    "role": "operator",
    "is_active": true
  }
}
```

### Use Token

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## Error Responses

### 400 Bad Request

```json
{
  "status": false,
  "message": "Operator ID is required"
}
```

### 403 Forbidden

```json
{
  "status": false,
  "message": "You do not have permission to update this bus"
}
```

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

---

## Testing with Postman/cURL

### Register Operator

```bash
curl -X POST http://localhost:3000/v1/operators/register \
  -H "Content-Type: application/json" \
  -d '{
    "firstname": "Test",
    "lastname": "Operator",
    "email": "test@operator.com",
    "phone": "1234567890",
    "password": "test123",
    "operator_business_name": "Test Shuttle Co",
    "operator_license_number": "TEST123"
  }'
```

### Login as Operator

```bash
curl -X POST http://localhost:3000/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@operator.com",
    "password": "test123"
  }'
```

### Get Dashboard (with token)

```bash
curl -X GET http://localhost:3000/v1/operators/dashboard \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## Workflow Example

### Complete Operator Onboarding Flow:

1. **Operator Registers**

   ```
   POST /operators/register
   → Status: pending, is_active: false
   → Email sent to operator
   ```

2. **Admin Reviews**

   ```
   GET /operators?operator_status=pending
   → See list of pending operators
   ```

3. **Admin Approves**

   ```
   POST /operators/:operatorId/approve
   → Status: active, is_active: true
   → Email sent to operator
   ```

4. **Operator Logs In**

   ```
   POST /auth/login
   → Receives JWT token
   ```

5. **Operator Creates Resources**

   ```
   POST /buses (with token)
   POST /drivers (with token)
   POST /bus-schedules (with token)
   ```

6. **Operator Views Dashboard**

   ```
   GET /operators/dashboard (with token)
   → See earnings, bookings, resources
   ```

7. **Operator Requests Payout**
   ```
   POST /operators/payout/request (with token)
   → Earnings status: pending → processing
   ```

---

## Notes

- All operator endpoints require authentication with JWT token
- Operators can only access their own resources
- Super-admins can access all resources and filter by operatorId
- Commission percentage can be set per operator or use default from settings
- Minimum payout amount is configurable in settings (default: 1000)
