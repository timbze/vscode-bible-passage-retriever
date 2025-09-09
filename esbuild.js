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
    external: ['vscode'],
    logLevel: 'info',
    plugins: [
      copy({
        assets: [
          {
            from: ['./src/bibles/*'],
            to: ['./bibles']
          },
          {
            from: ['./node_modules/sql.js/dist/sql-wasm.wasm'],
            to: ['./']
          }
        ]
      }),
      // Custom plugin to clean entire dist folder
      {
        name: 'clean-dist',
        setup(build) {
          build.onStart(() => {
            const fs = require('fs')
            const path = require('path')

            const distDir = path.join(process.cwd(), 'dist')

            function deleteFolderRecursive(folderPath) {
              if (fs.existsSync(folderPath)) {
                fs.readdirSync(folderPath).forEach(file => {
                  const curPath = path.join(folderPath, file)
                  if (fs.statSync(curPath).isDirectory()) {
                    // Recurse into subdirectory
                    deleteFolderRecursive(curPath)
                  } else {
                    // Delete file
                    fs.unlinkSync(curPath)
                  }
                })
                fs.rmdirSync(folderPath)
              }
            }

            // Clean entire dist directory
            deleteFolderRecursive(distDir)
          })
        }
      },
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
