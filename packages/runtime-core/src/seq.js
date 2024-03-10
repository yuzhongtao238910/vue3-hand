/*
如何求出最长递增子序列

最终序列的索引是我们需要的结果

[4 3 5 0]

先求出最长递增子序列的个数

3 5 7 4 2 8 9 11 6 10  贪心算法+二分查找：找更有潜力的一项作为末尾

3 5 7 8 9 11

3 5 6
3 7 6

3 5
3 5 7
3 4 7 递增序列查找某个元素 可以使用二分查找
2 4 7
2 4 7 8
2 4 7 8 9
2 4 7 8 9 11
2 4 6 8 9 11
2 4 6 8 9 10

// 有了个数，可以采用倒序追踪的方式

3 5 7 8 9 11/10
 */


// [1 2 3 4 5 6 7 8 9] -> [0 1 2 3 4 5 6 7 8]
// 0 是不需要管的，因为0代表着新增吗，需要进行忽略掉
export function getSeq(arr) {
    const result = [0]
    const len = arr.length
    const p = arr.slice(0).fill(-1) // 用来存储标记的索引 内容无所谓，主要是和数组的长度一致
    let start
    let end
    let middle
    for (let i = 0; i < len; i++) {
        const arrI = arr[i]
        if (arrI !== 0) {
            let resultLastIndex = result[result.length - 1] // 获取结果集之中的最后一个
            // 和arrI 之中的比较
            if (arr[resultLastIndex] < arrI) {
                // 直接就放在末尾
                result.push(i)
                p[i] = resultLastIndex // 表示记录上一次最后一个人的索引
                continue
            }
            // 如果比当前末尾小 ，需要通过二分查找找到比当前这一项大的用这一项替换掉
            start = 0
            end = result.length - 1
            while (start < end) {
                middle = (start + end) / 2 | 0 // 向下取整数
                if (arr[result[middle]] < arrI) {
                    start = middle + 1
                } else {
                    end = middle
                }
            }
            // [3 7 8 9] 6 0 1
            // 最终start 和 end会重合
            //
            p[i] = result[start - 1] // 记录前一个人的索引
            result[start] = i // 直接使用当前的索引换掉
        }
    }
    console.log(result, p)
    // 实现倒序追踪
    let i = result.length // 总长度
    let last = result[i - 1] // 获取最后一项
    while (i-- > 0) {
        result[i] = last // 最后一项是正确的
        last = p[last] // 通过最后一项找到对应的结果，将他作为最后一项来追踪
    }
    return result
}

getSeq([2, 3, 1, 5, 6, 8, 7, 9, 4]) // [2 1]











