const effect = () => {}

const set = new Set()

set.forEach(item => {
    // 此时就会产生死循环
    set.delete(effect)
    set.add(effect)
})


const arr = [1]
// 这个同样会产生死循环
for (let i = 0; i < arr.length; i++) {
    arr.push(i)
}