import { createApp, createSSRApp, nextTick } from 'vue'
import type { App } from 'vue'

// This file must be imported first as we set globalThis.$fetch via this import
import '#build/fetch.mjs'

import { applyPlugins, createNuxtApp } from './nuxt'
import type { CreateOptions } from './nuxt'

import { createError } from './composables/error'

import '#build/css'
// @ts-expect-error virtual file
import plugins from '#build/plugins'
// @ts-expect-error virtual file
import RootComponent from '#build/root-component.mjs'
// @ts-expect-error virtual file
import { appId, runningMultiApp, vueAppRootContainer } from '#build/nuxt.config.mjs'

let entry: (ssrContext?: CreateOptions['ssrContext']) => Promise<App<Element>>

if (import.meta.server) {
  entry = async function createNuxtAppServer (ssrContext: CreateOptions['ssrContext']) {
    const vueApp = createApp(RootComponent)

    const nuxt = createNuxtApp({ vueApp, ssrContext })

    try {
      await applyPlugins(nuxt, plugins)
      await nuxt.hooks.callHook('app:created', vueApp)
    } catch (error) {
      await nuxt.hooks.callHook('app:error', error)
      nuxt.payload.error = nuxt.payload.error || createError(error as any)
    }
    if (ssrContext?._renderResponse) { throw new Error('skipping render') }

    return vueApp
  }
}

if (import.meta.client) {
  // TODO: temporary webpack 5 HMR fix
  // https://github.com/webpack-contrib/webpack-hot-middleware/issues/390
  if (import.meta.dev && import.meta.webpackHot) {
    import.meta.webpackHot.accept()
  }

  // eslint-disable-next-line
  let vueAppPromise: Promise<App<Element>>

  entry = async function initApp () {
    if (vueAppPromise) { return vueAppPromise }

    const isServerRendered = (!runningMultiApp ? window.__NUXT__ : window.__NUXT__?.[appId])?.serverRendered
    const nuxtDataElement = !runningMultiApp ? document.getElementById('__NUXT_DATA__') : document.querySelector(`[data-nuxt-data="${appId}"]`) as HTMLElement

    const isSSR = Boolean(isServerRendered || nuxtDataElement?.dataset.ssr === 'true')
    const vueApp = isSSR ? createSSRApp(RootComponent) : createApp(RootComponent)

    const nuxt = createNuxtApp({ vueApp })

    async function handleVueError (error: any) {
      await nuxt.callHook('app:error', error)
      nuxt.payload.error = nuxt.payload.error || createError(error as any)
    }

    vueApp.config.errorHandler = handleVueError

    try {
      await applyPlugins(nuxt, plugins)
    } catch (err) {
      handleVueError(err)
    }

    try {
      await nuxt.hooks.callHook('app:created', vueApp)
      await nuxt.hooks.callHook('app:beforeMount', vueApp)
      vueApp.mount(vueAppRootContainer)
      await nuxt.hooks.callHook('app:mounted', vueApp)
      await nextTick()
    } catch (err) {
      handleVueError(err)
    }

    // If the errorHandler is not overridden by the user, we unset it
    if (vueApp.config.errorHandler === handleVueError) { vueApp.config.errorHandler = undefined }

    return vueApp
  }

  vueAppPromise = entry().catch((error: unknown) => {
    console.error('Error while mounting app:', error)
    throw error
  })
}

export default (ssrContext?: CreateOptions['ssrContext']) => entry(ssrContext)
