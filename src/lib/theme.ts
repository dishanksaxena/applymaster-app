/**
 * Theme handling for ApplyMaster.
 *
 * Storage contract (unchanged from the previous build, so existing users
 * keep their saved preference):
 *
 *     localStorage['theme'] === 'dark'   -> explicit dark
 *     localStorage['theme'] === 'light'  -> explicit light
 *     absent                             -> follow the OS
 *
 * The class on <html> mirrors that:
 *     .dark-theme   explicit dark
 *     .light-theme  explicit light   (needed so an explicit light choice
 *                                     can override a dark OS setting)
 *     neither       system, resolved by the media query in globals.css
 */

export type Theme = 'light' | 'dark' | 'system'

export const THEME_STORAGE_KEY = 'theme'

/**
 * Inlined into <head> and executed synchronously, before first paint.
 *
 * This is what fixes the flash: the old build restored the theme from a
 * useEffect in the dashboard layout, which necessarily runs after the
 * first paint, so every load flashed light before switching to dark.
 * Marketing pages had no restore at all.
 */
export const THEME_INIT_SCRIPT = `(function(){try{
var t=localStorage.getItem('${THEME_STORAGE_KEY}');
var c=document.documentElement.classList;
c.remove('light-theme','dark-theme');
if(t==='dark')c.add('dark-theme');
else if(t==='light')c.add('light-theme');
}catch(e){}})();`

/** Read the stored preference. Safe on the server and with storage blocked. */
export function getStoredTheme(): Theme {
  if (typeof window === 'undefined') return 'system'
  try {
    const raw = localStorage.getItem(THEME_STORAGE_KEY)
    return raw === 'dark' || raw === 'light' ? raw : 'system'
  } catch {
    return 'system'
  }
}

/** Apply a preference to <html> and persist it. */
export function applyTheme(theme: Theme): void {
  if (typeof document === 'undefined') return

  const classes = document.documentElement.classList
  classes.remove('light-theme', 'dark-theme')
  if (theme === 'dark') classes.add('dark-theme')
  else if (theme === 'light') classes.add('light-theme')

  try {
    if (theme === 'system') localStorage.removeItem(THEME_STORAGE_KEY)
    else localStorage.setItem(THEME_STORAGE_KEY, theme)
  } catch {
    /* storage unavailable; the class change still applies for this session */
  }
}

/** What the user actually sees right now, resolving 'system'. */
export function resolveTheme(theme: Theme): 'light' | 'dark' {
  if (theme !== 'system') return theme
  if (typeof window === 'undefined' || !window.matchMedia) return 'light'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

/** Cycle order for the toggle button. */
export const NEXT_THEME: Record<Theme, Theme> = {
  system: 'light',
  light: 'dark',
  dark: 'system',
}

export const THEME_LABEL: Record<Theme, string> = {
  system: 'Theme: match system. Switch to light.',
  light: 'Theme: light. Switch to dark.',
  dark: 'Theme: dark. Switch to system.',
}
