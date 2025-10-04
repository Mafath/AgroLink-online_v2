<div align="center">
  <img src="frontend/src/assets/AgroLink_logo3-removebg-preview.png" alt="AgroLink Logo" width="150" height="180" />
</div>

<h1 align="center">AgroLink – Smart Agricultural Marketplace</h1>

<p align="center">
  <strong>Empowering Farmers. Connecting Communities. Building the Future of Agriculture.</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-19.1.1-61DAFB?style=flat-square&logo=react&logoColor=white" />
  <img src="https://img.shields.io/badge/Node.js-20.0.0-339933?style=flat-square&logo=node.js&logoColor=white" />
  <img src="https://img.shields.io/badge/Express.js-5.x-black?style=flat-square&logo=express&logoColor=white" />
  <img src="https://img.shields.io/badge/MongoDB-8.x-4EA94B?style=flat-square&logo=mongodb&logoColor=white" />
  <img src="https://img.shields.io/badge/License-ISC-blue?style=flat-square" />
</p>

---

## About AgroLink

**AgroLink Online** is a comprehensive digital marketplace platform that connects farmers, buyers, agronomists, and drivers in the agricultural ecosystem. Built with modern web technologies, it facilitates the buying and selling of agricultural products, equipment rentals, harvest management, and delivery services.

## Core Features

### Marketplace & E-commerce
- **Product Listings**: Farmers can list their crops with detailed information, pricing, and images
- **Shopping Cart**: Seamless shopping experience with cart management
- **Order Management**: Complete order processing with status tracking
- **Payment Integration**: Stripe payment processing for secure transactions
- **Inventory Management**: Track agricultural supplies and equipment

### Multi-Role User System
- **Farmers**: List products, manage harvests, track finances
- **Buyers**: Browse marketplace, place orders, track deliveries
- **Agronomists**: Provide expert advice, manage harvest schedules, respond to reports
- **Drivers**: Handle delivery assignments and logistics
- **Administrators**: Platform oversight and management

### Harvest Management
- **Harvest Requests**: Farmers can request expert assistance for harvest planning
- **Schedule Management**: Agronomists can create and manage harvest schedules
- **Progress Tracking**: Real-time monitoring of harvest activities
- **Expert Consultation**: Direct communication between farmers and agronomists

### Delivery & Logistics
- **Delivery Tracking**: Real-time order tracking and status updates
- **Driver Assignment**: Automated driver allocation for deliveries
- **Route Optimization**: Efficient delivery route planning
- **Review System**: Customer feedback on delivery services

### Financial Management
- **Budget Tracking**: Monitor farm expenses and income
- **Goal Setting**: Set and track financial objectives
- **Transaction History**: Complete financial record keeping
- **Debt Management**: Track and manage agricultural debts

### Equipment Rental
- **Equipment Listings**: Rent out agricultural equipment
- **Booking System**: Schedule equipment rentals
- **Availability Management**: Track equipment availability
- **Rental History**: Complete rental transaction records

### Reporting & Analytics
- **Harvest Reports**: Detailed harvest performance analytics
- **Financial Reports**: Comprehensive financial insights
- **Activity Tracking**: Monitor platform usage and engagement
- **Admin Dashboard**: Platform-wide analytics and management

### Security & Authentication
- **JWT Authentication**: Secure token-based authentication
- **Role-based Access**: Granular permission system
- **Email Verification**: Account verification system
- **Password Security**: bcrypt encryption

## Technology Stack

### Frontend Technologies
- **React 19** - Modern UI framework with latest features
- **Vite** - Lightning-fast build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **DaisyUI** - Beautiful component library
- **React Router** - Declarative routing
- **Zustand** - Lightweight state management
- **Axios** - Promise-based HTTP client
- **React Hot Toast** - Elegant notifications
- **ApexCharts** - Interactive data visualization
- **Stripe** - Secure payment processing

### Backend Technologies
- **Node.js** - JavaScript runtime environment
- **Express.js** - Fast, unopinionated web framework
- **MongoDB** - NoSQL document database
- **Mongoose** - Elegant MongoDB object modeling
- **JWT** - Secure authentication tokens
- **bcrypt** - Password hashing library
- **Cloudinary** - Cloud image management
- **Nodemailer** - Email sending service
- **Socket.io** - Real-time bidirectional communication


## Access the Application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5001

## Visuals

### Homepage & Dashboard
**Landing Page**
![Homepage](visuals/homepage.png)
*Modern, responsive homepage with role-based welcome messages*

**Admin Dashboard**
![Admin Dashboard](visuals/admin-dashboard.png)
*Comprehensive admin panel with analytics and management tools*

### Marketplace & E-commerce
**Product Marketplace**
![Marketplace](visuals/marketplace.png)
*Browse and search agricultural products with advanced filtering*

**Shopping Cart**
![Shopping Cart](visuals/shopping-cart.png)
*Seamless shopping experience with cart management*

### Harvest Management
**Harvest Dashboard**
![Harvest Dashboard](visuals/harvest-dashboard.png)
*Track harvest progress and manage schedules*

**Harvest Scheduling**
![Harvest Schedule](visuals/harvest-schedule.png)
*Create and manage harvest schedules with expert consultation*

### User Management
**User Registration**
![Signup](visuals/signup.png)
*Multi-role registration with email verification*

**User Dashboard**
![User Dashboard](visuals/user-dashboard.png)
*Personalized dashboard based on user role*

### Analytics & Reports
**Financial Reports**
![Financial Reports](visuals/financial-reports.png)
*Comprehensive financial tracking and analytics*

**Order Management**
![Order Management](visuals/order-management.png)
*Track orders, deliveries, and customer feedback*

## API Documentation

### Authentication Endpoints
- `POST /api/auth/signup` - User registration
- `POST /api/auth/signin` - User login
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - User logout

### Core Features
- **Listings**: Product management and marketplace
- **Orders**: Order processing and management
- **Harvest**: Harvest planning and tracking
- **Delivery**: Logistics and delivery management
- **Finance**: Financial tracking and management
- **Inventory**: Supply and equipment management

## User Roles & Permissions

| Role | Permissions |
|------|-------------|
| **FARMER** | List products, manage harvests, track finances, view orders |
| **BUYER** | Browse marketplace, place orders, track deliveries, manage cart |
| **AGRONOMIST** | Manage harvest schedules, provide expert advice, respond to reports |
| **DRIVER** | View delivery assignments, update delivery status |
| **ADMIN** | Full platform access, user management, analytics |


## Project Structure

```
AgroLink-online-main/
├── backend/
│   ├── src/
│   │   ├── controllers/  # API route handlers
│   │   ├── models/       # Database schemas
│   │   ├── routes/       # API routes
│   │   ├── middleware/   # Custom middleware
│   │   ├── lib/          # Utility functions
│   │   └── scripts/      # Database seeding scripts
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/   # Reusable UI components
│   │   ├── pages/        # Page components
│   │   ├── store/        # State management
│   │   └── lib/          # Utility functions
│   └── package.json
└── README.md
```

## Security Features

- **JWT Authentication** - Secure token-based authentication
- **Password Hashing** - bcrypt encryption for passwords
- **Email Verification** - Account verification system
- **Role-based Access Control** - Granular permission system
- **Input Validation** - Comprehensive data validation
- **CORS Protection** - Cross-origin request security



## License

This project is licensed under the ISC License.

## Support

For support and questions, please contact the development team or create an issue in the repository.

---

## AgroLink Online

**Connecting the agricultural community through technology**

© 2025 AgroLink Online - All Rights Reserved