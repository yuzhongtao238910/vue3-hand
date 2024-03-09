const { build } = require("esbuild")
const { resolve } = require("path")
// const target = "reactivity"
const target = "runtime-dom"

build({
    // 打包的入口
    entryPoints: [ resolve(__dirname, `../packages/${target}/src/index.js`)],
    outfile: resolve(__dirname, `../packages/${target}/dist/${target}.js`),
    bundle: true, // 将依赖的模块全部打包
    sourcemap: true, // 支持调试
    format: "esm", // 打包出来的模块是esm，es6模块
    platform: "browser", // 打包的结果给浏览器使用
}).then(res => {
    console.log("watching")
})