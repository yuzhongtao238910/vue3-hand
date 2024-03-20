import { track, trigger } from "./effect.js"
import { isObject } from "../../shared/src/index.js";
import { reactive } from "./reactive.js"
import { isRef } from "./ref.js"
import { activeEffect12 } from "./effect.js"
export const mutableHandlers = {
    // 这里面的receiver就是proxy
    get(target, key, receiver) { // 我们在使用proxy的时候，需要搭配reflect来使用，用来解决this的问题
        // 取值的时候 receiver 就是代理对象
        // console.log(receiver)
        // 取值的时候，让这个属性和effect产生关系
        // effect 和 key之间是多对多的关系 ，依赖收集
        // console.log(activeEffect, key)
        // console.log("get", target, key)
        console.log(activeEffect12, 15, key)
        if (key === "__v_isReactive") {
            // console.log("apple")
            return true
        }

        if (isRef(target[key])) {
            return target[key].value
        }

        // proxy默认情况下是只代理一层的对象
        // 如果在取值的时候，发现取出来的值是对象，那么进行再次代理，返回代理后的对象
        if (isObject(target[key])) {
            return reactive(target[key])
        }


        const res = Reflect.get(target, key, receiver) // 类似于call方法，改变this的指向
        // 做--依赖收集 记录属性和当前的effect的关系
        console.log(activeEffect12, target, key)
        track(target, key)
        return res
        // return target[key]
    },
    set(target, key, newValue, receiver) {
        // 更新数据
        // target[key] = newValue
        // 找到这个属性对应的effect去执行
        // console.log("set", target, key)
        const oldValue = Reflect.get(target, key, receiver)
        const r = Reflect.set(target, key, newValue, receiver)
        if (oldValue !== newValue) {
            trigger(target, key, newValue, oldValue)
        }

        return r
    }
}