import { patchClass } from "./modules/class.js"
import { patchStyle } from "./modules/style.js"
import { patchEvent } from "./modules/event.js"
import { patchAttr } from "./modules/attr.js"


export function patchProp(el, key, prevVal, nextVal) {
    // 根据 prevVal 和 nextVal 来做diff的更新
    /*
    样式：
        old: { color: red}
        new: {background: red}
     */

    // class style 事件 普通属性 表单属性（true - value）

    if (key === "class") {
        // class="a b c" => class="b c"
        // 类的话就直接替换了，不比对了
        patchClass(el, nextVal) // 对类名的处理
    } else if (key === 'style') {
        // 如何比较两个对象的差异
        patchStyle(el, prevVal, nextVal)
    } else if (/^on[^a-z]/.test(key)) {
        patchEvent(el, key, nextVal) // 在事件处理这块，都是使用新的事件直接替换老的事件
    } else {
        // 其他属性 就会直接使用attr
        patchAttr(el, key, nextVal)
    }


    // vue之中可以给元素绑定多个事件 @click=() => {} @click = () => {} 最终vue会将这些处理成为数组
    // 这里写的时候只考虑简单的情况，就是只能够绑定一个
}














