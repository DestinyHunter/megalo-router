# vue-router-uni
配合dcloud框架uni使用的Router,尽量保持与vue-router一致的开发体验，减少技术成本，方便项目从web迁移到uni

修改自 https://github.com/NextBoy/megalo-router, 只是简单改成uni,platform 无法判断

优化uni的分包页面的跳转写法

uni默认的分包页面之间的跳转比较麻烦，需要写相对路径，例如
例如从 home/index 跳转的到 packgeA/pages/a/index，相对路径为 ../../packgeA/pages/a/index。

使用vue-Router-uni则没有这种烦恼，直接
```js
    $Router.push('/packgeA/pages/a/index')
```

## 版本记录
- 1.0.1
    
    feat: 增加back() 方法

- 1.0.2

    fix: 修复APP.vue的onLaunch里面调用报错的问题
    
- 1.0.3

    feat: 增加$Router.ready方法          
    feat: 增加Router模式配置          
    feat: 增加$Router.app 获取全局对象   

- 1.0.4

    fix: 修复在最新的脚手架生成的项目下无法运行的问题          

## 安装

``` bash
npm i vue-router-uni --save
```

## 使用

``` js
// app.js or main.js
import Router  from 'vue-router-uni'

Vue.use(Router, {
    mode: 'strict' // strict or loose 可配置项，不配置的话默认为strict
    tabBars: [ // 必须配置项
        '/pages/hello',
        '/pages/my/index'
    ]
})
```
Vue.use的option接受一个tabBars变量, 参数为小程序的tabBar路径列表

Vue.use的option接受一个mode变量, 表示路由的模式，有两种模式可选，strict 或者 loose，默认是严格模式

- strict 严格模式，如果使用push 或者 replace携带参数跳转到tab页面，将使用switchTab进行跳转，此时tab页面是无法接收到参数的，这是小程序自身的限制，switchTab无法传参
- loose 宽松模式，如果使用push 或者 replace携带参数跳转到tab页面，将使用reLaunch进行跳转，此时tab页面可以接收到参数的，但是这意味着小程序将重新载入

注意：该路径必须以 '/' 开头

## API

> 支持以下列出的方法及属性

### Router 实例

#### 属性

* $Router.app

获取全局的app,相当于getApp()

注意：在App.vue中使用的话需要结合$Router.ready(()；在普通的page页面使用则无限制

在普通页面使用
```page.vue

onReady () {
    console.log(this.$Router.app)
}
```
在App.vue使用

```App.vue
    onLaunch () {
        this.$Router.ready(() => { 
            console.log(this.$Router.app) // 成功 
        })
    }

```

* $Router.currentRoute & $Route

包含如下信息：
```js
{
    query: {} // 页面路由参数
    path: '' // 不带参数的基本路径
    fullPath: '' // 完整路径，带参数
}
```
在page页面内通过$Route获取参数(在APP.vue里面使用$Route的话需要结合$Router.ready)

在普通页面使用
```page.vue

onReady () {
    console.log(this.$Route.query)
    console.log(this.$Route.path)
    console.log(this.$Route.fullPath)
}
```
在App.vue使用

```App.vue
    onLaunch () {
        this.$Router.ready(() => {
            console.log(this.$Route) // 成功 
            console.log(this.$Router.currentRoute) // 成功 
        })
    }

```

#### 方法

* $Router.ready()

接收一个回调函数作为参数

在App.vue中获取$Router.app、$Route对象 或者 $Router.currentRoute，需要调用$Router.ready

```App.vue
    onLaunch () {
        this.$Router.ready(() => {
            console.log(this.$Router.app) // 成功
            console.log(this.$Route) // 成功
        
        })
    }

```
如果在App.vue中不使用ready方法直接获取 $Router.app或者$Route的话会导致失败，因为此时Router并未初始化完成

* $Router.push()

打开一个新页面，如果是打开tabBar页面，实际是使用switchTab, 否则使用navigateTo

**如果是跳转到tabBar页面，是无法进行传参的，如果真的要传参到tabBar页面，请使用reLaunch 或者路由模式配置为宽松模式（loose）**
```js
    // 使用参数和路径进行跳转
    $Router.push({query: {id: 1}, path: '/pages/hello/index'})
    // 或者直接传递一个路径
    $Router.push('/pages/hello/index?id=1')
```
* $Router.replace()

在当前页面打开新页面进行替换，如果是打开tabBar页面，实际是使用switchTab, 否则使用redirectTo

**如果是跳转到tabBar页面，是无法进行传参的，如果真的要传参到tabBar页面，请使用reLaunch 或者路由模式配置为宽松模式（loose）**
```js
    // 使用参数和路径进行跳转
    $Router.replace({query: {id: 1}, path: '/pages/hello/index'})
    // 或者直接传递一个路径
    $Router.replace('/pages/hello/index?id=1')
```
* $Router.go()

回退页面
```js
    $Router.go(-1) // 后退一页
    $Router.go(0) // 重新载入当前页面 相当于reLaunch当前页面
```
* $Router.back()

回到上一页，同$Router.go(-1)

* $Router.reLaunch()

重新载入小程序
```js
    // 使用参数和路径进行跳转
    $Router.reLaunch({query: {id: 1}, path: '/pages/hello/index'})
    // 或者直接传递一个路径
    $Router.reLaunch('/pages/hello/index?id=1')
```
* $Router.getPlatform()

获取当前所在平台对象，返回值为一个Promise

使用方法
```page.vue
async onReady () {
    const platform = await this.$Router.getPlatform()
    console.log(platform)
    // 微信小程序里面得到的是wx对象
    // 百度小程序里面得到的是swan对象
    // 支付宝小程序里面得到的是my对象
}
```

* $Router.platform.ready()

接收一个回调，回调的参数为当前所在平台对象，作用跟getPlatform一样，是基于getPlatform的封装

使用方法
```page.vue
async mounted () {
    this.$Router.platform.ready(platform => {
        console.log(platform)
        // 微信小程序里面得到的是wx对象
        // 百度小程序里面得到的是swan对象
        // 支付宝小程序里面得到的是my对象
    })
}
```

## 提示
- 传参问题
    
    tabBar页面接收参数的话应该使用reLaunch(小程序自身的限制) 或者开启路由的宽松模式
    
    如果query传参中带有路径或者网址作为参数，请使用encodeURIComponent 和 decodeURIComponent进行编码解码传递，否则可能发生未知错误或者丢参
    
- 跳转路径问题

    所有跳转的路径都是使用'/'开头的
    
- 路由跳转回调问题

    如果需要对跳转的成功或者失败进行回调处理，可以在跳转时候传入回调
    ```js
    $Router.replace({
      query: {id: 1},
      path: '/pages/hello/index',
      success: (res) => {console.log('跳转成功', res)},  
      fail: (err) => {console.log('跳转失败', err)},
      complete: (res) => {console.log('跳转结束', res)}
    }
  )
    ```
    



