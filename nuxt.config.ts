// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: ['nuxt-mongoose', '@nuxtjs/tailwindcss', '@nuxtjs/i18n'],
  i18n: {
    locales: [
      { code: 'en', iso: 'en-US', name: 'English', file: 'en.json' },
      { code: 'zh', iso: 'zh-CN', name: '中文', file: 'zh.json' }
    ],
    defaultLocale: 'en',
    strategy: 'no_prefix',
    detectBrowserLanguage: {
      useCookie: true,
      cookieKey: 'i18n_redirected',
      redirectOn: 'root',
      alwaysRedirect: true
    },
    langDir: 'locales/'
  },
  css: ['~/assets/css/main.css'],
  nitro: {
    experimental: {
      websocket: true
    }
  }
})
