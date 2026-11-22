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
    className: css['redacted-token'], 'data-revealed': open, 'aria-expanded': open,
    onClick: () => setOpen(value => !value),
  }, '[' + t(open ? '掩码预览' : '已脱敏') + '·' + name + (open ? ' ••••••••]' : ']'));
}

function EvidenceText({ text }) {
  const parts = String(text || '').split(/\[已脱敏·([^\]\r\n]{1,80})\]/g);
  return parts.map((part, index) => index % 2 === 0 ? part : h(RedactionSlot, { key: index, type: part }));
}

function ReviewBlock({ index, title, children }) {
  return h('section', {
    className: css['verify-block'], 'data-dsh-card': '', style: { '--stagger-idx': index },
    ...spotlightHandlers,
  }, h('h3', { className: css['verify-head'] }, title), children);
}

function ScopeBadge({ row }) {
  return h(nativeUI().Tag, { tone: 'info', className: css.scopeBadge },
    h('span', { className: css.scopeCaption, title: row.scopeLabel }, row.projectId || row.scopeLabel));
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
    ['标题', 'title'], ['建议行动', 'action'], ['制定理由', 'rationale'], ['预期预防', 'prevents'],
    ['适用条件', 'when'], ['适用范围', 'scopeLabel'], ['关联文件', 'files'],
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

function reviewSignalReasonText(reason) {
  switch (reason) {
    case 'native-negative-feedback':
      return t('近期收到多次原生负反馈，建议人工复核此经验是否仍然适用（仅提示，不会自动修改状态）。');
    case 'repeated-not-applicable':
      return t('多次被标记为不适用，建议人工复核适用条件或补充例外（仅提示，不会自动修改状态）。');
    case 'negative-observation-trend':
      return t('负向观测与用户纠正高于正向反馈，建议人工复核（仅提示，不会自动修改状态）。');
    default:
      return t('实测观测提示此经验可能已偏离当前场景，建议人工复核（仅提示，不会自动修改状态）。');
  }
}

function LessonDiffDialog({ row, base, onClose }) {
  const [action, setAction] = useState(row.state === 'disputed' ? 'reject' : 'accept');
  const diffActionId = typeof useId === 'function' ? useId() : 'dream-diff-action';
  const state = action === 'accept' ? 'usable' : 'rejected';
  const before = base || row;
  const after = base ? row : { ...row, stateLabel: lessonStateLabel(state) };
  const diffs = lessonDiff(before, after);
  const title = base ? t('修订对比') : t('审阅变更预览');
  return h(W.Dialog, { title, onClose },
    h('div', { className: css.diffMeta },
      h('span', null, t('版本') + ' ' + before.revision + ' → ' + (base ? row.revision : t('确认审阅后'))),
      base ? null : h('label', { htmlFor: diffActionId }, t('审阅动作'), h('select', { id: diffActionId, value: action, onChange: event => setAction(event.target.value) },
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

function LessonEvidenceSection({ index, row }) {
  return h(ReviewBlock, { index, title: t('来源与证据') },
    row.evidence.length ? row.evidence.map(source => h('div', { key: source.id, className: css.evidence },
      h('blockquote', { className: css['evidence-quote'] }, h(EvidenceText, { text: source.summary || t('未提供摘要') })),
      h('details', null, h('summary', null, t('查看来源记录')),
        h('p', { className: css.muted }, (source.verification === 'read' ? t('已读到来源') : t('待核验')) + ' · ' + t(source.kind === 'session' ? '会话' : source.kind === 'user-correction' ? '用户纠正' : '本地资料')),
        source.sessionId ? h('p', { className: css.muted }, t('会话：') + source.sessionId + (source.recordSeq != null ? t(' · 记录 ') + source.recordSeq : '')) : null,
        source.model || source.provider || source.agentPreset ? h('p', { className: css.muted }, t('模型来源：') + [source.provider, source.model, source.agentPreset].filter(Boolean).join(' / ')) : null,
        h('p', { className: css.muted }, t('记录时间：') + formatDate(source.observedAt)),
        source.verificationReason ? h('p', { className: css.muted }, source.verificationReason === 'live-session-source-verified' ? t('已核对当前会话原文；不代表结论正确。') : source.verificationReason) : null,
        source.sourceHash ? h('code', { className: css.sourceHash }, t('来源校验值：') + source.sourceHash) : null))) : null,
    row.evidence.length ? h('details', { className: css.evidenceSummary },
      h('summary', null, t('证据摘要')),
      h('p', { className: css.muted }, h(EvidenceText, { text: row.evidenceSummary }))) :
      h('p', { className: css.muted }, t(row.state === 'usable' ? '未关联来源记录，使用前请核对依据。' : '没有关联来源记录，采纳前请核对依据。')));
}

function LessonScopeSection({ index, row, originFull }) {
  return h(ReviewBlock, { index, title: t('范围、条件与例外') },
    h('dl', { className: css.scopeFacts },
      h('dt', null, t('适用范围')), h('dd', null, row.scopeLabel),
      originFull ? h(React.Fragment, null, h('dt', null, t('模型来源')), h('dd', null, originFull)) : null,
      h('dt', null, t('适用条件')), h('dd', null, row.when || t('未标注适用条件')),
      Array.isArray(row.files) && row.files.length > 0 ? h(React.Fragment, null,
        h('dt', null, t('关联文件')),
        h('dd', { 'data-dream-files': '', className: css.actions },
          row.files.map(file => h('code', { key: file, className: css['dshd-chip'] }, file)))) : null,
      row.applicability ? h(React.Fragment, null, h('dt', null, t('适用环境')), h('dd', null, row.applicability)) : null,
      h('dt', null, t('例外与补充')), h('dd', null, row.exceptions.length ? row.exceptions.join(' · ') : t('未记录例外'))),
    h('p', { className: css.muted, title: row.lastTitle }, t('最近核验：') + row.lastText),
    row.lastRetrievedAt ? h('p', { className: css.muted, title: t('取回仅表示提供参考，不等于重新核验。') }, t('最近取回：') + formatDate(row.lastRetrievedAt) + ' ' + formatTime(row.lastRetrievedAt)) : null);
}

function MemoryDetail({ row, base, privacy, reviewMode, onChanged, onExit, batchPending, lessonTitles }) {
  const [peek, setPeek] = useState(false);
  const [diffOpen, setDiffOpen] = useState(false);
  const masked = privacy && !peek;
  const previous = base ? normalizeKnowledge({ lessons: [base] }, new Date(), 1).rows[0] : null;
  const canCompare = previous || (reviewMode && row.revision >= 1);
  const compareLabel = previous ? t('修订对比') : t('审阅变更预览');
  const sourcesRead = row.evidence.length > 0 && row.evidence.every(source => source.verification === 'read');
  const originLabel = row.origin?.model || row.origin?.provider || row.origin?.agentPreset || '';
  const originFull = row.origin ? [row.origin.provider, row.origin.model, row.origin.agentPreset].filter(Boolean).join(' / ') : '';
  const obs = row.observations && typeof row.observations === 'object' ? row.observations : null;
  const hasObservations = Boolean(obs && (obs.positive > 0 || obs.negative > 0 || obs.corrections > 0 || obs.repeatToolHits > 0));
  const evoSupersedes = Array.isArray(row.evolution?.supersedes) && row.evolution.supersedes.length
    ? row.evolution.supersedes : (Array.isArray(row.supersedes) ? row.supersedes : []);
  const evoSupersededBy = Array.isArray(row.evolution?.supersededBy) ? row.evolution.supersededBy : [];
  const evoRelated = Array.isArray(row.evolution?.relatedByProblemKey) ? row.evolution.relatedByProblemKey : [];
  const carriedFromParts = row.carriedFrom ? [
    row.carriedFrom.lessonId ? (lessonTitles?.get(row.carriedFrom.lessonId) || row.carriedFrom.lessonId) : '',
    row.carriedFrom.projectId || '',
    row.carriedFrom.workspaceRoot || '',
    row.carriedFrom.model || '',
  ].filter(Boolean) : [];
  const hasEvolution = Boolean(row.problemKey || evoSupersedes.length || evoSupersededBy.length || evoRelated.length || carriedFromParts.length);
  const labelForLessonId = id => lessonTitles?.get(id) || id;
  const toolbar = h('div', { className: css.meta },
    h(ScopeBadge, { row }),
    originLabel ? h(nativeUI().Tag, {
      tone: 'neutral',
      className: css.scopeBadge,
      'data-dream-origin-model': row.origin?.model || originLabel,
      title: t('模型来源：') + originFull,
    }, h('span', { className: css.scopeCaption }, originLabel)) : null,
    h('span', null, 'v' + row.revision),
    privacy ? h(W.Button, { variant: 'ghost', size: 'sm', onClick: () => setPeek(!peek), 'aria-pressed': peek },
      t(peek ? '重新模糊' : '临时查看内容')) : null);
  return h('article', { className: clsx(css.inspectorContent, masked && css.masked) },
    h(ReviewControls, { row, key: row.id + '@' + row.revision, shortcuts: reviewMode, masked, batchPending, onChanged, onExit, toolbar },
      h('div', { className: css['review-stepper'] },
        h('span', { className: clsx(css['step-chip'], sourcesRead && css.stepDone) },
          h(W.Icon, { name: sourcesRead ? 'check' : 'info', size: 13 }), t(sourcesRead ? '已读到来源' : '待核验')),
        h('span', { className: css['step-sep'], 'aria-hidden': true }, '→'),
        h('span', { className: css['step-chip'] }, t('适用范围')),
        h('span', { className: css['step-sep'], 'aria-hidden': true }, '→'),
        h(nativeUI().Tag, { tone: LESSON_TONES[row.state] }, row.stateLabel),
        canCompare ? h(W.Button, {
          icon: 'diff', size: 'sm', disabled: masked, onClick: () => setDiffOpen(true),
          'data-dream-command': 'diff', className: css.diffShortcut,
        }, compareLabel) : null),
      row.reviewSignal?.flagged === true ? h('div', {
        'data-dream-review-signal': row.reviewSignal.reason || 'flagged',
        style: {
          marginBlockEnd: '12px',
          borderRadius: 'var(--dream-row-radius, 8px)',
          border: '1px solid color-mix(in oklab, var(--dsw-alias-state-warn-primary, #b45309) 35%, transparent)',
          background: 'color-mix(in oklab, var(--dsw-alias-state-warn-primary, #b45309) 10%, transparent)',
          color: 'var(--dsw-alias-state-warn-label, var(--dream-ink))',
        },
      }, h(W.Status, { tone: 'warning' },
        h('span', null,
          h(nativeUI().Tag, { tone: 'warning', style: { marginInlineEnd: '6px' } }, t('建议复核')),
          reviewSignalReasonText(row.reviewSignal.reason),
          ' (+', String(row.reviewSignal.positiveScore || 0), ' / -', String(row.reviewSignal.negativeScore || 0), ')'))) : null,
      h('div', { className: css.privateText },
        h(ReviewBlock, { index: 0, title: t('建议行动') },
          h('h2', { tabIndex: -1, 'data-dream-detail-title': true, 'data-dsh-editorial-heading': '', 'data-dsh-serif': '', className: css.inspectorTitle }, row.title),
          h('p', null, row.action || t('未标注具体动作')),
          row.rationale ? h('p', { 'data-dream-rationale': '' },
            h('strong', { className: css.muted }, t('制定理由：')),
            h(EvidenceText, { text: row.rationale })) : null,
          row.prevents ? h('p', { 'data-dream-prevents': '' },
            h('strong', { className: css.muted }, t('预期预防：')),
            h(EvidenceText, { text: row.prevents })) : null),
        h(LessonEvidenceSection, { index: 1, row }),
        h(LessonScopeSection, { index: 2, row, originFull }),
        hasObservations ? h(ReviewBlock, { index: 3, title: t('原生反馈观测') },
          h('div', { 'data-dream-observations': '', className: css.actions },
            h(nativeUI().Tag, { tone: obs.negative > obs.positive ? 'warning' : 'neutral' }, '+' + String(obs.positive) + ' / -' + String(obs.negative)),
            obs.corrections > 0 ? h(nativeUI().Tag, { tone: 'warning' }, t('用户纠正') + ' ' + String(obs.corrections)) : null,
            obs.repeatToolHits > 0 ? h(nativeUI().Tag, { tone: 'warning' }, t('重复工具提醒') + ' ' + String(obs.repeatToolHits)) : null),
          obs.lastModel ? h('p', { className: css.muted }, t('最近观测模型：') + obs.lastModel) : null,
          obs.lastCategory ? h('p', { className: css.muted }, t('分类：') + obs.lastCategory) : null,
          obs.lastNote ? h('p', { className: css.muted }, t('备注：'), h(EvidenceText, { text: obs.lastNote })) : null,
          obs.lastAt > 0 ? h('p', { className: css.muted }, formatDate(new Date(obs.lastAt).toISOString()) + ' ' + formatTime(new Date(obs.lastAt).toISOString())) : null,
          h('p', { className: css.muted }, t('来自 DSH 原生消息赞踩、纠正与重复工具观测；仅作参考，不改变审阅状态。'))) : null,
        hasEvolution ? h(ReviewBlock, { index: hasObservations ? 4 : 3, title: t('演化与溯源') },
          h('dl', { className: css.scopeFacts, 'data-dream-evolution': '' },
            row.problemKey ? h(React.Fragment, null,
              h('dt', null, t('问题标识')),
              h('dd', null, h('code', { className: css['dshd-chip'] }, row.problemKey))) : null,
            evoSupersedes.length > 0 ? h(React.Fragment, null,
              h('dt', null, t('替代旧经验')),
              h('dd', { className: css.actions }, evoSupersedes.map(id => h(nativeUI().Tag, { key: id, tone: 'neutral', title: id }, labelForLessonId(id))))) : null,
            evoSupersededBy.length > 0 ? h(React.Fragment, null,
              h('dt', null, t('已被替代')),
              h('dd', { className: css.actions }, evoSupersededBy.map(id => h(nativeUI().Tag, { key: id, tone: 'warning', title: id }, labelForLessonId(id))))) : null,
            evoRelated.length > 0 ? h(React.Fragment, null,
              h('dt', null, t('同问题相关')),
              h('dd', { className: css.actions }, evoRelated.map(id => h(nativeUI().Tag, { key: id, tone: 'info', title: id }, labelForLessonId(id))))) : null,
            carriedFromParts.length > 0 ? h(React.Fragment, null,
              h('dt', null, t('迁移来源')),
              h('dd', null, carriedFromParts.join(' · '))) : null)) : null),
      row.holdReasonLabel ? h(W.Status, null, t('为什么被扣下：') + row.holdReasonLabel) : null),
    diffOpen && !masked ? h(LessonDiffDialog, { row, base: previous, onClose: () => setDiffOpen(false) }) : null);
}

function playRowExit(node, action) {
  if (!node?.isConnected) return Promise.resolve();
  if (node.ownerDocument?.defaultView?.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return Promise.resolve();
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
      if (event.target === node && /dshAdoptSweep|dshDiscardCollapse/.test(event.animationName)) done();
    }
    node.addEventListener('animationend', onEnd);
    node.addEventListener('animationcancel', onEnd);
  });
}

function CandidateRow({ row, index, active, selected, disabled, copied, quickBusy, onSelect, onOpen, onQuickAccept, onQuickCopy, onQuickInspect, privacy }) {
  return h('div', {
    className: clsx(css['cand-row'], privacy && css.maskedRow),
    'data-dream-row': row.id,
    'data-dsh-row': '',
    'data-selected': String(Boolean(active)),
    'data-active': String(Boolean(active)),
    style: { '--stagger-idx': Math.min(index, 12) },
    ...spotlightHandlers,
  },
  onSelect ? h('div', { className: css.batchCheckbox }, h(W.Checkbox, {
    checked: selected,
    disabled,
    hiddenLabel: true,
    label: privacy ? t('选中候选') : t('选中候选：') + row.title,
    onChange: onSelect,
  })) : null,
  h('button', { type: 'button', 'aria-pressed': active, onClick: onOpen, className: css.candidateButton },
    h('span', { className: css.candTitleLine },
      h('span', { className: 'dsh-pixel-cursor', 'aria-hidden': 'true' }, '▶'),
      h('span', { className: css['cand-title'], 'data-dsh-serif': '' }, row.title)),
    h('span', { className: css['cand-summary'] }, row.action || row.when),
    h('span', { className: css['cand-tags'] },
      h(ScopeBadge, { row }),
      h(nativeUI().Tag, { tone: LESSON_TONES[row.state] }, row.stateLabel))),
  h('div', { className: clsx('dsh-row-actions', css.rowActions) },
    onQuickAccept ? h(W.IconButton, {
      icon: 'check',
      size: 'sm',
      disabled: quickBusy,
      label: t('快速采纳'),
      'data-dream-quick-accept': row.id,
      onClick: onQuickAccept,
    }) : null,
    h(W.IconButton, {
      icon: copied ? 'check' : 'copy',
      size: 'sm',
      'data-copied': copied ? 'true' : undefined,
      'data-dream-quick-copy': row.id,
      label: copied ? t('已复制') : t('复制经验'),
      onClick: onQuickCopy,
    }),
    h(W.IconButton, {
      icon: 'right',
      size: 'sm',
      'data-dream-quick-inspect': row.id,
      label: t('审阅详情'),
      onClick: onQuickInspect,
    })));
}

const DECK_DRAG_COMMIT_PX = 90;
const DECK_INTERACTIVE_SELECTOR = 'button, a, input, select, textarea, summary, details, label, [role="button"], [role="checkbox"], [role="switch"], [role="tab"], [data-no-drag]';

function TriageViewToggle({ id, value, disabled, onChange, dataTour }) {
  return h('div', { className: css.triageViewToggle, 'data-dream-view-toggle': 'true', 'data-tour': dataTour || undefined },
    h(W.SegmentedControl, {
      id,
      label: t('待审阅视图'),
      value,
      disabled,
      className: css.triageViewSegmented,
      options: [
        { value: 'deck', label: t('叠卡') },
        { value: 'list', label: t('列表') },
      ],
      onChange,
    }));
}

function TriageDeckCard({
  row, base, depth, privacy, flipped, onFlip,
  dragOffset, exitAction, dragHandlers,
  busy, globalConfirmed, onGlobalConfirm, onDiff,
}) {
  const [peek, setPeek] = useState(false);
  const masked = privacy && !peek;
  const isActive = depth === 0;
  const previous = base ? normalizeKnowledge({ lessons: [base] }, new Date(), 1).rows[0] : null;
  const canCompare = Boolean(previous || row.revision >= 1);
  const sourcesRead = row.evidence.length > 0 && row.evidence.every(source => source.verification === 'read');
  const originLabel = row.origin?.model || row.origin?.provider || row.origin?.agentPreset || '';
  const originFull = row.origin ? [row.origin.provider, row.origin.model, row.origin.agentPreset].filter(Boolean).join(' / ') : '';
  const kindLabel = t(LESSON_KINDS[row.kind] ?? row.kind);
  const needsGlobalConfirmation = Boolean(row.isGlobal && !row.conflictIds.length);
  const dx = isActive ? (dragOffset?.dx || 0) : 0;
  const dy = isActive ? (dragOffset?.dy || 0) : 0;
  const isDragging = Boolean(isActive && dragOffset?.active);
  const absDx = Math.abs(dx);
  const adoptOpacity = isActive
    ? (exitAction === 'accept' ? 1 : dx > 12 ? Math.min(1, (dx - 12) / 68) : 0)
    : 0;
  const discardOpacity = isActive
    ? (exitAction === 'reject' ? 1 : dx < -12 ? Math.min(1, (-dx - 12) / 68) : 0)
    : 0;

  let cardStyle;
  if (!isActive) {
    const stackTransforms = [
      '',
      'translate3d(0, 12px, 0) scale(0.95) rotate(2.2deg)',
      'translate3d(0, 24px, 0) scale(0.90) rotate(-2.6deg)',
    ];
    cardStyle = {
      transform: stackTransforms[depth] || stackTransforms[2],
      opacity: depth === 1 ? 0.92 : 0.82,
      zIndex: 3 - depth,
    };
  } else if (exitAction) {
    const dir = exitAction === 'accept' ? 1 : -1;
    cardStyle = {
      transform: `translate3d(${dir * 420}px, 24px, 0) rotate(${dir * 18}deg)`,
      opacity: 0,
      zIndex: 3,
      transition: 'transform 220ms var(--dsh-ease-out), opacity 200ms ease',
    };
  } else if (isDragging) {
    const rot = Math.max(-14, Math.min(14, dx * 0.055));
    cardStyle = {
      transform: `translate3d(${dx}px, ${Math.min(18, absDx * 0.04)}px, 0) rotate(${rot}deg)`,
      zIndex: 3,
      transition: 'none',
    };
  } else {
    cardStyle = {
      transform: 'translate3d(0, 0, 0) rotate(0deg) scale(1)',
      zIndex: 3,
    };
  }

  if (!isActive) {
    return h('div', {
      className: clsx(css.deckCardShell, css.deckCardBackdrop),
      'data-deck-depth': String(depth),
      'aria-hidden': 'true',
      style: cardStyle,
    },
      h('div', { className: css.deckCardBackdropInner },
        h('div', { className: css.deckCardMeta },
          h(ScopeBadge, { row }),
          h(nativeUI().Tag, { tone: LESSON_TONES[row.state] }, row.stateLabel)),
        h('h3', { className: css.deckBackdropTitle, 'data-dsh-serif': '' }, row.title)));
  }

  const nextStateLabel = lessonStateLabel(row.state === 'disputed' ? 'rejected' : 'usable');
  return h('article', {
    className: clsx(css.deckCardShell, css.deckCardActive, masked && css.masked, isDragging && css.deckCardDragging),
    'data-dream-deck-card': row.id,
    'data-tour': 'dream-card',
    'data-deck-depth': '0',
    'data-flipped': String(Boolean(flipped)),
    'data-exit': exitAction || undefined,
    'data-dsh-card': '',
    style: cardStyle,
    onPointerDown: dragHandlers?.onPointerDown,
    onPointerMove: event => {
      if (event.currentTarget?.getBoundingClientRect && event.currentTarget?.style?.setProperty) followPointer(event);
      dragHandlers?.onPointerMove?.(event);
    },
    onPointerUp: dragHandlers?.onPointerUp,
    onPointerCancel: dragHandlers?.onPointerCancel,
    onPointerLeave: event => {
      if (event.currentTarget?.style?.removeProperty) clearSpotlight(event);
    },
  },
    h('div', {
      className: clsx(css.deckStamp, css.deckStampAdopt),
      'data-dream-stamp': 'accept',
      'aria-hidden': 'true',
      style: { opacity: adoptOpacity },
    }, t('✓ 采纳')),
    h('div', {
      className: clsx(css.deckStamp, css.deckStampDiscard),
      'data-dream-stamp': 'reject',
      'aria-hidden': 'true',
      style: { opacity: discardOpacity },
    }, t('× 丢弃')),
    h('div', { className: css.deckCardFlipper, 'data-flipped': String(Boolean(flipped)) },
      h('section', {
        className: clsx(css.deckCardFace, css.deckCardFront),
        'aria-hidden': flipped ? 'true' : undefined,
        hidden: undefined,
      },
        h('header', { className: css.deckCardHeader },
          h('div', { className: css.meta },
            h(ScopeBadge, { row }),
            h(nativeUI().Tag, { tone: 'neutral' }, kindLabel),
            originLabel ? h(nativeUI().Tag, {
              tone: 'neutral',
              className: css.scopeBadge,
              'data-dream-origin-model': row.origin?.model || originLabel,
              title: t('模型来源：') + originFull,
            }, h('span', { className: css.scopeCaption }, originLabel)) : null,
            h('span', null, 'v' + row.revision),
            h(nativeUI().Tag, { tone: LESSON_TONES[row.state] }, row.stateLabel),
            h('span', { className: clsx(css['step-chip'], sourcesRead && css.stepDone) },
              h(W.Icon, { name: sourcesRead ? 'check' : 'info', size: 13 }),
              t(sourcesRead ? '已读到来源' : '待核验'))),
          h('div', { className: css.deckCardHeaderActions },
            privacy ? h(W.Button, {
              variant: 'ghost', size: 'sm', onClick: () => setPeek(v => !v), 'aria-pressed': peek,
            }, t(peek ? '重新模糊' : '临时查看内容')) : null,
            h(W.Button, {
              size: 'sm',
              variant: flipped ? 'toolbar' : 'outline',
              disabled: busy,
              'data-dream-flip': 'true',
              'aria-keyshortcuts': 'Space',
              'aria-pressed': flipped,
              onClick: onFlip,
            }, t('↻ 翻面看证据')))),
        row.reviewSignal?.flagged === true ? h('div', {
          'data-dream-review-signal': row.reviewSignal.reason || 'flagged',
          className: css.deckSignalBanner,
        }, h(W.Status, { tone: 'warning' },
          h('span', null,
            h(nativeUI().Tag, { tone: 'warning', style: { marginInlineEnd: '6px' } }, t('建议复核')),
            reviewSignalReasonText(row.reviewSignal.reason),
            ' (+', String(row.reviewSignal.positiveScore || 0), ' / -', String(row.reviewSignal.negativeScore || 0), ')'))) : null,
        h('div', { className: clsx(css.deckCardBody, css.privateText) },
          h('h2', {
            tabIndex: -1,
            'data-dream-detail-title': true,
            'data-dsh-editorial-heading': '',
            'data-dsh-serif': '',
            className: css.deckTitle,
          }, h('span', { className: 'dsh-pixel-cursor', 'aria-hidden': 'true' }, '▶'), row.title),
          h('div', { className: css.deckActionBox },
            h('span', { className: css.deckSectionLabel }, t('建议行动')),
            h('p', { className: css.deckActionText }, row.action || t('未标注具体动作'))),
          row.rationale ? h('p', { className: css.deckMetaLine, 'data-dream-rationale': '' },
            h('strong', { className: css.muted }, t('制定理由：')),
            h(EvidenceText, { text: row.rationale })) : null,
          row.prevents ? h('p', { className: css.deckMetaLine, 'data-dream-prevents': '' },
            h('strong', { className: css.muted }, t('预期预防：')),
            h(EvidenceText, { text: row.prevents })) : null,
          h('div', { className: css.deckTeaserGrid },
            h('div', { className: css.deckTeaserCell },
              h('span', { className: css.deckSectionLabel }, t('适用条件')),
              h('span', { className: css.deckTeaserVal }, row.when || t('未标注适用条件'))),
            h('div', { className: css.deckTeaserCell },
              h('span', { className: css.deckSectionLabel }, t('来源与证据')),
              h('span', { className: css.deckTeaserVal }, t('来源记录数：') + String(row.evidence.length) + ' · ' + row.evidenceSummary)))),
        needsGlobalConfirmation ? h('div', { className: css.deckGlobalConfirm },
          h(W.Checkbox, {
            checked: globalConfirmed,
            disabled: busy,
            className: clsx(css.checkLabel, css['dshd-note']),
            label: t('全局经验会用于所有项目；我已核对并同意。'),
            onChange: checked => onGlobalConfirm?.(Boolean(checked)),
          })) : null,
        row.holdReasonLabel ? h(W.Status, null, t('为什么被扣下：') + row.holdReasonLabel) : null,
        h('footer', { className: css.deckCardHint }, t('右拖采纳 · 左拖丢弃 · 空格翻面'))),
      h('section', {
        className: clsx(css.deckCardFace, css.deckCardBack),
        'aria-hidden': !flipped ? 'true' : undefined,
      },
        h('header', { className: css.deckCardHeader },
          h('div', { className: css.meta },
            h(ScopeBadge, { row }),
            h('strong', { className: css.deckBackTitle, 'data-dsh-serif': '' }, row.title)),
          h('div', { className: css.deckCardHeaderActions },
            canCompare ? h(W.Button, {
              icon: 'diff', size: 'sm', disabled: masked || busy, onClick: onDiff,
              'data-dream-command': 'diff',
            }, previous ? t('修订对比') : t('审阅变更预览')) : null,
            h(W.Button, {
              size: 'sm', variant: 'outline', disabled: busy,
              'data-dream-flip-back': 'true',
              onClick: onFlip,
            }, t('↻ 翻回正面')))),
        h('div', { className: clsx(css.deckBackScroll, css.privateText) },
          h(LessonEvidenceSection, { index: 0, row }),
          h(LessonScopeSection, { index: 1, row, originFull }),
          h(ReviewBlock, { index: 2, title: t('审阅变更预览') },
            h('p', { className: css.muted }, t('审阅状态变更预览：') + row.stateLabel + ' → ' + nextStateLabel),
            h('p', { className: css.muted }, t('适用范围') + '：' + row.scopeLabel + ' · v' + String(row.revision)))))));
}

function MemoryBoard({ vm, revisions, reviewMode, error, loading, privacy, onChanged, onRetry, moveRef, automation, onNavigateTab }) {
  const [viewMode, setViewMode] = useState('deck');
  const [search, setSearch] = useState('');
  const [group, setGroup] = useState('');
  const [history, setHistory] = useState(false);
  const [activeId, setActiveId] = useState(null);
  const [selected, setSelected] = useState([]);
  const [limit, setLimit] = useState(LIST_PAGE_SIZE);
  const [pending, setPending] = useState(false);
  const [quickBusyId, setQuickBusyId] = useState('');
  const [copiedRowId, setCopiedRowId] = useState('');
  const [failure, setFailure] = useState('');
  const [retry, setRetry] = useState(null);
  const [globalConfirmed, setGlobalConfirmed] = useState('');
  const [flippedKey, setFlippedKey] = useState('');
  const [deckDrag, setDeckDrag] = useState({ key: '', active: false, dx: 0, dy: 0 });
  const [deckExit, setDeckExit] = useState({ key: '', action: '' });
  const [deckGlobalKey, setDeckGlobalKey] = useState('');
  const [expandedRow, setExpandedRow] = useState(null);
  const [deckDiffRow, setDeckDiffRow] = useState(null);
  const [peakHeld, setPeakHeld] = useState(0);
  const batchLock = useRef(false);
  const deckActionLock = useRef(false);
  const dragRef = useRef(null);
  const copyTimerRef = useRef(null);
  const splitRef = useRef(null);
  const deckStageRef = useRef(null);
  const listRef = useRef(null);
  const detailRef = useRef(null);
  const focusNext = useRef(false);
  const mobileReturn = useRef(null);
  const listId = typeof useId === 'function' ? useId() : 'dream-list';
  const split = useResizableSplit(React, {
    key: 'dsh-dream:split-width',
    initial: 340,
    min: LIST_MIN_WIDTH,
    max: LIST_MAX_WIDTH,
  });
  useEffect(() => () => {
    if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
  }, []);
  // Update protection for a batch in flight.
  __stardustUpdatesGuard(React, "dsh-dream.memory-board", { busy: pending || Boolean(quickBusyId) });

  const all = vm.rows.filter(row => reviewMode ? HELD_STATES.includes(row.state) : row.state === (history ? 'rejected' : 'usable'));
  const groups = new Map();
  for (const row of all) {
    const option = groups.get(row.groupKey);
    if (option) option.count++;
    else {
      const kind = t(LESSON_KINDS[row.kind] ?? row.kind);
      groups.set(row.groupKey, {
        label: row.scopeLabel + ' · ' + kind,
        shortLabel: (row.projectId || row.scopeLabel) + ' · ' + kind,
        count: 1,
      });
    }
  }
  const groupFilter = groups.has(group) ? group : '';
  const needle = search.trim().toLocaleLowerCase();
  const lessonTitles = new Map(vm.rows.map(item => [item.id, item.title]));
  const rows = all.filter(row => (!groupFilter || row.groupKey === groupFilter) &&
    (!needle || [row.title, row.when, row.action, row.scopeLabel, row.rationale, row.problemKey, row.origin?.model, ...(row.files || [])].filter(Boolean).join(' ').toLocaleLowerCase().includes(needle)));
  const visible = rows.slice(0, limit);
  const active = rows.find(row => row.id === activeId) || visible[0];
  const picked = rows.filter(row => selected.includes(row.id) && row.candidate && !row.conflictIds.length);
  const globalSelection = picked.filter(row => row.isGlobal).map(row => row.id + '@' + row.revision).join(',');
  const confirmed = globalSelection !== '' && globalSelection === globalConfirmed;
  const sameGroup = new Set(picked.map(row => row.groupKey)).size <= 1;
  const mobileDetail = activeId !== null && active !== undefined;
  const isDeckMode = Boolean(reviewMode && viewMode === 'deck');
  const activeKey = active ? active.id + '@' + active.revision : '';
  const flipped = Boolean(activeKey && flippedKey === activeKey);
  const deckGlobalConfirmed = Boolean(activeKey && deckGlobalKey === activeKey);
  const activeDeckDrag = deckDrag.key === activeKey ? deckDrag : { active: false, dx: 0, dy: 0 };
  const activeDeckExit = deckExit.key === activeKey ? deckExit.action : '';

  useEffect(() => {
    if (reviewMode && all.length > peakHeld) setPeakHeld(all.length);
  }, [reviewMode, all.length, peakHeld]);

  function rowNode(id) {
    return Array.from(listRef.current?.querySelectorAll?.('[data-dream-row]') || []).find(node => node.dataset.dreamRow === id);
  }
  function select(row, focus = true) {
    focusNext.current = focus;
    setActiveId(row.id);
  }
  useLayoutEffect(() => {
    if (!focusNext.current) return;
    focusNext.current = false;
    if (isDeckMode) {
      const target = deckStageRef.current?.querySelector?.('[data-dream-detail-title]')
        || deckStageRef.current?.querySelector?.('[data-dream-inbox-zero] button');
      target?.focus?.({ preventScroll: true });
      return;
    }
    if (detailRef.current?.getClientRects?.().length && !listRef.current?.getClientRects?.().length) {
      if (splitRef.current?.parentElement) splitRef.current.parentElement.scrollTop = 0;
      detailRef.current.querySelector?.('[data-dream-detail-title]')?.focus({ preventScroll: true });
    } else if (active) {
      const node = rowNode(active.id);
      node?.querySelector?.('button')?.focus({ preventScroll: true });
      node?.scrollIntoView?.({ block: 'nearest' });
    }
  }, [activeId, active?.id, limit, viewMode, isDeckMode]);
  useLayoutEffect(() => {
    if (activeId === null && mobileReturn.current) {
      const node = rowNode(mobileReturn.current);
      mobileReturn.current = null;
      (node?.querySelector?.('button') || listRef.current?.querySelector?.('input[type="search"]'))?.focus({ preventScroll: true });
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
      else if (!isDeckMode) rowNode(rows[next].id)?.scrollIntoView?.({ block: 'nearest' });
      return true;
    };
    return () => { moveRef.current = null; };
  });

  async function animate(ids, action) {
    const nodes = ids.map(rowNode);
    const focus = splitRef.current?.ownerDocument?.activeElement;
    if (active && ids.includes(active.id) && (detailRef.current?.contains?.(focus) || nodes.some(node => node?.contains?.(focus)))) {
      focusNext.current = true;
    }
    await Promise.all(nodes.map(node => playRowExit(node, action)));
  }
  async function batch(action) {
    if (batchLock.current || !picked.length || !sameGroup || action === 'accept' && globalSelection && !confirmed) return;
    const items = picked.map(row => ({ lessonId: row.id, expectedRevision: row.revision }));
    const signature = JSON.stringify({ action, items });
    const requestId = retry?.signature === signature ? retry.id : (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : 'batch_' + Date.now());
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
  function switchViewMode(nextMode) {
    if (nextMode === viewMode) return;
    focusNext.current = true;
    setFailure('');
    const hostNode = splitRef.current?.closest?.('[data-dsh-style]') || splitRef.current;
    runViewTransition(hostNode, () => setViewMode(nextMode));
  }

  async function quickCopy(row) {
    const text = [row.title, row.action || row.when].filter(Boolean).join('\n');
    const ok = await copyText(text) || legacyExecCopy(text);
    if (ok) {
      setCopiedRowId(row.id);
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
      copyTimerRef.current = setTimeout(() => setCopiedRowId(''), 1600);
    }
  }

  async function quickAccept(row) {
    if (batchLock.current || quickBusyId || !row.candidate || row.isGlobal || row.conflictIds.length || row.revision < 1) return;
    setQuickBusyId(row.id);
    setFailure('');
    try {
      await postAction({ operation: 'review', action: 'accept', lessonId: row.id, expectedRevision: row.revision });
      await animate([row.id], 'accept');
      onChanged(t('已更新「') + row.title + t('」的审阅状态。'));
    } catch (err) {
      setFailure(displayError(err));
    } finally {
      setQuickBusyId('');
    }
  }

  function quickInspect(row) {
    select(row, false);
    if (typeof requestAnimationFrame === 'function') {
      requestAnimationFrame(() => {
        detailRef.current?.querySelector?.('[data-dream-detail-title]')?.focus?.({ preventScroll: true });
      });
    }
  }

  function canDeckAccept(row) {
    return Boolean(row && row.candidate && !row.conflictIds.length && row.revision >= 1 && (!row.isGlobal || deckGlobalConfirmed));
  }

  async function triggerDeckReview(action, row = active) {
    if (deckActionLock.current || batchLock.current || pending || !row || row.revision < 1) return;
    if (action === 'accept') {
      if (row.conflictIds.length) {
        setFailure(t('有冲突的经验请点「展开完整详情」处理冲突。'));
        return;
      }
      if (row.isGlobal && !deckGlobalConfirmed) {
        setFailure(t('请先勾选全局确认，再采纳全局经验。'));
        return;
      }
      if (!row.candidate) {
        setExpandedRow(row);
        return;
      }
    }
    deckActionLock.current = true;
    setPending(true);
    setFailure('');
    const rowKey = row.id + '@' + row.revision;
    setDeckDrag({ key: '', active: false, dx: 0, dy: 0 });
    setDeckExit({ key: rowKey, action });
    const reduced = Boolean(deckStageRef.current?.ownerDocument?.defaultView?.matchMedia?.('(prefers-reduced-motion: reduce)').matches);
    try {
      await postAction({
        operation: 'review',
        action,
        lessonId: row.id,
        expectedRevision: row.revision,
        confirmGlobal: row.isGlobal ? deckGlobalConfirmed : false,
      });
      if (!reduced) await new Promise(resolve => setTimeout(resolve, 180));
      focusNext.current = true;
      setDeckExit({ key: '', action: '' });
      onChanged(t('已更新「') + row.title + t('」的审阅状态。'));
    } catch (err) {
      setDeckExit({ key: '', action: '' });
      setFailure(displayError(err));
    } finally {
      deckActionLock.current = false;
      setPending(false);
    }
  }

  function handleDeckFlip() {
    if (!activeKey) return;
    setFlippedKey(prev => {
      const next = prev === activeKey ? '' : activeKey;
      if (typeof requestAnimationFrame === 'function') {
        requestAnimationFrame(() => {
          const sel = next ? '[data-dream-flip-back]' : '[data-dream-flip]';
          deckStageRef.current?.querySelector?.(sel)?.focus?.({ preventScroll: true });
        });
      }
      return next;
    });
  }

  const activeDragHandlers = {
    onPointerDown: event => {
      if (pending || deckActionLock.current || activeDeckExit || (event.button !== undefined && event.button > 0)) return;
      if (event.target?.closest?.(DECK_INTERACTIVE_SELECTOR)) return;
      try { event.currentTarget?.setPointerCapture?.(event.pointerId); } catch {}
      dragRef.current = {
        key: activeKey,
        pointerId: event.pointerId,
        startX: event.clientX ?? 0,
        startY: event.clientY ?? 0,
        locked: false,
        cancelled: false,
      };
    },
    onPointerMove: event => {
      const state = dragRef.current;
      if (!state || state.pointerId !== event.pointerId || state.cancelled || state.key !== activeKey) return;
      const dx = (event.clientX ?? 0) - state.startX;
      const dy = (event.clientY ?? 0) - state.startY;
      if (!state.locked) {
        if (Math.abs(dy) > 12 && Math.abs(dy) > Math.abs(dx) * 1.25) {
          state.cancelled = true;
          setDeckDrag({ key: '', active: false, dx: 0, dy: 0 });
          return;
        }
        if (Math.abs(dx) >= 4) state.locked = true;
      }
      if (state.locked || Math.abs(dx) >= 4) {
        setDeckDrag({ key: activeKey, active: true, dx, dy });
      }
    },
    onPointerUp: event => {
      const state = dragRef.current;
      if (!state || state.pointerId !== event.pointerId) return;
      const dx = (event.clientX ?? 0) - state.startX;
      const cancelled = state.cancelled || state.key !== activeKey;
      dragRef.current = null;
      try { event.currentTarget?.releasePointerCapture?.(event.pointerId); } catch {}
      if (cancelled) {
        setDeckDrag({ key: '', active: false, dx: 0, dy: 0 });
        return;
      }
      if (dx >= DECK_DRAG_COMMIT_PX) {
        if (canDeckAccept(active)) {
          void triggerDeckReview('accept', active);
        } else {
          setDeckDrag({ key: '', active: false, dx: 0, dy: 0 });
          setFailure(active?.conflictIds?.length
            ? t('有冲突的经验请点「展开完整详情」处理冲突。')
            : active?.isGlobal && !deckGlobalConfirmed
              ? t('请先勾选全局确认，再采纳全局经验。')
              : t('请先核验或展开完整详情处理。'));
        }
      } else if (dx <= -DECK_DRAG_COMMIT_PX) {
        if (active && active.revision >= 1) void triggerDeckReview('reject', active);
        else setDeckDrag({ key: '', active: false, dx: 0, dy: 0 });
      } else {
        setDeckDrag({ key: '', active: false, dx: 0, dy: 0 });
      }
    },
    onPointerCancel: event => {
      const state = dragRef.current;
      if (!state || state.pointerId !== event.pointerId) return;
      dragRef.current = null;
      try { event.currentTarget?.releasePointerCapture?.(event.pointerId); } catch {}
      setDeckDrag({ key: '', active: false, dx: 0, dy: 0 });
    },
  };

  if (isDeckMode) {
    const totalCount = Math.max(peakHeld, all.length);
    const doneCount = Math.max(0, totalCount - all.length);
    const progressRatio = totalCount === 0 ? 1 : Math.min(1, Math.max(0, doneCount / totalCount));
    const activeIndex = active ? Math.max(0, rows.findIndex(item => item.id === active.id)) : 0;
    const stackCount = Math.min(3, rows.length);
    const stackItems = rows.length
      ? Array.from({ length: stackCount }, (_, depth) => ({
          row: rows[(activeIndex + depth) % rows.length],
          depth,
        }))
      : [];

    const deckEmpty = error ? h(W.Empty, { title: t('暂时读不到经验'), action: h(W.Button, { icon: 'refresh', onClick: onRetry, disabled: loading }, t('重试')) }, displayError(error))
      : loading && !all.length ? h('div', { className: css.deckSkeletonCard, role: 'status', 'aria-busy': 'true', 'aria-label': t('加载中…') },
        h(W.Skeleton, { variant: 'card' }),
        h(W.Skeleton, { variant: 'text', lines: 3 }))
      : !rows.length ? (all.length
        ? h('div', { className: css.inboxZeroCard, 'data-dsh-card': '' },
            h(W.Empty, {
              title: t('没有匹配的经验'),
              action: h(W.Button, { icon: 'close', onClick: () => { setSearch(''); changeGroup(''); } }, t('清空筛选')),
            }))
        : h('section', { className: css.inboxZeroCard, 'data-dream-inbox-zero': 'true', 'data-dsh-card': '', ...spotlightHandlers },
            h('div', { className: css.inboxZeroCrest, 'aria-hidden': 'true' },
              h(W.Icon, { name: 'sparkle', size: 22 })),
            h('span', { className: css.inboxZeroBadge }, t('Inbox Zero · 待审阅队列已清空')),
            h('h2', { className: css.inboxZeroTitle, 'data-dsh-serif': '' }, t('没有待审阅的经验')),
            h('p', { className: css.muted }, t('完成实际任务后，开启「自动整理」或在对话里让助手复盘，提炼出的候选经验会先进入这里等你核对证据与范围。')),
            h('div', { className: css.emptyStack },
              h('div', { className: css.emptyPrompts },
                onNavigateTab ? h(W.Button, { icon: 'book', variant: 'primary', size: 'sm', onClick: () => onNavigateTab('knowledge') }, t('查看已采纳')) : null,
                h(W.Button, {
                  icon: 'sparkle', size: 'sm', spinning: Boolean(automation.value?.running),
                  disabled: !automation.canFlush,
                  onClick: () => automation.change({ operation: 'automatic-flush' }),
                }, t('立即整理')),
                onNavigateTab ? h(W.Button, { icon: 'settings', size: 'sm', onClick: () => onNavigateTab('settings') }, t('前往设置')) : null),
              h('div', { className: css.emptyPrompts },
                h(W.CopyPrompt, { variant: 'outline', prompt: t('复盘最近的对话并提炼可复用的项目经验'), label: t('复制复盘提炼指令') }),
                h(W.CopyPrompt, { prompt: t('做个梦'), label: t('复制「做个梦」') })))))
      : null;

    return h('div', {
      className: css.triageDesk,
      ref: splitRef,
      'data-dream-triage-deck': 'true',
      'data-dream-view-mode': 'deck',
    },
      h('header', { className: css.triageRibbon, 'data-dream-progress-ribbon': 'true' },
        h('div', { className: css.triageRibbonMain },
          h('div', { className: css.triageRibbonLead, 'data-tour': 'dream-ribbon' },
            h(TriageViewToggle, { id: listId + '-view-mode', value: viewMode, disabled: pending, onChange: switchViewMode }),
            h('div', { className: css.triageProgressWrap },
              h('span', { className: css.triageProgressLabel },
                t('待分拣') + ' ', h('strong', null, String(all.length)), ' / ' + t('总计') + ' ' + String(totalCount)),
              h('div', {
                className: css.triageProgressTrack,
                role: 'progressbar',
                'aria-valuemin': 0,
                'aria-valuemax': Math.max(1, totalCount),
                'aria-valuenow': doneCount,
                'aria-label': t('待分拣') + ' ' + String(all.length) + ' / ' + String(totalCount),
              }, h('span', {
                className: css.triageProgressFill,
                style: { transform: 'scaleX(' + progressRatio.toFixed(4) + ')' },
              })))),
          h('div', { className: css.triageRibbonTools },
            h(W.Search, {
              type: 'search', label: t('搜索经验'), value: search, disabled: pending, className: css.triageSearch,
              onChange: event => { setSearch(event.target.value); setLimit(LIST_PAGE_SIZE); setActiveId(null); },
            }),
            h(W.IconButton, { icon: 'refresh', spinning: Boolean(loading || pending), label: t('刷新'), onClick: onRetry, disabled: loading || pending }),
            h('div', { className: css.triageAutoInline, 'data-tour': 'dream-auto' },
              h(AutomaticSwitches, { automation })))),
        h('div', { className: css.triageFilterBar, role: 'group', 'aria-label': t('项目与主题') },
          [['', { label: t('全部项目与主题'), shortLabel: t('全部'), count: all.length }], ...groups].map(([key, { label, shortLabel, count }]) =>
            h(nativeUI().Pill, {
              key: key || 'all',
              className: css.triageFilterPill,
              active: groupFilter === key,
              'aria-pressed': groupFilter === key,
              title: label,
              disabled: pending,
              onClick: () => changeGroup(key),
            }, (shortLabel || label) + ' (' + count + ')')))),
      failure ? h('div', { className: css.triageAlert },
        h(W.Status, { tone: 'error' }, failure)) : null,
      automation.failure ? h('div', { className: css.triageAlert },
        h(W.Status, { tone: 'error' }, displayError(automation.failure))) : null,
      h('div', { className: css.deckStage, ref: deckStageRef, 'data-tour': 'dream-list' },
        deckEmpty || h('div', { className: css.deckStack },
          stackItems.slice().reverse().map(({ row, depth }) => h(TriageDeckCard, {
            key: row.id + '@' + row.revision + ':' + depth,
            row,
            base: revisions.get(row.id),
            depth,
            privacy,
            flipped: depth === 0 ? flipped : false,
            onFlip: handleDeckFlip,
            dragOffset: depth === 0 ? activeDeckDrag : null,
            exitAction: depth === 0 ? activeDeckExit : '',
            dragHandlers: depth === 0 ? activeDragHandlers : {},
            busy: pending,
            globalConfirmed: deckGlobalConfirmed,
            onGlobalConfirm: checked => setDeckGlobalKey(checked ? activeKey : ''),
            onDiff: () => setDeckDiffRow(row),
          })))),
      rows.length && active && !error ? h('div', { className: css.deckDockWrap },
        h('div', { className: css.deckDock, 'data-dream-action-dock': 'true', 'data-tour': 'dream-dock', role: 'toolbar', 'aria-label': active.title + t('的操作') },
          h(W.Button, {
            size: 'sm',
            icon: 'trash',
            className: css.danger,
            disabled: pending || active.revision < 1,
            'data-dream-command': 'reject',
            'aria-keyshortcuts': 'D',
            onClick: () => { void triggerDeckReview('reject', active); },
          }, t('← 丢弃 (D)')),
          h(W.Button, {
            size: 'sm',
            variant: flipped ? 'toolbar' : 'outline',
            disabled: pending,
            'data-dream-command': 'flip',
            'aria-keyshortcuts': 'Space',
            'aria-pressed': flipped,
            onClick: handleDeckFlip,
          }, t('↻ 翻面 (Space)')),
          h('div', { className: css.deckNavCluster },
            h(W.Button, {
              size: 'sm',
              icon: 'left',
              variant: 'ghost',
              disabled: pending || rows.length <= 1,
              'data-dream-command': 'prev',
              'aria-keyshortcuts': 'K',
              onClick: () => { focusNext.current = true; moveRef?.current?.(-1); },
            }, t('上一张')),
            h('span', { className: css.deckCounter }, String(activeIndex + 1) + ' / ' + String(rows.length)),
            h(W.Button, {
              size: 'sm',
              icon: 'right',
              variant: 'ghost',
              disabled: pending || rows.length <= 1,
              'data-dream-command': 'next',
              'aria-keyshortcuts': 'J',
              onClick: () => { focusNext.current = true; moveRef?.current?.(1); },
            }, t('下一张'))),
          h(W.Button, {
            size: 'sm',
            variant: 'primary',
            icon: 'check',
            disabled: pending || !canDeckAccept(active),
            'data-dream-command': 'accept',
            'aria-keyshortcuts': 'A',
            onClick: () => { void triggerDeckReview('accept', active); },
          }, t('确认采纳 (A)')),
          h(W.Button, {
            size: 'sm',
            variant: 'ghost',
            disabled: pending,
            'data-dream-command': 'expand',
            onClick: () => setExpandedRow(active),
          }, t('展开完整详情')))) : null,
      expandedRow ? h(W.Dialog, {
        title: expandedRow.title,
        onClose: () => setExpandedRow(null),
      }, h(MemoryDetail, {
        key: expandedRow.id + '@' + expandedRow.revision,
        row: expandedRow,
        base: revisions.get(expandedRow.id),
        privacy,
        reviewMode,
        batchPending: pending,
        lessonTitles,
        onChanged: msg => {
          setExpandedRow(null);
          focusNext.current = true;
          onChanged(msg);
        },
        onExit: null,
      })) : null,
      deckDiffRow ? h(LessonDiffDialog, {
        row: deckDiffRow,
        base: revisions.get(deckDiffRow.id) ? normalizeKnowledge({ lessons: [revisions.get(deckDiffRow.id)] }, new Date(), 1).rows[0] : null,
        onClose: () => setDeckDiffRow(null),
      }) : null);
  }

  const scopeItems = [
    { id: '', label: t('全部项目与主题') },
    ...Array.from(groups, ([key, { label }]) => ({ id: key, label })),
  ];
  const scopePicker = h('div', { className: css.scopePicker },
    h('span', null, t('项目与主题')),
    h(W.ChoiceMenu, {
      id: listId + '-scope',
      label: t('项目与主题'),
      value: groupFilter,
      disabled: pending,
      items: scopeItems,
      onChange: changeGroup,
    }));
  const listEmpty = error ? h(W.Empty, { title: t('暂时读不到经验'), action: h(W.Button, { icon: 'refresh', onClick: onRetry, disabled: loading }, t('重试')) }, displayError(error))
    : loading && !all.length ? h('div', { className: css.skeletonWrap, role: 'status', 'aria-busy': 'true', 'aria-label': t('加载中…') },
      [0, 1, 2, 3].map(idx => h(W.Skeleton, { key: idx, variant: 'row' })))
    : !rows.length ? (all.length
      ? h(W.Empty, {
          title: t('没有匹配的经验'),
          action: h(W.Button, { icon: 'close', onClick: () => { setSearch(''); changeGroup(''); } }, t('清空筛选')),
        })
      : reviewMode
        ? h(W.Empty, {
            icon: 'sparkle',
            title: t('没有待审阅的经验'),
            action: h('div', { className: css.emptyStack },
              h('div', { className: css.emptyPrompts },
                h(W.CopyPrompt, { variant: 'primary', prompt: t('复盘最近的对话并提炼可复用的项目经验'), label: t('复制复盘提炼指令') }),
                h(W.CopyPrompt, { prompt: t('做个梦'), label: t('复制「做个梦」') })),
              onNavigateTab ? h('div', { className: css.emptyPrompts },
                h(W.Button, { icon: 'settings', size: 'sm', onClick: () => onNavigateTab('settings') }, t('前往设置')),
                h(W.Button, { icon: 'book', size: 'sm', onClick: () => onNavigateTab('knowledge') }, t('查看已采纳'))) : null),
          }, t('完成实际任务后，开启「自动整理」或在对话里让助手复盘，提炼出的候选经验会先进入这里等你核对证据与范围。'))
        : h(W.Empty, {
            title: t(history ? '没有已驳回记录。' : '还没有已采纳的经验'),
            action: !history && onNavigateTab ? h(W.Button, { icon: 'sparkle', size: 'sm', onClick: () => onNavigateTab('review') }, t('查看待审阅')) : null,
          }, !history ? t('已采纳的经验会在后续相关任务中自动作为参考取回，也可预览写入项目 AGENTS.md。') : null))
    : null;

  return h('div', {
    className: css['workbench-grid'],
    ref: splitRef,
    'data-review': String(Boolean(reviewMode)),
    'data-dream-view-mode': reviewMode ? 'list' : undefined,
    'data-detail': String(Boolean(mobileDetail)),
    style: { ...split.paneStyle, '--list-width': split.size + 'px' },
  },
    reviewMode ? h('aside', { className: css['pane-rail'], 'aria-label': t('审阅筛选与自动记忆') },
      h('div', { className: css['rail-scroll'] },
        h('section', { className: css['control-card'], 'data-dsh-card': '', 'data-tour': 'dream-auto', ...spotlightHandlers },
          h(AutomaticSwitches, { automation }),
          h('p', { className: css.muted }, t('候选经验由你确认采纳。')),
          h(W.Status, { tone: 'error' }, automation.failure ? displayError(automation.failure) : null)),
        h('div', { className: css.scopeFilters, role: 'group', 'aria-label': t('项目与主题') },
          h('h2', { className: css['section-head'] }, t('项目与主题')),
          [['', { label: t('全部项目与主题'), count: all.length }], ...groups].map(([key, { label, shortLabel, count }]) =>
            h(W.Button, {
              key, variant: 'ghost', size: 'sm', disabled: pending, className: css['nav-item'],
              'aria-pressed': groupFilter === key, title: label, onClick: () => changeGroup(key),
            }, h('span', { className: css.scopeCaption }, shortLabel || label),
            h('span', { className: css['count-pill'] }, count)))),
        h('div', { className: css.mobileScope }, scopePicker)),
      h('footer', { className: css['rail-footer'] },
        h('span', null, h('kbd', null, 'J'), '/', h('kbd', null, 'K'), ' ', t('切换候选')),
        h('span', null, h('kbd', null, 'A'), ' ', t('确认采纳')),
        h('span', null, h('kbd', null, 'D'), ' ', t('丢弃')))) : null,
    h('section', { className: css['pane-list'], ref: listRef, id: listId, 'data-tour': 'dream-list', 'aria-label': t(reviewMode ? '候选经验' : '已采纳') },
      h('div', { className: css['list-toolbar'] },
        reviewMode ? h(TriageViewToggle, { id: listId + '-view-mode', value: viewMode, disabled: pending, onChange: switchViewMode, dataTour: 'dream-ribbon' }) : null,
        h(W.Search, {
          type: 'search', label: t('搜索经验'), value: search, disabled: pending,
          onChange: event => { setSearch(event.target.value); setLimit(LIST_PAGE_SIZE); setActiveId(null); },
        }),
        h(W.IconButton, { icon: 'refresh', spinning: Boolean(loading || pending), label: t('刷新'), onClick: onRetry, disabled: loading || pending })),
      !reviewMode ? h('div', { className: css.acceptedFilters },
        h(W.SegmentedControl, {
          id: listId + '-history',
          label: t('经验状态'),
          value: history ? 'rejected' : 'usable',
          options: [
            { value: 'usable', label: t('可用经验') },
            { value: 'rejected', label: t('已驳回历史') },
          ],
          onChange: val => { setHistory(val === 'rejected'); setSearch(''); changeGroup(''); },
        }),
        scopePicker) : null,
      picked.length ? h('div', { className: css.batch },
        h('p', { className: css.muted }, t('已选') + ' ' + picked.length + ' / 20'),
        globalSelection ? h(W.Checkbox, {
          checked: confirmed,
          disabled: pending,
          className: css.checkLabel,
          label: t('全局经验会用于所有项目；我已核对并同意。'),
          onChange: checked => setGlobalConfirmed(checked ? globalSelection : ''),
        }) : null,
        !sameGroup ? h('p', { className: css.muted }, t('请只选择同范围、同主题的候选。')) : null,
        h('div', { className: css.actions },
          h(W.Button, { icon: 'check', variant: 'primary', disabled: pending || !sameGroup || !!globalSelection && !confirmed, onClick: () => batch('accept') }, t('批量采纳')),
          h(W.Button, { icon: 'trash', variant: 'danger', disabled: pending || !sameGroup, onClick: () => batch('reject') }, t('批量驳回'))),
        h(W.Status, { tone: 'error' }, failure)) : null,
      h('div', { className: css['candidate-scroll'], 'aria-busy': loading || pending }, listEmpty ||
        visible.map((row, index) => h(CandidateRow, {
          key: row.id, row, index, active: row.id === active?.id, selected: selected.includes(row.id), privacy,
          copied: copiedRowId === row.id,
          quickBusy: quickBusyId === row.id || pending,
          onOpen: () => select(row),
          onQuickCopy: () => quickCopy(row),
          onQuickInspect: () => quickInspect(row),
          onQuickAccept: reviewMode && row.candidate && !row.isGlobal && !row.conflictIds.length && row.revision >= 1
            ? () => quickAccept(row) : null,
          disabled: pending || !selected.includes(row.id) && selected.length >= 20,
          onSelect: reviewMode && row.candidate && !row.conflictIds.length ? checked => {
            setSelected(ids => checked ? [...ids, row.id] : ids.filter(id => id !== row.id));
            setGlobalConfirmed('');
          } : null,
        })),
        visible.length < rows.length ? h(W.Button, { className: css.more, onClick: () => setLimit(limit + LIST_PAGE_SIZE) }, t('显示更多经验')) : null),
      h('footer', { className: css.listFooter }, t('显示') + ' ' + visible.length + ' / ' + rows.length)),
    h(W.SplitResizer, {
      ...split.resizerProps,
      'aria-controls': listId,
      label: t('调整候选列表宽度'),
      className: css['pane-resizer'],
    }),
    h('section', { className: css['pane-inspector'], ref: detailRef, 'aria-label': t('经验详情') },
      mobileDetail ? h(W.Button, { className: css.back, variant: 'ghost', icon: 'left', onClick: () => {
        mobileReturn.current = active.id;
        setActiveId(null);
      } }, t('返回列表')) : null,
      active && !error ? h(MemoryDetail, {
        key: active.id, row: active, base: revisions.get(active.id), privacy, reviewMode, onChanged, batchPending: pending, lessonTitles,
        onExit: reviewMode ? action => animate([active.id], action) : null,
      }) : (loading && !all.length && !error)
        ? h('div', { className: css.skeletonInspector, role: 'status', 'aria-busy': 'true', 'aria-label': t('加载中…') },
          h(W.Skeleton, { variant: 'card' }),
          h(W.Skeleton, { variant: 'card' }))
        : (!loading && !error && !all.length && reviewMode)
          ? h('div', { className: css.inspectorEmptyWrap },
              h(W.Empty, {
                icon: 'sparkle',
                title: t('等待新的候选经验'),
              }, t('候选经验绝不会自动生效——每条都会展示会话原文来源、适用条件与范围，由你决定采纳或丢弃。')))
          : h(W.Empty, { title: t('选择一条经验') })));
}
