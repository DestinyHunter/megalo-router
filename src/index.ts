import { joinQuery, parseUrl, deepClone, getUniRoutePath, getCurrentRoute } from './utils'
declare let uni: any
declare let getApp: Function

interface Route {
    query: object
    path: string
    fullPath: string
}
interface toRoute {
    query?: object
    path?: string
    fullPath?: string
    [key: string]: any
}
interface Platform {
    switchTab: Function
    navigateTo: Function
    redirectTo: Function
    navigateBack: Function
    reLaunch: Function
    [key: string]: any
}

class Router {
    currentRoute: Route
    protected _platform: Platform
    protected mode: string = 'strict'
    get platform () {
        const that = this
        return {
            ready (callback) {
                that.getPlatform()
                    .then(callback)
            }
        }
    }
    get app () {
        return getApp()
    }
    ready (callback) {
        const ready = () => this.currentRoute && this.currentRoute.path && getApp() && this._platform
        if (ready()) {
            callback()
        } else {
            const timer = setInterval(() => {
                if (ready()) {
                    callback()
                    clearInterval(timer)
                }
            }, 10)
        }
    }
    tabBars: string[]
    tabAction (to: toRoute): string {
        if (this.mode === 'strict') return 'switchTab'
        to.query = to.query || {}
        const hasQuery = Object.keys(to.query).length || /\?.*?=/.test(to.path!)
        if (hasQuery) {
            return 'reLaunch'
        }
        return 'switchTab'
    }
    push (to: string | toRoute = {}) {
        to = typeof to === 'string' ? { path: to } : to
        const { path } = parseUrl(to.path || '') as Route
        let action = this.tabBars.includes(path) ? this.tabAction(to) : 'navigateTo'
        this.navigate(action, to)
    }
    replace (to: string | toRoute = {}) {
        to = typeof to === 'string' ? { path: to } : to
        const { path } = parseUrl(to.path || '') as Route
        let action = this.tabBars.includes(path) ? this.tabAction(to) : 'redirectTo'
        this.navigate(action, to)
    }
    async go (delta: number) {
        if (!delta) {
            this.reLaunch(this.currentRoute)
        }
        delta = -delta
        const platform: Platform = await this.getPlatform()
        platform.navigateBack({ delta })
    }
    back (): void {
        this.go(-1)
    }
    reLaunch (to: string | toRoute = {}) {
        to = typeof to === 'string' ? { path: to } : to
        this.navigate('reLaunch', to)
    }
    async navigate (action:string = 'navigateTo', to: toRoute = {}) {
        try {
            if (!to.path) throw new Error('path 不能为空')
            const {
                path,
                query = {},
                success = () => {},
                fail = (err) => {
                    err.to = to
                    throw new Error(err)
                },
                complete = () => {}
            } = to
            // 如果有参数，拼接参数
            let url:string = Object.keys(query).length ? joinQuery(path, query) : path
            // 转换为符合megalo要求的相对路径
            url = await getUniRoutePath(url)
            const platform: Platform = await this.getPlatform()
            platform[action]({
                url,
                success,
                fail,
                complete
            })
        } catch (e) {
            throw new Error(e)
        }
    }
    getPlatform (): Promise<Platform> {
        return new Promise<Platform>(resolve => {
            if (this._platform) {
                resolve(this._platform)
            } else {
                const timer = setInterval(() => {
                    if (this._platform) {
                        resolve(this._platform)
                        clearInterval(timer)
                    }
                }, 10)
            }
        })
    }
    install (Vue, options) {
        const router = this
        router.tabBars = options.tabBars || []
        router.mode = options.mode || 'strict'
        
        Object.defineProperty(Vue.prototype, '$Router', {
            get () {
                return router
            },
            set () {
                throw new Error('不能修改$Router的值')
            }
        })
        Object.defineProperty(Vue.prototype, '$Route', {
            get () {
                return router.currentRoute
            },
            set () {
                throw new Error('不能修改$Route的值')
            }
        })
        Vue.mixin({
            onLaunch () {
                // let platformType = this.$mp ? this.$mp.platform : undefined
                let platformType = uni ? uni.getSystemInfoSync().platform : undefined

                // console.warn(`uni-router识别平台成功，当前平台, ${appType} : ${platformType}`)
                console.warn(`uni-router识别平台成功，当前平台,  ${platformType}`)
            },
            onLoad () {
                if (this.$mp && this.$mp.page && this.$mp.page.route) {
                    const path = '/' + this.$mp.page.route
                    router.currentRoute = {
                        query: this.$mp.query,
                        path,
                        fullPath: joinQuery(path, this.$mp.query)
                    }
                }
                if (router._platform) return
                // let platformType = this.$mp ? this.$mp.platform : undefined
                router._platform = uni as Platform
                
            },
            // onShow 里面还需要重新赋值一次，用于页面回退的时候纠正
            onShow () {
                if (this.$mp && this.$mp.page && this.$mp.page.route) {
                    const path = '/' + this.$mp.page.route
                    router.currentRoute = {
                        query: this.$mp.query,
                        path,
                        fullPath: joinQuery(path, this.$mp.query)
                    }
                }
            }
        } as any)
    }
}

export default new Router()
