export const isObject = val => {
    return val != null && typeof val === 'object'
}


export const isFunction = val => {
    return typeof val === 'function'
}


export function isString(value) {
    return typeof value === 'string'
}

export * from "./shapeFlag.js"