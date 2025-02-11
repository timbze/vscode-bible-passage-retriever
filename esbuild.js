const esbuild = require('esbuild')
const { default: copy } = require('esbuild-plugin-copy')

const production = process.argv.includes('--production')
const watch = process.argv.includes('--watch')

async function main() {
  const ctx = await esbuild.context({
    entryPoints: ['src/extension.ts', 'src/test/**/*.test.ts'],
    bundle: true,
    format: 'cjs',
    minify: production,
    sourcemap: !production,
    sourcesContent: false,
    platform: 'node',
    outdir: 'dist',
    external: ['vscode', 'sqlite3'],
    logLevel: 'info',
    plugins: [
      copy({
        assets: {
          from: ['./src/bibles/*'],
          to: ['./bibles']
        }
      }),
      /* add to the end of plugins array */
      esbuildProblemMatcherPlugin
    ]
  })
  if (watch) {
    await ctx.watch()
  } else {
    await ctx.rebuild()
    await ctx.dispose()
  }
}

/**
 * @type {import('esbuild').Plugin}
 */
const esbuildProblemMatcherPlugin = {
  name: 'esbuild-problem-matcher',

  setup(build) {
    build.onStart(() => {
      console.log('[watch] build started')
    })
    build.onEnd(result => {
      result.errors.forEach(({ text, location }) => {
        console.error(`✘ [ERROR] ${text}`)
        console.error(`    ${location.file}:${location.line}:${location.column}:`)
      })
      console.log('[watch] build finished')
    })
  }
}

main().catch(e => {
  console.error(e)
  process.exit(1)
})
