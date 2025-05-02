export function serializeDates(obj) {
  if (Array.isArray(obj)) {
    return obj.map(serializeDates);
  }
  if (obj && typeof obj === 'object') {
    const newObj = {};
    for (const key in obj) {
      if (!Object.prototype.hasOwnProperty.call(obj, key)) continue;
      const value = obj[key];
      // Преобразуем строки, похожие на дату, в Date
      if (
        typeof value === 'string' &&
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/.test(value)
      ) {
        newObj[key] = new Date(value);
      } else {
        newObj[key] = serializeDates(value);
      }
    }
    return newObj;
  }
  return obj;
} 