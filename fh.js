/**
 * Retrieves a nested value from an object using a dot-separated path.
 *
 * @param {Object} obj - The object to retrieve the value from.
 * @param {string} path - The dot-separated path (e.g., 'profile.name').
 * @returns {string|number|undefined} - The retrieved value.
 */
function getValueByPath(obj, path) {
  return path.split('.').reduce((acc, key) => acc?.[key], obj);
}

/**
 * Determines the sort group of a string:
 * 0 = starts with a letter (A–Z)
 * 1 = starts with a digit (0–9)
 * 2 = starts with other symbol
 * 3 = missing/empty value (always last)
 *
 * @param {string} value
 * @returns {number}
 */
function getSortGroup(value) {
  if (!value) return 3;
  const first = value[0];
  if (/[a-z]/i.test(first)) return 0;
  if (/\d/.test(first)) return 1;
  return 2;
}

/**
 * Creates a comparator function for Array.prototype.sort.
 * Sorts objects based on the first valid (non-empty) value from specified property paths.
 * Supports strings and numbers, nested properties, and sorts with custom group logic:
 * letters → digits → symbols → missing.
 *
 * @param {string | string[]} keyOrKeys - Property path(s) to use in order of priority.
 * @returns {(a: Object, b: Object) => number}
 */
export function createDeepPropertySorter(keyOrKeys) {
  const keys = Array.isArray(keyOrKeys) ? keyOrKeys : [keyOrKeys];

  return (a, b) => {
    /**
     * Extract the first valid (non-empty) value and convert to lowercase string.
     * Supports both string and numeric values.
     *
     * @param {Object} item
     * @returns {string}
     */
    const getFirstValid = (item) => {
      for (const key of keys) {
        const value = getValueByPath(item, key);

        if (typeof value === 'number') {
          return String(value);
        }

        if (typeof value === 'string' && value.trim()) {
          return value.trim().toLowerCase();
        }
      }
      return ''; // Will be treated as missing (group 3)
    };

    const aVal = getFirstValid(a);
    const bVal = getFirstValid(b);

    const aGroup = getSortGroup(aVal);
    const bGroup = getSortGroup(bVal);

    // Sort by group first (letter < digit < symbol < missing)
    if (aGroup !== bGroup) return aGroup - bGroup;

    // Same group → locale-aware comparison (German, case-insensitive)
    return aVal.localeCompare(bVal, 'de-DE', { sensitivity: 'base' });
  };
}