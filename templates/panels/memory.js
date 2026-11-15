const LIST_PAGE_SIZE = 50;
const LIST_MIN_WIDTH = 224;
const LIST_MAX_WIDTH = 520;
const LESSON_TONES = { candidate: 'warning', usable: 'success', disputed: 'danger', stale: 'warning', rejected: 'neutral' };
const LESSON_KINDS = { preference: '偏好', procedure: '流程', pitfall: '避坑', fact: '事实' };
const SECRET_LABELS = {
  '疑似 sk 密钥': '疑似 sk 密钥',
  '疑似 GitHub 令牌': '疑似 GitHub 令牌',
  '疑似 GitHub 细粒度令牌': '疑似 GitHub 细粒度令牌',
  '疑似 Groq 密钥': '疑似 Groq 密钥',
  '疑似 Slack 令牌': '疑似 Slack 令牌',
  '疑似 AWS 访问密钥': '疑似 AWS 访问密钥',
  '疑似 JWT': '疑似 JWT',
  '凭据': '凭据',
  '长令牌': '长令牌',
};

function RedactionSlot({ type }) {
  const [open, setOpen] = useState(false);
  const name = t(SECRET_LABELS[type] ?? type);
  return h(nativeUI().Pill, {
    className: css.redaction, active: open, 'aria-expanded': open,
    onClick: () => setOpen(value => !value),
  }, '[' + t(open ? '掩码预览' : '已脱敏') + '·' + name + (open ? ' ••••••••]' : ']'));
}

function EvidenceText({ text }) {
  const parts = String(text || '').split(/\[已脱敏·([^\]\r\n]{1,80})\]/g);
  return parts.map((part, index) => index % 2 === 0 ? part : h(RedactionSlot, { key: index, type: part }));
}

function ReviewBlock({ index, title, children }) {
  return h('section', {
    className: clsx(css.verifyCard, css.spotlight, css.stagger), style: { '--stagger-idx': index },
    ...spotlightHandlers,
  }, h('h3', null, title), children);
}

function historyAfter(previous, payload) {
  const earlier = new Map((previous.data?.lessons ?? []).map(lesson => [lesson?.id, lesson]));
  const revisions = new Map();
  for (const lesson of payload.lessons ?? []) {
    if (!lesson?.id) continue;
    const snapshot = earlier.get(lesson.id);
    const base = snapshot?.revision < lesson.revision ? snapshot : previous.revisions.get(lesson.id);
    if (base && base.revision < lesson.revision) revisions.set(lesson.id, base);
  }
  return { data: payload, revisions };
}

function lessonDiff(before, after) {
  const fields = [
    ['标题', 'title'], ['建议行动', 'action'], ['适用条件', 'when'], ['适用范围', 'scopeLabel'],
    ['例外与补充', 'exceptions'], ['适用环境', 'applicability'], ['审阅状态', 'stateLabel'],
  ];
  function textOf(row, field) {
    const value = row[field];
    return Array.isArray(value) ? value.join('\n') : value || '';
  }
  return fields.flatMap(([label, field]) => {
    const oldText = textOf(before, field), newText = textOf(after, field);
    return oldText === newText ? [] : [{ path: t(label), oldText, newText }];
  });
}

function LessonDiffDialog({ row, base, onClose }) {
  const [action, setAction] = useState(row.state === 'disputed' ? 'reject' : 'accept');
  const state = action === 'accept' ? 'usable' : 'rejected';
  const before = base || row;
  const after = base ? row : { ...row, stateLabel: lessonStateLabel(state) };
  const diffs = lessonDiff(before, after);
  const title = base ? t('修订对比') : t('审阅变更预览');
  return h(W.Dialog, { title, onClose },
    h('div', { className: css.diffMeta },
      h('span', null, t('版本') + ' ' + before.revision + ' → ' + (base ? row.revision : t('确认审阅后'))),
      base ? null : h('label', null, t('审阅动作'), h('select', { value: action, onChange: event => setAction(event.target.value) },
        row.state === 'disputed' ? null : h('option', { value: 'accept' }, t('确认采纳')),
        h('option', { value: 'reject' }, t('丢弃'))))),
    diffs.length ? h(nativeUI().DiffBlock, {
      diffs, maxLines: 40, labels: {
        codeLabel: t('差异'), wrapLabel: t('自动换行'), unwrapLabel: t('取消自动换行'),
        copy: t('复制差异'), copied: t('已复制'), collapse: t('收起'), collapseAria: t('收起差异'),
        expand: hidden => t('展开') + ' ' + hidden, expandAria: hidden => t('展开差异') + ' ' + hidden,
      },
    }) : h('p', { className: css.muted }, t('这两个版本的可展示字段相同。')));
}

function MemoryDetail({ row, base, privacy, reviewMode, onChanged, onExit, batchPending }) {
  const [peek, setPeek] = useState(false);
  const [diffOpen, setDiffOpen] = useState(false);
  const masked = privacy && !peek;
  const previous = base ? normalizeKnowledge({ lessons: [base] }, new Date(), 1).rows[0] : null;
  const canCompare = previous || (reviewMode && row.revision >= 1);
  const compareLabel = previous ? t('修订对比') : t('审阅变更预览');
  return h('article', { className: clsx(css.inspectorContent, masked && css.masked) },
    h('header', { className: css.inspectorHeader },
      h('div', { className: css.inspectorTitle },
        h('h2', { tabIndex: -1, 'data-dream-detail-title': true, className: css.privateText }, row.title),
        h('div', { className: css.meta }, h(W.Icon, { name: 'folder' }),
          h('span', { className: css.scopeCaption, title: row.scopeLabel }, row.scopeLabel),
          h(nativeUI().Tag, { tone: LESSON_TONES[row.state] }, row.stateLabel), h('span', null, 'v' + row.revision))),
      h('div', { className: css.actions },
        privacy ? h(W.Button, { variant: 'ghost', onClick: () => setPeek(!peek), 'aria-pressed': peek },
          t(peek ? '重新模糊' : '临时查看内容')) : null,
        canCompare ? h(W.Button, {
          icon: 'diff', size: 'sm', disabled: masked, onClick: () => setDiffOpen(true),
          'data-dream-command': 'diff',
        }, compareLabel) : null)),
    h('div', { className: clsx(css.verification, css.privateText) },
      h(ReviewBlock, { index: 0, title: t('来源与证据') },
        row.evidence.length ? row.evidence.map(source => h('div', { key: source.id, className: css.evidence },
          h('blockquote', { className: css.quote }, h(EvidenceText, { text: source.summary || t('未提供摘要') })),
          h('details', null, h('summary', null, t('查看来源记录')),
            h('p', { className: css.muted }, (source.verification === 'read' ? t('已读到来源') : t('待核验')) + ' · ' + t(source.kind === 'session' ? '会话' : source.kind === 'user-correction' ? '用户纠正' : '本地资料')),
            source.sessionId ? h('p', { className: css.muted }, t('会话：') + source.sessionId + (source.recordSeq != null ? t(' · 记录 ') + source.recordSeq : '')) : null,
            h('p', { className: css.muted }, t('记录时间：') + formatDate(source.observedAt)),
            source.verificationReason ? h('p', { className: css.muted }, source.verificationReason === 'live-session-source-verified' ? t('已核对当前会话原文；不代表结论正确。') : source.verificationReason) : null,
            source.sourceHash ? h('code', { className: css.sourceHash }, t('来源校验值：') + source.sourceHash) : null))) : null,
        row.evidence.length ? h('details', { className: css.evidenceSummary },
          h('summary', null, t('证据摘要')),
          h('p', { className: css.muted }, h(EvidenceText, { text: row.evidenceSummary }))) :
          h('p', { className: css.muted }, t(row.state === 'usable' ? '未关联来源记录，使用前请核对依据。' : '没有关联来源记录，采纳前请核对依据。'))),
      h(ReviewBlock, { index: 1, title: t('建议行动') }, h('p', null, row.action || t('未标注具体动作'))),
      h(ReviewBlock, { index: 2, title: t('范围、条件与例外') },
        h('dl', { className: css.scopeFacts },
          h('dt', null, t('适用范围')), h('dd', null, row.scopeLabel),
          h('dt', null, t('适用条件')), h('dd', null, row.when || t('未标注适用条件')),
          row.applicability ? h(React.Fragment, null, h('dt', null, t('适用环境')), h('dd', null, row.applicability)) : null,
          h('dt', null, t('例外与补充')), h('dd', null, row.exceptions.length ? row.exceptions.join(' · ') : t('未记录例外'))),
        h('p', { className: css.muted, title: row.lastTitle }, t('最近核验：') + row.lastText),
        row.lastRetrievedAt ? h('p', { className: css.muted, title: t('取回仅表示提供参考，不等于重新核验。') }, t('最近取回：') + formatDate(row.lastRetrievedAt) + ' ' + formatTime(row.lastRetrievedAt)) : null)),
    row.holdReasonLabel ? h(W.Status, null, t('为什么被扣下：') + row.holdReasonLabel) : null,
    h(ReviewControls, { row, key: row.id + '@' + row.revision, shortcuts: reviewMode, masked, batchPending, onChanged, onExit }),
    diffOpen && !masked ? h(LessonDiffDialog, { row, base: previous, onClose: () => setDiffOpen(false) }) : null);
}

function ColumnDivider({ splitRef, listId, listRef, detailRef }) {
  const [width, setWidth] = useState(316);
  const drag = useRef(null);
  const left = useRef(0);
  useLayoutEffect(() => {
    const list = listRef.current;
    const observer = new ResizeObserver(() => setWidth(list.offsetWidth));
    observer.observe(list);
    return () => observer.disconnect();
  }, [listRef]);
  function resize(next) {
    const max = Math.min(LIST_MAX_WIDTH, listRef.current.offsetWidth + detailRef.current.offsetWidth - 300);
    const bounded = Math.round(Math.max(LIST_MIN_WIDTH, Math.min(max, next)));
    splitRef.current.style.setProperty('--list-width', bounded + 'px');
  }
  function start(event) {
    if (event.button !== 0 || !event.isPrimary) return;
    const handle = event.currentTarget;
    drag.current = event.pointerId;
    left.current = listRef.current.getBoundingClientRect().left;
    handle.focus({ preventScroll: true });
    handle.setPointerCapture(event.pointerId);
  }
  function stop(event) {
    if (drag.current !== event.pointerId) return;
    drag.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  }
  function keys(event) {
    const step = event.shiftKey ? 40 : 16;
    if (event.key === 'ArrowLeft') resize(listRef.current.offsetWidth - step);
    else if (event.key === 'ArrowRight') resize(listRef.current.offsetWidth + step);
    else if (event.key === 'Home') resize(LIST_MIN_WIDTH);
    else if (event.key === 'End') resize(LIST_MAX_WIDTH);
    else return;
    event.preventDefault();
  }
  return h('div', {
    className: css.divider, tabIndex: 0, role: 'separator', 'aria-orientation': 'vertical', 'aria-controls': listId,
    'aria-label': t('调整候选列表宽度'), 'aria-valuenow': width, 'aria-valuemin': LIST_MIN_WIDTH, 'aria-valuemax': LIST_MAX_WIDTH,
    onKeyDown: keys, onPointerDown: start,
    onPointerMove: event => { if (event.pointerId === drag.current) resize(event.clientX - left.current); },
    onPointerUp: stop, onPointerCancel: stop, onLostPointerCapture: stop,
  });
}

function playRowExit(node, action) {
  if (!node?.isConnected) return Promise.resolve();
  if (node.ownerDocument.defaultView.matchMedia('(prefers-reduced-motion: reduce)').matches) return Promise.resolve();
  node.dataset.exit = action;
  return new Promise(resolve => {
    const timer = setTimeout(done, 430);
    function done() {
      clearTimeout(timer);
      node.removeEventListener('animationend', onEnd);
      node.removeEventListener('animationcancel', onEnd);
      resolve();
    }
    function onEnd(event) {
      if (event.target === node && event.animationName.includes('exit')) done();
    }
    node.addEventListener('animationend', onEnd);
    node.addEventListener('animationcancel', onEnd);
  });
}

function CandidateRow({ row, index, active, selected, disabled, onSelect, onOpen, privacy }) {
  return h('div', {
    className: clsx(css.candidate, css.stagger, css.spotlight, privacy && css.maskedRow),
    'data-dream-row': row.id, 'data-active': active, style: { '--stagger-idx': Math.min(index, 12) }, ...spotlightHandlers,
  },
  onSelect ? h('input', {
    type: 'checkbox', checked: selected, disabled, onChange: event => onSelect(event.target.checked),
    'aria-label': privacy ? t('选中候选') : t('选中候选：') + row.title, className: css.batchCheckbox,
  }) : null,
  h('button', { type: 'button', 'aria-pressed': active, onClick: onOpen, className: css.candidateButton },
    h('span', { className: css.candidateTitle }, row.title),
    h('span', { className: css.candidateMeta },
      h('span', { className: css.scopeCaption, title: row.scopeLabel }, row.scopeLabel),
      h(nativeUI().Tag, { tone: LESSON_TONES[row.state] }, row.stateLabel)),
    h('span', { className: css.candidateExcerpt }, row.when || row.action)));
}

function MemoryBoard({ vm, revisions, reviewMode, error, loading, privacy, onChanged, onRetry, moveRef, automation }) {
  const [search, setSearch] = useState('');
  const [group, setGroup] = useState('');
  const [history, setHistory] = useState(false);
  const [activeId, setActiveId] = useState(null);
  const [selected, setSelected] = useState([]);
  const [limit, setLimit] = useState(LIST_PAGE_SIZE);
  const [pending, setPending] = useState(false);
  const [failure, setFailure] = useState('');
  const [retry, setRetry] = useState(null);
  const [globalConfirmed, setGlobalConfirmed] = useState('');
  const batchLock = useRef(false);
  const splitRef = useRef(null);
  const listRef = useRef(null);
  const detailRef = useRef(null);
  const focusNext = useRef(false);
  const mobileReturn = useRef(null);
  const listId = useId();
  // Update protection for a batch in flight.
  __stardustUpdatesGuard(React, "dsh-dream.memory-board", { busy: pending });

  const all = vm.rows.filter(row => reviewMode ? HELD_STATES.includes(row.state) : row.state === (history ? 'rejected' : 'usable'));
  const groups = [...new Map(all.map(row => [row.groupKey, row.scopeLabel + ' · ' + t(LESSON_KINDS[row.kind] ?? row.kind)]))];
  const groupFilter = groups.some(([key]) => key === group) ? group : '';
  const needle = search.trim().toLocaleLowerCase();
  const rows = all.filter(row => (!groupFilter || row.groupKey === groupFilter) &&
    (!needle || [row.title, row.when, row.action, row.scopeLabel].join(' ').toLocaleLowerCase().includes(needle)));
  const visible = rows.slice(0, limit);
  const active = rows.find(row => row.id === activeId) || visible[0];
  const picked = rows.filter(row => selected.includes(row.id) && row.candidate && !row.conflictIds.length);
  const globalSelection = picked.filter(row => row.isGlobal).map(row => row.id + '@' + row.revision).join(',');
  const confirmed = globalSelection !== '' && globalSelection === globalConfirmed;
  const sameGroup = new Set(picked.map(row => row.groupKey)).size <= 1;
  const mobileDetail = activeId !== null && active !== undefined;

  function rowNode(id) {
    return Array.from(listRef.current?.querySelectorAll('[data-dream-row]') || []).find(node => node.dataset.dreamRow === id);
  }
  function select(row, focus = true) {
    focusNext.current = focus;
    setActiveId(row.id);
  }
  useLayoutEffect(() => {
    if (!focusNext.current) return;
    focusNext.current = false;
    if (detailRef.current?.getClientRects().length && !listRef.current?.getClientRects().length) {
      detailRef.current.querySelector('[data-dream-detail-title]')?.focus({ preventScroll: true });
    } else if (active) {
      const node = rowNode(active.id);
      node?.querySelector('button')?.focus({ preventScroll: true });
      node?.scrollIntoView({ block: 'nearest' });
    }
  }, [activeId, active?.id, limit]);
  useLayoutEffect(() => {
    if (activeId === null && mobileReturn.current) {
      const node = rowNode(mobileReturn.current);
      mobileReturn.current = null;
      (node?.querySelector('button') || listRef.current?.querySelector('input[type="search"]'))?.focus({ preventScroll: true });
    }
  }, [activeId]);
  useLayoutEffect(() => {
    if (!reviewMode || !moveRef) return;
    moveRef.current = direction => {
      if (!rows.length || pending || error) return false;
      const current = rows.findIndex(row => row.id === active?.id);
      const next = (current + direction + rows.length) % rows.length;
      if (next >= limit) setLimit(Math.ceil((next + 1) / LIST_PAGE_SIZE) * LIST_PAGE_SIZE);
      if (rows[next].id !== activeId) select(rows[next]);
      else rowNode(rows[next].id)?.scrollIntoView({ block: 'nearest' });
      return true;
    };
    return () => { moveRef.current = null; };
  });

  async function animate(ids, action) {
    const nodes = ids.map(rowNode);
    const focus = splitRef.current?.ownerDocument.activeElement;
    if (active && ids.includes(active.id) && (detailRef.current?.contains(focus) || nodes.some(node => node?.contains(focus)))) {
      focusNext.current = true;
    }
    await Promise.all(nodes.map(node => playRowExit(node, action)));
  }
  async function batch(action) {
    if (batchLock.current || !picked.length || !sameGroup || action === 'accept' && globalSelection && !confirmed) return;
    const items = picked.map(row => ({ lessonId: row.id, expectedRevision: row.revision }));
    const signature = JSON.stringify({ action, items });
    const requestId = retry?.signature === signature ? retry.id : crypto.randomUUID();
    batchLock.current = true;
    setRetry({ signature, id: requestId }); setPending(true); setFailure('');
    try {
      await postAction({ operation: 'review-batch', action, items, requestId, confirmGlobal: confirmed });
      await animate(items.map(item => item.lessonId), action);
      setSelected([]); setRetry(null); setGlobalConfirmed('');
      onChanged(t('已完成所选候选的审阅。'));
    } catch (error) {
      setFailure(displayError(error));
    } finally {
      batchLock.current = false;
      setPending(false);
    }
  }
  function resetList() {
    setActiveId(null); setSelected([]); setGlobalConfirmed(''); setLimit(LIST_PAGE_SIZE); setFailure('');
  }
  function changeGroup(value) {
    setGroup(value);
    resetList();
  }

  const scopePicker = h('label', { className: css.scopePicker },
    h('span', null, t('项目与主题')),
    h('select', { value: groupFilter, disabled: pending, onChange: event => changeGroup(event.target.value) },
      h('option', { value: '' }, t('全部项目与主题')),
      groups.map(([key, label]) => h('option', { key, value: key }, label))));
  const listEmpty = error ? h(W.Empty, { title: t('暂时读不到经验'), action: h(W.Button, { onClick: onRetry, disabled: loading }, t('重试')) }, displayError(error))
    : loading && !all.length ? h(W.Empty, { title: t('加载中…') })
    : !rows.length ? h(W.Empty, {
      title: all.length ? t('没有匹配的经验') : reviewMode ? t('没有待审阅的经验') : t(history ? '没有已驳回记录。' : '还没有已采纳的经验'),
      action: all.length ? h(W.Button, { onClick: () => { setSearch(''); changeGroup(''); } }, t('清空筛选')) : null,
    }) : null;

  return h('div', {
    className: css.board, ref: splitRef, 'data-review': reviewMode, 'data-detail': mobileDetail,
  },
    reviewMode ? h('aside', { className: css.rail, 'aria-label': t('审阅筛选与自动记忆') },
      h('section', { className: clsx(css.settingsCard, css.spotlight), ...spotlightHandlers },
        h('h2', null, t('自动记忆')), h(AutomaticSwitches, { automation }),
        h('p', { className: css.muted }, t('候选经验由你确认采纳。')),
        h(W.Status, { tone: 'error' }, automation.failure ? displayError(automation.failure) : null)),
      scopePicker) : null,
    h('section', { className: css.candidatePane, ref: listRef, id: listId, 'aria-label': t(reviewMode ? '候选经验' : '已采纳') },
      h('div', { className: css.listToolbar },
        h(W.Search, {
          type: 'search', label: t('搜索经验'), value: search, disabled: pending,
          onChange: event => { setSearch(event.target.value); setLimit(LIST_PAGE_SIZE); setActiveId(null); },
        }),
        h(W.IconButton, { icon: 'refresh', label: t('刷新'), onClick: onRetry, disabled: loading || pending })),
      !reviewMode ? h('div', { className: css.acceptedFilters }, scopePicker,
        h('label', { className: css.checkLabel }, h('input', { type: 'checkbox', checked: history, onChange: event => {
          setHistory(event.target.checked); setSearch(''); changeGroup('');
        } }), t('已驳回历史'))) : null,
      picked.length ? h('div', { className: css.batch },
        h('p', { className: css.muted }, t('已选') + ' ' + picked.length + ' / 20'),
        globalSelection ? h('label', { className: css.checkLabel }, h('input', {
          type: 'checkbox', checked: confirmed, disabled: pending, onChange: event => setGlobalConfirmed(event.target.checked ? globalSelection : ''),
        }), t('全局经验会用于所有项目；我已核对并同意。')) : null,
        !sameGroup ? h('p', { className: css.muted }, t('请只选择同范围、同主题的候选。')) : null,
        h('div', { className: css.actions },
          h(W.Button, { variant: 'primary', disabled: pending || !sameGroup || !!globalSelection && !confirmed, onClick: () => batch('accept') }, t('批量采纳')),
          h(W.Button, { disabled: pending || !sameGroup, onClick: () => batch('reject') }, t('批量驳回'))),
        h(W.Status, { tone: 'error' }, failure)) : null,
      h('div', { className: css.candidateList, 'aria-busy': loading || pending }, listEmpty ||
        visible.map((row, index) => h(CandidateRow, {
          key: row.id, row, index, active: row.id === active?.id, selected: selected.includes(row.id), privacy,
          onOpen: () => select(row),
          disabled: pending || !selected.includes(row.id) && selected.length >= 20,
          onSelect: reviewMode && row.candidate && !row.conflictIds.length ? checked => {
            setSelected(ids => checked ? [...ids, row.id] : ids.filter(id => id !== row.id));
            setGlobalConfirmed('');
          } : null,
        })),
        visible.length < rows.length ? h(W.Button, { className: css.more, onClick: () => setLimit(limit + LIST_PAGE_SIZE) }, t('显示更多经验')) : null),
      h('footer', { className: css.listFooter },
        h('span', null, t('显示') + ' ' + visible.length + ' / ' + rows.length),
        reviewMode ? h('span', { title: t('切换候选') }, h('kbd', null, 'J'), ' ', h('kbd', null, 'K')) : null)),
    h(ColumnDivider, { splitRef, listId, listRef, detailRef }),
    h('section', { className: css.inspector, ref: detailRef, 'aria-label': t('经验详情') },
      mobileDetail ? h(W.Button, { className: css.back, variant: 'ghost', icon: 'left', onClick: () => {
        mobileReturn.current = active.id;
        setActiveId(null);
      } }, t('返回列表')) : null,
      active && !error ? h(MemoryDetail, {
        key: active.id, row: active, base: revisions.get(active.id), privacy, reviewMode, onChanged, batchPending: pending,
        onExit: reviewMode ? action => animate([active.id], action) : null,
      }) : h(W.Empty, { title: t('选择一条经验') })));
}
