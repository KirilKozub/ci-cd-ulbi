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



import { expect } from '@open-wc/testing';
import { createDeepPropertySorter } from './your-module-path.js'; // adjust path
// getValueByPath is internal, so you can test it by extracting it separately if needed

// Manually replicate getValueByPath for isolated testing
function getValueByPath(obj, path) {
  return path.split('.').reduce((acc, key) => acc?.[key], obj);
}

describe('getValueByPath', () => {
  it('retrieves nested value correctly', () => {
    const obj = { a: { b: { c: 'value' } } };
    expect(getValueByPath(obj, 'a.b.c')).to.equal('value');
  });

  it('returns undefined for invalid path', () => {
    const obj = { a: { b: 123 } };
    expect(getValueByPath(obj, 'a.b.c')).to.be.undefined;
  });

  it('returns top-level value', () => {
    const obj = { name: 'Serhii' };
    expect(getValueByPath(obj, 'name')).to.equal('Serhii');
  });
});

describe('createDeepPropertySorter', () => {
  const data = [
    { alias: '', profile: { name: 'John' }, name: 'Alpha' },
    { alias: '#Provider', profile: { name: 'Zack' }, name: 'Zeta' },
    { alias: 'Anna', profile: { name: 'Beta' }, name: 'Bravo' },
    { name: 'Delta' },
  ];

  it('sorts by alias if present and not empty', () => {
    const sorted = [...data].sort(createDeepPropertySorter(['alias', 'profile.name', 'name']));
    const titles = sorted.map(i => i.alias || i.profile?.name || i.name);
    expect(titles).to.deep.equal(['Anna', 'John', 'Delta', '#Provider']);
  });

  it('handles string path instead of array', () => {
    const data = [
      { name: 'Beta' },
      { name: 'Alpha' },
      { name: 'Charlie' },
    ];
    const sorted = [...data].sort(createDeepPropertySorter('name'));
    const names = sorted.map(i => i.name);
    expect(names).to.deep.equal(['Alpha', 'Beta', 'Charlie']);
  });

  it('places values starting with special chars at the end', () => {
    const data = [
      { alias: '@admin' },
      { alias: 'beta' },
      { alias: '#user' },
      { alias: 'alpha' },
    ];
    const sorted = [...data].sort(createDeepPropertySorter('alias'));
    const aliases = sorted.map(i => i.alias);
    expect(aliases).to.deep.equal(['alpha', 'beta', '@admin', '#user']);
  });

  it('handles missing values gracefully', () => {
    const data = [
      {},
      { name: 'Bravo' },
      { profile: { name: 'Alpha' } },
    ];
    const sorted = [...data].sort(createDeepPropertySorter(['profile.name', 'name']));
    const result = sorted.map(i => i.profile?.name || i.name || '');
    expect(result).to.deep.equal(['Alpha', 'Bravo', '']);
  });
});