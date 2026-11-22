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
  const ariaLabel = props['aria-label'] || (hiddenLabel && typeof label === 'string' ? label : undefined);
  return h(nativeUI().Checkbox, {
    ...props,
    checked: Boolean(checked),
    disabled,
    label: hiddenLabel ? undefined : label,
    'aria-label': ariaLabel,
    title: title || ariaLabel,
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
  const [font] = useDshFont(React);
  const P = nativeUI();
  const current = items.find(item => item.id === value) || items[0];
  return h('div', { className: clsx(css.choiceWrap, className), 'data-window-drag-exclude': '' },
    h(P.Menu, {
      open: Boolean(open && !disabled && items.length > 0),
      dshStyle: skin,
      dshFont: font,
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
      }, h('span', { ref: open ? createOverlaySyncRef(skin, font) : undefined, className: css.choiceLabel }, current?.label || label), h(Icon, { name: 'down', size: 13 })),
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

let lastDreamCopyStatus = '';

function legacyExecCopy(text) {
  try {
    if (typeof document === 'undefined' || typeof document.createElement !== 'function' || typeof document.execCommand !== 'function' || !document.body?.append) {
      return false;
    }
    const field = Object.assign(document.createElement('textarea'), { value: text });
    field.setAttribute('readonly', '');
    field.style.cssText = 'position:fixed;inset-block-start:0;opacity:0';
    document.body.append(field);
    field.select?.();
    try { return Boolean(document.execCommand('copy')); } finally { field.remove?.(); }
  } catch {
    return false;
  }
}

function CopyPrompt({ prompt, label, variant = 'outline', size = 'sm', className, onCopied }) {
  const text = typeof prompt === 'string' ? prompt.trim() : '';
  const [copied, setCopied] = useState(false);
  const [failed, setFailed] = useState(false);
  const [announcement, setAnnouncement] = useState('');
  const timerRef = useRef(null);
  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);
  if (!text) return null;

  const buttonLabel = label || text;
  const handleCopy = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    copyText(text).then(ok => {
      const succeeded = ok || legacyExecCopy(text);
      setCopied(succeeded);
      setFailed(!succeeded);
      let msg = succeeded ? t('已复制指令，粘贴到对话发送即可') : t('复制失败');
      if (msg === lastDreamCopyStatus) msg += '\u00A0';
      lastDreamCopyStatus = msg;
      setAnnouncement(msg);
      if (succeeded) onCopied?.(text);
      const timer = setTimeout(() => {
        setCopied(false);
        setFailed(false);
        setAnnouncement('');
      }, 2000);
      timer?.unref?.();
      timerRef.current = timer;
    });
  };

  const isCopied = copied === true;
  const isFailed = failed === true;
  return h('span', { className: clsx(css.copyPromptWrap, className) },
    h(Button, {
      type: 'button',
      variant,
      size,
      icon: isCopied ? 'check' : 'copy',
      'data-copied': isCopied ? 'true' : undefined,
      'data-failed': isFailed ? 'true' : undefined,
      'data-copy-prompt': text,
      title: text,
      onClick: handleCopy,
    }, isCopied ? t('已复制') : buttonLabel),
    h('span', {
      className: css.copyBubble,
      role: 'status',
      'data-visible': (isCopied || isFailed) ? 'true' : undefined,
    }, typeof announcement === 'string' ? announcement : ''),
    isFailed ? h('code', { className: css['dshd-cmd'], tabIndex: 0 }, text) : null);
}

const DREAM_TOUR_KEY = 'dsh-dream.tour.v1';
let dreamTourSessionDone = false;

function readDreamTourDone() {
  if (dreamTourSessionDone) return true;
  try {
    return typeof window !== 'undefined' && window.localStorage?.getItem(DREAM_TOUR_KEY) === 'done';
  } catch {
    return false;
  }
}

function writeDreamTourDone() {
  dreamTourSessionDone = true;
  try {
    if (typeof window !== 'undefined') window.localStorage?.setItem(DREAM_TOUR_KEY, 'done');
  } catch {
    // Ignore restricted storage.
  }
}

function computeCoachmarkLayout(target, preferredSide, cardEl) {
  const vw = (typeof window !== 'undefined' && window.innerWidth) || 1280;
  const vh = (typeof window !== 'undefined' && window.innerHeight) || 800;
  const cw = cardEl?.offsetWidth || 320;
  const ch = cardEl?.offsetHeight || 196;
  const pad = 5;
  const gap = 12;
  const raw = target?.getBoundingClientRect?.();
  if (!target) {
    return {
      spotlight: null,
      side: 'center',
      left: Math.max(12, Math.round((vw - cw) / 2)),
      top: Math.max(12, Math.round((vh - ch) / 2)),
      arrowX: 28,
      arrowY: 24,
    };
  }
  const hasBox = Boolean(raw && (raw.width > 0 || raw.height > 0));
  const rect = hasBox ? raw : { left: 120, top: 72, width: 140, height: 32, right: 260, bottom: 104 };
  const spotlight = {
    left: Math.round(rect.left - pad),
    top: Math.round(rect.top - pad),
    width: Math.round(rect.width + pad * 2),
    height: Math.round(rect.height + pad * 2),
  };
  const spaceBottom = vh - spotlight.top - spotlight.height;
  const spaceTop = spotlight.top;
  const spaceRight = vw - spotlight.left - spotlight.width;
  const spaceLeft = spotlight.left;

  let side = preferredSide || 'bottom';
  if (side === 'right' && spaceRight < cw + gap + 12) {
    side = spaceBottom >= ch + gap + 12 ? 'bottom' : spaceLeft >= cw + gap + 12 ? 'left' : 'top';
  } else if (side === 'left' && spaceLeft < cw + gap + 12) {
    side = spaceRight >= cw + gap + 12 ? 'right' : 'bottom';
  } else if (side === 'bottom' && spaceBottom < ch + gap + 12 && spaceTop > spaceBottom) {
    side = 'top';
  } else if (side === 'top' && spaceTop < ch + gap + 12 && spaceBottom > spaceTop) {
    side = 'bottom';
  }

  let left = spotlight.left;
  let top = spotlight.top + spotlight.height + gap;
  if (side === 'top') {
    top = spotlight.top - ch - gap;
  } else if (side === 'right') {
    left = spotlight.left + spotlight.width + gap;
    top = spotlight.top;
  } else if (side === 'left') {
    left = spotlight.left - cw - gap;
    top = spotlight.top;
  }
  left = Math.round(Math.max(12, Math.min(vw - cw - 12, left)));
  top = Math.round(Math.max(12, Math.min(vh - ch - 12, top)));
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;
  const arrowX = Math.round(Math.max(18, Math.min(cw - 18, centerX - left)));
  const arrowY = Math.round(Math.max(18, Math.min(ch - 18, centerY - top)));
  return { spotlight, side, left, top, arrowX, arrowY };
}

function safeTourQuery(scope, selector) {
  if (!scope || typeof scope.querySelector !== 'function' || !selector) return null;
  if (selector.startsWith('#') && !/[\s>+~,\[]/.test(selector)) {
    const rawId = selector.slice(1);
    const escaped = typeof CSS !== 'undefined' && typeof CSS.escape === 'function'
      ? '#' + CSS.escape(rawId)
      : '[id="' + rawId.replace(/["\\]/g, '\\$&') + '"]';
    try {
      return scope.querySelector(escaped);
    } catch {
      try { return scope.querySelector(selector); } catch { return null; }
    }
  }
  try {
    return scope.querySelector(selector);
  } catch {
    return null;
  }
}

function findVisibleTourTarget(scope, selectors) {
  let firstMatch = null;
  for (const sel of selectors) {
    if (!sel) continue;
    const node = safeTourQuery(scope, sel);
    if (!node) continue;
    if (!firstMatch) firstMatch = node;
    const rect = node.getBoundingClientRect?.();
    if (!rect || rect.width > 0 || rect.height > 0) return node;
  }
  return firstMatch;
}

function DreamCoachmarkTour({ rootRef, tabId, activeTab, changeTab, skin, font, step, manual, layout: rawLayout, setLayout, onStep, onClose }) {
  const layerRef = useRef(null);
  const cardRef = useRef(null);
  const nextBtnRef = useRef(null);
  const titleId = (typeof useId === 'function' ? useId() : 'dream-tour') + '-title';
  const [copiedTourPrompt, setCopiedTourPrompt] = useState(false);
  const tabSelector = suffix => '[id="' + String(tabId || '').replace(/["\\]/g, '\\$&') + '-' + suffix + '"]';
  const steps = [
    {
      id: 'deck-ribbon',
      tab: 'review',
      selector: '[data-tour="dream-ribbon"]',
      fallback: tabSelector('review'),
      side: 'bottom',
      title: t('叠卡 / 列表切换与分拣进度'),
      desc: t('默认以「叠卡」工作台逐张核对候选经验，并实时显示 Inbox Zero 分拣进度；点左侧按钮可一键切回经典「列表」分栏与批量审阅。'),
    },
    {
      id: 'deck-card',
      tab: 'review',
      selector: '[data-tour="dream-card"]',
      fallback: '[data-tour="dream-list"]',
      side: 'right',
      title: t('拖拽分拣与 Space 3D 翻面看证据'),
      desc: t('按住卡片向右拖采纳、向左拖丢弃，松手未达阈值会自动回弹；按 Space 或点「翻面看证据」3D 翻转查看会话原文、适用范围与脱敏预览。'),
    },
    {
      id: 'deck-dock',
      tab: 'review',
      selector: '[data-tour="dream-dock"]',
      fallback: '[data-tour="dream-flush"]',
      side: 'top',
      title: t('悬浮操作坞：丢弃、翻面、采纳与展开'),
      desc: t('底部悬浮操作坞支持点击与键盘快捷键（D 丢弃 / Space 翻面 / K·J 切卡 / A 确认采纳），点「展开完整详情」可处理冲突或对比修订差异。'),
    },
    {
      id: 'style-font',
      selector: '[data-tour="dream-style"]',
      fallback: '.dsh-style-switcher',
      side: 'bottom',
      title: t('13 套明亮风格与 8 套双层字体'),
      desc: t('随时切换 13 套明亮/柔和工作台风格与 8 套中英双层字体（默认「幼圆等宽」），并跨所有 DSH 插件自动同步。'),
    },
    {
      id: 'auto-accepted',
      selector: '[data-tour="dream-auto"]',
      fallback: '[data-tour="dream-tabs"]',
      side: 'bottom',
      title: t('自动记忆、已采纳库与设置'),
      desc: t('开启「自动整理」与「自动取回」让空闲会话自动提炼候选；确认采纳的经验沉淀在「已采纳」并可差异预览写入 AGENTS.md，也可前往「设置」调整预算与语言。'),
      prompt: t('做个梦'),
      promptLabel: t('复制「做个梦」'),
    },
  ];
  const current = steps[Math.max(0, Math.min(steps.length - 1, step))];
  const layout = rawLayout && typeof rawLayout === 'object' && rawLayout.side
    ? rawLayout
    : { spotlight: null, side: current.side || 'bottom', left: 24, top: 76, arrowX: 28, arrowY: 24 };

  async function copyStepPrompt(text) {
    const ok = await writeDreamClipboard(text);
    if (ok) {
      setCopiedTourPrompt(true);
      setTimeout(() => setCopiedTourPrompt(false), 1800);
    }
  }

  useEffect(() => {
    const node = layerRef.current;
    if (!node) return undefined;
    try {
      node.setAttribute?.('popover', 'manual');
      node.showPopover?.();
    } catch {
      // Fallback fixed layer remains visible when Popover API is absent.
    }
    return () => {
      try { node.hidePopover?.(); } catch { /* ignore */ }
    };
  }, []);

  useEffect(() => {
    if (current.tab && activeTab !== current.tab) {
      changeTab?.(current.tab);
    }
  }, [current.tab, activeTab]);

  useEffect(() => {
    function measure() {
      const scope = rootRef?.current || (typeof document !== 'undefined' ? document : null);
      if (!scope || typeof scope.querySelector !== 'function') return;
      const target = findVisibleTourTarget(scope, [current.selector, current.fallback, tabSelector('review')]);
      setLayout(computeCoachmarkLayout(target, current.side, cardRef.current));
    }
    measure();
    const raf = typeof requestAnimationFrame === 'function' ? requestAnimationFrame(measure) : null;
    if (typeof window === 'undefined' || typeof window.addEventListener !== 'function') {
      return () => { if (raf && typeof cancelAnimationFrame === 'function') cancelAnimationFrame(raf); };
    }
    window.addEventListener('resize', measure, { passive: true });
    window.addEventListener('scroll', measure, true);
    return () => {
      if (raf && typeof cancelAnimationFrame === 'function') cancelAnimationFrame(raf);
      window.removeEventListener('resize', measure);
      window.removeEventListener('scroll', measure, true);
    };
  }, [step, activeTab, current.selector, current.fallback, current.side]);

  useEffect(() => {
    if (!manual) return;
    nextBtnRef.current?.focus?.();
  }, [manual, step]);

  function finish() {
    onClose(manual);
  }
  function onKeyDown(event) {
    if (event.isComposing || event.nativeEvent?.isComposing) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      finish();
    } else if (event.key === 'ArrowRight' && step < steps.length - 1) {
      event.preventDefault();
      onStep(step + 1, true);
    } else if (event.key === 'ArrowLeft' && step > 0) {
      event.preventDefault();
      onStep(step - 1, true);
    }
  }

  const isLast = step >= steps.length - 1;
  return h('div', {
    ref: layerRef,
    className: css.tourLayer,
    'data-dsh-style': skin,
    'data-dsh-font': normalizeDshFont(font ?? readDshFont()),
    'data-dream-tour': current.id,
    'data-window-drag-exclude': '',
  },
    layout.spotlight
      ? h('div', {
          className: css.tourSpotlight,
          'data-tour-spotlight': current.id,
          'aria-hidden': 'true',
          style: {
            left: layout.spotlight.left + 'px',
            top: layout.spotlight.top + 'px',
            width: layout.spotlight.width + 'px',
            height: layout.spotlight.height + 'px',
          },
        })
      : h('div', { className: css.tourBackdropFallback, 'aria-hidden': 'true' }),
    h('div', {
      ref: cardRef,
      role: 'dialog',
      'aria-modal': 'false',
      'aria-labelledby': titleId,
      tabIndex: -1,
      onKeyDown,
      className: css.tourCard,
      'data-side': layout.side,
      'data-tour-card': current.id,
      style: {
        left: layout.left + 'px',
        top: layout.top + 'px',
        '--arrow-x': layout.arrowX + 'px',
        '--arrow-y': layout.arrowY + 'px',
      },
    },
      h('span', { className: css.tourArrow, 'data-tour-arrow': layout.side, 'aria-hidden': 'true' }),
      h('div', { className: css.tourHead },
        h('div', { className: css.tourStepMeta },
          h('span', { className: css.tourStepBadge }, (step + 1) + ' / ' + steps.length),
          h('span', { className: css.tourDots, 'aria-hidden': 'true' },
            steps.map((item, idx) => h('span', { key: item.id, className: css.tourDot, 'data-active': idx === step ? 'true' : undefined })))),
        h('button', { type: 'button', className: css.tourSkip, onClick: finish }, t('跳过'))),
      h('h2', { id: titleId, className: css.tourTitle }, current.title),
      h('p', { className: css.tourDesc }, current.desc),
      current.prompt ? h('div', { className: css.tourInlineAction },
        h(Button, {
          size: 'sm',
          variant: 'outline',
          icon: copiedTourPrompt ? 'check' : 'copy',
          'data-copy-prompt': current.prompt,
          'data-copied': copiedTourPrompt ? 'true' : undefined,
          onClick: () => { void copyStepPrompt(current.prompt); },
        }, copiedTourPrompt ? t('已复制') : current.promptLabel)) : null,
      h('div', { className: css.tourFooter },
        step > 0
          ? h(Button, { size: 'sm', variant: 'ghost', onClick: () => onStep(step - 1, true), 'data-tour-prev': '' }, t('上一步'))
          : h('span', null),
        h('div', { className: css.tourNav },
          h(Button, {
            ref: nextBtnRef,
            size: 'sm',
            variant: 'primary',
            'data-tour-next': '',
            onClick: () => (isLast ? finish() : onStep(step + 1, true)),
          }, isLast ? t('完成引导') : t('下一步'))))));
}

function Dialog({ title, onClose, busy, className, children, style: styleProp, font: fontProp }) {
  const [syncedStyle] = useDshStyle(React);
  const [syncedFont] = useDshFont(React);
  const activeStyle = normalizeDshStyle(styleProp ?? syncedStyle);
  const activeFont = normalizeDshFont(fontProp ?? syncedFont);
  const { Modal, MenuSurface } = nativeUI();
  const close = () => { if (!busy) onClose?.(); };
  return h(Modal, {
    open: true,
    dshStyle: activeStyle,
    dshFont: activeFont,
    onClose: close,
    title,
    closeLabel: t('关闭'),
    headless: true,
    backdropBlur: false,
    shortcutModal: 'dsh-dream',
    className: clsx(css.modal, className),
  }, h('div', {
    ref: createOverlaySyncRef(activeStyle, activeFont),
    'data-dsh-style': activeStyle,
    'data-dsh-font': activeFont,
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
const SplitResizer = createSplitResizerComponent(React);
const DreamSkeleton = createSkeletonComponent(React);

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

function useDreamFont(transitionRef) {
  const [font, setFontState] = useState(() => readDshFont());
  useEffect(() => {
    const current = readDshFont();
    setFontState(prev => (prev === current ? prev : current));
    syncPortaledFont(current, typeof document !== 'undefined' ? document : null);
    return subscribeDshFont(next => {
      runViewTransition(transitionRef?.current, () => {
        setFontState(prev => (prev === next ? prev : next));
      });
    });
  }, [transitionRef]);
  function change(next) {
    const normalized = normalizeDshFont(next);
    if (normalized === font) return normalized;
    runViewTransition(transitionRef?.current, () => {
      const applied = writeDshFont(normalized);
      setFontState(applied);
    });
    return normalized;
  }
  return [font, change];
}

function SkinSwitcher({ value, onChange, font, onFontChange }) {
  const lang = languageOf();
  return h(DreamStyleSwitcher, {
    id: 'dream-style-switcher',
    dataTour: 'dream-style',
    style: value,
    font,
    onChange,
    onFontChange,
    showFontSwitcher: true,
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

function CommandPalette({ commands, onClose, skin, font }) {
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
  return h(Dialog, { title: t('命令面板'), onClose, style: skin, font },
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
  root, workbench, activeTab, changeTab, tabId, skin, setSkin, font, setFont, paletteActions, openPalette, closePalette,
  privacy, togglePrivacy, automation, actionNotice, reviewCount, children,
}) {
  const panelId = tabId + '-panel';
  const [tour, setTour] = useState({ open: false, step: 0, manual: false });
  const [tourLayout, setTourLayout] = useState(null);
  const triggerRef = useRef(null);
  const paletteOpenRef = useRef(Boolean(paletteActions));
  paletteOpenRef.current = Boolean(paletteActions);
  const tabsIndicator = useSlidingTabIndicator(React, activeTab, { deps: [reviewCount, languageOf()] });

  useEffect(() => {
    if (!workbench || readDreamTourDone()) return undefined;
    const timer = setTimeout(() => {
      if (!readDreamTourDone() && !paletteOpenRef.current) {
        setTour({ open: true, step: 0, manual: false });
      }
    }, 280);
    return () => clearTimeout(timer);
  }, [workbench]);

  useEffect(() => {
    if (paletteActions && tour.open) {
      setTour(prev => ({ ...prev, open: false }));
    }
  }, [paletteActions]);

  function openTour(manual = true) {
    if (activeTab !== 'review') changeTab?.('review');
    setTour({ open: true, step: 0, manual: Boolean(manual) });
  }
  function closeTour(restoreFocus = false) {
    writeDreamTourDone();
    setTour(prev => ({ ...prev, open: false }));
    if (restoreFocus) {
      setTimeout(() => triggerRef.current?.focus?.(), 0);
    }
  }

  const tabs = DREAM_TABS.map(([value, label]) => ({
    value, id: tabId + '-' + value, panelId,
    label: h('span', { className: css.tabLabel }, t(label),
      value === 'review' && reviewCount > 0 ? h('span', { className: css.tabCount }, reviewCount) : null),
  }));
  const shortcut = /Mac/i.test(typeof window !== 'undefined' ? String(window.navigator?.platform || '') : '') ? '⌘K' : 'Ctrl+K';
  const lang = languageOf();
  const isZh = String(lang || '').toLowerCase().startsWith('zh');
  const commands = paletteActions ? [
    ...paletteActions,
    { id: 'dream:tour', label: t('使用引导'), run: () => openTour(true) },
    ...DREAM_TABS.map(([value, label]) => ({ id: 'tab:' + value, label: t(label), run: () => changeTab(value) })),
    ...DSH_STYLES.map(preset => ({
      id: 'style:' + preset.id,
      label: t('界面风格') + ' · ' + (isZh ? preset.zh : preset.en),
      run: () => setSkin(preset.id),
    })),
    ...DSH_FONTS.map(preset => ({
      id: 'font:' + preset.id,
      label: (isZh ? '字体搭配' : 'Font pairing') + ' · ' + (isZh ? preset.zh : preset.en),
      run: () => setFont?.(preset.id),
    })),
  ] : null;
  const needsInlineCss = typeof document === 'undefined' || typeof document.querySelector !== 'function'
    || document.querySelector("style[data-plugin-css='dsh-dream/client']") === null;
  return h('section', {
    ref: root,
    className: clsx(css['app-shell'], privacy && css['dshd-privacy']),
    'data-dsh-style': skin,
    'data-dsh-font': font,
    'data-main': String(Boolean(workbench)),
  },
    needsInlineCss ? h('style', { 'data-dsh-dream-inline': 'true' }, styleText) : null,
    h('header', { className: clsx('dsh-header', css.topbar), 'data-dsh-header': '' },
      h('div', { className: clsx('dsh-header-leading', css['topbar-left']) },
        h('div', { className: clsx('dsh-header-brand', css['plugin-brand']) },
          h('span', { className: clsx('dsh-header-badge', css['plugin-badge']), 'aria-hidden': true },
            h(Icon, { name: 'moon', size: 14 })),
          h('h1', { className: 'dsh-header-title' }, t('Dream 记忆'))),
        h('div', {
          'data-tour': 'dream-tabs',
          className: clsx('dsh-header-tabs', 'dsh-tablist', 'dsh-tablist-pill', css.tabsWrap),
          ...tabsIndicator.tablistProps,
        },
          h(nativeUI().SegmentedTabs, {
            label: t('Dream 视图'), value: activeTab, onChange: changeTab, items: tabs, size: 'sm', className: css['view-tabs'],
          }),
          h('span', tabsIndicator.indicatorProps))),
      h('div', { className: clsx('dsh-header-actions', css['topbar-right']) },
        h(Button, {
          ref: triggerRef,
          onClick: () => openTour(true),
          size: 'sm',
          variant: tour.open ? 'toolbar' : 'ghost',
          className: css.tourTrigger,
          'data-dream-tour-trigger': '',
          'aria-label': t('使用引导'),
          'aria-expanded': tour.open,
          title: t('使用引导'),
        }, '? ' + t('引导')),
        h(Button, {
          onClick: openPalette, size: 'sm', 'aria-label': t('命令面板'), title: t('命令面板'),
          'aria-haspopup': 'dialog', 'aria-keyshortcuts': 'Meta+K Control+K',
        }, h('kbd', null, shortcut)),
        h(Button, {
          icon: 'sparkle', spinning: Boolean(automation.value?.running), size: 'sm', variant: 'primary', disabled: !automation.canFlush,
          onClick: () => automation.change({ operation: 'automatic-flush' }),
          'data-dream-command': 'flush', 'data-tour': 'dream-flush', title: t('现在整理待处理轮次'),
        }, t('立即整理')),
        h(SkinSwitcher, { value: skin, onChange: setSkin, font, onFontChange: setFont }),
        h(IconButton, { icon: 'shield', size: 'sm', label: t('隐私模式'), 'aria-pressed': privacy, onClick: togglePrivacy }))),
    actionNotice ? h('div', { className: css.pageStatus }, h(Status, { tone: 'success' }, actionNotice)) : null,
    h('div', {
      key: activeTab,
      id: panelId,
      role: 'tabpanel',
      'aria-labelledby': tabId + '-' + activeTab,
      'data-dsh-tab-panel': '',
      className: clsx('dsh-tab-panel', css['workspace-body']),
    },
      children),
    privacy ? h('p', { className: clsx(css.muted, css.privacyStatus), role: 'status' },
      t('隐私模式：显示层模糊；DOM 仍为明文，不改文件、不加密。点击卡片可临时查看。')) : null,
    commands ? h(CommandPalette, { commands, onClose: closePalette, skin, font }) : null,
    tour.open ? h(DreamCoachmarkTour, {
      rootRef: root,
      tabId,
      activeTab,
      changeTab,
      skin,
      font,
      step: tour.step,
      manual: tour.manual,
      layout: tourLayout,
      setLayout: setTourLayout,
      onStep: (nextStep, isManual) => setTour({ open: true, step: nextStep, manual: Boolean(isManual) }),
      onClose: closeTour,
    }) : null);
}

const W = { Button, Checkbox, ChoiceMenu, CopyPrompt, Dialog, Empty, Icon, IconButton, Page: DreamChrome, Search, SegmentedControl, Skeleton: DreamSkeleton, SplitResizer, Status, Switch };
