import { mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import postcss from 'postcss'
import modules from 'postcss-modules'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const templates = join(root, 'templates')
const read = path => readFileSync(path, 'utf8').replace(/\r\n/g, '\n')
const require = createRequire(import.meta.url)
const classes = {}
const sheets = []

for (const file of readdirSync(templates).filter(name => name.endsWith('.module.css')).sort()) {
  const from = join(templates, file)
  const result = await postcss([
    modules({
      generateScopedName: 'dsh-dream_[local]',
      getJSON(_path, locals) {
        for (const [name, scoped] of Object.entries(locals)) {
          if (Object.hasOwn(classes, name)) throw new Error('Duplicate Dream style ' + name)
          classes[name] = scoped
        }
      },
    }),
  ]).process(read(from), { from })
  sheets.push(result.css.trim())
}

const clsxPath = require.resolve('clsx')
const license = read(join(dirname(clsxPath), '..', 'license')).trim()
const source = read(join(templates, 'client.js'))
const panels = join(templates, 'panels')
const components = [read(join(templates, 'i18n.js')), read(join(templates, 'workbench-ui.js')),
  ...readdirSync(panels).filter(name => name.endsWith('.js')).sort().map(name => read(join(panels, name)))]
const marker = '// @dream-ui'
if (!source.includes(marker)) throw new Error('Dream UI source marker missing')
const output = `// Generated from templates/ by scripts/build-client.mjs. Edit the sources.
(function () {
/* clsx
${license}
*/
const clsx = (() => {
  const module = { exports: {} };
  ${read(clsxPath).trim()}
  return module.exports.clsx;
})();
const css = Object.freeze(${JSON.stringify(classes)});
const styleText = ${JSON.stringify(sheets.join('\n'))};
${source.replace(marker, () => components.join('\n'))}
})();
`
mkdirSync(join(root, 'lib'), { recursive: true })
writeFileSync(join(root, 'lib/client.js'), output)
