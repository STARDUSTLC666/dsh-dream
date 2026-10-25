// Human review stays on the existing authenticated web actions. Selecting a row
// is read-only; acceptance is never inferred from opening it or model output.
function dreamText(zh, en) { return languageOf() === 'en' ? en : zh; }

function MemoryDetail({ row, privacy, onChanged }) {
  const [peek, setPeek] = useState(false);
  return h('article', { className: 'dream-memory-detail' + (privacy && !peek ? ' dream-masked' : '') },
    privacy ? h(W.Button, { variant: 'ghost', onClick: () => setPeek(!peek), 'aria-pressed': peek }, peek ? dreamText('重新模糊', 'Blur again') : dreamText('临时查看内容', 'Reveal content temporarily')) : null,
    h('h2', { className: 'w-detail-title dream-private' }, row.title),
    h('div', { className: 'w-detail-meta' }, h(W.Icon, { name: 'folder', size: 18 }), row.scopeLabel, h('span', { className: 'w-tag' }, row.stateLabel)),
    h('section', { className: 'w-section dream-private' }, h('h3', null, dreamText('适用条件', 'When to use')), h('p', null, row.when || t('未标注适用条件')), row.applicability ? h('p', { className: 'w-muted' }, row.applicability) : null),
    h('section', { className: 'w-section dream-private' }, h('h3', null, dreamText('建议行动', 'Suggested action')), h('p', null, row.action || t('未标注具体动作'))),
    h('section', { className: 'w-section dream-private' },
      h('h3', null, dreamText('来源', 'Sources')),
      row.evidence.length ? row.evidence.map(source => h('div', { key: source.id, className: 'dream-source' },
        h('p', { className: 'dream-source-summary' }, source.summary || t('未提供摘要')),
        h('details', null, h('summary', null, dreamText('查看来源记录', 'Inspect source record')),
          h('p', { className: 'w-muted' }, (source.verification === 'read' ? t('已读到来源') : t('待核验')) + ' · ' + (source.kind === 'session' ? t('会话') : source.kind === 'user-correction' ? t('用户纠正') : t('本地资料'))),
          source.sessionId ? h('p', { className: 'w-muted' }, t('会话：') + source.sessionId + (Number.isInteger(source.recordSeq) ? t(' · 记录 ') + source.recordSeq : '')) : null,
          h('p', { className: 'w-muted' }, t('记录时间：') + formatDate(source.observedAt)),
          source.verificationReason ? h('p', { className: 'w-muted' }, source.verificationReason === 'live-session-source-verified' ? t('已核对当前会话原文；不代表结论正确。') : source.verificationReason) : null,
          source.sourceHash ? h('code', { className: 'dream-source-hash' }, t('来源校验值：') + source.sourceHash) : null))) : h('p', { className: 'w-muted' }, row.state === 'usable' ? dreamText('未关联来源记录，使用前请核对依据。','No linked sources. Check the evidence before using this lesson.') : t('没有关联来源记录，采纳前请核对依据。')),
      h('p', { className: 'w-muted' }, !row.evidence.length && row.state === 'usable' ? dreamText('没有独立证据；这条经验已由你采纳，使用前仍需核对。','No independent evidence. You accepted this lesson; verify it before relying on it.') : row.evidenceSummary)),
    h('details', { className: 'w-section dream-private' }, h('summary', null, dreamText('例外与补充', 'Exceptions and context')),
      h('p', null, row.exceptions.length ? row.exceptions.join('；') : dreamText('未记录例外；请按当前项目与环境核对适用性。', 'No exceptions recorded. Check applicability to the current project and environment.')),
      h('p', { className: 'w-muted', title: row.lastTitle }, t('最近核验：') + row.lastText),
      row.lastRetrievedAt ? h('p', { className: 'w-muted', title: t('取回仅表示提供参考，不等于重新核验。') }, t('最近取回：') + formatDate(row.lastRetrievedAt) + ' ' + formatTime(row.lastRetrievedAt)) : null),
    row.holdReasonLabel ? h(W.Status, null, t('为什么被扣下：') + row.holdReasonLabel) : null,
    h('p', { className: 'w-muted dream-review-note' }, row.state === 'usable' ? dreamText('已采纳经验可供相关任务取回，使用时仍应核对当前条件。','Accepted lessons can be recalled for matching tasks. Check the current conditions before using them.') : dreamText('确认采纳后，才会在相关任务中复用。', 'Only human-accepted lessons are reused in matching tasks.')),
    h(ReviewControls, { row, key: row.id + '@' + row.revision, onChanged }));
}

function MemoryBoard({ vm, mode, error, loading, privacy, onChanged, onRetry }) {
  const [search, setSearch] = useState(''), [group, setGroup] = useState(''), [history, setHistory] = useState(false);
  const [activeId, setActiveId] = useState(null), [selected, setSelected] = useState([]), [limit, setLimit] = useState(50);
  const [pending, setPending] = useState(false), [failure, setFailure] = useState(''), [retry, setRetry] = useState(null), [globalConfirmed, setGlobalConfirmed] = useState(false);
  const all = vm.rows.filter(row => mode === 'review' ? HELD_STATES.includes(row.state) : row.state === (history ? 'rejected' : 'usable'));
  const groups = [...new Map(all.map(row => [row.groupKey, row.scopeLabel + ' · ' + t(({ preference: '偏好', procedure: '流程', pitfall: '避坑', fact: '事实' })[row.kind] || row.kind)]))];
  const needle = search.trim().toLocaleLowerCase();
  const rows = all.filter(row => (!group || row.groupKey === group) && (!needle || [row.title, row.when, row.action, row.scopeLabel].join(' ').toLocaleLowerCase().includes(needle)));
  const visible = rows.slice(0, limit), active = rows.find(row => row.id === activeId) || rows[0];
  const picked = rows.filter(row => selected.includes(row.id) && row.candidate && !row.conflictIds.length);
  const globalSelection = picked.filter(row => row.isGlobal).map(row => row.id + '@' + row.revision).join(',');
  const sameGroup = new Set(picked.map(row => row.groupKey)).size <= 1;
  useEffect(() => { setActiveId(null); setSelected([]); setGroup(''); setSearch(''); setLimit(50); setFailure(''); }, [mode, history]);
  useEffect(() => { setGlobalConfirmed(false); }, [globalSelection]);
  async function batch(action) {
    if (pending || !picked.length || !sameGroup || action === 'accept' && globalSelection && !globalConfirmed) return;
    const items = picked.map(row => ({ lessonId: row.id, expectedRevision: row.revision }));
    const signature = JSON.stringify({ action, items });
    const requestId = retry?.signature === signature ? retry.id : crypto.randomUUID();
    setRetry({ signature, id: requestId }); setPending(true); setFailure('');
    try {
      await postAction({ operation: 'review-batch', action, items, requestId, confirmGlobal: globalConfirmed });
      setSelected([]); setRetry(null); onChanged(t('已完成所选候选的审阅。'));
    } catch (e) { setFailure(displayError(e)); }
    finally { setPending(false); }
  }
  if (error) return h(W.Empty, { title: dreamText('暂时读不到经验', 'Lessons are unavailable'), icon: 'book', action: h(W.Button, { onClick: onRetry, disabled: loading }, t('重试')) }, displayError(error));
  if (loading && !all.length) return h(W.Empty, { title: t('加载中…'), icon: 'book' });
  if (!all.length && !history) return h(W.Empty, {
    title: mode === 'review' ? dreamText('没有待审阅的经验', 'No lessons awaiting review') : dreamText('还没有已采纳的经验', 'No accepted lessons yet'), icon: 'book',
    action: h(W.Button, { icon: 'refresh', onClick: onRetry }, t('刷新')),
  }, mode === 'review' ? dreamText('任务结束后，自动整理产生的新候选会出现在这里。也可以在对话中让 DSH 复盘；核对来源与范围后再采纳。', 'New candidates collected after tasks appear here. You can also ask DSH to reflect on a task. Review sources and scope before accepting.') : dreamText('先到“待审阅”核对候选。采纳由你确认，模型不会替你批准。', 'Review candidates in Awaiting review. Acceptance requires your confirmation.'));
  return h(W.Split, {
    className: 'dream-memory-board', selected: activeId && rows.some(row => row.id === activeId) ? activeId : null,
    onBack: () => setActiveId(null), backLabel: dreamText('返回列表', 'Back to list'), listWidth: 380,
    list: h('div', { className: 'dream-list' },
      h('div', { className: 'w-master-toolbar' }, h(W.Search, { label: dreamText('搜索经验', 'Search lessons'), value: search, onChange: event => { setSearch(event.target.value); setLimit(50); setActiveId(null); } }), h(W.IconButton, { icon: 'refresh', label: t('刷新'), onClick: onRetry, disabled: loading })),
      h('div', { className: 'dream-list-filter' },
        h('select', { 'aria-label': t('项目与主题'), value: group, disabled: pending, onChange: event => { setGroup(event.target.value); setSelected([]); setLimit(50); setActiveId(null); } }, h('option', { value: '' }, dreamText('全部项目与主题', 'All projects and topics')), groups.map(([key, label]) => h('option', { key, value: key }, label))),
        mode !== 'review' ? h('label', { className: 'dream-check-label' }, h('input', { type: 'checkbox', checked: history, onChange: event => setHistory(event.target.checked) }), t('已驳回历史')) : null),
      picked.length ? h('div', { className: 'dream-batch' },
        h('p', { className: 'w-muted' }, dreamText('已选 ', 'Selected: ') + picked.length + ' / 20'),
        globalSelection ? h('label', { className: 'dream-check-label' }, h('input', { type: 'checkbox', checked: globalConfirmed, disabled: pending, onChange: event => setGlobalConfirmed(event.target.checked) }), t('全局经验会用于所有项目；我已核对并同意。')) : null,
        !sameGroup ? h('p', { className: 'w-muted' }, dreamText('请只选择同范围、同主题的候选。', 'Select candidates from the same scope and topic.')) : null,
        h('div', { className: 'w-toolbar' }, h(W.Button, { variant: 'primary', disabled: pending || !sameGroup || !!globalSelection && !globalConfirmed, onClick: () => batch('accept') }, t('批量采纳')), h(W.Button, { disabled: pending || !sameGroup, onClick: () => batch('reject') }, t('批量驳回'))), h(W.Status, { tone: 'error' }, failure)) : null,
      visible.map(row => h(W.Row, {
        key: row.id, title: row.title, active: row.id === active?.id, status: row.stateLabel,
        meta: row.scopeLabel, description: row.when || row.action, onClick: () => setActiveId(row.id),
        className: privacy ? 'dream-list-private' : undefined,
      }, mode === 'review' && row.candidate && !row.conflictIds.length ? h('input', {
        type: 'checkbox', checked: selected.includes(row.id), disabled: pending || !selected.includes(row.id) && selected.length >= 20,
        'aria-label': t('选中候选：') + row.title,
        onChange: event => setSelected(event.target.checked ? [...selected, row.id] : selected.filter(id => id !== row.id)),
      }) : null)),
      !rows.length ? h(W.Empty, { title: dreamText('没有匹配的经验', 'No matching lessons'), action: h(W.Button, { onClick: () => { setSearch(''); setGroup(''); } }, t('清空筛选')) }) : null,
      visible.length < rows.length ? h(W.Button, { className: 'dream-more', onClick: () => setLimit(limit + 50) }, t('显示更多经验')) : null,
      h('p', { className: 'w-muted dream-list-count' }, dreamText('显示 ', 'Showing ') + visible.length + ' / ' + rows.length)),
    detail: active ? h(MemoryDetail, { key: active.id, row: active, privacy, onChanged }) : h(W.Empty, { title: dreamText('选择一条经验', 'Select a lesson'), icon: 'book' }),
  });
}

const DREAM_WORKBENCH_CSS = `
.dream-workbench .dream-memory-detail{display:flex;flex-direction:column;min-height:100%;min-width:0}.dream-workbench .dream-memory-detail .w-section{padding:24px 0}.dream-workbench .dream-source{margin:12px 0 16px}.dream-workbench .dream-source-summary{border-inline-start:2px solid var(--w-border);padding-inline-start:14px;margin:10px 0 14px;font-size:14px}.dream-workbench .dream-source details{font-size:13px;color:var(--w-muted)}.dream-workbench .dream-source-hash{font:11px/1.6 ui-monospace,monospace;display:block;overflow-wrap:anywhere;margin-top:8px}.dream-workbench .dream-list-filter{display:flex;flex-direction:column;gap:12px;padding:0 16px 16px}.dream-workbench .dream-list-filter select{width:100%}.dream-workbench .dream-check-label{display:flex;align-items:flex-start;gap:8px;font-size:12px;line-height:1.6}.dream-workbench .dream-check-label input{margin-top:3px}.dream-workbench .dream-batch{padding:14px 16px;border-block:1px solid var(--w-border);display:grid;gap:10px;background:var(--w-soft)}.dream-workbench .dream-list-count{padding:16px}.dream-workbench .dream-more{margin:12px 16px}.dream-workbench .dream-review-note{margin:20px 0 12px}.dream-workbench .dshd-review{border-top:1px solid var(--w-border);padding-top:18px;margin-top:auto}.dream-workbench .dshd-kcmd{display:flex;gap:8px;flex-wrap:wrap;margin:12px 0}.dream-workbench .dshd-btn{font-size:14px;min-height:36px;border-radius:8px;border-color:var(--w-border);background:var(--w-bg);padding:8px 12px}.dream-workbench .dshd-btn.primary{background:var(--w-primary);color:var(--w-on-primary);border-color:var(--w-primary)}.dream-workbench .dshd-reviewform{background:var(--w-soft);border:1px solid var(--w-border);border-radius:8px;padding:16px;margin-top:12px}.dream-workbench .dshd-reviewform label{display:grid;gap:6px;margin:12px 0}.dream-workbench .dshd-reviewform textarea,.dream-workbench .dshd-reviewform select{width:100%}.dream-workbench .dshd-review>label{display:flex;gap:8px;align-items:flex-start}.dream-workbench .dshd-review>label input{margin-top:3px}.dream-workbench .dshd-feedback{border-top:1px solid var(--w-border);padding-top:16px;margin:20px 0}.dream-workbench .dshd-feedback label{display:grid;gap:6px;margin:12px 0}.dream-workbench .dream-auto{display:flex;align-items:center;gap:18px;flex-wrap:wrap}.dream-workbench .dream-settings-content{display:grid;gap:16px}.dream-workbench .dream-settings-content .dshd-reviewform{margin:0}.dream-workbench .dream-settings-content label{display:grid;gap:6px}.dream-workbench .dream-settings-content select{width:100%}.dream-workbench .dshd-toolbar{padding:16px 0;flex-wrap:wrap;border:0;background:transparent}.dream-workbench .dshd-two{gap:24px}.dream-workbench .dshd-card{border:0;border-bottom:1px solid var(--w-border);border-radius:0;box-shadow:none;padding:20px 0;background:transparent}.dream-workbench .dshd-tiles{gap:0;border-bottom:1px solid var(--w-border)}.dream-workbench .dshd-tile{border:0;border-radius:0;box-shadow:none}.dream-workbench .dream-masked .dream-private,.dream-workbench.dshd-privacy .dream-list-private .w-row-button{filter:blur(5px);user-select:none}.dream-workbench .dream-journal{padding-bottom:24px}.dream-workbench .dshd-bridge{border:0;border-bottom:1px solid var(--w-border);border-radius:0;padding:20px 0}.dream-workbench .dshd-note{color:var(--w-muted);font-size:12px}.dream-workbench .dshd-reviewform .dshd-note{margin-top:10px}
@container dsh-workbench (max-width:760px){.dream-workbench .dream-list-filter{padding-inline:0}.dream-workbench .dream-auto{gap:12px}.dream-workbench .dshd-kcmd>.dshd-btn{flex:1}.dream-workbench .dream-memory-detail .w-section{padding:20px 0}}
`;
