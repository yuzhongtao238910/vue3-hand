/*
h方法有很多种参数类型
h("div", "hello")

h("div", {style: {color: "red"}}, "hello")


但是底层都使用了 createVNode 元素 属性 内容
 */

import { isObject } from "../../shared/src/index.js";
import {createVNode, isVNode} from "./createVNode.js"
// ()
export function h(type, propsOrChildren, children) {
    const l = arguments.length
    if (l === 2) {
        if (isObject(propsOrChildren) && !Array.isArray(propsOrChildren)) {
            if (isVNode(propsOrChildren)) { // 是儿子的情况
                return createVNode(type, null, [propsOrChildren])
            }
            // propsOrChildren 是 属性
            return createVNode(type, propsOrChildren)
        } else {
            // 数组的情况
            // 或者是文本，都是儿子
            return createVNode(type, null, propsOrChildren)
        }
        // h('div', { style: {color: 'red'}})
        // h('div', h('span', null, 'hello')})
        // h('div', h('span', 'hello')})
        // h('div', [h('span', null, 'hello')])
    } else {
        // >= 3 的 情况
        if (l > 3) {
            // h('div', null, 'hello', 'abc', 'bcd')
            children = Array.from(arguments).slice(2)
        }
        if (l === 3 && isVNode(children)) {
            children = [children]
            // h('div', null, h('span', null, 'hello'))
        }
        // 参数 大于 3 前两个之外的欧式儿子
        // 等于3的情况 第三个参数是虚拟节点，需要包装成为数组
        return createVNode(type, propsOrChildren, children)
    }
}















