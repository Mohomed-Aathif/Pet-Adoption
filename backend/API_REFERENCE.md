# API Endpoints Quick Reference

## Base URL
```
http://localhost:8000/api/v1
```

## Authentication Endpoints

### Register User
```http
POST /auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "username": "username",
  "password": "Password123",
  "confirm_password": "Password123",
  "full_name": "User Name",
  "role": "adopter"  // admin, adopter, owner, shelter
}

Response: 201 Created
{
  "id": 1,
  "email": "user@example.com",
  "username": "username",
  "full_name": "User Name",
  "role": "adopter",
  "is_active": true,
  "is_verified": false,
  "created_at": "2024-01-01T00:00:00",
  "updated_at": "2024-01-01T00:00:00",
  "last_login": null
}
```

### Login User
```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "Password123"
}

Response: 200 OK
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIs...",
  "token_type": "bearer",
  "expires_in": 1800,
  "user_id": 1,
  "email": "user@example.com",
  "role": "adopter"
}
```

### Refresh Token
```http
POST /auth/refresh
Content-Type: application/json

{
  "refresh_token": "eyJhbGciOiJIUzI1NiIs..."
}

Response: 200 OK
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIs...",
  "token_type": "bearer"
}
```

### Get Current User
```http
GET /auth/me
Authorization: Bearer {access_token}

Response: 200 OK
{
  "id": 1,
  "email": "user@example.com",
  "username": "username",
  "full_name": "User Name",
  "phone": "+1234567890",
  "address": "123 Main St",
  "role": "adopter",
  "is_active": true,
  "is_verified": false,
  "bio": null,
  "profile_picture_url": null,
  "created_at": "2024-01-01T00:00:00",
  "updated_at": "2024-01-01T00:00:00",
  "last_login": "2024-01-01T00:00:00"
}
```

### Update Current User
```http
PUT /auth/me
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "full_name": "Updated Name",
  "phone": "+1987654321",
  "address": "456 Oak Ave",
  "bio": "Pet lover",
  "profile_picture_url": "https://..."
}

Response: 200 OK
{ ...user object... }
```

### Change Password
```http
POST /auth/change-password
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "current_password": "OldPassword123",
  "new_password": "NewPassword123",
  "confirm_password": "NewPassword123"
}

Response: 200 OK
{
  "message": "Password changed successfully"
}
```

### Logout
```http
POST /auth/logout
Authorization: Bearer {access_token}

Response: 200 OK
{
  "message": "Logged out successfully"
}
```

---

## Admin Endpoints

All require `Authorization: Bearer {admin_token}`

### List All Users
```http
GET /admin/users?skip=0&limit=10&role=adopter
Authorization: Bearer {admin_token}

Response: 200 OK
{
  "total": 50,
  "page": 1,
  "page_size": 10,
  "users": [ {...}, {...} ]
}
```

### Get User Details
```http
GET /admin/users/{user_id}
Authorization: Bearer {admin_token}

Response: 200 OK
{ ...user object... }
```

### List Users by Role
```http
GET /admin/users/role/{role}
// role: admin, adopter, owner, shelter
Authorization: Bearer {admin_token}

Response: 200 OK
{
  "total": 25,
  "page": 1,
  "page_size": 100,
  "role": "adopter",
  "users": [ {...}, {...} ]
}
```

### Update User Role
```http
PUT /admin/users/{user_id}/role/{new_role}
// new_role: admin, adopter, owner, shelter
Authorization: Bearer {admin_token}

Response: 200 OK
{
  "message": "User role updated successfully",
  "user_id": 1,
  "new_role": "shelter"
}
```

### Activate User
```http
PUT /admin/users/{user_id}/activate
Authorization: Bearer {admin_token}

Response: 200 OK
{
  "message": "User activated successfully",
  "user_id": 1
}
```

### Deactivate User
```http
PUT /admin/users/{user_id}/deactivate
Authorization: Bearer {admin_token}

Response: 200 OK
{
  "message": "User deactivated successfully",
  "user_id": 1
}
```

### User Statistics
```http
GET /admin/stats/users
Authorization: Bearer {admin_token}

Response: 200 OK
{
  "total_users": 100,
  "by_role": {
    "admin": 2,
    "adopter": 60,
    "owner": 20,
    "shelter": 18
  }
}
```

### Admin Dashboard
```http
GET /admin/stats/dashboard
Authorization: Bearer {admin_token}

Response: 200 OK
{
  "timestamp": "2024-01-01T00:00:00",
  "total_users": 100,
  "active_users": 85,
  "inactive_users": 15,
  "users_by_role": {
    "admin": 2,
    "adopter": 60,
    "owner": 20,
    "shelter": 18
  }
}
```

---

## Pet Endpoints

### List Pets
```http
GET /pets?skip=0&limit=100
Response: 200 OK
[ {...pet}, {...pet} ]
```

### Get Pet Details
```http
GET /pets/{pet_id}
Response: 200 OK
{ ...pet object... }
```

### Create Pet
```http
POST /pets
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "name": "Max",
  "species": "dog",
  "breed": "Golden Retriever",
  "age": 3,
  "description": "Friendly doggo",
  "status": "available",
  "image_url": "https://..."
}

Response: 201 Created
{ ...pet object... }
```

### Update Pet
```http
PUT /pets/{pet_id}
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "name": "Max Updated",
  "status": "adopted"
}

Response: 200 OK
{ ...pet object... }
```

### Delete Pet
```http
DELETE /pets/{pet_id}
Authorization: Bearer {access_token}

Response: 200 OK
{
  "detail": "Pet deleted"
}
```

---

## Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request |
| 401 | Unauthorized (invalid/missing token) |
| 403 | Forbidden (insufficient permissions) |
| 404 | Not Found |
| 422 | Validation Error |
| 500 | Internal Server Error |

---

## Error Responses

### Invalid Token
```json
{
  "detail": "Invalid or expired token"
}
```

### Unauthorized (Missing Role)
```json
{
  "detail": "Admin access required"
}
```

### Validation Error
```json
{
  "detail": [
    {
      "loc": ["body", "email"],
      "msg": "invalid email format",
      "type": "value_error.email"
    }
  ]
}
```

### Duplicate Email
```json
{
  "detail": "Email already registered"
}
```

---

## Default Admin User

After running `python -m app.init_db`:

```
Email: 
Username: 
Password:
Role:
```
Set via environment variables:

---

## Bearer Token Format

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxLCJlbWFpbCI6InVzZXJAZXhhbXBsZS5jb20iLCJyb2xlIjoiYWRvcHRlciIsImV4cCI6MTcwNDMzNDAwMH0.signature
```

---

## Common Headers

```
Content-Type: application/json
Authorization: Bearer {access_token}
Accept: application/json
```

---

## Example cURL Commands

### Register
```bash
curl -X POST http://localhost:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "username": "user",
    "password": "Pass123",
    "confirm_password": "Pass123"
  }'
```

### Login
```bash
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "Pass123"
  }'
```

### Get Current User
```bash
curl -X GET http://localhost:8000/api/v1/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### List Users (Admin)
```bash
curl -X GET http://localhost:8000/api/v1/admin/users \
  -H "Authorization: Bearer ADMIN_TOKEN_HERE"
```

---

## Interactive API Documentation

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

Use these for testing directly in the browser!

---

*Last Updated: 2024*  
*Pet Adoption System API*
