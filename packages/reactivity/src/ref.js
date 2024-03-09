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
        this.object = object
        this.key = key
    }

    get value() {
        return this.object[this.key]
    }

    set value(newVal) {
        this.object[this.key] = newVal
    }
}
export function toRef(object, key) {
    return new ObjectRefImpl(object, key)
}
export function toRefs(object) {
    // object 此时会有两种情况：数组 / 对象
    const ret = Array.isArray(object) ? new Array(pbject.length) : Object.create(null)

    for (let key in object) {
        ret[key] = toRef(object, key)
    }

    return ret
}


export function proxyRefs(object) {
    return new Proxy(object, {
        get(target, key, receiver) {
            const v = Reflect.get(target, key, receiver)
            return isRef(v) ? v.value : v
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







