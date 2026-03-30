
/**
 * Persistence service to handle saving and loading state to localStorage
 */

export const saveState = (key: string, state: any) => {
  try {
    const serializedState = JSON.stringify(state);
    localStorage.setItem(key, serializedState);
  } catch (err) {
    console.error(`Error saving state for key ${key}:`, err);
  }
};

export const loadState = <T>(key: string, defaultValue: T): T => {
  try {
    const serializedState = localStorage.getItem(key);
    if (serializedState === null) {
      return defaultValue;
    }
    return JSON.parse(serializedState) as T;
  } catch (err) {
    console.error(`Error loading state for key ${key}:`, err);
    return defaultValue;
  }
};

export const clearState = (key: string) => {
  try {
    localStorage.removeItem(key);
  } catch (err) {
    console.error(`Error clearing state for key ${key}:`, err);
  }
};

export const resetAllState = () => {
  try {
    // Save the session to restore it after clearing
    const session = localStorage.getItem('nam_ai_auth_session');
    
    // Clear all localStorage
    localStorage.clear();
    
    // Restore the session if it existed
    if (session) {
      localStorage.setItem('nam_ai_auth_session', session);
    }
    
    // Clear all sessionStorage (including key rotation index)
    sessionStorage.clear();
    
    // Reload the page to reset all states in memory
    window.location.href = window.location.origin + window.location.pathname;
  } catch (err) {
    console.error('Error resetting all state:', err);
    // Fallback reload
    window.location.reload();
  }
};
