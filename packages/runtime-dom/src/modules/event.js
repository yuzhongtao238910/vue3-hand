function createInvoker(nextVal) {
    const fn = (evt) => {
        fn.value(evt)
    }
    fn.value = nextVal // 真实的方法，后续修改方法 只需要修改fn.value属性就可以了
    return fn
}
export function patchEvent(el, rawName, nextVal) { // fn1 fn2

    // 正常的思路是：先将之前的解绑，然后重新绑定，但是这样的性能不好


    // 这样就不需要更换绑定函数了
    // const fn = () => { fn.value() }
    // fn.value = fn1
    // fn.value = fn2
    // el.addEventListener(key.slice(2).toLowerCase, fn)

    // vue event invoker vue 事件调用
    const invokers = el._vei || (el._vei = {}) // 缓存列表
    let eventName = rawName.slice(2).toLowerCase()
    // 看一下是否绑定过这个事件
    const existingInvoker = invokers[eventName]
    if (nextVal && existingInvoker) { // 有新值 并且绑定过事件 应该是换绑了
        existingInvoker.value = nextVal
    } else {
        // 这里表示没有绑定过
        if (nextVal) {
            // 有没有新的事件
            const invoker = invokers[eventName] = createInvoker(nextVal)
            el.addEventListener(eventName, invoker)
        } else if (existingInvoker){ // 没有新值，但是之前绑定过事件了
            // 没有新的事件
            el.removeEventListener(eventName, existingInvoker)
            invokers[eventName] = null
        }
    }
}