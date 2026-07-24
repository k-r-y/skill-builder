export const saveState = (key, state) => {
  try {
    const serializedState = JSON.stringify(state);
    localStorage.setItem(key, serializedState);
  } catch (err) {
    console.error("Error saving state to localStorage:", err);
  }
};

export const loadState = (key, defaultState) => {
  try {
    const serializedState = localStorage.getItem(key);
    if (serializedState === null) {
      return defaultState;
    }
    return JSON.parse(serializedState);
  } catch (err) {
    console.error("Error loading state from localStorage:", err);
    return defaultState;
  }
};
