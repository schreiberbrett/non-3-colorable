export class BiMap<K, V> {
    private keyToValue: Map<K, V>
    private valueToKeys: Map<V, K[]>
    
    constructor(map: Map<K, V>) {
        this.keyToValue = new Map()
        this.valueToKeys = new Map()

        for (let [key, value] of map) {
            this.keyToValue.set(key, value)

            this.valueToKeys.set(
                value,
                this.valueToKeys.has(value)
                    ? this.valueToKeys.get(value).concat([key])
                    : [key]
            )
        }
    }

    public get(key: K): V {
        return this.keyToValue.get(key)
    }

    public keysWith(value: V): K[] {
        return this.valueToKeys.has(value) ? this.valueToKeys.get(value) : []
    }
}