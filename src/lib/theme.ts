export const THEME_STORAGE_KEY = 'theme'

/**
 * Runs before first paint (inlined in <head>) so the page never flashes the wrong theme.
 * Saved choice wins; otherwise follow the OS preference.
 */
export const themeInitScript = `(function(){try{var t=localStorage.getItem('${THEME_STORAGE_KEY}');var d=t?t==='dark':matchMedia('(prefers-color-scheme: dark)').matches;document.documentElement.dataset.theme=d?'dark':'light'}catch(e){document.documentElement.dataset.theme='light'}})()`

export function toggleTheme() {
  const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark'
  document.documentElement.dataset.theme = next
  try {
    localStorage.setItem(THEME_STORAGE_KEY, next)
  } catch {
    // skip: storage blocked (private mode); theme still applies for this page view
  }
}
