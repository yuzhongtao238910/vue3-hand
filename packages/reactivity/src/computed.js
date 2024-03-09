import { isFunction } from "../../shared/src/index.js";
import { ReactiveEffect, activeEffect, trackEffect, triggerEffect } from "./effect.js"


// 对象：属性：effect
// effect
class ComputedRefImpl {
    _dirty = true

    __v_isRef = true // 表示后续我们可以增加拆包的逻辑

    dep = new Set()
    constructor(getter, setter) {
        this.setter = setter
        this.effect = new ReactiveEffect(getter, () => {
            if (!this._dirty) {
                this._dirty = true // 依赖的值发生了变化，需要将dirty变为true

                // 当依赖的值发生了变化，需要触发更新
                triggerEffect(this.dep)
            }
        }, "computed")
    }

    get value() {
        trackEffect(this.dep)
        // 在取值的时候，需要对计算属性也要做依赖收集
        // 当依赖的值发生了变化，需要触发更新
        // dirty 来实现缓存效果
        if (this._dirty) {
            this._dirty = false
            this._value = this.effect.run() // this._value 就是取值之后的结果
        }

        return this._value
    }
    set value(newVal) {
        this.setter(newVal)
    }
}
export function computed(getterOrOptions) {
    let getter;
    let setter
    const isGetter = isFunction(getterOrOptions)
    if (isGetter) {
        getter = getterOrOptions
        setter = () => {
            console.log("warn")
        }
    } else {
        // 如果是对象的话，对象之中必须要有getter
        getter = getterOrOptions.get
        setter = getterOrOptions.set
    }
    console.log(getter, 16)
    console.log(setter, 17)

    // ref reference 引用，把一个普通值包装成为对象，使之具备依赖收集的能力
    return new ComputedRefImpl(getter, setter)
}












