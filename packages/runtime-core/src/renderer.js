// 这个是底层createRenderer方法，用户可以自己传入renderOptions实现跨平台的方案
// runtime-core之中的createRenderer是不基于平台的

import { ShapeFlags } from "../../shared/src/shapeFlag.js"
import {isSameVnode} from "./createVNode.js";
export function createRenderer(renderOptions) {
    const {
        createElement: hostCreateElement,
        createText: hostCreateText,
        insert: hostInsert,
        remove: hostRemove,
        querySelector: hostQuerySelector,
        setElementText: hostSetElementText,
        setText: hostSetText,
        createComment: hostCreateComment,
        nextSibling: hostNextSibling,
        parentNode: hostParentNode,
        patchProp: hostPatchProp
    } = renderOptions // 这些方法和某个平台无关的

    // ['abc', 'bcd']
    const mountChildren = (children, container) => {
        // 目前这个方法，没有处理文本的情况
        children.forEach(child => {
            patch(null, child, container)
        })
    }
    const unmount = (vnode) => {
        // 因为卸载的话，有很多种形式，元素的卸载，组件的卸载等等
        // vnode.el
        const { shapeFlag } = vnode
        if (shapeFlag & ShapeFlags.ELEMNT) {
            hostRemove(vnode.el) // 对于元素来说，直接删除dom就可以啊
        }

    }
    const mountElement = (vnode, container) => {
        // 递归遍历虚拟节点，将他转换为真实节点
        const { type, props, children, shapeFlag } = vnode
        // console.log(type, props, children, shapeFlag)
        const el = hostCreateElement(type)
        vnode.el = el
        if (props) {
            for (let key in props) {
                hostPatchProp(el, key, null, props[key])
            }
        }
        // children -> null 文本 数组
        if (children) {
            if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
                // 说明此时是文本的情况
                hostSetElementText(el, children)
            } else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
                // ['123', 'abc']
                // [h(), h()]
                mountChildren(children, el)
                // children.forEach(child => {
                //     mountElement( child, el)
                // })
            }
        }
        hostInsert(el, container)
    }

    const patch = (n1, n2, container) => {
        // 这里主要是更新和初次渲染
        // 如果是初次渲染的话，n1就是null n2是最新的
        // 如果是更新的话，就是n1 和 n2都是有值的


        // n1 和 n2不是同一个元素 key或者标签不一样
        // 得是更新的时候
        if (n1 && !isSameVnode(n1, n2)) {
            unmount(n1)
            n1 = null
        }

        if (n1 == null) {
            console.log("走了一次初次渲染的逻辑")
            // 说明就是初次渲染
            mountElement(n2, container)
        } else {
            // 元素更新了，这里面走更新的逻辑
            console.log("走更新的逻辑")
            // 元素更新了，属性变化了 更新属性
        }

    }
    const render = (vnode, container) => {
        // 虚拟节点的创建，最终生成真实的dom
        // console.log(vnode, container)
        // 1) 卸载 render(null, app)
        // 2) 更新 之前渲染过了，现在在渲染，之前渲染过一次，产生了虚拟节点，再次渲染产生了虚拟节点
        // 3) 初次挂载

        if (vnode == null) {
            // 如果传递的vnode是null的话，就是卸载的逻辑
            if (container._vnode) {
                // 说明之前挂载过，现在需要移除
                unmount(container._vnode) // 虚拟节点之中存放了真实节点
            }
        } else {
            // 否则 这个里面就是初次渲染和更新的逻辑
            // 在源码之中挂载和更新都写入了一个方法之中就是patch
            patch(container._vnode || null, vnode, container)
        }

        // 这样就是相当于做了一次存储
        container._vnode = vnode



    }
    return {
        render
    }
}