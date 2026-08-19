import { AppSettings } from '../types';

export type ThemeMode = AppSettings['theme'];

export const THEME_COLORS = {
  light: '#F2F2F7',
  dark: '#000000',
} as const;

/**
 * Returns whether the device OS / browser prefers dark mode.
 */
export function getSystemIsDark(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
}

/**
 * Resolves whether the current theme mode evaluates to dark.
 */
export function resolveIsDark(theme: ThemeMode): boolean {
  if (theme === 'dark') return true;
  if (theme === 'light') return false;
  return getSystemIsDark();
}

/**
 * Immediately applies the theme to the DOM, root elements, and all browser/OS
 * meta tags (theme-color, color-scheme, apple-mobile-web-app-status-bar-style).
 * 
 * Crucially on iOS Safari and Standalone PWAs (Webkit), mutating existing meta tag
 * attributes does not reliably trigger an OS status bar redraw. Removing old meta
 * elements and appending freshly created ones forces WebKit to dispatch the DOM
 * mutation event and repaint the status bar and browser bars immediately without reload.
 */
export function applyTheme(theme: ThemeMode): boolean {
  if (typeof document === 'undefined') return false;

  const isDark = resolveIsDark(theme);
  const activeColor = isDark ? THEME_COLORS.dark : THEME_COLORS.light;
  const colorScheme = isDark ? 'dark' : 'light';
  const statusBarStyle = isDark ? 'black-translucent' : 'default';

  const root = document.documentElement;
  const body = document.body;

  // 1. Update root and body classes
  if (isDark) {
    root.classList.add('dark');
    if (body) body.classList.add('dark');
  } else {
    root.classList.remove('dark');
    if (body) body.classList.remove('dark');
  }

  // 2. Update direct CSS color-scheme and background-color styles for immediate rendering
  root.style.colorScheme = colorScheme;
  root.style.backgroundColor = activeColor;
  if (body) {
    body.style.colorScheme = colorScheme;
    body.style.backgroundColor = activeColor;
  }

  // 3. Remove all existing theme-related meta tags to force WebKit (iOS/Safari) to re-evaluate
  const existingMetas = document.querySelectorAll(
    'meta[name="theme-color"], meta[name="color-scheme"], meta[name="apple-mobile-web-app-status-bar-style"]'
  );
  existingMetas.forEach((el) => el.remove());

  const head = document.head || document.getElementsByTagName('head')[0];
  if (head) {
    // 4. Create and inject status bar style meta tag
    const statusMeta = document.createElement('meta');
    statusMeta.name = 'apple-mobile-web-app-status-bar-style';
    statusMeta.content = statusBarStyle;
    statusMeta.id = 'status-bar-style-meta';
    head.appendChild(statusMeta);

    // 5. Create and inject color-scheme meta tag
    const schemeMeta = document.createElement('meta');
    schemeMeta.name = 'color-scheme';
    schemeMeta.content = theme === 'system' ? 'light dark' : colorScheme;
    schemeMeta.id = 'color-scheme-meta';
    head.appendChild(schemeMeta);

    // 6. Create and inject theme-color meta tags
    if (theme === 'system') {
      const lightMeta = document.createElement('meta');
      lightMeta.name = 'theme-color';
      lightMeta.media = '(prefers-color-scheme: light)';
      lightMeta.content = THEME_COLORS.light;
      head.appendChild(lightMeta);

      const darkMeta = document.createElement('meta');
      darkMeta.name = 'theme-color';
      darkMeta.media = '(prefers-color-scheme: dark)';
      darkMeta.content = THEME_COLORS.dark;
      head.appendChild(darkMeta);

      const fallbackMeta = document.createElement('meta');
      fallbackMeta.name = 'theme-color';
      fallbackMeta.content = activeColor;
      fallbackMeta.id = 'theme-color-meta';
      head.appendChild(fallbackMeta);
    } else {
      // Override both media queries and general meta with activeColor
      const lightMeta = document.createElement('meta');
      lightMeta.name = 'theme-color';
      lightMeta.media = '(prefers-color-scheme: light)';
      lightMeta.content = activeColor;
      head.appendChild(lightMeta);

      const darkMeta = document.createElement('meta');
      darkMeta.name = 'theme-color';
      darkMeta.media = '(prefers-color-scheme: dark)';
      darkMeta.content = activeColor;
      head.appendChild(darkMeta);

      const mainMeta = document.createElement('meta');
      mainMeta.name = 'theme-color';
      mainMeta.content = activeColor;
      mainMeta.id = 'theme-color-meta';
      head.appendChild(mainMeta);
    }
  }

  // 7. Micro-trigger WebKit compositor repaint for status bar and window chrome
  root.style.transform = 'translateZ(0)';
  requestAnimationFrame(() => {
    root.style.transform = '';
  });

  return isDark;
}

/**
 * Smoothly transitions the theme using View Transitions API when available,
 * or smooth CSS transitions without any page reload.
 */
export function applyThemeWithTransition(theme: ThemeMode, onApply?: (isDark: boolean) => void): boolean {
  if (typeof document === 'undefined') return false;

  const isDark = resolveIsDark(theme);

  // If browser supports View Transitions API (Safari 18+, Chrome, Edge), use it for native smooth animation
  if ('startViewTransition' in document && typeof (document as unknown as { startViewTransition?: Function }).startViewTransition === 'function') {
    (document as unknown as { startViewTransition: (cb: () => void) => void }).startViewTransition(() => {
      applyTheme(theme);
      if (onApply) onApply(isDark);
    });
    return isDark;
  }

  // Fallback: apply temporary transition class for smooth CSS interpolation
  const root = document.documentElement;
  root.classList.add('theme-transitioning');
  applyTheme(theme);
  if (onApply) onApply(isDark);

  setTimeout(() => {
    root.classList.remove('theme-transitioning');
  }, 350);

  return isDark;
}
