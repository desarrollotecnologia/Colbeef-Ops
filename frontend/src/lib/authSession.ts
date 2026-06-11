/**
 * Sesión solo en memoria: no persiste al recargar ni en otras pestañas.
 * El token solo existe mientras la pestaña sigue abierta sin recargar.
 */
let memoryToken: string | null = null;

export function getAuthToken(): string | null {
  return memoryToken;
}

export function setAuthToken(token: string): void {
  memoryToken = token;
}

export function clearAuthSession(): void {
  memoryToken = null;
  try {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
  } catch {
    /* ignore */
  }
}

/** Elimina tokens guardados en versiones anteriores de la app. */
export function purgeLegacyAuthStorage(): void {
  clearAuthSession();
}
