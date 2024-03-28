### vue3之中的模板编译优化
1.1 patchFlags 优化
diff算法无法避免虚拟dom之中无用的比较操作，通过patchFlags来标记动态内容，可以快速的实现diff算法
```html
<div>
	<!-- h1就是一个死标签，根本都不会变化 -->
	<h1>hello</h1>
	<span>{{ name }}</span>
	<p><span>{{age}}</span></p>
</div>
```

靶向更新 1对1更新，将根节点当作一个代码块，让他来收集子节点之中变化的部分