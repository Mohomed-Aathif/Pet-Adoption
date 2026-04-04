# Pet Adoption Frontend 🐾

A modern, responsive React frontend for the Pet Adoption platform with Tailwind CSS, dark/light mode toggle, and a complete UI component library.

## Features ✨

- **Responsive Design**: Mobile-first approach with breakpoints at sm (640px), md (768px), lg (1024px), xl (1280px)
- **Dark/Light Mode**: Toggle theme with localStorage persistence
- **Modern Navbar**: Sticky header with search, theme toggle, profile dropdown
- **Collapsible Sidebar**: Dynamic menu with submenu support, mobile-responsive
- **Tailwind CSS**: Utility-first styling for rapid development
- **Lucide Icons**: Beautiful, consistent icons throughout
- **Page Components**: Home, Pet Browse, Settings with full implementations
- **Form Components**: Responsive inputs, checkboxes, selects
- **Cards & Grids**: Flexible layouts for various content types

## Tech Stack 🛠️

```
React 18.2.0
Vite 5.0.0 (Build tool)
Tailwind CSS 3.3.0
Lucide React 0.263.1
React Router DOM 6.16.0
```

## Project Structure 📂

```
frontend/
├── public/                    # Static assets
├── src/
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Layout.jsx              Main layout wrapper
│   │   │   ├── Navbar.jsx              Top navigation bar
│   │   │   ├── Sidebar.jsx             Side navigation menu
│   │   │   ├── Header.jsx              (Existing)
│   │   │   └── Footer.jsx              (Existing)
│   │   ├── pages/
│   │   │   ├── Home.jsx                Dashboard & landing
│   │   │   ├── PetsBrowse.jsx          Pet listing with filters
│   │   │   └── Settings.jsx            User settings & preferences
│   │   ├── common/                     Reusable components
│   │   ├── forms/                      Form components
│   │   └── pages/                      Page components
│   ├── contexts/
│   │   └── ThemeContext.jsx            Dark/light mode context
│   ├── hooks/
│   │   └── useTheme.js                 Theme management hook
│   ├── services/                       API services
│   ├── store/                          State management
│   ├── utils/
│   │   └── tailwindUtils.js            Tailwind CSS utility classes
│   ├── styles/
│   │   └── index.css                   Global styles
│   ├── App.jsx                         Main app component
│   └── main.jsx                        Entry point
├── index.html                          HTML template
├── vite.config.js                      Vite configuration
├── tailwind.config.js                  Tailwind configuration
├── postcss.config.js                   PostCSS configuration
├── package.json                        Dependencies
└── .env.example                        Environment variables
```

## Quick Start 🚀

### 1. Install Dependencies

```bash
cd frontend
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
# Edit .env file as needed
# VITE_API_URL=http://localhost:8000/api/v1
```

### 3. Start Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

### 4. Build for Production

```bash
npm run build
npm run preview
```

## Theme System 🌓

### How Dark Mode Works

1. **ThemeContext** (`src/contexts/ThemeContext.jsx`):
   - Provides `isDark` state and `toggleTheme()` function
   - Persists theme preference to localStorage
   - Automatically detects system preference on first load
   - Updates document `dark` class for Tailwind

2. **useTheme Hook** (`src/hooks/useTheme.js`):
   ```javascript
   import { useTheme } from '../hooks/useTheme'
   
   function MyComponent() {
     const { isDark, toggleTheme } = useTheme()
     
     return (
       <button onClick={toggleTheme}>
         {isDark ? '☀️ Light' : '🌙 Dark'}
       </button>
     )
   }
   ```

3. **Tailwind Dark Mode Classes**:
   ```jsx
   {/* Light mode: gray-900, Dark mode: gray-100 */}
   <div className="text-gray-900 dark:text-gray-100">
     Content
   </div>
   ```

### Implementing Dark Mode in Components

```jsx
// Text colors
className="text-gray-900 dark:text-white"

// Background colors
className="bg-white dark:bg-gray-900"

// Border colors
className="border-gray-200 dark:border-gray-800"

// Hover states
className="hover:bg-gray-100 dark:hover:bg-gray-800"

// Gradient backgrounds
className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20"
```

## Responsive Design 📱

### Breakpoints

```css
Mobile:  < 640px (default)
sm:      640px and up
md:      768px and up
lg:      1024px and up (sidebar visible)
xl:      1280px and up
2xl:     1536px and up
```

### Responsive Patterns

```jsx
{/* Hidden on mobile, visible on larger screens */}
<div className="hidden sm:block md:hidden lg:flex">
  Responsive content
</div>

{/* Full width on mobile, constrained on desktop */}
<div className="px-4 sm:px-6 lg:px-8">
  Responsive padding
</div>

{/* 1 column on mobile, 2 on tablet, 3 on desktop */}
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
  {items.map(item => <Card key={item.id} {...item} />)}
</div>
```

## Key Components 🧩

### Navbar
- Sticky positioning with z-index management
- Search bar (hidden on mobile)
- Theme toggle button
- Profile dropdown menu
- Mobile menu toggle
- Responsive design with hidden/visible classes

**Location**: `src/components/layout/Navbar.jsx`

```jsx
<Navbar 
  onMenuToggle={() => setIsSidebarOpen(!isSidebarOpen)}
  isSidebarOpen={isSidebarOpen}
/>
```

### Sidebar
- Collapsible on mobile (overlay with background)
- Expandable menu items with submenus
- Badge support for notifications
- Help card section
- Sticky on desktop, modal on mobile

**Location**: `src/components/layout/Sidebar.jsx`

```jsx
<Sidebar 
  isOpen={isSidebarOpen}
  onClose={() => setIsSidebarOpen(false)}
/>
```

### Layout
- Wraps navbar and sidebar
- Manages sidebar state
- Provides spacing for main content
- Integrates footer

**Location**: `src/components/layout/Layout.jsx`

### Page Examples

#### Home (`src/components/pages/Home.jsx`)
- Hero section with CTA
- Search bar
- Statistics cards
- Featured pets grid
- Call-to-action section

#### Pets Browse (`src/components/pages/PetsBrowse.jsx`)
- Sidebar filters (type, age, size)
- Grid/List view toggle
- Pet cards with favorites
- Responsive layout
- Mock pet data with filtering

#### Settings (`src/components/pages/Settings.jsx`)
- Profile form with validation
- Notification preferences
- Theme switcher (light/dark)
- Language selector
- Account security options
- Delete account option
- Success message feedback

## Tailwind CSS Utilities 🎨

### Common Classes

```jsx
// Text styles
className="text-sm font-medium"
className="text-lg font-bold"

// Colors
className="text-gray-700 dark:text-gray-300"
className="bg-blue-600 hover:bg-blue-700"

// Spacing
className="p-4 m-2"           // padding, margin
className="gap-4"             // grid gap, flex gap

// Sizing
className="w-full h-screen"
className="max-w-2xl"

// Borders & Shadows
className="border rounded-lg"
className="shadow-lg hover:shadow-xl"

// Transitions
className="transition-colors duration-300"

// Flexbox
className="flex items-center justify-between gap-4"

// Grid
className="grid grid-cols-3 gap-4"

// Display
className="hidden sm:block"   // Responsive hiding
```

### Gradient Backgrounds

```jsx
// Simple gradients
className="bg-gradient-to-r from-blue-600 to-purple-600"

// Complex with dark mode
className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20"
```

## Environment Variables 🔐

Create `.env` file with:

```env
VITE_API_URL=http://localhost:8000/api/v1
VITE_APP_NAME=Pet Adoption Platform
VITE_ENABLE_LOGGING=true
```

Access in code:
```javascript
const apiUrl = import.meta.env.VITE_API_URL
```

## Performance Tips ⚡

1. **Code Splitting**: Use React.lazy() for page components
   ```javascript
   const Home = React.lazy(() => import('./pages/Home'))
   ```

2. **Image Optimization**: Use responsive images with srcSet
   ```jsx
   <img src="pet.jpg" srcSet="pet-small.jpg 640w, pet-large.jpg 1280w" />
   ```

3. **Component Memoization**: Wrap expensive components
   ```javascript
   export default React.memo(Component)
   ```

4. **Conditional Rendering**: Avoid rendering hidden content
   ```jsx
   {isVisible && <ExpensiveComponent />}
   ```

## Customization 🎨

### Change Primary Color

Edit `tailwind.config.js`:
```javascript
theme: {
  extend: {
    colors: {
      primary: '#3B82F6',  // Change blue to your color
    }
  }
}
```

Then use:
```jsx
className="bg-primary hover:bg-primary-dark"
```

### Add Custom Fonts

In `tailwind.config.js`:
```javascript
fontFamily: {
  sans: ['InterVar', ...defaultTheme.fontFamily.sans],
}
```

### Extend Spacing

```javascript
theme: {
  extend: {
    spacing: {
      '128': '32rem',
    }
  }
}
```

## Debugging 🐛

### Tailwind Classes Not Applied?

1. Check `content` in `tailwind.config.js` includes your files:
   ```javascript
   content: ['./src/**/*.{js,jsx,ts,tsx}']
   ```

2. Clear cache:
   ```bash
   rm -rf .next node_modules/.cache
   npm run dev
   ```

3. Use `@apply` for custom styles:
   ```css
   @layer components {
     .btn-primary {
       @apply px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700;
     }
   }
   ```

### Dark Mode Not Working?

1. Ensure ThemeProvider wraps entire app
2. Check localStorage for 'theme' key
3. Verify document has `dark` class:
   ```javascript
   document.documentElement.classList.toggle('dark')
   ```

## Browser Support 🌐

- Chrome/Edge 88+
- Firefox 87+
- Safari 14+
- Mobile browsers (current versions)

## Resources 📚

- [Tailwind CSS Docs](https://tailwindcss.com)
- [React Docs](https://react.dev)
- [Vite Docs](https://vitejs.dev)
- [Lucide Icons](https://lucide.dev)
- [React Router](https://reactrouter.com)

## Contributing 🤝

1. Follow component structure conventions
2. Use Tailwind Classes (no custom CSS in components)
3. Maintain dark mode compatibility
4. Test responsive design at sm, md, lg breakpoints
5. Use Lucide icons for consistency

## License 📄

MIT License - See LICENSE file for details

---

**Built with ❤️ for pet lovers everywhere** 🐕🐈
