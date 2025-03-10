import { defineUntypedSchema } from 'untyped'
import { template as loadingTemplate } from '../../../ui-templates/dist/templates/loading'

export default defineUntypedSchema({
  devServer: {
    /**
     * Whether to enable HTTPS.
     * @example
     * ```ts
     * export default defineNuxtConfig({
     *   devServer: {
     *     https: {
     *       key: './server.key',
     *       cert: './server.crt'
     *     }
     *   }
     * })
     * ```
     * @type {boolean | { key: string; cert: string } | { pfx: string; passphrase: string }}
     */
    https: false,

    /** Dev server listening port */
    port: process.env.NUXT_PORT || process.env.NITRO_PORT || process.env.PORT || 3000,

    /** Dev server listening host */
    host: process.env.NUXT_HOST || process.env.NITRO_HOST || process.env.HOST || undefined,

    /**
     * Listening dev server URL.
     *
     * This should not be set directly as it will always be overridden by the
     * dev server with the full URL (for module and internal use).
     */
    url: 'http://localhost:3000',

    /**
     * Template to show a loading screen
     * @type {(data: { loading?: string }) => string}
     */
    loadingTemplate,
  },
})
