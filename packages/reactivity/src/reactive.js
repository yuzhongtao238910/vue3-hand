import { mutableHandlers } from "./handler.js"
import { isObject } from "../../shared/src/index.js";
// import { activeEffect12 } from "./effect.js"


// export let activeEffect12 = null

const reactiveMap = new WeakMap()

export function reactive(value) {
    // reactive 只能处理对象类型的数据，不是对象的话不处理
    if (!isObject(value)) {
        return value
    }
    let existingProxy = reactiveMap.get(value) // 看一下这个对象是否有被代理过
    if (existingProxy) {
        return existingProxy // 代理过的话直接就会返回
    }
    if (value["__v_isReactive"]) {
        return value
    }
    // proxy 必须是一个对象
    // console.log(activeEffect12, 288888)
    const proxy = new Proxy(value, mutableHandlers) // 没有代理过的话会创建代理
    reactiveMap.set(value, proxy) // 缓存代理结果

    // 在vue3.0的时候，会创造一个反向的映射表
    // 在vue3.1以后，采用方式是如果这个对象被代理过了，说明已经被proxy拦截过啦
    // 如果target上面有属性标识的话: __v_isReactive
    return proxy
}

export function isReactive(value) {
    // 判断是否是响应式的
    return value["__v_isReactive"]
}