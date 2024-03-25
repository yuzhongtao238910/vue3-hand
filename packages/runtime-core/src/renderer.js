// 这个是底层createRenderer方法，用户可以自己传入renderOptions实现跨平台的方案
// runtime-core之中的createRenderer是不基于平台的
import { getSeq } from "./seq.js"
import { ShapeFlags } from "../../shared/src/shapeFlag.js"
import {isSameVnode, Text, Fragment } from "./createVNode.js";
import { reactive, ReactiveEffect } from "../../reactivity/dist/reactivity.js"
import { queueJob } from "./scheduler.js"
import { createComponentInstance, setupComponent } from "./component.js"

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
    const unmountChildren = (children) => {
        children.forEach(child => {
            unmount(child)
        })
    }
    const unmount = (vnode) => {
        // 因为卸载的话，有很多种形式，元素的卸载，组件的卸载等等
        // vnode.el
        const { shapeFlag, type, children } = vnode
        if (type === Fragment) {
            return unmountChildren(children)
        }
        // if (shapeFlag & ShapeFlags.ELEMNT) {
            hostRemove(vnode.el) // 对于元素来说，直接删除dom就可以啊
        // }

    }
    const mountElement = (vnode, container, anchor) => {
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
        hostInsert(el, container, anchor)
    }


    const patchProps = (oldProps, newProps, el) => {
        // 1) 判断新老是不是一样的
        /*
        eg :  let props = { style: {color: 'red'}}
        render(h('div', props, abc), app)
           这种情况是新老一样，都是用的同一个props，所以需要判断，但是这样的情况是比较少的
        render(h('div', props, abc), app)
         */
        if (oldProps === newProps) {
            return
        }

        for (let key in newProps) { // 真实的操作dom
            let prevVal = oldProps[key]
            let nextVal = newProps[key]
            if (prevVal !== nextVal) {
                hostPatchProp(el, key, prevVal, nextVal)
            }
        }

        for (let key in oldProps) {
            if (!(key in newProps)) {
                hostPatchProp(el, key, oldProps[key], {})
            }
        }

    }
    const patchKeyChildren = (c1, c2, el) => {
        // 根据key进行复用
        // vue3采用了diff算法
        // 1)同序列的挂载和卸载 从头开始比较 从尾部开始比较，这样可以确定变化的部分
        // 对diff算法进行优化
        // a b c
        // a b c d
        // 2)最长递增子序列，计算最小偏移量来进行更新

        let i = 0 // 开头的位置
        let e1 = c1.length - 1 // 老的children的结尾
        let e2 = c2.length - 1 // 新的children的结尾

        // a b c 从头开始比较，出现不一样就停止
        // a b d
        while (i <= e1 && i <= e2) { // sync from start
            const n1 = c1[i]
            const n2 = c2[i]
            if (isSameVnode(n1, n2)) {
                // 如果是相同的话，就比较
                patch(n1, n2, el)
            } else {
                break
            }
            i++
        }

        // sync from end
        while (i <= e1 && i <= e2) {
            const n1 = c1[e1]
            const n2 = c2[e2]
            if (isSameVnode(n1, n2)) {
                // 如果是相同的话，就比较
                patch(n1, n2, el)
            } else {
                break
            }
            e1--
            e2--
        }

        // a b c
        // d e a b c
        // 0 -1 1

        // a b c
        // a b c d e
        // 3 2 4

        /*
        i 和 e2 比较
        i 和 e1 比较
         */
        if ( i > e1) {
            // a b c
            // a b c d e
            // i = 3 e1 = 2 e2 = 4 c2[e2 + 1] 说明是向后插入
            // 这块需要直到向前还是向后插入，如果是向前插入需要有参照物
            // a b c
            // d e a b c
            // i = 0 e1 = -1 e2 = 1 c2[e2+1] 说明是向前插入 a就是参照物
            // 新的多 老的少
            // 插入 i 到 e2之间的
            while (i <= e2) {
                const nextPos = e2 + 1
                // console.log(nextPos, 163)
                const anchor = c2[nextPos]?.el // 获取下一个元素的el
                // console.log(anchor, 165)
                patch(null, c2[i], el, anchor)
                i++
            }
        } else if (i > e2) {
            // 说明 老的多 新的少
            // 需要做卸载 i到e1之间的进行卸载
            // a b c d e
            // a b c
            // i = 3 e1 = 4 e2 = 2

            // d e a b c
            // a b c
            // i = 0 e1 = 1 e2 = -1
            while (i <= e1) {
                unmount(c1[i])
                i++
            }
        }
        // console.log(i, e1, e2)
        // 以上的情况 就是一些头尾的特殊操作 但是不适用于其他的情况
        // a b 【c d e q 】 f g
        // a b 【d c e h 】f g
        // 只要是不一样就会直接break掉
        // i = 2 e1 = 4 e2 = 5


        let s1 = i
        let s2 = i
        // s1 - e1 【c d e q】
        // s2 - e2 【d c e h】--> [3 2 4 0] 这个数组用于标识哪些节点被patch过了
        // 但是 如果没有前面的 a b两项，但是0是存在特殊的情况
        // 尽可能的复用老节点，然后移动新节点
        // 复用的话，就只能靠key // 根据key创建映射表
        // vue2里面使用的是老节点做的映射表
        // vue3里面使用的是新节点做的映射表
        const keyToNewIndexMap = new Map()
        const toBePatched = e2 - s2 + 1 // 新的儿子有这么多个，需要被patch
        const newIndexToOldIndex = new Array(toBePatched).fill(0)


        for (let i =s2; i <= e2; i++) {
            keyToNewIndexMap.set(c2[i].key, i)
        }
        // console.log(keyToNewIndexMap, 204)

        for (let i = s1; i <= e1; i++) {
            const vnode = c1[i]
            // console.log(vnode, 'vnode')
            let newIndex = keyToNewIndexMap.get(vnode.key)
            if (newIndex == undefined) {
                // 老的里面 有的，新的没有

                unmount(vnode)
            } else {
                // 其他情况下比较key 用老的虚拟节点和新的虚拟节点做比对
                // 但是顺序不对

                // 让被patch过的索引进行标识，引用老节点的索引作为标识，防止出现0的情况，因此+1
                // i + 1 就是为了避免出现0的情况
                newIndexToOldIndex[newIndex - s2] = i + 1
                patch(vnode, c2[newIndex], el)
            }
        }
        // a b [c d e q] f g
        // a b [d c e h] f g
        /*
            这个其实不用移动 c 和 e，将d插入到c前面追加，并且追加h
            4 3 5 -》 4 5 3 5

            a b c d e

            c a b d f

            c 移动到前面 ，追加f，删除e
         */
        // 这个其实不用移动 c 和 e，将d插入到c前面追加，并且追加h
        // h 插入 f 前面 e插入h前面
        // dom操作 只能向某个元素的前面插入 insertBefore
        // 根据数组之中的值求出对应的递增子序列的索引，当倒序插入的时候跳过对应的索引就可以
        // console.log(newIndexToOldIndex)  // [4 3 5 0]
        const increasingNewIndexSequence = getSeq(newIndexToOldIndex)
        let j = increasingNewIndexSequence.length - 1 // 取出数组的最后一项索引



        // console.log(c2)
        // debugger
        for (let i = toBePatched - 1; i >= 0 ;i--) {
            // console.log(s2 + i, s2, i)
            const current = s2 + i
            const curNode = c2[current]
            const anchor = c2[current + 1]?.el // 取到了f 参照物
            // console.log(anchor, 238)
            // 如果当前的值是0的话，新的不存在的，需要创建出来在插入
            if (newIndexToOldIndex[i] == 0) {
                patch(null, curNode, el, anchor)
            } else {
                // 这里需要判断 i 和 j 如果一致，说明这一项是不需要移动的
                if (i === increasingNewIndexSequence[j]) { // 如果当前这一项和序列之中相等
                    // 说明不用任何操作，直接跳过就可以
                    //
                    j--
                } else {
                    hostInsert(curNode.el, el, anchor)
                }

            }

        }
        // 移动的话采用倒叙插入的方式，进行移动节点 0是新增的，其他的情况下今后进行插入

        // 考虑移动问题，和 新的有，老的么有的问题
        // 接下来需要计算移动哪些节点
        // 最长递增子序列
    }

    const patchChildren = (n1, n2, el) => {
        // 比较双方的儿子的差异
        /*
        几种情况：
            之前有儿子 之后没有儿子
            之前没有儿子 之后有儿子
            两方都有儿子

        新    老 3 * 3 = 9 共计是9种情况
        文本  文本
        null null
        数组  数组

        text null array
         */
        // 全量diff算法，从根上开始比较，比较到最终的子节点
        /*
        递归 先序 深度遍历 全量diff比较是耗费性能，有一些节点是不需要比较的
        vue3之中有一种方式叫做靶场更新的方式，叫做只比较动态节点

        div
            span
                a
                    h1

         */


        // patchFlag + blockTree 编译优化，只有写模版的时候，才会享受这种优化
        // vue3是建议使用模版的
        const c1 = n1.children
        const c2 = n2.children

        const prevShapeFlag = n1.shapeFlag // 之前的形状
        const shapeFlag = n2.shapeFlag // 之后的形状
        // 1） 当前是文本的情况 之前的是 null 文本 或者是数组
        if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
            // 当前是文本
            if (prevShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
                // 老的是数组 全部都移除掉
                // new: hello old:
                unmountChildren(c1)
            }
            // 新的是文本，老的可能是文本或者是null
            if (c1 !== c2) {
                hostSetElementText(el, c2)
            }
        } else {

            if (prevShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
                // 双方都是数组 核心的diff算法
                // 之前是数组

                // 当前新的是数组或者是空
                if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
                    // 全量diff的核心的算法
                    patchKeyChildren(c1, c2, el)
                } else {
                    // 现在是空的情况, 新的没有儿子
                    unmountChildren(c1) // 文本的情况在上面的处理了
                }
            } else {
                // 老的是文本或者是空的
                // 新的可能是数组
                if (prevShapeFlag & ShapeFlags.TEXT_CHILDREN) {
                    // 老的为文本，新的是空
                    hostSetElementText(el, "")
                }
                // 老的为空/文本，新的是数组
                if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
                    mountChildren(c2, el)
                }
            }
            // 老的为空，新的是数组不需要管了
            // 新老都为空 不需要判断了
        }

    }

    const patchElement = (n1, n2) => {
        let el = ( n2.el = n1.el ) // 将老的虚拟节点上的dom直接给新的虚拟节点
        // 更新属性
        const oldProps = n1.props || {}
        const newProps = n2.props || {}
        // 比较前后属性的差异  双循环
        patchProps(oldProps, newProps, el)


        patchChildren(n1, n2, el)

    }
    const processElement = (n1, n2, container, anchor) => {
        if (n1 == null) {
            // console.log("走了一次初次渲染的逻辑")
            // 说明就是初次渲染
            mountElement(n2, container, anchor)
        } else {
            // debugger
            // 元素更新了，这里面走更新的逻辑
            // console.log("走更新的逻辑")
            // console.log(n1, n2)
            // 元素更新了，属性变化了 更新属性
            patchElement(n1, n2)
        }
    }

    const processText = (n1, n2, el) => {
        if (n1 === null) {
            // console.log("初始化的text", 390)
            // 初始化的情况
            // 这里不使用innerHTML
            hostInsert((n2.el = hostCreateText(n2.children)), el)
        } else {
            let el = (n2.el = n1.el) // 复用文本元素
            if (n1.children === n2.children) {
                return
            }
            hostSetText(el, n2.children)
        }
    }

    function updateProps(instance, nextProps) {
        let prevProps = instance.props
        // 更新的时候 应该考虑一下attrs和props，重新整理一下
        for (let key in nextProps) {
            prevProps[key] = nextProps[key]
        }
        for (let key in prevProps) {
            if (!(key in nextProps)) {
                delete prevProps[key]
            }
        }
    }

    function updatePreRender(instance, next) {
        // 在渲染之前记得要更新变化的属性
        instance.next = null // 用完就销毁
        instance.vnode = next // 更新虚拟节点
        updateProps(instance, next.props)

        // 更新插槽
        // 如果是对象的话
        instance.slots = next.children // 新的儿子
    }

    const setupRendererEffect = (instance, el, anchor) => {
        // console.log(instance, 413)
        const componentUpdateFn = () => {
            // debugger
            // console.log(activeEffect12, 437)
            // console.log("update-238910")
            // 组件要渲染的 虚拟节点 是 render函数返回的结果
            // 组件有自己的虚拟节点，返回的虚拟节点 subTree
            // debugger

            // 除了组件的state，其实还有props
            // const subTree = render.call(instance.proxy, instance.proxy) // this这里先暂且将proxy设置为状态
            // console.log(subTree, 416)
            // debugger
            if (!instance.isMounted) {
                // debugger
                // console.log(instance.proxy, 448)
                // debugger
                const subTree = instance.render.call(instance.proxy, instance.proxy)
                // console.log(subTree)
                patch(null, subTree, el, anchor)
                instance.subTree = subTree // 记录第一次的subTree
                instance.isMounted = true
            } else {
                // console.log("状态变化了，走更新")
                const prevSubTree = instance.subTree
                // 这里在下次渲染前面，更新属性后再次渲染，获取最新的虚拟dom
                // n2.props 来更新instance的 props
                const next = instance.next
                if (next) {
                    // 说明属性有更新
                    updatePreRender(instance, next) // 因为更新前面会清理依赖，所以这里更改属性不会触发渲染
                }

                // de
                // 这里调用render的时候会重新进行依赖收集
                const nextSubTree = instance.render.call(instance.proxy, instance.proxy)
                // console.log(prevSubTree, nextSubTree, 433)
                instance.subTree = nextSubTree // 记录第一次的subTree
                patch(prevSubTree, nextSubTree, el, anchor)
            }
            // 当调用render 方法的时候 会触发响应式的数据访问，进行effect的收集
            // 所以数据变化后，会重新触发effect的执行
        }
        // 每一个组件都是一个effect
        // 组件自身的状态发生变化了走这里
        const effect = new ReactiveEffect(componentUpdateFn, () => {
            // 这里我们可以延迟调用 componentUpdateFn
            // 更新的批处理 + 去重

            // debugger


            queueJob(instance.update)


        }) // 对应的effect方法
        const update = instance.update = effect.run.bind(effect)
        update()
    }



    const mountComponent = (n2, el, anchor) => {

        // 1)创建组件的实例

        const instance = createComponentInstance(n2)
        // 2）启动组件，给组件的实例赋值
        setupComponent(instance)


        // 3) 组件的渲染流程

        setupRendererEffect(instance, el, anchor)





        // console.log(instance.attrs, instance.props.a)



    }
    function hasChanged(oldProps = {}, newProps = {}) {
        // 判断两个对象是否有变化？
        // 直接看数量，数量有变化，肯定变化了，就不用遍历了
        let oldKeys = Object.keys(oldProps)
        let newKeys = Object.keys(newProps)


        if (oldKeys.length !== newKeys.length) {
            return true
        }

        for (let i = 0; i < newKeys.length; i++) {
            const key = newKeys[i]
            if (newProps[key] !== oldProps[key]) {
                return false
            }
        }
        return false
    }
    function shouldComponentUpdate(n1, n2) {
        const oldProps = n1.props
        const newProps = n2.props
        // debugger
        if (oldProps == newProps) {
            return false
        }

        // 如果组件有插槽，也需要进行更新
        if (n1.children !== n2.children) {
            return true // 遇到插槽前后不一致就需要重新渲染
        }

        return hasChanged(oldProps, newProps)
    }
    const updateComponent = (n1, n2, el, anchor) => {
        // 这里我们属性发生了变化，会执行到这里
        // 或者是插槽更新了，也会执行到这里

        const instance = n2.component = n1.component
        // 内部props是响应式的，所以更新props就可以自动的更新视图，vue2就是这样操作，但是这样不好
        // instance.props.message = n2.props.message
        // debugger

        // 这里我们可以比较属性，如果属性发生变化了，我们调用instance.update来处理更新逻辑
        // 统一更新的入口
        // const oldProps = n1.props
        // const newProps = n2.props
        // updateProps(oldProps, newProps)

        // 保存新的属性

        // console.log(shouldComponentUpdate(n1, n2))
        // debugger
        if (shouldComponentUpdate(n1, n2)) {
            // debugger
            instance.next = n2 // 暂存新的虚拟节点
            instance.update()
        }

    }


    const processComponent = (n1, n2, el, anchor) => {
        // debugger
        if (n1 == null) {
            mountComponent(n2, el, anchor)
        } else {
            // h(xx, {xx: 1})
            // h(xx, {xx: 2})
            // 组件的属性变化了，或者插槽变化了，走这里
            updateComponent(n1, n2, el, anchor) // 组件的属性变化了
        }
        // COMPONENT: (1 << 2) | (1 << 1)  包含普通状态组件和函数式组件
    }
    const processFragment = (n1, n2, el) => {
        if (n1 == null) {
            mountChildren(n2.children, el)
        } else {
            patchKeyChildren(n1.children, n2.children, el)
        }
    }

    const patch = (n1, n2, container, anchor = null) => {
        // debugger
        // console.log(n1, n2, container, 400)
        // 这里主要是更新和初次渲染
        // 如果是初次渲染的话，n1就是null n2是最新的
        // 如果是更新的话，就是n1 和 n2都是有值的


        // n1 和 n2不是同一个元素 key或者标签不一样
        // 得是更新的时候
        if (n1 && !isSameVnode(n1, n2)) {
            // console.log("111111, 241")
            unmount(n1)
            n1 = null
        }
        const {type, shapeFlag } = n2
        // console.log(type, shapeFlag)
        switch (type) {
            case Text:
                processText(n1, n2, container)
                break;
            case Fragment:
                processFragment(n1, n2, container)
                break;
            default:
                if (shapeFlag & ShapeFlags.ELEMNT) {
                    // 元素的处理
                    // 元素的处理
                    processElement(n1, n2, container, anchor)
                } else if (shapeFlag & ShapeFlags.COMPONENT) {
                    // 处理组件
                    processComponent(n1, n2, container, anchor)
                }

        }


    }
    const render = (vnode, container) => {
        // debugger
        // debugger
        // debugger
        // console.log(vnode, container, 533, "-----")
        // debugger
        // 虚拟节点的创建，最终生成真实的dom
        // console.log(vnode, container)
        // 1) 卸载 render(null, app)
        // 2) 更新 之前渲染过了，现在在渲染，之前渲染过一次，产生了虚拟节点，再次渲染产生了虚拟节点
        // 3) 初次挂载
        // debugger
        if (vnode == null) {
            // console.log("第一次")
            // 如果传递的vnode是null的话，就是卸载的逻辑
            if (container._vnode) {
                // 说明之前挂载过，现在需要移除
                unmount(container._vnode) // 虚拟节点之中存放了真实节点
            }
        } else {
            // 否则 这个里面就是初次渲染和更新的逻辑
            // 在源码之中挂载和更新都写入了一个方法之中就是patch
            // debugger
            patch(container._vnode || null, vnode, container)
        }

        // 这样就是相当于做了一次存储
        container._vnode = vnode



    }
    return {
        render
    }
}