/*
watch api 的 用法比较多
常见的写法就是监控一个函数的返回值，根据返回值的变化触发对应的函数

watch可以传递一个响应式的对象，可以监控到对象的变化触发回调

watch = effect + 包装
watchEffect = effect

 */
import { isFunction, isObject } from "../../shared/src/index.js"
import { isReactive } from "./reactive.js"
import {ReactiveEffect} from "./effect.js";
// watch的特点就是把函数进行依赖的收集，属性发生变化，就会执行对应的回调函数 effect + scheduler


// 等价于深拷贝 seen 用于标记，防止死循环
function traverse(value, seen = new Set()) {
    if (!isObject(value)) {
        return value
    }

    // 如果已经循环了，这个对象，那么在循环的虎牙就会导致死循环，案例就是window.window.window
    if (seen.has(value)) {
        return value
    }
    seen.add(value)

    for (const key in value) {
        // 这块就是进行取值了，取属性
        // 这块遍历了一个对象之中的所有的属性，进而触发 属性的 getter
        traverse(value[key], seen)
    }
    return value
}


export function dowatch(source, cb, options) {
    // 1) source 要不就是响应式的对象
    // 2)  或者是一个函数
    // 数组等形式的先不考虑
    let getter = null
    if (isReactive(source)) {
        // 对象的情况 effect 要求传入的是一个函数，那么我们需要进行包装一下
        // 如果是直接的state ，是不可以的，() => state 没有进行任何的取属性的操作
        // 源码之中，如果是这样写的话，就是监控所有的属性，所以不建议这样写
        // 这样的话就需要对这个对象进行遍历，然后全部的取值
        getter = () => traverse(source)
    } else if (isFunction(source)) {
        // 函数的情况
        getter = source
    }

    let oldVal = null


    let clear = null
    const onCleanup = fn => {
        clear = fn
    }
    const job = () => {
        if (cb) {
            const newVal = effect.run()
            if (clear) {
                clear() // 下次执行的时候将上次的执行一次
            }
            cb(newVal, oldVal, onCleanup)
            oldVal = newVal
        } else {
            effect.run() // watchEffect 只需要运行自身就可以了
        }
    }
    const effect = new ReactiveEffect(getter, job, "watch")
    oldVal = effect.run() // 会让属性和effect关联在一起
}
export function watch(source, cb, options) {
    return dowatch(source, cb, options)
}

export function watchEffect(source, options) {
    return dowatch(source, null, options)
}











