// 用来耦合所有的dom的api
// 创建 元素的增删改查
import {nodeOps} from "./nodeOps.js"
import { patchProp } from "./patchProp.js"
import { createRenderer as renderer } from "../../runtime-core/src/index.js"
const renderOptions = Object.assign(nodeOps, { patchProp })


// 用户自己创在渲染器，把属性传递进来
// 无论是render方法是基于平台的
export function createRenderer(renderOptions) {
    // 这里提供了渲染api，调用了底层的render方法
    return renderer(renderOptions)
}

export function render(vnode, container) {
    // 内置渲染器会自动传入 domAPI 专门给vue服务的
    const renderer = createRenderer(renderOptions)
    return renderer.render(vnode, container)
}
export * from "../../runtime-core/src/index.js"

// 再次进行拆分 把render方法







