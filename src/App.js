/**
 * Retrieves a nested value from an object using a dot-separated path.
 *
 * @param {Object} obj - The object to retrieve the value from.
 * @param {string} path - The dot-separated path (e.g., 'profile.name').
 * @returns {string|undefined} - The retrieved value, or undefined if not found.
 */
function getValueByPath(obj, path) {
  return path.split('.').reduce((acc, key) => acc?.[key], obj);
}

/**
 * Creates a comparator function for Array.prototype.sort that sorts
 * objects based on the first non-empty string value from specified property paths.
 *
 * @param {string | string[]} keyOrKeys - A string or array of strings representing property paths.
 * @returns {(a: Object, b: Object) => number} - A comparator function to be used in .sort().
 */
export function createDeepPropertySorter(keyOrKeys) {
  // Normalize input to array
  const keys = Array.isArray(keyOrKeys) ? keyOrKeys : [keyOrKeys];

  return (a, b) => {
    /**
     * Extract the first valid (non-empty, trimmed) value from the object.
     *
     * @param {Object} item
     * @returns {string}
     */
    const getFirstValid = (item) => {
      for (const key of keys) {
        const value = getValueByPath(item, key);
        if (typeof value === 'string' && value.trim()) {
          return value.trim().toLowerCase();
        }
      }
      return '';
    };

    const aVal = getFirstValid(a);
    const bVal = getFirstValid(b);

    // Check if the string starts with a letter (to push special characters to the bottom)
    const aIsLetter = /^[a-z]/i.test(aVal);
    const bIsLetter = /^[a-z]/i.test(bVal);

    if (aIsLetter && !bIsLetter) return -1;
    if (!aIsLetter && bIsLetter) return 1;

    // Compare alphabetically (case-insensitive, German locale)
    return aVal.localeCompare(bVal, 'de-DE', { sensitivity: 'base' });
  };
}