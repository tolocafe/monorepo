/**
 * Build a Map from an array using a key extractor function
 */
export function buildIndexMap<T, K>(
	items: T[] | undefined,
	getKey: (item: T) => K,
): Map<K, T> {
	const map = new Map<K, T>()
	if (!items) return map

	for (const item of items) {
		map.set(getKey(item), item)
	}
	return map
}

/**
 * Build a Map from an array with a custom value extractor
 */
export function buildLookupMap<T, K, V>(
	items: T[] | undefined,
	getKey: (item: T) => K,
	getValue: (item: T) => V,
): Map<K, V> {
	const map = new Map<K, V>()
	if (!items) return map

	for (const item of items) {
		map.set(getKey(item), getValue(item))
	}
	return map
}
