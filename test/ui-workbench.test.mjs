import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { runInNewContext } from 'node:vm'
import { apply as applyDreamServer } from '../lib/index.js'

const CLIENT_BUNDLE = readFileSync(new URL('../lib/client.js', import.meta.url), 'utf8')

function createDreamUiEnv({ withPrimitives = false, initialStyle = null } = {}) {
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

  const states = []
  const refs = []
  const effects = []
  let cursor = 0
  let refCursor = 0
  let idCounter = 0

  const React = {
    Fragment: Symbol.for('react.fragment'),
    createElement(type, props, ...children) {
      return {
        type,
        props: {
          ...(props || {}),
          children: children.flat(Infinity).filter(v => v !== null && v !== undefined && v !== false),
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
            ? children.flat(Infinity).filter(v => v !== null && v !== undefined && v !== false)
            : el.props?.children,
        },
      }
    },
    useState(initial) {
      const idx = cursor++
      if (!(idx in states)) states[idx] = typeof initial === 'function' ? initial() : initial
      const setState = next => {
        states[idx] = typeof next === 'function' ? next(states[idx]) : next
      }
      return [states[idx], setState]
    },
    useRef(initial) {
      const idx = refCursor++
      if (!(idx in refs)) refs[idx] = { current: initial }
      return refs[idx]
    },
    useCallback(fn) { return fn },
    useMemo(fn) { return fn() },
    useId() { return 'dream-id-' + (++idCounter) },
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

  const sampleKnowledge = {
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
  }

  const sampleJournal = {
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
    navigator: { platform: 'Win32', clipboard: { async writeText() {} } },
    fetch: async url => {
      const target = String(url)
      if (target.includes('/knowledge')) return { ok: true, status: 200, json: async () => sampleKnowledge }
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

  function materialize(vnode, ancestors = []) {
    if (vnode === null || vnode === undefined || typeof vnode === 'boolean') return null
    if (typeof vnode === 'string' || typeof vnode === 'number') return String(vnode)
    if (Array.isArray(vnode)) return vnode.map(child => materialize(child, ancestors)).filter(Boolean)
    if (typeof vnode.type === 'function') {
      return materialize(vnode.type(vnode.props || {}), ancestors)
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
    node.children = (vnode.props?.children || []).map(child => materialize(child, nextAncestors)).flat(Infinity).filter(Boolean)
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
        cursor = 0
        refCursor = 0
        idCounter = 0
        const tree = materialize(React.createElement(target.component, { locale, workbench }))
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

test('dsh-dream stylesheet enforces Never-Too-Dark slate, 5 [data-dsh-style] presets, clearances, icons and update footer', async () => {
  const env = createDreamUiEnv({ withPrimitives: false })
  const mounted = await env.mountWorkbench(true, 'zh-CN')
  try {
    const cssText = env.headStyles.map(s => s.textContent).join('\n')
    assert.match(cssText, /body\[data-ds-dark-theme\] \[data-dsh-style="harness"\]/)
    assert.match(cssText, /--dsw-alias-bg-base:\s*#1f232b/)
    assert.match(cssText, /--dsw-alias-bg-layer-1:\s*#272c36/)
    for (const preset of ['harness', 'cream', 'claude', 'pixel8bit', 'mint']) {
      assert.ok(cssText.includes(`[data-dsh-style="${preset}"]`), 'missing preset ' + preset)
    }
    assert.match(cssText, /translate:\s*1px 1px !important/)
    assert.match(cssText, /box-shadow:\s*2px 2px 0px #1e2826/)
    assert.match(cssText, /--dsh-frame-top-clearance/)
    assert.match(cssText, /--dsh-frame-leading-clearance/)
    assert.match(cssText, /\[data-window-drag-exclude\]/)
    assert.match(cssText, /@media \(prefers-reduced-motion: reduce\)/)
    assert.match(CLIENT_BUNDLE, /__stardustUpdatesInlinePage\(React,\s*h\(W\.Page/)
  } finally {
    mounted.cleanup()
  }
})

test('dsh-dream renders in standalone fallback mode, syncs 5 styles across root & portaled dialogs, and exposes SVG motion hooks', async () => {
  const env = createDreamUiEnv({ withPrimitives: false })
  assert.equal(env.primitivesRequestedAtLoad, false)
  assert.equal(env.client.__internals.DSH_STYLES.length, 5)

  const mounted = await env.mountWorkbench(true, 'en-US')
  try {
    let root = mounted.tree
    assert.equal(root.attrs['data-dsh-style'], 'harness')
    assert.equal(root.attrs['data-main'], 'true')

    // Verify SVG icon micro-animation markers exist across Dream buttons
    const iconNames = new Set(findNodes(root, n => n.tag === 'svg' && n.attrs['data-dsh-icon']).map(n => n.attrs['data-dsh-icon']))
    for (const expected of ['moon', 'sparkle', 'down', 'shield', 'search', 'refresh', 'check', 'trash', 'diff']) {
      assert.ok(iconNames.has(expected), 'missing data-dsh-icon=' + expected)
    }

    assert.ok(findNodes(root, n => Object.hasOwn(n.attrs, 'data-dsh-card')).length >= 3)
    assert.ok(findNodes(root, n => Object.hasOwn(n.attrs, 'data-dsh-row')).length >= 1)

    // Switch through all 5 styles via topbar SkinSwitcher
    for (const preset of ['cream', 'claude', 'pixel8bit', 'mint', 'harness']) {
      const trigger = findNodes(root, n => n.attrs.id === 'dream-style-switcher')[0]
      assert.ok(trigger)
      trigger.attrs.onClick()
      root = mounted.rerender()
      const items = findNodes(root, n => n.attrs.role === 'menuitemradio')
      assert.equal(items.length, 5)
      const idx = env.client.__internals.DSH_STYLES.findIndex(s => s.id === preset)
      items[idx].attrs.onClick()
      root = mounted.rerender()
      assert.equal(root.attrs['data-dsh-style'], preset)
      assert.equal(env.storage.get('dsh-stardust:ui-style'), preset)
    }

    // Open Command Palette dialog & verify portal style + drag exclusion sync
    const cmdBtn = findNodes(root, n => n.tag === 'button' && n.attrs['aria-label'] === 'Command palette')[0]
    assert.ok(cmdBtn)
    cmdBtn.attrs.onClick()
    root = mounted.rerender()

    const dialog = findNodes(root, n => n.attrs.role === 'dialog')[0]
    assert.ok(dialog)
    assert.equal(dialog.attrs['data-dsh-style'], 'harness')
    assert.equal(dialog.attrs['data-window-drag-exclude'], '')

    env.win.localStorage.setItem('dsh-stardust:ui-style', 'mint')
    env.win.dispatchEvent(new env.win.CustomEvent('dsh-stardust-style', { detail: { style: 'mint' } }))
    root = mounted.rerender()
    const updatedDialog = findNodes(root, n => n.attrs.role === 'dialog')[0]
    assert.equal(root.attrs['data-dsh-style'], 'mint')
    assert.equal(updatedDialog.attrs['data-dsh-style'], 'mint')
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
    for (const primitive of ['Button', 'Input', 'Checkbox', 'Switch', 'SegmentedTabs', 'Menu']) {
      assert.ok(env.primitiveCalls.includes(primitive), 'expected host primitive ' + primitive)
    }

    // Open StyleSwitcher Menu in host mode and verify HostMenuWithStyle stamps data-dsh-style + data-window-drag-exclude
    const trigger = findNodes(root, n => n.attrs.id === 'dream-style-switcher')[0]
    trigger.attrs.onClick()
    root = mounted.rerender()
    const hostMenu = findNodes(root, n => n.attrs['data-host-menu'] === 'true')[0]
    assert.ok(hostMenu)
    assert.equal(hostMenu.attrs['data-dsh-style'], 'cream')
    assert.equal(hostMenu.attrs['data-window-drag-exclude'], '')

    // Open Preview review changes Modal and verify HostModalWithStyle stamps data-dsh-style + data-window-drag-exclude
    const diffBtn = findNodes(root, n => n.attrs['data-dream-command'] === 'diff')[0]
    diffBtn.attrs.onClick()
    root = mounted.rerender()
    assert.ok(env.primitiveCalls.includes('Modal'))
    const hostModal = findNodes(root, n => n.attrs['data-host-modal'] === 'true')[0]
    assert.ok(hostModal)
    assert.equal(hostModal.attrs['data-dsh-style'], 'cream')
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
  assert.equal(activeRoutes, 2)
  for (const dispose of effects.splice(0).reverse()) dispose()
  assert.equal(activeTools, 0)
  assert.equal(activeRoutes, 0)
})
