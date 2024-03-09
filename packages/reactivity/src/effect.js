export let activeEffect = undefined
let id= 0
function cleanupEffect(effect) { // 在收集的列表之中将自己移除掉
    const { deps } = effect
    for (let i = 0; i < deps.length; i++) {
        // 找到set，让set移除掉自己
        deps[i].delete(effect)
    }
    effect.deps.length = 0 // 清空依赖的列表
}
export class ReactiveEffect {
    constructor(fn, scheduler, flag) {
        // 默认会将fn挂载到类的实例上面
        this.fn = fn
        this.id = id++
        this.scheduler = scheduler
        this.flag = flag
    }
    active = true // effect是否是激活状态
    parent = null
    deps = [] // 使用effect来记录每一个effect所依赖的dep，所依赖的属性
    run() {
        // 失活的状态在默认调用run的时候，只是重新执行
        // 并不会发生依赖收集
        if (!this.active) {
            return this.fn()
        }
        try {
            // 用于effect嵌套时候产生的父子关系，这样就不再需要创建一个栈了
            this.parent = activeEffect
            // 让属性和effect进行关联操作
            activeEffect = this
            cleanupEffect(this)
            // return 就是为了实现计算属性来的
            return this.fn() // fn 执行会触发依赖收集
            /*
            effect(() => {
                // e1
                effect(() => {
                    // e2
                })
            })
            e1 -> this.parent = null activeEffect = e1
            e2 -> this.parent = e1 activeEffect = e2
            e2 end -> activeEffect = e1 this.parent = null
            e1 end -> activeEffect = null this.parent = null
             */
        } finally {
            // 每run一次都需要进行清空
            activeEffect = this.parent
            this.parent = null
        }
    }

    stop() {
        if (this.active) {
            this.active = false
            cleanupEffect(this)
        }

    }
}
export function effect(fn, options = {}) {
    // 默认会执行，数据变化了还会执行
    // 创建一个响应式的effect，并且让effect执行
    const _effect = new ReactiveEffect(fn, options.scheduler, "effect")
    _effect.run()

    // 把runner方法直接给用户，用户可以去调用effect之中定义的内容
    const runner = _effect.run.bind(_effect)
    // 可以通过runner来拿到effect之中的所有的属性
    runner.effect = _effect
    return runner
}
const targetMap = new WeakMap()
export function track(target, key) {
    // 让这个对象上的属性记录当前的activeEffect
    // { name: "jw"} "name" -> [effect, effect]
    // 需要进行去重复，weakmap map set
    // 1- 用户只在effect之中的才会进行触发
    if (activeEffect) { // 说明用户是在effect之中使用的数据，在effect之中使用的数据才会进行依赖收集
        let depsMap = targetMap.get(target)
        // 如果没有 创建一个映射表
        if (!depsMap) {
            targetMap.set(target, (depsMap = new Map()))
        }
        // 如果有这个映射表，来查找一个是否有这个属性
        let dep = depsMap.get(key)
        // 如果没有set集合 创建集合
        if (!dep) {
            depsMap.set(key, (dep = new Set()))
        }
        trackEffect(dep)
        /*
            {
            	proxy1: {
            		name: Set([effect1, effect2]),
            		age: Set([effect1, effect2])
            	}
            	proxy2:
            	proxy3:
            }
         */
    }
}
export function trackEffect(dep) {
    // 如果有则看一下set之中有没有这个effect
    let shouldTrack = !dep.has(activeEffect)
    // 没有再去加
    if (shouldTrack) {
        // name = new Set(effect1, effect2) -> dep
        // age = new Set(effect1, effect2) -> dep
        dep.add(activeEffect)
        // name: new Set(effect1, effect2)
        // age: new Set(effect1, effect2)
        // 可以通过当前的effect找到这两个集合之中的自己，将它移除
        activeEffect.deps.push(dep)
    }
}


export function trigger(target, key, newValue, oldValue) {
    // 通过对象找到对应的属性，让这个属性对应的所有的effect重新执行
    const depsMap = targetMap.get(target)
    if (!depsMap) {
        return
    }
    const deps = depsMap.get(key) // name 或者 age 对应的所有的effect
    // console.log("104", deps)
    // 这块就是为了解决不要操作同一个对象，又是添加又是删除
    // 运行的是数组，删除的是set

    triggerEffect(deps)

}

export function triggerEffect(deps) {
    const effects = [...deps]
    effects && effects.forEach(effect => {
        // 正在执行的effect，不要多次执行
        /*
        解决的是这种
        effect(() => {
            state.name = math.random()
            app.innerHTML = state.name + state.age
        })
         */
        // console.log(activeEffect)
        if (effect !== activeEffect) {
            if (effect.scheduler) {
                effect.scheduler() // 用户传递了对应的更新函数，就调用此函数
            } else {
                // 如果用户没有传递就是默认重新运行effect函数
                effect.run()
            }
        }
    })
}









