const queue = []
let isFlushing = false
const p = Promise.resolve()
export function queueJob(job) {
    // console.log(job, 3)
    if (!queue.includes(job)) {
        // 去重复操作
        queue.push(job) // 存储当前的更新的操作
    }
    // console.log(queue, 7) // 数据变化后，可能会出现多个组件的更新，所以需要采用队列来存储

    if (!isFlushing) {
        isFlushing = true // 通过批处理
        p.then(() => {
            isFlushing = false
            // 执行的时候，先进行一个浅拷贝，因为不能说边执行的时候，往里面边push
            // 这样会执行不完
            let copyQueue = queue.slice(0) // 将当前要执行的队列拷贝一份，并且清空队列
            queue.length = 0
            copyQueue.forEach(job => {
                job()
            })
            copyQueue.length = 0
        })
    }
}
// 比较像浏览器的事件环，一轮一轮的执行











