export default class Collection<K, V> extends Map<K, V> {
  _filter(options: Partial<V>): V[] {
    const values = this.fetch();

    return values.filter((dataObj) => {
      return Object.entries(options).every(([key, value]) => {
        let dataKey = dataObj[key];
        let val = value;

        // If its an array
        if (Array.isArray(dataKey)) {
          return (val as string[] | number[]).some((searchValue) =>
            dataKey.includes(searchValue)
          );
        }

        // Make both lowercase if they are strings
        val = typeof value === "string" ? value.toLowerCase() : value;
        dataKey = typeof dataKey === "string" ? dataKey.toLowerCase() : dataKey;
        return dataKey == val;
      });
    });
  }

  fetch(options: Partial<V> | null = null): V[] {
    if (options === null) return Array.from(this.values());
    return this._filter(options);
  }

  fetchOne(options: Partial<V>): V | null {
    const [firstResult = null] = this._filter(options);
    return firstResult;
  }
}
