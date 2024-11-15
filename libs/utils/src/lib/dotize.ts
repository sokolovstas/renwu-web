/**
 * From t = {data: {used:1, total:2}, cache: {used: 3, total: 5}}
 * create "dotized" one-depth object {data.used: 1, data.total: 2, cache.used: 3, cache.total: 5}
 */
export function dotize(jsonobj: any, prefix?: string) {
  let newobj: any = {};

  function recurse(o: any, p: string, isArrayItem?: boolean) {
    for (const f in o) {
      if (!Object.hasOwn(o, f)) {
        continue;
      }

      if (o[f] && typeof o[f] === 'object') {
        if (Array.isArray(o[f]))
          newobj = recurse(o[f], (p ? p + '.' : '') + f, true);
        // array
        else {
          if (isArrayItem) newobj = recurse(o[f], (p ? p : '') + '[' + f + ']');
          // array item object
          else newobj = recurse(o[f], (p ? p + '.' : '') + f); // object
        }
      } else {
        if (isArrayItem) newobj[p + '[' + f + ']'] = o[f];
        // array item primitive
        else newobj[p + '.' + f] = o[f]; // primitive
      }
    }
    return newobj;
  }

  return recurse(jsonobj, prefix);
}
export function setFromDotize(obj: any, overrides: Record<string, any>): void {
  for (const key in overrides) {
    setObjectValue(obj, key, overrides[key]);
  }
}

export function setObjectValue(
  obj: any,
  dotNotation: string,
  value: any,
): void {
  const keys = dotNotation.split('.');
  let current = obj;

  keys.forEach((key, index) => {
    if (index === keys.length - 1) {
      current[key] = value;
    } else {
      current[key] = current[key] || {};
      current = current[key];
    }
  });
}
export function getObjectValue(obj: any, dotNotation: string): any {
  const keys = dotNotation.split('.');
  let current = obj;

  keys.forEach((key) => {
    if (current[key]) {
      current = current[key];
    } else {
      return;
    }
  });
  return current;
}
