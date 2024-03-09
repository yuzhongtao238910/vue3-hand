export function patchStyle(el, prevVal, nextVal) {
    const style = el.style // 最终的操作就是他
    if (nextVal) {
        // 这些一定是要生效的
        for (let key in nextVal) {
            // 这块是直接覆盖的，因为浏览器会自动的识别，如果是相同的，会自动识别优化的
            style[key] = nextVal[key] // 使用新的样式直接添加就可以了
        }
    }
    if (prevVal) {
        for (let key in prevVal) {
            if (nextVal[key] == null) {
                style[key] = null // 删除老对象之中的样式就可以了
            }
        }
    }
}