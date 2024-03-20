import {reactive, proxyRefs, activeEffect12} from "../../reactivity/dist/reactivity.js";
import { isFunction } from "../../shared/src/index.js"

export function createComponentInstance(n2) {


    const instance = {

        state: {},
        vnode: n2, // 组件的虚拟节点
        update: null, // 一个自定义的更新方法，如果用户希望强制更新，就可以调用这个方法
        isMounted: false, // 默认组件没有初始化，初始化后会将此属性isMounted 变为true
        subTree: null,
        attrs: {},
        props: {},
        propsOptions: n2.type.props || {}, // 组件之中接收的属性
        proxy: null,
        render: null,
        setupState: {}
    } // 此实例就是用来记录组件的相关信息的
    return instance
}
const initProps = (instance, userProps) => {
    // console.log(instance, userProps)
    const attrs = {}
    const props = {}
    const options = instance.propsOptions || {} // 组件上接收的props
    if (userProps) {
        for (let key in userProps) {
            // 属性之之中应该包含属性的校验，类型之类的，这里不做了
            const value = userProps[key]
            if (key in options) {
                props[key] = value
            } else {
                attrs[key] = value
            }
        }
    }
    instance.attrs = attrs // attrs是非响应式的
    instance.props = reactive(props) // 这块应该是shallowReactive的，但是我们没有写这个方法，因此就使用reactive代替
}
const publicProperties = {
    $attrs: i => i.attrs // proxy.$attrs
}
export function setupComponent(instance) {

    const { props, type } = instance.vnode

    // 对于组件来说，组件保存的不是el，而是组件的实例 // 这块是复用组件的实例
    instance.vnode.component = instance

// 实例上的props和attrs n2.props是组件的虚拟节点的props
    initProps(instance, props) // 使用用户传递给虚拟节点的props
    instance.proxy = new Proxy(instance, {
        get(target, key, receiver) {
            const  { state, props, setupState } = target
            console.log(activeEffect12, 57, key)
            if (key in setupState) {
                return setupState[key]
            }
            if (state && (key in state)) {
                return state[key]
            } else if (key in props) {
                return props[key]
            }
            let getter = publicProperties[key]
            if (getter) {
                // proxy.$attrs.c
                return getter(instance)
            }
        },
        set(target, key, newValue, receiver) {
            const  { state, props, setupState } = target
            if (key in setupState) {
                setupState[key] = newValue
                return true
            }
            if (state && (key in state)) {
                state[key] = newValue
                return true
            } else if ( key in props ) {
                console.warn("不允许修改props")
                return true
            }
            return true
        }
    })


    let { data, setup, render } = type

    // 这里多了setup的逻辑
    if (setup) {
        const setupResult = setup()
        if (isFunction(setupResult)) {
            // 如果setup的返回值是一个函数的话，说明是返回的是render函数
            // 否则就是正常的返回变量和方法

            // 如果是render函数的话，就直接使用这个render函数
            instance.render = setupResult
        } else {
            // 使用proxyRefs帮我们做一个代理 对于.value的形式直接进行了拆包处理
            // console.log(activeEffect12, setupResult)
            instance.setupState = proxyRefs(setupResult) // 将setup的返回值做拆包处理，无需在.value
        }
    }
    if (isFunction(data)) {
        // vue3逻辑处理完毕才处理vue2的老的写法
        instance.state = reactive(data.call(instance.proxy)) // 获取的数据 然后还需要变成响应式的
    }

    if (!instance.render) {
        instance.render = render
    }



}

















