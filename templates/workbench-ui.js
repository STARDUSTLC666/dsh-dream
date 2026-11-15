const DREAM_STYLE_KEY = 'dsh-dream-ui-style';
const styleListeners = new Set();
const DREAM_STYLES = [
  { value: 'dsh-native', label: 'DSH 原生' },
  { value: 'mac-island', label: 'Arc 浮岛' },
  { value: 'raycast', label: 'Raycast 聚光' },
  { value: 'bento', label: 'Bento 卡片' },
];
const icons = {
  book: 'IconChecklistOutlineRegular',
  check: 'IconCheckOutlineRegular',
  close: 'IconCloseOutlineRegular',
  diff: 'IconCompareSplitOutlineRegular',
  folder: 'IconFolderOpenOutlineRegular',
  info: 'IconInfoOutlineRegular',
  left: 'IconChevronLeftOutlineRegular',
  refresh: 'IconRefreshOutlineRegular',
  search: 'IconSearchOutlineRegular',
  settings: 'IconSettingsOutlineRegular',
  shield: 'IconShieldOutlineRegular',
  sparkle: 'IconSparkleRegular',
  trash: 'IconTrashOutlineRegular',
};
let primitives;
function nativeUI() {
  return primitives ??= require('@deepseek-ai/dsh-client-ui-primitives');
}

function Icon({ name, size = 16, ...props }) {
  const Component = nativeUI()[icons[name]];
  return Component ? h(Component, { size, 'aria-hidden': true, ...props }) : null;
}

function Button({ icon, variant = 'outline', className, children, ...props }) {
  return h(nativeUI().Button, {
    ...props, variant, className: clsx(css.control, variant === 'primary' && css.primary, className),
    icon: icon ? h(Icon, { name: icon }) : undefined,
  }, children);
}

function IconButton({ label, className, ...props }) {
  return h(Button, { ...props, className: clsx(css.iconButton, className), 'aria-label': label, title: label });
}

function Search({ label, className, ...props }) {
  return h(nativeUI().Input, {
    ...props, 'aria-label': label, placeholder: label, className: clsx(css.search, className),
    icon: h(Icon, { name: 'search' }),
  });
}

function Switch({ label, checked, onChange, disabled }) {
  return h('div', { className: css.switchRow },
    h('span', null, label),
    h(nativeUI().Switch, { label, checked, onChange, disabled }));
}

function Status({ tone = 'info', children }) {
  if (!children) return null;
  return h('div', { className: clsx(css.status, tone === 'error' && css.statusError), role: tone === 'error' ? 'alert' : 'status' },
    h(Icon, { name: tone === 'success' ? 'check' : 'info' }), h('div', null, children));
}

function Empty({ title, children, action, icon = 'book' }) {
  return h('div', { className: css.empty },
    h(Icon, { name: icon, size: 26 }), h('h2', null, title),
    children ? h('p', { className: css.muted }, children) : null, action);
}

function Dialog({ title, onClose, busy, className, children }) {
  const { Modal, MenuSurface } = nativeUI();
  return h(Modal, {
    open: true, onClose: () => { if (!busy) onClose(); }, title, headless: true,
    shortcutModal: 'dsh-dream', className: clsx(css.modal, className),
  }, h(MenuSurface, { className: clsx(css.surface, css.modalSurface), 'data-window-drag-exclude': true },
    h('header', { className: css.modalHeader }, h('h2', null, title),
      h(IconButton, { icon: 'close', label: t('关闭'), size: 'sm', variant: 'ghost', disabled: busy, onClick: onClose })),
    h('div', { className: css.modalBody }, children)));
}

function registerWorkbench(ctx, { id, label, component, inject, order = 50 }) {
  ctx.slots.inject('main', () => ctx.slots.register({
    name: 'main', key: id, inject: () => ({ ...inject(), workbench: true }),
  }, component));
  ctx.slots.inject('sidebar.panellist', () => ctx.slots.register({
    name: 'sidebar.panellist', id, order, label,
  }, function WorkbenchIcon({ size }) { return h(Icon, { name: 'sparkle', size }); }));
}

const W = { Button, Dialog, Empty, Icon, IconButton, Page: DreamChrome, Search, Status, Switch };

function validDreamStyle(value) {
  return DREAM_STYLES.find(style => style.value === value)?.value || DREAM_STYLES[0].value;
}

function loadDreamStyle() {
  try { return validDreamStyle(window.localStorage.getItem(DREAM_STYLE_KEY)); }
  catch { return DREAM_STYLES[0].value; }
}

const viewTransitions = new WeakMap();

function runViewTransition(node, update) {
  const doc = node?.ownerDocument;
  if (!doc?.startViewTransition || doc.defaultView?.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
    update();
    return;
  }
  const { flushSync } = require('react-dom');
  const previous = viewTransitions.get(node);
  previous?.transition.skipTransition();
  previous?.commit();
  let applied = false;
  function commit() {
    if (applied) return;
    applied = true;
    if (node.isConnected) flushSync(update);
  }
  try {
    node.dataset.dreamTransition = 'true';
    const transition = doc.startViewTransition(commit);
    viewTransitions.set(node, { transition, commit });
    transition.ready.catch(() => {});
    transition.finished.catch(() => { if (!applied) commit(); }).finally(() => {
      if (viewTransitions.get(node)?.transition === transition) {
        viewTransitions.delete(node);
        delete node.dataset.dreamTransition;
      }
    });
  } catch {
    delete node.dataset.dreamTransition;
    commit();
  }
}

function useDreamStyle(transitionRef) {
  const [style, setStyle] = useState(loadDreamStyle);
  useEffect(() => {
    function onStorage(event) {
      if (event.key === DREAM_STYLE_KEY && event.newValue !== event.oldValue) {
        runViewTransition(transitionRef.current, () => setStyle(validDreamStyle(event.newValue)));
      }
    }
    styleListeners.add(setStyle);
    window.addEventListener('storage', onStorage);
    return () => {
      styleListeners.delete(setStyle);
      window.removeEventListener('storage', onStorage);
    };
  }, [transitionRef]);
  function change(next) {
    if (next === style) return;
    runViewTransition(transitionRef.current, () => {
      for (const receive of styleListeners) receive(next);
      try { window.localStorage.setItem(DREAM_STYLE_KEY, next); } catch { /* Storage may be disabled. */ }
    });
  }
  return [style, change];
}

function SkinSwitcher({ value, onChange }) {
  const { Pill } = nativeUI();
  return h('div', { className: css['style-switcher-pill'], role: 'group', 'aria-label': t('工作台皮肤') },
    DREAM_STYLES.map(style => h(Pill, {
      key: style.value, className: css['style-preset-btn'],
      'aria-pressed': value === style.value, 'data-style': style.value, onClick: () => onChange(style.value),
    }, t(style.label))));
}

function followPointer(event) {
  if (event.pointerType === 'touch') return;
  const { currentTarget, clientX, clientY } = event;
  const rect = currentTarget.getBoundingClientRect();
  currentTarget.style.setProperty('--mx', clientX - rect.left + 'px');
  currentTarget.style.setProperty('--my', clientY - rect.top + 'px');
}

function clearSpotlight({ currentTarget }) {
  currentTarget.style.removeProperty('--mx');
  currentTarget.style.removeProperty('--my');
}

const spotlightHandlers = { onPointerMove: followPointer, onPointerLeave: clearSpotlight };
const editableSelector = 'input, textarea, select, [contenteditable]:not([contenteditable="false"]), [role="textbox"]';

function CommandPalette({ commands, onClose }) {
  const [query, setQuery] = useState('');
  const [index, setIndex] = useState(0);
  const id = useId();
  const matches = commands.filter(item => item.label.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()));
  function invoke(command) {
    const { flushSync } = require('react-dom');
    flushSync(onClose);
    command.run();
  }
  function onKeyDown(event) {
    if (!matches.length || event.isComposing || event.nativeEvent.isComposing) return;
    switch (event.key) {
      case 'ArrowDown': setIndex((index + 1) % matches.length); break;
      case 'ArrowUp': setIndex((index + matches.length - 1) % matches.length); break;
      case 'Enter': invoke(matches[index]); break;
      default: return;
    }
    event.preventDefault();
  }
  return h(Dialog, { title: t('命令面板'), onClose },
    h(Search, {
      label: t('搜索命令…'), value: query, onKeyDown,
      onChange: event => { setQuery(event.target.value); setIndex(0); },
      'data-modal-autofocus': true, role: 'combobox', 'aria-autocomplete': 'list', 'aria-expanded': true,
      'aria-controls': id, 'aria-activedescendant': matches.length ? id + '-' + index : undefined,
    }),
    h('div', { id, role: 'listbox', 'aria-label': t('命令面板'), className: css.commandList },
      matches.map((command, i) => h(Button, {
        key: command.id, id: id + '-' + i, role: 'option', variant: 'ghost', className: css.command,
        'aria-selected': i === index, tabIndex: -1, onClick: () => invoke(command),
      }, command.label, command.shortcut ? h('kbd', null, command.shortcut) : null)),
      matches.length ? null : h('p', { className: css.muted, role: 'status' }, t('没有匹配的命令'))));
}

const DREAM_TABS = [
  ['review', '待审阅'], ['knowledge', '已采纳'], ['journal', '日记'], ['bridge', '规则记录'], ['settings', '设置'],
];

function DreamChrome({
  root, workbench, activeTab, changeTab, tabId, skin, setSkin, paletteActions, openPalette, closePalette,
  privacy, togglePrivacy, automation, actionNotice, reviewCount, children,
}) {
  const panelId = tabId + '-panel';
  const tabs = DREAM_TABS.map(([value, label]) => ({
    value, id: tabId + '-' + value, panelId,
    label: h('span', { className: css.tabLabel }, t(label),
      value === 'review' && reviewCount > 0 ? h('span', { className: css.tabCount }, reviewCount) : null),
  }));
  const shortcut = /Mac/i.test(window.navigator.platform) ? '⌘K' : 'Ctrl+K';
  const commands = paletteActions ? [
    ...paletteActions,
    ...DREAM_TABS.map(([value, label]) => ({ id: value, label: t(label), run: () => changeTab(value) })),
    ...DREAM_STYLES.map(style => ({ id: style.value, label: t(style.label), run: () => setSkin(style.value) })),
  ] : null;
  return h('section', {
    ref: root, className: clsx(css['app-shell'], privacy && css['dshd-privacy']),
    'data-ds-style': skin, 'data-main': workbench,
  },
    h('header', { className: css.topbar },
      h('div', { className: css['topbar-left'] },
        h('div', { className: css['plugin-brand'] },
          h('span', { className: css['plugin-badge'], 'aria-hidden': true },
            h('svg', { width: 14, height: 14, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2 },
              h('path', { d: 'M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z' }),
              h('path', { d: 'M19 3v4M21 5h-4' }))),
          h('h1', null, t('Dream 记忆'))),
        h(nativeUI().SegmentedTabs, {
          label: t('Dream 视图'), value: activeTab, onChange: changeTab, items: tabs, size: 'sm', className: css['view-tabs'],
        })),
      h('div', { className: css['topbar-right'] },
        h(Button, {
          onClick: openPalette, size: 'sm', 'aria-label': t('命令面板'), title: t('命令面板'),
          'aria-haspopup': 'dialog', 'aria-keyshortcuts': 'Meta+K Control+K',
        }, h('kbd', null, shortcut)),
        h(Button, {
          icon: 'sparkle', size: 'sm', variant: 'primary', disabled: !automation.canFlush,
          onClick: () => automation.change({ operation: 'automatic-flush' }),
          'data-dream-command': 'flush', title: t('现在整理待处理轮次'),
        }, t('立即整理')),
        h(SkinSwitcher, { value: skin, onChange: setSkin }),
        h(IconButton, { icon: 'shield', size: 'sm', label: t('隐私模式'), 'aria-pressed': privacy, onClick: togglePrivacy }))),
    actionNotice ? h('div', { className: css.pageStatus }, h(Status, { tone: 'success' }, actionNotice)) : null,
    h('div', { id: panelId, role: 'tabpanel', 'aria-labelledby': tabId + '-' + activeTab, className: css['workspace-body'] },
      children),
    privacy ? h('p', { className: clsx(css.muted, css.privacyStatus), role: 'status' },
      t('隐私模式：显示层模糊；DOM 仍为明文，不改文件、不加密。点击卡片可临时查看。')) : null,
    commands ? h(CommandPalette, { commands, onClose: closePalette }) : null);
}
