import {isObject} from "../../shared/src/index.js";
import { reactive } from "./reactive.js";
import {trackEffect, triggerEffect} from "./effect.js";

export function isRef(value) {
    return !!(value && value.__v_isRef)
}

// ref 处理的是基本数据类型
export function toReactive(value) {
    return isObject(value) ? reactive(value) : value
}
class RefImpl {
    _value = null
    rawValue = null
    dep = new Set()
    __v_isRef = true // 表示后续我们可以增加拆包的逻辑
    constructor(rawValue) {
        this.rawValue = rawValue
        this._value = toReactive(rawValue)
    }

    get value() {
        console.log("ref")
        // 取值的时候 进行依赖收集
        trackEffect(this.dep)
        return this._value
    }

    set value(newVal) {
        if (newVal !== this.rawValue) {
            this.rawValue = newVal
            this._value = toReactive(newVal)
            triggerEffect(this.dep)
        }
    }
}

export function ref(value) {
    return new RefImpl(value)
}

class ObjectRefImpl {
    // 将某个属性转换为ref
    __v_isRef = true // 表示后续我们可以增加拆包的逻辑
    constructor(object, key) {
        this._object = object
        this._key = key
    }

    get value() {
        console.log(this._object, this._key, 51, activeEffect12, 51, '----------------')
        return this._object[this._key]
    }

    set value(newVal) {
        this._object[this._key] = newVal
    }
}
export function toRef(object, key) {
    return new ObjectRefImpl(object, key)
}
export function toRefs(object) {
    // console.log(activeEffect12, '64444----')
    // object 此时会有两种情况：数组 / 对象
    const ret = Array.isArray(object) ? new Array(pbject.length) : Object.create(null)

    for (let key in object) {
        ret[key] = toRef(object, key)
    }

    // console.log(activeEffect12, 'toRefs')

    return ret
}


export function proxyRefs(object) {
    return new Proxy(object, {
        get(target, key, receiver) {
            // debugger
            // console.log(activeEffect12, 76, key)
            console.log(target, key, 79)
            const v = Reflect.get(target, key, receiver)
            // const v1 = target[key]
            // console.log(v, v1)

            if (isRef(v)) {
                // console.log(activeEffect12, 89, key)
                return v.value
            } else {
                return v
            }
            // return isRef(v) ? v.value : v
        },
        set(target, key, newVal, receiver) {
            const oldVal = Reflect.get(target, key, receiver)
            // 如果是给ref赋值，应该是给他的.value 进行赋值
            if (isRef(oldVal)) {
                oldVal.value = newVal
                return true
            } else {
                // 其他的情况下直接赋值就可以了
                return Reflect.set(target, key, newVal, receiver)
            }
        }
    })
}







