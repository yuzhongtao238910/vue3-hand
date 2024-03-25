// packages/reactivity/src/effect.js
window.activeEffect12 = void 0;
var id = 0;
function cleanupEffect(effect2) {
  const { deps } = effect2;
  for (let i = 0; i < deps.length; i++) {
    deps[i].delete(effect2);
  }
  effect2.deps.length = 0;
}
var ReactiveEffect = class {
  constructor(fn, scheduler, flag) {
    this.fn = fn;
    this.id = id++;
    this.scheduler = scheduler;
    this.flag = flag;
  }
  active = true;
  // effect是否是激活状态
  parent = null;
  deps = [];
  // 使用effect来记录每一个effect所依赖的dep，所依赖的属性
  run() {
    if (!this.active) {
      return this.fn();
    }
    try {
      this.parent = window.activeEffect12;
      window.activeEffect12 = this;
      cleanupEffect(this);
      return this.fn();
    } finally {
      window.activeEffect12 = this.parent;
      this.parent = null;
    }
  }
  stop() {
    if (this.active) {
      this.active = false;
      cleanupEffect(this);
    }
  }
};
function effect(fn, options = {}) {
  const _effect = new ReactiveEffect(fn, options.scheduler, "effect");
  _effect.run();
  const runner = _effect.run.bind(_effect);
  runner.effect = _effect;
  return runner;
}
var targetMap = /* @__PURE__ */ new WeakMap();
function track(target, key) {
  if (window.activeEffect12) {
    let depsMap = targetMap.get(target);
    if (!depsMap) {
      targetMap.set(target, depsMap = /* @__PURE__ */ new Map());
    }
    let dep = depsMap.get(key);
    if (!dep) {
      depsMap.set(key, dep = /* @__PURE__ */ new Set());
    }
    trackEffect(dep);
  }
}
function trackEffect(dep) {
  let shouldTrack = !dep.has(window.activeEffect12);
  if (shouldTrack) {
    dep.add(window.activeEffect12);
    window.activeEffect12.deps.push(dep);
  }
}
function trigger(target, key, newValue, oldValue) {
  const depsMap = targetMap.get(target);
  if (!depsMap) {
    return;
  }
  const deps = depsMap.get(key);
  triggerEffect(deps);
}
function triggerEffect(deps) {
  if (!deps) {
    return;
  }
  const effects = [...deps];
  effects && effects.forEach((effect2) => {
    if (effect2 !== activeEffect12) {
      if (effect2.scheduler) {
        effect2.scheduler();
      } else {
        effect2.run();
      }
    }
  });
}

// packages/shared/src/shapeFlag.js
var ShapeFlags = {
  ELEMNT: 1,
  // 元素
  FUNCTIONAL_COMPONENT: 1 << 1,
  // 函数式组件
  STATEFUL_COMPONENT: 1 << 2,
  // 普通状态组件
  TEXT_CHILDREN: 1 << 3,
  // 元素的儿子是文本
  ARRAY_CHILDREN: 1 << 4,
  // 元素的儿子是数组
  SLOTS_CHILDREN: 1 << 5,
  // 组件的插槽
  TELEPORT: 1 << 6,
  // 传送门组件
  SUSPENSE: 1 << 7,
  // 异步加载组件
  COMPONENT_SHOULD_KEPP_ALIVE: 1 << 8,
  // keep-alive
  COMPONENT_KEPT_ALIVE: 1 << 9,
  // keep-alive
  // 组件
  COMPONENT: 1 << 2 | 1 << 1
};

// packages/shared/src/index.js
var isObject = (val) => {
  return val != null && typeof val === "object";
};
var isFunction = (val) => {
  return typeof val === "function";
};

// packages/reactivity/src/ref.js
function isRef(value) {
  return !!(value && value.__v_isRef);
}
function toReactive(value) {
  return isObject(value) ? reactive(value) : value;
}
var RefImpl = class {
  _value = null;
  rawValue = null;
  dep = /* @__PURE__ */ new Set();
  __v_isRef = true;
  // 表示后续我们可以增加拆包的逻辑
  constructor(rawValue) {
    this.rawValue = rawValue;
    this._value = toReactive(rawValue);
  }
  get value() {
    console.log("ref");
    trackEffect(this.dep);
    return this._value;
  }
  set value(newVal) {
    if (newVal !== this.rawValue) {
      this.rawValue = newVal;
      this._value = toReactive(newVal);
      triggerEffect(this.dep);
    }
  }
};
function ref(value) {
  return new RefImpl(value);
}
var ObjectRefImpl = class {
  // 将某个属性转换为ref
  __v_isRef = true;
  // 表示后续我们可以增加拆包的逻辑
  constructor(object, key) {
    this._object = object;
    this._key = key;
  }
  get value() {
    console.log(this._object, this._key, 51, activeEffect12, 51, "----------------");
    return this._object[this._key];
  }
  set value(newVal) {
    this._object[this._key] = newVal;
  }
};
function toRef(object, key) {
  return new ObjectRefImpl(object, key);
}
function toRefs(object) {
  const ret = Array.isArray(object) ? new Array(pbject.length) : /* @__PURE__ */ Object.create(null);
  for (let key in object) {
    ret[key] = toRef(object, key);
  }
  return ret;
}
function proxyRefs(object) {
  return new Proxy(object, {
    get(target, key, receiver) {
      console.log(target, key, 79);
      const v = Reflect.get(target, key, receiver);
      if (isRef(v)) {
        return v.value;
      } else {
        return v;
      }
    },
    set(target, key, newVal, receiver) {
      const oldVal = Reflect.get(target, key, receiver);
      if (isRef(oldVal)) {
        oldVal.value = newVal;
        return true;
      } else {
        return Reflect.set(target, key, newVal, receiver);
      }
    }
  });
}

// packages/reactivity/src/handler.js
var mutableHandlers = {
  // 这里面的receiver就是proxy
  get(target, key, receiver) {
    if (key === "__v_isReactive") {
      return true;
    }
    if (isRef(target[key])) {
      return target[key].value;
    }
    if (isObject(target[key])) {
      return reactive(target[key]);
    }
    const res = Reflect.get(target, key, receiver);
    track(target, key);
    return res;
  },
  set(target, key, newValue, receiver) {
    const oldValue = Reflect.get(target, key, receiver);
    const r = Reflect.set(target, key, newValue, receiver);
    if (oldValue !== newValue) {
      trigger(target, key, newValue, oldValue);
    }
    return r;
  }
};

// packages/reactivity/src/reactive.js
var reactiveMap = /* @__PURE__ */ new WeakMap();
function reactive(value) {
  if (!isObject(value)) {
    return value;
  }
  let existingProxy = reactiveMap.get(value);
  if (existingProxy) {
    return existingProxy;
  }
  if (value["__v_isReactive"]) {
    return value;
  }
  const proxy = new Proxy(value, mutableHandlers);
  reactiveMap.set(value, proxy);
  return proxy;
}
function isReactive(value) {
  return value["__v_isReactive"];
}

// packages/reactivity/src/apiWatch.js
function traverse(value, seen = /* @__PURE__ */ new Set()) {
  if (!isObject(value)) {
    return value;
  }
  if (seen.has(value)) {
    return value;
  }
  seen.add(value);
  for (const key in value) {
    traverse(value[key], seen);
  }
  return value;
}
function dowatch(source, cb, options) {
  let getter = null;
  if (isReactive(source)) {
    getter = () => traverse(source);
  } else if (isFunction(source)) {
    getter = source;
  }
  let oldVal = null;
  let clear = null;
  const onCleanup = (fn) => {
    clear = fn;
  };
  const job = () => {
    if (cb) {
      const newVal = effect2.run();
      if (clear) {
        clear();
      }
      cb(newVal, oldVal, onCleanup);
      oldVal = newVal;
    } else {
      effect2.run();
    }
  };
  const effect2 = new ReactiveEffect(getter, job, "watch");
  oldVal = effect2.run();
}
function watch(source, cb, options) {
  return dowatch(source, cb, options);
}
function watchEffect(source, options) {
  return dowatch(source, null, options);
}

// packages/reactivity/src/computed.js
var ComputedRefImpl = class {
  _dirty = true;
  __v_isRef = true;
  // 表示后续我们可以增加拆包的逻辑
  dep = /* @__PURE__ */ new Set();
  constructor(getter, setter) {
    this.setter = setter;
    this.effect = new ReactiveEffect(getter, () => {
      if (!this._dirty) {
        this._dirty = true;
        triggerEffect(this.dep);
      }
    }, "computed");
  }
  get value() {
    trackEffect(this.dep);
    if (this._dirty) {
      this._dirty = false;
      this._value = this.effect.run();
    }
    return this._value;
  }
  set value(newVal) {
    this.setter(newVal);
  }
};
function computed(getterOrOptions) {
  let getter;
  let setter;
  const isGetter = isFunction(getterOrOptions);
  if (isGetter) {
    getter = getterOrOptions;
    setter = () => {
      console.log("warn");
    };
  } else {
    getter = getterOrOptions.get;
    setter = getterOrOptions.set;
  }
  console.log(getter, 16);
  console.log(setter, 17);
  return new ComputedRefImpl(getter, setter);
}
export {
  ReactiveEffect,
  computed,
  dowatch,
  effect,
  isReactive,
  isRef,
  proxyRefs,
  reactive,
  ref,
  toReactive,
  toRef,
  toRefs,
  track,
  trackEffect,
  trigger,
  triggerEffect,
  watch,
  watchEffect
};
//# sourceMappingURL=reactivity.js.map
