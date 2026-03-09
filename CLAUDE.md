# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Laboratory Inventory Management System - An Express.js REST API for managing laboratory consumables with multi-tenant laboratory isolation.

**Tech Stack:**
- Node.js + Express.js 5.2.1
- MongoDB 7.1.0 + Mongoose 9.2.1
- JWT (jsonwebtoken 9.0.3)
- CORS 2.8.6

**Database:** MongoDB running on `mongodb://localhost:27017/test`

## Development Commands

```bash
# Start production server
npm start

# Start development server with auto-reload
npm run dev
```

## Architecture

### MVC Three-Layer Pattern

```
routes/          (Defines endpoints, delegates to controllers)
  ↓
controller/      (Handles request/response, calls services)
  ↓
services/        (Business logic, database operations)
  ↓
models/          (Mongoose schemas, static methods)
```

### Key Modules

**Models** (`models/`):
- `UserModel` - User accounts with labName (required field), includes nickName, realName, phone, email
- `InventoryModel` - Inventory items with automatic status management
- `LabModel` - Laboratory definitions
- `TransactionModel` - Stock operation records with audit trail (userName, contact, operationTime)

**Routes** (`routes/`):
- `UserRoute` - Authentication (`/user/*`)
- `InventoryRoute` - Inventory management (`/adminapi/inventory/*`)
- `LabRoute` - Laboratory management (`/lab/*`)
- `TransactionRoute` - Stock transaction records (`/adminapi/transaction/*`)

**Important:** All models are exported from `models/index.js` and must be imported in `app.js` before routes to ensure proper Mongoose registration.

## Authentication & Authorization

### JWT Token Flow

1. User receives token on login via `Authorization` header
2. All protected routes require `Authorization: <token>` header
3. Global JWT middleware in `app.js` validates tokens and auto-refreshes on each request
4. New token is returned in response `Authorization` header

### Whitelist Routes (No Token Required)

Defined in `app.js` JWT middleware:
- `/user/login`
- `/user/register`
- `/user/check-nickname`
- `/upload`
- `/lab/search`
- `/lab/list`
- `/lab/create`

### Token Payload Structure

```javascript
{
  _id: "user_id",
  username: "username",
  labName: "laboratory_name"  // Critical for data isolation
}
```

## Laboratory Data Isolation

**Critical:** All inventory operations must enforce laboratory isolation using `labName` from JWT payload.

**Pattern in Services:**
```javascript
const query = { /* other conditions */ };
if (labName) {
    query.labName = labName;  // Always filter by labName
}
```

**Authorization Pattern in Services:**
```javascript
// Verify lab ownership before modifications
if (existingItem.labName !== labName) {
    return { success: false, message: '无权操作其他实验室的数据' };
}
```

## Inventory Status Auto-Management

The `InventoryModel` has a `pre('save')` hook that automatically calculates status based on:
- `status = 'expired'` - expiryDate < now
- `status = 'expiring_soon'` - expiryDate within 30 days
- `status = 'out_of_stock'` - quantity === 0
- `status = 'low_stock'` - quantity <= minQuantity
- `status = 'normal'` - default

**Important:** After any quantity or date changes, call `item.updateStatus()` before saving.

## API Response Format

**Success:**
```json
{
  "errCode": "0",
  "errorInfo": "success",
  "data": { /* response data */ }
}
```

**Error:**
```json
{
  "errCode": "-1",
  "errorInfo": "error message"
}
```

## CORS Configuration

Configured in `app.js` to accept requests from:
- `http://localhost:10086`
- `http://192.168.67.48:10086`
- Pattern: `http://192.168.X.X:10086`

## Static Files

Static files served from `/public` directory at `/public` route.

## Database Connection

Connection initialized in `app.js` via `utils/mongoDB.js`. Do not modify connection logic unless updating credentials.

## Common Patterns

### Adding New Inventory Endpoints

1. Add route in `routes/InventoryRoute/InventoryRoute.js`
2. Add controller method in `controller/InventoryController/InventoryController.js`
3. Extract `labName` from JWT payload in controller
4. Pass `labName` to service method
5. Implement business logic in `services/InventoryServices/InventoryServices.js`
6. Always enforce lab isolation in queries and authorization checks

### Service Method Signature

```javascript
// Pattern for inventory services
methodName: async (params, labName) => {
    const query = { /* conditions */ };
    if (labName) query.labName = labName;
    // ... business logic
}
```

### Error Handling in Controllers

```javascript
try {
    const token = req.headers['authorization'];
    const payload = JWT.verify(token);
    const labName = payload?.labName;

    // Call service
    const result = await service.method(params, labName);

    if (!result.success) {
        return res.status(400).send({
            errCode: '-1',
            errorInfo: result.message
        });
    }

    res.status(200).send({
        errCode: '0',
        errorInfo: 'success',
        data: result.data
    });
} catch (error) {
    res.status(500).send({
        errCode: '-1',
        errorInfo: error.message || '操作失败'
    });
}
```

## Inventory Categories

Valid categories: `'试剂'`, `'耗材'`, `'仪器'`, `'其他'`

## Inventory Status Values

- `'normal'` - Normal stock level
- `'low_stock'` - Below minimum threshold
- `'expired'` - Past expiry date
- `'expiring_soon'` - Expiring within 30 days
- `'out_of_stock'` - Zero quantity

## Stock Operations

### Primary Interface: PUT /adminapi/inventory/quantity/:id

**Frontend uses this endpoint** (`pages/inventory/inventory-record/`) for all stock operations:

```http
PUT /adminapi/inventory/quantity/:id
{
  "quantity": 5,          // Required: operation amount
  "operation": "add"      // Required: "add" (return_in) or "subtract" (consume_out)
}
```

**Backend Behavior:**
- Uses atomic `$inc` operation for concurrency safety
- Automatically creates Transaction record with:
  - `userName` - from User.nickName or User.realName
  - `contact` - from User.phone or User.email
  - `operationTime` - timestamp of operation
- Checks stock availability for subtract operations

### Transaction Model Fields

```javascript
{
  inventoryId: ObjectId,      // Reference to Inventory
  type: String,               // purchase_in, return_in, consume_out, use_out
  quantity: Number,           // Positive for in, negative for out
  quantityBefore: Number,
  quantityAfter: Number,
  remark: String,
  operator: ObjectId,         // User ID
  userName: String,           // User's nickName or realName
  contact: String,            // User's phone or email
  operationTime: Date,        // Operation timestamp
  labName: String             // Laboratory name for isolation
}
```

**Note:** Transaction model does NOT use `timestamps: true`. Only `operationTime` is stored.

## Mongoose 9.x API Patterns

**Important:** Use `returnDocument: 'after'` instead of deprecated `new: true`:

```javascript
// ✅ Correct (Mongoose 9.x)
const result = await Model.findOneAndUpdate(
  { _id: id },
  updateData,
  { returnDocument: 'after' }  // Returns updated document
)

// ❌ Deprecated (causes warnings)
const result = await Model.findOneAndUpdate(
  { _id: id },
  updateData,
  { new: true }  // Deprecated in Mongoose 9.x
)
```
