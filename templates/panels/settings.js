const AUTOMATIC_REASONS = {
  saved: '已保存新候选，等待审阅',
  merged: '已合并重复经验',
  'nothing-useful': '没有可复用的新经验',
  'ordinary-chat': '普通闲聊，已跳过',
  'no-source': '缺少可见来源，已跳过',
  'daily-budget': '今天的整理预算已用完',
  cooldown: '冷却中，轮次保留等待整理',
  queued: '已加入队列，安静后合并整理',
  disabled: '自动整理已暂停',
  unfinished: '任务未正常完成，已跳过',
  'no-model': '当前会话尚无可用模型',
  recording: '正在整理候选经验',
  timeout: '整理超时，本次已停止',
  cancelled: '已暂停辅助调用，未完成轮次保留',
  superseded: '已有新任务，旧轮次不再整理',
  'model-error': '模型返回失败或无法核验，请检查 DSH 模型连接',
  'input-limit': '内容超过预算，已跳过',
};

function useAutomaticMemory(reloadToken, reload) {
  const [value, setValue] = useState(null);
  const [failure, setFailure] = useState(null);
  const [pending, setPending] = useState(false);
  const request = useRef(null);
  const writeLock = useRef(false);
  const candidateCount = useRef(null);

  useEffect(() => {
    let alive = true;
    let timer;
    async function refresh() {
      const controller = new AbortController();
      request.current = controller;
      try {
        const response = await fetch(routeUrlFor('api/dsh-dream/automatic', ''), {
          credentials: 'same-origin', signal: controller.signal,
        });
        if (!response.ok) throw new Error(t('自动功能状态暂时无法读取，请刷新重试。'));
        const payload = await response.json();
        if (alive && !controller.signal.aborted && !writeLock.current) {
          const next = payload.automatic;
          if (Number.isInteger(next?.candidates) && candidateCount.current !== null && next.candidates !== candidateCount.current) reload();
          candidateCount.current = next?.candidates ?? null;
          setValue(next);
          setFailure(null);
        }
      } catch (error) {
        if (alive && !controller.signal.aborted && !writeLock.current) setFailure(error);
      } finally {
        if (request.current === controller) request.current = null;
        if (alive) timer = setTimeout(refresh, 15000);
      }
    }
    refresh();
    return () => {
      alive = false;
      clearTimeout(timer);
      request.current?.abort();
    };
  }, [reloadToken, reload]);

  async function change(body) {
    if (writeLock.current) return;
    writeLock.current = true;
    request.current?.abort();
    setPending(true);
    setFailure(null);
    try {
      const result = await postAction(body);
      setValue(result.automatic);
    } catch (error) {
      setFailure(error);
    } finally {
      writeLock.current = false;
      setPending(false);
    }
  }

  __stardustUpdatesGuard(React, 'dsh-dream.automatic', { busy: pending });
  const canFlush = value?.available === true && !value.mainTaskRunning && value.pendingTurns > 0 && !pending;
  return { value, pending, failure, canFlush, change };
}

function AutomaticSwitches({ automation }) {
  const { value, pending, change } = automation;
  return h('div', { className: css.switches },
    h(W.Switch, {
      label: t('自动整理'), checked: value?.enabled === true, disabled: pending || !value,
      onChange: enabled => change({ operation: 'automatic', enabled }),
    }),
    h(W.Switch, {
      label: t('自动取回'), checked: value?.retrievalEnabled === true, disabled: pending || !value,
      onChange: retrievalEnabled => change({ operation: 'automatic', retrievalEnabled }),
    }));
}

function SettingCard({ title, wide, index, children }) {
  return h('section', {
    className: clsx(css['settings-card'], wide && css.settingsWide),
    style: { '--stagger-idx': index }, ...spotlightHandlers,
  }, h('h2', null, title), children);
}

function DreamSettings({ automation, privacy, onPrivacyChange, onReview }) {
  const [chatId, setChatId] = useState('');
  const { value, pending, failure, change, canFlush } = automation;
  const chats = value?.sessions || [];
  const chat = chats.find(row => row.sessionId === chatId) || chats[0];
  const lastDate = Number.isFinite(value?.last?.at) ? new Date(value.last.at).toISOString() : '';
  const interval = Math.ceil(Math.max(0, Number(value?.cooldownMinutes) || 0) * 60);
  const format = new Intl.NumberFormat(languageOf());
  return h('div', { className: css.settingsPage },
    h(SettingCard, { title: t('自动记忆与预算'), index: 0, wide: !chat },
      h(AutomaticSwitches, { automation }),
      h('p', { className: css.muted }, t('候选经验由你确认采纳。')),
      failure ? h(W.Status, { tone: 'error' }, displayError(failure)) : null,
      value ? h(React.Fragment, null,
        h('p', { role: 'status' }, t(value.problem ? '状态异常，请检查 DSH 日志。'
          : !value.available ? '当前宿主服务尚未就绪；手动工具仍可使用。'
          : value.running ? '正在整理'
          : value.enabled === false ? '全局默认已暂停；聊天独立设置仍生效'
          : '已就绪，等待符合条件的任务')),
        h('dl', { className: css.scopeFacts },
          h('dt', null, t('今日模型调用')), h('dd', null, format.format(value.callsToday ?? 0) + ' / ' + format.format(value.maxCallsPerDay ?? 0)),
          h('dt', null, t('调用冷却')), h('dd', null, format.format(interval) + ' ' + t('秒')),
          h('dt', null, t('待整理轮次')), h('dd', null, format.format(value.pendingTurns ?? 0)),
          h('dt', null, t('整理间隔')), h('dd', null, format.format(value.idleSeconds ?? 60) + ' ' + t('秒')),
          h('dt', null, t('单项目合并上限')), h('dd', null, format.format(value.maxBatchTurns ?? 4)),
          h('dt', null, t('过期 / 超出容量')), h('dd', null, format.format(value.expiredTurns ?? 0) + ' / ' + format.format(value.overflowTurns ?? 0)),
          h('dt', null, t('单次输出上限')), h('dd', null, format.format(value.maxOutputTokens ?? 0) + ' tokens')),
        h('p', { className: css.muted }, t('沿用会话模型和整理预算。待处理片段最多保留 24 小时、32 轮。')),
        lastDate ? h('p', { className: css.muted }, t('最近检查') + ' · ' + formatDate(lastDate) + ' ' + formatTime(lastDate) + ' · ' + t(AUTOMATIC_REASONS[value.last.reason] ?? '已检查')) : null,
        h('div', { className: css.actions },
          h(W.Button, { icon: 'sparkle', variant: 'primary', disabled: !canFlush, onClick: () => change({ operation: 'automatic-flush' }) }, t('现在整理待处理轮次')),
          h(W.Button, { onClick: onReview }, t('待审阅') + ' · ' + format.format(value.candidates ?? 0)))) :
        failure ? null : h('p', { className: css.muted }, t('正在读取状态…'))),
    chat ? h(SettingCard, { title: t('聊天记忆设置'), index: 1 },
      h('label', { className: css.scopePicker }, t('会话'), h('select', {
        value: chat.sessionId, disabled: pending, onChange: event => setChatId(event.target.value),
      }, chats.map(row => h('option', { key: row.sessionId, value: row.sessionId }, (row.cwd || '') + ' · ' + row.sessionId.slice(0, 8))))),
      [['use', '使用记忆'], ['contribute', '贡献记忆']].map(([key, label]) => h('label', {
        className: css.scopePicker, key,
      }, t(label), h('select', {
        disabled: pending, value: chat[key] == null ? 'inherit' : String(chat[key]),
        onChange: event => change({ operation: 'automatic-chat', sessionId: chat.sessionId,
          [key]: event.target.value === 'inherit' ? null : event.target.value === 'true' }),
      }, h('option', { value: 'inherit' }, t('跟随全局')),
      h('option', { value: 'true' }, t('仅此聊天开启')),
      h('option', { value: 'false' }, t('仅此聊天关闭'))))),
      h('p', { className: css.muted }, t('两个选项独立保存；关闭贡献会移除该聊天尚未整理的片段，已有经验仍保留。'))) : null,
    h(SettingCard, { title: t('显示与脱敏'), index: 2 },
      h('label', { className: css.scopePicker }, t('界面语言'), h('select', {
        'aria-label': t('界面语言'), value: dreamLanguage, onChange: event => setDreamLanguage(event.target.value),
      }, h('option', { value: '' }, t('跟随 DSH')),
      Object.entries(DREAM_LANGUAGES).map(([code, label]) => h('option', { key: code, value: code }, label)))),
      h(W.Switch, { label: t('隐私模式'), checked: privacy, onChange: onPrivacyChange }),
      h('p', { className: css.muted }, t('显示层模糊；DOM 仍为明文，不改文件、不加密')),
      h('p', { className: css.muted }, t('maskSecrets 由插件配置管理，证据中的脱敏槽位可展开查看掩码。'))),
    h(SettingCard, { title: t('反向代理访问'), index: 3 },
      h('p', { className: css.muted }, t('代理来源与 Host 使用各自的白名单。通过插件配置管理：')),
      h('ul', { className: css.settingsList },
        h('li', null, h('code', null, 'trustedRemoteAddresses')),
        h('li', null, h('code', null, 'trustedHosts')))),
    h(SettingCard, { title: t('日志与健康检查'), index: 4 },
      h('p', { className: css.muted }, t('在 DSH 对话中运行 dream_health 检查日记和会话存储。')),
      h('div', { className: css.actions }, h(CopyCommand, { command: 'dream_health', label: t('复制检查命令') }))));
}
