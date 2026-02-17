# Sekolah Pintar - School Management Dashboard

A modern, secure, and feature-rich admin dashboard for school management built with React Router v7, Tailwind CSS, advanced charts, and data grid components.

## 🎯 Overview

**Sekolah Pintar** is a comprehensive school management system that enables schools to manage student data, attendance, grades, and counseling services digitally. The system supports multiple user roles with role-based access control (RBAC).

## Features

### Core Features
- ✅ **React Router v7** - Latest routing with nested routes and protected routes
- ✅ **Tailwind CSS** - Modern utility-first CSS framework with dark mode support
- ✅ **Advanced Charts** - Beautiful, responsive charts using Recharts (Line, Bar, Area, Pie, Radar, Scatter)
- ✅ **Data Grid** - Powerful AG Grid with sorting, filtering, pagination, and CSV export
- ✅ **API Integration** - Axios with interceptors, error handling, and request/response transformation
- ✅ **Form Validation** - React Hook Form with Zod schema validation
- ✅ **State Management** - Zustand for lightweight, efficient state management

### School Management Features
- 📚 **Student Management** - Complete CRUD operations for student data
- 📋 **Attendance System** - Track and manage student attendance
- 📊 **Grade Management** - Input and manage academic grades
- 🗣️ **BK (Bimbingan Konseling)** - Counseling and student behavior tracking
- 👥 **User Management** - Manage system users (Admin, Guru, BK)
- 📈 **Analytics** - School data analytics and visualizations

### Security Features
- 🔒 **Authentication** - JWT-based authentication with protected routes
- 🔒 **Role-Based Access Control** - Granular permissions for Admin, Guru, and BK roles
- 🔒 **Input Sanitization** - XSS prevention through input sanitization
- 🔒 **CSRF Protection** - CSRF token support in API requests
- 🔒 **Content Security Policy** - CSP headers configured in index.html
- 🔒 **Secure Storage** - Encrypted local storage for auth tokens

### Performance Optimizations
- ⚡ **Code Splitting** - Lazy loading of route components
- ⚡ **Memoization** - React.memo and useMemo for expensive computations
- ⚡ **Bundle Optimization** - Vite with manual chunk splitting
- ⚡ **Tree Shaking** - Automatic removal of unused code

### UI/UX Features
- 🎨 **Dark Mode** - Persistent theme switching with system preference detection
- 📱 **Responsive Design** - Mobile-first design with collapsible sidebar
- 🎯 **Clean Code** - Well-organized, maintainable codebase
- 🔄 **Error Boundaries** - Graceful error handling with user-friendly messages
- 📊 **Rich Components** - Pre-built reusable components (Button, Card, Input, etc.)

## Tech Stack

- **Frontend Framework**: React 19
- **Routing**: React Router DOM 7.0
- **Styling**: Tailwind CSS 3.4
- **State Management**: Zustand 5.0
- **Charts**: Recharts 2.15
- **Data Grid**: AG Grid 32.3
- **Form Management**: React Hook Form 7.54
- **Validation**: Zod 3.24
- **HTTP Client**: Axios 1.7
- **Icons**: Lucide React 0.468
- **Build Tool**: Vite 6.0

## User Roles & Permissions

| Feature | Admin | Guru | BK |
|---------|-------|------|-----|
| Dashboard | ✅ | ✅ | ✅ |
| Data Siswa | ✅ | ✅ | ❌ |
| Absensi | ✅ | ✅ | ❌ |
| Nilai | ✅ | ✅ | ❌ |
| BK (Bimbingan Konseling) | ✅ | ✅ | ✅ |
| Users Management | ✅ | ❌ | ❌ |
| Analytics | ✅ | ❌ | ❌ |
| Data Grid | ✅ | ❌ | ❌ |
| Settings | ✅ | ❌ | ❌ |

## Project Structure

```
react_template/
├── src/
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Header.jsx
│   │   │   ├── Sidebar.jsx
│   │   │   └── MainLayout.jsx
│   │   ├── guards/
│   │   │   └── RoleGuard.jsx
│   │   ├── ui/
│   │   │   ├── Button.jsx
│   │   │   ├── Card.jsx
│   │   │   ├── Input.jsx
│   │   │   └── FileUpload.jsx
│   │   ├── ErrorBoundary.jsx
│   │   └── ProtectedRoute.jsx
│   ├── features/
│   │   ├── dashboard/
│   │   │   ├── components/
│   │   │   │   ├── AttendanceChart.jsx
│   │   │   │   ├── RecentActivity.jsx
│   │   │   │   └── StatCard.jsx
│   │   │   └── services/
│   │   │       └── dashboardService.js
│   │   └── siswa/
│   │       ├── pages/
│   │       │   ├── SiswaList.jsx
│   │       │   ├── SiswaDetail.jsx
│   │       │   └── SiswaForm.jsx
│   │       └── services/
│   │           └── siswaService.js
│   ├── pages/
│   │   ├── Dashboard.jsx
│   │   ├── Login.jsx
│   │   ├── Register.jsx
│   │   ├── Siswa.jsx
│   │   ├── Absensi.jsx
│   │   ├── Nilai.jsx
│   │   ├── BK.jsx
│   │   ├── Users.jsx
│   │   ├── Analytics.jsx
│   │   ├── DataGrid.jsx
│   │   ├── Settings.jsx
│   │   └── Unauthorized.jsx
│   ├── store/
│   │   ├── useAuthStore.js
│   │   └── useThemeStore.js
│   ├── services/
│   │   └── fileUploadService.js
│   ├── utils/
│   │   ├── api.js
│   │   └── sweetalert.js
│   ├── hooks/
│   │   └── usePageTitle.js
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── nginx/
│   ├── nginx.dev.conf
│   └── nginx.prod.conf
├── docker-compose.dev.yaml
├── docker-compose.prod.yaml
├── Dockerfile
├── Dockerfile.dev
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
└── package.json
```

## Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd react_template
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
```bash
cp .env.example .env
```

Edit `.env`:
```env
VITE_API_BASE_URL=https://your-api-url.com
VITE_ENV=development
```

4. Start the development server:
```bash
npm run dev
```

The application will open at `http://localhost:5173`

### Build for Production

```bash
npm run build
```

The optimized build will be in the `dist` folder.

### Preview Production Build

```bash
npm run preview
```

## Usage

### Login

The application includes a mock authentication system. Use any email and password (minimum 6 characters) to log in.

**Demo Credentials:**
- Email: admin@example.com
- Password: password123

### Role-Based Navigation

After logging in, the sidebar will display different menu items based on your role:

- **Admin**: Full access to all features
- **Guru**: Access to Dashboard, Siswa, Absensi, Nilai, BK
- **BK**: Access to Dashboard and BK only

### Navigation Overview

- **Dashboard**: Overview with charts and statistics
- **Siswa**: Student data management with CRUD operations
- **Absensi**: Student attendance tracking
- **Nilai**: Grade management
- **BK**: Bimbingan Konseling (Counseling) services
- **Users**: User management (Admin only)
- **Analytics**: Advanced charts and data analysis (Admin only)
- **Data Grid**: Sortable, filterable table with export functionality (Admin only)
- **Settings**: User profile and preferences management (Admin only)

## API Integration

The application is designed to work with a backend API. To integrate with your own backend:

1. Update the `baseURL` in `src/utils/api.js`
2. Implement proper authentication endpoints
3. Update API calls in services to match your API structure
4. Configure CORS on your backend

## Security Best Practices

1. **Authentication**: Replace mock authentication with real JWT-based auth
2. **Environment Variables**: Store sensitive data in `.env` files
3. **HTTPS**: Always use HTTPS in production
4. **Rate Limiting**: Implement rate limiting on API endpoints
5. **Input Validation**: Server-side validation in addition to client-side
6. **CORS**: Configure CORS properly on your backend
7. **Role Validation**: Always validate user roles on the server side

## Customization

### Theme Colors

Edit `tailwind.config.js` to customize the color scheme:

```javascript
theme: {
  extend: {
    colors: {
      primary: {
        // Your custom colors
      }
    }
  }
}
```

### Add New Features

1. Create a new feature folder in `src/features/`
2. Create page components in `src/pages/` or `src/features/[feature]/pages/`
3. Add the route in `src/App.jsx` with appropriate RoleGuard
4. Add navigation link in `src/components/layout/Sidebar.jsx`

## Docker Support

This project includes comprehensive Docker support with Nginx reverse proxy for both development and production environments.

### Quick Start

```bash
# Development with HMR and Nginx
docker-compose -f docker-compose.dev.yaml up --build

# Production build with optimizations
docker-compose -f docker-compose.prod.yaml up --build
```

### Features

**Development Environment:**
- Vite dev server with Hot Module Replacement (HMR)
- Nginx reverse proxy with WebSocket support
- Live code updates via volume mounting
- Security headers and rate limiting

**Production Environment:**
- Multi-stage optimized build
- Static file serving with Nginx
- Gzip compression
- Health checks
- API proxy caching
- SSL/HTTPS ready

See [DOCKER.md](./DOCKER.md) for detailed Docker documentation, including:
- Setup instructions
- SSL/HTTPS configuration
- Troubleshooting guide
- Performance optimization
- Security best practices
- Monitoring and scaling

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## License

MIT License - feel free to use this template for your projects.

## Support

For issues and questions, please open an issue on GitHub.
