import fs from 'node:fs'
import { syncBuiltinESMExports } from 'node:module'
import { resolve } from 'node:path'
const [optionsPath, mode] = process.argv.slice(2)
const options = JSON.parse(fs.readFileSync(optionsPath, 'utf8'))
const target = resolve(options.projectRoot, options.path ?? 'AGENTS.md')
const rename = fs.renameSync, open = fs.openSync, fsync = fs.fsyncSync
let renamed = false, synced = 0
fs.renameSync = function (from, to) {
  if (resolve(to) === target && mode === 'crash-before-rename') process.exit(72)
  const result = rename(from, to)
  if (resolve(to) === target) {
    renamed = true
    if (mode === 'crash-after-rename') process.exit(73)
  }
  return result
}
fs.openSync = function (path, ...args) {
  if (renamed && mode === 'commit-failure' && String(path).endsWith('records.jsonl')) throw Object.assign(new Error('injected commit failure'), { code: 'EACCES' })
  return open(path, ...args)
}
fs.fsyncSync = function (fd) {
  const result = fsync(fd)
  synced++
  if (mode === 'manual-edit-during-staging' && synced === 2) fs.appendFileSync(target, '\n人工在准备期间新增\n')
  return result
}
syncBuiltinESMExports()
const { applyBridge } = await import('../../lib/bridge.js')
process.stdout.write(JSON.stringify(applyBridge(options)))
