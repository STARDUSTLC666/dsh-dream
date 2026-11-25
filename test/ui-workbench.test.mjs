import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { runInNewContext } from 'node:vm'
import { apply as applyDreamServer } from '../lib/index.js'

const CLIENT_BUNDLE = readFileSync(new URL('../lib/client.js', import.meta.url), 'utf8')

function createDreamUiEnv({ withPrimitives = false, initialStyle = null, emptyData = false, onClipboardWrite = null, knowledgeOverride = null, onAction = null } = {}) {
  const storage = new Map()
  if (initialStyle) storage.set('dsh-stardust:ui-style', initialStyle)
  const listeners = new Map()
  const syncedNodes = new Set()
  const headStyles = []

  class FakeCustomEvent {
    constructor(type, init = {}) {
      this.type = type
      this.detail = init.detail
    }
  }

  const document = {
    baseURI: 'http://127.0.0.1:62041/',
    documentElement: {
      attrs: {},
      setAttribute(name, val) { this.attrs[name] = String(val) },
    },
    body: {},
    head: {
      appendChild(el) { headStyles.push(el) },
    },
    createElement(tag) {
      return {
        tag,
        dataset: {},
        textContent: '',
        remove() {
          const idx = headStyles.indexOf(this)
          if (idx >= 0) headStyles.splice(idx, 1)
        },
      }
    },
    querySelector(sel) {
      if (sel.includes("data-plugin-css='dsh-dream/client'")) {
        return headStyles.find(s => s.dataset?.pluginCss === 'dsh-dream/client') || null
      }
      return null
    },
    querySelectorAll(sel) {
      if (sel === '[data-dsh-portal-synced]') return [...syncedNodes]
      if (sel === '[data-dsh-portal-synced], [data-dsh-style]') return [...syncedNodes]
      return []
    },
    addEventListener() {},
    removeEventListener() {},
  }

  const win = {
    document,
    navigator: { platform: 'Win32' },
    CustomEvent: FakeCustomEvent,
    localStorage: {
      getItem(k) { return storage.has(k) ? storage.get(k) : null },
      setItem(k, v) { storage.set(k, String(v)) },
      removeItem(k) { storage.delete(k) },
    },
    addEventListener(type, fn) {
      if (!listeners.has(type)) listeners.set(type, new Set())
      listeners.get(type).add(fn)
    },
    removeEventListener(type, fn) {
      listeners.get(type)?.delete(fn)
    },
    dispatchEvent(event) {
      for (const fn of [...(listeners.get(event.type) || [])]) fn(event)
      return true
    },
    matchMedia: () => ({ matches: false }),
  }

  const hookTable = new Map()
  const mountedPaths = new Set()
  const effects = []
  let activePath = 'root'
  let cursor = 0
  let refCursor = 0
  let idCounter = 0

  function getSlot(tableKey, idx, init) {
    let bucket = hookTable.get(activePath)
    if (!bucket) {
      bucket = { states: [], refs: [] }
      hookTable.set(activePath, bucket)
    }
    const list = bucket[tableKey]
    if (!(idx in list)) list[idx] = init()
    return list
  }

  const React = {
    Fragment: Symbol.for('react.fragment'),
    createElement(type, props, ...children) {
      return {
        type,
        props: {
          ...(props || {}),
          children: children.flat(Infinity),
        },
      }
    },
    cloneElement(el, extra, ...children) {
      return {
        ...el,
        props: {
          ...(el.props || {}),
          ...(extra || {}),
          children: children.length
            ? children.flat(Infinity)
            : el.props?.children,
        },
      }
    },
    useState(initial) {
      const idx = cursor++
      const list = getSlot('states', idx, () => (typeof initial === 'function' ? initial() : initial))
      const setState = next => {
        list[idx] = typeof next === 'function' ? next(list[idx]) : next
      }
      return [list[idx], setState]
    },
    useRef(initial) {
      const idx = refCursor++
      const list = getSlot('refs', idx, () => ({ current: initial }))
      return list[idx]
    },
    useCallback(fn) { return fn },
    useMemo(fn) { return fn() },
    useId() { return ':r' + (++idCounter) + ':' },
    useEffect(fn) { effects.push(fn) },
    useLayoutEffect(fn) { effects.push(fn) },
  }

  const primitiveCalls = []
  const hostPrimitives = {
    Button: props => {
      primitiveCalls.push('Button')
      return React.createElement('button', { 'data-host-button': props.variant, ...props }, props.icon, props.children)
    },
    Input: props => {
      primitiveCalls.push('Input')
      return React.createElement('span', { 'data-host-input': 'true', className: props.className }, props.icon, React.createElement('input', props))
    },
    Checkbox: props => {
      primitiveCalls.push('Checkbox')
      return React.createElement('label', { 'data-host-checkbox': 'true', className: props.className },
        React.createElement('input', { type: 'checkbox', checked: props.checked, disabled: props.disabled, onChange: e => props.onChange?.(Boolean(e?.target?.checked)) }),
        React.createElement('span', null, props.label))
    },
    Switch: props => {
      primitiveCalls.push('Switch')
      return React.createElement('button', { type: 'button', role: 'switch', 'aria-checked': props.checked, onClick: () => props.onChange?.(!props.checked) })
    },
    SegmentedControl: props => {
      primitiveCalls.push('SegmentedControl')
      return React.createElement('div', { 'data-host-segmented': 'true', role: 'tablist', 'aria-label': props.label },
        (props.options || []).map(o => React.createElement('button', { key: o.value, type: 'button', role: 'tab', 'aria-selected': o.value === props.value, onClick: () => props.onChange?.(o.value) }, o.label)))
    },
    SegmentedTabs: props => {
      primitiveCalls.push('SegmentedTabs')
      return React.createElement('div', { 'data-host-segmented-tabs': 'true', role: 'tablist', 'aria-label': props.label },
        (props.items || []).map(it => React.createElement('button', { key: it.value, id: it.id, type: 'button', role: 'tab', 'aria-selected': it.value === props.value, onClick: () => props.onChange?.(it.value) }, it.label)))
    },
    Menu: props => {
      primitiveCalls.push('Menu')
      return React.createElement('div', { 'data-host-menu-anchor': 'true' },
        props.anchor,
        props.open
          ? React.createElement('div', { role: 'menu', 'data-host-menu': 'true' },
              (props.items || []).map(it => React.createElement('button', { key: it.id, role: 'menuitemradio', onClick: () => props.onSelect?.(it.id) }, it.label)),
              props.children)
          : null)
    },
    Modal: props => {
      primitiveCalls.push('Modal')
      return props.open ? React.createElement('div', { role: 'dialog', 'data-host-modal': 'true' }, props.children) : null
    },
    MenuSurface: props => React.createElement('div', props, props.children),
    Pill: props => React.createElement('button', { type: 'button', ...props }, props.children),
    Tag: props => React.createElement('span', props, props.children),
  }

  const sampleKnowledge = knowledgeOverride || (emptyData ? {
    lessons: [],
    evidence: [],
    stats: { lessons: 0, evidence: 0, byState: {} },
  } : {
    lessons: [{
      id: 'lesson-1',
      revision: 2,
      state: 'candidate',
      kind: 'procedure',
      title: 'Keep surfaces bright and airy',
      action: 'Use breathable slate in dark mode instead of pitch black.',
      when: 'Adapting workbench themes',
      scope: { projectId: 'dsh-dream', global: false },
      scopeLabel: '项目 dsh-dream',
      evidenceSummary: '独立证据 1 条（已读 1 / 仅声明 0）',
      independentSupportCount: 1,
      lastValidatedAt: '2026-11-17T12:00:00Z',
      exceptions: [],
      applicability: [],
    }],
    evidence: [{
      id: 'ev-1',
      lessonId: 'lesson-1',
      kind: 'session',
      verification: 'read',
      summary: 'User requested bright, airy themes across all plugins.',
      observedAt: '2026-11-17T12:00:00Z',
    }],
    stats: { lessons: 1, evidence: 1, byState: { candidate: 1 } },
  })

  const sampleJournal = emptyData ? {
    dreams: [],
    stats: { total: 0, moods: {}, topLessons: [] },
    query: '',
    limit: 50,
  } : {
    dreams: [{
      id: 'dream-1',
      at: '2026-11-17T12:00:00Z',
      mood: '清醒',
      reflection: 'Soft slate surfaces reduce eye strain without harsh black.',
      lessons: ['Use 5 unified style presets'],
    }],
    stats: { total: 1, moods: { 清醒: 1 }, topLessons: [{ lesson: 'Use 5 unified style presets', count: 3, lastAt: '2026-11-17T12:00:00Z' }] },
    query: '',
    limit: 50,
  }

  let client
  let primitivesRequestedAtLoad = false
  let allowPrimitivesNow = false

  runInNewContext(CLIENT_BUNDLE, {
    URL,
    Intl,
    AbortController,
    AbortSignal,
    Event: FakeCustomEvent,
    CustomEvent: FakeCustomEvent,
    setTimeout,
    clearTimeout,
    document,
    navigator: { platform: 'Win32', clipboard: { async writeText(val) { onClipboardWrite?.(val) } } },
    fetch: async (url, init = {}) => {
      const target = String(url)
      if (target.includes('/actions')) {
        const body = init.body ? JSON.parse(init.body) : {}
        const result = (await onAction?.(body)) || { ok: true }
        return { ok: true, status: 200, json: async () => result }
      }
      if (target.includes('/knowledge')) return { ok: true, status: 200, json: async () => (typeof sampleKnowledge === 'function' ? sampleKnowledge() : sampleKnowledge) }
      if (target.includes('/bridge')) return { ok: true, status: 200, json: async () => ({ records: [], stats: { total: 0, rollbackable: 0 } }) }
      if (target.includes('/automatic')) return { ok: true, status: 200, json: async () => ({ ok: true, automatic: { available: true, enabled: true, retrievalEnabled: true, pendingTurns: 1, mainTaskRunning: false, candidates: 1 } }) }
      return { ok: true, status: 200, json: async () => sampleJournal }
    },
    window: Object.assign(win, {
      __ModuleLoader__: {
        load(entry) {
          client = entry.factory(name => {
            if (name === 'react') return React
            if (name === '@deepseek-ai/dsh-client-ui-primitives') {
              if (!allowPrimitivesNow) primitivesRequestedAtLoad = true
              if (withPrimitives) return hostPrimitives
              throw new Error('Primitives unavailable in standalone jsdom')
            }
            throw new Error('Unexpected dependency: ' + name)
          })
        },
      },
    }),
  })

  function materialize(vnode, ancestors = [], path = 'root') {
    if (vnode === null || vnode === undefined || typeof vnode === 'boolean') return null
    if (typeof vnode === 'string' || typeof vnode === 'number') return String(vnode)
    if (Array.isArray(vnode)) return vnode.map((child, idx) => materialize(child, ancestors, path + '.a' + idx)).filter(Boolean)
    if (typeof vnode.type === 'function') {
      const key = vnode.props?.key !== undefined ? '#' + String(vnode.props.key) : ''
      const compPath = path + '/' + (vnode.type.name || 'fn') + key
      mountedPaths.add(compPath)
      const prevPath = activePath
      const prevCursor = cursor
      const prevRefCursor = refCursor
      activePath = compPath
      cursor = 0
      refCursor = 0
      const rendered = vnode.type(vnode.props || {})
      activePath = prevPath
      cursor = prevCursor
      refCursor = prevRefCursor
      return materialize(rendered, ancestors, compPath)
    }
    const attrs = {}
    for (const [k, v] of Object.entries(vnode.props || {})) {
      if (k !== 'children' && k !== 'ref' && v !== undefined) attrs[k] = v
    }
    const node = {
      tag: vnode.type === React.Fragment ? 'fragment' : String(vnode.type),
      attrs,
      dataset: {},
      ownerDocument: document,
      children: [],
      getClientRects: () => [{ width: 800, height: 600 }],
      querySelector(sel) {
        if (typeof sel === 'string' && /^#:/.test(sel)) {
          throw new SyntaxError("Failed to execute 'querySelector' on 'Element': '" + sel + "' is not a valid selector.")
        }
        return null
      },
      querySelectorAll(sel) {
        if (sel === '[data-dream-command]:enabled') {
          return findNodes(this, n => n.attrs?.['data-dream-command'] && !n.attrs.disabled)
        }
        return []
      },
      getAttribute(name) { return this.attrs[name] },
      setAttribute(name, val) {
        this.attrs[name] = String(val)
        if (name === 'data-dsh-portal-synced') syncedNodes.add(this)
      },
      hasAttribute(name) { return Object.hasOwn(this.attrs, name) },
      closest(sel) {
        const chain = [this, ...ancestors]
        for (const item of chain) {
          if (sel.includes('[role="dialog"]') && item.attrs?.role === 'dialog') return item
          if (sel.includes('[role="menu"]') && item.attrs?.role === 'menu') return item
        }
        return null
      },
    }
    if (typeof vnode.props?.ref === 'function') {
      vnode.props.ref(node)
    } else if (vnode.props?.ref && typeof vnode.props.ref === 'object') {
      vnode.props.ref.current = node
    }
    const nextAncestors = [node, ...ancestors]
    node.children = (vnode.props?.children || []).map((child, idx) => materialize(child, nextAncestors, path + '.' + idx)).flat(Infinity).filter(Boolean)
    return {
      ...node,
      get textContent() { return textOf(node) },
    }
  }

  const registrations = []
  const cleanups = []
  function flushEffects() {
    while (effects.length) {
      const fn = effects.shift()
      const cleanup = fn()
      if (typeof cleanup === 'function') cleanups.push(cleanup)
    }
  }

  return {
    client,
    storage,
    win,
    headStyles,
    primitiveCalls,
    get primitivesRequestedAtLoad() { return primitivesRequestedAtLoad },
    async mountWorkbench(workbench = true, activeLocale = 'zh-CN') {
      allowPrimitivesNow = true
      const locale = { getSnapshot: () => ({ active: activeLocale }), subscribe: () => () => {} }
      client.apply({
        locale,
        get: () => locale,
        effect(fn) {
          const cleanup = fn()
          if (typeof cleanup === 'function') cleanups.push(cleanup)
          return cleanup
        },
        slots: {
          inject(_name, fn) { fn() },
          register(meta, component) { registrations.push({ meta, component }); return () => {} },
        },
      })
      const target = registrations.find(r => r.meta.name === (workbench ? 'main' : 'settings.section'))
      const render = () => {
        mountedPaths.clear()
        cursor = 0
        refCursor = 0
        idCounter = 0
        const tree = materialize(React.createElement(target.component, { locale, workbench }))
        for (const p of [...hookTable.keys()]) {
          if (!mountedPaths.has(p)) hookTable.delete(p)
        }
        flushEffects()
        return tree
      }
      let tree = render()
      await new Promise(r => setTimeout(r, 20))
      tree = render()
      await new Promise(r => setTimeout(r, 20))
      tree = render()
      return { tree, rerender: render, cleanup: () => cleanups.splice(0).forEach(fn => fn()) }
    },
  }
}

function findNodes(node, pred, acc = []) {
  if (!node || typeof node !== 'object') return acc
  if (pred(node)) acc.push(node)
  for (const child of node.children || []) {
    if (typeof child === 'object') findNodes(child, pred, acc)
  }
  return acc
}

function textOf(node) {
  if (!node) return ''
  if (typeof node === 'string') return node
  return (node.children || []).map(textOf).join('')
}

test('dsh-dream stylesheet enforces Never-Too-Dark slate, 13 [data-dsh-style] presets, 8 [data-dsh-font] pairings, v3 layout primitives, clearances, icons and update footer', async () => {
  const env = createDreamUiEnv({ withPrimitives: false })
  const mounted = await env.mountWorkbench(true, 'zh-CN')
  try {
    const cssText = env.headStyles.map(s => s.textContent).join('\n')
    assert.match(cssText, /body\[data-ds-dark-theme\] \[data-dsh-style="harness"\]/)
    assert.match(cssText, /--dsw-alias-bg-base:\s*#1f232b/)
    assert.match(cssText, /--dsw-alias-bg-layer-1:\s*#272c36/)
    for (const preset of ['harness', 'cream', 'claude', 'pixel8bit', 'mint', 'glass', 'eink', 'blueprint', 'risograph', 'win98', 'songhui', 'frutiger', 'gazette']) {
      assert.ok(cssText.includes(`[data-dsh-style="${preset}"]`), 'missing preset ' + preset)
    }
    for (const fontId of ['songkai', 'fangsong', 'poster', 'retro98', 'serif', 'arcade', 'modern']) {
      assert.ok(cssText.includes(`[data-dsh-font="${fontId}"]`), 'missing font rule ' + fontId)
    }
    assert.match(cssText, /\.dsh-style-switcher/)
    assert.match(cssText, /\.dsh-font-trigger/)
    assert.match(cssText, /\.dsh-header/)
    assert.match(cssText, /\.dsh-tab-indicator/)
    assert.match(cssText, /\.dsh-split-resizer/)
    assert.match(cssText, /\.dsh-skeleton/)
    assert.match(cssText, /\.dsh-row-actions/)
    assert.match(cssText, /\[data-dsh-serif\]/)
    assert.match(cssText, /\.dsh-pixel-cursor/)
    assert.match(cssText, /translate:\s*1px 1px !important/)
    assert.match(cssText, /box-shadow:\s*2px 2px 0px #1e2826/)
    assert.match(cssText, /--dsh-frame-top-clearance/)
    assert.match(cssText, /--dsh-frame-leading-clearance/)
    assert.match(cssText, /@container dream \(max-width:\s*1180px\)/)
    assert.match(cssText, /min-width:\s*max-content/)
    assert.match(cssText, /\[data-window-drag-exclude\]/)
    assert.match(cssText, /@media \(prefers-reduced-motion: reduce\)/)
    assert.match(CLIENT_BUNDLE, /__stardustUpdatesInlinePage\(React,\s*h\(W\.Page/)
  } finally {
    mounted.cleanup()
  }
})

test('dsh-dream renders in standalone fallback mode, syncs 13 styles + 8 fonts across root & portaled dialogs, and exposes v3 header/resizer/quick-actions', async () => {
  const env = createDreamUiEnv({ withPrimitives: false })
  assert.equal(env.primitivesRequestedAtLoad, false)
  assert.equal(env.client.__internals.DSH_STYLES.length, 13)
  assert.equal(env.client.__internals.DSH_FONTS.length, 8)
  assert.equal(env.client.__internals.DSH_DEFAULT_FONT, 'auto')

  const mounted = await env.mountWorkbench(true, 'en-US')
  try {
    let root = mounted.tree
    assert.equal(root.attrs['data-dsh-style'], 'harness')
    assert.equal(root.attrs['data-dsh-font'], 'auto')
    assert.equal(root.attrs['data-main'], 'true')

    // Verify v3 unified header, sliding tab indicator, panel enter, serif, and pixel cursor
    assert.ok(findNodes(root, n => Object.hasOwn(n.attrs || {}, 'data-dsh-header')).length === 1)
    assert.ok(findNodes(root, n => String(n.attrs?.className || '').includes('dsh-tab-indicator')).length === 1)
    assert.ok(findNodes(root, n => Object.hasOwn(n.attrs || {}, 'data-dsh-tab-panel')).length === 1)
    assert.ok(findNodes(root, n => Object.hasOwn(n.attrs || {}, 'data-dsh-serif')).length >= 2)
    assert.ok(findNodes(root, n => String(n.attrs?.className || '').includes('dsh-pixel-cursor')).length >= 1)

    // Default landing view in 待审阅 is the Tactile Triage Deck (叠卡 / Deck) with all 5 tour anchors mounted
    assert.ok(findNodes(root, n => n.attrs?.['data-dream-triage-deck'] === 'true').length === 1)
    assert.ok(findNodes(root, n => n.attrs?.['data-dream-deck-card'] === 'lesson-1').length === 1)
    assert.ok(findNodes(root, n => n.attrs?.['data-dream-action-dock'] === 'true').length === 1)
    for (const anchor of ['dream-ribbon', 'dream-card', 'dream-dock', 'dream-style', 'dream-auto']) {
      assert.ok(findNodes(root, n => n.attrs?.['data-tour'] === anchor).length === 1, 'expected visible [data-tour="' + anchor + '"] in Deck view')
    }

    // Verify SVG icon micro-animation markers exist across Dream buttons in default Deck view
    const iconNames = new Set(findNodes(root, n => n.tag === 'svg' && n.attrs['data-dsh-icon']).map(n => n.attrs['data-dsh-icon']))
    for (const expected of ['moon', 'sparkle', 'down', 'shield', 'search', 'refresh', 'check', 'trash', 'diff']) {
      assert.ok(iconNames.has(expected), 'missing data-dsh-icon=' + expected)
    }
    assert.ok(findNodes(root, n => Object.hasOwn(n.attrs, 'data-dsh-card')).length >= 3)

    // Switch to classic 列表 (List) view via compact segmented toggle and verify SplitResizer + quick-actions stay 100% intact
    const listToggleBtn = findNodes(root, n => n.attrs?.role === 'tab' && (textOf(n) === 'List' || textOf(n) === '列表'))[0]
    assert.ok(listToggleBtn, 'compact Deck/List view toggle must render')
    listToggleBtn.attrs.onClick()
    root = mounted.rerender()
    assert.equal(findNodes(root, n => n.attrs?.['data-dream-triage-deck'] === 'true').length, 0)

    // Verify DshSplitResizer keyboard resize + double-click reset + localStorage persistence in List view
    const resizer = findNodes(root, n => n.attrs?.role === 'separator' && Object.hasOwn(n.attrs || {}, 'data-dsh-resizer'))[0]
    assert.ok(resizer, 'DshSplitResizer must render in List view')
    assert.equal(resizer.attrs['aria-valuenow'], 340)
    resizer.attrs.onKeyDown({ key: 'ArrowRight', preventDefault() {} })
    root = mounted.rerender()
    assert.equal(findNodes(root, n => n.attrs?.role === 'separator')[0].attrs['aria-valuenow'], 356)
    assert.equal(env.storage.get('dsh-dream:split-width'), '356')
    findNodes(root, n => n.attrs?.role === 'separator')[0].attrs.onDoubleClick()
    root = mounted.rerender()
    assert.equal(findNodes(root, n => n.attrs?.role === 'separator')[0].attrs['aria-valuenow'], 340)

    // Verify row hover quick-action bar controls render on candidate row in List view
    assert.ok(findNodes(root, n => n.attrs?.['data-dream-quick-accept'] === 'lesson-1').length === 1)
    assert.ok(findNodes(root, n => n.attrs?.['data-dream-quick-copy'] === 'lesson-1').length === 1)
    assert.ok(findNodes(root, n => n.attrs?.['data-dream-quick-inspect'] === 'lesson-1').length === 1)
    assert.ok(findNodes(root, n => Object.hasOwn(n.attrs, 'data-dsh-row')).length >= 1)

    // Switch back to Deck view (1-click)
    const deckToggleBtn = findNodes(root, n => n.attrs?.role === 'tab' && (textOf(n) === 'Deck' || textOf(n) === '叠卡'))[0]
    assert.ok(deckToggleBtn)
    deckToggleBtn.attrs.onClick()
    root = mounted.rerender()
    assert.ok(findNodes(root, n => n.attrs?.['data-dream-triage-deck'] === 'true').length === 1)

    // Switch through all 13 styles via topbar SkinSwitcher
    for (const preset of ['cream', 'claude', 'pixel8bit', 'mint', 'glass', 'eink', 'blueprint', 'risograph', 'win98', 'songhui', 'frutiger', 'gazette', 'harness']) {
      const trigger = findNodes(root, n => n.attrs.id === 'dream-style-switcher')[0]
      assert.ok(trigger)
      trigger.attrs.onClick()
      root = mounted.rerender()
      const items = findNodes(root, n => n.attrs.role === 'menuitemradio')
      assert.equal(items.length, 13)
      const idx = env.client.__internals.DSH_STYLES.findIndex(s => s.id === preset)
      items[idx].attrs.onClick()
      root = mounted.rerender()
      assert.equal(root.attrs['data-dsh-style'], preset)
      assert.equal(env.storage.get('dsh-stardust:ui-style'), preset)
    }

    // Switch through all 8 font pairings via topbar FontSwitcher
    for (const fontId of ['auto', 'songkai', 'fangsong', 'poster', 'retro98', 'serif', 'modern', 'arcade']) {
      const fontTrigger = findNodes(root, n => n.attrs.id === 'dream-style-switcher-font')[0]
      assert.ok(fontTrigger)
      fontTrigger.attrs.onClick()
      root = mounted.rerender()
      const items = findNodes(root, n => n.attrs.role === 'menuitemradio')
      assert.equal(items.length, 8)
      const idx = env.client.__internals.DSH_FONTS.findIndex(f => f.id === fontId)
      items[idx].attrs.onClick()
      root = mounted.rerender()
      assert.equal(root.attrs['data-dsh-font'], fontId)
      assert.equal(env.storage.get('dsh-stardust:ui-font'), fontId)
    }

    // Open Command Palette dialog & verify portal style + font + drag exclusion sync
    const cmdBtn = findNodes(root, n => n.tag === 'button' && n.attrs['aria-label'] === 'Command palette')[0]
    assert.ok(cmdBtn)
    cmdBtn.attrs.onClick()
    root = mounted.rerender()

    const dialog = findNodes(root, n => n.attrs.role === 'dialog')[0]
    assert.ok(dialog)
    assert.equal(dialog.attrs['data-dsh-style'], 'harness')
    assert.equal(dialog.attrs['data-dsh-font'], 'arcade')
    assert.equal(dialog.attrs['data-window-drag-exclude'], '')

    env.win.localStorage.setItem('dsh-stardust:ui-style', 'mint')
    env.win.dispatchEvent(new env.win.CustomEvent('dsh-stardust-style', { detail: { style: 'mint' } }))
    env.win.localStorage.setItem('dsh-stardust:ui-font', 'fangsong')
    env.win.dispatchEvent(new env.win.CustomEvent('dsh-stardust-font', { detail: { font: 'fangsong' } }))
    root = mounted.rerender()
    const updatedDialog = findNodes(root, n => n.attrs.role === 'dialog')[0]
    assert.equal(root.attrs['data-dsh-style'], 'mint')
    assert.equal(root.attrs['data-dsh-font'], 'fangsong')
    assert.equal(updatedDialog.attrs['data-dsh-style'], 'mint')
    assert.equal(updatedDialog.attrs['data-dsh-font'], 'fangsong')
  } finally {
    mounted.cleanup()
  }
})

test('dsh-dream integrates host primitives and stamps [data-dsh-style] onto portaled host Menu and Modal', async () => {
  const env = createDreamUiEnv({ withPrimitives: true, initialStyle: 'cream' })
  assert.equal(env.primitivesRequestedAtLoad, false)
  const mounted = await env.mountWorkbench(true, 'zh-CN')
  try {
    let root = mounted.tree
    assert.equal(root.attrs['data-dsh-style'], 'cream')
    for (const primitive of ['Button', 'Input', 'Switch', 'SegmentedTabs', 'SegmentedControl', 'Menu']) {
      assert.ok(env.primitiveCalls.includes(primitive), 'expected host primitive ' + primitive)
    }

    // Switch to List view briefly to verify host Checkbox primitive still integrates cleanly
    const listTab = findNodes(root, n => n.attrs?.role === 'tab' && textOf(n) === '列表')[0]
    assert.ok(listTab)
    listTab.attrs.onClick()
    root = mounted.rerender()
    assert.ok(env.primitiveCalls.includes('Checkbox'), 'expected host primitive Checkbox in List view')
    const deckTab = findNodes(root, n => n.attrs?.role === 'tab' && textOf(n) === '叠卡')[0]
    deckTab.attrs.onClick()
    root = mounted.rerender()

    // Open StyleSwitcher Menu in host mode and verify HostMenuWithStyle stamps data-dsh-style + data-window-drag-exclude
    const trigger = findNodes(root, n => n.attrs.id === 'dream-style-switcher')[0]
    trigger.attrs.onClick()
    root = mounted.rerender()
    const hostMenu = findNodes(root, n => n.attrs['data-host-menu'] === 'true')[0]
    assert.ok(hostMenu)
    assert.equal(hostMenu.attrs['data-dsh-style'], 'cream')
    assert.equal(hostMenu.attrs['data-dsh-font'], 'auto')
    assert.equal(hostMenu.attrs['data-window-drag-exclude'], '')

    // Open Preview review changes Modal and verify HostModalWithStyle stamps data-dsh-style + data-dsh-font + data-window-drag-exclude
    const diffBtn = findNodes(root, n => n.attrs['data-dream-command'] === 'diff')[0]
    diffBtn.attrs.onClick()
    root = mounted.rerender()
    assert.ok(env.primitiveCalls.includes('Modal'))
    const hostModal = findNodes(root, n => n.attrs['data-host-modal'] === 'true')[0]
    assert.ok(hostModal)
    assert.equal(hostModal.attrs['data-dsh-style'], 'cream')
    assert.equal(hostModal.attrs['data-dsh-font'], 'auto')
    assert.equal(hostModal.attrs['data-window-drag-exclude'], '')

    // Switch to Settings tab and verify host SegmentedControl
    const settingsTab = findNodes(root, n => n.attrs.role === 'tab' && textOf(n).includes('设置'))[0]
    settingsTab.attrs.onClick()
    mounted.rerender()
    assert.ok(env.primitiveCalls.includes('SegmentedControl'))
  } finally {
    mounted.cleanup()
  }
})

test('Cordis 4 ctx.effect unload disposer cleans up registered Dream tools and routes without ctx.on("dispose")', () => {
  let activeTools = 0
  let activeRoutes = 0
  const effects = []
  applyDreamServer({
    tools: {
      register() {
        activeTools++
        return () => { activeTools-- }
      },
    },
    effect(fn) {
      const cleanup = fn()
      if (typeof cleanup === 'function') effects.push(cleanup)
    },
    inject(names, cb) {
      if (names[0] === 'connection') {
        cb({
          effect(fn) {
            const cleanup = fn()
            if (typeof cleanup === 'function') effects.push(cleanup)
          },
          connection: {
            fetch: {
              register() {
                activeRoutes++
                return () => { activeRoutes-- }
              },
            },
          },
        })
      }
    },
  }, {})
  assert.ok(activeTools > 0)
  assert.equal(activeRoutes, 5)
  for (const dispose of effects.splice(0).reverse()) dispose()
  assert.equal(activeTools, 0)
  assert.equal(activeRoutes, 0)
})

test('dsh-dream empty review & journal states provide 1-click copy prompts, tab jumps, interactive coachmark tour with arrow, and explicit label htmlFor', async () => {
  const copiedTexts = []
  const env = createDreamUiEnv({
    withPrimitives: false,
    emptyData: true,
    onClipboardWrite: val => copiedTexts.push(val),
  })
  const mounted = await env.mountWorkbench(true, 'zh-CN')
  try {
    let root = mounted.tree
    const cssText = env.headStyles.map(s => s.textContent).join('\n')
    assert.match(cssText, /:popover-open/)
    assert.match(cssText, /data-side=['"]bottom['"]/)

    // Static collapsible workflow guide is removed in favor of topbar "? 引导" coachmark tour
    assert.equal(findNodes(root, n => Object.hasOwn(n.attrs || {}, 'data-dream-workflow-guide')).length, 0)

    // 1) Review empty state: explains distillation, offers 1-click copy prompts and quick jump buttons
    assert.match(root.textContent, /没有待审阅的经验/)
    assert.match(root.textContent, /完成实际任务后/)

    const distillBtn = findNodes(root, n => n.tag === 'button' && n.attrs['data-copy-prompt'] === '复盘最近的对话并提炼可复用的项目经验')[0]
    const dreamBtn = findNodes(root, n => n.tag === 'button' && n.attrs['data-copy-prompt'] === '做个梦')[0]
    assert.ok(distillBtn, 'expected 1-click distill prompt button in review empty state')
    assert.ok(dreamBtn, 'expected 1-click dream prompt button in review empty state')

    distillBtn.attrs.onClick()
    await new Promise(r => setTimeout(r, 10))
    root = mounted.rerender()
    assert.deepEqual(copiedTexts, ['复盘最近的对话并提炼可复用的项目经验'])
    const copiedBtn = findNodes(root, n => n.tag === 'button' && n.attrs['data-copy-prompt'] === '复盘最近的对话并提炼可复用的项目经验' && n.attrs['data-copied'] === 'true')[0]
    assert.ok(copiedBtn, 'copy button should stamp data-copied="true"')
    assert.ok(!copiedBtn.attrs.disabled, 'copy button must stay enabled during feedback')
    const statusRegions = findNodes(root, n => n.attrs.role === 'status' && /已复制指令/.test(n.textContent))
    assert.ok(statusRegions.length >= 1, 'external role="status" live region should announce copy confirmation')

    // Quick jump to Settings and verify explicit label htmlFor -> control id
    const goSettings = findNodes(root, n => n.tag === 'button' && n.textContent.includes('前往设置'))[0]
    assert.ok(goSettings, 'expected quick jump button to Settings')
    goSettings.attrs.onClick()
    root = mounted.rerender()
    const langLabel = findNodes(root, n => n.tag === 'label' && n.attrs.htmlFor === 'dream-settings-language')[0]
    const langSelect = findNodes(root, n => n.tag === 'select' && n.attrs.id === 'dream-settings-language')[0]
    assert.ok(langLabel && langSelect, 'Settings label must pair htmlFor + id')

    // 2) Switch to Journal tab: verify interactive "做个梦" copy button in empty state
    const journalTab = findNodes(root, n => n.attrs.role === 'tab' && n.textContent.includes('日记'))[0]
    assert.ok(journalTab)
    journalTab.attrs.onClick()
    await new Promise(r => setTimeout(r, 20))
    root = mounted.rerender()

    assert.match(root.textContent, /还没有梦境日记/)
    const journalDreamBtn = findNodes(root, n => n.tag === 'button' && n.attrs['data-copy-prompt'] === '做个梦')[0]
    assert.ok(journalDreamBtn, 'Journal empty state should expose interactive "做个梦" copy button')
    journalDreamBtn.attrs.onClick()
    await new Promise(r => setTimeout(r, 10))
    assert.equal(copiedTexts.at(-1), '做个梦')

    // 3) Interactive Coachmark Tour ("? 引导"): auto-switches back to 待审阅 Deck tab, renders directional arrow + spotlight, steps 1->5, and persists completion
    const tourTrigger = findNodes(root, n => n.tag === 'button' && Object.hasOwn(n.attrs, 'data-dream-tour-trigger'))[0]
    assert.ok(tourTrigger, 'expected topbar "? 引导" trigger button')
    tourTrigger.attrs.onClick()
    root = mounted.rerender()
    assert.ok(findNodes(root, n => n.attrs?.['data-dream-triage-deck'] === 'true').length === 1, 'opening tour switches back to 待审阅 Tactile Triage Deck')

    let tourCard = findNodes(root, n => n.attrs['data-tour-card'])[0]
    assert.ok(tourCard, 'expected coachmark tour popover dialog to mount')
    assert.equal(tourCard.attrs.role, 'dialog')
    assert.equal(tourCard.attrs['aria-modal'], 'false')
    assert.match(tourCard.textContent, /1 \/ 5/)
    assert.match(tourCard.textContent, /叠卡 \/ 列表切换与分拣进度/)
    const arrow = findNodes(tourCard, n => Object.hasOwn(n.attrs || {}, 'data-tour-arrow'))[0]
    assert.ok(arrow, 'expected directional arrow inside coachmark card')

    // Step 2: Drag to triage & Space 3D flip
    findNodes(tourCard, n => Object.hasOwn(n.attrs || {}, 'data-tour-next'))[0].attrs.onClick()
    root = mounted.rerender()
    tourCard = findNodes(root, n => n.attrs['data-tour-card'])[0]
    assert.match(tourCard.textContent, /2 \/ 5/)
    assert.match(tourCard.textContent, /拖拽分拣与 Space 3D 翻面看证据/)

    // Step 3: Floating Action Dock
    findNodes(tourCard, n => Object.hasOwn(n.attrs || {}, 'data-tour-next'))[0].attrs.onClick()
    root = mounted.rerender()
    tourCard = findNodes(root, n => n.attrs['data-tour-card'])[0]
    assert.match(tourCard.textContent, /3 \/ 5/)
    assert.match(tourCard.textContent, /悬浮操作坞/)

    // Step 4: 13 Bright Styles & 8 Dual-Layer Fonts
    findNodes(tourCard, n => Object.hasOwn(n.attrs || {}, 'data-tour-next'))[0].attrs.onClick()
    root = mounted.rerender()
    tourCard = findNodes(root, n => n.attrs['data-tour-card'])[0]
    assert.match(tourCard.textContent, /4 \/ 5/)
    assert.match(tourCard.textContent, /13 套明亮风格与 8 套双层字体/)

    // Step 5: Auto-memory / Accepted / Settings + inline "做个梦" prompt copy -> Finish ("完成引导") persists done to localStorage
    findNodes(tourCard, n => Object.hasOwn(n.attrs || {}, 'data-tour-next'))[0].attrs.onClick()
    root = mounted.rerender()
    tourCard = findNodes(root, n => n.attrs['data-tour-card'])[0]
    assert.match(tourCard.textContent, /5 \/ 5/)
    assert.match(tourCard.textContent, /自动记忆、已采纳库与设置/)
    assert.match(tourCard.textContent, /完成引导/)
    const inlineDreamCopy = findNodes(tourCard, n => n.tag === 'button' && n.attrs['data-copy-prompt'] === '做个梦')[0]
    assert.ok(inlineDreamCopy, 'Step 5 coachmark card should include inline 1-click "做个梦" copy button')

    findNodes(tourCard, n => Object.hasOwn(n.attrs || {}, 'data-tour-next'))[0].attrs.onClick()
    root = mounted.rerender()
    assert.equal(findNodes(root, n => n.attrs['data-tour-card']).length, 0, 'coachmark closes on completion')
    assert.equal(env.win.localStorage.getItem('dsh-dream.tour.v1'), 'done', 'completion persists in localStorage')
  } finally {
    mounted.cleanup()
  }
})

test('dsh-dream Tactile Triage Deck: 3-deep stack, ±90px pointer drag adopt/discard/spring-back, 3D flip back-face, Floating Dock, and Inbox Zero card', async () => {
  const actions = []
  let lessons = [
    {
      id: 'lesson-1', revision: 2, state: 'candidate', kind: 'procedure',
      title: 'Card One: Compositor animations only',
      action: 'Animate transform and opacity for smooth 60fps card flicks.',
      when: 'Building tactile UI motion',
      scope: { projectId: 'dsh-dream', global: false }, scopeLabel: '项目 dsh-dream',
      evidenceIds: ['ev-1'],
      evidenceSummary: '独立证据 1 条（已读 1 / 仅声明 0）', independentSupportCount: 1,
      lastValidatedAt: '2026-11-22T01:00:00Z', exceptions: [], applicability: [],
    },
    {
      id: 'lesson-2', revision: 1, state: 'candidate', kind: 'pitfall',
      title: 'Card Two: Guard interactive descendants on drag',
      action: 'Skip setPointerCapture when clicking buttons inside draggable cards.',
      when: 'Handling pointer events on cards',
      scope: { projectId: 'dsh-dream', global: false }, scopeLabel: '项目 dsh-dream',
      evidenceIds: ['ev-2'],
      evidenceSummary: '独立证据 1 条（已读 1 / 仅声明 0）', independentSupportCount: 1,
      lastValidatedAt: '2026-11-22T02:00:00Z', exceptions: [], applicability: [],
    },
    {
      id: 'lesson-3', revision: 1, state: 'candidate', kind: 'fact',
      title: 'Card Three: Reduced motion swaps without spin',
      action: 'Respect prefers-reduced-motion: reduce on 3D card flips.',
      when: 'Implementing flip transitions',
      scope: { projectId: 'dsh-email', global: false }, scopeLabel: '项目 dsh-email',
      evidenceIds: ['ev-3'],
      evidenceSummary: '独立证据 1 条（已读 1 / 仅声明 0）', independentSupportCount: 1,
      lastValidatedAt: '2026-11-22T03:00:00Z', exceptions: [], applicability: [],
    },
  ]
  const evidence = [
    { id: 'ev-1', lessonId: 'lesson-1', kind: 'session', verification: 'read', summary: 'Verified GPU-accelerated transforms in Chromium.', observedAt: '2026-11-22T01:00:00Z' },
    { id: 'ev-2', lessonId: 'lesson-2', kind: 'session', verification: 'read', summary: 'Observed button clicks cancelled without closest() guard.', observedAt: '2026-11-22T02:00:00Z' },
    { id: 'ev-3', lessonId: 'lesson-3', kind: 'session', verification: 'read', summary: 'Reduced motion prefers cross-fade over 3D rotateY.', observedAt: '2026-11-22T03:00:00Z' },
  ]
  const env = createDreamUiEnv({
    withPrimitives: false,
    knowledgeOverride: () => ({
      lessons,
      evidence,
      stats: { lessons: lessons.length, evidence: evidence.length, byState: { candidate: lessons.length } },
    }),
    onAction: body => {
      actions.push(body)
      if (body.operation === 'review') {
        lessons = lessons.filter(item => item.id !== body.lessonId)
      }
      return { ok: true }
    },
  })
  const mounted = await env.mountWorkbench(true, 'zh-CN')
  try {
    let root = mounted.tree
    const cssText = env.headStyles.map(s => s.textContent).join('\n')
    assert.match(cssText, /perspective:\s*1100px/)
    assert.match(cssText, /rotateY\(180deg\)/)
    assert.match(cssText, /prefers-reduced-motion:\s*reduce/)

    // 1) Progress ribbon & 3-deep physical stack
    const ribbon = findNodes(root, n => n.attrs?.['data-dream-progress-ribbon'] === 'true')[0]
    assert.ok(ribbon)
    assert.match(ribbon.textContent, /待分拣\s*3\s*\/\s*总计\s*3/)
    assert.equal(findNodes(root, n => n.attrs?.['data-deck-depth'] === '0').length, 1)
    const depth1 = findNodes(root, n => n.attrs?.['data-deck-depth'] === '1')[0]
    const depth2 = findNodes(root, n => n.attrs?.['data-deck-depth'] === '2')[0]
    assert.ok(depth1 && depth2, '3-deep physical card deck should render depth 0, 1, 2')
    assert.match(String(depth1.attrs.style?.transform), /scale\(0\.95\).*rotate\(2\.2deg\)/)
    assert.match(String(depth2.attrs.style?.transform), /scale\(0\.90\).*rotate\(-2\.6deg\)/)

    // 2) 3D Flip ("↻ 翻面看证据") reveals back-face evidence, scope & review preview
    let activeCard = findNodes(root, n => n.attrs?.['data-dream-deck-card'] === 'lesson-1')[0]
    assert.equal(activeCard.attrs['data-flipped'], 'false')
    const flipBtn = findNodes(activeCard, n => n.attrs?.['data-dream-flip'] === 'true')[0]
    assert.ok(flipBtn)
    flipBtn.attrs.onClick()
    root = mounted.rerender()
    activeCard = findNodes(root, n => n.attrs?.['data-dream-deck-card'] === 'lesson-1')[0]
    assert.equal(activeCard.attrs['data-flipped'], 'true')
    assert.match(activeCard.textContent, /来源与证据/)
    assert.match(activeCard.textContent, /范围、条件与例外/)
    assert.match(activeCard.textContent, /审阅变更预览/)
    assert.match(activeCard.textContent, /Verified GPU-accelerated transforms/)
    // Flip back via back-face button
    findNodes(activeCard, n => n.attrs?.['data-dream-flip-back'] === 'true')[0].attrs.onClick()
    root = mounted.rerender()
    assert.equal(findNodes(root, n => n.attrs?.['data-dream-deck-card'] === 'lesson-1')[0].attrs['data-flipped'], 'false')

    // 3) Floating Action Dock navigation (下一张 / 上一张) & Expand Full Details dialog
    const dock = findNodes(root, n => n.attrs?.['data-dream-action-dock'] === 'true')[0]
    assert.ok(dock)
    assert.match(dock.textContent, /丢弃/)
    assert.match(dock.textContent, /翻面/)
    assert.match(dock.textContent, /确认采纳/)
    assert.match(dock.textContent, /展开完整详情/)

    findNodes(dock, n => n.attrs?.['data-dream-command'] === 'next')[0].attrs.onClick()
    root = mounted.rerender()
    assert.ok(findNodes(root, n => n.attrs?.['data-dream-deck-card'] === 'lesson-2')[0], 'Next button advances active card')
    findNodes(root, n => n.attrs?.['data-dream-command'] === 'prev')[0].attrs.onClick()
    root = mounted.rerender()
    assert.ok(findNodes(root, n => n.attrs?.['data-dream-deck-card'] === 'lesson-1')[0], 'Prev button returns to first card')

    findNodes(root, n => n.attrs?.['data-dream-command'] === 'expand')[0].attrs.onClick()
    root = mounted.rerender()
    assert.ok(findNodes(root, n => n.attrs?.role === 'dialog')[0], 'Expand Full Details opens modal dialog')
    const closeBtn = findNodes(root, n => n.tag === 'button' && n.attrs?.['aria-label'] === '关闭')[0]
    closeBtn.attrs.onClick()
    root = mounted.rerender()

    // 4) Sub-threshold pointer drag (+55px) shows adopt stamp and springs cleanly back without mutating
    let capturedId = null
    const mockTarget = {
      closest: () => null,
      setPointerCapture(id) { capturedId = id },
      releasePointerCapture() {},
    }
    activeCard = findNodes(root, n => n.attrs?.['data-dream-deck-card'] === 'lesson-1')[0]
    activeCard.attrs.onPointerDown({ pointerId: 1, button: 0, clientX: 200, clientY: 200, target: mockTarget, currentTarget: mockTarget })
    assert.equal(capturedId, 1, 'pointer drag should capture pointer')
    activeCard.attrs.onPointerMove({ pointerId: 1, clientX: 255, clientY: 202, currentTarget: mockTarget })
    root = mounted.rerender()
    const adoptStamp = findNodes(root, n => n.attrs?.['data-dream-stamp'] === 'accept')[0]
    assert.ok(adoptStamp.attrs.style.opacity > 0.5, 'right drag fades in ✓ 采纳 stamp')
    findNodes(root, n => n.attrs?.['data-dream-deck-card'] === 'lesson-1')[0].attrs.onPointerUp({ pointerId: 1, clientX: 255, clientY: 202, currentTarget: mockTarget })
    root = mounted.rerender()
    assert.equal(actions.length, 0, 'sub-threshold release springs back without adopting')
    assert.equal(findNodes(root, n => n.attrs?.['data-dream-stamp'] === 'accept')[0].attrs.style.opacity, 0)

    // 5) Right drag past +90px (+115px) triggers real adopt handler
    activeCard = findNodes(root, n => n.attrs?.['data-dream-deck-card'] === 'lesson-1')[0]
    activeCard.attrs.onPointerDown({ pointerId: 2, button: 0, clientX: 200, clientY: 200, target: mockTarget, currentTarget: mockTarget })
    activeCard.attrs.onPointerMove({ pointerId: 2, clientX: 315, clientY: 200, currentTarget: mockTarget })
    activeCard.attrs.onPointerUp({ pointerId: 2, clientX: 315, clientY: 200, currentTarget: mockTarget })
    await new Promise(r => setTimeout(r, 230))
    root = mounted.rerender()
    await new Promise(r => setTimeout(r, 30))
    root = mounted.rerender()
    assert.equal(actions.length, 1)
    assert.equal(actions[0].operation, 'review')
    assert.equal(actions[0].action, 'accept')
    assert.equal(actions[0].lessonId, 'lesson-1')
    assert.match(findNodes(root, n => n.attrs?.['data-dream-progress-ribbon'] === 'true')[0].textContent, /待分拣\s*2\s*\/\s*总计\s*3/)

    // 6) Left drag past -90px (-120px) fades in × 丢弃 stamp & triggers real reject handler
    activeCard = findNodes(root, n => n.attrs?.['data-dream-deck-card'] === 'lesson-2')[0]
    activeCard.attrs.onPointerDown({ pointerId: 3, button: 0, clientX: 300, clientY: 200, target: mockTarget, currentTarget: mockTarget })
    activeCard.attrs.onPointerMove({ pointerId: 3, clientX: 180, clientY: 200, currentTarget: mockTarget })
    root = mounted.rerender()
    assert.ok(findNodes(root, n => n.attrs?.['data-dream-stamp'] === 'reject')[0].attrs.style.opacity > 0.8, 'left drag fades in × 丢弃 stamp')
    findNodes(root, n => n.attrs?.['data-dream-deck-card'] === 'lesson-2')[0].attrs.onPointerUp({ pointerId: 3, clientX: 180, clientY: 200, currentTarget: mockTarget })
    await new Promise(r => setTimeout(r, 230))
    root = mounted.rerender()
    await new Promise(r => setTimeout(r, 30))
    root = mounted.rerender()
    assert.equal(actions.length, 2)
    assert.equal(actions[1].action, 'reject')
    assert.equal(actions[1].lessonId, 'lesson-2')

    // 7) Accept final card via Floating Action Dock -> renders Inbox Zero celebration card
    findNodes(root, n => n.attrs?.['data-dream-command'] === 'accept')[0].attrs.onClick()
    await new Promise(r => setTimeout(r, 230))
    root = mounted.rerender()
    await new Promise(r => setTimeout(r, 30))
    root = mounted.rerender()
    assert.equal(actions.length, 3)
    const inboxZero = findNodes(root, n => n.attrs?.['data-dream-inbox-zero'] === 'true')[0]
    assert.ok(inboxZero, '0 remaining candidates should render Inbox Zero celebration card')
    assert.match(inboxZero.textContent, /Inbox Zero/)
    assert.match(inboxZero.textContent, /查看已采纳/)
    assert.match(inboxZero.textContent, /立即整理/)
  } finally {
    mounted.cleanup()
  }
})
