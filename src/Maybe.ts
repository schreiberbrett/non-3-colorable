export type Maybe<T> = {
    name: 'Nothing'
} | {
    name: 'Just'
    value: T
}

export function nothing<T>(): Maybe<T> {
    return {name: 'Nothing'}
}

export function just<T>(value: T): Maybe<T> {
    return {name: 'Just', value}
}