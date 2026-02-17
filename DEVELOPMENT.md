# Development Guide

## 🔥 Hot Reload Development (No Rebuild Needed!)

This project is configured for instant code updates in Docker - **no container rebuild required** when you change your code!

### How It Works

```
Your Computer          Docker Container
    ↓                       ↓
[Edit Code] ────────→ [Volume Mount]
    ↓                       ↓
[Save File] ────────→ [Vite Detects]
    ↓                       ↓
[Changes]  ←────────  [HMR Update]
```

### Quick Start

1. **Start Development Environment**
```bash
docker-compose -f docker-compose.dev.yaml up
```

2. **Edit Your Code**
   - Open any file in `src/`
   - Make changes
   - **Save** (Ctrl+S / Cmd+S)
   - See changes **instantly** in browser! 🚀

3. **That's It!**
   - No rebuild needed
   - No container restart needed
   - Just save and watch the magic happen ✨

### Configuration Details

**Vite Config** (`vite.config.js`):
```javascript
server: {
  host: true,           // Allow external connections
  watch: {
    usePolling: true,   // Reliable file watching in Docker
  },
  hmr: {
    clientPort: 5173,   // WebSocket for HMR
  },
}
```

**Docker Compose** (`docker-compose.dev.yaml`):
```yaml
volumes:
  - .:/app              # Mount entire project
  - /app/node_modules   # Exclude node_modules
```

### When Do I Need to Rebuild?

**Only when you modify `package.json`:**

```bash
# After adding/removing npm packages
docker-compose -f docker-compose.dev.yaml down
docker-compose -f docker-compose.dev.yaml up --build
```

### Testing Hot Reload

1. Start Docker containers
2. Open http://localhost (or http://localhost:5173)
3. Open `src/pages/Dashboard.jsx`
4. Change some text:
```jsx
<h1 className="text-2xl font-bold">Dashboard</h1>
// Change to:
<h1 className="text-2xl font-bold">My Dashboard 🚀</h1>
```
5. Save the file
6. Watch browser update **instantly!**

## 📝 Common Development Tasks

### Making Code Changes

**Files that trigger instant reload:**
- ✅ All `.jsx` files in `src/`
- ✅ All `.js` files in `src/`
- ✅ CSS files (`src/index.css`)
- ✅ Component files
- ✅ Page files
- ✅ Store files
- ✅ Utility files

**Files that require rebuild:**
- ⚠️ `package.json` (dependency changes)
- ⚠️ `vite.config.js` (config changes)
- ⚠️ `tailwind.config.js` (config changes)
- ⚠️ Dockerfile changes

### Adding New Features

1. **Create new component:**
```bash
# No need to stop Docker!
# Just create the file and start coding
```

2. **Import and use:**
```jsx
import MyNewComponent from './components/MyNewComponent'

// Use it
<MyNewComponent />
```

3. **See it live:**
   - Save file
   - Browser updates automatically
   - That's it! 🎉

### Debugging

**View logs:**
```bash
# All logs
docker-compose -f docker-compose.dev.yaml logs -f

# Just app logs
docker-compose -f docker-compose.dev.yaml logs -f app
```

**Access container:**
```bash
docker-compose -f docker-compose.dev.yaml exec app sh
```

**Install new package:**
```bash
# Add to package.json, then:
docker-compose -f docker-compose.dev.yaml exec app npm install
# OR rebuild:
docker-compose -f docker-compose.dev.yaml up --build
```

## 🎯 Development Workflow

### Standard Workflow

```bash
# 1. Start containers (first time or after package.json changes)
docker-compose -f docker-compose.dev.yaml up --build

# 2. Develop normally
# - Edit code in your favorite editor
# - Save files
# - See changes instantly
# - No need to restart or rebuild

# 3. When done
docker-compose -f docker-compose.dev.yaml down
```

### Daily Workflow

```bash
# Morning: Start containers
docker-compose -f docker-compose.dev.yaml up -d

# All day: Code, save, see changes
# No commands needed! Just code!

# Evening: Stop containers
docker-compose -f docker-compose.dev.yaml down
```

## 🚀 Performance Tips

### Fast Reload
- Changes typically reflect in **< 1 second**
- HMR preserves component state
- No full page reload needed

### Large Projects
If hot reload feels slow:
1. Clear browser cache
2. Restart containers:
```bash
docker-compose -f docker-compose.dev.yaml restart app
```

## 🐛 Troubleshooting

### Changes Not Appearing?

1. **Check if Vite is running:**
```bash
docker-compose -f docker-compose.dev.yaml logs app
# Should see: "VITE ready in XXXms"
```

2. **Hard refresh browser:**
   - Chrome/Edge: `Ctrl+Shift+R` (Windows) / `Cmd+Shift+R` (Mac)
   - Firefox: `Ctrl+F5` (Windows) / `Cmd+Shift+R` (Mac)

3. **Check file is being watched:**
```bash
# Changes to these files work instantly:
src/**/*.jsx
src/**/*.js
src/**/*.css
```

4. **Restart if needed:**
```bash
docker-compose -f docker-compose.dev.yaml restart app
```

### Still Not Working?

```bash
# Nuclear option: Full rebuild
docker-compose -f docker-compose.dev.yaml down -v
docker-compose -f docker-compose.dev.yaml up --build
```

## 💡 Pro Tips

1. **Use VSCode with Docker extension**
   - See container logs in real-time
   - Easy container management

2. **Keep terminal open**
   - Watch Vite logs for instant feedback
   - See compilation errors immediately

3. **Browser DevTools**
   - Keep console open to see HMR updates
   - Check for any runtime errors

4. **Multiple screens**
   - Code on one screen
   - Browser on another
   - See changes as you type!

## 📚 Learn More

- **Docker Guide**: See [DOCKER.md](./DOCKER.md)
- **Quick Start**: See [QUICKSTART.md](./QUICKSTART.md)
- **Main Docs**: See [README.md](./README.md)

---

Happy coding! 🎉 Remember: **Save your file, see the change!** No rebuild needed! 🚀
