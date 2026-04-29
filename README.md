# 🐾 Pet Adoption Platform

![FastAPI](https://img.shields.io/badge/FastAPI-0.104-green)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Database-blue)
![JWT](https://img.shields.io/badge/Auth-JWT-orange)
![License](https://img.shields.io/badge/License-MIT-lightgrey)

A full stack web-based **Pet Adoption Platform** designed to connect adopters, pet owners, and administrators in a centralized system. The platform improves transparency, efficiency, and reliability in the pet adoption process.

---

## 🚀 Features

### 🔐 Authentication & Security
- JWT-based authentication (access tokens)
- Secure password hashing
- Role-based access control (RBAC)

---

### 🐶 Pet Management
- Create, update, and manage pet listings
- Detailed pet profiles (breed, age, health, etc.)
- Image and description support

---

### 📄 Adoption Workflow
- Submit adoption requests
- Track request status (pending, approved, rejected)
- Structured adoption lifecycle

---

### 👥 User Roles

- **Admin**
  - Manage users and roles
  - Monitor system activity
  - View analytics

- **Adopter**
  - Browse pets
  - Submit adoption requests
  - Track application status

- **Pet Owner**
  - List pets for adoption
  - Manage requests
  - Communicate with adopters

---

### 📊 Dashboards
- Role-based dashboards
- Adoption statistics
- Activity tracking
- Request management

---

## 🛠️ Tech Stack

### Backend
- **FastAPI**
- **SQLAlchemy**
- **PostgreSQL**
- **Pydantic**

### Authentication
- **JWT (python-jose)**
- **Passlib**

### Tools
- **Uvicorn**
- **Git & GitHub**

---

## 🏗️ Project Structure
```
backend/
├── app/
│   ├── api/v1/endpoints/
│   ├── core/
│   ├── models/
│   ├── schemas/
│   ├── crud/
│   ├── utils/
│   ├── config/
│   ├── database.py
│   └── main.py
```

---

## 🔐 Authentication Flow

1. User registers
2. Password is hashed securely
3. User logs in
4. JWT token is generated
5. Token is used for protected routes

---

## 📡 API Endpoints

### Auth
- `POST /auth/register`
- `POST /auth/login`
- `GET /auth/me`

### Pets
- `GET /pets`
- `POST /pets`

### Adoptions
- `POST /adoptions`
- `GET /adoptions`

---

## ⚙️ Setup Instructions

## 1️⃣ Clone Repository
```
git clone https://github.com/yourusername/pet-adoption-platform.git
cd pet-adoption-platform/backend
```
---

## 2️⃣ Create Virtual Environment
```
python -m venv venv
venv\Scripts\activate
```
---

## 3️⃣ Install Dependencies
```
pip install -r requirements.txt
```
---

## 4️⃣ Configure Environment

Create .env file:
```
DATABASE_URL=postgresql://user:password@localhost:5432/pet_adoption
SECRET_KEY=your_secret_key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=120
```
---

## 5️⃣ Run Server
```
python -m uvicorn app.main:app --reload --port 9000
```
---

## 6️⃣ API Documentation
```
http://localhost:9000/docs
```
---

## 🧪 Testing
API tested using Swagger UI
Manual endpoint validation

---

##📈 Highlights
Clean layered architecture
Secure authentication system
Role-based access control
Scalable backend design
RESTful API implementation

---

🚧 Future Improvements
AI-based pet recommendations
Real-time chat system
Payment integration
Mobile app support
