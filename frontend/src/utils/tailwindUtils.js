/**
 * Tailwind CSS class utilities for responsive design
 * Use these as reference for consistent styling
 */

// Responsive breakpoints (Tailwind defaults)
// sm: 640px
// md: 768px
// lg: 1024px
// xl: 1280px
// 2xl: 1536px

// Common responsive patterns

// Container padding
export const containerPaddingClasses = {
  mobile: 'px-4 py-8',
  tablet: 'sm:px-6 sm:py-10',
  desktop: 'lg:px-8 lg:py-12'
}

// Grid layouts
export const gridClasses = {
  auto: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4',
  twoCol: 'grid grid-cols-1 md:grid-cols-2 gap-6',
  threeCol: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4',
  fourCol: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4'
}

// Dark mode text colors
export const darkModeTextClasses = {
  primary: 'text-gray-900 dark:text-white',
  secondary: 'text-gray-700 dark:text-gray-300',
  muted: 'text-gray-600 dark:text-gray-400',
  subtle: 'text-gray-500 dark:text-gray-500'
}

// Dark mode background colors
export const darkModeBackgroundClasses = {
  primary: 'bg-white dark:bg-gray-950',
  secondary: 'bg-gray-50 dark:bg-gray-900',
  card: 'bg-white dark:bg-gray-900',
  input: 'bg-gray-100 dark:bg-gray-800'
}

// Dark mode border colors
export const darkModeBorderClasses = {
  light: 'border-gray-200 dark:border-gray-800',
  medium: 'border-gray-300 dark:border-gray-700',
  dark: 'border-gray-400 dark:border-gray-600'
}

// Button variants
export const buttonClasses = {
  primary: 'bg-blue-600 hover:bg-blue-700 text-white',
  secondary: 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600',
  danger: 'bg-red-600 hover:bg-red-700 text-white',
  ghost: 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
}

// Card styling
export const cardClasses = 'bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-md transition-shadow'

// Common spacing utilities
export const spacing = {
  xs: 'p-2',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-6',
  xl: 'p-8'
}
