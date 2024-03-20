// h方法的children是可以有多个，是因为h的底层是封装了createVNode
// 这块的children只能够有一个，如果是数组的话，就会进行拼接
/*
虚拟节点需要有一些重要的属性
    key

 */
import {isObject, isString, ShapeFlags} from "../../shared/src/index.js"

export const Text = Symbol()
export const Fragment = Symbol()
export function isVNode(value) {
    return value.__v_isVNode // 用来判断是否是虚拟节点
}
export function isSameVnode(n1, n2) {
    // 如果前后没有key，就都是undefined 认为key是一样的
    return n1.type === n2.type && n1.key === n2.key
}
export function createVNode(type, props, children = null) {
    // STATEFUL_COMPONENT 带有状态的组件
    // type是对象说明是一个组件
    const shapeFlag = isString(type) ? ShapeFlags.ELEMNT : isObject(type) ? ShapeFlags.STATEFUL_COMPONENT : 0
    const vnode = {
        __v_isVNode: true, // 判断对象是不是虚拟节点可以采用这个字段
        type,
        props,
        children,
        key: props?.key, // 虚拟节点的key，主要用于diff算法
        el: null, // 虚拟节点对应的真实的节点
        shapeFlag, // 靠位运算 & 都是1就是1  按位或：有一个1就是1
    }
    // 上面是描述自己的类型
    // 下面是描述自己儿子的类型
    if (children) {
        let type = 0
        if (Array.isArray(children)) {
            // 自己是元素 儿子是数组的话
            type |= ShapeFlags.ARRAY_CHILDREN
        } else {
            // 这块全部格式化为字符串
            vnode.children = String(children)
            type |= ShapeFlags.TEXT_CHILDREN
        }
        vnode.shapeFlag |= type
    }
    // 返回了虚拟节点，并且标识了虚拟节点 的 类型
    return vnode
}
/*
位与运算
01
10
    -》00
或运算
    -》11
权限的组合可以采用 ｜ 的方式
001  1  用户权限
010  2  管理员
100  4  超级管理员

人 -》 001 ｜ 010 -》 011 -》 3

011 & 100 -》 0 意味着011不包含超级管理员权限

使用 ｜ 关联类型，通过 & 来判断类型是哪一类

 */












