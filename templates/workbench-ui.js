function nativeUI() {
  return resolveHostPrimitives(React, require);
}

function safeFlushSync(fn) {
  try {
    const ReactDOM = require('react-dom');
    if (typeof ReactDOM?.flushSync === 'function') {
      ReactDOM.flushSync(fn);
      return;
    }
  } catch {
    // Fallback when react-dom is not mounted in lightweight test harnesses.
  }
  fn();
}

function Icon({ name, size = 16, spinning = false, ...props }) {
  return renderDshIcon(React, { name, size, spinning, ...props });
}

function Button({ icon, spinning = false, variant = 'outline', className, children, type = 'button', ...props }) {
  const hostVariant = variant === 'danger' ? 'ghost' : variant === 'toolbar' ? 'outline' : variant;
  return h(nativeUI().Button, {
    type,
    ...props,
    'aria-busy': spinning ? 'true' : props['aria-busy'],
    variant: hostVariant,
    className: clsx(
      css.control,
      variant === 'primary' && css.primary,
      variant === 'danger' && css.danger,
      variant === 'toolbar' && css.toolbarActive,
      className,
    ),
    icon: icon ? h(Icon, { name: icon, size: 15, spinning }) : undefined,
  }, children);
}

function IconButton({ label, className, variant = 'ghost', ...props }) {
  return h(Button, { ...props, variant, className: clsx(css.iconButton, className), 'aria-label': label, title: label });
}

function Search({ label, className, ...props }) {
  return h(nativeUI().Input, {
    ...props,
    'aria-label': label,
    placeholder: label,
    className: clsx(css.search, className),
    icon: h(Icon, { name: 'search', size: 15 }),
  });
}

function Checkbox({ label, hiddenLabel = false, checked, disabled, onChange, className, title, ...props }) {
  return h(nativeUI().Checkbox, {
    ...props,
    checked: Boolean(checked),
    disabled,
    label,
    title: title || (hiddenLabel && typeof label === 'string' ? label : undefined),
    className: clsx(css.checkbox, hiddenLabel && 'dsh-checkbox-icon', className),
    onChange: next => onChange?.(typeof next === 'boolean' ? next : Boolean(next?.target?.checked)),
  });
}

function SegmentedControl({ id, label, value, options, onChange, disabled = false, className }) {
  return h(nativeUI().SegmentedControl, {
    id,
    label,
    value,
    options,
    disabled,
    onChange,
    className: clsx(css.segmented, className),
  });
}

function ChoiceMenu({ id, label, value, items, onChange, disabled = false, className, align = 'start' }) {
  const [open, setOpen] = useState(false);
  const [skin] = useDshStyle(React);
  const P = nativeUI();
  const current = items.find(item => item.id === value) || items[0];
  return h('div', { className: clsx(css.choiceWrap, className), 'data-window-drag-exclude': '' },
    h(P.Menu, {
      open: Boolean(open && !disabled && items.length > 0),
      dshStyle: skin,
      portal: !P.isFallback,
      compact: true,
      autoFocus: true,
      minWidthFromAnchor: true,
      align,
      selectedId: value,
      items,
      onClose: () => setOpen(false),
      onSelect: nextId => { setOpen(false); if (nextId !== value) onChange?.(nextId); },
      anchor: h(Button, {
        id,
        size: 'sm',
        disabled: disabled || items.length === 0,
        className: css.choiceButton,
        'aria-label': label + (current ? ' · ' + current.label : ''),
        'aria-haspopup': 'menu',
        'aria-expanded': Boolean(open && !disabled),
        onClick: () => setOpen(prev => !prev),
        onKeyDown: event => {
          if (!open && (event?.key === 'ArrowDown' || event?.key === 'ArrowUp')) {
            event.preventDefault?.();
            setOpen(true);
          }
        },
      }, h('span', { ref: open ? createOverlaySyncRef(skin) : undefined, className: css.choiceLabel }, current?.label || label), h(Icon, { name: 'down', size: 13 })),
    }),
  );
}

function Switch({ label, checked, onChange, disabled }) {
  return h('div', { className: css.switchRow },
    h('span', null, label),
    h(nativeUI().Switch, { label, checked: Boolean(checked), onChange, disabled }));
}

function Status({ tone = 'info', children }) {
  if (!children) return null;
  return h('div', { className: clsx(css.status, tone === 'error' && css.statusError), role: tone === 'error' ? 'alert' : 'status' },
    h(Icon, { name: tone === 'success' ? 'check' : 'info', size: 16 }), h('div', null, children));
}

function Empty({ title, children, action, icon = 'book' }) {
  return h('div', { className: css.empty },
    h(Icon, { name: icon, size: 26 }), h('h2', null, title),
    children ? h('p', { className: css.muted }, children) : null, action);
}

function Dialog({ title, onClose, busy, className, children, style: styleProp }) {
  const [syncedStyle] = useDshStyle(React);
  const activeStyle = normalizeDshStyle(styleProp ?? syncedStyle);
  const { Modal, MenuSurface } = nativeUI();
  const close = () => { if (!busy) onClose?.(); };
  return h(Modal, {
    open: true,
    dshStyle: activeStyle,
    onClose: close,
    title,
    closeLabel: t('关闭'),
    headless: true,
    backdropBlur: false,
    shortcutModal: 'dsh-dream',
    className: clsx(css.modal, className),
  }, h('div', {
    ref: createOverlaySyncRef(activeStyle),
    'data-dsh-style': activeStyle,
    'data-window-drag-exclude': '',
    className: css.modalFrame,
  }, h(MenuSurface, { className: clsx(css.surface, css.modalSurface), 'data-window-drag-exclude': '' },
    h('header', { className: css.modalHeader }, h('h2', null, title),
      h(IconButton, { icon: 'close', label: t('关闭'), size: 'sm', variant: 'ghost', disabled: busy, onClick: close })),
    h('div', { className: css.modalBody, 'aria-busy': busy || undefined }, children))));
}

function registerWorkbench(ctx, { id, label, component, inject, order = 50 }) {
  ctx.slots.inject('main', () => ctx.slots.register({
    name: 'main', key: id, inject: () => ({ ...inject(), workbench: true }),
  }, component));
  ctx.slots.inject('sidebar.panellist', () => ctx.slots.register({
    name: 'sidebar.panellist', id, order, label,
  }, function WorkbenchIcon({ size }) { return h(Icon, { name: 'sparkle', size }); }));
}

const DreamStyleSwitcher = createStyleSwitcherComponent(React, require);

const viewTransitions = new WeakMap();

function runViewTransition(node, update) {
  const doc = node?.ownerDocument;
  if (!doc?.startViewTransition || doc.defaultView?.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
    update();
    return;
  }
  const previous = viewTransitions.get(node);
  previous?.transition.skipTransition();
  previous?.commit();
  let applied = false;
  function commit() {
    if (applied) return;
    applied = true;
    if (node.isConnected) safeFlushSync(update);
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
  const [style, setStyleState] = useState(() => readDshStyle());
  useEffect(() => {
    const current = readDshStyle();
    setStyleState(prev => (prev === current ? prev : current));
    return subscribeDshStyle(next => {
      runViewTransition(transitionRef?.current, () => {
        setStyleState(prev => (prev === next ? prev : next));
      });
    });
  }, [transitionRef]);
  function change(next) {
    const normalized = normalizeDshStyle(next);
    if (normalized === style) return normalized;
    runViewTransition(transitionRef?.current, () => {
      const applied = writeDshStyle(normalized);
      setStyleState(applied);
    });
    return normalized;
  }
  return [style, change];
}

function SkinSwitcher({ value, onChange }) {
  const lang = languageOf();
  return h(DreamStyleSwitcher, {
    id: 'dream-style-switcher',
    style: value,
    onChange,
    lang,
    compact: true,
    formatAriaLabel: preset => t('界面风格') + '：' + t(preset.zh),
    formatTriggerLabel: (preset, compact) => t(compact ? preset.zhShort : preset.zh),
    formatOptionLabel: preset => lang === 'zh' ? preset.zh + ' (' + preset.enShort + ')' : t(preset.zh),
  });
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

function CommandPalette({ commands, onClose, skin }) {
  const [query, setQuery] = useState('');
  const [index, setIndex] = useState(0);
  const id = typeof useId === 'function' ? useId() : 'dream-cmd';
  const matches = commands.filter(item => item.label.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()));
  function invoke(command) {
    safeFlushSync(onClose);
    command.run();
  }
  function onKeyDown(event) {
    if (!matches.length || event.isComposing || event.nativeEvent?.isComposing) return;
    switch (event.key) {
      case 'ArrowDown': setIndex((index + 1) % matches.length); break;
      case 'ArrowUp': setIndex((index + matches.length - 1) % matches.length); break;
      case 'Enter': invoke(matches[index]); break;
      default: return;
    }
    event.preventDefault();
  }
  return h(Dialog, { title: t('命令面板'), onClose, style: skin },
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
  const shortcut = /Mac/i.test(typeof window !== 'undefined' ? String(window.navigator?.platform || '') : '') ? '⌘K' : 'Ctrl+K';
  const commands = paletteActions ? [
    ...paletteActions,
    ...DREAM_TABS.map(([value, label]) => ({ id: 'tab:' + value, label: t(label), run: () => changeTab(value) })),
    ...DSH_STYLES.map(preset => ({
      id: 'style:' + preset.id,
      label: t('界面风格') + ' · ' + t(preset.zh),
      run: () => setSkin(preset.id),
    })),
  ] : null;
  const needsInlineCss = typeof document === 'undefined' || typeof document.querySelector !== 'function'
    || document.querySelector("style[data-plugin-css='dsh-dream/client']") === null;
  return h('section', {
    ref: root,
    className: clsx(css['app-shell'], privacy && css['dshd-privacy']),
    'data-dsh-style': skin,
    'data-main': String(Boolean(workbench)),
  },
    needsInlineCss ? h('style', { 'data-dsh-dream-inline': 'true' }, styleText) : null,
    h('header', { className: css.topbar },
      h('div', { className: css['topbar-left'] },
        h('div', { className: css['plugin-brand'] },
          h('span', { className: css['plugin-badge'], 'aria-hidden': true },
            h(Icon, { name: 'moon', size: 14 })),
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
          icon: 'sparkle', spinning: Boolean(automation.value?.running), size: 'sm', variant: 'primary', disabled: !automation.canFlush,
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
    commands ? h(CommandPalette, { commands, onClose: closePalette, skin }) : null);
}

const W = { Button, Checkbox, ChoiceMenu, Dialog, Empty, Icon, IconButton, Page: DreamChrome, Search, SegmentedControl, Status, Switch };
