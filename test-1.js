const person = {
    name: "jw",
    get aliasName() {
        return "**" + this.name + "**"
    },
    set aliasName(val) {
        this.name = val
    }
}

const proxy = new Proxy(person, {
    get(target, key, receiver) {
        // console.log("取值操作", key)
        return target[key]
    }
})
// 在获取aliasname 也希望让name属性也会触发get
// 假如我在视图之中使用了aliasname这个变量
// 只触发了
// 页面和数据是有对应的关系的