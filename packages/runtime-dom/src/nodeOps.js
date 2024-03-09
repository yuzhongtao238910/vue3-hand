export const nodeOps = {
    // 创建元素
    createElement(element) {
        return document.createElement(element)
    },
    // 创建文本
    createText(text) {
        return document.createTextNode(text)
    },
    // 对元素的插入
    insert(element, container, anchor = null) {
        // appendChild(element) 等价于 insertBefore(element ,null)
        container.insertBefore(element, anchor)
    },
    // 对元素的删除 方法
    remove(child) {
        const parent = child.parentNode
        if (parent) {
            parent.removeChild(child)
        }
    },
    // 元素的查询
    querySelector(selector) {
        return document.querySelector(selector)
    },
    // 设置元素的文本内容 innerHTML不安全 这里面使用的是textContent
    setElementText(element, text) {
        element.textContent = text // 设置元素的内容
    },
    setText(textNode, text) {
        // 设置文本节点的内容
        textNode.nodeValue = text
    },
    // 创建注释节点
    createComment(text) {
        return document.createComment(text)
    },
    nextSibling(node) {
        return node.nextSibling
    },
    parentNode(node) {
        return node.parentNode
    }
}










