# Sekolah API Documentation

## Base URL
```
/api/v1
```

## Authentication

### Login
```http
POST /api/v1/auth/login
Content-Type: application/json

{
    "email": "admin@sekolah.com",
    "password": "password"
}
```

**Response:**
```json
{
    "success": true,
    "message": "Login successful",
    "data": {
        "access_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
        "refresh_token": "a1b2c3d4e5f6...",
        "token_type": "bearer",
        "expires_in": 1800,
        "user": {
            "id": 1,
            "name": "Administrator",
            "email": "admin@sekolah.com",
            "role": "admin",
            "is_active": true,
            "roles": [...],
            "created_at": "2024-01-01T00:00:00.000000Z"
        }
    }
}
```

### Register
```http
POST /api/v1/auth/register
Content-Type: application/json

{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "Password123!",
    "password_confirmation": "Password123!",
    "role": "guru"
}
```

### Refresh Token
```http
POST /api/v1/auth/refresh
Content-Type: application/json

{
    "refresh_token": "a1b2c3d4e5f6..."
}
```

### Logout
```http
POST /api/v1/auth/logout
Authorization: Bearer {access_token}
```

### Get Current User
```http
GET /api/v1/auth/me
Authorization: Bearer {access_token}
```

## Siswa Endpoints

### List All Siswa
```http
GET /api/v1/siswa
Authorization: Bearer {access_token}
```

**Query Parameters:**
- `kelas_id` - Filter by kelas
- `status` - Filter by status (aktif, lulus, pindah)
- `jenis_kelamin` - Filter by gender (L, P)
- `search` - Search by nama or nis
- `per_page` - Items per page (default: 15)
- `cursor` - Cursor for pagination

**Response:**
```json
{
    "success": true,
    "message": "Siswa retrieved successfully",
    "data": [
        {
            "id": 1,
            "nis": "12345",
            "nama": "Budi Santoso",
            "jenis_kelamin": "L",
            "tanggal_lahir": "2005-01-15",
            "alamat": "Jl. Merdeka No. 1",
            "status": "aktif",
            "kelas": {
                "id": 1,
                "nama_kelas": "X-A",
                "tingkat": 10,
                "tahun_ajaran": "2023/2024"
            }
        }
    ],
    "meta": {
        "current_page": 1,
        "next_cursor": "eyJpZCI6MTAwfQ",
        "prev_cursor": null,
        "has_more": true
    }
}
```

### Get Single Siswa
```http
GET /api/v1/siswa/{id}
Authorization: Bearer {access_token}
```

### Create Siswa
```http
POST /api/v1/siswa
Authorization: Bearer {access_token}
Content-Type: application/json

{
    "sys_user_id": 1,
    "nis": "12345",
    "nama": "Budi Santoso",
    "jenis_kelamin": "L",
    "tanggal_lahir": "2005-01-15",
    "alamat": "Jl. Merdeka No. 1",
    "mst_kelas_id": 1,
    "status": "aktif"
}
```

### Update Siswa
```http
PUT /api/v1/siswa/{id}
Authorization: Bearer {access_token}
Content-Type: application/json

{
    "nama": "Budi Santoso Updated",
    "alamat": "Jl. Sudirman No. 2"
}
```

### Delete Siswa
```http
DELETE /api/v1/siswa/{id}
Authorization: Bearer {access_token}
```

### Get Siswa by Kelas
```http
GET /api/v1/siswa/kelas/{kelas_id}
Authorization: Bearer {access_token}
```

### Get Absensi Summary
```http
GET /api/v1/siswa/{id}/absensi-summary?start_date=2024-01-01&end_date=2024-01-31
Authorization: Bearer {access_token}
```

**Response:**
```json
{
    "success": true,
    "message": "Absensi summary retrieved successfully",
    "data": {
        "hadir": 20,
        "izin": 2,
        "sakit": 1,
        "alpha": 0,
        "total": 23
    }
}
```

### Naik Kelas
```http
POST /api/v1/siswa/{id}/naik-kelas
Authorization: Bearer {access_token}
Content-Type: application/json

{
    "kelas_id": 2
}
```

### Lulus
```http
POST /api/v1/siswa/{id}/lulus
Authorization: Bearer {access_token}
```

## File Upload Endpoints

### Upload File
```http
POST /api/v1/files/upload
Authorization: Bearer {access_token}
Content-Type: multipart/form-data

file: <binary>
folder: "profile-photos" (optional)
```

**Response:**
```json
{
    "success": true,
    "message": "File uploaded successfully",
    "data": {
        "file_name": "a1b2c3d4.jpg",
        "original_name": "photo.jpg",
        "file_path": "2024/01/user-1/profile-photos/a1b2c3d4.jpg",
        "file_size": 12345,
        "mime_type": "image/jpeg",
        "extension": "jpg",
        "url": "https://minio.example.com/sekolah-files/2024/01/user-1/profile-photos/a1b2c3d4.jpg"
    }
}
```

### Get Presigned URL
```http
POST /api/v1/files/presigned-url
Authorization: Bearer {access_token}
Content-Type: application/json

{
    "file_path": "2024/01/user-1/profile-photos/a1b2c3d4.jpg",
    "expiration": 15
}
```

### Delete File
```http
DELETE /api/v1/files/delete
Authorization: Bearer {access_token}
Content-Type: application/json

{
    "file_path": "2024/01/user-1/profile-photos/a1b2c3d4.jpg"
}
```

## Health Check
```http
GET /api/health
```

**Response:**
```json
{
    "success": true,
    "message": "API is running",
    "timestamp": "2024-01-01T12:00:00.000000Z",
    "version": "1.0.0"
}
```

## Error Responses

### 400 Bad Request
```json
{
    "success": false,
    "message": "Validation failed",
    "errors": {
        "email": ["Email sudah terdaftar"]
    }
}
```

### 401 Unauthorized
```json
{
    "success": false,
    "message": "Invalid credentials"
}
```

### 403 Forbidden
```json
{
    "success": false,
    "message": "Forbidden - Insufficient permissions"
}
```

### 404 Not Found
```json
{
    "success": false,
    "message": "Siswa not found"
}
```

### 500 Internal Server Error
```json
{
    "success": false,
    "message": "Internal server error"
}
```

## Rate Limiting

- General API: 60 requests per minute per user/IP
- Auth endpoints: 5 requests per minute per IP

## Response Format

All responses follow this standardized format:

```json
{
    "success": true|false,
    "message": "Human readable message",
    "data": { ... },
    "meta": { ... } // For paginated responses
}
```
