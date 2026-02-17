# Quick Start Guide

Get the Admin Dashboard up and running in minutes!

## 🚀 Local Development (Without Docker)

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Development Server
```bash
npm run dev
```

### 3. Open Browser
Navigate to: http://localhost:3000

### 4. Login
- Email: any valid email format
- Password: minimum 6 characters

**That's it!** 🎉

---

## 🐳 Docker Development (With Nginx)

### 1. Start Containers
```bash
docker-compose -f docker-compose.dev.yaml up --build
```

### 2. Open Browser
Navigate to: http://localhost

### 3. Login
- Email: any valid email format
- Password: minimum 6 characters

**Hot Module Replacement (HMR) works!** 🔥

---

## 📦 Production Deployment

### Build Production Image
```bash
docker-compose -f docker-compose.prod.yaml up --build
```

### Access Application
Navigate to: http://localhost

---

## 🎯 Key Features to Try

1. **Dashboard** (Home)
   - View real-time charts
   - Check statistics cards
   - Toggle dark/light theme

2. **Users Page**
   - Add new users
   - Edit existing users
   - Search and filter
   - Delete users

3. **Data Grid**
   - Sort columns
   - Filter data
   - Export to CSV
   - Pagination

4. **Analytics**
   - Multiple chart types
   - Interactive visualizations
   - Performance metrics

5. **Settings**
   - Update profile
   - Change password
   - Configure preferences

---

## 🎨 Theme Toggle

Click the moon/sun icon in the header to switch between dark and light modes.

---

## 📱 Mobile Responsive

Try opening the app on mobile or resize your browser window to see the responsive design in action!

---

## 🔧 Common Commands

```bash
# Install dependencies
npm install

# Development server
npm run dev

# Production build
npm run build

# Preview production build
npm run preview

# Docker development
docker-compose -f docker-compose.dev.yaml up

# Docker production
docker-compose -f docker-compose.prod.yaml up

# Stop Docker containers
docker-compose -f docker-compose.dev.yaml down
```

---

## 📚 Next Steps

1. **Customize**: Edit colors in `tailwind.config.js`
2. **Add Pages**: Create new pages in `src/pages/`
3. **API Integration**: Update `src/utils/api.js` with your backend URL
4. **Deploy**: Use Docker for production deployment

---

## 🆘 Need Help?

- Check [README.md](./README.md) for detailed documentation
- See [DOCKER.md](./DOCKER.md) for Docker-specific help
- Review code comments in the source files

---

## ✨ Pro Tips

1. **Use the search**: All pages have search functionality
2. **Export data**: Click export on the Data Grid page
3. **Validation works**: Try submitting empty forms
4. **API calls**: Open DevTools to see real API requests
5. **Error handling**: Try triggering errors to see error boundaries

Happy coding! 🚀
