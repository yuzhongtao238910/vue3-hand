// packages/runtime-dom/src/nodeOps.js
var nodeOps = {
  // 创建元素
  createElement(element) {
    return document.createElement(element);
  },
  // 创建文本
  createText(text) {
    return document.createTextNode(text);
  },
  // 对元素的插入
  insert(element, container, anchor = null) {
    container.insertBefore(element, anchor);
  },
  // 对元素的删除 方法
  remove(child) {
    const parent = child.parentNode;
    if (parent) {
      parent.removeChild(child);
    }
  },
  // 元素的查询
  querySelector(selector) {
    return document.querySelector(selector);
  },
  // 设置元素的文本内容 innerHTML不安全 这里面使用的是textContent
  setElementText(element, text) {
    element.textContent = text;
  },
  setText(textNode, text) {
    textNode.nodeValue = text;
  },
  // 创建注释节点
  createComment(text) {
    return document.createComment(text);
  },
  nextSibling(node) {
    return node.nextSibling;
  },
  parentNode(node) {
    return node.parentNode;
  }
};

// packages/runtime-dom/src/modules/class.js
function patchClass(el, nextVal) {
  if (nextVal == null) {
    el.removeAttribute("class");
  } else {
    el.className = nextVal;
  }
}

// packages/runtime-dom/src/modules/style.js
function patchStyle(el, prevVal, nextVal) {
  const style = el.style;
  if (nextVal) {
    for (let key in nextVal) {
      style[key] = nextVal[key];
    }
  }
  if (prevVal) {
    for (let key in prevVal) {
      if (nextVal[key] == null) {
        style[key] = null;
      }
    }
  }
}

// packages/runtime-dom/src/modules/event.js
function createInvoker(nextVal) {
  const fn = (evt) => {
    fn.value(evt);
  };
  fn.value = nextVal;
  return fn;
}
function patchEvent(el, rawName, nextVal) {
  const invokers = el._vei || (el._vei = {});
  let eventName = rawName.slice(2).toLowerCase();
  const existingInvoker = invokers[eventName];
  if (nextVal && existingInvoker) {
    existingInvoker.value = nextVal;
  } else {
    if (nextVal) {
      const invoker = invokers[eventName] = createInvoker(nextVal);
      el.addEventListener(eventName, invoker);
    } else if (existingInvoker) {
      el.removeEventListener(eventName, existingInvoker);
      invokers[eventName] = null;
    }
  }
}

// packages/runtime-dom/src/modules/attr.js
function patchAttr(el, key, nextVal) {
  if (nextVal) {
    el.setAttribute(key, nextVal);
  } else {
    el.removeAttribute(key);
  }
}

// packages/runtime-dom/src/patchProp.js
function patchProp(el, key, prevVal, nextVal) {
  if (key === "class") {
    patchClass(el, nextVal);
  } else if (key === "style") {
    patchStyle(el, prevVal, nextVal);
  } else if (/^on[^a-z]/.test(key)) {
    patchEvent(el, key, nextVal);
  } else {
    patchAttr(el, key, nextVal);
  }
}

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
function isString(value) {
  return typeof value === "string";
}

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

// packages/runtime-core/src/seq.js
function getSeq(arr) {
  const result = [0];
  const len = arr.length;
  const p2 = arr.slice(0).fill(-1);
  let start;
  let end;
  let middle;
  for (let i2 = 0; i2 < len; i2++) {
    const arrI = arr[i2];
    if (arrI !== 0) {
      let resultLastIndex = result[result.length - 1];
      if (arr[resultLastIndex] < arrI) {
        result.push(i2);
        p2[i2] = resultLastIndex;
        continue;
      }
      start = 0;
      end = result.length - 1;
      while (start < end) {
        middle = (start + end) / 2 | 0;
        if (arr[result[middle]] < arrI) {
          start = middle + 1;
        } else {
          end = middle;
        }
      }
      p2[i2] = result[start - 1];
      result[start] = i2;
    }
  }
  let i = result.length;
  let last = result[i - 1];
  while (i-- > 0) {
    result[i] = last;
    last = p2[last];
  }
  return result;
}
getSeq([2, 3, 1, 5, 6, 8, 7, 9, 4]);

// packages/runtime-core/src/createVNode.js
var Text = Symbol();
var Fragment = Symbol();
function isVNode(value) {
  return value.__v_isVNode;
}
function isSameVnode(n1, n2) {
  return n1.type === n2.type && n1.key === n2.key;
}
function createVNode(type, props, children = null) {
  const shapeFlag = isString(type) ? ShapeFlags.ELEMNT : isObject(type) ? ShapeFlags.STATEFUL_COMPONENT : 0;
  const vnode = {
    __v_isVNode: true,
    // 判断对象是不是虚拟节点可以采用这个字段
    type,
    props,
    children,
    key: props?.key,
    // 虚拟节点的key，主要用于diff算法
    el: null,
    // 虚拟节点对应的真实的节点
    shapeFlag
    // 靠位运算 & 都是1就是1  按位或：有一个1就是1
  };
  if (children) {
    let type2 = 0;
    if (Array.isArray(children)) {
      type2 |= ShapeFlags.ARRAY_CHILDREN;
    } else if (isObject(children)) {
      type2 = ShapeFlags.SLOTS_CHILDREN;
    } else {
      vnode.children = String(children);
      type2 |= ShapeFlags.TEXT_CHILDREN;
    }
    vnode.shapeFlag |= type2;
  }
  return vnode;
}

// packages/reactivity/dist/reactivity.js
window.activeEffect12 = void 0;
var id2 = 0;
function cleanupEffect2(effect2) {
  const { deps } = effect2;
  for (let i = 0; i < deps.length; i++) {
    deps[i].delete(effect2);
  }
  effect2.deps.length = 0;
}
var ReactiveEffect2 = class {
  constructor(fn, scheduler, flag) {
    this.fn = fn;
    this.id = id2++;
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
      cleanupEffect2(this);
      return this.fn();
    } finally {
      window.activeEffect12 = this.parent;
      this.parent = null;
    }
  }
  stop() {
    if (this.active) {
      this.active = false;
      cleanupEffect2(this);
    }
  }
};
var targetMap2 = /* @__PURE__ */ new WeakMap();
function track2(target, key) {
  if (window.activeEffect12) {
    let depsMap = targetMap2.get(target);
    if (!depsMap) {
      targetMap2.set(target, depsMap = /* @__PURE__ */ new Map());
    }
    let dep = depsMap.get(key);
    if (!dep) {
      depsMap.set(key, dep = /* @__PURE__ */ new Set());
    }
    trackEffect2(dep);
  }
}
function trackEffect2(dep) {
  let shouldTrack = !dep.has(window.activeEffect12);
  if (shouldTrack) {
    dep.add(window.activeEffect12);
    window.activeEffect12.deps.push(dep);
  }
}
function trigger2(target, key, newValue, oldValue) {
  const depsMap = targetMap2.get(target);
  if (!depsMap) {
    return;
  }
  const deps = depsMap.get(key);
  triggerEffect2(deps);
}
function triggerEffect2(deps) {
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
var ShapeFlags2 = {
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
var isObject2 = (val) => {
  return val != null && typeof val === "object";
};
function isRef2(value) {
  return !!(value && value.__v_isRef);
}
function proxyRefs2(object) {
  return new Proxy(object, {
    get(target, key, receiver) {
      console.log(target, key, 79);
      const v = Reflect.get(target, key, receiver);
      if (isRef2(v)) {
        return v.value;
      } else {
        return v;
      }
    },
    set(target, key, newVal, receiver) {
      const oldVal = Reflect.get(target, key, receiver);
      if (isRef2(oldVal)) {
        oldVal.value = newVal;
        return true;
      } else {
        return Reflect.set(target, key, newVal, receiver);
      }
    }
  });
}
var mutableHandlers2 = {
  // 这里面的receiver就是proxy
  get(target, key, receiver) {
    if (key === "__v_isReactive") {
      return true;
    }
    if (isRef2(target[key])) {
      return target[key].value;
    }
    if (isObject2(target[key])) {
      return reactive2(target[key]);
    }
    const res = Reflect.get(target, key, receiver);
    track2(target, key);
    return res;
  },
  set(target, key, newValue, receiver) {
    const oldValue = Reflect.get(target, key, receiver);
    const r = Reflect.set(target, key, newValue, receiver);
    if (oldValue !== newValue) {
      trigger2(target, key, newValue, oldValue);
    }
    return r;
  }
};
var reactiveMap2 = /* @__PURE__ */ new WeakMap();
function reactive2(value) {
  if (!isObject2(value)) {
    return value;
  }
  let existingProxy = reactiveMap2.get(value);
  if (existingProxy) {
    return existingProxy;
  }
  if (value["__v_isReactive"]) {
    return value;
  }
  const proxy = new Proxy(value, mutableHandlers2);
  reactiveMap2.set(value, proxy);
  return proxy;
}

// packages/runtime-core/src/scheduler.js
var queue = [];
var isFlushing = false;
var p = Promise.resolve();
function queueJob(job) {
  if (!queue.includes(job)) {
    queue.push(job);
  }
  if (!isFlushing) {
    isFlushing = true;
    p.then(() => {
      isFlushing = false;
      let copyQueue = queue.slice(0);
      queue.length = 0;
      copyQueue.forEach((job2) => {
        job2();
      });
      copyQueue.length = 0;
    });
  }
}

// packages/runtime-core/src/component.js
function createComponentInstance(n2) {
  const instance = {
    state: {},
    vnode: n2,
    // 组件的虚拟节点
    update: null,
    // 一个自定义的更新方法，如果用户希望强制更新，就可以调用这个方法
    isMounted: false,
    // 默认组件没有初始化，初始化后会将此属性isMounted 变为true
    subTree: null,
    attrs: {},
    props: {},
    propsOptions: n2.type.props || {},
    // 组件之中接收的属性
    proxy: null,
    render: null,
    setupState: {},
    exposed: {},
    slots: {}
    // 存储当前组件提供的插槽
  };
  return instance;
}
var initProps = (instance, userProps) => {
  const attrs = {};
  const props = {};
  const options = instance.propsOptions || {};
  if (userProps) {
    for (let key in userProps) {
      const value = userProps[key];
      if (key in options) {
        props[key] = value;
      } else {
        attrs[key] = value;
      }
    }
  }
  instance.attrs = attrs;
  instance.props = reactive2(props);
};
var publicProperties = {
  $attrs: (i) => i.attrs,
  // proxy.$attrs
  $slots: (i) => i.slots
  // proxy.$slots
};
function initSlots(instance, children) {
  if (instance.vnode.shapeFlag & ShapeFlags.SLOTS_CHILDREN) {
    instance.slots = children;
  }
}
function setupComponent(instance) {
  const { props, type, children } = instance.vnode;
  instance.vnode.component = instance;
  initProps(instance, props);
  initSlots(instance, children);
  instance.proxy = new Proxy(instance, {
    get(target, key, receiver) {
      const { state, props: props2, setupState } = target;
      if (key in setupState) {
        return setupState[key];
      }
      if (state && key in state) {
        return state[key];
      } else if (key in props2) {
        return props2[key];
      }
      let getter = publicProperties[key];
      if (getter) {
        return getter(instance);
      }
    },
    set(target, key, newValue, receiver) {
      const { state, props: props2, setupState } = target;
      if (key in setupState) {
        setupState[key] = newValue;
        return true;
      }
      if (state && key in state) {
        state[key] = newValue;
        return true;
      } else if (key in props2) {
        console.warn("\u4E0D\u5141\u8BB8\u4FEE\u6539props");
        return true;
      }
      return true;
    }
  });
  let { data, setup, render: render2 } = type;
  if (setup) {
    const context = {
      attrs: instance.attrs,
      emit(eventName, ...args) {
        const bindName = `on${eventName[0].toUpperCase()}${eventName.slice(1)}`;
        const handler = instance.attrs[bindName];
        if (handler) {
          let handlers = Array.isArray(handler) ? handler : [handler];
          handlers.forEach((handler2) => handler2(...args));
        }
      },
      expose(exposed) {
        instance.exposed = exposed;
      },
      slots: instance.slots
      // 插槽的更新，是
      // 组件的生命周期
      // vue3之中的靶向更新，ast语法树，组件的编译优化 代码转化 代码生成
      // 组件的实现
      // pinia
      // vue-router 的 原理
      // provide inject
      //     return
      // }
    };
    const setupResult = setup(instance.props, context);
    if (isFunction(setupResult)) {
      instance.render = setupResult;
    } else {
      instance.setupState = proxyRefs2(setupResult);
    }
  }
  if (isFunction(data)) {
    instance.state = reactive2(data.call(instance.proxy));
  }
  if (!instance.render) {
    instance.render = render2;
  }
}

// packages/runtime-core/src/renderer.js
function createRenderer(renderOptions2) {
  const {
    createElement: hostCreateElement,
    createText: hostCreateText,
    insert: hostInsert,
    remove: hostRemove,
    querySelector: hostQuerySelector,
    setElementText: hostSetElementText,
    setText: hostSetText,
    createComment: hostCreateComment,
    nextSibling: hostNextSibling,
    parentNode: hostParentNode,
    patchProp: hostPatchProp
  } = renderOptions2;
  const mountChildren = (children, container) => {
    children.forEach((child) => {
      patch(null, child, container);
    });
  };
  const unmountChildren = (children) => {
    children.forEach((child) => {
      unmount(child);
    });
  };
  const unmount = (vnode) => {
    const { shapeFlag, type, children } = vnode;
    if (type === Fragment) {
      return unmountChildren(children);
    }
    hostRemove(vnode.el);
  };
  const mountElement = (vnode, container, anchor) => {
    const { type, props, children, shapeFlag } = vnode;
    const el = hostCreateElement(type);
    vnode.el = el;
    if (props) {
      for (let key in props) {
        hostPatchProp(el, key, null, props[key]);
      }
    }
    if (children) {
      if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
        hostSetElementText(el, children);
      } else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
        mountChildren(children, el);
      }
    }
    hostInsert(el, container, anchor);
  };
  const patchProps = (oldProps, newProps, el) => {
    if (oldProps === newProps) {
      return;
    }
    for (let key in newProps) {
      let prevVal = oldProps[key];
      let nextVal = newProps[key];
      if (prevVal !== nextVal) {
        hostPatchProp(el, key, prevVal, nextVal);
      }
    }
    for (let key in oldProps) {
      if (!(key in newProps)) {
        hostPatchProp(el, key, oldProps[key], {});
      }
    }
  };
  const patchKeyChildren = (c1, c2, el) => {
    let i = 0;
    let e1 = c1.length - 1;
    let e2 = c2.length - 1;
    while (i <= e1 && i <= e2) {
      const n1 = c1[i];
      const n2 = c2[i];
      if (isSameVnode(n1, n2)) {
        patch(n1, n2, el);
      } else {
        break;
      }
      i++;
    }
    while (i <= e1 && i <= e2) {
      const n1 = c1[e1];
      const n2 = c2[e2];
      if (isSameVnode(n1, n2)) {
        patch(n1, n2, el);
      } else {
        break;
      }
      e1--;
      e2--;
    }
    if (i > e1) {
      while (i <= e2) {
        const nextPos = e2 + 1;
        const anchor = c2[nextPos]?.el;
        patch(null, c2[i], el, anchor);
        i++;
      }
    } else if (i > e2) {
      while (i <= e1) {
        unmount(c1[i]);
        i++;
      }
    }
    let s1 = i;
    let s2 = i;
    const keyToNewIndexMap = /* @__PURE__ */ new Map();
    const toBePatched = e2 - s2 + 1;
    const newIndexToOldIndex = new Array(toBePatched).fill(0);
    for (let i2 = s2; i2 <= e2; i2++) {
      keyToNewIndexMap.set(c2[i2].key, i2);
    }
    for (let i2 = s1; i2 <= e1; i2++) {
      const vnode = c1[i2];
      let newIndex = keyToNewIndexMap.get(vnode.key);
      if (newIndex == void 0) {
        unmount(vnode);
      } else {
        newIndexToOldIndex[newIndex - s2] = i2 + 1;
        patch(vnode, c2[newIndex], el);
      }
    }
    const increasingNewIndexSequence = getSeq(newIndexToOldIndex);
    let j = increasingNewIndexSequence.length - 1;
    for (let i2 = toBePatched - 1; i2 >= 0; i2--) {
      const current = s2 + i2;
      const curNode = c2[current];
      const anchor = c2[current + 1]?.el;
      if (newIndexToOldIndex[i2] == 0) {
        patch(null, curNode, el, anchor);
      } else {
        if (i2 === increasingNewIndexSequence[j]) {
          j--;
        } else {
          hostInsert(curNode.el, el, anchor);
        }
      }
    }
  };
  const patchChildren = (n1, n2, el) => {
    const c1 = n1.children;
    const c2 = n2.children;
    const prevShapeFlag = n1.shapeFlag;
    const shapeFlag = n2.shapeFlag;
    if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
      if (prevShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
        unmountChildren(c1);
      }
      if (c1 !== c2) {
        hostSetElementText(el, c2);
      }
    } else {
      if (prevShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
        if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
          patchKeyChildren(c1, c2, el);
        } else {
          unmountChildren(c1);
        }
      } else {
        if (prevShapeFlag & ShapeFlags.TEXT_CHILDREN) {
          hostSetElementText(el, "");
        }
        if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
          mountChildren(c2, el);
        }
      }
    }
  };
  const patchElement = (n1, n2) => {
    let el = n2.el = n1.el;
    const oldProps = n1.props || {};
    const newProps = n2.props || {};
    patchProps(oldProps, newProps, el);
    patchChildren(n1, n2, el);
  };
  const processElement = (n1, n2, container, anchor) => {
    if (n1 == null) {
      mountElement(n2, container, anchor);
    } else {
      patchElement(n1, n2);
    }
  };
  const processText = (n1, n2, el) => {
    if (n1 === null) {
      hostInsert(n2.el = hostCreateText(n2.children), el);
    } else {
      let el2 = n2.el = n1.el;
      if (n1.children === n2.children) {
        return;
      }
      hostSetText(el2, n2.children);
    }
  };
  function updateProps(instance, nextProps) {
    let prevProps = instance.props;
    for (let key in nextProps) {
      prevProps[key] = nextProps[key];
    }
    for (let key in prevProps) {
      if (!(key in nextProps)) {
        delete prevProps[key];
      }
    }
  }
  function updatePreRender(instance, next) {
    instance.next = null;
    instance.vnode = next;
    updateProps(instance, next.props);
  }
  const setupRendererEffect = (instance, el, anchor) => {
    const componentUpdateFn = () => {
      if (!instance.isMounted) {
        const subTree = instance.render.call(instance.proxy, instance.proxy);
        patch(null, subTree, el, anchor);
        instance.subTree = subTree;
        instance.isMounted = true;
      } else {
        const prevSubTree = instance.subTree;
        const next = instance.next;
        if (next) {
          updatePreRender(instance, next);
        }
        const nextSubTree = instance.render.call(instance.proxy, instance.proxy);
        instance.subTree = nextSubTree;
        patch(prevSubTree, nextSubTree, el, anchor);
      }
    };
    const effect2 = new ReactiveEffect2(componentUpdateFn, () => {
      queueJob(instance.update);
    });
    const update = instance.update = effect2.run.bind(effect2);
    update();
  };
  const mountComponent = (n2, el, anchor) => {
    const instance = createComponentInstance(n2);
    setupComponent(instance);
    setupRendererEffect(instance, el, anchor);
  };
  function hasChanged(oldProps = {}, newProps = {}) {
    let oldKeys = Object.keys(oldProps);
    let newKeys = Object.keys(newProps);
    if (oldKeys.length !== newKeys.length) {
      return true;
    }
    for (let i = 0; i < newKeys.length; i++) {
      const key = newKeys[i];
      if (newProps[key] !== oldProps[key]) {
        return false;
      }
    }
    return false;
  }
  function shouldComponentUpdate(n1, n2) {
    const oldProps = n1.props;
    const newProps = n2.props;
    if (oldProps == newProps) {
      return false;
    }
    return hasChanged(oldProps, newProps);
  }
  const updateComponent = (n1, n2, el, anchor) => {
    const instance = n2.component = n1.component;
    if (shouldComponentUpdate(n1, n2)) {
      instance.next = n2;
      instance.update();
    }
  };
  const processComponent = (n1, n2, el, anchor) => {
    if (n1 == null) {
      mountComponent(n2, el, anchor);
    } else {
      updateComponent(n1, n2, el, anchor);
    }
  };
  const processFragment = (n1, n2, el) => {
    if (n1 == null) {
      mountChildren(n2.children, el);
    } else {
      patchKeyChildren(n1.children, n2.children, el);
    }
  };
  const patch = (n1, n2, container, anchor = null) => {
    if (n1 && !isSameVnode(n1, n2)) {
      unmount(n1);
      n1 = null;
    }
    const { type, shapeFlag } = n2;
    switch (type) {
      case Text:
        processText(n1, n2, container);
        break;
      case Fragment:
        processFragment(n1, n2, container);
        break;
      default:
        if (shapeFlag & ShapeFlags.ELEMNT) {
          processElement(n1, n2, container, anchor);
        } else if (shapeFlag & ShapeFlags.COMPONENT) {
          processComponent(n1, n2, container, anchor);
        }
    }
  };
  const render2 = (vnode, container) => {
    if (vnode == null) {
      if (container._vnode) {
        unmount(container._vnode);
      }
    } else {
      patch(container._vnode || null, vnode, container);
    }
    container._vnode = vnode;
  };
  return {
    render: render2
  };
}

// packages/runtime-core/src/h.js
function h(type, propsOrChildren, children) {
  const l = arguments.length;
  if (l === 2) {
    if (isObject(propsOrChildren) && !Array.isArray(propsOrChildren)) {
      if (isVNode(propsOrChildren)) {
        return createVNode(type, null, [propsOrChildren]);
      }
      return createVNode(type, propsOrChildren);
    } else {
      return createVNode(type, null, propsOrChildren);
    }
  } else {
    if (l > 3) {
      children = Array.from(arguments).slice(2);
    }
    if (l === 3 && isVNode(children)) {
      children = [children];
    }
    return createVNode(type, propsOrChildren, children);
  }
}

// packages/runtime-dom/src/index.js
var renderOptions = Object.assign(nodeOps, { patchProp });
function createRenderer2(renderOptions2) {
  return createRenderer(renderOptions2);
}
function render(vnode, container) {
  const renderer = createRenderer2(renderOptions);
  return renderer.render(vnode, container);
}
export {
  Fragment,
  ReactiveEffect,
  Text,
  computed,
  createRenderer2 as createRenderer,
  createVNode,
  dowatch,
  effect,
  h,
  isReactive,
  isRef,
  isSameVnode,
  isVNode,
  proxyRefs,
  reactive,
  ref,
  render,
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
//# sourceMappingURL=runtime-dom.js.map
