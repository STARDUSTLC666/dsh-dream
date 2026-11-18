// Generated: shared optional update controls; edit the original client templates.
(function(){
/* DSH workbench UI v1. MIT. Canonical source: dsh-suite/ui/workbench-ui.js.
 * Vendored into each plugin: no Suite or extra runtime dependency is required.
 * Styles are scoped to .dshw and never replace the host chrome or theme.
 */
function createWorkbenchUI(React) {
  const h = React.createElement;
  const { useEffect, useId, useRef } = React;
  const cx = (...values) => values.filter(Boolean).join(' ');
  const paths = {
    book: ['M4 4h6a3 3 0 0 1 2 2v15a4 4 0 0 0-4-2H4z', 'M20 4h-6a3 3 0 0 0-2 2v15a4 4 0 0 1 4-2h4z'],
    calendar: ['M5 5h14a2 2 0 0 1 2 2v13H3V7a2 2 0 0 1 2-2Z', 'M7 3v4M17 3v4M3 10h18'],
    mail: ['M3 5h18v14H3z', 'm3 6 9 7 9-7'],
    rss: ['M4 11a9 9 0 0 1 9 9M4 4a16 16 0 0 1 16 16', 'M4 19h.01'],
    slides: ['M3 4h18v13H3z', 'M12 17v4M8 21h8'],
    shield: ['m12 3 8 3v6c0 4-4 7-8 9-4-2-8-5-8-9V6z', 'm8 12 3 3 5-6'],
    layers: ['M5 3h16v16H5z', 'M2 7v15h15'],
    play: ['m9 6 9 6-9 6Z'],
    video: ['M3 5h12v14H3z', 'm15 10 6-4v12l-6-4'],
    search: ['M10.5 18a7.5 7.5 0 1 0 0-15 7.5 7.5 0 0 0 0 15Z', 'm16 16 5 5'],
    plus: ['M12 5v14M5 12h14'],
    refresh: ['M20 7a9 9 0 1 0 1 8', 'M20 2v5h-5'],
    settings: ['m9 3-.7 2.4-2 .9L4 5.8 2.5 8.4l1.7 1.8v2.3L2.5 14 4 17l2.5-.4 1.9 1L9 20h3l.8-2.4 2-1 2.5.4 1.5-2.7-1.7-1.9v-2.2l1.7-1.8-1.5-2.6-2.5.4-2-1L12 3Z', 'M14 11.5a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0Z'],
    close: ['m6 6 12 12M18 6 6 18'],
    left: ['m14 5-7 7 7 7'],
    right: ['m10 5 7 7-7 7'],
    down: ['m5 9 7 7 7-7'],
    filter: ['M4 5h16M7 12h10M10 19h4'],
    download: ['M12 3v12m-5-5 5 5 5-5', 'M4 16v5h16v-5'],
    upload: ['M12 16V4m-5 5 5-5 5 5', 'M4 16v5h16v-5'],
    copy: ['M8 8h13v13H8z', 'M16 8V3H3v13h5'],
    external: ['M14 3h7v7m0-7L10 14', 'M10 3H3v18h18v-7'],
    file: ['M4 3h10l6 6v12H4z', 'M14 3v6h6M8 13h8M8 17h6'],
    folder: ['M3 5h7l2 3h9v12H3z'],
    edit: ['m15 4 5 5-10 10-6 1 1-6Z', 'm13 6 5 5'],
    trash: ['M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7M14 10v7'],
    more: ['M5 12h.01M12 12h.01M19 12h.01'],
    info: ['M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Z', 'M12 11v6M12 7h.01'],
    check: ['m5 12 4 4L19 6'],
    quote: ['M4 12h6v7H3v-7c0-4 2-6 5-7M15 12h6v7h-7v-7c0-4 2-6 5-7'],
    star: ['m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9Z'],
    reply: ['m9 5-7 7 7 7v-5h6c3 0 5 2 6 5 0-8-4-11-12-11Z'],
    link: ['m10 13 4-4M8 16l-2 2a4 4 0 0 1-6-6l4-4a4 4 0 0 1 6 0', 'm14 8 2-2a4 4 0 0 1 6 6l-4 4a4 4 0 0 1-6 0'],
  };
  function Icon({ name = 'file', size = 20, ...props }) {
    return h('svg', { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.75, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true, focusable: false, ...props },
      (paths[name] || paths.file).map((d, index) => h('path', { key: index, d })));
  }
  function Button({ children, icon, variant, className, ...props }) {
    return h('button', { type: 'button', ...props, className: cx('w-button', variant && 'w-' + variant, className) }, icon ? h(Icon, { name: icon, size: 18 }) : null, children);
  }
  function IconButton({ label, icon, ...props }) {
    return h(Button, { ...props, icon, className: cx('w-icon-button', props.className), 'aria-label': label, title: label });
  }
  function Page({ title, subtitle, actions, children, workbench = false, className, rootRef, ...props }) {
    return h('section', { ...props, ref: rootRef, className: cx('dshw', 'w-page', className), 'data-main': workbench ? 'true' : 'false' },
      h(Styles, { key: 'styles' }),
      h('header', { className: 'w-page-header' }, h('div', { className: 'w-heading' }, h('h1', null, title), subtitle ? h('p', { className: 'w-subtitle' }, subtitle) : null), actions ? h('div', { className: 'w-header-actions' }, actions) : null),
      h('div', { className: 'w-body' }, children));
  }
  function Tabs({ items, value, onChange, label, children }) {
    const id = useId();
    const active = items.some(item => item.id === value) ? value : items[0]?.id;
    function keys(event, index) {
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault();
      const next = event.key === 'Home' ? 0 : event.key === 'End' ? items.length - 1 : (index + (event.key === 'ArrowRight' ? 1 : -1) + items.length) % items.length;
      const node = event.currentTarget.parentElement?.querySelectorAll('[role=tab]')[next];
      if (node) { onChange(items[next].id); node.focus(); }
    }
    return h('div', { className: 'w-tabs-layout' },
      h('div', { className: 'w-tabs', role: 'tablist', 'aria-label': label }, items.map((item, index) => h('button', {
        type: 'button', role: 'tab', key: item.id, id: id + '-' + item.id, 'aria-controls': id + '-panel', 'aria-selected': active === item.id, tabIndex: active === item.id ? 0 : -1,
        onClick: () => onChange(item.id), onKeyDown: event => keys(event, index),
      }, item.label, item.count !== undefined ? h('span', { className: 'w-count' }, item.count) : null))),
      h('div', { className: 'w-tab-panel', id: id + '-panel', role: 'tabpanel', 'aria-labelledby': id + '-' + active }, children));
  }
  function Status({ children, tone = 'info', className }) {
    if (!children) return null;
    return h('div', { className: cx('dshw', 'w-status', 'w-status-' + tone, className), role: tone === 'error' ? 'alert' : 'status', 'aria-live': tone === 'error' ? 'assertive' : 'polite' }, h(Icon, { name: tone === 'success' ? 'check' : 'info', size: 18 }), h('div', null, children));
  }
  function Empty({ title, children, action, icon = 'file' }) {
    return h('div', { className: 'dshw w-empty' }, h(Styles, { key: 'styles' }), h(Icon, { name: icon, size: 32 }), h('h2', null, title), children ? h('div', { className: 'w-muted' }, children) : null, action ? h('div', { className: 'w-toolbar' }, action) : null);
  }
  function Split({ list, detail, selected, onBack, backLabel, className, listWidth = 360 }) {
    const ref = useRef(null);
    useEffect(() => {
      if (!selected || !ref.current || ref.current.clientWidth > 760) return;
      const heading = ref.current.querySelector('.w-detail h2');
      if (heading) { heading.tabIndex = -1; heading.focus({ preventScroll: true }); }
    }, [selected]);
    return h('div', { ref, className: cx('w-split', className), 'data-selected': selected ? 'true' : 'false', style: { '--w-list-width': listWidth + 'px' } },
      h('div', { className: 'w-master' }, list),
      h('div', { className: 'w-detail' }, selected ? h(Button, { className: 'w-back', icon: 'left', variant: 'ghost', onClick: onBack }, backLabel) : null, detail));
  }
  function Row({ title, meta, description, active, onClick, children, status, className, disabled }) {
    return h('div', { className: cx('w-row', active && 'w-selected', className) },
      children ? h('div', { className: 'w-row-select' }, children) : null,
      h('button', { type: 'button', className: 'w-row-button', onClick, disabled, 'aria-pressed': !!active },
        h('span', { className: 'w-row-head' }, h('strong', null, title), status ? h('span', { className: 'w-tag' }, status) : null),
        meta ? h('span', { className: 'w-row-meta' }, meta) : null,
        description ? h('span', { className: 'w-row-description' }, description) : null));
  }
  function Search({ label, value, onChange, ...props }) {
    const id = useId();
    return h('div', { className: 'w-search' }, h(Icon, { name: 'search', size: 18 }), h('input', { type: 'search', id, 'aria-label': label, placeholder: label, value, onChange, ...props }));
  }
  function Switch({ label, checked, onChange, disabled }) {
    return h('label', { className: 'w-switch-label' }, h('span', null, label), h('input', { type: 'checkbox', role: 'switch', checked, disabled, onChange, 'aria-label': label }), h('span', { className: 'w-switch-track', 'aria-hidden': true }));
  }
  function Dialog({ title, children, onClose, closeLabel, className, busy = false }) {
    const id = useId(), panel = useRef(null);
    useEffect(() => {
      const previous = document.activeElement;
      panel.current?.querySelector('button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex="0"]')?.focus();
      return () => { if (previous?.isConnected) previous.focus({ preventScroll: true }); };
    }, []);
    function keydown(event) {
      if (event.key === 'Escape' && !event.isComposing) { event.preventDefault(); event.stopPropagation(); if (!busy) onClose(); return; }
      if (event.key !== 'Tab') return;
      const controls = [...panel.current.querySelectorAll('button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), a[href], [tabindex="0"]')].filter(node => node.getClientRects().length);
      const first = controls[0], last = controls.at(-1);
      if (!controls.length) { event.preventDefault(); panel.current.focus(); }
      else if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }
    return h('div', { className: 'dshw w-overlay', onClick: event => { if (!busy && event.target === event.currentTarget) onClose(); } },
      h(Styles, { key: 'styles' }),
      h('section', { ref: panel, className: cx('w-dialog', className), role: 'dialog', 'aria-modal': true, 'aria-labelledby': id, tabIndex: -1, onKeyDown: keydown },
        h('header', { className: 'w-dialog-header' }, h('h2', { id }, title), h(IconButton, { icon: 'close', label: closeLabel, disabled: busy, onClick: onClose })), h('div', { className: 'w-dialog-body' }, children)));
  }
  function register(ctx, { id, label, icon, component, inject, order = 50 }) {
    // The two slots are optional. Existing settings and manual tools still load
    // in hosts without a workbench, while RC.3 owns navigation/pinning itself.
    ctx.slots.inject('main', () => ctx.slots.register({ name: 'main', key: id, inject: () => ({ ...(inject?.() || {}), workbench: true }) }, component));
    ctx.slots.inject('sidebar.panellist', () => ctx.slots.register({ name: 'sidebar.panellist', id, order, label }, function WorkbenchIcon({ size }) { return h(Icon, { name: icon, size }); }));
  }
  const styles = `
.dshw{--w-bg:var(--dsw-alias-bg-layer-1,#fff);--w-soft:var(--dsw-alias-bg-layer-2,#f7f8fa);--w-text:var(--dsw-alias-label-primary,#18202c);--w-muted:var(--dsw-alias-label-secondary,#667085);--w-border:var(--dsw-alias-border-l3,#e7e9ef);--w-accent:var(--dsh-plugin-workbench-accent,#4f6bdb);--w-selected:color-mix(in srgb,var(--w-accent) 10%,var(--w-bg));--w-primary:var(--w-text);--w-on-primary:var(--w-bg);container-type:inline-size;container-name:dsh-workbench;color:var(--w-text);font:14px/1.65 var(--dsh-font-family-content,system-ui,-apple-system,"Segoe UI","Microsoft YaHei",sans-serif);min-width:0;max-width:100%;box-sizing:border-box;text-align:start;color-scheme:inherit}
.dshw *,.dshw *:before,.dshw *:after{box-sizing:border-box}.dshw h1,.dshw h2,.dshw h3,.dshw h4,.dshw p{margin:0}.dshw h1{font-size:30px;line-height:1.25;letter-spacing:-.025em;font-weight:650}.dshw h2{font-size:24px;line-height:1.35;font-weight:650;letter-spacing:-.015em;overflow-wrap:anywhere}.dshw h3,.dshw h4{font-size:16px;line-height:1.4;font-weight:600}.dshw a{color:var(--w-accent);text-underline-offset:3px;overflow-wrap:anywhere}.dshw button,.dshw input,.dshw select,.dshw textarea{font:inherit;color:inherit;max-width:100%}.dshw input:not([type=checkbox]):not([type=radio]):not([type=file]),.dshw select,.dshw textarea{background:var(--dsw-specific-input-major,var(--w-bg));border:1px solid var(--w-border);border-radius:8px;padding:8px 11px;min-width:0;line-height:1.5}.dshw input:not([type=checkbox]):not([type=radio]):not([type=file]),.dshw select{min-height:38px}.dshw textarea{resize:vertical}.dshw input[type=checkbox],.dshw input[type=radio]{width:16px;height:16px;flex-shrink:0;accent-color:var(--w-accent)}.dshw :focus-visible{outline:2px solid var(--w-accent);outline-offset:3px}.dshw button:disabled,.dshw input:disabled,.dshw select:disabled,.dshw textarea:disabled{opacity:.5;cursor:not-allowed}.dshw label{font-size:13px}.dshw fieldset{min-width:0;border:1px solid var(--w-border);border-radius:8px}.dshw summary{cursor:pointer;font-weight:550;list-style:none;display:flex;align-items:center;gap:8px}.dshw summary::-webkit-details-marker{display:none}.dshw summary:after{content:'';display:block;margin-inline-start:auto;width:7px;height:7px;border-inline-end:1.75px solid currentColor;border-bottom:1.75px solid currentColor;transform:rotate(45deg);flex-shrink:0}.dshw details[open]>summary:after{transform:rotate(225deg)}.dshw details>summary+*{margin-top:12px}.dshw pre{white-space:pre-wrap;overflow-wrap:anywhere;font:12px/1.7 ui-monospace,SFMono-Regular,Consolas,monospace;max-width:100%;background:var(--w-soft);border-radius:6px;padding:14px}.dshw img,.dshw video,.dshw iframe{max-width:100%}
.w-page{display:flex;flex-direction:column;position:relative;padding:0;min-height:540px;gap:0}.w-page[data-main=true]{height:100%;min-height:0;padding:calc(24px + var(--dsh-frame-top-clearance,0px)) 28px 0 max(28px,var(--dsh-frame-leading-clearance,0px));overflow:auto}.dshw[data-main=true]{background:var(--w-bg)}.dshw.w-page,.dshw .w-body,.dshw .w-tab-panel{overflow-x:clip}.w-page-header{display:flex;justify-content:space-between;gap:24px;align-items:flex-start;padding-bottom:22px;flex-shrink:0}.w-heading{min-width:0}.w-subtitle{margin-top:8px!important;font-size:14px;color:var(--w-muted);line-height:1.6}.w-header-actions,.w-toolbar,.w-actions{display:flex;align-items:center;flex-wrap:wrap;gap:8px;min-width:0}.w-header-actions{justify-content:flex-end}.w-body,.w-tabs-layout{display:flex;flex-direction:column;flex:1;min-height:0;min-width:0}.w-body{overflow:auto}.w-tab-panel{flex:1;min-width:0;min-height:0;display:flex;flex-direction:column;overflow:auto}.w-tabs{display:flex;align-items:stretch;gap:20px;border-bottom:1px solid var(--w-border);flex-shrink:0;overflow-x:auto;scrollbar-width:thin}.dshw .w-tabs>button{border:0;border-bottom:2px solid transparent;background:transparent;padding:11px 8px 13px;white-space:nowrap;font-size:14px;font-weight:550;cursor:pointer;color:var(--w-muted);display:flex;align-items:center;gap:7px}.dshw .w-tabs>button[aria-selected=true]{border-bottom-color:var(--w-accent);color:var(--w-accent)}.w-count,.w-tag{font-size:12px;line-height:1.5;display:inline-flex;align-items:center;flex-shrink:0;background:var(--w-soft);border-radius:5px;padding:1px 6px;color:var(--w-muted)}.w-tabs [aria-selected=true] .w-count,.w-selected .w-tag{color:var(--w-accent);background:var(--w-selected)}
.dshw .w-button{display:inline-flex;justify-content:center;align-items:center;gap:7px;background:var(--w-bg);border:1px solid var(--w-border);border-radius:8px;padding:8px 12px;min-height:36px;line-height:1.4;font-size:14px;font-weight:500;cursor:pointer;text-decoration:none;white-space:normal}.dshw .w-button:not(:disabled):hover{background:var(--w-soft)}.dshw .w-primary{background:var(--w-primary);border-color:var(--w-primary);color:var(--w-on-primary)}.dshw .w-primary:not(:disabled):hover{background:var(--w-primary);opacity:.9}.dshw .w-ghost{background:transparent;border-color:transparent}.dshw .w-danger{color:var(--dsw-alias-state-error-primary,#b43c3c)}.dshw .w-icon-button{width:36px;min-width:36px;padding:8px}.dshw .w-button svg{flex-shrink:0}.w-muted{color:var(--w-muted);font-size:12px;line-height:1.6}.w-section{padding:24px 0;border-bottom:1px solid var(--w-border);min-width:0}.w-section>h3{margin-bottom:12px}.w-section>p+p{margin-top:8px}.w-fields{display:grid;gap:16px;min-width:0}.w-field{display:grid;gap:6px;min-width:0}.w-field>input,.w-field>select,.w-field>textarea{width:100%}.w-status{display:flex;align-items:flex-start;gap:8px;padding:11px 13px;margin:12px 0;border:1px solid var(--w-border);border-radius:8px;background:var(--w-soft);font-size:13px;overflow-wrap:anywhere;flex-shrink:0}.w-status>svg{flex-shrink:0;margin-top:2px}.w-status-error{color:var(--dsw-alias-state-error-primary,#ad3636)}.w-status-success{color:var(--dsw-alias-state-success-primary,#24794a)}.w-status-warn{color:var(--dsw-alias-state-warning-primary,#8a5a00)}.w-empty{display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;gap:14px;width:100%;max-width:580px;padding:48px 24px;margin:auto;min-height:280px;overflow-wrap:anywhere}.w-empty>svg{color:var(--w-muted)}.w-empty h2{font-size:20px}.w-empty .w-muted{font-size:14px}.w-empty .w-toolbar{justify-content:center}
.w-split{display:grid;grid-template-columns:minmax(240px,var(--w-list-width)) minmax(0,1fr);min-height:460px;flex:1;min-width:0}.w-master{min-width:0;border-inline-end:1px solid var(--w-border);overflow:auto;padding-bottom:24px}.w-detail{min-width:0;padding:26px 28px;overflow:auto;overflow-wrap:anywhere;display:flex;flex-direction:column}.w-master-toolbar{display:flex;align-items:center;gap:8px;flex-wrap:wrap;padding:20px 16px}.w-search{display:flex;align-items:center;gap:8px;border:1px solid var(--w-border);border-radius:8px;padding:0 10px;min-width:0;flex:1;background:var(--w-bg)}.w-search>svg{color:var(--w-muted);flex-shrink:0}.dshw .w-search>input{border:0!important;background:transparent!important;padding:8px 0!important;width:100%;outline-offset:0}.w-row{display:flex;gap:0;min-width:0;position:relative;border-bottom:1px solid var(--w-border);border-inline-start:3px solid transparent}.w-row-select{display:flex;align-items:flex-start;padding:21px 0 0 14px}.dshw .w-row-button{display:flex;flex-direction:column;align-items:stretch;gap:7px;text-align:start;width:100%;padding:18px 18px 18px 16px;border:0;background:transparent;color:inherit;min-width:0;cursor:pointer;line-height:1.5}.dshw .w-row-button:hover{background:var(--w-soft)}.w-row-head{display:flex;align-items:flex-start;gap:10px;justify-content:space-between;min-width:0}.w-row-head>strong{font-size:14px;line-height:1.5;font-weight:600;overflow-wrap:anywhere}.w-row-meta,.w-row-description{color:var(--w-muted);font-size:12px;line-height:1.6;overflow-wrap:anywhere}.w-row-description{display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}.w-selected{background:var(--w-selected);border-inline-start-color:var(--w-accent)}.w-back{display:none!important}.w-detail-title{margin-bottom:12px!important}.w-detail-meta{color:var(--w-muted);font-size:13px;display:flex;align-items:center;gap:8px;flex-wrap:wrap}.w-detail-footer{padding:24px 0;display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-top:auto;border-top:1px solid var(--w-border)}.w-detail-footer .w-muted{flex:1;min-width:160px}.w-definition{display:grid;grid-template-columns:minmax(80px,120px) minmax(0,1fr);gap:8px 16px;font-size:14px;margin:20px 0}.w-definition dt{color:var(--w-muted)}.w-definition dd{margin:0;min-width:0;overflow-wrap:anywhere}
.w-switch-label{display:inline-flex;align-items:center;gap:8px;font-size:13px;position:relative;cursor:pointer}.w-switch-label>input{position:absolute;opacity:0;inset-inline-end:0;width:36px!important;height:22px!important;margin:0;cursor:pointer}.w-switch-track{width:36px;height:22px;border-radius:12px;display:block;background:var(--w-border);border:1px solid var(--w-border);pointer-events:none;padding:2px;transition:background .15s}.w-switch-track:before{content:'';display:block;width:16px;height:16px;border-radius:50%;background:#fff;box-shadow:0 1px 2px #0002;transition:transform .15s}.w-switch-label>input:checked+.w-switch-track{background:var(--w-accent);border-color:var(--w-accent)}.w-switch-label>input:checked+.w-switch-track:before{transform:translateX(14px)}.w-switch-label>input:focus-visible+.w-switch-track{outline:2px solid var(--w-accent);outline-offset:3px}.w-switch-label:has(>input:disabled){opacity:.5;cursor:not-allowed}
.w-overlay{position:fixed;inset:0;background:#0005;display:flex;justify-content:flex-end;z-index:1000;padding:12px;overflow:auto}.w-dialog{width:min(620px,100%);max-height:100%;display:flex;flex-direction:column;min-height:0;background:var(--w-bg);color:var(--w-text);border:1px solid var(--w-border);border-radius:12px;box-shadow:0 18px 70px #0003}.w-dialog-header{display:flex;justify-content:space-between;align-items:center;gap:16px;padding:20px 24px;border-bottom:1px solid var(--w-border);flex-shrink:0}.w-dialog-header>h2{font-size:20px}.w-dialog-body{overflow:auto;padding:20px 24px;min-height:0}.w-editor-grid{display:grid;grid-template-columns:210px minmax(0,1fr) 300px;min-height:500px;flex:1}.w-editor-list{padding:20px 12px;border-inline-end:1px solid var(--w-border);min-width:0}.w-editor-canvas{background:var(--w-soft);padding:20px;min-width:0;display:flex;flex-direction:column;gap:14px}.w-editor-inspector{padding:24px;border-inline-start:1px solid var(--w-border);min-width:0;overflow:auto}.w-editor-inspector h3{margin-bottom:18px}.w-preview-empty{display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center;gap:12px;aspect-ratio:16/9;min-height:180px;background:var(--w-soft);border:1px solid var(--w-border);border-radius:8px;padding:24px;color:var(--w-muted)}.w-content-pad{padding:24px 0}.w-stack{display:flex;flex-direction:column;gap:16px;min-width:0}.w-scroll-x{overflow:auto;max-width:100%}
@container dsh-workbench (max-width:1000px){.w-editor-grid{grid-template-columns:160px minmax(0,1fr)}.w-editor-inspector{grid-column:1/-1;border-inline-start:0;border-top:1px solid var(--w-border)}.w-header-actions{max-width:60%}.w-split{grid-template-columns:minmax(240px,32%) minmax(0,1fr)}}
@container dsh-workbench (max-width:760px){.w-page-header{gap:14px;flex-wrap:wrap;padding-bottom:18px}.w-heading{flex:1;min-width:170px}.dshw h1{font-size:24px}.w-header-actions{max-width:100%;justify-content:flex-start}.w-subtitle{font-size:13px}.w-tabs{gap:12px}.dshw .w-tabs>button{padding:10px 4px 12px}.w-split{display:block;min-height:360px}.w-split[data-selected=false]>.w-detail{display:none}.w-split[data-selected=true]>.w-master{display:none}.w-master{border-inline-end:0}.w-detail{padding:20px 0}.w-back{display:inline-flex!important;align-self:flex-start;margin:0 0 16px!important}.w-detail h2{font-size:22px}.w-master-toolbar{padding:16px 0}.dshw .w-row-button{padding:16px 10px}.w-detail-footer{position:static}.w-detail-footer .w-muted{flex-basis:100%}.w-editor-grid{display:flex;flex-direction:column}.w-editor-list{border-inline-end:0;border-bottom:1px solid var(--w-border);padding:16px 0}.w-editor-canvas{padding:16px 0;background:var(--w-bg)}.w-editor-inspector{padding:20px 0}.w-dialog-header,.w-dialog-body{padding:16px}.w-button{min-height:40px}.w-definition{grid-template-columns:80px minmax(0,1fr)}}
@media(max-width:700px){.w-page[data-main=true]{padding:calc(16px + var(--dsh-frame-top-clearance,0px)) 16px 0 max(16px,var(--dsh-frame-leading-clearance,0px))}.w-overlay{padding:8px}.w-dialog{width:100%}}
@media(prefers-reduced-motion:reduce){.dshw *,.dshw *:before{scroll-behavior:auto!important;transition:none!important;animation:none!important}}
`;
  function Styles() { return h('style', null, styles); }
  return { Icon, Button, IconButton, Page, Tabs, Status, Empty, Split, Row, Search, Switch, Dialog, Styles, register, styles };
}

/* One update control per plugin. Only transport, idle guards and installation
 * coordination are shared; no global update page or update-all action exists. */
function __stardustUpdatesGuards() {
  const key = Symbol.for('stardustlc.plugin-updates.guards.v1');
  return globalThis[key] ||= { values: new Map(), listeners: new Set(), viewListeners: new Set(), clients: new Set() };
}
function __stardustUpdatesGuard(React, name, { dirty = false, busy = false, retainOnClose = false } = {}) {
  const token = React.useRef(null);
  if (!token.current) token.current = {};
  React.useLayoutEffect(() => {
    const pool = __stardustUpdatesGuards();
    if (!dirty && !busy) for (const [key, value] of pool.values) if (value.name === name && value.orphan) pool.values.delete(key);
    pool.values.set(token.current, { name, dirty: !!dirty, busy: !!busy, retainOnClose, orphan: false });
    for (const listener of pool.listeners) listener();
  }, [name, !!dirty, !!busy, retainOnClose]);
  React.useEffect(() => () => {
    const pool = __stardustUpdatesGuards(), value = pool.values.get(token.current);
    if (value?.retainOnClose && (value.dirty || value.busy)) value.orphan = true;
    else pool.values.delete(token.current);
    for (const listener of pool.listeners) listener();
  }, []);
}
function __StardustPluginUpdatesFooter({ React, name }) {
  const [, render] = React.useState(0), pool = __stardustUpdatesGuards();
  React.useEffect(() => { const fn = () => render(value => value + 1); pool.viewListeners.add(fn); return () => pool.viewListeners.delete(fn); }, []);
  const client = [...pool.clients].find(client => typeof client.Footer === 'function' && client.has(name));
  if (!client) return null;
  return React.createElement(client.Footer, { name });
}
function __stardustUpdatesFooter(React, name) {
  return React.createElement(__StardustPluginUpdatesFooter, { key: 'plugin-updates', React, name });
}
function __stardustUpdatesInlinePage(React, element, name) {
  return React.cloneElement(element, null, element.props.children, __stardustUpdatesFooter(React, name));
}
function __stardustUpdatesDetailName(subject, rows) {
  if (!subject || !['bundle', 'row'].includes(subject.kind)) return null;
  if (subject.kind === 'row' && subject.pkg?.name === '@stardustlc/dsh-suite') {
    const component = rows.find(row => row.bundledBy === subject.pkg.name && (subject.row?.moduleName === row.name || subject.row?.moduleName?.startsWith(row.name + '/')));
    if (component) return component.name;
  }
  return rows.some(row => row.name === subject.pkg?.name) ? subject.pkg.name : null;
}
function __stardustUpdatesNativeFormState(document) {
  let dirty = false, busy = false;
  for (const scope of document.querySelectorAll('[data-plugin-detail],[data-plugin-row-detail]')) for (const button of scope.querySelectorAll('button')) {
    if (!button.getClientRects().length || button.closest('.plugin-updates-footer')) continue;
    const label = (button.getAttribute('aria-label') || button.textContent || '').trim();
    if (/^(?:正在保存|保存中|Saving)(?:[.…\s]|$)/i.test(label) || button.getAttribute('aria-busy') === 'true') busy = true;
    if (!button.disabled && button.getAttribute('aria-disabled') !== 'true' && /^(?:保存(?:更改|设置|配置)?|Save(?: changes| settings| configuration)?)(?:\s+(?:Ctrl|⌘|Enter|↵).*)?$/i.test(label)) dirty = true;
  }
  return { dirty, busy };
}
function __stardustUpdatesDisplayRows(next, known) {
  for (const row of next.rows) known.set(row.name, row);
  if (!['verifying', 'installing', 'cancelling', 'unknown', 'restore-failed'].includes(next.job?.state)) return next;
  const rows = [...next.rows];
  for (const row of known.values()) if ((row.name === next.job.name || row.bundledBy === next.job.name) && !rows.some(item => item.name === row.name)) rows.push({ ...row, updating: true });
  return { ...next, rows };
}
function __stardustUpdatesSuiteRows(next, participants) {
  // The official manager lists top-level dependencies, not Suite's transitive
  // components. Project active, build-identified clients for display only.
  // Installation and preferences still use the real Suite row from the host.
  const suiteUpdating = next.job?.name === '@stardustlc/dsh-suite' && ['verifying', 'installing', 'cancelling', 'unknown', 'restore-failed'].includes(next.job?.state);
  const suite = next.rows.find(row => row.name === '@stardustlc/dsh-suite' && (row.enabled || suiteUpdating));
  if (!suite) return next;
  const rows = [...next.rows], names = new Set(rows.map(row => row.name));
  for (const item of participants) if (item.suiteComponent && item.packageVersion && item.label && !names.has(item.name)) {
    names.add(item.name);
    rows.push({ name: item.name, version: item.packageVersion, enabled: true, sourceKind: 'suite', loadError: false, label: item.label, labelEn: item.labelEn, bundledBy: suite.name });
  }
  return { ...next, rows };
}
function __stardustUpdatesWrap(definition, participant) {
  return { ...definition, factory(require) {
    const original = definition.factory(require);
    if (!original || typeof original !== 'object') return original;
    const React = require('react');
    return { ...original, apply(ctx, ...args) {
      const result = original.apply?.call(this, ctx, ...args);
      // The optional alpha.3 slot stays dormant in older hosts; its scoped
      // injection unregisters naturally when the plugin is unloaded.
      if (participant.iconData && participant.sectionIds?.length && typeof ctx.inject === 'function') ctx.inject(['slots'], host => {
        for (const id of new Set(participant.sectionIds)) host.slots.inject('settings.section.icon', () => host.slots.register({ name: 'settings.section.icon', id }, function PluginSettingsIcon({ size = 20 }) {
          return React.createElement('img', { src: participant.iconData, alt: '', 'aria-hidden': true, width: size, height: size, style: { objectFit: 'contain', display: 'block', flexShrink: 0 } });
        }));
      });
      if (typeof ctx.inject === 'function') ctx.inject(['slots', 'locale', 'remote', 'remote.pluginManager'], host => __stardustUpdatesJoin(host, React, require, participant));
      return result;
    } };
  } };
}
function __stardustUpdatesJoin(host, React, require, participant) {
  const key = Symbol.for('stardustlc.plugin-updates.client.v1'), pools = globalThis[key] ||= new WeakMap(), root = host.root || host;
  if (typeof root.plugin !== 'function') return;
  let record = pools.get(root);
  if (!record) {
    record = { refs: new Map(), timer: null, version: participant.version, alive: true, hold: false, uiRevision: 8, migration: Promise.resolve() };
    pools.set(root, record);
    __stardustUpdatesActivate(record, pools, root, React, require);
  } else if ((record.uiRevision || 0) < 8 && !record.upgrading) {
    // An earlier loaded participant may still own an older client revision. Keep
    // its references and draft guards, wait for any admitted install, then
    // replace that one client fiber instead of running two window heartbeats.
    const shared = record;
    const previousMigration = record.migration;
    record.upgrading = record.migration = Promise.resolve(previousMigration).then(async () => {
      while (shared.alive && shared.hold) await new Promise(resolve => setTimeout(resolve, 500));
      if (!shared.alive || !shared.refs.size) return;
      await shared.fiber?.dispose?.();
      if (!shared.refs.size) return;
      shared.alive = true; shared.uiRevision = 8; pools.set(root, shared);
      __stardustUpdatesActivate(shared, pools, root, React, require);
    }).catch(() => { /* The original page remains usable if host disposal fails. */ });
  }
  clearTimeout(record.timer);
  const ref = {}; record.refs.set(ref, participant);
  host.effect(() => () => {
    record.refs.delete(ref);
    const stop = () => {
      if (record.refs.size || !record.alive) return;
      if (record.hold) { record.timer = setTimeout(stop, 1000); return; }
      record.alive = false; Promise.resolve(record.fiber?.dispose?.()).catch(() => {});
    };
    if (!record.refs.size) record.timer = setTimeout(stop, 1000);
  });
}
function __stardustUpdatesActivate(shared, pools, root, React, require) {
  shared.fiber = root.plugin({ name: 'stardustlc-plugin-updates-client', inject: ['slots', 'locale', 'remote', 'remote.pluginManager'], apply(ctx) {
    const client = __stardustUpdatesClient(ctx, React, require, shared);
    ctx.effect(() => () => { shared.alive = false; client.dispose(); if (pools.get(root) === shared) pools.delete(root); });
  } });
  Promise.resolve(shared.fiber).catch(() => { shared.alive = false; if (pools.get(root) === shared) pools.delete(root); });
}
function __stardustUpdatesClient(ctx, React, require, shared) {
  const h = React.createElement, W = createWorkbenchUI(React), route = new URL('api/stardustlc/plugin-updates', document.baseURI);
  const { useState, useEffect, useRef } = React, id = crypto.randomUUID(), listeners = new Set(), pool = __stardustUpdatesGuards(), requests = new Set(), notified = new Set(), knownRows = new Map();
  let alive = true, registered = false, state = null, lastInteraction = Date.now(), inPoll = false, manualOperation = false, legacyHint = null;
  const language = () => String(ctx.locale?.getSnapshot?.().active || '').startsWith('en') ? 'en' : 'zh';
  const t = (zh, en) => language() === 'en' ? en : zh;
  const REPOS = { 'dsh-calendar': 'dsh-calendar', 'dsh-cite': 'dsh-cite', 'dsh-code-security': 'dsh-code-security', 'dsh-codex-port': 'dsh-codex-port', 'deepseek-computer-use': 'deepseek-computer-use', 'dsh-dingtalk': 'dsh-dingtalk', '@stardustlc/dsh-docker': 'dsh-docker', '@stardustlc/dsh-dream': 'dsh-dream', 'dsh-email': 'dsh-email', 'dsh-ffmpeg': 'dsh-ffmpeg', 'dsh-flakefinder': 'dsh-flakefinder', 'dsh-hyperframes': 'dsh-hyperframes', 'dsh-minimal-ptc': 'dsh-minimal-ptc', 'dsh-ppt': 'dsh-ppt', 'dsh-remotion': 'dsh-remotion', '@stardustlc/dsh-review': 'dsh-review', 'dsh-rss': 'dsh-rss', 'dsh-slack': 'dsh-slack', 'dsh-sql': 'dsh-sql', '@stardustlc/dsh-suite': 'dsh-suite', 'dsh-voice': 'dsh-voice' };
  const repoUrl = pkg => Object.hasOwn(REPOS, pkg) ? 'https://github.com/STARDUSTLC666/' + REPOS[pkg] : null;
  const preferences = name => state?.preferences.packages[name] || { checkEnabled: true, autoInstall: false, autoScope: 'compatible', deferredUntil: 0, ignoredVersion: null };
  const originalRow = name => state?.rows.find(row => row.name === name);
  const rowFor = name => { const row = originalRow(name); return row?.bundledBy ? originalRow(row.bundledBy) : row; };
  const activeJob = () => ['verifying', 'installing', 'cancelling'].includes(state?.job?.state);
  function notify() { shared.hold = manualOperation || activeJob(); for (const listener of listeners) listener(); for (const listener of pool.viewListeners) listener(); }
  async function api(body = { action: 'state' }) {
    const controller = new AbortController(); requests.add(controller);
    const timeout = setTimeout(() => controller.abort(), body.action === 'check' ? 95000 : 45000);
    try {
      const response = await fetch(route, { method: 'POST', credentials: 'same-origin', cache: 'no-store', signal: controller.signal, headers: { 'content-type': 'application/json', 'x-stardustlc-updates': '1' }, body: JSON.stringify(body) });
      let data; try { data = await response.json(); } catch { throw new Error('service-unavailable'); }
      if (!response.ok || !data.ok) throw new Error(response.status === 403 ? 'owner-required' : data.code || 'service-unavailable');
      return data.value;
    } catch (error) { if (error?.name === 'AbortError') throw new Error('service-unavailable'); throw error; }
    finally { clearTimeout(timeout); requests.delete(controller); }
  }
  function pageState(manual = manualOperation) {
    const values = [...pool.values.values()], nativeForm = __stardustUpdatesNativeFormState(document);
    const dialog = [...document.querySelectorAll('[role="dialog"],dialog[open]')].some(node => node.getClientRects().length && !(manual && (node.closest('.plugin-updates-footer,.plugin-updates-reminder') || node.querySelector('.plugin-updates-footer,.plugin-updates-reminder'))));
    return { action: 'heartbeat', id, dirty: nativeForm.dirty || values.some(value => value.dirty), busy: nativeForm.busy || values.some(value => value.busy) || dialog, idleForMs: Math.min(86400000, Math.max(0, Date.now() - lastInteraction)) };
  }
  const heartbeat = () => api(pageState());
  function interaction() { lastInteraction = Date.now(); if (registered && alive) void heartbeat().catch(() => {}); }
  const guardChanged = () => { if (registered && alive) void heartbeat().catch(() => {}); };
  for (const event of ['pointerdown', 'keydown', 'input']) document.addEventListener(event, interaction, { capture: true, passive: true });
  pool.listeners.add(guardChanged);
  const close = () => { void fetch(route, { method: 'POST', credentials: 'same-origin', keepalive: true, headers: { 'content-type': 'application/json', 'x-stardustlc-updates': '1' }, body: JSON.stringify({ action: 'client-close', id }) }).catch(() => {}); };
  window.addEventListener('pagehide', close);
  async function refresh() { const next = await api(); if (alive) { state = __stardustUpdatesDisplayRows(__stardustUpdatesSuiteRows(next, shared.refs.values()), knownRows); notify(); } return next; }
  const STALE_CHECK_MS = 30 * 60 * 1000, STALE_RETRY_MS = 5 * 60 * 1000, staleChecks = new Map(), staleInFlight = new Set();
  function refreshIfStale(row) {
    if (!alive || !row || row.sourceKind !== 'registry' || row.bundledBy || !row.available || row.updating) return;
    const now = Date.now();
    if (row.checkedAt && now - row.checkedAt <= STALE_CHECK_MS) return;
    if (staleInFlight.has(row.name) || now - (staleChecks.get(row.name) ?? -Infinity) < STALE_RETRY_MS) return;
    staleChecks.set(row.name, now);
    staleInFlight.add(row.name);
    void (async () => {
      try { await api({ action: 'check', name: row.name }); await refresh(); }
      catch { /* Offline or transient errors stay silent and throttled by staleChecks. */ }
      finally { staleInFlight.delete(row.name); }
    })();
  }
  function useSnapshot() {
    const [, render] = useState(0);
    useEffect(() => { const fn = () => render(value => value + 1); listeners.add(fn); const stop = ctx.locale?.subscribe?.(fn); return () => { listeners.delete(fn); stop?.(); }; }, []);
    return state;
  }
  function message(code) {
    return ({
      'page-dirty': t('有未保存的修改。请先保存或放弃修改，再更新。', 'Save or discard unsaved changes before updating.'),
      'page-busy': t('有页面操作或对话框尚未结束，请完成后再试。', 'Finish the active page operation or close its dialog, then retry.'),
      'page-not-ready': t('还有窗口状态未确认，或旧版插件尚未提供状态保护。请刷新相关窗口，必要时先手动更新旧版插件。', 'A window state is unknown or an older plugin lacks state protection. Refresh the affected windows and manually update legacy plugins if needed.'),
      busy: t('DSH 正在执行任务或安装，请等操作结束。', 'DSH is running a task or installation. Wait for it to finish.'),
      'activity-unknown': t('无法确认任务是否空闲，已暂停安装。', 'Installation paused because task activity is unknown.'),
      'restart-required': t('更新服务需要重启后继续。请在方便时手动重启 DSH。', 'The updater needs a restart. Restart DSH manually when convenient.'),
      'operation-unconfirmed': t('上次安装未确认或恢复失败。请在官方插件管理中检查并修复，之后手动重启 DSH。', 'The last installation is unconfirmed or recovery failed. Check and repair it in native plugin management, then restart DSH manually.'),
      'check-first': t('检查结果已过期，请重新检查。', 'This check expired. Check again.'),
      'release-changed': t('发现更新的发布版本（或发布信息已更新），已刷新至最新状态，请再次确认安装。', 'A newer release or updated metadata was found and refreshed; confirm again to install.'),
      'preferences-conflict': t('另一个窗口修改了偏好，已刷新，请重试。', 'Preferences changed in another window. They have been refreshed; retry.'),
      'preferences-unreadable': t('更新偏好文件无法读取，自动安装已关闭。请检查当前 profile 的 stardustlc-plugin-updates.json。', 'Preferences could not be read. Automatic installation is off. Check stardustlc-plugin-updates.json in this profile.'),
      'no-update': t('版本已变化或暂不兼容，请重新检查。', 'The version changed or is incompatible. Check again.'),
      'source-not-registry': t('本地源码、Git 等安装，请通过原安装方式更新。', 'Update local, Git and other external sources through their original installation method.'),
      'managed-by-suite': t('这个插件随 Suite 安装，通过 Suite 更新。', 'This plugin was installed through Suite and is updated through Suite.'),
      'owner-required': t('只有 profile 拥有者能管理更新。', 'Only the profile owner can manage updates.'),
      'version-mismatch': t('宿主装入的版本与目标不同。请重新检查版本和软件源策略。', 'The installed version differs from the target. Check the release and registry policy.'),
      'unexpected-package': t('宿主装入的包或版本与目标不同。请检查版本和软件源策略。', 'The installed package or version differed from the target. Check the release and registry policy.'),
      'version-unconfirmed': t('尚未确认新版已加载，请在插件详情中检查当前版本。', 'The new version could not be confirmed. Check the installed version in plugin details.'),
      'build-blocked': t('构建脚本等待批准。请查看原生插件管理中的安装提示。', 'Build scripts await approval. Review the install details in native plugin management.'),
      'bundle-in-use': t('宿主暂时无法热卸载旧版（通常因本轮刚更新过其他共用底层依赖的插件，内存路径待刷新；或同时启用了包含此组件的组合包）：直接手动重启一次 DSH 即可继续更新，无需逐个停用插件。', 'The host cannot hot-unload the previous version right now (usually because another plugin sharing dependencies was updated earlier in this session, or a bundle containing this component is also active): restart DSH once and retry without disabling plugins one by one.'),
      'already-installed': t('该包已在当前配置中，请刷新或重启 DSH 后查看当前版本。', 'This package is already present in the profile; refresh or restart DSH to inspect its version.'),
      'incompatible-version': t('目标版本与当前运行的 DSH 版本不兼容。', 'The target version is incompatible with the running DSH version.'),
      'stop-profile': t('当前配置未启用热重载，需关闭 DSH 后再通过命令行更新。', 'This profile runs without hot reload; stop DSH and update via CLI.'),
      'not-removable': t('此内置或受保护插件不支持在此处移除替换。', 'This built-in or protected bundle cannot be replaced here.'),
    })[code] || t('操作未完成，请刷新后重试。DSH 不会因此自动重启。', 'The operation could not be completed. Refresh and retry. DSH will not restart automatically.');
  }
  // releaseOf() keeps the failing engine/peer range check as a stable code; say which
  // environment has to change instead of only reporting that the release is incompatible.
  function requirement(release) {
    return ({
      'dsh-version': t('需要换成与该版本匹配的 DSH 本体', 'it needs a different DSH version'),
      'node-version': t('需要换成与该版本匹配的 Node.js', 'it needs a different Node.js version'),
      deprecated: t('作者已把这个版本标记为弃用', 'the author marked this release as deprecated'),
      'not-bundle': t('这个版本不是可加载的 DSH 插件包', 'this release is not a loadable DSH plugin bundle'),
    })[release?.reason] || t('发布元数据的兼容范围与当前环境不符', 'its published compatibility range does not match this environment');
  }
  function jobLabel(job) {
    if (job.state === 'installing') {
      const phase = ({
        checking: t('宿主正在检查版本', 'Host checking release'),
        removing: t('正在卸载旧版', 'Unloading the previous version'),
        applying: t('正在加载新版', 'Loading the new version'),
        restoring: t('正在恢复旧版', 'Restoring the previous version'),
      })[job.phase];
      if (phase) return phase;
    }
    return ({ verifying: t('正在核对版本', 'Verifying release'), installing: t('正在安装', 'Installing'), cancelling: t('正在请求取消', 'Requesting cancellation'), complete: t('已更新', 'Updated'), 'restart-required': t('已安装，等待你手动重启', 'Installed; manual restart needed'), restored: t('更新未成功，已恢复原版本', 'Update failed; previous version restored'), 'restore-failed': t('恢复未成功，请检查官方插件管理', 'Recovery failed; check native plugin management'), unknown: t('结果未确认，请检查官方插件管理', 'Result unconfirmed; check native plugin management'), cancelled: t('已取消', 'Cancelled'), failed: t('更新未成功', 'Update failed') })[job.state] || job.state;
  }
  const FOOTER_CSS = '.plugin-updates-footer{box-sizing:border-box;flex-shrink:0;margin-top:16px;padding-top:14px;border-top:var(--dsh-control-border-width,0.5px) solid var(--dsw-alias-border-l2,var(--dsw-alias-border-l3,#e5e7eb));min-width:0;max-width:100%;color:var(--dsw-alias-label-primary,#202124)}'
    + '.dshw.plugin-updates-footer.is-inline{display:block!important;width:100%!important;max-width:100%!important;margin-block:auto 0!important;margin-inline:0!important;padding:6px 14px!important;border-top:var(--dsh-control-border-width,0.5px) solid var(--dsw-alias-border-l2,var(--dsw-alias-border-l3,#e5e7eb));background:var(--dsw-alias-bg-layer-1,var(--w-soft,#f7f8fa));font-size:12px;line-height:1.45}'
    + '.plugin-updates-footer .updates-bar{display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:6px 12px;min-block-size:28px;min-width:0}'
    + '.plugin-updates-footer .updates-bar-info,.plugin-updates-footer .updates-bar-actions,.plugin-updates-footer .updates-head-actions,.plugin-updates-footer .updates-title-row{display:flex;align-items:center;flex-wrap:wrap;gap:6px 8px;min-width:0}'
    + '.plugin-updates-footer .updates-head{display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px 12px}'
    + '.plugin-updates-footer .updates-compact-bar{display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:6px 12px}'
    + '.plugin-updates-footer .updates-compact-bar>.updates-options{margin-top:0;min-width:0}'
    + '.plugin-updates-footer .updates-compact-bar>.updates-options[open]{flex:1 1 100%}'
    + '.plugin-updates-footer h2{font-size:13.5px;line-height:1.4;margin:0;font-weight:600}'
    + '.plugin-updates-footer .updates-pill{display:inline-flex;align-items:center;padding:1px 7px;border-radius:999px;font-size:11px;font-weight:600;line-height:1.5;background:var(--dsw-alias-bg-layer-2,var(--w-soft,#eef1f6));color:var(--dsw-alias-label-secondary,#657080)}'
    + '.plugin-updates-footer .updates-pill.is-accent{background:color-mix(in srgb,var(--w-accent,#4f6bdb) 14%,transparent);color:var(--w-accent,#4f6bdb)}'
    + '.plugin-updates-footer .updates-pill.is-error{background:color-mix(in srgb,var(--dsw-alias-state-error-primary,#ad3636) 14%,transparent);color:var(--dsw-alias-state-error-primary,#ad3636)}'
    + '.plugin-updates-footer .updates-mono,.plugin-updates-footer .updates-subtitle,.plugin-updates-footer .updates-version{font:12px/1.5 ui-monospace,SFMono-Regular,Consolas,monospace;overflow-wrap:anywhere;margin:0}'
    + '.plugin-updates-footer .updates-badge{padding:1px 6px;border-radius:5px;background:var(--dsw-alias-bg-layer-2,var(--w-soft,#eef1f6));color:var(--dsw-alias-label-secondary,#657080)}'
    + '.plugin-updates-footer .updates-meta-line,.plugin-updates-footer .updates-note{margin:3px 0 0;font-size:12px;line-height:1.55}'
    + '.plugin-updates-footer .updates-inline-msg.is-error{color:var(--dsw-alias-state-error-primary,#ad3636);font-size:12px}'
    + '.plugin-updates-footer .w-button.is-sm{min-block-size:26px;min-inline-size:26px;min-height:26px;padding:3px 9px;font-size:12px;gap:5px;border-radius:6px}'
    + '.plugin-updates-footer .updates-options{margin-top:8px}'
    + '.plugin-updates-footer .updates-options>summary{cursor:pointer;display:inline-flex;align-items:center;gap:0.55ch;min-block-size:24px;font-size:12px;line-height:1.5;font-weight:500;color:var(--dsw-alias-label-secondary,#657080);list-style:none}'
    + '.plugin-updates-footer .updates-options>summary:after{display:none}'
    + '.plugin-updates-footer .updates-options>summary::before{content:"";inline-size:6px;block-size:6px;flex-shrink:0;border-inline-end:1.5px solid currentColor;border-block-end:1.5px solid currentColor;rotate:-45deg}'
    + '.plugin-updates-footer .updates-options>summary:dir(rtl)::before{rotate:135deg}'
    + '.plugin-updates-footer .updates-options[open]>summary::before{rotate:45deg}'
    + '.plugin-updates-footer .updates-options>summary:focus-visible{outline:2px solid var(--dsw-focus-ring-color,#6b79df);outline-offset:3px;border-radius:4px}'
    + '.plugin-updates-footer details::details-content{interpolate-size:allow-keywords;overflow:clip;contain:layout}'
    + '.plugin-updates-footer details:not([open])::details-content{block-size:0}'
    + '.plugin-updates-footer .updates-settings{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,250px),1fr));gap:14px;padding:10px 0 2px}'
    + '.plugin-updates-footer>.w-section{margin:8px 0 0;padding:0;border:0}'
    + '.plugin-updates-footer .w-toolbar{margin-top:8px!important}'
    + '.plugin-updates-footer .w-switch-label{max-width:100%;gap:12px;align-items:flex-start}'
    + '.plugin-updates-footer .w-switch-track{flex-shrink:0}'
    + '.plugin-updates-footer .updates-notes{margin-top:8px;padding:10px 12px;border:1px solid var(--dsw-alias-border-l3,#e5e7eb);border-radius:8px;background:var(--dsw-alias-bg-base,var(--w-bg,#fff))}'
    + '.plugin-updates-footer .updates-notes pre{white-space:pre-wrap;overflow-wrap:anywhere;max-height:220px;overflow:auto;margin:6px 0;padding:10px;font:12px/1.65 ui-monospace,monospace}'
    + '.plugin-updates-footer .updates-notes pre code{font:inherit;background:transparent;padding:0}'
    + '.plugin-updates-footer .updates-links{display:flex;flex-wrap:wrap;align-items:center;gap:4px 14px;margin-top:10px;padding-top:8px;border-top:1px dashed var(--dsw-alias-border-l3,#e5e7eb);font-size:12px;line-height:1.5;color:var(--dsw-alias-label-secondary,#657080)}'
    + '.plugin-updates-footer .updates-links a{color:inherit;text-decoration:none;display:inline-flex;align-items:center;min-block-size:24px;gap:4px}'
    + '.plugin-updates-footer .updates-links a:hover{color:var(--dsw-alias-label-primary,#202124);text-decoration:underline}'
    + '.plugin-updates-footer .updates-links a:focus-visible{outline:2px solid var(--dsw-focus-ring-color,#6b79df);outline-offset:3px;border-radius:4px}'
    + '.plugin-updates-footer .w-overlay,.plugin-updates-reminder .w-overlay{z-index:1002}'
    + '.plugin-updates-reminder{position:fixed;inset-inline-end:16px;inset-block-end:16px;z-index:998;box-sizing:border-box;width:min(410px,calc(100vw - 32px));padding:11px 13px;border-radius:10px;border:var(--dsh-control-border-width,1px) solid var(--dsw-alias-border-l2,#d8dee9);background:var(--dsw-alias-bg-base,#fff);color:var(--dsw-alias-label-primary,#202124);box-shadow:0 8px 24px rgba(15,23,42,.12);font-size:12px;line-height:1.5}'
    + '.plugin-updates-reminder .reminder-head{display:flex;align-items:flex-start;justify-content:space-between;gap:8px}'
    + '.plugin-updates-reminder .reminder-title{display:flex;align-items:center;flex-wrap:wrap;gap:6px;min-width:0;font-weight:600;font-size:12.5px}'
    + '.plugin-updates-reminder .reminder-close{appearance:none;border:0;background:transparent;color:var(--dsw-alias-label-secondary,#657080);cursor:pointer;padding:2px 5px;border-radius:5px;font-size:14px;line-height:1}'
    + '.plugin-updates-reminder .reminder-close:hover{background:var(--dsw-alias-bg-layer-2,#eef1f6);color:var(--dsw-alias-label-primary,#202124)}'
    + '.plugin-updates-reminder .reminder-actions{display:flex;align-items:center;flex-wrap:wrap;gap:6px;margin-top:8px}'
    + '.plugin-updates-reminder .w-button.is-sm{min-block-size:26px;min-inline-size:26px;min-height:26px;padding:3px 9px;font-size:12px;gap:5px;border-radius:6px}'
    + '.plugin-updates-reminder .updates-pill{display:inline-flex;align-items:center;padding:1px 7px;border-radius:999px;font-size:11px;font-weight:600;line-height:1.5;background:color-mix(in srgb,var(--w-accent,#4f6bdb) 14%,transparent);color:var(--w-accent,#4f6bdb)}'
    + '.plugin-updates-reminder .updates-pill.is-error{background:color-mix(in srgb,var(--dsw-alias-state-error-primary,#ad3636) 14%,transparent);color:var(--dsw-alias-state-error-primary,#ad3636)}'
    + '.plugin-updates-reminder .updates-mono{font:12px/1.5 ui-monospace,SFMono-Regular,Consolas,monospace;overflow-wrap:anywhere}'
    + '.plugin-updates-reminder .updates-notes{margin-top:8px;padding:8px 10px;border:1px solid var(--dsw-alias-border-l3,#e5e7eb);border-radius:7px;background:var(--dsw-alias-bg-layer-1,#f7f8fa)}'
    + '.plugin-updates-reminder .updates-notes pre{white-space:pre-wrap;overflow-wrap:anywhere;max-height:160px;overflow:auto;margin:4px 0;padding:6px;font:11.5px/1.6 ui-monospace,monospace}'
    + '.plugin-updates-footer .updates-auto-nudge,.plugin-updates-reminder .updates-auto-nudge{display:flex;align-items:center;flex-wrap:wrap;gap:6px 10px;margin-top:6px;font-size:12px;color:var(--dsw-alias-label-secondary,#657080)}'
    + '@media(pointer:coarse){.plugin-updates-footer .w-button.is-sm{min-block-size:32px;min-height:32px;padding:5px 11px}}'
    + '@media(prefers-reduced-motion:no-preference){.plugin-updates-footer .updates-options>summary::before{transition:rotate .18s ease}.plugin-updates-footer details::details-content{transition:block-size .22s ease,content-visibility .22s ease allow-discrete}}'
    + '@media(max-width:600px){.plugin-updates-footer .updates-head{gap:8px}.plugin-updates-footer .w-toolbar{gap:6px;flex-wrap:wrap}.plugin-updates-footer .w-button{max-width:100%}}';
  function FooterFrame({ name, label, inline = false, supplement = false, head, children }) {
    return h('section', { className: 'dshw plugin-updates-footer' + (inline ? ' is-inline' : ''), 'data-plugin-update-footer': name, 'aria-label': label + (supplement ? t(' · 自动更新与反馈', ' · Auto-update and feedback') : t(' · 版本与更新', ' · Version and updates')) },
      h('style', null, W.styles),
      h('style', null, FOOTER_CSS),
      head, children);
  }
  function Panel({ name, inline = false }) {
    const snapshot = useSnapshot(), [error, setError] = useState(''), [working, setWorking] = useState(false), [checking, setChecking] = useState(false), [dialog, setDialog] = useState(null), [selectedVersion, setSelectedVersion] = useState(null), [notes, setNotes] = useState(null), [notesOpen, setNotesOpen] = useState(false), [loadingNotes, setLoadingNotes] = useState(false), [dismissedJobId, setDismissedJobId] = useState(null);
    const seenActiveJob = useRef ? useRef(null) : { current: null };
    const row = rowFor(name), original = originalRow(name), target = row?.name || name, prefs = preferences(target), job = snapshot?.job?.name === target ? snapshot.job : null;
    if (job && ['verifying', 'installing', 'cancelling'].includes(job.state)) seenActiveJob.current = job.id;
    const panelStaleTarget = !!snapshot && !!row && !!original && (!inline || (row.sourceKind === 'registry' && row.available && prefs.deferredUntil <= Date.now() && prefs.ignoredVersion !== row.release?.version));
    useEffect(() => { if (panelStaleTarget && !activeJob()) refreshIfStale(row); }, [panelStaleTarget, row?.name, row?.available, row?.checkedAt]);
    async function perform(callback) { setError(''); setWorking(true); try { await callback(); await refresh(); } catch (error) { setError(error.message); await refresh().catch(() => {}); } finally { setWorking(false); } }
    async function save(changes, consent) { await api({ action: 'preferences', name: target, revision: state.preferences.revision, changes, consent }); }
    async function check() { setError(''); setChecking(true); try { staleChecks.set(target, Date.now()); await api({ action: 'check', name: target }); await refresh(); } catch (error) { setError(error.message); } finally { setChecking(false); } }
    async function runOperation(request) {
      setDialog(null); manualOperation = true; notify();
      setError(''); setWorking(true);
      try {
        try {
          await heartbeat();
          const started = await api(request);
          seenActiveJob.current = started.id;
          while (alive) {
            await new Promise(resolve => setTimeout(resolve, 800)); await heartbeat(); await refresh();
            if (state.job?.id !== started.id) throw new Error('operation-unconfirmed');
            if (!activeJob()) break;
          }
          await refresh();
        } finally { manualOperation = false; notify(); }
      } catch (err) {
        setError(err.message);
        if (request.action === 'install' && ['check-first', 'release-changed'].includes(err?.message)) {
          staleChecks.set(target, Date.now());
          await api({ action: 'check', name: target }).catch(() => {});
        }
        await refresh().catch(() => {});
      } finally { setWorking(false); }
    }
    async function showNotes() {
      if (notesOpen) { setNotesOpen(false); return; }
      setNotesOpen(true); setNotes(null); setLoadingNotes(true); setError('');
      try { setNotes(await api({ action: 'notes', name: target, version: row.release.version })); } catch (error) { setError(error.message); } finally { setLoadingNotes(false); }
    }
    if (inline && (!snapshot || !row || !original)) return null;
    if (!snapshot) return h('p', { className: 'dshw w-muted' }, t('正在读取更新状态…', 'Loading update status…'));
    if (!row || !original) return h(W.Status, null, t('此插件尚未安装或已从当前 profile 移除。', 'This plugin is not installed in the current profile.'));
    const title = language() === 'en' ? original.labelEn : original.label;
    const ownPage = pageState(true), unconfirmed = ['unknown', 'restore-failed'].includes(snapshot.job?.state);
    const staleWindows = (snapshot.pages.clients || []).some(client => !client.fresh);
    const pageBusy = ownPage.busy || (snapshot.pages.clients || []).some(client => client.id !== id && client.busy);
    const installLocked = working || activeJob() || unconfirmed || snapshot.updaterRestart || snapshot.preferenceError || !snapshot.activity.known
      || snapshot.activity.busy || snapshot.pages.dirty || ownPage.dirty || pageBusy || !snapshot.pages.known;
    const checkingThis = checking || snapshot.checkingNames?.includes(target);
    const managed = row.sourceKind === 'registry';
    const showUpdate = managed && row.available;
    const deferred = prefs.deferredUntil > Date.now();
    const ignored = !!row.release?.version && prefs.ignoredVersion === row.release.version;
    const actionableUpdate = showUpdate && !deferred && !ignored;
    const canConfirm = showUpdate && row.release?.version === selectedVersion && !installLocked && !row.loadError;
    const isSuite = target === '@stardustlc/dsh-suite';
    const jobResult = job?.outcome?.result;
    const jobReason = job ? job.reason || (jobResult?.pendingBuilds || jobResult?.failureKind === 'build-blocked' ? 'build-blocked' : jobResult?.error?.code) : null;
    const jobActiveThis = !!job && ['verifying', 'installing', 'cancelling'].includes(job.state);
    const canCancel = jobActiveThis && !['applying', 'restoring'].includes(job.phase);
    const jobAttentionThis = !!job && ['restart-required', 'restored', 'restore-failed', 'unknown', 'failed'].includes(job.state) && (unconfirmed || dismissedJobId !== job.id);
    const jobJustCompleted = !!job && job.state === 'complete' && seenActiveJob.current === job.id && dismissedJobId !== job.id;
    const canSuggestAuto = !!job && job.state === 'complete' && !jobReason && job.mode !== 'automatic' && (!prefs.autoInstall || prefs.autoScope !== 'compatible') && managed && !snapshot.preferenceError && dismissedJobId !== job.id;
    const inlineJobVisible = jobActiveThis || jobAttentionThis || jobJustCompleted;
    if (inline && !actionableUpdate && !inlineJobVisible && !working && !checking && !error && !dialog && !notesOpen) return null;
    const notesSection = notesOpen && h('section', { className: 'updates-notes', 'aria-label': t('更新记录', 'Release notes') },
      h('strong', null, target + ' · ' + (notes?.version || row.release?.version || '')),
      loadingNotes ? h('p', { className: 'w-muted updates-note' }, t('正在读取…', 'Loading…'))
        : notes?.text ? h('pre', { tabIndex: 0, role: 'region', 'aria-label': t('更新记录内容', 'Release notes content') }, h('code', null, notes.text))
        : h('p', { className: 'w-muted updates-note' }, t('未找到此版本的独立更新记录。', 'No separate notes were found for this version.')),
      notes?.url && h('a', { href: notes.url, target: '_blank', rel: 'noreferrer noopener' }, t('查看仓库更新记录', 'View repository changelog')));
    const windowsDialog = dialog === 'windows' && h(W.Dialog, { title: t('断开的窗口都已关闭？', 'Are the disconnected windows closed?'), closeLabel: t('关闭', 'Close'), onClose: () => setDialog(null) },
      h('div', { className: 'w-stack' }, h('p', null, t('只清除超过 45 秒未回应的其他窗口记录。请先确认它们已经关闭；仍在使用的窗口请保存修改并刷新。当前或仍在回应的窗口保护会保留。', 'Only other windows silent for over 45 seconds are cleared. Confirm that they are closed; save and refresh windows still in use. Current and responsive windows remain protected.')), h('div', { className: 'w-toolbar' }, h(W.Button, { onClick: () => setDialog(null) }, t('取消', 'Cancel')), h(W.Button, { onClick: () => { setDialog(null); void perform(() => api({ ...pageState(true), action: 'reconfirm-windows', confirmation: 'other-stale-windows-are-closed' })); } }, t('已关闭，重新确认状态', 'They are closed; reconfirm')))));
    const confirmDialog = ['automatic', 'install'].includes(dialog) && h(W.Dialog, { title: dialog === 'automatic' ? (isSuite ? t('允许 Suite 空闲时自动热更新？', 'Allow idle automatic updates for Suite?') : t('允许这个插件空闲时自动热更新？', 'Allow idle automatic updates for this plugin?')) : (isSuite ? t('确认更新 Suite 整包', 'Confirm Suite bundle update') : t('确认更新此插件', 'Confirm this plugin update')), closeLabel: t('关闭', 'Close'), onClose: () => setDialog(null) },
      dialog === 'automatic' ? h('div', { className: 'w-stack' }, h('p', null, (language() === 'en' ? row.labelEn : row.label) + ' · ' + target), isSuite && h('p', null, t('此处设置作用于 Suite 整包（包含 18 个组件）。独立安装的其他插件不受影响。', 'This setting applies to the whole Suite (including its 18 components). Other independently installed plugins are unaffected.')), h('p', null, t('你正在主动启用自动安装。只处理通过当前 DSH 与 Node 兼容性校验的稳定版本（含功能小版本与补丁，跨主版本仍需手动确认）；有任务、未保存修改、未知窗口或等待重启时暂停。', 'You are explicitly enabling automatic installation for compatible stable releases (minor and patch updates matching this DSH and Node runtime; major upgrades still require manual confirmation). Running tasks, unsaved changes, unknown windows or a pending restart pause it.')), h('p', null, t('支持热更新时原地重载，不会自动重启 DSH；其他插件不会跟着开启，可随时关闭。', 'Hot-reloads in place when supported and never restarts DSH automatically. Other plugins remain unchanged; turn it off anytime.')), h('div', { className: 'w-toolbar' }, h(W.Button, { onClick: () => setDialog(null) }, t('保持关闭', 'Keep off')), h(W.Button, { variant: 'primary', onClick: () => { setDialog(null); void perform(() => save({ checkEnabled: true, autoInstall: true, autoScope: 'compatible' }, 'enable-idle-compatible-updates')); } }, t('允许空闲自动热更新', 'Allow idle automatic updates')))) :
      h('div', { className: 'w-stack' },
        isSuite && h('p', null, t('此处操作的是 Suite 整包，包含 18 个组件。独立安装的其他插件不受影响。', 'This action applies to the whole Suite, including its 18 components. Other independently installed plugins are unaffected.')),
        h('p', { className: 'updates-version' }, target + ' · ' + row.version + ' → ' + selectedVersion),
        h('p', null, selectedVersion === row.release?.version ? t('Harness 会热更新并重新加载；需要手动重启时，更新区会显示宿主结果，停用状态会保留。', 'Harness hot-updates and reloads in place. If a manual restart is needed, it appears in the update result; disabled status is preserved.') : (showUpdate && row.release?.version ? message('release-changed') : message('check-first'))),
        h('div', { className: 'w-toolbar' }, h(W.Button, { onClick: () => setDialog(null) }, t('取消', 'Cancel')),
          showUpdate && row.release?.version && row.release.version !== selectedVersion
            ? h(W.Button, { variant: 'primary', disabled: installLocked || row.loadError, onClick: () => { setError(''); setSelectedVersion(row.release.version); } }, t('更新为 v', 'Use v') + row.release.version)
            : h(W.Button, { variant: 'primary', disabled: !canConfirm, onClick: () => runOperation({ action: 'install', name: target, version: selectedVersion, confirmation: 'update-installed-plugin' }) }, t('安装此版本', 'Install this version')))));
    const checkButton = variant => h(W.Button, { variant, className: 'is-sm', icon: 'refresh', disabled: checkingThis || !managed, onClick: check }, checkingThis ? t('正在检查…', 'Checking…') : isSuite ? t('检查整包更新', 'Check Suite updates') : t('检查更新', 'Check for updates'));
    const recheckButton = variant => h(W.Button, { variant, className: 'is-sm', icon: 'refresh', disabled: checkingThis || !managed, onClick: check }, checkingThis ? t('正在检查…', 'Checking…') : t('重新检查', 'Check again'));
    const primary = showUpdate
      ? h(W.Button, { variant: 'primary', className: 'is-sm', icon: 'download', disabled: installLocked || row.loadError, onClick: () => { setError(''); if (job && !jobActiveThis && !unconfirmed) setDismissedJobId(job.id); setSelectedVersion(row.release.version); setDialog('install'); } }, (isSuite ? t('更新 Suite 至 v', 'Update Suite to v') : t('更新至 v', 'Update to v')) + row.release.version)
      : managed ? checkButton() : null;
    if (inline) {
      const lockHint = unconfirmed ? message('operation-unconfirmed')
        : snapshot.updaterRestart ? message('restart-required')
        : snapshot.preferenceError ? message('preferences-unreadable')
        : (snapshot.pages.dirty || ownPage.dirty) ? t('请先保存修改后再更新', 'Save changes before updating')
        : (snapshot.activity.busy || pageBusy) ? t('当前任务或对话框结束后可更新', 'Finish active task or dialog to update')
        : (!snapshot.activity.known || !snapshot.pages.known) ? t('等待窗口状态确认', 'Waiting for window confirmation')
        : '';
      return h(FooterFrame, { name, label: title, inline: true, head: h('div', { className: 'updates-bar' },
        h('div', { className: 'updates-bar-info' },
          inlineJobVisible
            ? h(React.Fragment, null,
              h('span', { className: 'updates-pill' + (jobActiveThis ? ' is-accent' : ['failed', 'restore-failed', 'unknown', 'restored'].includes(job.state) ? ' is-error' : '') }, jobLabel(job)),
              job.to && h('span', { className: 'updates-mono' }, (isSuite ? 'dsh-suite ' : '') + job.from + ' → ' + job.to),
              jobReason && h('span', { className: 'updates-inline-msg is-error' }, message(jobReason)))
            : actionableUpdate ? h(React.Fragment, null,
              h('span', { className: 'updates-pill is-accent' }, isSuite ? t('Suite 新版本', 'Suite update') : t('有新版本', 'Update available')),
              h('span', { className: 'updates-mono' }, (isSuite ? 'dsh-suite ' : '') + 'v' + row.version + ' → v' + row.release.version),
              lockHint && h('span', { className: 'w-muted' }, '· ' + lockHint)) : null,
          error && h('span', { className: 'updates-inline-msg is-error', role: 'alert' }, message(error))),
        h('div', { className: 'updates-bar-actions' },
          staleWindows && actionableUpdate && h(W.Button, { variant: 'ghost', className: 'is-sm', onClick: () => setDialog('windows') }, t('确认已关闭窗口', 'Confirm closed windows')),
          canCancel && h(W.Button, { className: 'is-sm', disabled: job?.state === 'cancelling', onClick: () => perform(() => api({ action: 'cancel', id: job.id })) }, t('取消更新', 'Cancel update')),
          !jobActiveThis && error === 'check-first' && managed && recheckButton(actionableUpdate ? 'ghost' : 'primary'),
          !jobActiveThis && actionableUpdate && row.release && h(W.Button, { variant: 'ghost', className: 'is-sm', onClick: showNotes, 'aria-expanded': notesOpen }, t('更新记录', 'Release notes')),
          !jobActiveThis && actionableUpdate && h(W.Button, { variant: 'ghost', className: 'is-sm', disabled: working, onClick: () => perform(() => api({ action: 'later', name: target, revision: state.preferences.revision })) }, t('明天再提醒', 'Remind me tomorrow')),
          !jobActiveThis && actionableUpdate && h(W.Button, { variant: 'ghost', className: 'is-sm', disabled: working, onClick: () => perform(() => api({ action: 'ignore', name: target, revision: state.preferences.revision, version: row.release.version })) }, t('忽略此版', 'Ignore')),
          !jobActiveThis && actionableUpdate && primary,
          !jobActiveThis && !actionableUpdate && canSuggestAuto && h(W.Button, { variant: 'primary', className: 'is-sm', disabled: working, onClick: () => { setError(''); setDialog('automatic'); } }, t('开启空闲自动热更新', 'Enable idle auto-updates')),
          !jobActiveThis && !actionableUpdate && !unconfirmed && h(W.Button, { variant: 'ghost', className: 'is-sm', onClick: () => { setError(''); setNotesOpen(false); if (job) setDismissedJobId(job.id); } }, t('关闭', 'Dismiss')))) },
        notesSection, windowsDialog, confirmDialog);
    }
    function progress() {
      if (!job || (!jobActiveThis && !unconfirmed && dismissedJobId === job.id)) return null;
      if (job.state === 'complete' && !jobReason) {
        return job.to ? h('div', null,
          h('p', { className: 'w-muted updates-note' }, '✓ ' + jobLabel(job) + ' · ' + job.from + ' → ' + job.to + (job.mode === 'automatic' ? t(' · 自动更新', ' · Automatic update') : '')),
          canSuggestAuto && h('div', { className: 'updates-auto-nudge' },
            h('span', null, t('以后有兼容新版本时，需要空闲自动热更新吗？', 'Auto-install future compatible updates while idle?')),
            h(W.Button, { variant: 'ghost', className: 'is-sm', disabled: working, onClick: () => { setError(''); setDialog('automatic'); } }, t('开启空闲自动热更新', 'Enable idle auto-updates')),
            h(W.Button, { variant: 'ghost', className: 'is-sm', onClick: () => setDismissedJobId(job.id) }, t('关闭', 'Dismiss')))) : null;
      }
      return h('section', { className: 'w-section', role: 'status', 'aria-label': t('更新进度', 'Update progress') },
        h('h3', null, jobLabel(job)),
        job.to && h('p', { className: 'w-muted' }, job.from + ' → ' + job.to + (job.mode === 'automatic' ? t(' · 自动更新', ' · Automatic update') : '')),
        job.state === 'restart-required' && jobResult?.restartReason === 'package-moved' && h('p', { className: 'w-muted updates-note' }, t('新版已就绪；因多个独立插件共用底层依赖，请先手动重启一次 DSH 生效后再继续更新其他插件。', 'Installed; because standalone plugins share dependencies, restart DSH once before updating additional plugins.')),
        jobReason && h(W.Status, { tone: 'error' }, message(jobReason)),
        h('div', { className: 'updates-bar-actions', style: { marginTop: '6px' } },
          canCancel && h(W.Button, { className: 'is-sm', disabled: job.state === 'cancelling', onClick: () => perform(() => api({ action: 'cancel', id: job.id })) }, t('取消更新', 'Cancel update')),
          !jobActiveThis && !unconfirmed && h(W.Button, { variant: 'ghost', className: 'is-sm', onClick: () => setDismissedJobId(job.id) }, t('关闭提示', 'Dismiss'))));
    }
    function windowControls() {
      if (!staleWindows) return null;
      return h(W.Status, null, h('p', null, t('有窗口已断开，无法确认是否还有未保存修改。仍在使用的窗口请先保存并刷新；已关闭的窗口可以手动重新确认。', 'A disconnected window may contain unsaved changes. Save and refresh windows still in use. If they are closed, you can confirm that manually.')), h(W.Button, { className: 'is-sm', onClick: () => setDialog('windows') }, t('重新确认已关闭的窗口', 'Confirm closed windows')));
    }
    const incompatibleText = row.release && !row.release.compatible ? t('新版本暂不兼容当前环境：', 'Latest release is incompatible with this environment: ') + requirement(row.release) + (row.release.required ? ' (' + row.release.required + ')' : '') : '';
    const optionsSection = h('details', { className: 'updates-options' },
      h('summary', null, !original.bundledBy ? t('自动更新与提醒', 'Auto-update & reminders') : t('更新选项', 'Update options'), ' · ', prefs.checkEnabled ? t('自动检查：开', 'Checks: on') : t('自动检查：关', 'Checks: off'), ' · ', prefs.autoInstall ? (prefs.autoScope === 'compatible' ? t('空闲自动热更新：兼容版', 'Idle auto-update: compatible') : t('空闲自动热更新：仅补丁', 'Idle auto-update: patches')) : t('空闲自动热更新：关', 'Idle auto-update: off')),
      h('section', { className: 'updates-settings', 'aria-label': t('这个插件的更新偏好', 'Update preferences for this plugin') },
        h('div', null, h(W.Switch, { label: isSuite ? t('自动检查 Suite 整包更新', 'Automatically check Suite updates') : t('自动检查这个插件的更新', 'Automatically check this plugin'), checked: prefs.checkEnabled, disabled: working || !!snapshot.preferenceError || !managed, onChange: event => perform(() => save({ checkEnabled: event.target.checked })) }), h('p', { className: 'w-muted updates-note' }, t('默认开启，每 6 小时最多一次。只影响这个安装包，关闭后仍可手动检查。', 'On by default, at most every 6 hours. This affects only this bundle; manual checks remain available.'))),
        h('div', null, h(W.Switch, { label: isSuite ? t('空闲时自动热更新 Suite 兼容版本', 'Auto-install compatible Suite updates while idle') : t('空闲时自动热更新兼容版本', 'Auto-install compatible updates while idle'), checked: prefs.autoInstall, disabled: working || !!snapshot.preferenceError || !managed, onChange: event => event.target.checked ? (setError(''), setDialog('automatic')) : perform(() => save({ autoInstall: false })) }), h('p', { className: 'w-muted updates-note' }, t('默认关闭。明确开启后，仅在空闲且无未保存修改时热更新兼容稳定版（含功能小版本与补丁，不含跨主版本）。其他插件的开关不变。', 'Off by default. Explicitly enable compatible stable updates (minor and patch, excluding major) while idle with no unsaved changes. Other plugins’ settings stay unchanged.')), prefs.autoInstall && prefs.autoScope !== 'compatible' && h(W.Button, { variant: 'ghost', className: 'is-sm', disabled: working, onClick: () => { setError(''); setDialog('automatic'); } }, t('升级为包含兼容功能小版本', 'Include compatible minor updates')))));
    const errorStatus = error && h(W.Status, { tone: 'error' }, error === 'check-first' && managed ? h('div', { className: 'updates-bar-actions' }, h('span', null, message(error)), recheckButton('ghost')) : message(error));
    const linksNav = (() => {
      const ownRepo = repoUrl(original.name), suiteRepo = repoUrl('@stardustlc/dsh-suite'), starRepo = isSuite ? suiteRepo : ownRepo;
      if (!ownRepo && !starRepo) return null;
      return h('nav', { className: 'updates-links', 'aria-label': t('开源仓库与反馈', 'Repository and feedback') },
        starRepo && h('a', { href: starRepo, target: '_blank', rel: 'noreferrer noopener' }, isSuite ? t('★ 觉得好用？在 GitHub 给 dsh-suite 点个 Star', '★ Useful? Star dsh-suite on GitHub') : t('★ 觉得好用？在 GitHub 点个 Star', '★ Useful? Star on GitHub')),
        ownRepo && h('a', { href: ownRepo + '/issues', target: '_blank', rel: 'noreferrer noopener' }, t('提交建议 / 问题反馈', 'Feedback & issues')),
        isSuite && original.name !== '@stardustlc/dsh-suite' && ownRepo && h('a', { href: ownRepo, target: '_blank', rel: 'noreferrer noopener' }, t('组件仓库', 'Component repo')),
        !isSuite && suiteRepo && h('a', { href: suiteRepo, target: '_blank', rel: 'noreferrer noopener' }, t('了解 dsh-suite（18 合 1 组合包）', 'Explore dsh-suite (18-in-1 bundle)')));
    })();
    if (!original.bundledBy) {
      // Native bundle detail pages in DSH already render their own Version & Source sections
      // ("重新检查", version list & "更新" button). Keep only non-duplicative auto-update preferences,
      // inline changelog notes, compatibility/error diagnostics, and GitHub feedback links here.
      return h(FooterFrame, { name, label: title, supplement: true, head: h('div', { className: 'updates-compact-bar' },
        optionsSection,
        (row.release || (showUpdate && (!deferred || !ignored))) && h('div', { className: 'updates-head-actions' },
          row.release && h(W.Button, { variant: 'ghost', className: 'is-sm', onClick: showNotes, 'aria-expanded': notesOpen }, t('更新记录', 'Release notes')),
          showUpdate && !deferred && h(W.Button, { variant: 'ghost', className: 'is-sm', disabled: working, onClick: () => perform(() => api({ action: 'later', name: target, revision: state.preferences.revision })) }, t('推迟提醒 24h', 'Snooze 24h')),
          showUpdate && !ignored && h(W.Button, { variant: 'ghost', className: 'is-sm', disabled: working, onClick: () => perform(() => api({ action: 'ignore', name: target, revision: state.preferences.revision, version: row.release.version })) }, t('忽略此版提醒', 'Mute reminder')))) },
        notesSection,
        incompatibleText && h(W.Status, null, incompatibleText),
        errorStatus, snapshot.preferenceError && h(W.Status, { tone: 'error' }, message('preferences-unreadable')),
        snapshot.pendingRestart && h(W.Status, null, snapshot.updaterRestart ? message('restart-required') : t('已有插件更新等待手动重启后生效；空闲自动热更新已暂停，建议先重启一次 DSH 再继续更新其他共用依赖的插件。', 'An update awaits a manual restart; idle auto-updates are paused. Restart DSH once before updating other plugins that share dependencies.')),
        prefs.autoInstall && snapshot.autoReady === false && h(W.Status, null, message('page-not-ready')),
        (prefs.autoInstall || jobActiveThis) && windowControls(),
        jobActiveThis && (snapshot.pages.dirty || ownPage.dirty) && h(W.Status, null, message('page-dirty')),
        jobActiveThis && (snapshot.activity.busy || pageBusy) && h(W.Status, null, message(snapshot.activity.busy ? 'busy' : 'page-busy')),
        deferred && h('p', { className: 'w-muted updates-note' }, t('已推迟此插件的对话页与工作台提醒 24 小时。', 'Chat and workbench reminders for this plugin are snoozed for 24 hours.')),
        unconfirmed && h(W.Status, { tone: 'error' }, message('operation-unconfirmed')),
        progress(),
        linksNav,
        windowsDialog, confirmDialog
      );
    }
    const status = !managed ? t('本地 / 外部来源，保留原安装方式', 'Local / external source; keep original install method') : row.loadError ? t('加载异常，请先检查原生插件管理', 'Loading error; check native plugin management') : row.error ? t('检查失败，可以重试', 'Check failed; retry available') : incompatibleText || (row.available ? (ignored ? t('已忽略提醒，仍可手动更新', 'Reminder ignored; manual update available') : t('有兼容的新版本', 'Compatible update available')) : row.checkedAt ? t('当前已是最新稳定版', 'Latest stable version') : t('尚未检查', 'Not checked yet'));
    return h(FooterFrame, { name, label: title, head: h('div', { className: 'updates-head' },
      h('div', null,
        h('div', { className: 'updates-title-row' }, h('h2', null, t('随 Suite 整包管理', 'Managed via Suite bundle')), h('span', { className: 'updates-mono updates-badge' }, original.name + ' · v' + original.version)),
        h('p', { className: 'w-muted updates-meta-line' }, status, row.checkedAt ? ' · ' + t('上次检查：', 'Last checked: ') + new Date(row.checkedAt).toLocaleString(language() === 'en' ? 'en-US' : 'zh-CN') : ''),
        h('p', { className: 'updates-version updates-note' }, target + ' · v' + row.version, row.release?.version && row.release.version !== row.version ? ' → v' + row.release.version : '')),
      h('div', { className: 'updates-head-actions' },
        showUpdate && checkButton('ghost'),
        row.release && h(W.Button, { variant: 'ghost', className: 'is-sm', onClick: showNotes, 'aria-expanded': notesOpen }, t('更新记录', 'Release notes')),
        showUpdate && !deferred && h(W.Button, { variant: 'ghost', className: 'is-sm', disabled: working, onClick: () => perform(() => api({ action: 'later', name: target, revision: state.preferences.revision })) }, t('明天再提醒', 'Remind me tomorrow')),
        showUpdate && !ignored && h(W.Button, { variant: 'ghost', className: 'is-sm', disabled: working, onClick: () => perform(() => api({ action: 'ignore', name: target, revision: state.preferences.revision, version: row.release.version })) }, t('忽略此版本提醒', 'Ignore this reminder')),
        primary)) },
      notesSection,
      optionsSection,
      errorStatus, snapshot.preferenceError && h(W.Status, { tone: 'error' }, message('preferences-unreadable')),
      snapshot.pendingRestart && h(W.Status, null, snapshot.updaterRestart ? message('restart-required') : t('已有插件更新等待手动重启后生效；空闲自动热更新已暂停。', 'An update awaits a manual restart; idle auto-updates are paused.')),
      prefs.autoInstall && snapshot.autoReady === false && h(W.Status, null, message('page-not-ready')),
      windowControls(),
      (showUpdate || jobActiveThis) && (snapshot.pages.dirty || ownPage.dirty) && h(W.Status, null, message('page-dirty')),
      (showUpdate || jobActiveThis) && (snapshot.activity.busy || pageBusy) && h(W.Status, null, message(snapshot.activity.busy ? 'busy' : 'page-busy')),
      deferred && h(W.Status, null, t('已推迟 Suite 提醒和自动安装 24 小时，仍可手动更新。', 'Suite reminders and automatic installation are deferred for 24 hours. Manual updates remain available.')),
      unconfirmed && h(W.Status, { tone: 'error' }, message('operation-unconfirmed')),
      progress(),
      linksNav,
      windowsDialog, confirmDialog
    );
  }
  function InlineFooter({ name }) { return h(Panel, { name, inline: true }); }
  function NativeFooter({ subject }) {
    const snapshot = useSnapshot(), name = __stardustUpdatesDetailName(subject, snapshot?.rows || []);
    return name ? h(Panel, { name, inline: false }) : null;
  }
  function Reminder() {
    const snapshot = useSnapshot(), [working, setWorking] = useState(false), [checking, setChecking] = useState(false), [error, setError] = useState(''), [dialog, setDialog] = useState(null), [selectedTarget, setSelectedTarget] = useState(null), [selectedVersion, setSelectedVersion] = useState(null), [notes, setNotes] = useState(null), [notesOpen, setNotesOpen] = useState(false), [loadingNotes, setLoadingNotes] = useState(false), [dismissedJobId, setDismissedJobId] = useState(null);
    const seenJob = useRef ? useRef(null) : { current: null };
    const footerVisible = [...(document.querySelectorAll?.('[data-plugin-update-footer]') || [])].some(node => node.getClientRects?.().length);
    const job = snapshot?.job && seenJob.current === snapshot.job.id && dismissedJobId !== snapshot.job.id ? snapshot.job : null;
    const yielded = footerVisible && !job && !dialog && !working && !checking && !error && !legacyHint;
    const candidate = yielded ? null : snapshot?.rows?.find(item => {
      const prefs = preferences(item.name);
      return item.sourceKind === 'registry' && item.available && !item.updating && !item.bundledBy && prefs.checkEnabled && prefs.deferredUntil <= Date.now() && prefs.ignoredVersion !== item.release?.version && !notified.has(item.name + '@' + item.release?.version);
    });
    const targetName = job?.name || selectedTarget || candidate?.name;
    const row = targetName ? originalRow(targetName) : null;
    useEffect(() => { if (!yielded && row && (candidate || selectedTarget) && !activeJob()) refreshIfStale(row); }, [yielded, row?.name, row?.available, row?.checkedAt, !!candidate, selectedTarget]);
    if (yielded) return null;
    if (!legacyHint && !candidate && !job && !dialog && !(error && row)) return null;
    if (legacyHint && !candidate && !job && !dialog && !(error && row)) {
      const hint = legacyHint;
      return h('aside', { className: 'dshw plugin-updates-reminder', role: 'status', 'aria-live': 'polite' },
        h('style', null, W.styles), h('style', null, FOOTER_CSS),
        h('div', { className: 'reminder-head' },
          h('span', null, hint + t('：请打开「插件」中的此插件详情页，在底部管理更新。', ': open its details in Plugins to manage updates at the bottom.')),
          h('button', { type: 'button', className: 'reminder-close', 'aria-label': t('关闭', 'Dismiss'), onClick: () => { legacyHint = null; notify(); } }, '×')));
    }
    if (!row || !snapshot) return null;
    const prefs = preferences(row.name), isSuite = row.name === '@stardustlc/dsh-suite', label = language() === 'en' ? row.labelEn : row.label;
    const ownPage = pageState(true), unconfirmed = ['unknown', 'restore-failed'].includes(snapshot.job?.state);
    const pageBusy = ownPage.busy || (snapshot.pages.clients || []).some(c => c.id !== id && c.busy);
    const checkingThis = checking || snapshot.checkingNames?.includes(row.name);
    const installLocked = working || activeJob() || unconfirmed || snapshot.updaterRestart || snapshot.preferenceError || !snapshot.activity.known || snapshot.activity.busy || snapshot.pages.dirty || ownPage.dirty || pageBusy || !snapshot.pages.known || row.loadError;
    const jobResult = job?.outcome?.result;
    const jobReason = job ? job.reason || (jobResult?.pendingBuilds || jobResult?.failureKind === 'build-blocked' ? 'build-blocked' : jobResult?.error?.code) : null;
    const jobRunning = !!job && ['verifying', 'installing', 'cancelling'].includes(job.state);
    const canSuggestAuto = !!job && job.state === 'complete' && !jobReason && (!prefs.autoInstall || prefs.autoScope !== 'compatible') && !snapshot.preferenceError;
    const key = row.release?.version ? row.name + '@' + row.release.version : null;
    async function perform(callback) { setError(''); setWorking(true); try { await callback(); await refresh(); } catch (err) { setError(err.message); await refresh().catch(() => {}); } finally { setWorking(false); } }
    async function checkReminder() { setError(''); setChecking(true); try { staleChecks.set(row.name, Date.now()); await api({ action: 'check', name: row.name }); await refresh(); } catch (err) { setError(err.message); } finally { setChecking(false); } }
    async function runInstall() {
      setDialog(null); manualOperation = true; notify();
      setError(''); setWorking(true);
      try {
        try {
          await heartbeat();
          const started = await api({ action: 'install', name: row.name, version: selectedVersion, confirmation: 'update-installed-plugin' });
          seenJob.current = started.id;
          while (alive) {
            await new Promise(resolve => setTimeout(resolve, 800)); await heartbeat(); await refresh();
            if (state.job?.id !== started.id) throw new Error('operation-unconfirmed');
            if (!activeJob()) break;
          }
          if (key && ['complete', 'restart-required'].includes(state?.job?.state)) notified.add(key);
          await refresh();
        } finally { manualOperation = false; notify(); }
      } catch (err) {
        setError(err.message);
        if (['check-first', 'release-changed'].includes(err?.message)) {
          staleChecks.set(row.name, Date.now());
          await api({ action: 'check', name: row.name }).catch(() => {});
        }
        await refresh().catch(() => {});
      } finally { setWorking(false); }
    }
    async function toggleNotes() {
      if (notesOpen) { setNotesOpen(false); return; }
      if (!row.release?.version) return;
      setNotesOpen(true); setNotes(null); setLoadingNotes(true); setError('');
      try { setNotes(await api({ action: 'notes', name: row.name, version: row.release.version })); } catch (err) { setError(err.message); } finally { setLoadingNotes(false); }
    }
    function dismiss() {
      setError(''); setNotesOpen(false); setDialog(null); setSelectedTarget(null);
      if (key && !jobRunning) notified.add(key);
      if (job) setDismissedJobId(job.id);
      notify();
    }
    const confirmDialog = ['install', 'automatic'].includes(dialog) && h(W.Dialog, {
      title: dialog === 'automatic'
        ? (isSuite ? t('允许 Suite 空闲时自动热更新？', 'Allow idle automatic updates for Suite?') : t('允许这个插件空闲时自动热更新？', 'Allow idle automatic updates for this plugin?'))
        : (isSuite ? t('确认更新 Suite 整包', 'Confirm Suite bundle update') : t('确认更新此插件', 'Confirm this plugin update')),
      closeLabel: t('关闭', 'Close'),
      onClose: () => setDialog(null),
    }, dialog === 'automatic'
      ? h('div', { className: 'w-stack' },
        h('p', null, label + ' · ' + row.name),
        h('p', null, t('你正在主动启用自动安装。只处理通过当前 DSH 与 Node 兼容性校验的稳定版本（含功能小版本与补丁，跨主版本仍需手动确认）；有任务、未保存修改、未知窗口或等待重启时暂停，随时可关闭。', 'You are explicitly enabling automatic installation for compatible stable releases (minor and patch updates matching this DSH and Node runtime; major upgrades still require manual confirmation). Running tasks, unsaved changes, unknown windows or a pending restart pause it; turn it off anytime.')),
        h('div', { className: 'w-toolbar' },
          h(W.Button, { onClick: () => setDialog(null) }, t('保持关闭', 'Keep off')),
          h(W.Button, { variant: 'primary', onClick: () => { setDialog(null); void perform(async () => { await api({ action: 'preferences', name: row.name, revision: state.preferences.revision, changes: { checkEnabled: true, autoInstall: true, autoScope: 'compatible' }, consent: 'enable-idle-compatible-updates' }); dismiss(); }); } }, t('允许空闲自动热更新', 'Allow idle automatic updates'))))
      : h('div', { className: 'w-stack' },
        isSuite && h('p', null, t('此处操作的是 Suite 整包，包含 18 个组件。独立安装的其他插件不受影响。', 'This action applies to the whole Suite, including its 18 components. Other independently installed plugins are unaffected.')),
        h('p', { className: 'updates-mono' }, row.name + ' · v' + row.version + ' → v' + selectedVersion),
        h('p', null, row.release?.version === selectedVersion ? t('Harness 会原地热更新并重新加载，无需离开当前聊天；若需要手动重启会在此处说明。', 'Harness hot-updates and reloads in place without leaving your chat; if a manual restart is needed, it appears here.') : (row.available && row.release?.version ? message('release-changed') : message('check-first'))),
        h('div', { className: 'w-toolbar' },
          h(W.Button, { onClick: () => setDialog(null) }, t('取消', 'Cancel')),
          row.available && row.release?.version && row.release.version !== selectedVersion
            ? h(W.Button, { variant: 'primary', disabled: installLocked, onClick: () => { setError(''); setSelectedVersion(row.release.version); } }, t('更新为 v', 'Use v') + row.release.version)
            : h(W.Button, { variant: 'primary', disabled: installLocked || row.release?.version !== selectedVersion, onClick: runInstall }, t('安装此版本', 'Install this version')))));
    return h('aside', { className: 'dshw plugin-updates-reminder', 'data-plugin-update-reminder': row.name, role: 'status', 'aria-live': 'polite' },
      h('style', null, W.styles), h('style', null, FOOTER_CSS),
      h('div', { className: 'reminder-head' },
        h('div', { className: 'reminder-title' },
          h('span', { className: 'updates-pill' + (job && ['failed', 'restore-failed', 'unknown', 'restored'].includes(job.state) ? ' is-error' : '') },
            job ? jobLabel(job) : isSuite ? t('Suite 新版本', 'Suite update') : label + t(' 有新版本', ' update')),
          h('span', { className: 'updates-mono' }, job ? ('v' + job.from + ' → v' + job.to) : ('v' + row.version + (row.release?.version ? ' → v' + row.release.version : '')))),
        !jobRunning && h('button', { type: 'button', className: 'reminder-close', 'aria-label': t('关闭提醒', 'Dismiss reminder'), onClick: dismiss }, '×')),
      jobReason && h('p', { className: 'updates-inline-msg is-error', style: { margin: '4px 0 0' } }, message(jobReason)),
      error && h('p', { className: 'updates-inline-msg is-error', role: 'alert', style: { margin: '4px 0 0' } }, message(error)),
      !job && installLocked && h('p', { className: 'w-muted', style: { margin: '4px 0 0' } },
        (snapshot.pages.dirty || ownPage.dirty) ? t('请先保存修改后再更新', 'Save changes before updating')
          : (snapshot.activity.busy || pageBusy) ? t('当前对话或任务结束后即可一键热更新', 'Hot-update available once the active turn finishes')
          : ''),
      canSuggestAuto && h('div', { className: 'updates-auto-nudge' },
        h('span', null, t('下次有兼容新版本时，空闲自动热更新？', 'Auto-install future compatible updates while idle?')),
        h(W.Button, { variant: 'primary', className: 'is-sm', disabled: working, onClick: () => { setError(''); setSelectedTarget(row.name); setDialog('automatic'); } }, t('开启空闲自动热更新', 'Enable idle auto-updates'))),
      !jobRunning && !unconfirmed && !['complete', 'restart-required'].includes(job?.state) && h('div', { className: 'reminder-actions' },
        row.available && row.release?.version && h(W.Button, { variant: 'primary', className: 'is-sm', icon: 'download', disabled: installLocked || checkingThis, onClick: () => { setError(''); if (job) setDismissedJobId(job.id); setSelectedTarget(row.name); setSelectedVersion(row.release.version); setDialog('install'); } }, (isSuite ? t('热更新 Suite 至 v', 'Update Suite to v') : t('热更新至 v', 'Update to v')) + row.release.version),
        error === 'check-first' && h(W.Button, { variant: row.available ? 'ghost' : 'primary', className: 'is-sm', icon: 'refresh', disabled: working || checkingThis, onClick: checkReminder }, checkingThis ? t('正在检查…', 'Checking…') : t('重新检查', 'Check again')),
        row.release?.version && h(W.Button, { variant: 'ghost', className: 'is-sm', onClick: toggleNotes, 'aria-expanded': notesOpen }, t('更新记录', 'Release notes')),
        row.available && h(W.Button, { variant: 'ghost', className: 'is-sm', disabled: working, onClick: () => perform(async () => { await api({ action: 'later', name: row.name, revision: state.preferences.revision }); dismiss(); }) }, t('明天再提醒', 'Remind tomorrow'))),
      jobRunning && !['applying', 'restoring'].includes(job.phase) && h('div', { className: 'reminder-actions' },
        h(W.Button, { className: 'is-sm', disabled: job.state === 'cancelling', onClick: () => perform(() => api({ action: 'cancel', id: job.id })) }, t('取消更新', 'Cancel update'))),
      notesOpen && h('section', { className: 'updates-notes', 'aria-label': t('更新记录', 'Release notes') },
        loadingNotes ? h('p', { className: 'w-muted', style: { margin: 0 } }, t('正在读取…', 'Loading…'))
          : notes?.text ? h('pre', { tabIndex: 0 }, h('code', null, notes.text))
          : h('p', { className: 'w-muted', style: { margin: 0 } }, t('未找到此版本的独立更新记录。', 'No separate notes were found for this version.')),
        notes?.url && h('a', { href: notes.url, target: '_blank', rel: 'noreferrer noopener' }, t('查看仓库更新记录', 'View repository changelog'))),
      confirmDialog);
  }
  function register() {
    if (!alive) return;
    if (!registered) {
      registered = true; pool.clients.add(client);
      ctx.slots.inject('plugins.detail.section', () => ctx.slots.register({ name: 'plugins.detail.section', id: 'stardustlc.plugin-update-footer', order: 1000 }, NativeFooter));
      ctx.slots.inject('shell.overlay', () => ctx.slots.register({ name: 'shell.overlay', id: 'stardustlc.plugin-update-reminder' }, Reminder));
      notify();
    }
  }
  async function poll() {
    if (inPoll || !alive || !shared.refs.size) return;
    inPoll = true;
    try { await refresh(); register(); await heartbeat(); }
    catch { /* Owner-only controls stay absent for guests and unsupported hosts. */ }
    finally { inPoll = false; }
  }
  const timer = setInterval(() => { void poll(); }, 15000), first = setTimeout(() => { void poll(); }, 100);
  const client = { t, Footer: InlineFooter, NativeFooter, Button: W.Button, open(name) { const footer = [...document.querySelectorAll('[data-plugin-update-footer]')].find(node => node.getAttribute('data-plugin-update-footer') === name); if (footer) footer.scrollIntoView({ block: 'end', behavior: 'smooth' }); else { legacyHint = name; notify(); } }, has: name => registered && !!originalRow(name), row: rowFor, dispose() {
    close(); alive = false; clearTimeout(first); clearInterval(timer); pool.clients.delete(client);
    pool.listeners.delete(guardChanged); listeners.clear();
    for (const event of ['pointerdown', 'keydown', 'input']) document.removeEventListener(event, interaction, true);
    window.removeEventListener('pagehide', close);
    for (const controller of requests) controller.abort();
    for (const listener of pool.viewListeners) listener();
  } };
  return client;
}

/* STARDUSTLC_UPDATE_CLIENT_BODY_START */
// Generated from templates/ by scripts/build-client.mjs. Edit the sources.
(function () {
/* clsx
MIT License

Copyright (c) Luke Edwards <luke.edwards05@gmail.com> (lukeed.com)

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/
const clsx = (() => {
  const module = { exports: {} };
  function r(e){var o,t,f="";if("string"==typeof e||"number"==typeof e)f+=e;else if("object"==typeof e)if(Array.isArray(e)){var n=e.length;for(o=0;o<n;o++)e[o]&&(t=r(e[o]))&&(f&&(f+=" "),f+=t)}else for(t in e)e[t]&&(f&&(f+=" "),f+=t);return f}function e(){for(var e,o,t=0,f="",n=arguments.length;t<n;t++)(e=arguments[t])&&(o=r(e))&&(f&&(f+=" "),f+=o);return f}module.exports=e,module.exports.clsx=e;
  return module.exports.clsx;
})();
const css = Object.freeze({"dshd-toolbar":"dsh-dream_dshd-toolbar","dshd-search":"dsh-dream_dshd-search","dshd-spacer":"dsh-dream_dshd-spacer","dshd-filter":"dsh-dream_dshd-filter","dshd-filterpop":"dsh-dream_dshd-filterpop","dshd-filtertitle":"dsh-dream_dshd-filtertitle","filterPill":"dsh-dream_filterPill","dshd-filterfoot":"dsh-dream_dshd-filterfoot","dshd-filterempty":"dsh-dream_dshd-filterempty","dshd-hint":"dsh-dream_dshd-hint","dshd-note":"dsh-dream_dshd-note","dshd-headline":"dsh-dream_dshd-headline","dshd-tiles":"dsh-dream_dshd-tiles","dshd-tile":"dsh-dream_dshd-tile","dshd-tile-label":"dsh-dream_dshd-tile-label","dshd-tile-value":"dsh-dream_dshd-tile-value","dshd-tile-hint":"dsh-dream_dshd-tile-hint","dshd-two":"dsh-dream_dshd-two","dshd-card":"dsh-dream_dshd-card","dshd-mblocks":"dsh-dream_dshd-mblocks","dshd-mblock":"dsh-dream_dshd-mblock","dshd-tone-1":"dsh-dream_dshd-tone-1","dshd-tone-2":"dsh-dream_dshd-tone-2","dshd-tone-3":"dsh-dream_dshd-tone-3","dshd-legend":"dsh-dream_dshd-legend","dshd-legend-row":"dsh-dream_dshd-legend-row","dshd-legend-name":"dsh-dream_dshd-legend-name","dshd-legend-count":"dsh-dream_dshd-legend-count","dshd-lesson":"dsh-dream_dshd-lesson","dshd-rank":"dsh-dream_dshd-rank","dshd-lesson-body":"dsh-dream_dshd-lesson-body","dshd-lesson-meta":"dsh-dream_dshd-lesson-meta","dshd-last":"dsh-dream_dshd-last","dshd-lesson-text":"dsh-dream_dshd-lesson-text","dshd-track":"dsh-dream_dshd-track","dshd-fill":"dsh-dream_dshd-fill","dshd-times":"dsh-dream_dshd-times","dshd-badge":"dsh-dream_dshd-badge","dshd-listhead":"dsh-dream_dshd-listhead","dshd-timeline":"dsh-dream_dshd-timeline","dshd-dream":"dsh-dream_dshd-dream","dshd-mood-1":"dsh-dream_dshd-mood-1","dshd-mood-2":"dsh-dream_dshd-mood-2","dshd-mood-3":"dsh-dream_dshd-mood-3","dshd-dream-head":"dsh-dream_dshd-dream-head","dshd-time":"dsh-dream_dshd-time","dshd-ago":"dsh-dream_dshd-ago","dshd-mood":"dsh-dream_dshd-mood","dshd-mooddot":"dsh-dream_dshd-mooddot","dshd-linkbtn":"dsh-dream_dshd-linkbtn","dshd-reflection":"dsh-dream_dshd-reflection","dshd-clamp":"dsh-dream_dshd-clamp","dshd-lessons":"dsh-dream_dshd-lessons","dshd-num":"dsh-dream_dshd-num","dshd-lesson-li":"dsh-dream_dshd-lesson-li","dshd-privacy":"dsh-dream_dshd-privacy","dshd-peek":"dsh-dream_dshd-peek","dshd-alert":"dsh-dream_dshd-alert","error":"dsh-dream_error","dshd-empty":"dsh-dream_dshd-empty","dshd-chips":"dsh-dream_dshd-chips","dshd-chip":"dsh-dream_dshd-chip","dshd-skel":"dsh-dream_dshd-skel","dshd-shimmer":"dsh-dream_dshd-shimmer","dshd-footer":"dsh-dream_dshd-footer","dshd-krows":"dsh-dream_dshd-krows","dshd-khead":"dsh-dream_dshd-khead","dshd-kcard":"dsh-dream_dshd-kcard","dshd-kempty":"dsh-dream_dshd-kempty","dshd-kbadge":"dsh-dream_dshd-kbadge","dshd-klast":"dsh-dream_dshd-klast","dshd-kempty-title":"dsh-dream_dshd-kempty-title","dshd-kempty-body":"dsh-dream_dshd-kempty-body","dshd-kcmd":"dsh-dream_dshd-kcmd","dshd-reviewform":"dsh-dream_dshd-reviewform","dshd-diff":"dsh-dream_dshd-diff","dshd-feedback":"dsh-dream_dshd-feedback","dshd-copywrap":"dsh-dream_dshd-copywrap","dshd-cmd":"dsh-dream_dshd-cmd","dshd-bridge":"dsh-dream_dshd-bridge","dshd-bridge-head":"dsh-dream_dshd-bridge-head","dshd-bridge-target":"dsh-dream_dshd-bridge-target","dshd-bridge-meta":"dsh-dream_dshd-bridge-meta","dshd-rollback-ok":"dsh-dream_dshd-rollback-ok","dshd-rollback-no":"dsh-dream_dshd-rollback-no","app-shell":"dsh-dream_app-shell","modalSurface":"dsh-dream_modalSurface","topbar":"dsh-dream_topbar","topbar-left":"dsh-dream_topbar-left","topbar-right":"dsh-dream_topbar-right","plugin-brand":"dsh-dream_plugin-brand","plugin-badge":"dsh-dream_plugin-badge","tabsWrap":"dsh-dream_tabsWrap","view-tabs":"dsh-dream_view-tabs","tabLabel":"dsh-dream_tabLabel","tabCount":"dsh-dream_tabCount","control":"dsh-dream_control","primary":"dsh-dream_primary","toolbarActive":"dsh-dream_toolbarActive","iconButton":"dsh-dream_iconButton","danger":"dsh-dream_danger","checkbox":"dsh-dream_checkbox","segmented":"dsh-dream_segmented","settingsPage":"dsh-dream_settingsPage","choiceWrap":"dsh-dream_choiceWrap","choiceButton":"dsh-dream_choiceButton","choiceLabel":"dsh-dream_choiceLabel","actions":"dsh-dream_actions","muted":"dsh-dream_muted","status":"dsh-dream_status","statusError":"dsh-dream_statusError","pageStatus":"dsh-dream_pageStatus","workspace-body":"dsh-dream_workspace-body","dreamFadeOut":"dsh-dream_dreamFadeOut","dreamFadeIn":"dsh-dream_dreamFadeIn","workbench-grid":"dsh-dream_workbench-grid","pane-rail":"dsh-dream_pane-rail","pane-list":"dsh-dream_pane-list","pane-inspector":"dsh-dream_pane-inspector","rail-scroll":"dsh-dream_rail-scroll","rail-footer":"dsh-dream_rail-footer","control-card":"dsh-dream_control-card","scopeFilters":"dsh-dream_scopeFilters","section-head":"dsh-dream_section-head","nav-item":"dsh-dream_nav-item","count-pill":"dsh-dream_count-pill","mobileScope":"dsh-dream_mobileScope","list-toolbar":"dsh-dream_list-toolbar","listFooter":"dsh-dream_listFooter","search":"dsh-dream_search","scopePicker":"dsh-dream_scopePicker","acceptedFilters":"dsh-dream_acceptedFilters","checkLabel":"dsh-dream_checkLabel","candidate-scroll":"dsh-dream_candidate-scroll","skeletonWrap":"dsh-dream_skeletonWrap","skeletonInspector":"dsh-dream_skeletonInspector","cand-row":"dsh-dream_cand-row","candidateButton":"dsh-dream_candidateButton","candTitleLine":"dsh-dream_candTitleLine","cand-title":"dsh-dream_cand-title","rowActions":"dsh-dream_rowActions","cand-summary":"dsh-dream_cand-summary","cand-tags":"dsh-dream_cand-tags","scopeBadge":"dsh-dream_scopeBadge","scopeCaption":"dsh-dream_scopeCaption","batchCheckbox":"dsh-dream_batchCheckbox","batch":"dsh-dream_batch","more":"dsh-dream_more","pane-resizer":"dsh-dream_pane-resizer","inspectorContent":"dsh-dream_inspectorContent","inspector-toolbar":"dsh-dream_inspector-toolbar","meta":"dsh-dream_meta","inspector-scroll":"dsh-dream_inspector-scroll","verify-block":"dsh-dream_verify-block","inspectorTitle":"dsh-dream_inspectorTitle","back":"dsh-dream_back","review-stepper":"dsh-dream_review-stepper","step-chip":"dsh-dream_step-chip","stepDone":"dsh-dream_stepDone","step-sep":"dsh-dream_step-sep","diffShortcut":"dsh-dream_diffShortcut","settings-card":"dsh-dream_settings-card","verify-head":"dsh-dream_verify-head","evidence":"dsh-dream_evidence","evidence-quote":"dsh-dream_evidence-quote","evidenceSummary":"dsh-dream_evidenceSummary","sourceHash":"dsh-dream_sourceHash","redacted-token":"dsh-dream_redacted-token","scopeFacts":"dsh-dream_scopeFacts","masked":"dsh-dream_masked","privateText":"dsh-dream_privateText","maskedRow":"dsh-dream_maskedRow","empty":"dsh-dream_empty","emptyStack":"dsh-dream_emptyStack","emptyPrompts":"dsh-dream_emptyPrompts","inspectorEmptyWrap":"dsh-dream_inspectorEmptyWrap","copyPromptWrap":"dsh-dream_copyPromptWrap","copyBubble":"dsh-dream_copyBubble","tourTrigger":"dsh-dream_tourTrigger","tourLayer":"dsh-dream_tourLayer","tourSpotlight":"dsh-dream_tourSpotlight","tourBackdropFallback":"dsh-dream_tourBackdropFallback","tourCard":"dsh-dream_tourCard","tourArrow":"dsh-dream_tourArrow","tourHead":"dsh-dream_tourHead","tourStepMeta":"dsh-dream_tourStepMeta","tourStepBadge":"dsh-dream_tourStepBadge","tourDots":"dsh-dream_tourDots","tourDot":"dsh-dream_tourDot","tourSkip":"dsh-dream_tourSkip","tourTitle":"dsh-dream_tourTitle","tourDesc":"dsh-dream_tourDesc","tourInlineAction":"dsh-dream_tourInlineAction","tourFooter":"dsh-dream_tourFooter","tourNav":"dsh-dream_tourNav","switches":"dsh-dream_switches","switchRow":"dsh-dream_switchRow","documentPage":"dsh-dream_documentPage","settingsWide":"dsh-dream_settingsWide","settingsList":"dsh-dream_settingsList","privacyStatus":"dsh-dream_privacyStatus","surface":"dsh-dream_surface","modal":"dsh-dream_modal","modalFrame":"dsh-dream_modalFrame","modalHeader":"dsh-dream_modalHeader","modalBody":"dsh-dream_modalBody","diffMeta":"dsh-dream_diffMeta","diffLine":"dsh-dream_diffLine","diffAdd":"dsh-dream_diffAdd","diffRemove":"dsh-dream_diffRemove","commandList":"dsh-dream_commandList","command":"dsh-dream_command","dshFadeSlideUp":"dsh-dream_dshFadeSlideUp","dshAdoptSweep":"dsh-dream_dshAdoptSweep","dshDiscardCollapse":"dsh-dream_dshDiscardCollapse"});
const styleText = "/* ==========================================================================\n * DeepSeek Harness (>=0.2.2-rc.3) Unified Workbench Themes & Motion System v3\n * Shared across STARDUSTLC666 workbench plugins:\n *   dsh-email, dsh-calendar, dsh-cite, dsh-dream, dsh-code-security,\n *   dsh-rss, dsh-ppt, dsh-remotion, dsh-hyperframes\n *\n * Design Principles:\n * 1. NEVER TOO DARK: Airy daylight defaults; when host `body[data-ds-dark-theme]`\n *    is active under `harness`, soften to breathable slate (#1f232b / #272c36),\n *    never pitch black (#000 / #090a0f / #151517).\n * 2. 13 SWITCHABLE PRESETS via `[data-dsh-style]` + 8 FONT PAIRINGS via `[data-dsh-font]`:\n *    - `harness`   (原生清透 / Native Airy)\n *    - `cream`     (米白纸感 / Warm Cream — stacked paper, dashed rows, bookmark tab)\n *    - `claude`    (Claude 暖书卷 / Claude Warmth — editorial serif, paper grain, borderless cards)\n *    - `pixel8bit` (8-Bit 掌机 / Bright 8-Bit — dot-matrix header, 2px borders, ▶ cursor, pixel progress)\n *    - `mint`      (晴空薄荷 / Airy Mint)\n *    - `glass`     (晴昼琉璃 / Daylight Glass — pastel aurora mesh, frosted blur, specular inner rim)\n *    - `eink`      (护眼墨水屏 / E-Ink Paper — matte warm paper, #171716 ink, 60ms snappy transitions)\n *    - `blueprint` (工程晒图 / Blueprint — cyanotype grid, Prussian #0d3b66 ink, safety-orange #e05a2b, `+` ticks)\n *    - `risograph` (波普孔版 / Riso Zine — halftone header, 2px #18181b outlines, #ff3e7f/#2563eb offset shadows)\n *    - `win98`     (千禧复古 / Retro 98 — Platinum silver 3D raised/sunken bevels, royal-blue titlebar accent)\n *    - `songhui`   (宋韵朱砂 / Song Xuan — gold-flecked Xuan paper, 3px double #b83b2a masthead, seal stamps)\n *    - `frutiger`  (晴空水晶 / Aqua Gloss — sky-aqua gradient, glossy specular 999px aqua pills)\n *    - `gazette`   (铅字晨报 / Gazette — warm newsprint, 4px double #161514 masthead, 1px column rules, #9b1c1c seal)\n *    - Dual-layer Chinese + Latin typography per preset + independent `[data-dsh-font]` overrides\n *      (`auto`, `songkai`, `fangsong`, `poster`, `retro98`, `serif`, `arcade`, `modern`)\n * 3. SHARED v3 LAYOUT & MOTION PRIMITIVES:\n *    - Unified 48px Single-Row Header (`.dsh-header`) + compact `.dsh-style-switcher` + `.dsh-font-trigger`\n *    - Sliding Tab Indicator (`.dsh-tablist` + `.dsh-tab-indicator`) + 140ms Panel Enter\n *    - Resizable Split Pane (`.dsh-split-pane`, `.dsh-split-resizer`, <760px auto-stack)\n *    - Theme-Tinted Shimmer Skeleton (`.dsh-skeleton`)\n *    - Row Hover Quick-Action Bar (`.dsh-row-actions`)\n *    - Calm Compact Update Strip (`[data-plugin-update-footer]`)\n * 4. PORTALED OVERLAY SYNC + `prefers-reduced-motion` + `forced-colors` compliance.\n * ========================================================================== */\n\n/* --------------------------------------------------------------------------\n * 1. Motion Timing & Base Token Fallbacks (Standalone + Host Safe)\n * -------------------------------------------------------------------------- */\n:where([data-dsh-style]),\n:where([data-dsh-portal-synced]),\n:where([role=\"dialog\"], [role=\"alertdialog\"], [role=\"menu\"], dialog):has([data-dsh-style]) {\n  --dsh-ease-out: cubic-bezier(0.22, 1, 0.36, 1);\n  --dsh-ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);\n  /* Standard cubic-bezier fallback before linear() physics spring */\n  --dsh-ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);\n  --dsh-motion-fast: 140ms;\n  --dsh-motion-base: 200ms;\n  --dsh-motion-dialog: 220ms;\n  --dsh-control-border-width: 0.5px;\n  --dsh-button-shadow: none;\n  --dsh-button-hover-shadow: 0 2px 6px rgba(15, 23, 42, 0.06);\n  --dsh-card-shadow: none;\n  --dsh-card-hover-shadow: 0 6px 18px rgba(15, 23, 42, 0.08);\n  --dsh-font-display: \"Cascadia Code SemiBold\", \"Cascadia Code\", \"YouYuan\", \"幼圆\", \"Noto Sans SC\", monospace;\n  --dsh-font-body: \"Cascadia Code\", \"Cascadia Mono\", \"YouYuan\", \"幼圆\", \"Noto Sans SC\", monospace;\n  --dsh-font-mono: \"Cascadia Mono\", \"Cascadia Code\", \"YouYuan\", \"幼圆\", Consolas, monospace;\n  --dsh-display-weight: 700;\n  --dsh-display-tracking: 0.015em;\n  --dsh-body-tracking: normal;\n  --dsh-serif-font: \"Palatino Linotype\", Georgia, \"Noto Serif SC\", \"STZhongsong\", \"华文中宋\", \"STSong\", \"华文宋体\", serif;\n  --dsw-font-family: var(--dsh-font-body);\n  --dsw-font-markdown-base: var(--dsh-font-body);\n}\n\n@supports (transition-timing-function: linear(0, 1)) {\n  :where([data-dsh-style]),\n  :where([role=\"dialog\"], [role=\"alertdialog\"], [role=\"menu\"], dialog):has([data-dsh-style]) {\n    --dsh-ease-spring: linear(\n      0, 0.402 7.4%, 0.711 15.3%, 0.929 23.7%, 1.008 28.2%,\n      1.067 33%, 1.099 36.9%, 1.12 41%, 1.13 45.4%, 1.13 50.1%,\n      1.111 58.5%, 1.019 83.2%, 1.004 91.3%, 1\n    );\n  }\n}\n\n/* Electron / macOS 0.2.2+ window-drag-regions rule:\n * Exclude ONLY the visible overlay owner box itself (never `[data-window-drag-exclude] *`,\n * so scrolled/clipped descendants cannot register offscreen no-drag rects over headers). */\n[data-window-drag-exclude] {\n  -webkit-app-region: no-drag;\n}\n\n/* --------------------------------------------------------------------------\n * 2. Preset 1: `harness` — 原生清透 / Native Airy\n * -------------------------------------------------------------------------- */\n[data-dsh-style=\"harness\"],\n:where([role=\"dialog\"], [role=\"alertdialog\"], [role=\"menu\"], dialog):where([data-dsh-style=\"harness\"], :has([data-dsh-style=\"harness\"])) {\n  --dsh-font-display: \"Cascadia Code SemiBold\", \"Cascadia Code\", \"YouYuan\", \"幼圆\", \"Noto Sans SC\", monospace;\n  --dsh-font-body: \"Cascadia Code\", \"Cascadia Mono\", \"YouYuan\", \"幼圆\", \"Noto Sans SC\", monospace;\n  --dsh-font-mono: \"Cascadia Mono\", \"Cascadia Code\", \"YouYuan\", \"幼圆\", Consolas, monospace;\n  --dsh-display-weight: 700;\n  --dsh-display-tracking: 0.015em;\n  --dsh-body-tracking: normal;\n  --dsw-font-family: var(--dsh-font-body);\n  --dsw-font-markdown-base: var(--dsh-font-body);\n}\n\n:where(body:not([data-ds-dark-theme])) [data-dsh-style=\"harness\"],\n:where(body:not([data-ds-dark-theme])) :where([role=\"dialog\"], [role=\"alertdialog\"], [role=\"menu\"], dialog):has([data-dsh-style=\"harness\"]) {\n  color-scheme: light;\n  accent-color: var(--dsw-alias-state-business-primary, #4176e6);\n}\n\n/* Standalone fallbacks when host ui-theme stylesheet is not mounted (e.g. jsdom / preview) */\n:root:not([data-dsh-host-tokens]) [data-dsh-style=\"harness\"] {\n  --dsw-radius-xs: 6px;\n  --dsw-radius-sm: 8px;\n  --dsw-radius-md: 12px;\n  --dsw-radius-lg: 16px;\n  --dsw-radius-xl: 20px;\n}\n\nbody:not([data-ds-dark-theme]) [data-dsh-style=\"harness\"] {\n  --dsh-surface-spotlight: rgba(65, 118, 230, 0.06);\n}\n\n/* NEVER TOO DARK: Soft breathable slate when host dark mode is active in `harness` mode */\nbody[data-ds-dark-theme] [data-dsh-style=\"harness\"],\nbody[data-ds-dark-theme] :where([role=\"dialog\"], [role=\"alertdialog\"], [role=\"menu\"], dialog):where([data-dsh-style=\"harness\"], :has([data-dsh-style=\"harness\"])) {\n  color-scheme: dark;\n  accent-color: #7aaaff;\n  --dsw-alias-bg-base: #1f232b;\n  --dsw-alias-bg-layer-1: #272c36;\n  --dsw-alias-bg-layer-2: #2f3542;\n  --dsw-alias-bg-layer-3: #373e4d;\n  --dsw-alias-bg-overlay: #2a303c;\n  --dsw-alias-bg-module-platform: #2c323e;\n  --dsw-alias-settings-card-fill: #262b35;\n  --dsw-alias-settings-card-stroke: rgba(226, 232, 240, 0.12);\n  --dsw-specific-menu: rgba(39, 44, 54, 0.96);\n  --dsw-alias-border-l1: rgba(226, 232, 240, 0.09);\n  --dsw-alias-border-l2: rgba(226, 232, 240, 0.15);\n  --dsw-alias-border-l3: rgba(226, 232, 240, 0.22);\n  --dsw-alias-border-l4: rgba(226, 232, 240, 0.28);\n  --dsw-alias-label-primary: #eef2f7;\n  --dsw-alias-label-secondary: #b6c0cf;\n  --dsw-alias-label-tertiary: #8d98ab;\n  --dsw-alias-label-dimmed: #737e91;\n  --dsw-alias-brand-primary: #7aaaff;\n  --dsw-alias-brand-text: #eef2f7;\n  --dsw-alias-state-business-primary: #7aaaff;\n  --dsw-alias-state-business-tertiary: rgba(122, 170, 255, 0.16);\n  --dsw-alias-link: #8bb6ff;\n  --dsw-alias-button-primary-fill: #5b8def;\n  --dsw-alias-button-primary-hover: #6f9cf4;\n  --dsw-alias-button-primary-ink: #ffffff;\n  --dsw-alias-interactive-bg-hover: rgba(226, 232, 240, 0.07);\n  --dsw-alias-interactive-bg-active: rgba(226, 232, 240, 0.13);\n  --dsw-alias-interactive-bg-hover-accent: rgba(122, 170, 255, 0.15);\n  --dsw-alias-interactive-bg-hover-danger: rgba(248, 113, 113, 0.16);\n  --dsw-alias-state-error-primary: #f87171;\n  --dsw-alias-state-warn-primary: #fbbf24;\n  --dsw-alias-state-warn-label: #fcd34d;\n  --dsw-alias-state-warn-tertiary: rgba(251, 191, 36, 0.15);\n  --dsw-alias-state-success-primary: #4ade80;\n  --dsw-elevation-panel: 0 4px 16px rgba(10, 14, 22, 0.28), 0 0 0 1px rgba(226, 232, 240, 0.12);\n  --dsw-elevation-prominent: 0 14px 38px rgba(10, 14, 22, 0.42), 0 0 0 1px rgba(226, 232, 240, 0.16);\n  --dsh-button-hover-shadow: 0 2px 8px rgba(10, 14, 22, 0.25);\n  --dsh-card-hover-shadow: 0 8px 22px rgba(10, 14, 22, 0.32);\n  --dsh-surface-spotlight: rgba(122, 170, 255, 0.10);\n}\n\n/* --------------------------------------------------------------------------\n * 3. Preset 2: `cream` — 米白纸感 / Warm Cream (Deepened Materiality)\n *    - Stacked-paper double-edge card shadow\n *    - Dashed notebook row dividers\n *    - Warm bookmark-style active tab accent\n * -------------------------------------------------------------------------- */\n[data-dsh-style=\"cream\"],\n:where([role=\"dialog\"], [role=\"alertdialog\"], [role=\"menu\"], dialog):where([data-dsh-style=\"cream\"], :has([data-dsh-style=\"cream\"])) {\n  color-scheme: light;\n  accent-color: #9e5829;\n  --dsw-alias-bg-base: #faf7f0;\n  --dsw-alias-bg-layer-1: #f3efe4;\n  --dsw-alias-bg-layer-2: #eae3d3;\n  --dsw-alias-bg-layer-3: #e0d7c3;\n  --dsw-alias-bg-overlay: #fcfaf4;\n  --dsw-alias-bg-module-platform: #efe9da;\n  --dsw-alias-settings-card-fill: #fdfbf6;\n  --dsw-alias-settings-card-stroke: #d4c8ae;\n  --dsw-specific-menu: rgba(252, 250, 244, 0.97);\n  --dsw-alias-border-l1: #e6dec8;\n  --dsw-alias-border-l2: #d4c8ae;\n  --dsw-alias-border-l3: #c0b193;\n  --dsw-alias-border-l4: #ad9c7c;\n  --dsw-alias-label-primary: #2b2620;\n  --dsw-alias-label-secondary: #655b4e;\n  --dsw-alias-label-tertiary: #857968;\n  --dsw-alias-label-dimmed: #9c907f;\n  --dsw-alias-brand-primary: #9e5829;\n  --dsw-alias-brand-text: #2b2620;\n  --dsw-alias-state-business-primary: #a65e2e;\n  --dsw-alias-state-business-tertiary: rgba(166, 94, 46, 0.13);\n  --dsw-alias-link: #934e20;\n  --dsw-alias-button-primary-fill: #9e5829;\n  --dsw-alias-button-primary-hover: #86481e;\n  --dsw-alias-button-primary-ink: #fffdf9;\n  --dsw-alias-interactive-bg-hover: rgba(108, 84, 50, 0.075);\n  --dsw-alias-interactive-bg-active: rgba(166, 94, 46, 0.14);\n  --dsw-alias-interactive-bg-hover-accent: rgba(166, 94, 46, 0.12);\n  --dsw-alias-interactive-bg-hover-danger: rgba(185, 56, 44, 0.11);\n  --dsw-alias-state-error-primary: #b9382c;\n  --dsw-alias-state-warn-primary: #b45309;\n  --dsw-alias-state-warn-label: #8c3d08;\n  --dsw-alias-state-warn-tertiary: #fdefd6;\n  --dsw-alias-state-success-primary: #2a6f4e;\n  --dsw-radius-xs: 6px;\n  --dsw-radius-sm: 9px;\n  --dsw-radius-md: 13px;\n  --dsw-radius-lg: 16px;\n  --dsw-radius-xl: 20px;\n  --dsw-elevation-panel: 0 1px 2px rgba(68, 52, 32, 0.06), 3px 3px 0 #ebe3d1, 0 0 0 1px rgba(180, 164, 138, 0.42);\n  --dsw-elevation-prominent: 0 14px 34px rgba(68, 52, 32, 0.14), 3px 3px 0 #ebe3d1, 0 0 0 1px rgba(180, 164, 138, 0.48);\n  --dsh-control-border-width: 1px;\n  --dsh-button-hover-shadow: 0 2px 6px rgba(84, 62, 34, 0.09);\n  --dsh-card-shadow: 0 1px 2px rgba(68, 52, 32, 0.06), 3px 3px 0 #ebe3d1;\n  --dsh-card-hover-shadow: 0 4px 10px rgba(68, 52, 32, 0.10), 4px 4px 0 #e2d7be;\n  --dsh-surface-spotlight: rgba(166, 94, 46, 0.08);\n  --dsh-font-display: \"Trebuchet MS\", \"STKaiti\", \"华文楷体\", \"Noto Serif SC SemiBold\", serif;\n  --dsh-font-body: \"Source Sans 3\", \"Noto Sans SC\", \"Microsoft YaHei UI\", sans-serif;\n  --dsh-font-mono: \"Cascadia Mono\", Consolas, monospace;\n  --dsh-display-weight: 700;\n  --dsh-display-tracking: normal;\n  --dsh-body-tracking: normal;\n  --dsw-font-family: var(--dsh-font-body);\n  --dsw-font-markdown-base: var(--dsh-font-body);\n}\n\n[data-dsh-style=\"cream\"] :where([data-dsh-card], .dsh-card) {\n  border-color: var(--dsw-alias-border-l2);\n  box-shadow: var(--dsh-card-shadow);\n}\n\n[data-dsh-style=\"cream\"] :where([data-dsh-row], .dsh-row) {\n  border-block-end: 1px dashed var(--dsw-alias-border-l2);\n}\n\n[data-dsh-style=\"cream\"] [role=\"tab\"][aria-selected=\"true\"] {\n  background: rgba(158, 88, 41, 0.10);\n  color: #7d4119;\n  box-shadow: inset 0 2px 0 rgba(158, 88, 41, 0.22);\n}\n\n[data-dsh-style=\"cream\"] [role=\"tab\"][aria-selected=\"true\"]::after {\n  border-block-end-color: #9e5829;\n  border-block-end-width: 2.5px;\n}\n\n/* --------------------------------------------------------------------------\n * 4. Preset 3: `claude` — Claude 暖书卷 / Claude Warmth (Deepened Materiality)\n *    - Editorial serif on headings, reader/detail titles & card titles (`[data-dsh-serif]`)\n *    - Subtle warm paper texture\n *    - Soft borderless surface cards\n * -------------------------------------------------------------------------- */\n[data-dsh-style=\"claude\"],\n:where([role=\"dialog\"], [role=\"alertdialog\"], [role=\"menu\"], dialog):where([data-dsh-style=\"claude\"], :has([data-dsh-style=\"claude\"])) {\n  color-scheme: light;\n  accent-color: #c96442;\n  --dsw-alias-bg-base: #f5f4ed;\n  --dsw-alias-bg-layer-1: #ece9df;\n  --dsw-alias-bg-layer-2: #e3dfd2;\n  --dsw-alias-bg-layer-3: #d8d3c3;\n  --dsw-alias-bg-overlay: #faf9f4;\n  --dsw-alias-bg-module-platform: #e7e3d6;\n  --dsw-alias-settings-card-fill: #faf9f4;\n  --dsw-alias-settings-card-stroke: transparent;\n  --dsw-specific-menu: rgba(250, 249, 244, 0.97);\n  --dsw-alias-border-l1: #e4e0d3;\n  --dsw-alias-border-l2: #d5d0c3;\n  --dsw-alias-border-l3: #c1bbb0;\n  --dsw-alias-border-l4: #aba495;\n  --dsw-alias-label-primary: #1f1e1b;\n  --dsw-alias-label-secondary: #5d5a51;\n  --dsw-alias-label-tertiary: #7b776c;\n  --dsw-alias-label-dimmed: #948f83;\n  --dsw-alias-brand-primary: #c96442;\n  --dsw-alias-brand-text: #1f1e1b;\n  --dsw-alias-state-business-primary: #c96442;\n  --dsw-alias-state-business-tertiary: rgba(201, 100, 66, 0.14);\n  --dsw-alias-link: #b35030;\n  --dsw-alias-button-primary-fill: #c96442;\n  --dsw-alias-button-primary-hover: #b25232;\n  --dsw-alias-button-primary-ink: #faf9f5;\n  --dsw-alias-interactive-bg-hover: rgba(31, 30, 27, 0.055);\n  --dsw-alias-interactive-bg-active: rgba(201, 100, 66, 0.14);\n  --dsw-alias-interactive-bg-hover-accent: rgba(201, 100, 66, 0.11);\n  --dsw-alias-interactive-bg-hover-danger: rgba(180, 48, 42, 0.11);\n  --dsw-alias-state-error-primary: #b4302a;\n  --dsw-alias-state-warn-primary: #b85d19;\n  --dsw-alias-state-warn-label: #8c430c;\n  --dsw-alias-state-warn-tertiary: #f7e8d6;\n  --dsw-alias-state-success-primary: #2d6a4f;\n  --dsw-radius-xs: 7px;\n  --dsw-radius-sm: 10px;\n  --dsw-radius-md: 14px;\n  --dsw-radius-lg: 18px;\n  --dsw-radius-xl: 22px;\n  --dsw-elevation-panel: 0 2px 12px rgba(31, 30, 27, 0.05), 0 0 0 1px rgba(145, 139, 126, 0.18);\n  --dsw-elevation-prominent: 0 16px 38px rgba(31, 30, 27, 0.13), 0 2px 8px rgba(31, 30, 27, 0.05), 0 0 0 1px rgba(145, 139, 126, 0.24);\n  --dsh-control-border-width: 1px;\n  --dsh-button-hover-shadow: 0 2px 7px rgba(31, 30, 27, 0.08);\n  --dsh-card-shadow: 0 1px 3px rgba(31, 30, 27, 0.05), 0 0 0 1px rgba(145, 139, 126, 0.13);\n  --dsh-card-hover-shadow: 0 8px 22px rgba(31, 30, 27, 0.08), 0 0 0 1px rgba(145, 139, 126, 0.20);\n  --dsh-surface-spotlight: rgba(201, 100, 66, 0.08);\n  --dsh-font-display: \"Palatino Linotype\", Georgia, \"Noto Serif SC SemiBold\", \"Noto Serif SC\", \"STZhongsong\", \"华文中宋\", serif;\n  --dsh-font-body: Georgia, \"Noto Serif SC\", \"STSong\", \"华文宋体\", serif;\n  --dsh-font-mono: \"Cascadia Code\", \"Cascadia Mono\", Consolas, monospace;\n  --dsh-display-weight: 700;\n  --dsh-display-tracking: -0.01em;\n  --dsh-body-tracking: normal;\n  --dsw-font-family: var(--dsh-font-body);\n  --dsw-font-markdown-base: var(--dsh-font-body);\n}\n\n/* Subtle warm paper grain texture */\n[data-dsh-style=\"claude\"] {\n  background-color: var(--dsw-alias-bg-base);\n  background-image:\n    radial-gradient(rgba(31, 30, 27, 0.024) 0.75px, transparent 0),\n    linear-gradient(180deg, rgba(255, 253, 247, 0.45), rgba(236, 233, 223, 0.25));\n  background-size: 16px 16px, 100% 100%;\n}\n\n/* Soft borderless surface cards */\n[data-dsh-style=\"claude\"] :where([data-dsh-card], .dsh-card) {\n  background: var(--dsw-alias-settings-card-fill);\n  border-color: transparent;\n  box-shadow: var(--dsh-card-shadow);\n}\n\n/* Editorial display font applied to workbench headings, reader/detail titles & card titles (overrideable via [data-dsh-font]) */\n[data-dsh-style=\"claude\"] :where(\n  header h1,\n  [data-dsh-editorial-heading],\n  [data-dsh-serif],\n  [data-dsh-card] :is(h2, h3, .dsh-card-title),\n  .dsh-card :is(h2, h3, .dsh-card-title),\n  [data-dsh-reader] :is(h1, h2),\n  .dsh-reader :is(h1, h2)\n),\n:where([role=\"dialog\"], dialog):where([data-dsh-style=\"claude\"], :has([data-dsh-style=\"claude\"])) header h2 {\n  font-family: var(--dsh-font-display);\n  font-weight: var(--dsh-display-weight, 700);\n  letter-spacing: var(--dsh-display-tracking, -0.01em);\n}\n\n/* --------------------------------------------------------------------------\n * 5. Preset 4: `pixel8bit` — 8-Bit 掌机 / Bright 8-Bit (Deepened Materiality)\n *    - 1px dot-matrix header pattern (`6px 6px`)\n *    - 2px solid #1e2826 borders + 2px 2px 0 pixel shadows\n *    - Animated `▶` active row cursor + stepped pixel progress helper\n * -------------------------------------------------------------------------- */\n[data-dsh-style=\"pixel8bit\"],\n:where([role=\"dialog\"], [role=\"alertdialog\"], [role=\"menu\"], dialog):where([data-dsh-style=\"pixel8bit\"], :has([data-dsh-style=\"pixel8bit\"])) {\n  color-scheme: light;\n  accent-color: #2e7d5b;\n  --dsw-alias-bg-base: #f4f6e8;\n  --dsw-alias-bg-layer-1: #e7eed2;\n  --dsw-alias-bg-layer-2: #dbe5c0;\n  --dsw-alias-bg-layer-3: #cedaad;\n  --dsw-alias-bg-overlay: #f9fbf0;\n  --dsw-alias-bg-module-platform: #e2ebc9;\n  --dsw-alias-settings-card-fill: #edf2dc;\n  --dsw-alias-settings-card-stroke: #1e2826;\n  --dsw-specific-menu: #f9fbf0;\n  --dsw-alias-border-l1: #7e9478;\n  --dsw-alias-border-l2: #1e2826;\n  --dsw-alias-border-l3: #1e2826;\n  --dsw-alias-border-l4: #1e2826;\n  --dsw-alias-label-primary: #1e2826;\n  --dsw-alias-label-secondary: #3d514c;\n  --dsw-alias-label-tertiary: #58706a;\n  --dsw-alias-label-dimmed: #6e857f;\n  --dsw-alias-brand-primary: #2e7d5b;\n  --dsw-alias-brand-text: #1e2826;\n  --dsw-alias-state-business-primary: #2e7d5b;\n  --dsw-alias-state-business-tertiary: rgba(46, 125, 91, 0.18);\n  --dsw-alias-link: #226448;\n  --dsw-alias-button-primary-fill: #2e7d5b;\n  --dsw-alias-button-primary-hover: #24674a;\n  --dsw-alias-button-primary-ink: #f4f6e8;\n  --dsw-alias-interactive-bg-hover: #dfe9c4;\n  --dsw-alias-interactive-bg-active: #cfe0ad;\n  --dsw-alias-interactive-bg-hover-accent: rgba(46, 125, 91, 0.16);\n  --dsw-alias-interactive-bg-hover-danger: rgba(217, 91, 67, 0.18);\n  --dsw-alias-state-error-primary: #d95b43;\n  --dsw-alias-state-warn-primary: #c47614;\n  --dsw-alias-state-warn-label: #7a4808;\n  --dsw-alias-state-warn-tertiary: #f6e7b4;\n  --dsw-alias-state-success-primary: #2e7d5b;\n  --dsh-pixel-accent-secondary: #d95b43;\n  --dsw-radius-xs: 0px;\n  --dsw-radius-sm: 0px;\n  --dsw-radius-md: 0px;\n  --dsw-radius-lg: 0px;\n  --dsw-radius-xl: 0px;\n  --dsw-corner-shape: square;\n  --dsw-elevation-panel: 2px 2px 0px #1e2826;\n  --dsw-elevation-prominent: 4px 4px 0px #1e2826;\n  --dsh-control-border-width: 2px;\n  --dsh-button-shadow: 2px 2px 0px #1e2826;\n  --dsh-button-hover-shadow: 3px 3px 0px #1e2826;\n  --dsh-card-shadow: 2px 2px 0px #1e2826;\n  --dsh-card-hover-shadow: 4px 4px 0px #1e2826;\n  --dsh-surface-spotlight: rgba(46, 125, 91, 0.12);\n  --dsh-font-display: \"Cascadia Code SemiBold\", \"Cascadia Code\", \"YouYuan\", \"幼圆\", \"Noto Sans SC\", monospace;\n  --dsh-font-body: \"Cascadia Code\", \"Cascadia Mono\", \"YouYuan\", \"幼圆\", \"Noto Sans SC\", monospace;\n  --dsh-font-mono: \"Cascadia Mono\", \"Cascadia Code\", \"YouYuan\", \"幼圆\", Consolas, monospace;\n  --dsh-display-weight: 700;\n  --dsh-display-tracking: 0.03em;\n  --dsh-body-tracking: 0.03em;\n  --dsw-font-family: var(--dsh-font-body);\n  --dsw-font-markdown-base: var(--dsh-font-body);\n}\n\n/* Subtle 1px dot-matrix header pattern (`6px 6px`) */\n[data-dsh-style=\"pixel8bit\"] :where(.dsh-header, [data-dsh-header], .dsh-wb-header) {\n  background-color: var(--dsw-alias-bg-layer-1);\n  background-image: radial-gradient(rgba(30, 40, 38, 0.14) 1px, transparent 0);\n  background-size: 6px 6px;\n  border-block-end: 2px solid #1e2826;\n}\n\n/* Crisp 0px corners, 2px solid borders, and arcade shadows in `pixel8bit` */\n[data-dsh-style=\"pixel8bit\"] :where(button, input, select, textarea, [role=\"button\"], [role=\"tab\"], [role=\"menuitem\"], [role=\"menuitemradio\"], [data-dsh-card], .dsh-card, [data-dsh-panel], .dsh-panel),\n:where([role=\"dialog\"], [role=\"alertdialog\"], [role=\"menu\"], dialog):where([data-dsh-style=\"pixel8bit\"], :has([data-dsh-style=\"pixel8bit\"])),\n:where([role=\"dialog\"], [role=\"alertdialog\"], [role=\"menu\"], dialog):where([data-dsh-style=\"pixel8bit\"], :has([data-dsh-style=\"pixel8bit\"])) :where(button, input, select, textarea, [role=\"menuitem\"], [role=\"menuitemradio\"]) {\n  border-radius: 0px !important;\n  corner-shape: square;\n}\n\n[data-dsh-style=\"pixel8bit\"] :where(button:not([role=\"tab\"]), .dsh-btn),\n:where([role=\"dialog\"], [role=\"alertdialog\"], dialog):where([data-dsh-style=\"pixel8bit\"], :has([data-dsh-style=\"pixel8bit\"])) :where(button:not([role=\"tab\"]), .dsh-btn) {\n  border: 2px solid #1e2826;\n  box-shadow: 2px 2px 0px #1e2826;\n}\n\n[data-dsh-style=\"pixel8bit\"] :where([data-dsh-card], .dsh-card, [data-dsh-panel], .dsh-panel) {\n  border: 2px solid #1e2826;\n  box-shadow: 2px 2px 0px #1e2826;\n}\n\n[data-dsh-style=\"pixel8bit\"] :where(input:not([type=\"checkbox\"]):not([type=\"radio\"]):not([type=\"range\"]), select, textarea),\n:where([role=\"dialog\"], [role=\"alertdialog\"], dialog):where([data-dsh-style=\"pixel8bit\"], :has([data-dsh-style=\"pixel8bit\"])) :where(input:not([type=\"checkbox\"]):not([type=\"radio\"]):not([type=\"range\"]), select, textarea) {\n  border-width: 2px;\n  border-color: #1e2826;\n}\n\n:where([role=\"dialog\"], [role=\"alertdialog\"], [role=\"menu\"], dialog):where([data-dsh-style=\"pixel8bit\"], :has([data-dsh-style=\"pixel8bit\"])) {\n  border: 2px solid #1e2826 !important;\n  box-shadow: 4px 4px 0px #1e2826 !important;\n  backdrop-filter: none;\n}\n\n[data-dsh-style=\"pixel8bit\"] [role=\"tab\"][aria-selected=\"true\"]::after,\n[data-dsh-style=\"pixel8bit\"] .dsh-tab-indicator {\n  border-block-end-color: #d95b43;\n  border-block-end-width: 3px;\n}\n\n/* Animated `▶` active row cursor (`[data-dsh-row][data-active=\"true\"]` or `.dsh-pixel-cursor`) */\n.dsh-pixel-cursor {\n  display: none;\n  flex: none;\n  font-size: 10px;\n  line-height: 1;\n  color: var(--dsh-pixel-accent-secondary, #d95b43);\n}\n\n@keyframes dsh-pixel-cursor-nudge {\n  0%, 100% { translate: 0px 0px; }\n  50% { translate: 2px 0px; }\n}\n\n[data-dsh-style=\"pixel8bit\"] :where([data-dsh-row], .dsh-row):where([data-active=\"true\"], [data-selected=\"true\"], [aria-selected=\"true\"]) {\n  background-color: var(--dsw-alias-interactive-bg-active);\n  box-shadow: inset 3px 0 0 #d95b43;\n}\n\n[data-dsh-style=\"pixel8bit\"] :where([data-dsh-row], .dsh-row):where([data-active=\"true\"], [data-selected=\"true\"], [aria-selected=\"true\"]):not(:has(.dsh-pixel-cursor))::before {\n  content: \"▶\";\n  display: inline-block;\n  flex: none;\n  margin-inline-end: 6px;\n  font-size: 10px;\n  line-height: 1;\n  color: #d95b43;\n}\n\n[data-dsh-style=\"pixel8bit\"] :where([data-active=\"true\"], [data-selected=\"true\"], [aria-selected=\"true\"]) .dsh-pixel-cursor {\n  display: inline-flex;\n  align-items: center;\n}\n\n@media (prefers-reduced-motion: no-preference) {\n  [data-dsh-style=\"pixel8bit\"] :where([data-dsh-row], .dsh-row):where([data-active=\"true\"], [data-selected=\"true\"], [aria-selected=\"true\"]):not(:has(.dsh-pixel-cursor))::before,\n  [data-dsh-style=\"pixel8bit\"] :where([data-active=\"true\"], [data-selected=\"true\"], [aria-selected=\"true\"]) .dsh-pixel-cursor {\n    animation: dsh-pixel-cursor-nudge 760ms steps(2, end) infinite;\n  }\n}\n\n/* --------------------------------------------------------------------------\n * 6. Preset 5: `mint` — 晴空薄荷 / Airy Mint\n * -------------------------------------------------------------------------- */\n[data-dsh-style=\"mint\"],\n:where([role=\"dialog\"], [role=\"alertdialog\"], [role=\"menu\"], dialog):where([data-dsh-style=\"mint\"], :has([data-dsh-style=\"mint\"])) {\n  color-scheme: light;\n  accent-color: #0f766e;\n  --dsw-alias-bg-base: #f5fafb;\n  --dsw-alias-bg-layer-1: #eaf3f6;\n  --dsw-alias-bg-layer-2: #dcebf0;\n  --dsw-alias-bg-layer-3: #cce1e8;\n  --dsw-alias-bg-overlay: #fafdff;\n  --dsw-alias-bg-module-platform: #e3eff3;\n  --dsw-alias-settings-card-fill: #eef6f8;\n  --dsw-alias-settings-card-stroke: #c7dde5;\n  --dsw-specific-menu: rgba(250, 253, 255, 0.97);\n  --dsw-alias-border-l1: #d5e6ec;\n  --dsw-alias-border-l2: #bdd5de;\n  --dsw-alias-border-l3: #9ec0cd;\n  --dsw-alias-border-l4: #7faab9;\n  --dsw-alias-label-primary: #132a2e;\n  --dsw-alias-label-secondary: #426067;\n  --dsw-alias-label-tertiary: #628088;\n  --dsw-alias-label-dimmed: #7c98a0;\n  --dsw-alias-brand-primary: #0f766e;\n  --dsw-alias-brand-text: #132a2e;\n  --dsw-alias-state-business-primary: #0f766e;\n  --dsw-alias-state-business-tertiary: rgba(15, 118, 110, 0.13);\n  --dsw-alias-link: #0284c7;\n  --dsw-alias-button-primary-fill: #0f766e;\n  --dsw-alias-button-primary-hover: #0d635c;\n  --dsw-alias-button-primary-ink: #f5fafb;\n  --dsw-alias-interactive-bg-hover: rgba(15, 118, 110, 0.07);\n  --dsw-alias-interactive-bg-active: rgba(15, 118, 110, 0.13);\n  --dsw-alias-interactive-bg-hover-accent: rgba(2, 132, 199, 0.11);\n  --dsw-alias-interactive-bg-hover-danger: rgba(200, 50, 64, 0.11);\n  --dsw-alias-state-error-primary: #c83240;\n  --dsw-alias-state-warn-primary: #b4690e;\n  --dsw-alias-state-warn-label: #864c07;\n  --dsw-alias-state-warn-tertiary: #fdf1d6;\n  --dsw-alias-state-success-primary: #0f766e;\n  --dsh-mint-sky-accent: #0284c7;\n  --dsw-radius-xs: 6px;\n  --dsw-radius-sm: 9px;\n  --dsw-radius-md: 12px;\n  --dsw-radius-lg: 16px;\n  --dsw-radius-xl: 20px;\n  --dsw-elevation-panel: 0 3px 12px rgba(15, 76, 92, 0.07), 0 0 0 1px rgba(127, 170, 185, 0.28);\n  --dsw-elevation-prominent: 0 14px 34px rgba(15, 76, 92, 0.13), 0 2px 6px rgba(15, 76, 92, 0.05), 0 0 0 1px rgba(127, 170, 185, 0.34);\n  --dsh-control-border-width: 1px;\n  --dsh-button-hover-shadow: 0 2px 7px rgba(15, 118, 110, 0.11);\n  --dsh-card-hover-shadow: 0 8px 22px rgba(2, 132, 199, 0.10);\n  --dsh-surface-spotlight: rgba(2, 132, 199, 0.08);\n  --dsh-font-display: \"Cascadia Code SemiBold\", \"Cascadia Code\", \"YouYuan\", \"幼圆\", \"Noto Sans SC\", monospace;\n  --dsh-font-body: \"Cascadia Code\", \"Cascadia Mono\", \"YouYuan\", \"幼圆\", \"Noto Sans SC\", monospace;\n  --dsh-font-mono: \"Cascadia Mono\", \"Cascadia Code\", \"YouYuan\", \"幼圆\", Consolas, monospace;\n  --dsh-display-weight: 700;\n  --dsh-display-tracking: 0.015em;\n  --dsh-body-tracking: normal;\n  --dsw-font-family: var(--dsh-font-body);\n  --dsw-font-markdown-base: var(--dsh-font-body);\n}\n\n/* --------------------------------------------------------------------------\n * 7. Preset 6: `glass` — 晴昼琉璃 / Daylight Glass (NEW!)\n *    - Pastel aurora daylight mesh background over `#f3f7ff`\n *    - Frosted translucent glass surfaces (`rgba(255,255,255,0.70)`, blur(14px) saturate(140%))\n *    - Crisp white specular inner border (`inset 0 1px 0 rgba(255,255,255,0.9)`)\n * -------------------------------------------------------------------------- */\n[data-dsh-style=\"glass\"],\n:where([role=\"dialog\"], [role=\"alertdialog\"], [role=\"menu\"], dialog):where([data-dsh-style=\"glass\"], :has([data-dsh-style=\"glass\"])) {\n  color-scheme: light;\n  accent-color: #4f6df5;\n  --dsw-alias-bg-base: #f3f7ff;\n  --dsw-alias-bg-layer-1: rgba(255, 255, 255, 0.70);\n  --dsw-alias-bg-layer-2: rgba(240, 245, 255, 0.78);\n  --dsw-alias-bg-layer-3: rgba(226, 236, 255, 0.84);\n  --dsw-alias-bg-overlay: rgba(255, 255, 255, 0.84);\n  --dsw-alias-bg-module-platform: rgba(244, 248, 255, 0.76);\n  --dsw-alias-settings-card-fill: rgba(255, 255, 255, 0.70);\n  --dsw-alias-settings-card-stroke: rgba(255, 255, 255, 0.82);\n  --dsw-specific-menu: rgba(255, 255, 255, 0.86);\n  --dsw-alias-border-l1: rgba(148, 173, 219, 0.24);\n  --dsw-alias-border-l2: rgba(132, 159, 212, 0.34);\n  --dsw-alias-border-l3: rgba(114, 144, 204, 0.46);\n  --dsw-alias-border-l4: rgba(96, 128, 196, 0.56);\n  --dsw-alias-label-primary: #172033;\n  --dsw-alias-label-secondary: #4b5973;\n  --dsw-alias-label-tertiary: #6b7994;\n  --dsw-alias-label-dimmed: #8895ae;\n  --dsw-alias-brand-primary: #4f6df5;\n  --dsw-alias-brand-text: #172033;\n  --dsw-alias-state-business-primary: #4f6df5;\n  --dsw-alias-state-business-tertiary: rgba(79, 109, 245, 0.14);\n  --dsw-alias-link: #3b59e2;\n  --dsw-alias-button-primary-fill: #4f6df5;\n  --dsw-alias-button-primary-hover: #3f5de3;\n  --dsw-alias-button-primary-ink: #ffffff;\n  --dsw-alias-interactive-bg-hover: rgba(79, 109, 245, 0.08);\n  --dsw-alias-interactive-bg-active: rgba(79, 109, 245, 0.14);\n  --dsw-alias-interactive-bg-hover-accent: rgba(14, 165, 233, 0.12);\n  --dsw-alias-interactive-bg-hover-danger: rgba(220, 56, 82, 0.12);\n  --dsw-alias-state-error-primary: #d13850;\n  --dsw-alias-state-warn-primary: #c06a12;\n  --dsw-alias-state-warn-label: #8a4a09;\n  --dsw-alias-state-warn-tertiary: rgba(251, 191, 36, 0.18);\n  --dsw-alias-state-success-primary: #15805d;\n  --dsw-radius-xs: 8px;\n  --dsw-radius-sm: 11px;\n  --dsw-radius-md: 15px;\n  --dsw-radius-lg: 18px;\n  --dsw-radius-xl: 22px;\n  --dsw-elevation-panel: inset 0 1px 0 rgba(255, 255, 255, 0.9), 0 4px 18px rgba(59, 92, 168, 0.08), 0 0 0 1px rgba(255, 255, 255, 0.72);\n  --dsw-elevation-prominent: inset 0 1px 0 rgba(255, 255, 255, 0.95), 0 16px 40px rgba(59, 92, 168, 0.16), 0 0 0 1px rgba(255, 255, 255, 0.80);\n  --dsh-control-border-width: 1px;\n  --dsh-button-hover-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.92), 0 3px 10px rgba(79, 109, 245, 0.12);\n  --dsh-card-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.9), 0 4px 16px rgba(59, 92, 168, 0.07);\n  --dsh-card-hover-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.96), 0 10px 26px rgba(59, 92, 168, 0.12);\n  --dsh-surface-spotlight: rgba(79, 109, 245, 0.08);\n  --dsh-font-display: \"Cascadia Code SemiBold\", \"Cascadia Code\", \"YouYuan\", \"幼圆\", \"Noto Sans SC\", monospace;\n  --dsh-font-body: \"Cascadia Code\", \"Cascadia Mono\", \"YouYuan\", \"幼圆\", \"Noto Sans SC\", monospace;\n  --dsh-font-mono: \"Cascadia Mono\", \"Cascadia Code\", \"YouYuan\", \"幼圆\", Consolas, monospace;\n  --dsh-display-weight: 700;\n  --dsh-display-tracking: 0.015em;\n  --dsh-body-tracking: normal;\n  --dsw-font-family: var(--dsh-font-body);\n  --dsw-font-markdown-base: var(--dsh-font-body);\n}\n\n[data-dsh-style=\"glass\"] {\n  background-color: #f3f7ff;\n  background-image:\n    radial-gradient(64% 58% at 12% 8%, rgba(125, 211, 252, 0.30) 0%, transparent 65%),\n    radial-gradient(58% 52% at 88% 14%, rgba(196, 181, 253, 0.28) 0%, transparent 65%),\n    radial-gradient(60% 55% at 52% 96%, rgba(153, 246, 228, 0.24) 0%, transparent 68%);\n}\n\n[data-dsh-style=\"glass\"] :where([data-dsh-card], .dsh-card, [data-dsh-panel], .dsh-panel, .dsh-header, [data-dsh-header]),\n:where([role=\"dialog\"], [role=\"alertdialog\"], [role=\"menu\"], dialog):where([data-dsh-style=\"glass\"], :has([data-dsh-style=\"glass\"])) {\n  background: rgba(255, 255, 255, 0.70);\n  -webkit-backdrop-filter: blur(14px) saturate(140%);\n  backdrop-filter: blur(14px) saturate(140%);\n  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.9), 0 4px 16px rgba(59, 92, 168, 0.07);\n}\n\n@supports not (backdrop-filter: blur(1px)) {\n  [data-dsh-style=\"glass\"] :where([data-dsh-card], .dsh-card, [data-dsh-panel], .dsh-panel, .dsh-header, [data-dsh-header]),\n  :where([role=\"dialog\"], [role=\"alertdialog\"], [role=\"menu\"], dialog):where([data-dsh-style=\"glass\"], :has([data-dsh-style=\"glass\"])) {\n    background: rgba(255, 255, 255, 0.92);\n  }\n}\n\n/* --------------------------------------------------------------------------\n * 8. Preset 7: `eink` — 护眼墨水屏 / E-Ink Paper (NEW!)\n *    - Warm matte e-paper (`#F2F1EC` base, `#EAE8E1` layer, `#F7F6F2` card)\n *    - High-contrast `#171716` charcoal ink, crisp `1px solid #9E9C93` rules\n *    - `2px–4px` sharp corners, ultra-snappy `60ms` transitions, zero chromatic distraction\n * -------------------------------------------------------------------------- */\n[data-dsh-style=\"eink\"],\n:where([role=\"dialog\"], [role=\"alertdialog\"], [role=\"menu\"], dialog):where([data-dsh-style=\"eink\"], :has([data-dsh-style=\"eink\"])) {\n  color-scheme: light;\n  accent-color: #171716;\n  --dsw-alias-bg-base: #f2f1ec;\n  --dsw-alias-bg-layer-1: #eae8e1;\n  --dsw-alias-bg-layer-2: #e1dfd6;\n  --dsw-alias-bg-layer-3: #d6d3c9;\n  --dsw-alias-bg-overlay: #f7f6f2;\n  --dsw-alias-bg-module-platform: #eae8e1;\n  --dsw-alias-settings-card-fill: #f7f6f2;\n  --dsw-alias-settings-card-stroke: #9e9c93;\n  --dsw-specific-menu: #f7f6f2;\n  --dsw-alias-border-l1: #c5c2b8;\n  --dsw-alias-border-l2: #9e9c93;\n  --dsw-alias-border-l3: #78766e;\n  --dsw-alias-border-l4: #54534d;\n  --dsw-alias-label-primary: #171716;\n  --dsw-alias-label-secondary: #484742;\n  --dsw-alias-label-tertiary: #66645d;\n  --dsw-alias-label-dimmed: #807e76;\n  --dsw-alias-brand-primary: #171716;\n  --dsw-alias-brand-text: #171716;\n  --dsw-alias-state-business-primary: #171716;\n  --dsw-alias-state-business-tertiary: rgba(23, 23, 22, 0.10);\n  --dsw-alias-link: #171716;\n  --dsw-alias-button-primary-fill: #171716;\n  --dsw-alias-button-primary-hover: #2f2f2c;\n  --dsw-alias-button-primary-ink: #f7f6f2;\n  --dsw-alias-interactive-bg-hover: rgba(23, 23, 22, 0.06);\n  --dsw-alias-interactive-bg-active: rgba(23, 23, 22, 0.12);\n  --dsw-alias-interactive-bg-hover-accent: rgba(23, 23, 22, 0.08);\n  --dsw-alias-interactive-bg-hover-danger: rgba(23, 23, 22, 0.10);\n  --dsw-alias-state-error-primary: #2d2c28;\n  --dsw-alias-state-warn-primary: #45443e;\n  --dsw-alias-state-warn-label: #171716;\n  --dsw-alias-state-warn-tertiary: #e6e4db;\n  --dsw-alias-state-success-primary: #242422;\n  --dsw-radius-xs: 2px;\n  --dsw-radius-sm: 3px;\n  --dsw-radius-md: 4px;\n  --dsw-radius-lg: 4px;\n  --dsw-radius-xl: 4px;\n  --dsw-elevation-panel: 0 0 0 1px #9e9c93;\n  --dsw-elevation-prominent: 0 2px 0 #9e9c93, 0 0 0 1px #78766e;\n  --dsh-control-border-width: 1px;\n  --dsh-motion-fast: 60ms;\n  --dsh-motion-base: 60ms;\n  --dsh-motion-dialog: 60ms;\n  --dsh-button-shadow: none;\n  --dsh-button-hover-shadow: none;\n  --dsh-card-shadow: none;\n  --dsh-card-hover-shadow: none;\n  --dsh-surface-spotlight: rgba(23, 23, 22, 0.06);\n  --dsh-font-display: \"Palatino Linotype\", Georgia, \"Noto Serif SC SemiBold\", \"Noto Serif SC\", \"STZhongsong\", \"华文中宋\", serif;\n  --dsh-font-body: Georgia, \"Noto Serif SC\", \"STSong\", \"华文宋体\", serif;\n  --dsh-font-mono: \"Cascadia Code\", \"Cascadia Mono\", Consolas, monospace;\n  --dsh-display-weight: 700;\n  --dsh-display-tracking: normal;\n  --dsh-body-tracking: normal;\n  --dsw-font-family: var(--dsh-font-body);\n  --dsw-font-markdown-base: var(--dsh-font-body);\n}\n\n[data-dsh-style=\"eink\"] :where([data-dsh-card], .dsh-card, [data-dsh-panel], .dsh-panel) {\n  border: 1px solid #9e9c93;\n  box-shadow: none;\n}\n\n[data-dsh-style=\"eink\"] :where([data-dsh-row], .dsh-row) {\n  border-block-end: 1px solid #c5c2b8;\n}\n\n[data-dsh-style=\"eink\"] :where(button, [role=\"button\"], [data-dsh-card], .dsh-card, [data-dsh-row], .dsh-row) {\n  translate: none !important;\n  scale: none !important;\n  transition-duration: 60ms;\n}\n\n/* --------------------------------------------------------------------------\n * 9. Preset 8: `blueprint` — 工程晒图 / Blueprint (NEW!)\n *    - Light cyanotype drafting paper (`#eaf3fb`) + dual millimeter grid (`24px` + `6px`)\n *    - Prussian engineering blue (`#0d3b66`) ink & `1px solid #1b5e8a` crisp rules\n *    - Industrial safety-orange (`#e05a2b`) primary accent + technical monospace\n *    - Tiny `+` crosshair registration ticks on cards\n * -------------------------------------------------------------------------- */\n[data-dsh-style=\"blueprint\"],\n:where([role=\"dialog\"], [role=\"alertdialog\"], [role=\"menu\"], dialog):where([data-dsh-style=\"blueprint\"], :has([data-dsh-style=\"blueprint\"])) {\n  color-scheme: light;\n  accent-color: #e05a2b;\n  --dsw-alias-bg-base: #eaf3fb;\n  --dsw-alias-bg-layer-1: #f4f9fe;\n  --dsw-alias-bg-layer-2: #dfeef9;\n  --dsw-alias-bg-layer-3: #cfe3f4;\n  --dsw-alias-bg-overlay: #f7fbff;\n  --dsw-alias-bg-module-platform: #e3f0fa;\n  --dsw-alias-settings-card-fill: rgba(244, 249, 254, 0.92);\n  --dsw-alias-settings-card-stroke: #1b5e8a;\n  --dsw-specific-menu: rgba(247, 251, 255, 0.98);\n  --dsw-alias-border-l1: rgba(27, 94, 138, 0.28);\n  --dsw-alias-border-l2: #1b5e8a;\n  --dsw-alias-border-l3: #0d3b66;\n  --dsw-alias-border-l4: #092b4c;\n  --dsw-alias-label-primary: #0d3b66;\n  --dsw-alias-label-secondary: #1d4e78;\n  --dsw-alias-label-tertiary: #3b6f99;\n  --dsw-alias-label-dimmed: #5b89ad;\n  --dsw-alias-brand-primary: #e05a2b;\n  --dsw-alias-brand-text: #0d3b66;\n  --dsw-alias-state-business-primary: #e05a2b;\n  --dsw-alias-state-business-tertiary: rgba(224, 90, 43, 0.14);\n  --dsw-alias-link: #0d3b66;\n  --dsw-alias-button-primary-fill: #e05a2b;\n  --dsw-alias-button-primary-hover: #c94b20;\n  --dsw-alias-button-primary-ink: #ffffff;\n  --dsw-alias-interactive-bg-hover: rgba(27, 94, 138, 0.08);\n  --dsw-alias-interactive-bg-active: rgba(224, 90, 43, 0.13);\n  --dsw-alias-interactive-bg-hover-accent: rgba(224, 90, 43, 0.12);\n  --dsw-alias-interactive-bg-hover-danger: rgba(185, 45, 38, 0.12);\n  --dsw-alias-state-error-primary: #b92d26;\n  --dsw-alias-state-warn-primary: #c05614;\n  --dsw-alias-state-warn-label: #7c3408;\n  --dsw-alias-state-warn-tertiary: #fce9d8;\n  --dsw-alias-state-success-primary: #156d5b;\n  --dsw-radius-xs: 2px;\n  --dsw-radius-sm: 2px;\n  --dsw-radius-md: 3px;\n  --dsw-radius-lg: 4px;\n  --dsw-radius-xl: 4px;\n  --dsw-elevation-panel: 0 0 0 1px #1b5e8a;\n  --dsw-elevation-prominent: 0 8px 24px rgba(13, 59, 102, 0.14), 0 0 0 1px #1b5e8a;\n  --dsh-control-border-width: 1px;\n  --dsh-button-shadow: none;\n  --dsh-button-hover-shadow: 0 2px 0 #1b5e8a;\n  --dsh-card-shadow: 0 0 0 1px #1b5e8a;\n  --dsh-card-hover-shadow: 0 3px 0 #1b5e8a;\n  --dsh-surface-spotlight: rgba(27, 94, 138, 0.09);\n  --dsh-font-display: \"Cascadia Mono SemiBold\", \"Cascadia Mono\", \"STZhongsong\", \"华文中宋\", \"FangSong\", \"仿宋\", monospace;\n  --dsh-font-body: \"Cascadia Mono\", \"STFangsong\", \"华文仿宋\", \"FangSong\", \"仿宋\", monospace;\n  --dsh-font-mono: \"Cascadia Mono\", \"STFangsong\", \"华文仿宋\", \"FangSong\", \"仿宋\", monospace;\n  --dsh-display-weight: 700;\n  --dsh-display-tracking: 0.02em;\n  --dsh-body-tracking: 0.02em;\n  --dsw-font-family: var(--dsh-font-body);\n  --dsw-font-markdown-base: var(--dsh-font-body);\n}\n\n[data-dsh-style=\"blueprint\"] {\n  background-color: #eaf3fb;\n  background-image:\n    linear-gradient(to right, rgba(18, 78, 120, 0.09) 1px, transparent 1px),\n    linear-gradient(to bottom, rgba(18, 78, 120, 0.09) 1px, transparent 1px),\n    linear-gradient(to right, rgba(18, 78, 120, 0.045) 1px, transparent 1px),\n    linear-gradient(to bottom, rgba(18, 78, 120, 0.045) 1px, transparent 1px);\n  background-size: 24px 24px, 24px 24px, 6px 6px, 6px 6px;\n}\n\n[data-dsh-style=\"blueprint\"] :where(.dsh-header, [data-dsh-header], .dsh-wb-header) {\n  background: rgba(244, 249, 254, 0.90);\n  border-block-end: 1px solid #1b5e8a;\n}\n\n[data-dsh-style=\"blueprint\"] :where([data-dsh-card], .dsh-card) {\n  position: relative;\n  border: 1px solid #1b5e8a;\n  background: rgba(244, 249, 254, 0.92);\n}\n\n[data-dsh-style=\"blueprint\"] :where([data-dsh-card], .dsh-card):not([role=\"tab\"])::after {\n  content: \"+\";\n  position: absolute;\n  inset-block-start: 4px;\n  inset-inline-end: 6px;\n  font-family: ui-monospace, \"Cascadia Mono\", Menlo, Consolas, monospace;\n  font-size: 11px;\n  line-height: 1;\n  color: #e05a2b;\n  opacity: 0.78;\n  pointer-events: none;\n}\n\n[data-dsh-style=\"blueprint\"] :where(button:not([role=\"tab\"]), .dsh-btn) {\n  border: 1px solid #1b5e8a;\n}\n\n/* --------------------------------------------------------------------------\n * 10. Preset 9: `risograph` — 波普孔版 / Riso Zine (NEW!)\n *     - Warm printmaking paper (`#faf6ee`), bold `2px solid #18181b` outlines\n *     - Vibrant offset hard shadows (`3px 3px 0 #18181b` buttons, `4px 4px 0 #2563eb`/`#ff3e7f` cards/dialogs)\n *     - Subtle halftone dot pattern (`7px 7px`) on header\n *     - Electric pink `#ff3e7f` & marker-yellow `#fde047` accents + `translate(2px, 2px)` shadow-collapse press\n * -------------------------------------------------------------------------- */\n[data-dsh-style=\"risograph\"],\n:where([role=\"dialog\"], [role=\"alertdialog\"], [role=\"menu\"], dialog):where([data-dsh-style=\"risograph\"], :has([data-dsh-style=\"risograph\"])) {\n  color-scheme: light;\n  accent-color: #ff3e7f;\n  --dsw-alias-bg-base: #faf6ee;\n  --dsw-alias-bg-layer-1: #f5efe2;\n  --dsw-alias-bg-layer-2: #ede4d1;\n  --dsw-alias-bg-layer-3: #e3d7be;\n  --dsw-alias-bg-overlay: #fffdf7;\n  --dsw-alias-bg-module-platform: #f5efe2;\n  --dsw-alias-settings-card-fill: #fffdf7;\n  --dsw-alias-settings-card-stroke: #18181b;\n  --dsw-specific-menu: #fffdf7;\n  --dsw-alias-border-l1: #d4cbb8;\n  --dsw-alias-border-l2: #18181b;\n  --dsw-alias-border-l3: #18181b;\n  --dsw-alias-border-l4: #18181b;\n  --dsw-alias-label-primary: #18181b;\n  --dsw-alias-label-secondary: #3f3f46;\n  --dsw-alias-label-tertiary: #52525b;\n  --dsw-alias-label-dimmed: #71717a;\n  --dsw-alias-brand-primary: #ff3e7f;\n  --dsw-alias-brand-text: #18181b;\n  --dsw-alias-state-business-primary: #ff3e7f;\n  --dsw-alias-state-business-tertiary: rgba(255, 62, 127, 0.14);\n  --dsw-alias-link: #2563eb;\n  --dsw-alias-button-primary-fill: #ff3e7f;\n  --dsw-alias-button-primary-hover: #e62e6d;\n  --dsw-alias-button-primary-ink: #ffffff;\n  --dsw-alias-interactive-bg-hover: rgba(253, 224, 71, 0.38);\n  --dsw-alias-interactive-bg-active: #fde047;\n  --dsw-alias-interactive-bg-hover-accent: rgba(37, 99, 235, 0.14);\n  --dsw-alias-interactive-bg-hover-danger: rgba(255, 62, 127, 0.18);\n  --dsw-alias-state-error-primary: #dc2626;\n  --dsw-alias-state-warn-primary: #ca8a04;\n  --dsw-alias-state-warn-label: #713f12;\n  --dsw-alias-state-warn-tertiary: #fef08a;\n  --dsw-alias-state-success-primary: #15803d;\n  --dsw-radius-xs: 3px;\n  --dsw-radius-sm: 4px;\n  --dsw-radius-md: 6px;\n  --dsw-radius-lg: 8px;\n  --dsw-radius-xl: 10px;\n  --dsw-elevation-panel: 4px 4px 0px #2563eb;\n  --dsw-elevation-prominent: 4px 4px 0px #ff3e7f;\n  --dsh-control-border-width: 2px;\n  --dsh-button-shadow: 3px 3px 0px #18181b;\n  --dsh-button-hover-shadow: 4px 4px 0px #2563eb;\n  --dsh-card-shadow: 4px 4px 0px #2563eb;\n  --dsh-card-hover-shadow: 5px 5px 0px #ff3e7f;\n  --dsh-surface-spotlight: rgba(253, 224, 71, 0.35);\n  --dsh-font-display: Impact, \"Arial Black\", \"Noto Sans SC Black\", \"SimHei\", \"黑体\", sans-serif;\n  --dsh-font-body: \"Source Sans 3\", \"Noto Sans SC Medium\", \"Noto Sans SC\", sans-serif;\n  --dsh-font-mono: \"Cascadia Code\", \"Cascadia Mono\", Consolas, monospace;\n  --dsh-display-weight: 900;\n  --dsh-display-tracking: -0.02em;\n  --dsh-body-tracking: normal;\n  --dsw-font-family: var(--dsh-font-body);\n  --dsw-font-markdown-base: var(--dsh-font-body);\n}\n\n[data-dsh-style=\"risograph\"] :where(.dsh-header, [data-dsh-header], .dsh-wb-header) {\n  background-color: #fffdf7;\n  background-image: radial-gradient(rgba(255, 62, 127, 0.15) 1px, transparent 0);\n  background-size: 7px 7px;\n  border-block-end: 2px solid #18181b;\n}\n\n[data-dsh-style=\"risograph\"] :where(button:not([role=\"tab\"]), .dsh-btn),\n:where([role=\"dialog\"], [role=\"alertdialog\"], dialog):where([data-dsh-style=\"risograph\"], :has([data-dsh-style=\"risograph\"])) :where(button:not([role=\"tab\"]), .dsh-btn) {\n  border: 2px solid #18181b;\n  box-shadow: 3px 3px 0px #18181b;\n}\n\n[data-dsh-style=\"risograph\"] :where([data-dsh-card], .dsh-card, [data-dsh-panel], .dsh-panel) {\n  border: 2px solid #18181b;\n  box-shadow: 4px 4px 0px #2563eb;\n}\n\n:where([role=\"dialog\"], [role=\"alertdialog\"], [role=\"menu\"], dialog):where([data-dsh-style=\"risograph\"], :has([data-dsh-style=\"risograph\"])) {\n  border: 2px solid #18181b !important;\n  box-shadow: 4px 4px 0px #ff3e7f !important;\n}\n\n[data-dsh-style=\"risograph\"] [role=\"tab\"][aria-selected=\"true\"] {\n  background: #fde047;\n  color: #18181b;\n  font-weight: 700;\n}\n\n[data-dsh-style=\"risograph\"] [role=\"tab\"][aria-selected=\"true\"]::after,\n[data-dsh-style=\"risograph\"] .dsh-tab-indicator {\n  border-block-end-color: #ff3e7f;\n  border-block-end-width: 3px;\n}\n\n/* --------------------------------------------------------------------------\n * 11. Preset 10: `win98` — 千禧复古 / Retro 98 (NEW!)\n *     - Classic bright Platinum/Win98 silver-gray (`#dcdcdc` / `#e4e4e4`, `#ffffff` wells)\n *     - Authentic 3D beveled raised borders flipping to sunken bevels on `:active` / `[aria-selected=\"true\"]`\n *     - `0px` sharp corners + royal-blue (`#1b4f9c` -> `#3b82c4`) header accent\n * -------------------------------------------------------------------------- */\n[data-dsh-style=\"win98\"],\n:where([role=\"dialog\"], [role=\"alertdialog\"], [role=\"menu\"], dialog):where([data-dsh-style=\"win98\"], :has([data-dsh-style=\"win98\"])) {\n  color-scheme: light;\n  accent-color: #1b4f9c;\n  --dsw-alias-bg-base: #dcdcdc;\n  --dsw-alias-bg-layer-1: #e4e4e4;\n  --dsw-alias-bg-layer-2: #d0d0d0;\n  --dsw-alias-bg-layer-3: #c0c0c0;\n  --dsw-alias-bg-overlay: #e4e4e4;\n  --dsw-alias-bg-module-platform: #d4d4d4;\n  --dsw-alias-settings-card-fill: #ffffff;\n  --dsw-alias-settings-card-stroke: #808080;\n  --dsw-specific-menu: #dcdcdc;\n  --dsw-alias-border-l1: #b8b8b8;\n  --dsw-alias-border-l2: #808080;\n  --dsw-alias-border-l3: #5a5a5a;\n  --dsw-alias-border-l4: #222222;\n  --dsw-alias-label-primary: #111111;\n  --dsw-alias-label-secondary: #333333;\n  --dsw-alias-label-tertiary: #555555;\n  --dsw-alias-label-dimmed: #767676;\n  --dsw-alias-brand-primary: #1b4f9c;\n  --dsw-alias-brand-text: #111111;\n  --dsw-alias-state-business-primary: #1b4f9c;\n  --dsw-alias-state-business-tertiary: rgba(27, 79, 156, 0.14);\n  --dsw-alias-link: #0b3c88;\n  --dsw-alias-button-primary-fill: #1b4f9c;\n  --dsw-alias-button-primary-hover: #245cb0;\n  --dsw-alias-button-primary-ink: #ffffff;\n  --dsw-alias-interactive-bg-hover: rgba(27, 79, 156, 0.09);\n  --dsw-alias-interactive-bg-active: rgba(27, 79, 156, 0.16);\n  --dsw-alias-interactive-bg-hover-accent: rgba(59, 130, 196, 0.15);\n  --dsw-alias-interactive-bg-hover-danger: rgba(185, 28, 28, 0.13);\n  --dsw-alias-state-error-primary: #b91c1c;\n  --dsw-alias-state-warn-primary: #9a5b08;\n  --dsw-alias-state-warn-label: #6e3f04;\n  --dsw-alias-state-warn-tertiary: #fef3c7;\n  --dsw-alias-state-success-primary: #166534;\n  --dsw-radius-xs: 0px;\n  --dsw-radius-sm: 0px;\n  --dsw-radius-md: 0px;\n  --dsw-radius-lg: 0px;\n  --dsw-radius-xl: 0px;\n  --dsw-corner-shape: square;\n  --dsw-elevation-panel: inset 1.5px 1.5px 0 #ffffff, inset -1.5px -1.5px 0 #5a5a5a, inset 2.5px 2.5px 0 #f4f4f4, inset -2.5px -2.5px 0 #9a9a9a;\n  --dsw-elevation-prominent: inset 1.5px 1.5px 0 #ffffff, inset -1.5px -1.5px 0 #5a5a5a, inset 2.5px 2.5px 0 #f4f4f4, inset -2.5px -2.5px 0 #9a9a9a, 4px 4px 12px rgba(0, 0, 0, 0.18);\n  --dsh-control-border-width: 1px;\n  --dsh-button-shadow: inset 1.5px 1.5px 0 #ffffff, inset -1.5px -1.5px 0 #5a5a5a, inset 2.5px 2.5px 0 #f4f4f4, inset -2.5px -2.5px 0 #9a9a9a;\n  --dsh-button-hover-shadow: inset 1.5px 1.5px 0 #ffffff, inset -1.5px -1.5px 0 #5a5a5a, inset 2.5px 2.5px 0 #f4f4f4, inset -2.5px -2.5px 0 #9a9a9a;\n  --dsh-card-shadow: inset 1.5px 1.5px 0 #808080, inset -1.5px -1.5px 0 #ffffff, inset 2.5px 2.5px 0 #5a5a5a, inset -2.5px -2.5px 0 #dcdcdc;\n  --dsh-card-hover-shadow: inset 1.5px 1.5px 0 #808080, inset -1.5px -1.5px 0 #ffffff, inset 2.5px 2.5px 0 #5a5a5a, inset -2.5px -2.5px 0 #dcdcdc;\n  --dsh-surface-spotlight: rgba(27, 79, 156, 0.10);\n  --dsh-font-display: Tahoma, \"SimSun\", \"NSimSun\", \"宋体\", \"新宋体\", sans-serif;\n  --dsh-font-body: Tahoma, \"SimSun\", \"NSimSun\", \"宋体\", \"新宋体\", sans-serif;\n  --dsh-font-mono: \"Fixedsys\", Consolas, \"Courier New\", \"SimSun\", \"宋体\", monospace;\n  --dsh-display-weight: 700;\n  --dsh-display-tracking: normal;\n  --dsh-body-tracking: normal;\n  --dsw-font-family: var(--dsh-font-body);\n  --dsw-font-markdown-base: var(--dsh-font-body);\n}\n\n[data-dsh-style=\"win98\"] :where(button, input, select, textarea, [role=\"button\"], [role=\"tab\"], [role=\"menuitem\"], [role=\"menuitemradio\"], [data-dsh-card], .dsh-card, [data-dsh-panel], .dsh-panel),\n:where([role=\"dialog\"], [role=\"alertdialog\"], [role=\"menu\"], dialog):where([data-dsh-style=\"win98\"], :has([data-dsh-style=\"win98\"])),\n:where([role=\"dialog\"], [role=\"alertdialog\"], [role=\"menu\"], dialog):where([data-dsh-style=\"win98\"], :has([data-dsh-style=\"win98\"])) :where(button, input, select, textarea, [role=\"menuitem\"], [role=\"menuitemradio\"]) {\n  border-radius: 0px !important;\n  corner-shape: square;\n}\n\n/* Raised 3D bevel buttons */\n[data-dsh-style=\"win98\"] :where(button:not([role=\"tab\"]), .dsh-btn),\n:where([role=\"dialog\"], [role=\"alertdialog\"], dialog):where([data-dsh-style=\"win98\"], :has([data-dsh-style=\"win98\"])) :where(button:not([role=\"tab\"]), .dsh-btn) {\n  border: 0;\n  background-color: #dcdcdc;\n  box-shadow: inset 1.5px 1.5px 0 #ffffff, inset -1.5px -1.5px 0 #5a5a5a, inset 2.5px 2.5px 0 #f4f4f4, inset -2.5px -2.5px 0 #9a9a9a;\n}\n\n/* Keep primary buttons royal blue with 3D bevel */\n[data-dsh-style=\"win98\"] :where(.dsh-wb-btn-primary, .dsh-btn-primary) {\n  background-color: #1b4f9c;\n  color: #ffffff;\n  box-shadow: inset 1.5px 1.5px 0 #6ca0e8, inset -1.5px -1.5px 0 #0d2b57, inset 2.5px 2.5px 0 #4a82d1, inset -2.5px -2.5px 0 #143c78;\n}\n\n/* Sunken 3D bevel on active / pressed / selected controls */\n[data-dsh-style=\"win98\"] :where(button, [role=\"button\"]):is(:active, [aria-pressed=\"true\"], [aria-expanded=\"true\"]):not(:disabled):not([aria-disabled=\"true\"]),\n[data-dsh-style=\"win98\"] [role=\"tab\"][aria-selected=\"true\"],\n:where([role=\"dialog\"], [role=\"alertdialog\"], dialog):where([data-dsh-style=\"win98\"], :has([data-dsh-style=\"win98\"])) :where(button, [role=\"button\"]):is(:active, [aria-pressed=\"true\"]):not(:disabled):not([aria-disabled=\"true\"]) {\n  translate: 0px 0px !important;\n  scale: 1 !important;\n  background-color: #e4e4e4;\n  box-shadow: inset 1.5px 1.5px 0 #5a5a5a, inset -1.5px -1.5px 0 #ffffff, inset 2.5px 2.5px 0 #9a9a9a, inset -2.5px -2.5px 0 #f4f4f4 !important;\n}\n\n/* Sunken white list/card/input wells */\n[data-dsh-style=\"win98\"] :where([data-dsh-card], .dsh-card, input:not([type=\"checkbox\"]):not([type=\"radio\"]):not([type=\"range\"]), select, textarea) {\n  border: 0;\n  background: #ffffff;\n  box-shadow: inset 1.5px 1.5px 0 #808080, inset -1.5px -1.5px 0 #ffffff, inset 2.5px 2.5px 0 #5a5a5a, inset -2.5px -2.5px 0 #dcdcdc;\n}\n\n/* Bright Win98 Platinum raised toolbar header with iconic royal-blue titlebar stripe */\n[data-dsh-style=\"win98\"] :where(.dsh-header, [data-dsh-header], .pageHeader, .dsh-wb-header, .topbar) {\n  background: linear-gradient(180deg, #ececec 0%, #dcdcdc 100%) !important;\n  color: #111111;\n  border-block-start: 3px solid #1b4f9c !important;\n  border-block-end: 2px solid #808080;\n  box-shadow: inset 0 1px 0 #ffffff, inset 0 -1px 0 #808080;\n}\n\n[data-dsh-style=\"win98\"] .dsh-header-badge {\n  background: linear-gradient(90deg, #1b4f9c 0%, #3b82c4 100%);\n  color: #ffffff;\n}\n\n:where([role=\"dialog\"], [role=\"alertdialog\"], dialog):where([data-dsh-style=\"win98\"], :has([data-dsh-style=\"win98\"])) header {\n  background: linear-gradient(90deg, #1b4f9c 0%, #3b82c4 100%);\n  color: #ffffff;\n}\n\n:where([role=\"dialog\"], [role=\"alertdialog\"], dialog):where([data-dsh-style=\"win98\"], :has([data-dsh-style=\"win98\"])) header h2 {\n  color: #ffffff;\n}\n\n/* --------------------------------------------------------------------------\n * 12. Preset 11: `songhui` — 宋韵朱砂 / Song Xuan (NEW!)\n *     - Warm gold-flecked Xuan paper (`#f7f3e8`, subtle `18px` gold-dust radial dots)\n *     - Double cinnabar masthead border (`3px double #b83b2a`)\n *     - Cinnabar seal-stamp primary buttons (`#b83b2a` with `#fbf9f2` ink, `2px` crisp corners)\n *     - Classical Songti / serif typography\n * -------------------------------------------------------------------------- */\n[data-dsh-style=\"songhui\"],\n:where([role=\"dialog\"], [role=\"alertdialog\"], [role=\"menu\"], dialog):where([data-dsh-style=\"songhui\"], :has([data-dsh-style=\"songhui\"])) {\n  color-scheme: light;\n  accent-color: #b83b2a;\n  --dsw-alias-bg-base: #f7f3e8;\n  --dsw-alias-bg-layer-1: #f0ead9;\n  --dsw-alias-bg-layer-2: #e7dec8;\n  --dsw-alias-bg-layer-3: #dcd0b4;\n  --dsw-alias-bg-overlay: #fbf9f2;\n  --dsw-alias-bg-module-platform: #ede6d4;\n  --dsw-alias-settings-card-fill: #fbf9f2;\n  --dsw-alias-settings-card-stroke: #d4c4a2;\n  --dsw-specific-menu: #fbf9f2;\n  --dsw-alias-border-l1: #e4dac2;\n  --dsw-alias-border-l2: #cfbda0;\n  --dsw-alias-border-l3: #b8a382;\n  --dsw-alias-border-l4: #9d8765;\n  --dsw-alias-label-primary: #252019;\n  --dsw-alias-label-secondary: #5c5142;\n  --dsw-alias-label-tertiary: #7d705e;\n  --dsw-alias-label-dimmed: #998c79;\n  --dsw-alias-brand-primary: #b83b2a;\n  --dsw-alias-brand-text: #252019;\n  --dsw-alias-state-business-primary: #b83b2a;\n  --dsw-alias-state-business-tertiary: rgba(184, 59, 42, 0.12);\n  --dsw-alias-link: #9e2f20;\n  --dsw-alias-button-primary-fill: #b83b2a;\n  --dsw-alias-button-primary-hover: #9f3021;\n  --dsw-alias-button-primary-ink: #fbf9f2;\n  --dsw-alias-interactive-bg-hover: rgba(184, 59, 42, 0.065);\n  --dsw-alias-interactive-bg-active: rgba(184, 59, 42, 0.13);\n  --dsw-alias-interactive-bg-hover-accent: rgba(184, 59, 42, 0.11);\n  --dsw-alias-interactive-bg-hover-danger: rgba(184, 59, 42, 0.15);\n  --dsw-alias-state-error-primary: #a62b1c;\n  --dsw-alias-state-warn-primary: #9c6216;\n  --dsw-alias-state-warn-label: #704309;\n  --dsw-alias-state-warn-tertiary: #f7ecd1;\n  --dsw-alias-state-success-primary: #2e664b;\n  --dsw-radius-xs: 2px;\n  --dsw-radius-sm: 2px;\n  --dsw-radius-md: 3px;\n  --dsw-radius-lg: 4px;\n  --dsw-radius-xl: 4px;\n  --dsw-elevation-panel: 0 2px 10px rgba(66, 52, 32, 0.06), 0 0 0 1px #cfbda0;\n  --dsw-elevation-prominent: 0 12px 30px rgba(66, 52, 32, 0.14), 0 0 0 1px #b8a382;\n  --dsh-control-border-width: 1px;\n  --dsh-button-hover-shadow: 0 2px 6px rgba(184, 59, 42, 0.12);\n  --dsh-card-shadow: 0 1px 2px rgba(66, 52, 32, 0.05);\n  --dsh-card-hover-shadow: 0 6px 16px rgba(66, 52, 32, 0.09);\n  --dsh-surface-spotlight: rgba(184, 59, 42, 0.07);\n  --dsh-font-display: \"STZhongsong\", \"华文中宋\", \"Noto Serif SC Black\", \"SimSun\", \"宋体\", serif;\n  --dsh-font-body: \"Palatino Linotype\", \"STKaiti\", \"华文楷体\", \"KaiTi\", \"楷体\", \"Noto Serif SC\", serif;\n  --dsh-font-mono: \"Cascadia Mono\", Consolas, \"STFangsong\", \"华文仿宋\", monospace;\n  --dsh-display-weight: 700;\n  --dsh-display-tracking: 0.04em;\n  --dsh-body-tracking: normal;\n  --dsw-font-family: var(--dsh-font-body);\n  --dsw-font-markdown-base: var(--dsh-font-body);\n}\n\n/* Gold-flecked Xuan paper */\n[data-dsh-style=\"songhui\"] {\n  background-color: #f7f3e8;\n  background-image:\n    radial-gradient(rgba(196, 152, 64, 0.18) 1px, transparent 0),\n    radial-gradient(rgba(196, 152, 64, 0.11) 0.75px, transparent 0);\n  background-size: 18px 18px, 29px 29px;\n  background-position: 0 0, 9px 7px;\n}\n\n/* Double cinnabar masthead border */\n[data-dsh-style=\"songhui\"] :where(.pageHeader, .dsh-header, [data-dsh-header], .dsh-wb-header) {\n  background: rgba(251, 249, 242, 0.90);\n  border-block-end: 3px double #b83b2a;\n}\n\n/* Cinnabar seal-stamp primary buttons & badge */\n[data-dsh-style=\"songhui\"] :where(.dsh-wb-btn-primary, .dsh-btn-primary, .dsh-header-badge) {\n  background: #b83b2a;\n  color: #fbf9f2;\n  border-color: #9e2f20;\n  border-radius: 2px;\n  box-shadow: inset 0 0 0 1px rgba(251, 249, 242, 0.28);\n}\n\n/* --------------------------------------------------------------------------\n * 13. Preset 12: `frutiger` — 晴空水晶 / Aqua Gloss (NEW!)\n *     - Bright Frutiger Aero sky-aqua gradient (`#eaf7ff` -> `#f4fbff`)\n *     - Glossy upper-half specular aqua pill buttons (`linear-gradient` + `inset 0 1.5px 0`)\n *     - Pill `999px` control radius + luminous translucent cards\n * -------------------------------------------------------------------------- */\n[data-dsh-style=\"frutiger\"],\n:where([role=\"dialog\"], [role=\"alertdialog\"], [role=\"menu\"], dialog):where([data-dsh-style=\"frutiger\"], :has([data-dsh-style=\"frutiger\"])) {\n  color-scheme: light;\n  accent-color: #0284c7;\n  --dsw-alias-bg-base: #eaf7ff;\n  --dsw-alias-bg-layer-1: rgba(255, 255, 255, 0.78);\n  --dsw-alias-bg-layer-2: rgba(232, 246, 255, 0.86);\n  --dsw-alias-bg-layer-3: rgba(209, 236, 255, 0.90);\n  --dsw-alias-bg-overlay: rgba(248, 253, 255, 0.93);\n  --dsw-alias-bg-module-platform: rgba(232, 246, 255, 0.84);\n  --dsw-alias-settings-card-fill: rgba(255, 255, 255, 0.82);\n  --dsw-alias-settings-card-stroke: rgba(56, 189, 248, 0.44);\n  --dsw-specific-menu: rgba(248, 253, 255, 0.95);\n  --dsw-alias-border-l1: rgba(56, 189, 248, 0.26);\n  --dsw-alias-border-l2: rgba(14, 165, 233, 0.36);\n  --dsw-alias-border-l3: rgba(2, 132, 199, 0.48);\n  --dsw-alias-border-l4: rgba(3, 105, 161, 0.58);\n  --dsw-alias-label-primary: #0c2b45;\n  --dsw-alias-label-secondary: #275373;\n  --dsw-alias-label-tertiary: #487596;\n  --dsw-alias-label-dimmed: #6c96b5;\n  --dsw-alias-brand-primary: #0284c7;\n  --dsw-alias-brand-text: #0c2b45;\n  --dsw-alias-state-business-primary: #0284c7;\n  --dsw-alias-state-business-tertiary: rgba(14, 165, 233, 0.16);\n  --dsw-alias-link: #0369a1;\n  --dsw-alias-button-primary-fill: #0284c7;\n  --dsw-alias-button-primary-hover: #0369a1;\n  --dsw-alias-button-primary-ink: #ffffff;\n  --dsw-alias-interactive-bg-hover: rgba(14, 165, 233, 0.10);\n  --dsw-alias-interactive-bg-active: rgba(14, 165, 233, 0.18);\n  --dsw-alias-interactive-bg-hover-accent: rgba(56, 189, 248, 0.16);\n  --dsw-alias-interactive-bg-hover-danger: rgba(220, 56, 82, 0.13);\n  --dsw-alias-state-error-primary: #c83244;\n  --dsw-alias-state-warn-primary: #c06a12;\n  --dsw-alias-state-warn-label: #8a4a09;\n  --dsw-alias-state-warn-tertiary: #fef0d6;\n  --dsw-alias-state-success-primary: #0f766e;\n  --dsw-radius-xs: 10px;\n  --dsw-radius-sm: 999px;\n  --dsw-radius-md: 18px;\n  --dsw-radius-lg: 22px;\n  --dsw-radius-xl: 26px;\n  --dsw-elevation-panel: inset 0 1.5px 0 rgba(255, 255, 255, 0.92), 0 6px 20px rgba(14, 165, 233, 0.12), 0 0 0 1px rgba(56, 189, 248, 0.36);\n  --dsw-elevation-prominent: inset 0 1.5px 0 rgba(255, 255, 255, 0.95), 0 16px 38px rgba(14, 165, 233, 0.18), 0 0 0 1px rgba(56, 189, 248, 0.44);\n  --dsh-control-border-width: 1px;\n  --dsh-button-shadow: inset 0 1.5px 0 rgba(255, 255, 255, 0.92), 0 2px 6px rgba(14, 165, 233, 0.12);\n  --dsh-button-hover-shadow: inset 0 1.5px 0 rgba(255, 255, 255, 0.96), 0 4px 12px rgba(2, 132, 199, 0.22);\n  --dsh-card-shadow: inset 0 1.5px 0 rgba(255, 255, 255, 0.92), 0 6px 20px rgba(14, 165, 233, 0.10);\n  --dsh-card-hover-shadow: inset 0 1.5px 0 rgba(255, 255, 255, 0.98), 0 10px 26px rgba(2, 132, 199, 0.16);\n  --dsh-surface-spotlight: rgba(14, 165, 233, 0.10);\n  --dsh-font-display: \"Cascadia Code SemiBold\", \"Cascadia Code\", \"YouYuan\", \"幼圆\", \"Noto Sans SC\", monospace;\n  --dsh-font-body: \"Cascadia Code\", \"Cascadia Mono\", \"YouYuan\", \"幼圆\", \"Noto Sans SC\", monospace;\n  --dsh-font-mono: \"Cascadia Mono\", \"Cascadia Code\", \"YouYuan\", \"幼圆\", Consolas, monospace;\n  --dsh-display-weight: 700;\n  --dsh-display-tracking: 0.015em;\n  --dsh-body-tracking: normal;\n  --dsw-font-family: var(--dsh-font-body);\n  --dsw-font-markdown-base: var(--dsh-font-body);\n}\n\n[data-dsh-style=\"frutiger\"] {\n  background-color: #eaf7ff;\n  background-image:\n    radial-gradient(60% 48% at 15% 6%, rgba(125, 211, 252, 0.34) 0%, transparent 65%),\n    linear-gradient(180deg, #eaf7ff 0%, #f4fbff 55%, #e5f5fe 100%);\n}\n\n[data-dsh-style=\"frutiger\"] :where(button:not([role=\"tab\"]), .dsh-btn),\n:where([role=\"dialog\"], [role=\"alertdialog\"], dialog):where([data-dsh-style=\"frutiger\"], :has([data-dsh-style=\"frutiger\"])) :where(button:not([role=\"tab\"]), .dsh-btn) {\n  border-radius: 999px;\n  border: 1px solid rgba(14, 165, 233, 0.42);\n  background: linear-gradient(180deg, rgba(255, 255, 255, 0.95) 0%, rgba(224, 244, 255, 0.88) 49%, rgba(204, 236, 255, 0.92) 51%, rgba(235, 249, 255, 0.96) 100%);\n  box-shadow: inset 0 1.5px 0 rgba(255, 255, 255, 0.92), 0 2px 6px rgba(14, 165, 233, 0.12);\n}\n\n[data-dsh-style=\"frutiger\"] :where(.dsh-wb-btn-primary, .dsh-btn-primary, .dsh-header-badge) {\n  border-radius: 999px;\n  border: 1px solid #0284c7;\n  color: #ffffff;\n  background: linear-gradient(180deg, #7dd3fc 0%, #0ea5e9 48%, #0284c7 52%, #38bdf8 100%);\n  box-shadow: inset 0 1.5px 0 rgba(255, 255, 255, 0.88), 0 3px 10px rgba(2, 132, 199, 0.24);\n}\n\n[data-dsh-style=\"frutiger\"] :where([data-dsh-card], .dsh-card, [data-dsh-panel], .dsh-panel, .dsh-header, [data-dsh-header]) {\n  background: linear-gradient(180deg, rgba(255, 255, 255, 0.88) 0%, rgba(240, 250, 255, 0.78) 100%);\n  -webkit-backdrop-filter: blur(10px) saturate(130%);\n  backdrop-filter: blur(10px) saturate(130%);\n  box-shadow: var(--dsh-card-shadow);\n}\n\n/* --------------------------------------------------------------------------\n * 14. Preset 13: `gazette` — 铅字晨报 / Gazette\n *     - Warm newsprint base (`#f6f3ec`), `#ede8dd` layer, `#faf8f3` card, `#161514` ink\n *     - `4px double #161514` masthead border on `.pageHeader` / `.dsh-header`\n *     - Crisp `1px solid #161514` column rules, `0px–2px` editorial corners\n *     - `#9b1c1c` crimson seal/editorial accent & high-contrast ink buttons\n * -------------------------------------------------------------------------- */\n[data-dsh-style=\"gazette\"],\n:where([role=\"dialog\"], [role=\"alertdialog\"], [role=\"menu\"], dialog):where([data-dsh-style=\"gazette\"], :has([data-dsh-style=\"gazette\"])) {\n  color-scheme: light;\n  accent-color: #9b1c1c;\n  --dsw-alias-bg-base: #f6f3ec;\n  --dsw-alias-bg-layer-1: #ede8dd;\n  --dsw-alias-bg-layer-2: #e3dccd;\n  --dsw-alias-bg-layer-3: #d6cebc;\n  --dsw-alias-bg-overlay: #faf8f3;\n  --dsw-alias-bg-module-platform: #ebe5d8;\n  --dsw-alias-settings-card-fill: #faf8f3;\n  --dsw-alias-settings-card-stroke: #161514;\n  --dsw-specific-menu: #faf8f3;\n  --dsw-alias-border-l1: #cec6b6;\n  --dsw-alias-border-l2: #161514;\n  --dsw-alias-border-l3: #161514;\n  --dsw-alias-border-l4: #161514;\n  --dsw-alias-label-primary: #161514;\n  --dsw-alias-label-secondary: #43403c;\n  --dsw-alias-label-tertiary: #635f59;\n  --dsw-alias-label-dimmed: #827d75;\n  --dsw-alias-brand-primary: #9b1c1c;\n  --dsw-alias-brand-text: #161514;\n  --dsw-alias-state-business-primary: #9b1c1c;\n  --dsw-alias-state-business-tertiary: rgba(155, 28, 28, 0.12);\n  --dsw-alias-link: #9b1c1c;\n  --dsw-alias-button-primary-fill: #161514;\n  --dsw-alias-button-primary-hover: #2d2b28;\n  --dsw-alias-button-primary-ink: #faf8f3;\n  --dsw-alias-interactive-bg-hover: rgba(22, 21, 20, 0.06);\n  --dsw-alias-interactive-bg-active: rgba(155, 28, 28, 0.11);\n  --dsw-alias-interactive-bg-hover-accent: rgba(155, 28, 28, 0.10);\n  --dsw-alias-interactive-bg-hover-danger: rgba(155, 28, 28, 0.14);\n  --dsw-alias-state-error-primary: #9b1c1c;\n  --dsw-alias-state-warn-primary: #9a5b08;\n  --dsw-alias-state-warn-label: #6e3f04;\n  --dsw-alias-state-warn-tertiary: #f6ead2;\n  --dsw-alias-state-success-primary: #1f5c3a;\n  --dsw-radius-xs: 0px;\n  --dsw-radius-sm: 1px;\n  --dsw-radius-md: 2px;\n  --dsw-radius-lg: 2px;\n  --dsw-radius-xl: 2px;\n  --dsw-elevation-panel: 0 1px 0 #161514, 0 0 0 1px #161514;\n  --dsw-elevation-prominent: 3px 3px 0 #161514, 0 0 0 1px #161514;\n  --dsh-control-border-width: 1px;\n  --dsh-button-shadow: none;\n  --dsh-button-hover-shadow: 0 2px 0 #161514;\n  --dsh-card-shadow: none;\n  --dsh-card-hover-shadow: 2px 2px 0 #161514;\n  --dsh-surface-spotlight: rgba(155, 28, 28, 0.06);\n  --dsh-font-display: Garamond, Georgia, \"STZhongsong\", \"华文中宋\", \"Noto Serif SC Black\", serif;\n  --dsh-font-body: Georgia, \"Noto Serif SC\", \"STSong\", \"华文宋体\", serif;\n  --dsh-font-mono: \"Cascadia Mono\", Consolas, \"Courier New\", monospace;\n  --dsh-display-weight: 700;\n  --dsh-display-tracking: -0.01em;\n  --dsh-body-tracking: normal;\n  --dsw-font-family: var(--dsh-font-body);\n  --dsw-font-markdown-base: var(--dsh-font-body);\n}\n\n[data-dsh-style=\"gazette\"] {\n  background-color: #f6f3ec;\n}\n\n/* Broadsheet 4px double masthead border */\n[data-dsh-style=\"gazette\"] :where(.pageHeader, .dsh-header, [data-dsh-header], .dsh-wb-header) {\n  background: #faf8f3;\n  border-block-end: 4px double #161514;\n}\n\n/* Crisp 1px solid #161514 column rules & editorial cards */\n[data-dsh-style=\"gazette\"] :where([data-dsh-card], .dsh-card, [data-dsh-panel], .dsh-panel) {\n  background: #faf8f3;\n  border: 1px solid #161514;\n  border-radius: 2px;\n  box-shadow: none;\n}\n\n[data-dsh-style=\"gazette\"] :where([data-dsh-row], .dsh-row) {\n  border-block-end: 1px solid #161514;\n}\n\n[data-dsh-style=\"gazette\"] .dsh-split-leading {\n  border-inline-end: 1px solid #161514;\n}\n\n[data-dsh-style=\"gazette\"] .dsh-split-resizer::before {\n  background: #161514;\n}\n\n/* 0px–2px editorial corners, crimson seal accent & high-contrast ink buttons */\n[data-dsh-style=\"gazette\"] :where(button:not([role=\"tab\"]), .dsh-btn),\n:where([role=\"dialog\"], [role=\"alertdialog\"], dialog):where([data-dsh-style=\"gazette\"], :has([data-dsh-style=\"gazette\"])) :where(button:not([role=\"tab\"]), .dsh-btn) {\n  border: 1px solid #161514;\n  border-radius: 1px;\n}\n\n[data-dsh-style=\"gazette\"] :where(.dsh-wb-btn-primary, .dsh-btn-primary) {\n  background: #161514;\n  color: #faf8f3;\n  border-color: #161514;\n}\n\n[data-dsh-style=\"gazette\"] :where(.dsh-wb-btn-primary, .dsh-btn-primary):hover:not(:disabled) {\n  background: #9b1c1c;\n  border-color: #9b1c1c;\n}\n\n[data-dsh-style=\"gazette\"] .dsh-header-badge {\n  background: #9b1c1c;\n  color: #faf8f3;\n  border-radius: 1px;\n}\n\n[data-dsh-style=\"gazette\"] [role=\"tab\"][aria-selected=\"true\"]::after,\n[data-dsh-style=\"gazette\"] .dsh-tab-indicator {\n  border-block-end-color: #9b1c1c;\n  border-block-end-width: 2.5px;\n}\n\n:where([role=\"dialog\"], [role=\"alertdialog\"], [role=\"menu\"], dialog):where([data-dsh-style=\"gazette\"], :has([data-dsh-style=\"gazette\"])) {\n  border: 1px solid #161514 !important;\n  border-radius: 2px !important;\n}\n\n/* --------------------------------------------------------------------------\n * 14b. Independent `[data-dsh-font]` Overrides & Dual-Layer Typography Rules\n *      When `data-dsh-font=\"auto\"` (or unset), each `[data-dsh-style]` uses its\n *      own Windows-verified Chinese + Latin signature font stack.\n * -------------------------------------------------------------------------- */\n:root[data-dsh-font=\"songkai\"] [data-dsh-style],\n:root[data-dsh-font=\"songkai\"] [data-dsh-portal-synced],\n:root[data-dsh-font=\"songkai\"] :where([role=\"dialog\"], [role=\"alertdialog\"], [role=\"menu\"], dialog):has([data-dsh-style]),\n[data-dsh-style][data-dsh-font=\"songkai\"],\n[data-dsh-portal-synced][data-dsh-font=\"songkai\"] {\n  --dsh-font-display: \"STZhongsong\", \"华文中宋\", \"Noto Serif SC Black\", \"SimSun\", \"宋体\", serif;\n  --dsh-font-body: \"Palatino Linotype\", \"STKaiti\", \"华文楷体\", \"KaiTi\", \"楷体\", \"Noto Serif SC\", serif;\n  --dsh-font-mono: \"Cascadia Mono\", Consolas, \"STFangsong\", \"华文仿宋\", monospace;\n  --dsh-display-weight: 700;\n  --dsh-display-tracking: 0.04em;\n  --dsh-body-tracking: normal;\n  --dsw-font-family: var(--dsh-font-body);\n  --dsw-font-markdown-base: var(--dsh-font-body);\n}\n\n:root[data-dsh-font=\"fangsong\"] [data-dsh-style],\n:root[data-dsh-font=\"fangsong\"] [data-dsh-portal-synced],\n:root[data-dsh-font=\"fangsong\"] :where([role=\"dialog\"], [role=\"alertdialog\"], [role=\"menu\"], dialog):has([data-dsh-style]),\n[data-dsh-style][data-dsh-font=\"fangsong\"],\n[data-dsh-portal-synced][data-dsh-font=\"fangsong\"] {\n  --dsh-font-display: \"Cascadia Mono SemiBold\", \"Cascadia Mono\", \"STZhongsong\", \"华文中宋\", \"FangSong\", \"仿宋\", monospace;\n  --dsh-font-body: \"Cascadia Mono\", \"STFangsong\", \"华文仿宋\", \"FangSong\", \"仿宋\", monospace;\n  --dsh-font-mono: \"Cascadia Mono\", \"STFangsong\", \"华文仿宋\", \"FangSong\", \"仿宋\", monospace;\n  --dsh-display-weight: 700;\n  --dsh-display-tracking: 0.02em;\n  --dsh-body-tracking: 0.02em;\n  --dsw-font-family: var(--dsh-font-body);\n  --dsw-font-markdown-base: var(--dsh-font-body);\n}\n\n:root[data-dsh-font=\"poster\"] [data-dsh-style],\n:root[data-dsh-font=\"poster\"] [data-dsh-portal-synced],\n:root[data-dsh-font=\"poster\"] :where([role=\"dialog\"], [role=\"alertdialog\"], [role=\"menu\"], dialog):has([data-dsh-style]),\n[data-dsh-style][data-dsh-font=\"poster\"],\n[data-dsh-portal-synced][data-dsh-font=\"poster\"] {\n  --dsh-font-display: Impact, \"Arial Black\", \"Noto Sans SC Black\", \"SimHei\", \"黑体\", sans-serif;\n  --dsh-font-body: \"Source Sans 3\", \"Noto Sans SC Medium\", \"Noto Sans SC\", sans-serif;\n  --dsh-font-mono: \"Cascadia Code\", \"Cascadia Mono\", Consolas, monospace;\n  --dsh-display-weight: 900;\n  --dsh-display-tracking: -0.02em;\n  --dsh-body-tracking: normal;\n  --dsw-font-family: var(--dsh-font-body);\n  --dsw-font-markdown-base: var(--dsh-font-body);\n}\n\n:root[data-dsh-font=\"retro98\"] [data-dsh-style],\n:root[data-dsh-font=\"retro98\"] [data-dsh-portal-synced],\n:root[data-dsh-font=\"retro98\"] :where([role=\"dialog\"], [role=\"alertdialog\"], [role=\"menu\"], dialog):has([data-dsh-style]),\n[data-dsh-style][data-dsh-font=\"retro98\"],\n[data-dsh-portal-synced][data-dsh-font=\"retro98\"] {\n  --dsh-font-display: Tahoma, \"SimSun\", \"NSimSun\", \"宋体\", \"新宋体\", sans-serif;\n  --dsh-font-body: Tahoma, \"SimSun\", \"NSimSun\", \"宋体\", \"新宋体\", sans-serif;\n  --dsh-font-mono: \"Fixedsys\", Consolas, \"Courier New\", \"SimSun\", \"宋体\", monospace;\n  --dsh-display-weight: 700;\n  --dsh-display-tracking: normal;\n  --dsh-body-tracking: normal;\n  --dsw-font-family: var(--dsh-font-body);\n  --dsw-font-markdown-base: var(--dsh-font-body);\n}\n\n:root[data-dsh-font=\"serif\"] [data-dsh-style],\n:root[data-dsh-font=\"serif\"] [data-dsh-portal-synced],\n:root[data-dsh-font=\"serif\"] :where([role=\"dialog\"], [role=\"alertdialog\"], [role=\"menu\"], dialog):has([data-dsh-style]),\n[data-dsh-style][data-dsh-font=\"serif\"],\n[data-dsh-portal-synced][data-dsh-font=\"serif\"] {\n  --dsh-font-display: \"Palatino Linotype\", Georgia, \"Noto Serif SC SemiBold\", \"Noto Serif SC\", \"STZhongsong\", \"华文中宋\", serif;\n  --dsh-font-body: Georgia, \"Noto Serif SC\", \"STSong\", \"华文宋体\", serif;\n  --dsh-font-mono: \"Cascadia Code\", \"Cascadia Mono\", Consolas, monospace;\n  --dsh-display-weight: 700;\n  --dsh-display-tracking: -0.01em;\n  --dsh-body-tracking: normal;\n  --dsw-font-family: var(--dsh-font-body);\n  --dsw-font-markdown-base: var(--dsh-font-body);\n}\n\n:root[data-dsh-font=\"arcade\"] [data-dsh-style],\n:root[data-dsh-font=\"arcade\"] [data-dsh-portal-synced],\n:root[data-dsh-font=\"arcade\"] :where([role=\"dialog\"], [role=\"alertdialog\"], [role=\"menu\"], dialog):has([data-dsh-style]),\n[data-dsh-style][data-dsh-font=\"arcade\"],\n[data-dsh-portal-synced][data-dsh-font=\"arcade\"] {\n  --dsh-font-display: \"Cascadia Code SemiBold\", \"Cascadia Code\", \"YouYuan\", \"幼圆\", \"Noto Sans SC\", monospace;\n  --dsh-font-body: \"Cascadia Code\", \"Cascadia Mono\", \"YouYuan\", \"幼圆\", \"Noto Sans SC\", monospace;\n  --dsh-font-mono: \"Cascadia Mono\", \"Cascadia Code\", \"YouYuan\", \"幼圆\", Consolas, monospace;\n  --dsh-display-weight: 700;\n  --dsh-display-tracking: 0.015em;\n  --dsh-body-tracking: normal;\n  --dsw-font-family: var(--dsh-font-body);\n  --dsw-font-markdown-base: var(--dsh-font-body);\n}\n\n:root[data-dsh-font=\"modern\"] [data-dsh-style],\n:root[data-dsh-font=\"modern\"] [data-dsh-portal-synced],\n:root[data-dsh-font=\"modern\"] :where([role=\"dialog\"], [role=\"alertdialog\"], [role=\"menu\"], dialog):has([data-dsh-style]),\n[data-dsh-style][data-dsh-font=\"modern\"],\n[data-dsh-portal-synced][data-dsh-font=\"modern\"] {\n  --dsh-font-display: \"Source Sans 3\", \"Segoe UI\", \"Noto Sans SC\", \"Microsoft YaHei UI\", sans-serif;\n  --dsh-font-body: \"Source Sans 3\", \"Segoe UI\", \"Noto Sans SC\", \"Microsoft YaHei UI\", sans-serif;\n  --dsh-font-mono: \"Cascadia Code\", \"Cascadia Mono\", Consolas, \"Microsoft YaHei UI\", monospace;\n  --dsh-display-weight: 650;\n  --dsh-display-tracking: normal;\n  --dsh-body-tracking: normal;\n  --dsw-font-family: var(--dsh-font-body);\n  --dsw-font-markdown-base: var(--dsh-font-body);\n}\n\n/* Dual-layer body typography application (workbench + form controls + portaled menus/modals) */\n:where([data-dsh-style], [data-dsh-portal-synced]),\n:where([data-dsh-style], [data-dsh-portal-synced]) :where(button, input, select, textarea),\n:where([role=\"dialog\"], [role=\"alertdialog\"], [role=\"menu\"], dialog):where([data-dsh-style], [data-dsh-portal-synced], :has([data-dsh-style])),\n:where([role=\"dialog\"], [role=\"alertdialog\"], [role=\"menu\"], dialog):where([data-dsh-style], [data-dsh-portal-synced], :has([data-dsh-style])) :where(button, input, select, textarea) {\n  font-family: var(--dsh-font-body);\n  letter-spacing: var(--dsh-body-tracking, normal);\n}\n\n/* Dual-layer display typography application (headings, tabs, header title, editorial titles) */\n:where([data-dsh-style], [data-dsh-portal-synced]) :where(\n  h1,\n  h2,\n  h3,\n  [role=\"tab\"],\n  .dsh-header-title,\n  [data-dsh-serif],\n  [data-dsh-editorial-heading],\n  [data-dsh-card] :is(h2, h3, .dsh-card-title),\n  .dsh-card :is(h2, h3, .dsh-card-title),\n  [data-dsh-reader] :is(h1, h2),\n  .dsh-reader :is(h1, h2)\n),\n:where([role=\"dialog\"], [role=\"alertdialog\"], dialog):where([data-dsh-style], [data-dsh-portal-synced], :has([data-dsh-style])) :where(h1, h2, h3, header h2, [role=\"tab\"], [data-dsh-serif]) {\n  font-family: var(--dsh-font-display);\n  font-weight: var(--dsh-display-weight, 700);\n  letter-spacing: var(--dsh-display-tracking, normal);\n}\n\n/* Monospace code typography */\n:where([data-dsh-style], [data-dsh-portal-synced]) :where(code, pre, kbd, samp),\n:where([role=\"dialog\"], [role=\"alertdialog\"], dialog):where([data-dsh-style], [data-dsh-portal-synced], :has([data-dsh-style])) :where(code, pre, kbd, samp) {\n  font-family: var(--dsh-font-mono);\n}\n\n/* --------------------------------------------------------------------------\n * 11. Interactive Dynamics: Tactile Button Physics & Active States\n * -------------------------------------------------------------------------- */\n:where([data-dsh-style]) :where(button, [role=\"button\"]),\n:where([role=\"dialog\"], [role=\"alertdialog\"], [role=\"menu\"], dialog):has([data-dsh-style]) :where(button, [role=\"button\"]) {\n  /* Identity transforms prevent mid-interaction stacking-context shifts */\n  translate: 0px 0px;\n  scale: 1;\n  transition-property: background-color, border-color, color, box-shadow, opacity, translate, scale;\n  transition-duration: var(--dsh-motion-fast);\n  transition-timing-function: var(--dsh-ease-out);\n}\n\n/* Visible active style on open menu triggers */\n:where([data-dsh-style]) :where(button, [role=\"button\"])[aria-expanded=\"true\"]:not(:disabled):not([aria-disabled=\"true\"]),\n:where([role=\"dialog\"], [role=\"alertdialog\"], dialog):has([data-dsh-style]) :where(button, [role=\"button\"])[aria-expanded=\"true\"]:not(:disabled):not([aria-disabled=\"true\"]) {\n  background-color: var(--dsw-alias-interactive-bg-active);\n  color: var(--dsw-alias-label-primary);\n}\n\n@media (prefers-reduced-motion: no-preference) {\n  @media (hover: hover) {\n    :where([data-dsh-style]:not([data-dsh-style=\"pixel8bit\"]):not([data-dsh-style=\"eink\"]):not([data-dsh-style=\"win98\"]):not([data-dsh-style=\"risograph\"])) :where(button:not([role=\"tab\"]):not([role=\"menuitem\"]):not([role=\"menuitemradio\"]):not([role=\"switch\"]), .dsh-btn):hover:not(:disabled):not([aria-disabled=\"true\"]),\n    :where([role=\"dialog\"], [role=\"alertdialog\"], dialog):has([data-dsh-style]:not([data-dsh-style=\"pixel8bit\"]):not([data-dsh-style=\"eink\"]):not([data-dsh-style=\"win98\"]):not([data-dsh-style=\"risograph\"])) :where(button:not([role=\"tab\"]):not([role=\"menuitem\"]):not([role=\"menuitemradio\"]):not([role=\"switch\"]), .dsh-btn):hover:not(:disabled):not([aria-disabled=\"true\"]) {\n      translate: 0px -0.5px;\n    }\n\n    [data-dsh-style=\"pixel8bit\"] :where(button:not([role=\"tab\"]):not([role=\"menuitem\"]):not([role=\"menuitemradio\"]), .dsh-btn):hover:not(:disabled):not([aria-disabled=\"true\"]),\n    :where([role=\"dialog\"], [role=\"alertdialog\"], dialog):where([data-dsh-style=\"pixel8bit\"], :has([data-dsh-style=\"pixel8bit\"])) :where(button:not([role=\"tab\"]):not([role=\"menuitem\"]):not([role=\"menuitemradio\"]), .dsh-btn):hover:not(:disabled):not([aria-disabled=\"true\"]) {\n      translate: -1px -1px;\n      box-shadow: 3px 3px 0px #1e2826;\n      transition-timing-function: steps(2, end);\n      transition-duration: 70ms;\n    }\n\n    [data-dsh-style=\"risograph\"] :where(button:not([role=\"tab\"]):not([role=\"menuitem\"]):not([role=\"menuitemradio\"]), .dsh-btn):hover:not(:disabled):not([aria-disabled=\"true\"]),\n    :where([role=\"dialog\"], [role=\"alertdialog\"], dialog):where([data-dsh-style=\"risograph\"], :has([data-dsh-style=\"risograph\"])) :where(button:not([role=\"tab\"]):not([role=\"menuitem\"]):not([role=\"menuitemradio\"]), .dsh-btn):hover:not(:disabled):not([aria-disabled=\"true\"]) {\n      translate: -1px -1px;\n      box-shadow: 4px 4px 0px #2563eb;\n    }\n  }\n\n  /* Tactile spring press on standard themes */\n  :where([data-dsh-style]:not([data-dsh-style=\"pixel8bit\"]):not([data-dsh-style=\"eink\"]):not([data-dsh-style=\"win98\"]):not([data-dsh-style=\"risograph\"])) :where(button:not([role=\"switch\"]), [role=\"button\"]):active:not(:disabled):not([aria-disabled=\"true\"]),\n  :where([role=\"dialog\"], [role=\"alertdialog\"], [role=\"menu\"], dialog):has([data-dsh-style]:not([data-dsh-style=\"pixel8bit\"]):not([data-dsh-style=\"eink\"]):not([data-dsh-style=\"win98\"]):not([data-dsh-style=\"risograph\"])) :where(button:not([role=\"switch\"]), [role=\"button\"]):active:not(:disabled):not([aria-disabled=\"true\"]) {\n    scale: 0.965;\n    translate: 0px 0.5px;\n    transition-duration: 80ms;\n  }\n\n  /* Stepped 8-Bit arcade press (`translate(1px, 1px)` + crisp 1px pixel shadow) */\n  [data-dsh-style=\"pixel8bit\"] :where(button:not([role=\"tab\"]):not([role=\"switch\"]), .dsh-btn):active:not(:disabled):not([aria-disabled=\"true\"]),\n  :where([role=\"dialog\"], [role=\"alertdialog\"], [role=\"menu\"], dialog):where([data-dsh-style=\"pixel8bit\"], :has([data-dsh-style=\"pixel8bit\"])) :where(button:not([role=\"tab\"]):not([role=\"switch\"]), .dsh-btn):active:not(:disabled):not([aria-disabled=\"true\"]) {\n    translate: 1px 1px !important;\n    scale: 1 !important;\n    box-shadow: 1px 1px 0px #1e2826 !important;\n    transition-timing-function: steps(2, end);\n    transition-duration: 50ms;\n  }\n\n  /* Risograph shadow-collapse button press (`translate(2px, 2px)`) */\n  [data-dsh-style=\"risograph\"] :where(button:not([role=\"tab\"]):not([role=\"switch\"]), .dsh-btn):active:not(:disabled):not([aria-disabled=\"true\"]),\n  :where([role=\"dialog\"], [role=\"alertdialog\"], [role=\"menu\"], dialog):where([data-dsh-style=\"risograph\"], :has([data-dsh-style=\"risograph\"])) :where(button:not([role=\"tab\"]):not([role=\"switch\"]), .dsh-btn):active:not(:disabled):not([aria-disabled=\"true\"]) {\n    translate: 2px 2px !important;\n    scale: 1 !important;\n    box-shadow: 1px 1px 0px #18181b !important;\n    transition-duration: 60ms;\n  }\n}\n\n/* --------------------------------------------------------------------------\n * 12. Small-Button SVG Icon Micro-Animations\n * -------------------------------------------------------------------------- */\n:where([data-dsh-style]) :where(button, [role=\"button\"], summary) svg,\n:where([role=\"dialog\"], [role=\"alertdialog\"], [role=\"menu\"], dialog):has([data-dsh-style]) :where(button, [role=\"button\"], summary) svg {\n  translate: 0px 0px;\n  rotate: 0deg;\n  scale: 1;\n  transform-origin: center;\n}\n\n@keyframes dsh-icon-spin {\n  to {\n    rotate: 360deg;\n  }\n}\n\n@keyframes dsh-icon-wiggle {\n  0% { rotate: 0deg; }\n  25% { rotate: -12deg; }\n  55% { rotate: 10deg; }\n  80% { rotate: -5deg; }\n  100% { rotate: 0deg; }\n}\n\n@keyframes dsh-icon-pop {\n  0% { scale: 1; }\n  45% { scale: 1.26; }\n  75% { scale: 0.94; }\n  100% { scale: 1; }\n}\n\n@keyframes dsh-icon-bounce {\n  0%, 100% { translate: 0px 0px; }\n  45% { translate: 0px 2.5px; }\n  75% { translate: 0px -1px; }\n}\n\n@media (prefers-reduced-motion: no-preference) {\n  :where([data-dsh-style]) :where(button, [role=\"button\"], summary) svg,\n  :where([role=\"dialog\"], [role=\"alertdialog\"], [role=\"menu\"], dialog):has([data-dsh-style]) :where(button, [role=\"button\"], summary) svg {\n    transition:\n      translate var(--dsh-motion-base) var(--dsh-ease-spring),\n      rotate 240ms var(--dsh-ease-spring),\n      scale var(--dsh-motion-base) var(--dsh-ease-spring);\n  }\n\n  /* 1) `down` / chevron: 180deg flip on `[aria-expanded=\"true\"]` or `details[open]` */\n  :where([data-dsh-style]) :where([aria-expanded=\"true\"], [data-open=\"true\"], details[open] > summary) :is(svg[data-dsh-icon=\"down\"], svg[data-dsh-icon=\"chevron-down\"], svg[data-icon=\"down\"], svg[data-icon=\"chevron-down\"]),\n  :where([role=\"dialog\"], [role=\"alertdialog\"], dialog):has([data-dsh-style]) :where([aria-expanded=\"true\"], [data-open=\"true\"]) :is(svg[data-dsh-icon=\"down\"], svg[data-dsh-icon=\"chevron-down\"], svg[data-icon=\"down\"], svg[data-icon=\"chevron-down\"]) {\n    rotate: 180deg;\n  }\n\n  /* 2) `refresh` / `sync`: smooth 180deg spin on hover, continuous spin when busy */\n  :where([data-dsh-style]) :where(button, [role=\"button\"])[aria-busy=\"true\"] :is(svg[data-dsh-icon=\"refresh\"], svg[data-dsh-icon=\"sync\"], svg[data-icon=\"refresh\"], svg[data-icon=\"sync\"]),\n  :where([data-dsh-style]) :is(svg[data-dsh-icon=\"refresh\"], svg[data-icon=\"refresh\"])[data-spinning=\"true\"] {\n    animation: dsh-icon-spin 0.85s linear infinite;\n  }\n\n  @media (hover: hover) {\n    :where([data-dsh-style], [role=\"dialog\"], [role=\"alertdialog\"], dialog) :where(button, [role=\"button\"]):hover:not(:disabled):not([aria-disabled=\"true\"]) :is(svg[data-dsh-icon=\"refresh\"], svg[data-dsh-icon=\"sync\"], svg[data-dsh-icon=\"reload\"], svg[data-icon=\"refresh\"], svg[data-icon=\"sync\"], svg[data-icon=\"reload\"]) {\n      rotate: 180deg;\n    }\n\n    /* 3) `plus` / `close`: crisp 90deg turn */\n    :where([data-dsh-style], [role=\"dialog\"], [role=\"alertdialog\"], dialog) :where(button, [role=\"button\"]):hover:not(:disabled):not([aria-disabled=\"true\"]) :is(svg[data-dsh-icon=\"plus\"], svg[data-dsh-icon=\"add\"], svg[data-dsh-icon=\"close\"], svg[data-dsh-icon=\"x\"], svg[data-icon=\"plus\"], svg[data-icon=\"add\"], svg[data-icon=\"close\"], svg[data-icon=\"x\"]) {\n      rotate: 90deg;\n    }\n\n    /* 4) `send` / `external` / `link`: forward/diagonal glide */\n    :where([data-dsh-style], [role=\"dialog\"], [role=\"alertdialog\"], dialog) :where(button, [role=\"button\"], a):hover:not(:disabled):not([aria-disabled=\"true\"]) :is(svg[data-dsh-icon=\"send\"], svg[data-dsh-icon=\"external\"], svg[data-dsh-icon=\"link\"], svg[data-icon=\"send\"], svg[data-icon=\"external\"], svg[data-icon=\"link\"]) {\n      translate: 2px -1.5px;\n    }\n\n    /* 5) `reply` / `left` / `undo`: leading glide */\n    :where([data-dsh-style], [role=\"dialog\"], [role=\"alertdialog\"], dialog) :where(button, [role=\"button\"]):hover:not(:disabled):not([aria-disabled=\"true\"]) :is(svg[data-dsh-icon=\"reply\"], svg[data-dsh-icon=\"left\"], svg[data-dsh-icon=\"undo\"], svg[data-icon=\"reply\"], svg[data-icon=\"left\"], svg[data-icon=\"undo\"]) {\n      translate: -2px 0px;\n    }\n\n    /* 6) `right` / `play`: trailing nudge & pulse */\n    :where([data-dsh-style], [role=\"dialog\"], [role=\"alertdialog\"], dialog) :where(button, [role=\"button\"]):hover:not(:disabled):not([aria-disabled=\"true\"]) :is(svg[data-dsh-icon=\"right\"], svg[data-icon=\"right\"]) {\n      translate: 2px 0px;\n    }\n\n    :where([data-dsh-style], [role=\"dialog\"], [role=\"alertdialog\"], dialog) :where(button, [role=\"button\"]):hover:not(:disabled):not([aria-disabled=\"true\"]) :is(svg[data-dsh-icon=\"play\"], svg[data-icon=\"play\"]) {\n      translate: 1.5px 0px;\n      scale: 1.14;\n    }\n\n    /* 7) `trash` / `delete`: tactile warning wiggle */\n    :where([data-dsh-style], [role=\"dialog\"], [role=\"alertdialog\"], dialog) :where(button, [role=\"button\"]):hover:not(:disabled):not([aria-disabled=\"true\"]) :is(svg[data-dsh-icon=\"trash\"], svg[data-dsh-icon=\"delete\"], svg[data-icon=\"trash\"], svg[data-icon=\"delete\"]) {\n      animation: dsh-icon-wiggle 360ms var(--dsh-ease-in-out);\n    }\n\n    /* 8) `star` / `check` / `copy` / `bookmark`: spring pop */\n    :where([data-dsh-style], [role=\"dialog\"], [role=\"alertdialog\"], dialog) :where(button, [role=\"button\"]):hover:not(:disabled):not([aria-disabled=\"true\"]) :is(svg[data-dsh-icon=\"star\"], svg[data-dsh-icon=\"check\"], svg[data-dsh-icon=\"copy\"], svg[data-dsh-icon=\"bookmark\"], svg[data-icon=\"star\"], svg[data-icon=\"check\"], svg[data-icon=\"copy\"], svg[data-icon=\"bookmark\"]) {\n      scale: 1.18;\n    }\n\n    /* 9) `download` / `export`: vertical bounce */\n    :where([data-dsh-style], [role=\"dialog\"], [role=\"alertdialog\"], dialog) :where(button, [role=\"button\"]):hover:not(:disabled):not([aria-disabled=\"true\"]) :is(svg[data-dsh-icon=\"download\"], svg[data-dsh-icon=\"export\"], svg[data-icon=\"download\"], svg[data-icon=\"export\"]) {\n      animation: dsh-icon-bounce 420ms var(--dsh-ease-out);\n    }\n\n    /* 10) `palette` / `sparkles` / `edit`: playful tilt */\n    :where([data-dsh-style], [role=\"dialog\"], [role=\"alertdialog\"], dialog) :where(button, [role=\"button\"]):hover:not(:disabled):not([aria-disabled=\"true\"]) :is(svg[data-dsh-icon=\"palette\"], svg[data-dsh-icon=\"sparkles\"], svg[data-dsh-icon=\"edit\"], svg[data-icon=\"palette\"], svg[data-icon=\"sparkles\"], svg[data-icon=\"edit\"]) {\n      rotate: -12deg;\n      scale: 1.08;\n    }\n\n    /* Closed chevron gentle downward cue on hover */\n    :where([data-dsh-style], [role=\"dialog\"], [role=\"alertdialog\"], dialog) :where(button, [role=\"button\"])[aria-expanded=\"false\"]:hover:not(:disabled):not([aria-disabled=\"true\"]) :is(svg[data-dsh-icon=\"down\"], svg[data-dsh-icon=\"chevron-down\"], svg[data-icon=\"down\"], svg[data-icon=\"chevron-down\"]) {\n      translate: 0px 1.5px;\n    }\n  }\n\n  /* Pop feedback when toggled into active/pressed/checked state */\n  :where([data-dsh-style], [role=\"dialog\"], [role=\"alertdialog\"], dialog) :where([aria-pressed=\"true\"], [aria-checked=\"true\"], [data-active=\"true\"], [data-copied=\"true\"]) :is(svg[data-dsh-icon=\"star\"], svg[data-dsh-icon=\"check\"], svg[data-dsh-icon=\"copy\"], svg[data-icon=\"star\"], svg[data-icon=\"check\"], svg[data-icon=\"copy\"]) {\n    animation: dsh-icon-pop 300ms var(--dsh-ease-spring);\n  }\n}\n\n/* --------------------------------------------------------------------------\n * 13. v3 Layout Primitives: Unified 48px Single-Row Header\n * -------------------------------------------------------------------------- */\n:where([data-dsh-style]) :where(.dsh-header, [data-dsh-header]) {\n  display: flex;\n  align-items: center;\n  justify-content: space-between;\n  gap: 10px;\n  min-height: 48px;\n  padding: 6px 14px;\n  flex: none;\n  min-width: 0;\n  background: var(--dsw-alias-bg-base);\n  border-block-end: var(--dsh-control-border-width, 0.5px) solid var(--dsw-alias-border-l2);\n}\n\n.dsh-header-leading {\n  display: flex;\n  align-items: center;\n  gap: 10px;\n  min-width: 0;\n  flex: 1 1 auto;\n}\n\n.dsh-header-brand {\n  display: inline-flex;\n  align-items: center;\n  gap: 8px;\n  min-width: 0;\n  flex: none;\n  white-space: nowrap;\n}\n\n.dsh-header-badge {\n  display: inline-flex;\n  align-items: center;\n  justify-content: center;\n  flex: none;\n  width: 24px;\n  height: 24px;\n  border-radius: var(--dsw-radius-xs, 6px);\n  background: var(--dsw-alias-button-primary-fill, #4176e6);\n  color: var(--dsw-alias-button-primary-ink, #ffffff);\n}\n\n.dsh-header-title {\n  margin: 0;\n  font-size: 13.5px;\n  font-weight: var(--dsh-display-weight, 650);\n  line-height: 1.25;\n  color: var(--dsw-alias-label-primary);\n  white-space: nowrap;\n}\n\n.dsh-header-tabs {\n  display: flex;\n  align-items: center;\n  min-width: 0;\n  flex: 1 1 auto;\n}\n\n.dsh-header-actions {\n  display: inline-flex;\n  align-items: center;\n  gap: 6px;\n  flex: none;\n  white-space: nowrap;\n}\n\n@container (max-width: 759px) {\n  :where([data-dsh-style]) :where(.dsh-header, [data-dsh-header]) {\n    flex-wrap: wrap;\n    padding-block: 6px;\n  }\n\n  .dsh-header-leading {\n    flex-wrap: wrap;\n    gap: 6px 10px;\n  }\n}\n\n/* --------------------------------------------------------------------------\n * 14. v3 Tabs: Sliding Indicator + 140ms `@starting-style` Panel Entrance\n * -------------------------------------------------------------------------- */\n:where([data-dsh-style]) :where([role=\"tablist\"], .dsh-tablist) {\n  position: relative;\n  display: flex;\n  align-items: center;\n  gap: 2px;\n  min-width: 0;\n  overflow-x: auto;\n  scrollbar-width: thin;\n}\n\n:where([data-dsh-style]) [role=\"tab\"] {\n  position: relative;\n  flex: none;\n  white-space: nowrap;\n}\n\n/* Static fallback underline when sliding indicator is not active (or in forced-colors) */\n:where([data-dsh-style]) [role=\"tab\"][aria-selected=\"true\"]::after {\n  content: \"\";\n  position: absolute;\n  inset-inline: 6px;\n  inset-block-end: 0;\n  border-block-end: 2px solid var(--dsw-alias-state-business-primary);\n  pointer-events: none;\n}\n\n[data-dsh-style] :where([data-dsh-tablist][data-indicator-ready=\"true\"], .dsh-tablist[data-indicator-ready=\"true\"]) [role=\"tab\"][aria-selected=\"true\"]::after {\n  opacity: 0;\n}\n\n.dsh-tab-indicator {\n  position: absolute;\n  inset-inline-start: 0;\n  inset-block-end: 0;\n  height: 2px;\n  width: var(--dsh-tab-w, 0px);\n  translate: var(--dsh-tab-x, 0px) 0px;\n  border-block-end: 2px solid var(--dsw-alias-state-business-primary);\n  border-radius: 2px 2px 0 0;\n  pointer-events: none;\n  opacity: 0;\n  transition:\n    translate 180ms var(--dsh-ease-out),\n    width 180ms var(--dsh-ease-out),\n    opacity 120ms ease-out;\n}\n\n[data-indicator-ready=\"true\"] > .dsh-tab-indicator {\n  opacity: 1;\n}\n\n.dsh-tablist-pill > .dsh-tab-indicator {\n  inset-block: 3px;\n  height: auto;\n  border-block-end: 2px solid var(--dsw-alias-state-business-primary);\n  border-radius: var(--dsw-radius-xs, 6px);\n  background: var(--dsw-alias-interactive-bg-active);\n  z-index: 0;\n}\n\n.dsh-tablist-pill > [role=\"tab\"] {\n  z-index: 1;\n}\n\n[data-dsh-style=\"eink\"] .dsh-tab-indicator {\n  transition-duration: 60ms;\n}\n\n[data-dsh-style=\"pixel8bit\"] .dsh-tab-indicator {\n  border-radius: 0px !important;\n  transition-timing-function: steps(4, end);\n}\n\n/* 140ms `@starting-style` + keyframe fade-in for active tab panels */\n@keyframes dsh-tab-panel-enter {\n  from {\n    opacity: 0;\n    translate: 0px 4px;\n  }\n  to {\n    opacity: 1;\n    translate: 0px 0px;\n  }\n}\n\n:where([data-dsh-style]) :where(.dsh-tab-panel, [data-dsh-tab-panel]):not([hidden]) {\n  opacity: 1;\n  translate: 0px 0px;\n  transition:\n    opacity 140ms var(--dsh-ease-out),\n    translate 140ms var(--dsh-ease-out);\n  animation: dsh-tab-panel-enter 140ms var(--dsh-ease-out);\n}\n\n@starting-style {\n  :where([data-dsh-style]) :where(.dsh-tab-panel, [data-dsh-tab-panel]):not([hidden]) {\n    opacity: 0;\n    translate: 0px 4px;\n  }\n}\n\n/* --------------------------------------------------------------------------\n * 15. v3 Resizable Split Pane (`.dsh-split-pane` + `.dsh-split-resizer`)\n *     - Pointer-capture drag + double-click reset + ArrowLeft/ArrowRight\n *     - Auto-stack fallback below 760px container/viewport width\n * -------------------------------------------------------------------------- */\n.dsh-split-pane {\n  display: flex;\n  flex: 1 1 auto;\n  min-width: 0;\n  min-height: 0;\n  width: 100%;\n}\n\n.dsh-split-leading {\n  flex: none;\n  min-width: 0;\n  min-height: 0;\n  width: var(--dsh-split-size, 320px);\n}\n\n.dsh-split-trailing {\n  flex: 1 1 auto;\n  min-width: 0;\n  min-height: 0;\n}\n\n.dsh-split-resizer {\n  position: relative;\n  flex: none;\n  width: 9px;\n  min-height: 24px;\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  cursor: col-resize;\n  touch-action: none;\n  user-select: none;\n  background: transparent;\n  outline: none;\n}\n\n.dsh-split-resizer[aria-orientation=\"horizontal\"] {\n  width: 100%;\n  height: 9px;\n  min-height: 9px;\n  cursor: row-resize;\n}\n\n.dsh-split-resizer::before {\n  content: \"\";\n  width: 1px;\n  height: 100%;\n  background: var(--dsw-alias-border-l2);\n  transition:\n    width 120ms var(--dsh-ease-out),\n    background-color 120ms var(--dsh-ease-out);\n}\n\n.dsh-split-resizer[aria-orientation=\"horizontal\"]::before {\n  width: 100%;\n  height: 1px;\n}\n\n.dsh-split-resizer::after {\n  content: \"\";\n  position: absolute;\n  width: 3px;\n  height: 28px;\n  border-radius: 999px;\n  background: var(--dsw-alias-border-l3);\n  opacity: 0;\n  transition:\n    opacity 120ms var(--dsh-ease-out),\n    background-color 120ms var(--dsh-ease-out);\n}\n\n.dsh-split-resizer[aria-orientation=\"horizontal\"]::after {\n  width: 28px;\n  height: 3px;\n}\n\n.dsh-split-resizer:hover::before,\n.dsh-split-resizer:focus-visible::before,\n.dsh-split-resizer[data-dragging=\"true\"]::before {\n  width: 2px;\n  background: var(--dsw-alias-state-business-primary);\n}\n\n.dsh-split-resizer[aria-orientation=\"horizontal\"]:is(:hover, :focus-visible, [data-dragging=\"true\"])::before {\n  width: 100%;\n  height: 2px;\n}\n\n.dsh-split-resizer:is(:hover, :focus-visible, [data-dragging=\"true\"])::after {\n  opacity: 1;\n  background: var(--dsw-alias-state-business-primary);\n}\n\n.dsh-split-resizer:focus-visible {\n  outline: 2px solid var(--dsw-alias-state-business-primary);\n  outline-offset: -2px;\n}\n\n[data-dsh-style=\"pixel8bit\"] .dsh-split-resizer::before {\n  width: 2px;\n  background: #1e2826;\n}\n\n[data-dsh-style=\"pixel8bit\"] .dsh-split-resizer::after {\n  border-radius: 0px;\n}\n\n@container (max-width: 759px) {\n  .dsh-split-pane {\n    flex-direction: column;\n    overflow-y: auto;\n  }\n\n  .dsh-split-leading {\n    width: 100% !important;\n    max-width: 100%;\n    flex: none;\n  }\n\n  .dsh-split-resizer {\n    display: none;\n  }\n}\n\n@media (max-width: 759px) {\n  .dsh-split-pane {\n    flex-direction: column;\n    overflow-y: auto;\n  }\n\n  .dsh-split-leading {\n    width: 100% !important;\n    max-width: 100%;\n    flex: none;\n  }\n\n  .dsh-split-resizer {\n    display: none;\n  }\n}\n\n/* --------------------------------------------------------------------------\n * 16. v3 Theme-Tinted Shimmer Skeleton & Pixel Progress Helpers\n * -------------------------------------------------------------------------- */\n@keyframes dsh-skeleton-shimmer {\n  0% { background-position: 100% 0; }\n  100% { background-position: -100% 0; }\n}\n\n.dsh-skeleton-group {\n  display: flex;\n  flex-direction: column;\n  gap: 8px;\n  width: 100%;\n}\n\n.dsh-skeleton {\n  display: block;\n  width: 100%;\n  height: 12px;\n  border-radius: var(--dsw-radius-xs, 6px);\n  background-color: var(--dsw-alias-bg-layer-2, #e5e7eb);\n  background-image: linear-gradient(\n    90deg,\n    var(--dsw-alias-bg-layer-2, #e5e7eb) 0%,\n    color-mix(in oklab, var(--dsw-alias-bg-overlay, #ffffff) 82%, var(--dsw-alias-state-business-primary, #4176e6) 18%) 48%,\n    var(--dsw-alias-bg-layer-2, #e5e7eb) 100%\n  );\n  background-size: 220% 100%;\n  background-position: 100% 0;\n}\n\n.dsh-skeleton-circle {\n  width: 32px;\n  height: 32px;\n  border-radius: 50%;\n  flex: none;\n}\n\n.dsh-skeleton-card {\n  display: flex;\n  flex-direction: column;\n  gap: 10px;\n  padding: 12px 14px;\n  border-radius: var(--dsw-radius-md, 12px);\n  border: var(--dsh-control-border-width, 0.5px) solid var(--dsw-alias-border-l1);\n  background: var(--dsw-alias-bg-layer-1);\n}\n\n.dsh-skeleton-row {\n  display: flex;\n  align-items: center;\n  gap: 10px;\n  padding: 8px 10px;\n}\n\n@media (prefers-reduced-motion: no-preference) {\n  :where([data-dsh-style]:not([data-dsh-style=\"eink\"])) .dsh-skeleton[data-animated=\"true\"] {\n    animation: dsh-skeleton-shimmer 1.35s var(--dsh-ease-in-out) infinite;\n  }\n\n  [data-dsh-style=\"pixel8bit\"] .dsh-skeleton[data-animated=\"true\"] {\n    border-radius: 0px !important;\n    border: 1px solid #1e2826;\n    animation-timing-function: steps(4, end);\n  }\n}\n\n[data-dsh-style=\"eink\"] .dsh-skeleton {\n  background-image: none;\n  border: 1px solid #c5c2b8;\n}\n\n/* Stepped pixel progress helper */\n.dsh-progress {\n  position: relative;\n  width: 100%;\n  height: 6px;\n  overflow: clip;\n  border-radius: 999px;\n  background: var(--dsw-alias-bg-layer-2);\n}\n\n.dsh-progress-bar {\n  height: 100%;\n  width: var(--dsh-progress-value, 0%);\n  border-radius: inherit;\n  background: var(--dsw-alias-state-business-primary);\n  transition: width 200ms var(--dsh-ease-out);\n}\n\n[data-dsh-style=\"pixel8bit\"] .dsh-progress {\n  height: 10px;\n  border-radius: 0px !important;\n  border: 2px solid #1e2826;\n  background: var(--dsw-alias-bg-layer-1);\n  box-shadow: 2px 2px 0px #1e2826;\n}\n\n[data-dsh-style=\"pixel8bit\"] .dsh-progress-bar {\n  border-radius: 0px !important;\n  background: repeating-linear-gradient(\n    90deg,\n    #2e7d5b 0px,\n    #2e7d5b 6px,\n    #24674a 6px,\n    #24674a 8px\n  );\n  transition-timing-function: steps(8, end);\n}\n\n/* --------------------------------------------------------------------------\n * 17. v3 Interactive Cards, Rows, Quick-Action Bar & Top-Layer Dialog Entrance\n * -------------------------------------------------------------------------- */\n:where([data-dsh-style]) :where([data-dsh-card], .dsh-card, [data-dsh-row], .dsh-row) {\n  translate: 0px 0px;\n  transition:\n    background-color var(--dsh-motion-fast) var(--dsh-ease-out),\n    border-color var(--dsh-motion-fast) var(--dsh-ease-out),\n    box-shadow var(--dsh-motion-base) var(--dsh-ease-out),\n    translate var(--dsh-motion-base) var(--dsh-ease-out);\n}\n\n/* Row Hover Quick-Action Bar (`.dsh-row-actions`) */\n.dsh-row-actions {\n  display: inline-flex;\n  align-items: center;\n  gap: 4px;\n  flex: none;\n  translate: 0px 0px;\n  transition:\n    opacity var(--dsh-motion-fast) var(--dsh-ease-out),\n    translate var(--dsh-motion-fast) var(--dsh-ease-out);\n}\n\n@media (hover: hover) {\n  :where([data-dsh-row], .dsh-row) .dsh-row-actions:not([data-always-visible=\"true\"]) {\n    opacity: 0;\n    translate: 4px 0px;\n    pointer-events: none;\n  }\n\n  :where([data-dsh-row], .dsh-row):is(:hover, :focus-within, [data-active=\"true\"], [data-selected=\"true\"], [aria-selected=\"true\"]) .dsh-row-actions {\n    opacity: 1;\n    translate: 0px 0px;\n    pointer-events: auto;\n  }\n}\n\n@media (hover: hover) and (prefers-reduced-motion: no-preference) {\n  :where([data-dsh-style]:not([data-dsh-style=\"pixel8bit\"]):not([data-dsh-style=\"eink\"]):not([data-dsh-style=\"win98\"]):not([data-dsh-style=\"risograph\"])) :where([data-dsh-card], .dsh-card):hover {\n    translate: 0px -1.5px;\n    box-shadow: var(--dsh-card-hover-shadow);\n  }\n\n  [data-dsh-style=\"pixel8bit\"] :where([data-dsh-card], .dsh-card):hover {\n    translate: -1px -1px;\n    box-shadow: 4px 4px 0px #1e2826;\n  }\n\n  [data-dsh-style=\"risograph\"] :where([data-dsh-card], .dsh-card):hover {\n    translate: -1px -1px;\n    box-shadow: 5px 5px 0px #ff3e7f;\n  }\n\n  :where([data-dsh-style]) :where([data-dsh-row], .dsh-row):hover:not([data-selected=\"true\"]):not([aria-selected=\"true\"]):not([data-active=\"true\"]) {\n    background-color: var(--dsh-surface-spotlight, var(--dsw-alias-interactive-bg-hover));\n  }\n}\n\n/* Modal / Dialog & Popover Top-Layer Entrance + Scroll Containment */\n:where([role=\"dialog\"], [role=\"alertdialog\"], dialog[open]):where([data-dsh-style], :has([data-dsh-style])) {\n  overscroll-behavior: contain;\n  opacity: 1;\n  transition-property: opacity, scale, translate, display, overlay;\n  transition-duration: var(--dsh-motion-dialog);\n  transition-timing-function: var(--dsh-ease-out);\n  /* Separate declaration after transition so older parsers never drop transitions */\n  transition-behavior: allow-discrete;\n}\n\n@starting-style {\n  :where([role=\"dialog\"], [role=\"alertdialog\"], dialog[open]):where([data-dsh-style], :has([data-dsh-style])) {\n    opacity: 0;\n  }\n}\n\n@media (prefers-reduced-motion: no-preference) {\n  :where([role=\"dialog\"], [role=\"alertdialog\"], dialog[open]):where([data-dsh-style], :has([data-dsh-style])) {\n    scale: 1;\n    translate: 0px 0px;\n  }\n\n  @starting-style {\n    :where([role=\"dialog\"], [role=\"alertdialog\"], dialog[open]):where([data-dsh-style], :has([data-dsh-style])) {\n      scale: 0.965;\n      translate: 0px 6px;\n    }\n  }\n}\n\ndialog[open]::backdrop {\n  overflow: hidden;\n  overscroll-behavior: contain;\n}\n\n/* --------------------------------------------------------------------------\n * 18. v3 Calm Compact Update Strip (`[data-plugin-update-footer]`)\n *     Keeps `@stardustlc/dsh-updates` footer compact at bottom without\n *     crushing or cutting off `flex: 1` split-pane columns.\n * -------------------------------------------------------------------------- */\n:where([data-dsh-style]) [data-plugin-update-footer] {\n  flex: none;\n  box-sizing: border-box;\n  width: 100%;\n  min-height: 32px;\n  margin: 0;\n  padding: 6px 14px;\n  display: flex;\n  flex-wrap: wrap;\n  align-items: center;\n  justify-content: space-between;\n  gap: 6px 12px;\n  font-size: 12px;\n  line-height: 1.4;\n  color: var(--dsw-alias-label-secondary);\n  background: var(--dsw-alias-bg-layer-1);\n  border-block-start: var(--dsh-control-border-width, 0.5px) solid var(--dsw-alias-border-l2);\n}\n\n:where([data-dsh-style]) [data-plugin-update-footer] :where(button, a) {\n  min-height: 24px;\n  font-size: 11.5px;\n}\n\n:where([data-dsh-style]) [data-show-updates=\"false\"] [data-plugin-update-footer] {\n  display: none;\n}\n\n/* --------------------------------------------------------------------------\n * 19. Unified Header Style & Font Switcher Chrome (`.dsh-style-switcher`)\n * -------------------------------------------------------------------------- */\n.dsh-style-switcher {\n  display: inline-flex;\n  align-items: center;\n  gap: 6px;\n  flex-shrink: 0;\n  flex: none;\n  white-space: nowrap;\n}\n\n.dsh-style-trigger.dsh-style-trigger,\n.dsh-font-trigger.dsh-font-trigger {\n  display: inline-flex;\n  align-items: center;\n  gap: 6px;\n  min-height: 28px;\n  height: 28px;\n  padding-inline: 8px;\n  width: auto;\n  flex-shrink: 0;\n  font-size: 12px;\n  line-height: 18px;\n  font-weight: 500;\n  color: var(--dsw-alias-label-secondary);\n  background: var(--dsw-alias-bg-layer-1);\n  border: var(--dsh-control-border-width, 0.5px) solid var(--dsw-alias-border-l2);\n  border-radius: var(--dsw-radius-sm, 8px);\n  cursor: pointer;\n  white-space: nowrap;\n}\n\n.dsh-font-trigger.dsh-font-trigger {\n  gap: 5px;\n  padding-inline: 7px;\n}\n\n.dsh-font-glyph {\n  display: inline-flex;\n  align-items: center;\n  justify-content: center;\n  flex: none;\n  min-width: 16px;\n  height: 16px;\n  padding-inline: 3px;\n  border-radius: var(--dsw-radius-xs, 4px);\n  background: var(--dsw-alias-state-business-tertiary, rgba(65, 118, 230, 0.12));\n  color: var(--dsw-alias-state-business-primary, var(--dsw-alias-label-primary));\n  font-family: var(--dsh-font-display);\n  font-size: 10.5px;\n  font-weight: 700;\n  line-height: 1;\n}\n\n.dsh-style-label,\n.dsh-font-label {\n  white-space: nowrap;\n  line-height: 1;\n}\n\n@media (hover: hover) {\n  .dsh-style-trigger.dsh-style-trigger:hover:not(:disabled),\n  .dsh-font-trigger.dsh-font-trigger:hover:not(:disabled) {\n    color: var(--dsw-alias-label-primary);\n    background: var(--dsw-alias-interactive-bg-hover);\n  }\n}\n\n.dsh-style-swatch {\n  display: inline-block;\n  flex: none;\n  width: 10px;\n  height: 10px;\n  border-radius: 50%;\n  corner-shape: round;\n  background: var(--dsh-swatch-color, var(--dsw-alias-state-business-primary));\n  box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.16);\n}\n\n[data-dsh-style=\"pixel8bit\"] .dsh-style-swatch {\n  border-radius: 0px !important;\n  corner-shape: square;\n  box-shadow: 1px 1px 0px #1e2826;\n}\n\n.dsh-style-fallback-wrap {\n  position: relative;\n  display: inline-flex;\n}\n\n.dsh-style-fallback-menu {\n  position: absolute;\n  inset-block-start: calc(100% + 4px);\n  inset-inline-end: 0;\n  z-index: 2147483001;\n  display: grid;\n  gap: 2px;\n  min-width: 186px;\n  max-height: min(420px, 70dvh);\n  overflow-y: auto;\n  overscroll-behavior: contain;\n  padding: 4px;\n  background: var(--dsw-alias-bg-overlay, var(--dsw-alias-bg-base));\n  border: var(--dsh-control-border-width, 0.5px) solid var(--dsw-alias-border-l2);\n  border-radius: var(--dsw-radius-md, 12px);\n  box-shadow: var(--dsw-elevation-prominent);\n}\n\n.dsh-style-fallback-item {\n  display: flex;\n  align-items: center;\n  justify-content: space-between;\n  gap: 8px;\n  width: 100%;\n  min-height: 28px;\n  padding: 4px 8px;\n  border: 0;\n  border-radius: var(--dsw-radius-xs, 6px);\n  background: transparent;\n  color: var(--dsw-alias-label-primary);\n  font: inherit;\n  font-size: 12px;\n  text-align: start;\n  cursor: pointer;\n}\n\n.dsh-style-fallback-item-leading {\n  display: inline-flex;\n  align-items: center;\n  gap: 7px;\n  min-width: 0;\n}\n\n.dsh-style-fallback-item[aria-checked=\"true\"] {\n  background: var(--dsw-alias-interactive-bg-active);\n  font-weight: 600;\n}\n\n@media (hover: hover) {\n  .dsh-style-fallback-item:hover:not(:disabled) {\n    background: var(--dsw-alias-interactive-bg-hover);\n  }\n}\n\n/* Fallback Modal & Menu Chrome (when host `@deepseek-ai/dsh-client-ui-primitives` is absent) */\n.dsh-fallback-modal-root {\n  position: fixed;\n  inset: 0;\n  z-index: 2147483000;\n  display: grid;\n  place-items: center;\n  padding: 16px;\n}\n\n.dsh-fallback-modal-mask {\n  position: fixed;\n  inset: 0;\n  background: rgba(15, 23, 42, 0.36);\n}\n\n.dsh-fallback-modal-dialog {\n  position: relative;\n  z-index: 1;\n  max-width: min(560px, calc(100dvw - 32px));\n  max-height: calc(100dvh - 32px);\n  overflow: clip;\n  display: flex;\n  flex-direction: column;\n  border-radius: var(--dsw-radius-md, 12px);\n  background: var(--dsw-alias-bg-layer-1, #f8fafc);\n  color: var(--dsw-alias-label-primary, #1f232b);\n  box-shadow: var(--dsw-elevation-prominent);\n}\n\n/* --------------------------------------------------------------------------\n * 20. Accessibility: Reduced Motion & Windows High Contrast (Forced Colors)\n * -------------------------------------------------------------------------- */\n@media (prefers-reduced-motion: reduce) {\n  :where([data-dsh-style]) :where(button, [role=\"button\"], [data-dsh-card], .dsh-card, [data-dsh-row], .dsh-row, .dsh-row-actions, .dsh-tab-panel, [data-dsh-tab-panel]),\n  :where([role=\"dialog\"], [role=\"alertdialog\"], [role=\"menu\"], dialog):has([data-dsh-style]) :where(button, [role=\"button\"]) {\n    translate: none !important;\n    scale: none !important;\n    animation: none !important;\n    transition-property: background-color, border-color, color, opacity;\n    transition-duration: 90ms;\n  }\n\n  :where([data-dsh-style], [role=\"dialog\"], [role=\"alertdialog\"], dialog) :where(button, [role=\"button\"], summary) svg,\n  [data-dsh-style=\"pixel8bit\"] :where([data-dsh-row], .dsh-row)::before,\n  [data-dsh-style=\"pixel8bit\"] .dsh-pixel-cursor {\n    animation: none !important;\n    transition: none !important;\n    translate: none !important;\n    scale: none !important;\n  }\n\n  .dsh-tab-indicator {\n    transition-property: opacity;\n    transition-duration: 90ms;\n  }\n\n  .dsh-skeleton {\n    animation: none !important;\n    background-image: none;\n  }\n\n  /* Short, non-spatial fade only for top-layer dialogs under reduced motion */\n  :where([role=\"dialog\"], [role=\"alertdialog\"], dialog[open]):where([data-dsh-style], :has([data-dsh-style])) {\n    scale: none !important;\n    translate: none !important;\n    transition-duration: 100ms;\n  }\n}\n\n@media (forced-colors: active) {\n  :where([data-dsh-style]) :where(button, input, select, textarea, [data-dsh-card], .dsh-card),\n  :where([role=\"dialog\"], [role=\"alertdialog\"], [role=\"menu\"], dialog):where([data-dsh-style], :has([data-dsh-style])) {\n    border: 1px solid ButtonText;\n  }\n\n  :where([data-dsh-style]) [role=\"tab\"][aria-selected=\"true\"]::after {\n    opacity: 1 !important;\n    border-block-end: 3px solid Highlight;\n  }\n\n  .dsh-tab-indicator {\n    background: transparent !important;\n    border-block-end: 3px solid Highlight;\n  }\n\n  .dsh-split-resizer::before,\n  .dsh-split-resizer::after {\n    background: ButtonText;\n  }\n\n  .dsh-skeleton {\n    border: 1px solid GrayText;\n    background: Canvas;\n  }\n}\n.dsh-dream_dshd-toolbar {\n  display: flex;\n  align-items: center;\n  gap: 8px;\n  flex-wrap: wrap;\n  margin-bottom: 12px;\n}\n\n.dsh-dream_dshd-search {\n  position: relative;\n  display: flex;\n  align-items: center;\n  flex: 1;\n  min-width: 180px;\n  gap: 4px;\n}\n\n.dsh-dream_dshd-spacer {\n  flex: 1;\n}\n\n.dsh-dream_dshd-filter {\n  position: relative;\n}\n\n.dsh-dream_dshd-filterpop {\n  position: absolute;\n  right: 0;\n  top: calc(100% + 6px);\n  z-index: 6;\n  width: min(280px,86vw);\n  padding: 10px 11px;\n}\n\n.dsh-dream_dshd-filtertitle {\n  font-size: 11px;\n  color: var(--dsw-alias-label-tertiary);\n  margin-bottom: 7px;\n}\n\n.dsh-dream_filterPill { margin: 0 5px 5px 0; }\n\n.dsh-dream_dshd-filterfoot {\n  display: flex;\n  align-items: center;\n  justify-content: space-between;\n  gap: 8px;\n  margin-top: 2px;\n}\n\n.dsh-dream_dshd-filterempty {\n  display: flex;\n  align-items: center;\n  gap: 8px;\n  border-radius: 10px;\n  padding: 10px 12px;\n  font-size: 12px;\n  margin-bottom: 10px;\n  background: var(--dsw-alias-bg-layer-2);\n  color: var(--dsw-alias-label-tertiary);\n}\n\n.dsh-dream_dshd-hint {\n  color: var(--dsw-alias-label-tertiary);\n  font-size: 12px;\n}\n\n.dsh-dream_dshd-note {\n  font-size: 11px;\n  color: var(--dsw-alias-label-tertiary);\n  margin-top: 8px;\n}\n\n.dsh-dream_dshd-headline {\n  font-size: 13px;\n  font-weight: 600;\n  margin: 0 0 10px;\n}\n\n.dsh-dream_dshd-tiles {\n  display: grid;\n  grid-template-columns: repeat(auto-fit,minmax(140px,1fr));\n  gap: 8px;\n  margin-bottom: 12px;\n}\n\n.dsh-dream_dshd-tile {\n  background: var(--dsw-alias-bg-layer-1, #f7f9fc);\n  border: var(--dsh-control-border-width, 0.5px) solid var(--dsw-alias-border-l2, #e2e7f0);\n  border-radius: var(--dsw-radius-md, 11px);\n  padding: 9px 11px;\n  min-width: 0;\n}\n\n.dsh-dream_dshd-tile-label {\n  font-size: 11px;\n  color: var(--dsw-alias-label-tertiary);\n}\n\n.dsh-dream_dshd-tile-value {\n  font-size: 17px;\n  font-weight: 600;\n  margin-top: 1px;\n  overflow-wrap: anywhere;\n  line-height: 1.35;\n}\n\n.dsh-dream_dshd-tile-hint {\n  font-size: 11px;\n  color: var(--dsw-alias-label-tertiary);\n  overflow: hidden;\n  text-overflow: ellipsis;\n  white-space: nowrap;\n}\n\n.dsh-dream_dshd-two {\n  display: grid;\n  grid-template-columns: minmax(0,3fr) minmax(0,2fr);\n  gap: 10px;\n  margin-bottom: 16px;\n}\n\n.dsh-dream_dshd-card {\n  background: var(--dsw-alias-bg-layer-1, #f7f9fc);\n  border: var(--dsh-control-border-width, 0.5px) solid var(--dsw-alias-border-l2, #e2e7f0);\n  border-radius: var(--dsw-radius-md, 12px);\n  padding: 12px 14px;\n  min-width: 0;\n}\n\n.dsh-dream_dshd-card h4 {\n  margin: 0 0 8px;\n  font-size: 13px;\n  font-weight: 600;\n}\n\n.dsh-dream_dshd-mblocks {\n  display: flex;\n  flex-wrap: wrap;\n  gap: 3px;\n  margin-bottom: 8px;\n}\n\n.dsh-dream_dshd-mblock {\n  display: inline-block;\n  width: 12px;\n  height: 12px;\n  border-radius: 3px;\n  flex: 0 0 auto;\n  background: var(--dsw-alias-state-business-primary);\n}\n\n.dsh-dream_dshd-tone-1 {\n  background: var(--dsw-alias-state-success-primary);\n}\n\n.dsh-dream_dshd-tone-2 {\n  background: var(--dsw-alias-state-warn-primary);\n}\n\n.dsh-dream_dshd-tone-3 {\n  background: var(--dsw-alias-state-error-primary);\n}\n\n.dsh-dream_dshd-legend {\n  display: flex;\n  flex-direction: column;\n  gap: 4px;\n}\n\n.dsh-dream_dshd-legend-row {\n  display: flex;\n  align-items: center;\n  gap: 7px;\n  font-size: 12px;\n}\n\n.dsh-dream_dshd-legend-name {\n  flex: 1;\n  min-width: 0;\n  overflow: hidden;\n  text-overflow: ellipsis;\n  white-space: nowrap;\n}\n\n.dsh-dream_dshd-legend-count {\n  color: var(--dsw-alias-label-tertiary);\n  font-size: 11px;\n  font-variant-numeric: tabular-nums;\n}\n\n.dsh-dream_dshd-lesson {\n  display: flex;\n  gap: 8px;\n  align-items: flex-start;\n  padding: 5px 0;\n  border-bottom: 0.5px solid var(--dsw-alias-border-l2);\n  flex-wrap: wrap;\n}\n\n.dsh-dream_dshd-lesson:last-child {\n  border-bottom: 0;\n  padding-bottom: 0;\n}\n\n.dsh-dream_dshd-rank {\n  flex: 0 0 auto;\n  width: 18px;\n  height: 18px;\n  border-radius: 6px;\n  background: var(--dsw-alias-bg-layer-1);\n  border: 0.5px solid var(--dsw-alias-border-l2);\n  color: var(--dsw-alias-label-tertiary);\n  font-size: 11px;\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  font-variant-numeric: tabular-nums;\n}\n\n.dsh-dream_dshd-lesson-body {\n  flex: 1;\n  min-width: 140px;\n  display: flex;\n  flex-direction: column;\n  gap: 4px;\n}\n\n.dsh-dream_dshd-lesson-meta {\n  flex: 0 0 auto;\n  display: flex;\n  align-items: center;\n  gap: 6px;\n  flex-wrap: wrap;\n}\n\n.dsh-dream_dshd-last {\n  font-size: 11px;\n  color: var(--dsw-alias-label-tertiary);\n  white-space: nowrap;\n}\n\n.dsh-dream_dshd-lesson-text {\n  font-size: 12px;\n  word-break: break-word;\n}\n\n.dsh-dream_dshd-track {\n  display: block;\n  height: 6px;\n  border-radius: 999px;\n  background: color-mix(in srgb,var(--dsw-alias-label-primary) 8%,transparent);\n  overflow: hidden;\n}\n\n.dsh-dream_dshd-fill {\n  display: block;\n  height: 100%;\n  border-radius: 999px;\n  background: var(--dsw-alias-state-business-primary);\n  min-width: 6px;\n}\n\n.dsh-dream_dshd-times {\n  flex: 0 0 auto;\n  font-size: 11px;\n  color: var(--dsw-alias-label-tertiary);\n  font-variant-numeric: tabular-nums;\n}\n\n.dsh-dream_dshd-times b {\n  color: var(--dsw-alias-label-primary);\n}\n\n.dsh-dream_dshd-badge {\n  flex: 0 0 auto;\n  font-size: 11px;\n  padding: 1px 7px;\n  border-radius: 999px;\n  background: color-mix(in srgb,var(--dsw-alias-state-warn-primary) 18%,transparent);\n  color: var(--dsw-alias-label-primary);\n  white-space: nowrap;\n}\n\n.dsh-dream_dshd-listhead {\n  display: flex;\n  align-items: baseline;\n  justify-content: space-between;\n  gap: 8px;\n  margin: 2px 0 8px;\n}\n\n.dsh-dream_dshd-listhead h4 {\n  margin: 0;\n  font-size: 13px;\n  font-weight: 600;\n}\n\n.dsh-dream_dshd-timeline {\n  display: flex;\n  flex-direction: column;\n  gap: 8px;\n}\n\n.dsh-dream_dshd-dream {\n  background: var(--dsw-alias-bg-layer-1, #f7f9fc);\n  border: var(--dsh-control-border-width, 0.5px) solid var(--dsw-alias-border-l2, #e2e7f0);\n  border-radius: var(--dsw-radius-md, 12px);\n  padding: 11px 13px;\n  border-inline-start: 3px solid var(--dsw-alias-state-business-primary, #4176e6);\n  min-width: 0;\n}\n\n.dsh-dream_dshd-dream.dsh-dream_dshd-mood-1 {\n  border-left-color: var(--dsw-alias-state-success-primary);\n}\n\n.dsh-dream_dshd-dream.dsh-dream_dshd-mood-2 {\n  border-left-color: var(--dsw-alias-state-warn-primary);\n}\n\n.dsh-dream_dshd-dream.dsh-dream_dshd-mood-3 {\n  border-left-color: var(--dsw-alias-state-error-primary);\n}\n\n.dsh-dream_dshd-dream-head {\n  display: flex;\n  align-items: center;\n  gap: 8px;\n  flex-wrap: wrap;\n  margin-bottom: 5px;\n}\n\n.dsh-dream_dshd-time {\n  font-size: 12px;\n  color: var(--dsw-alias-label-tertiary);\n  font-variant-numeric: tabular-nums;\n}\n\n.dsh-dream_dshd-ago {\n  font-size: 11px;\n  color: var(--dsw-alias-label-tertiary);\n}\n\n.dsh-dream_dshd-mood {\n  display: inline-flex;\n  align-items: center;\n  gap: 5px;\n  font-size: 11px;\n  padding: 1px 8px;\n  border-radius: 999px;\n  background: color-mix(in srgb,var(--dsw-alias-label-primary) 6%,transparent);\n  color: var(--dsw-alias-label-primary);\n  max-width: 180px;\n  overflow: hidden;\n  text-overflow: ellipsis;\n  white-space: nowrap;\n}\n\n.dsh-dream_dshd-mooddot {\n  width: 6px;\n  height: 6px;\n  border-radius: 999px;\n  flex: 0 0 auto;\n  background: var(--dsw-alias-state-business-primary);\n}\n\n.dsh-dream_dshd-linkbtn {\n  border: 0;\n  background: transparent;\n  color: var(--dsw-alias-state-business-primary);\n  font-size: 12px;\n  cursor: pointer;\n  padding: 1px 4px;\n  border-radius: 6px;\n}\n\n.dsh-dream_dshd-linkbtn:hover {\n  background: color-mix(in srgb,var(--dsw-alias-state-business-primary) 10%,transparent);\n}\n\n.dsh-dream_dshd-reflection {\n  white-space: pre-wrap;\n  word-break: break-word;\n}\n\n.dsh-dream_dshd-clamp {\n  display: -webkit-box;\n  -webkit-box-orient: vertical;\n  -webkit-line-clamp: 4;\n  overflow: hidden;\n  max-height: 6.4em;\n}\n\n.dsh-dream_dshd-lessons {\n  margin: 8px 0 0;\n  padding: 0;\n  list-style: none;\n  display: flex;\n  flex-direction: column;\n  gap: 4px;\n}\n\n.dsh-dream_dshd-lessons li {\n  display: flex;\n  gap: 7px;\n  align-items: flex-start;\n  font-size: 12px;\n}\n\n.dsh-dream_dshd-num {\n  flex: 0 0 auto;\n  min-width: 17px;\n  height: 17px;\n  border-radius: 5px;\n  background: color-mix(in srgb,var(--dsw-alias-state-business-primary) 14%,transparent);\n  color: var(--dsw-alias-state-business-primary);\n  font-size: 11px;\n  display: inline-flex;\n  align-items: center;\n  justify-content: center;\n  font-variant-numeric: tabular-nums;\n}\n\n.dsh-dream_dshd-lesson-li {\n  flex: 1;\n  min-width: 0;\n  word-break: break-word;\n}\n\n.dsh-dream_dshd-privacy .dsh-dream_dshd-reflection,.dsh-dream_dshd-privacy .dsh-dream_dshd-lessons {\n  filter: blur(4px);\n}\n\n.dsh-dream_dshd-privacy .dsh-dream_dshd-dream.dsh-dream_dshd-peek .dsh-dream_dshd-reflection,.dsh-dream_dshd-privacy .dsh-dream_dshd-dream.dsh-dream_dshd-peek .dsh-dream_dshd-lessons {\n  filter: none;\n}\n\n.dsh-dream_dshd-alert {\n  display: flex;\n  gap: 8px;\n  align-items: center;\n  border-radius: 10px;\n  padding: 8px 10px;\n  font-size: 12px;\n  margin-bottom: 10px;\n  background: color-mix(in srgb,var(--dsw-alias-label-primary) 5%,transparent);\n}\n\n.dsh-dream_dshd-alert.dsh-dream_error {\n  background: color-mix(in srgb,var(--dsw-alias-state-error-primary) 12%,transparent);\n  color: var(--dsw-alias-state-error-primary);\n}\n\n.dsh-dream_dshd-empty {\n  padding: 28px 18px;\n  text-align: center;\n  color: var(--dsw-alias-label-tertiary);\n}\n\n.dsh-dream_dshd-empty svg {\n  color: var(--dsw-alias-label-tertiary);\n  opacity: .75;\n}\n\n.dsh-dream_dshd-empty h3 {\n  color: var(--dsw-alias-label-primary);\n  margin: 8px 0 6px;\n  font-size: 15px;\n}\n\n.dsh-dream_dshd-empty p {\n  margin: 0 auto 10px;\n  max-width: 430px;\n  font-size: 12px;\n}\n\n.dsh-dream_dshd-chips {\n  display: flex;\n  gap: 6px;\n  justify-content: center;\n  flex-wrap: wrap;\n}\n\n.dsh-dream_dshd-chip {\n  font-family: ui-monospace,Consolas,monospace;\n  font-size: 11px;\n  background: var(--dsw-alias-bg-layer-2);\n  border-radius: 999px;\n  padding: 2px 9px;\n  color: var(--dsw-alias-label-tertiary);\n}\n\n.dsh-dream_dshd-skel {\n  height: 58px;\n  border-radius: 12px;\n  margin-bottom: 8px;\n  background: linear-gradient(90deg,var(--dsw-alias-bg-layer-2) 25%,color-mix(in srgb,var(--dsw-alias-label-primary) 10%,transparent) 37%,var(--dsw-alias-bg-layer-2) 63%);\n  background-size: 400% 100%;\n  animation: dsh-dream_dshd-shimmer 1.4s ease infinite;\n}\n\n@keyframes dsh-dream_dshd-shimmer {\n  0% {\n    background-position: 100% 0;\n  }\n  100% {\n    background-position: 0 0;\n  }\n}\n\n.dsh-dream_dshd-footer {\n  margin-top: 12px;\n  display: flex;\n  align-items: center;\n  gap: 8px;\n  justify-content: space-between;\n  color: var(--dsw-alias-label-tertiary);\n  font-size: 11px;\n  flex-wrap: wrap;\n}\n\n.dsh-dream_dshd-krows {\n  display: flex;\n  flex-direction: column;\n  gap: 7px;\n}\n\n.dsh-dream_dshd-khead {\n  display: flex;\n  align-items: baseline;\n  justify-content: space-between;\n  gap: 8px;\n  margin-bottom: 10px;\n}\n\n.dsh-dream_dshd-kcard h4 { font-size: 14px; font-weight: 650; }\n.dsh-dream_dshd-kempty { padding: 18px 4px; text-align: center; color: var(--dsw-alias-label-secondary); }\n.dsh-dream_dshd-kbadge { font-size: 11px; border-radius: 999px; padding: 1px 7px; background: var(--dsw-alias-bg-layer-2); }\n.dsh-dream_dshd-klast { color: var(--dsw-alias-label-secondary); font-size: 11px; }\n\n.dsh-dream_dshd-kempty-title {\n  color: var(--dsw-alias-label-primary);\n  font-weight: 600;\n  font-size: 13px;\n  margin-bottom: 4px;\n}\n\n.dsh-dream_dshd-kempty-body {\n  margin: 0 auto 5px;\n  max-width: 460px;\n  font-size: 12px;\n}\n\n.dsh-dream_dshd-kcmd {\n  display: flex;\n  gap: 6px;\n  flex-wrap: wrap;\n  margin-top: 6px;\n}\n\n.dsh-dream_dshd-reviewform {\n  margin-top: 8px;\n  padding: 9px;\n  border: 0.5px solid var(--dsw-alias-border-l2);\n  border-radius: 8px;\n}\n\n.dsh-dream_dshd-reviewform label {\n  display: flex;\n  flex-direction: column;\n  gap: 3px;\n  margin-bottom: 6px;\n  font-size: 12px;\n}\n\n.dsh-dream_dshd-diff {\n  white-space: pre-wrap;\n  overflow-wrap: anywhere;\n  max-height: 320px;\n  overflow: auto;\n  padding: 10px;\n  border-radius: 6px;\n  font: 11px/1.65 ui-monospace,Consolas,monospace;\n  background: var(--dsw-alias-bg-layer-2);\n  color: inherit;\n}\n\n.dsh-dream_dshd-feedback {\n  margin-top: 8px;\n  font-size: 12px;\n}\n\n.dsh-dream_dshd-feedback summary {\n  cursor: pointer;\n}\n\n.dsh-dream_dshd-feedback label {\n  display: flex;\n  flex-direction: column;\n  gap: 4px;\n  margin-top: 8px;\n}\n\n.dsh-dream_dshd-feedback textarea {\n  font: inherit;\n  color: inherit;\n  background: var(--dsw-alias-bg-layer-1);\n  border: 0.5px solid var(--dsw-alias-border-l2);\n  border-radius: 6px;\n  padding: 6px;\n  max-width: 100%;\n  box-sizing: border-box;\n}\n\n.dsh-dream_dshd-reviewform {\n  min-width: 0;\n}\n\n.dsh-dream_dshd-privacy .dsh-dream_dshd-feedback,.dsh-dream_dshd-privacy .dsh-dream_dshd-diff {\n  filter: blur(4px);\n}\n\n.dsh-dream_dshd-reviewform select,.dsh-dream_dshd-reviewform textarea {\n  background: var(--dsw-alias-bg-layer-1);\n  color: inherit;\n  border: 0.5px solid var(--dsw-alias-border-l2);\n  border-radius: 6px;\n  max-width: 100%;\n  padding: 4px;\n  font: inherit;\n  box-sizing: border-box;\n}\n\n.dsh-dream_dshd-copywrap {\n  display: inline-flex;\n  flex-direction: column;\n  gap: 3px;\n  max-width: 100%;\n  align-items: flex-start;\n}\n\n.dsh-dream_dshd-cmd {\n  display: block;\n  font-family: ui-monospace,Consolas,monospace;\n  font-size: 11px;\n  white-space: pre-wrap;\n  word-break: break-all;\n  background: var(--dsw-alias-bg-layer-2);\n  border-radius: 6px;\n  padding: 4px 7px;\n  user-select: text;\n  cursor: text;\n  color: inherit;\n  max-width: 100%;\n}\n\n.dsh-dream_dshd-bridge {\n  background: var(--dsw-alias-bg-layer-1);\n  border-radius: 9px;\n  padding: 8px 10px;\n  border-left: 3px solid var(--dsw-alias-border-l2);\n  min-width: 0;\n}\n\n.dsh-dream_dshd-bridge-head {\n  display: flex;\n  align-items: baseline;\n  gap: 8px;\n  flex-wrap: wrap;\n}\n\n.dsh-dream_dshd-bridge-target {\n  font-size: 12px;\n  font-weight: 600;\n  word-break: break-all;\n  min-width: 0;\n}\n\n.dsh-dream_dshd-bridge-meta {\n  display: flex;\n  gap: 10px;\n  flex-wrap: wrap;\n  font-size: 11px;\n  color: var(--dsw-alias-label-tertiary);\n  margin-top: 3px;\n}\n\n.dsh-dream_dshd-rollback-ok { color: var(--dsw-alias-state-success-primary); }\n.dsh-dream_dshd-rollback-no { color: var(--dsw-alias-label-tertiary); }\n\n@container dream (max-width: 620px) {\n  .dsh-dream_dshd-two {\n    grid-template-columns: 1fr;\n  }\n  .dsh-dream_dshd-toolbar .dsh-dream_dshd-hint {\n    display: none;\n  }\n}\n/* Layout, surfaces and motion adapted for DeepSeek Harness (>=0.2.2-rc.3) & 5-style unified design system. */\n.dsh-dream_app-shell {\n  --dream-hairline: var(--dsh-control-border-width, 0.5px) solid var(--dsw-alias-border-l2, #e2e7f0);\n  --dream-accent: var(--dsw-alias-state-business-primary, #4176e6);\n  --dream-canvas: var(--dsw-alias-bg-base, #ffffff);\n  --dream-paper: var(--dsw-alias-bg-base, #ffffff);\n  --dream-layer-1: var(--dsw-alias-bg-layer-1, #f7f9fc);\n  --dream-layer-2: var(--dsw-alias-bg-layer-2, #eef2f7);\n  --dream-ink: var(--dsw-alias-label-primary, #1b2230);\n  --dream-secondary: var(--dsw-alias-label-secondary, #5b667a);\n  --dream-tertiary: var(--dsw-alias-label-tertiary, #7a8599);\n  --dream-rail-width: 236px;\n  --dream-inset: 0px;\n  --dream-row-radius: var(--dsw-radius-sm, 8px);\n  --dream-card-radius: var(--dsw-radius-md, 12px);\n  --dsh-ease-spring: cubic-bezier(0.22, 1, 0.36, 1);\n  --dsh-ease-out: cubic-bezier(0.16, 1, 0.3, 1);\n  display: flex;\n  flex-direction: column;\n  min-width: 0;\n  min-height: 540px;\n  padding: var(--dream-inset);\n  background: var(--dream-canvas);\n  color: var(--dream-ink);\n  font: 13px/1.5 var(--dsh-font-body, var(--ds-font-family-ui, system-ui, -apple-system, \"Segoe UI\", \"Microsoft YaHei\", sans-serif));\n  container: dream / inline-size;\n  isolation: isolate;\n}\n\n.dsh-dream_app-shell[data-main='true'] {\n  height: 100%;\n  min-height: 0;\n  padding-block-start: calc(var(--dsh-frame-top-clearance, 0px) + var(--dream-inset));\n  padding-inline-start: calc(var(--dsh-frame-leading-clearance, 0px) + var(--dream-inset));\n  overflow: hidden;\n}\n\n.dsh-dream_app-shell[data-main='false'] {\n  padding: 0;\n  border: var(--dream-hairline);\n  border-radius: var(--dream-card-radius);\n  overflow: clip;\n}\n\n.dsh-dream_app-shell *, .dsh-dream_app-shell *::before, .dsh-dream_app-shell *::after,\n.dsh-dream_modalSurface *, .dsh-dream_modalSurface *::before, .dsh-dream_modalSurface *::after { box-sizing: border-box; }\n\n.dsh-dream_app-shell :is(h1, h2, h3, h4, p),\n.dsh-dream_modalSurface :is(h2, h3, p) { margin: 0; }\n\n.dsh-dream_app-shell :is(select, textarea), .dsh-dream_modalSurface :is(select, textarea) {\n  max-width: 100%;\n  min-width: 0;\n  padding: 6px 8px;\n  border: var(--dream-hairline);\n  border-radius: var(--dream-row-radius);\n  background: var(--dream-layer-1);\n  color: var(--dream-ink);\n  font: inherit;\n}\n\n.dsh-dream_app-shell textarea, .dsh-dream_modalSurface textarea { resize: vertical; }\n.dsh-dream_app-shell input[type='checkbox'], .dsh-dream_modalSurface input[type='checkbox'] { accent-color: var(--dream-accent); }\n.dsh-dream_app-shell :focus-visible, .dsh-dream_modalSurface :focus-visible {\n  outline: 2px solid var(--dream-accent);\n  outline-offset: -2px;\n}\n\n.dsh-dream_topbar {\n  min-height: 48px;\n  flex-shrink: 0;\n  display: flex;\n  align-items: center;\n  justify-content: space-between;\n  flex-wrap: nowrap;\n  gap: 8px 10px;\n  padding: 6px 14px;\n}\n\n.dsh-dream_topbar-left, .dsh-dream_topbar-right {\n  display: flex;\n  align-items: center;\n  flex-wrap: nowrap;\n  gap: 8px 10px;\n  min-width: 0;\n}\n.dsh-dream_plugin-brand { display: flex; align-items: center; gap: 8px; white-space: nowrap; }\n.dsh-dream_plugin-brand h1 { font-size: 13.5px; font-weight: 650; }\n.dsh-dream_plugin-badge {\n  width: 24px;\n  height: 24px;\n  border-radius: var(--dsw-radius-xs, 7px);\n  background: var(--dsw-alias-button-primary-fill, #4176e6);\n  color: var(--dsw-alias-button-primary-ink, #ffffff);\n  display: inline-flex;\n  align-items: center;\n  justify-content: center;\n}\n\n.dsh-dream_tabsWrap {\n  position: relative;\n  display: inline-flex;\n  align-items: center;\n  min-width: 0;\n  max-width: 100%;\n}\n.dsh-dream_tabsWrap > .dsh-tab-indicator {\n  pointer-events: none;\n}\n.dsh-dream_topbar .dsh-dream_view-tabs {\n  position: relative;\n  z-index: 1;\n  min-width: 0;\n  background: var(--dream-layer-2);\n  border-radius: calc(var(--dream-row-radius) + 1px);\n}\n.dsh-dream_view-tabs [role='tab'] { padding-inline: 8px; font-size: 12px; }\n.dsh-dream_tabLabel { display: inline-flex; align-items: center; gap: 5px; min-width: 0; }\n.dsh-dream_tabCount { color: var(--dream-secondary); font-size: 11px; font-variant-numeric: tabular-nums; }\n.dsh-dream_topbar-right { gap: 6px; }\n\n.dsh-dream_control { flex-shrink: 0; max-width: 100%; }\n.dsh-dream_app-shell .dsh-dream_control.dsh-dream_primary, .dsh-dream_modalSurface .dsh-dream_control.dsh-dream_primary {\n  background: var(--dsw-alias-button-primary-fill, #4176e6);\n  border-color: var(--dsw-alias-button-primary-fill, #4176e6);\n  color: var(--dsw-alias-button-primary-ink, #ffffff);\n}\n.dsh-dream_control.dsh-dream_toolbarActive {\n  background: var(--dsw-alias-interactive-bg-active, rgba(65, 118, 230, 0.12));\n  color: var(--dream-ink);\n  border-color: color-mix(in oklab, var(--dream-accent) 36%, var(--dsw-alias-border-l2, #e2e7f0));\n}\n.dsh-dream_control.dsh-dream_iconButton { padding-inline: 7px; min-width: 28px; }\n.dsh-dream_danger { color: var(--dsw-alias-state-error-primary, #b9382c); }\n.dsh-dream_checkbox { min-width: 0; color: inherit; }\n.dsh-dream_segmented { width: 100%; min-width: 0; }\n.dsh-dream_settingsPage .dsh-dream_segmented [role='tablist'] { flex-wrap: wrap; gap: 4px; }\n.dsh-dream_choiceWrap { width: 100%; min-width: 0; }\n.dsh-dream_choiceButton { width: 100%; justify-content: space-between; text-align: start; background: var(--dream-paper); }\n.dsh-dream_choiceLabel { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }\n\n.dsh-dream_actions { display: flex; align-items: center; flex-wrap: wrap; gap: 6px; min-width: 0; }\n.dsh-dream_muted { color: var(--dream-secondary); font-size: 12px; }\n.dsh-dream_status { display: flex; align-items: flex-start; gap: 8px; padding: 8px 12px; color: var(--dream-secondary); }\n.dsh-dream_status svg { flex: none; margin-block-start: 2px; }\n.dsh-dream_statusError { color: var(--dsw-alias-state-error-primary, #b9382c); }\n.dsh-dream_pageStatus { flex: none; border-block-end: var(--dream-hairline); background: var(--dream-layer-1); }\n\n.dsh-dream_workspace-body {\n  flex: 1 1 auto;\n  min-width: 0;\n  min-height: 0;\n  display: flex;\n  flex-direction: column;\n  overflow: hidden auto;\n  overscroll-behavior: contain;\n}\n\n.dsh-dream_app-shell > [data-plugin-update-footer=\"@stardustlc/dsh-dream\"] {\n  flex: none;\n  min-height: 32px;\n  padding: 6px 14px;\n  border-block-start: var(--dream-hairline);\n  background: var(--dream-layer-1);\n}\n\n.dsh-dream_app-shell[data-dream-transition='true'] { view-transition-name: dsh-dream-workbench; }\n::view-transition-old(dsh-dream-workbench) { animation: 160ms ease-in dsh-dream_dreamFadeOut both; }\n::view-transition-new(dsh-dream-workbench) { animation: 200ms ease-out dsh-dream_dreamFadeIn both; }\n@keyframes dsh-dream_dreamFadeOut { to { opacity: 0; } }\n@keyframes dsh-dream_dreamFadeIn { from { opacity: 0; } }\n\n/* Pending review workbench */\n.dsh-dream_workbench-grid {\n  --list-width: 340px;\n  --rail-space: 0px;\n  --pane-gap: 0px;\n  --gap-count: 2;\n  --handle-width: 9px;\n  display: flex;\n  width: 100%;\n  min-height: 420px;\n  flex: 1 1 auto;\n  gap: var(--pane-gap);\n}\n\n.dsh-dream_app-shell[data-main='true'] .dsh-dream_workbench-grid { min-height: 0; }\n.dsh-dream_workbench-grid[data-review='true'] { --rail-space: var(--dream-rail-width); --gap-count: 3; }\n.dsh-dream_pane-rail, .dsh-dream_pane-list, .dsh-dream_pane-inspector {\n  display: flex;\n  flex-direction: column;\n  min-width: 0;\n  min-height: 0;\n}\n.dsh-dream_pane-rail {\n  flex-shrink: 0;\n  border-inline-end: var(--dream-hairline);\n  width: var(--dream-rail-width);\n  background: var(--dream-layer-1);\n}\n.dsh-dream_pane-list {\n  flex-shrink: 0;\n  width: min(var(--dsh-split-size, var(--list-width, 340px)), max(224px, calc(100% - var(--rail-space) - var(--handle-width) - var(--pane-gap) * var(--gap-count) - 300px)));\n  background: var(--dream-paper);\n}\n.dsh-dream_pane-inspector { flex: 1 1 auto; background: var(--dream-paper); }\n.dsh-dream_app-shell:is([data-dsh-style='glass'], [data-dsh-style='claude'], [data-dsh-style='blueprint'], [data-dsh-style='risograph'], [data-dsh-style='songhui'], [data-dsh-style='frutiger']) :is(.dsh-dream_pane-list, .dsh-dream_pane-inspector) {\n  background: transparent;\n}\n\n.dsh-dream_rail-scroll { flex: 1 1 auto; overflow: auto; overscroll-behavior: contain; padding: 12px 10px; }\n.dsh-dream_rail-footer {\n  display: flex;\n  flex-wrap: wrap;\n  align-items: center;\n  gap: 5px 8px;\n  padding: 8px 10px;\n  border-block-start: var(--dream-hairline);\n  color: var(--dream-secondary);\n  font-size: 11px;\n}\n.dsh-dream_rail-footer span { white-space: nowrap; }\n.dsh-dream_app-shell kbd, .dsh-dream_modalSurface kbd {\n  padding: 1px 4px;\n  border: var(--dsh-control-border-width, 0.5px) solid var(--dsw-alias-border-l2, #e2e7f0);\n  border-radius: var(--dsw-radius-xs, 4px);\n  background: var(--dream-layer-2);\n  color: var(--dream-ink);\n  font: 10px/1.35 var(--dsh-font-mono, var(--ds-font-family-code, ui-monospace, monospace));\n}\n\n.dsh-dream_control-card {\n  display: flex;\n  flex-direction: column;\n  gap: 8px;\n  background: var(--dream-paper);\n  border: var(--dream-hairline);\n  border-radius: var(--dream-card-radius);\n  padding: 10px 11px;\n  margin-block-end: 12px;\n}\n.dsh-dream_control-card .dsh-dream_muted { color: var(--dream-tertiary); font-size: 11px; line-height: 1.4; }\n.dsh-dream_scopeFilters .dsh-dream_section-head {\n  font-size: 11px;\n  font-weight: 600;\n  color: var(--dream-tertiary);\n  text-transform: uppercase;\n  letter-spacing: 0.04em;\n  padding: 6px 8px 4px;\n}\n.dsh-dream_scopeFilters .dsh-dream_nav-item {\n  width: 100%;\n  height: auto;\n  min-height: 28px;\n  border: 0;\n  border-radius: var(--dream-row-radius);\n  padding: 6px 8px;\n  justify-content: space-between;\n  color: var(--dream-secondary);\n  font-size: 12.5px;\n  font-weight: 500;\n  text-align: start;\n  overflow-wrap: anywhere;\n}\n.dsh-dream_scopeFilters .dsh-dream_nav-item[aria-pressed='true'] {\n  background: var(--dsw-alias-interactive-bg-active, rgba(65, 118, 230, 0.12));\n  color: var(--dream-ink);\n}\n.dsh-dream_count-pill { color: var(--dream-tertiary); font: 10.5px var(--dsh-font-mono, var(--ds-font-family-code, ui-monospace, monospace)); }\n.dsh-dream_mobileScope { display: none; }\n\n.dsh-dream_list-toolbar, .dsh-dream_listFooter {\n  display: flex;\n  align-items: center;\n  justify-content: space-between;\n  gap: 8px;\n  flex-shrink: 0;\n}\n.dsh-dream_list-toolbar { min-height: 42px; padding: 7px 12px; border-block-end: var(--dream-hairline); }\n.dsh-dream_search { width: 100%; min-width: 0; }\n.dsh-dream_list-toolbar .dsh-dream_search { flex: 1; }\n.dsh-dream_search input::placeholder { color: var(--dream-secondary); }\n.dsh-dream_listFooter { border-block-start: var(--dream-hairline); padding: 8px 12px; color: var(--dream-secondary); font-size: 11px; }\n.dsh-dream_scopePicker { display: grid; gap: 6px; min-width: 0; color: var(--dream-secondary); font-size: 12px; }\n.dsh-dream_scopePicker select { width: 100%; }\n.dsh-dream_acceptedFilters { display: grid; gap: 10px; padding: 10px 12px; border-block-end: var(--dream-hairline); background: var(--dream-layer-1); }\n.dsh-dream_checkLabel { display: flex; align-items: flex-start; gap: 8px; }\n.dsh-dream_checkLabel input { flex: none; margin: 3px 0 0; }\n\n.dsh-dream_candidate-scroll { flex: 1 1 auto; min-height: 0; overflow: hidden auto; overscroll-behavior: contain; }\n.dsh-dream_skeletonWrap { display: grid; gap: 8px; padding: 12px; }\n.dsh-dream_skeletonInspector { display: grid; gap: 12px; padding: 18px 22px; }\n.dsh-dream_cand-row { display: flex; align-items: center; border-block-end: var(--dream-hairline); }\n.dsh-dream_app-shell[data-dsh-style='cream'] .dsh-dream_cand-row { border-block-end: 1px dashed var(--dsw-alias-border-l2); }\n.dsh-dream_cand-row[data-active='true'] { background: var(--dsw-alias-interactive-bg-active, rgba(65, 118, 230, 0.11)); }\n.dsh-dream_cand-row[data-active='true']::before {\n  content: '';\n  position: absolute;\n  inset: 6px auto 6px 0;\n  width: 2.5px;\n  border-radius: 0 2px 2px 0;\n  background: var(--dream-accent);\n  pointer-events: none;\n}\n.dsh-dream_candidateButton {\n  flex: 1;\n  min-width: 0;\n  display: grid;\n  align-content: start;\n  gap: 3px;\n  padding: 11px 6px 11px 13px;\n  border: 0;\n  border-radius: inherit;\n  background: transparent;\n  color: inherit;\n  font: inherit;\n  text-align: start;\n  cursor: pointer;\n}\n.dsh-dream_candTitleLine { display: flex; align-items: baseline; gap: 5px; min-width: 0; }\n.dsh-dream_cand-title { font-size: 12.5px; font-weight: 600; color: var(--dream-ink); overflow-wrap: anywhere; }\n.dsh-dream_rowActions { padding: 8px 8px 8px 2px; }\n.dsh-dream_cand-summary {\n  font-size: 11.5px;\n  color: var(--dream-secondary);\n  display: -webkit-box;\n  -webkit-line-clamp: 2;\n  -webkit-box-orient: vertical;\n  overflow: hidden;\n  overflow-wrap: anywhere;\n}\n.dsh-dream_cand-tags { display: flex; align-items: center; gap: 5px; flex-wrap: wrap; min-width: 0; margin-block-start: 3px; }\n.dsh-dream_scopeBadge { min-width: 0; max-width: 100%; }\n.dsh-dream_scopeCaption { min-width: 0; max-width: 100%; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }\n.dsh-dream_batchCheckbox { flex: none; margin: 13px 0 0 11px; }\n.dsh-dream_batch { display: grid; gap: 8px; padding: 10px 12px; border-block-end: var(--dream-hairline); background: var(--dream-layer-1); }\n.dsh-dream_more { margin: 12px; }\n\n.dsh-dream_pane-resizer {\n  position: relative;\n  width: var(--handle-width);\n  flex-shrink: 0;\n}\n\n.dsh-dream_inspectorContent { display: flex; flex-direction: column; flex: 1 1 auto; min-height: 0; overflow-wrap: anywhere; }\n.dsh-dream_inspector-toolbar {\n  display: flex;\n  flex-wrap: wrap;\n  align-items: center;\n  justify-content: space-between;\n  flex: none;\n  gap: 8px;\n  padding: 6px 18px;\n  min-height: 42px;\n  border-block-end: var(--dream-hairline);\n}\n.dsh-dream_meta { display: flex; flex-wrap: wrap; align-items: center; gap: 5px 8px; min-width: 0; max-width: 100%; color: var(--dream-secondary); font-size: 11px; }\n.dsh-dream_inspector-scroll { flex: 1 1 auto; min-height: 0; overflow: auto; overscroll-behavior: contain; padding: 18px 22px 32px; }\n.dsh-dream_inspector-scroll > .dsh-dream_checkLabel, .dsh-dream_inspector-scroll > [role='alert'] { margin-block-end: 12px; }\n.dsh-dream_verify-block .dsh-dream_inspectorTitle { font-size: 17px; line-height: 1.35; font-weight: 600; }\n.dsh-dream_back { display: none; }\n\n.dsh-dream_review-stepper {\n  display: flex;\n  flex-wrap: wrap;\n  align-items: center;\n  gap: 6px;\n  margin-block-end: 14px;\n  padding: 8px 12px;\n  border-radius: var(--dream-row-radius);\n  background: var(--dream-layer-1);\n  border: var(--dream-hairline);\n  font-size: 11.5px;\n}\n.dsh-dream_step-chip { display: inline-flex; align-items: center; gap: 5px; color: var(--dream-secondary); font-weight: 500; }\n.dsh-dream_step-chip.dsh-dream_stepDone { color: color-mix(in oklab, var(--dsw-alias-state-success-primary, #1f7a4c) 62%, var(--dream-ink)); }\n.dsh-dream_step-sep { color: var(--dream-tertiary); font-family: var(--dsh-font-mono, var(--ds-font-family-code, ui-monospace, monospace)); }\n.dsh-dream_diffShortcut { margin-inline-start: auto; }\n\n.dsh-dream_verify-block, .dsh-dream_settings-card {\n  display: grid;\n  align-content: start;\n  gap: 8px;\n  min-width: 0;\n  background: var(--dream-layer-1);\n  border: var(--dream-hairline);\n  border-radius: var(--dream-card-radius);\n  padding: 13px 15px;\n}\n.dsh-dream_verify-block { margin-block-end: 12px; }\n.dsh-dream_verify-block .dsh-dream_verify-head { font-size: 11.5px; font-weight: 600; color: var(--dream-secondary); }\n.dsh-dream_evidence { min-width: 0; }\n.dsh-dream_evidence + .dsh-dream_evidence { padding-block-start: 8px; border-block-start: var(--dream-hairline); }\n.dsh-dream_evidence-quote {\n  margin: 0 0 6px;\n  padding: 9px 12px;\n  border-inline-start: 2.5px solid var(--dream-accent);\n  border-radius: 0 var(--dream-row-radius) var(--dream-row-radius) 0;\n  background: var(--dream-paper);\n  color: var(--dream-secondary);\n  font: 11.5px/1.7 var(--dsh-font-mono, var(--ds-font-family-code, ui-monospace, monospace));\n  white-space: pre-wrap;\n  overflow-wrap: anywhere;\n}\n:is(.dsh-dream_evidence, .dsh-dream_evidenceSummary) summary { cursor: pointer; color: var(--dream-secondary); font-size: 12px; }\n.dsh-dream_evidence details[open] summary { margin-block-end: 4px; }\n.dsh-dream_sourceHash { display: block; overflow-wrap: anywhere; color: var(--dream-tertiary); font-size: 11px; }\n.dsh-dream_app-shell .dsh-dream_redacted-token {\n  display: inline-flex;\n  gap: 4px;\n  max-width: 100%;\n  height: auto;\n  vertical-align: baseline;\n  padding: 0 5px;\n  border-radius: var(--dsw-radius-xs, 4px);\n  background: color-mix(in oklab, var(--dsw-alias-state-warn-primary, #b45309) 13%, transparent);\n  color: var(--dsw-alias-state-warn-label, #8c4b08);\n  font: inherit;\n  font-weight: 600;\n  user-select: none;\n  transition: transform 0.16s var(--dsh-ease-spring), background 0.16s ease;\n}\n.dsh-dream_app-shell .dsh-dream_redacted-token[data-revealed='true'] {\n  background: color-mix(in oklab, var(--dsw-alias-state-success-primary, #1f7a4c) 14%, transparent);\n  color: color-mix(in oklab, var(--dsw-alias-state-success-primary, #1f7a4c) 62%, var(--dream-ink));\n}\n\n.dsh-dream_scopeFacts { display: grid; grid-template-columns: minmax(0, max-content) minmax(0, 1fr); gap: 5px 13px; margin: 0; }\n.dsh-dream_scopeFacts dt { color: var(--dream-secondary); }\n.dsh-dream_scopeFacts dd { margin: 0; }\n.dsh-dream_masked .dsh-dream_privateText, .dsh-dream_maskedRow .dsh-dream_candidateButton { filter: blur(5px); user-select: none; }\n.dsh-dream_empty { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 10px; min-height: 170px; margin: auto; padding: 20px 12px; text-align: center; overflow-wrap: anywhere; }\n.dsh-dream_empty svg { color: var(--dream-tertiary); }\n.dsh-dream_empty h2 { font-size: 15px; font-weight: 600; }\n.dsh-dream_empty > .dsh-dream_muted { max-width: 420px; line-height: 1.55; }\n.dsh-dream_emptyStack { display: flex; flex-direction: column; align-items: center; gap: 8px; margin-block-start: 4px; max-width: 100%; }\n.dsh-dream_emptyPrompts { display: flex; flex-wrap: wrap; align-items: center; justify-content: center; gap: 6px; max-width: 100%; }\n.dsh-dream_inspectorEmptyWrap { display: flex; flex-direction: column; justify-content: center; gap: 14px; flex: 1 1 auto; max-width: 560px; width: 100%; margin-inline: auto; padding: 20px 18px; }\n\n.dsh-dream_copyPromptWrap {\n  position: relative;\n  display: inline-flex;\n  flex-wrap: wrap;\n  align-items: center;\n  gap: 5px;\n  max-width: 100%;\n}\n.dsh-dream_copyBubble {\n  font-size: 11px;\n  line-height: 1.3;\n  color: var(--dream-secondary);\n  opacity: 0;\n  pointer-events: none;\n  max-inline-size: 0;\n  overflow: clip;\n  white-space: nowrap;\n  transition: opacity 0.16s ease;\n}\n.dsh-dream_copyBubble[data-visible='true'] {\n  opacity: 1;\n  max-inline-size: 280px;\n  padding: 2px 6px;\n  border-radius: var(--dsw-radius-xs, 4px);\n  background: var(--dream-layer-2);\n}\n\n.dsh-dream_tourTrigger {\n  font-weight: 600;\n}\n.dsh-dream_tourLayer {\n  --tour-accent: var(--dsw-alias-state-business-primary, #4176e6);\n  --tour-bg: var(--dsw-alias-bg-overlay, var(--dsw-alias-bg-base, #ffffff));\n  --tour-ink: var(--dsw-alias-label-primary, #1b2230);\n  --tour-muted: var(--dsw-alias-label-secondary, #5b667a);\n  --tour-border: var(--dsw-alias-border-l2, #d8e0ec);\n  --tour-radius: var(--dsw-radius-md, 12px);\n  position: fixed;\n  inset: 0;\n  width: 100%;\n  height: 100%;\n  max-width: none;\n  max-height: none;\n  margin: 0;\n  padding: 0;\n  border: 0;\n  background: transparent;\n  overflow: visible;\n  pointer-events: none;\n  z-index: 2147483000;\n  color: var(--tour-ink);\n  font: 13px/1.55 var(--dsh-font-body, var(--ds-font-family-ui, system-ui, -apple-system, \"Segoe UI\", \"Microsoft YaHei\", sans-serif));\n}\n.dsh-dream_tourLayer[popover]:is(:popover-open, .\\:popover-open) {\n  display: block;\n}\n.dsh-dream_tourLayer[data-dsh-style='pixel8bit'] {\n  --tour-radius: 0px;\n}\n.dsh-dream_tourSpotlight {\n  position: fixed;\n  pointer-events: none;\n  border-radius: calc(var(--tour-radius) * 0.75 + 2px);\n  box-shadow:\n    0 0 0 2px var(--tour-accent),\n    0 0 0 5px color-mix(in oklab, var(--tour-accent) 22%, transparent),\n    0 0 0 9999px rgba(15, 23, 42, 0.26);\n}\n.dsh-dream_tourBackdropFallback {\n  position: fixed;\n  inset: 0;\n  pointer-events: none;\n  background: rgba(15, 23, 42, 0.24);\n}\n.dsh-dream_tourCard {\n  position: fixed;\n  inset: auto;\n  margin: 0;\n  width: min(324px, calc(100vw - 24px));\n  max-block-size: calc(100dvh - 24px);\n  padding: 13px 15px 12px;\n  border: 1px solid var(--tour-border);\n  border-radius: var(--tour-radius);\n  background: var(--tour-bg);\n  color: var(--tour-ink);\n  box-shadow: var(--dsw-elevation-prominent, 0 16px 40px rgba(15, 23, 42, 0.18));\n  pointer-events: auto;\n  display: flex;\n  flex-direction: column;\n  gap: 8px;\n}\n.dsh-dream_tourLayer[data-dsh-style='pixel8bit'] .dsh-dream_tourCard {\n  border-width: 2px;\n  box-shadow: 4px 4px 0px #1e2826;\n}\n.dsh-dream_tourArrow {\n  position: absolute;\n  width: 10px;\n  height: 10px;\n  background: var(--tour-bg);\n  transform: rotate(45deg);\n  pointer-events: none;\n}\n.dsh-dream_tourCard[data-side='bottom'] > .dsh-dream_tourArrow {\n  top: -6px;\n  left: calc(var(--arrow-x, 28px) - 5px);\n  border-top: 1px solid var(--tour-border);\n  border-left: 1px solid var(--tour-border);\n}\n.dsh-dream_tourCard[data-side='top'] > .dsh-dream_tourArrow {\n  bottom: -6px;\n  left: calc(var(--arrow-x, 28px) - 5px);\n  border-bottom: 1px solid var(--tour-border);\n  border-right: 1px solid var(--tour-border);\n}\n.dsh-dream_tourCard[data-side='right'] > .dsh-dream_tourArrow {\n  left: -6px;\n  top: calc(var(--arrow-y, 24px) - 5px);\n  border-bottom: 1px solid var(--tour-border);\n  border-left: 1px solid var(--tour-border);\n}\n.dsh-dream_tourCard[data-side='left'] > .dsh-dream_tourArrow {\n  right: -6px;\n  top: calc(var(--arrow-y, 24px) - 5px);\n  border-top: 1px solid var(--tour-border);\n  border-right: 1px solid var(--tour-border);\n}\n.dsh-dream_tourCard[data-side='center'] > .dsh-dream_tourArrow {\n  display: none;\n}\n.dsh-dream_tourHead {\n  display: flex;\n  align-items: center;\n  justify-content: space-between;\n  gap: 8px;\n}\n.dsh-dream_tourStepMeta {\n  display: inline-flex;\n  align-items: center;\n  gap: 8px;\n}\n.dsh-dream_tourStepBadge {\n  display: inline-flex;\n  align-items: center;\n  padding: 1px 7px;\n  border-radius: 999px;\n  font-size: 11px;\n  font-weight: 650;\n  font-variant-numeric: tabular-nums;\n  background: color-mix(in oklab, var(--tour-accent) 14%, transparent);\n  color: var(--tour-accent);\n}\n.dsh-dream_tourDots {\n  display: inline-flex;\n  align-items: center;\n  gap: 4px;\n}\n.dsh-dream_tourDot {\n  width: 6px;\n  height: 6px;\n  border-radius: 999px;\n  background: var(--tour-border);\n}\n.dsh-dream_tourDot[data-active='true'] {\n  width: 14px;\n  background: var(--tour-accent);\n}\n.dsh-dream_tourSkip {\n  min-block-size: 24px;\n  min-inline-size: 24px;\n  padding: 2px 6px;\n  border: 0;\n  border-radius: var(--dsw-radius-xs, 6px);\n  background: transparent;\n  color: var(--tour-muted);\n  font: inherit;\n  font-size: 11.5px;\n  cursor: pointer;\n}\n.dsh-dream_tourSkip:hover {\n  color: var(--tour-ink);\n  background: var(--dsw-alias-interactive-bg-hover, rgba(15, 23, 42, 0.05));\n}\n.dsh-dream_tourTitle {\n  margin: 0;\n  font-size: 14px;\n  line-height: 1.38;\n  font-weight: 650;\n}\n.dsh-dream_tourDesc {\n  margin: 0;\n  font-size: 12.5px;\n  line-height: 1.55;\n  color: var(--tour-muted);\n}\n.dsh-dream_tourInlineAction {\n  display: flex;\n  flex-wrap: wrap;\n  align-items: center;\n  gap: 6px;\n  padding-block-start: 2px;\n}\n.dsh-dream_tourFooter {\n  display: flex;\n  align-items: center;\n  justify-content: space-between;\n  gap: 8px;\n  margin-block-start: 2px;\n  padding-block-start: 8px;\n  border-block-start: var(--dsh-control-border-width, 0.5px) solid var(--tour-border);\n}\n.dsh-dream_tourNav {\n  display: inline-flex;\n  align-items: center;\n  gap: 6px;\n  margin-inline-start: auto;\n}\n@media (pointer: coarse) {\n  .dsh-dream_tourSkip {\n    min-block-size: 32px;\n    padding: 4px 10px;\n  }\n}\n@media (prefers-reduced-motion: no-preference) {\n  .dsh-dream_tourSpotlight {\n    transition:\n      top 0.24s var(--dsh-ease-spring),\n      left 0.24s var(--dsh-ease-spring),\n      width 0.24s var(--dsh-ease-spring),\n      height 0.24s var(--dsh-ease-spring);\n  }\n  .dsh-dream_tourCard {\n    transition: top 0.22s var(--dsh-ease-spring), left 0.22s var(--dsh-ease-spring);\n  }\n  .dsh-dream_tourDot {\n    transition: width 0.18s ease, background-color 0.18s ease;\n  }\n}\n.dsh-dream_switches { display: grid; gap: 8px; }\n.dsh-dream_switchRow { display: flex; gap: 8px; justify-content: space-between; align-items: center; font-size: 12px; font-weight: 500; }\n.dsh-dream_switchRow button { flex: none; }\n.dsh-dream_settingsPage, .dsh-dream_documentPage { width: min(100%, 880px); padding: 22px 20px 48px; margin-inline: auto; }\n.dsh-dream_settingsPage { display: grid; gap: 14px; align-content: start; }\n.dsh-dream_settingsPage .dsh-dream_settings-card { padding: 14px 16px; }\n.dsh-dream_settings-card h2 { font-size: 15px; font-weight: 650; }\n.dsh-dream_settingsWide { grid-column: 1 / -1; }\n.dsh-dream_settingsList { display: grid; gap: 6px; margin: 0; padding-inline-start: 18px; overflow-wrap: anywhere; }\n.dsh-dream_privacyStatus { flex: none; padding: 6px 12px; border-block-start: var(--dream-hairline); background: var(--dream-layer-1); }\n\n.dsh-dream_surface {\n  border: var(--dsh-control-border-width, 0.5px) solid var(--dsw-alias-border-l2, #e2e7f0);\n  border-radius: var(--dsw-radius-md, 12px);\n  background: var(--dsw-alias-bg-overlay, var(--dsw-alias-bg-base, #ffffff));\n  box-shadow: var(--dsw-elevation-prominent, 0 14px 36px rgba(15, 23, 42, 0.16));\n}\n.dsh-dream_modal.dsh-dream_modal {\n  width: min(620px, 100%);\n  max-height: calc(100dvh - 32px);\n  padding: 0;\n  border: 0;\n  background: transparent;\n  box-shadow: none;\n  overflow: visible;\n}\n.dsh-dream_modalFrame {\n  display: flex;\n  flex-direction: column;\n  width: 100%;\n  max-height: inherit;\n  min-height: 0;\n}\n.dsh-dream_modalSurface {\n  display: flex;\n  flex-direction: column;\n  width: 100%;\n  max-height: inherit;\n  min-height: 0;\n  color: var(--dsw-alias-label-primary, #1b2230);\n  font: 13px/1.55 var(--dsh-font-body, var(--ds-font-family-ui, system-ui, sans-serif));\n  overflow: clip;\n}\n.dsh-dream_modalHeader { display: flex; align-items: center; justify-content: space-between; gap: 8px; flex: none; padding: 12px 16px; border-block-end: var(--dsh-control-border-width, 0.5px) solid var(--dsw-alias-border-l2, #e2e7f0); }\n.dsh-dream_modalHeader h2 { font-size: 15px; font-weight: 650; }\n.dsh-dream_modalBody { display: grid; gap: 12px; padding: 16px; overflow: auto; overscroll-behavior: contain; }\n.dsh-dream_diffMeta { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; justify-content: space-between; color: var(--dsw-alias-label-secondary, #5b667a); overflow-wrap: anywhere; }\n.dsh-dream_diffMeta label { display: flex; align-items: center; gap: 8px; }\n.dsh-dream_diffLine { display: block; white-space: pre-wrap; }\n.dsh-dream_diffAdd { background: color-mix(in oklab, var(--dsw-alias-state-success-primary, #1f7a4c) 15%, transparent); }\n.dsh-dream_diffRemove { background: color-mix(in oklab, var(--dsw-alias-state-error-primary, #b9382c) 14%, transparent); }\n.dsh-dream_commandList { display: grid; align-content: start; gap: 3px; max-height: min(54dvh, 440px); overflow: auto; overscroll-behavior: contain; }\n.dsh-dream_commandList .dsh-dream_command { width: 100%; justify-content: space-between; text-align: start; }\n.dsh-dream_command[aria-selected='true'] { background: var(--dsw-alias-interactive-bg-active, rgba(65, 118, 230, 0.12)); }\n\n/* Unified 5-style `[data-dsh-style]` refinements */\n.dsh-dream_app-shell[data-dsh-style='cream'] .dsh-dream_topbar {\n  background: linear-gradient(180deg, #fcfaf4, #f5f1e6);\n}\n.dsh-dream_app-shell[data-dsh-style='claude'] .dsh-dream_topbar {\n  background: linear-gradient(180deg, #faf9f4, #efece2);\n}\n.dsh-dream_app-shell[data-dsh-style='mint'] .dsh-dream_topbar {\n  background: linear-gradient(90deg, rgba(15, 118, 110, 0.05), rgba(2, 132, 199, 0.04));\n}\n.dsh-dream_app-shell[data-dsh-style='pixel8bit'] {\n  --dream-row-radius: 0px;\n  --dream-card-radius: 0px;\n}\n.dsh-dream_app-shell[data-dsh-style='pixel8bit'] .dsh-dream_cand-row[data-active='true']::before {\n  width: 4px;\n  border-radius: 0;\n  background: #d95b43;\n}\n\n/* Staggered entrance, exit and pointer spotlight */\n@keyframes dsh-dream_dshFadeSlideUp {\n  from { opacity: 0; transform: translateY(8px) scale(0.992); }\n  to { opacity: 1; transform: translateY(0) scale(1); }\n}\n@keyframes dsh-dream_dshAdoptSweep {\n  0% { transform: translateX(0) scale(1); opacity: 1; }\n  40% { transform: translateX(8px) scale(1.01); background: color-mix(in oklab, var(--dsw-alias-state-success-primary, #1f7a4c) 20%, var(--dream-paper)); }\n  100% { transform: translateX(34px) scale(0.95); opacity: 0; }\n}\n@keyframes dsh-dream_dshDiscardCollapse {\n  0% { transform: scale(1); opacity: 1; }\n  100% { transform: translateX(-28px) scale(0.92, 0.3); opacity: 0; }\n}\n\n.dsh-dream_cand-row, .dsh-dream_verify-block, .dsh-dream_settings-card, .dsh-dream_control-card {\n  position: relative;\n  overflow: clip;\n}\n.dsh-dream_cand-row::after, .dsh-dream_verify-block::after, .dsh-dream_settings-card::after, .dsh-dream_control-card::after {\n  content: '';\n  position: absolute;\n  inset: 0;\n  pointer-events: none;\n  background: radial-gradient(320px circle at var(--mx, -999px) var(--my, -999px),\n    color-mix(in oklab, var(--dream-accent) 10%, transparent), transparent 70%);\n  opacity: 0;\n  transition: opacity 0.22s ease;\n}\n\n@media (prefers-reduced-motion: no-preference) {\n  .dsh-dream_cand-row, .dsh-dream_verify-block, .dsh-dream_settings-card {\n    animation: dsh-dream_dshFadeSlideUp 0.28s var(--dsh-ease-spring) backwards;\n    animation-delay: calc(var(--stagger-idx, 0) * 36ms);\n  }\n  @media (hover: hover) {\n    :is(.dsh-dream_cand-row, .dsh-dream_verify-block, .dsh-dream_settings-card, .dsh-dream_control-card):hover::after { opacity: 1; }\n    .dsh-dream_app-shell:not([data-dsh-style='pixel8bit']):not([data-dsh-style='eink']) .dsh-dream_cand-row:hover { translate: 2px 0px; }\n    .dsh-dream_cand-row:not([data-active='true']):hover { background-color: var(--dsw-alias-interactive-bg-hover, rgba(15, 23, 42, 0.04)); }\n    .dsh-dream_redacted-token:hover { transform: translateY(-1px) scale(1.03); }\n  }\n  .dsh-dream_cand-row[data-exit='accept'] { animation: dsh-dream_dshAdoptSweep 0.36s var(--dsh-ease-spring) forwards; pointer-events: none; }\n  .dsh-dream_cand-row[data-exit='reject'] { animation: dsh-dream_dshDiscardCollapse 0.28s var(--dsh-ease-out) forwards; transform-origin: left center; pointer-events: none; }\n}\n\n@container dream (max-width: 940px) {\n  .dsh-dream_pane-rail { width: 196px; }\n  .dsh-dream_workbench-grid[data-review='true'] { --rail-space: 196px; }\n}\n@container dream (max-width: 760px) {\n  .dsh-dream_topbar { padding: 8px 10px; gap: 8px; flex-wrap: wrap; }\n  .dsh-dream_topbar-left, .dsh-dream_topbar-right { flex-wrap: wrap; }\n  .dsh-dream_topbar-left, .dsh-dream_topbar-right, .dsh-dream_view-tabs { width: 100%; }\n  .dsh-dream_view-tabs [role='tab'] { padding-inline: 3px; }\n  .dsh-dream_tabLabel { display: block; width: 100%; overflow-wrap: anywhere; text-align: center; white-space: normal; line-height: 1.2; font-size: 11px; }\n  .dsh-dream_tabCount { display: none; }\n  .dsh-dream_workbench-grid { flex: 1 0 auto; flex-direction: column; }\n  .dsh-dream_workbench-grid .dsh-dream_pane-rail, .dsh-dream_workbench-grid .dsh-dream_pane-list { width: 100%; border-inline-end: 0; border-block-end: var(--dream-hairline); }\n  .dsh-dream_rail-scroll { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(210px, 100%), 1fr)); align-items: start; gap: 8px; padding: 8px 10px; }\n  .dsh-dream_rail-scroll .dsh-dream_control-card { margin-block-end: 0; }\n  .dsh-dream_mobileScope { display: block; }\n  .dsh-dream_rail-footer, .dsh-dream_scopeFilters { display: none; }\n  .dsh-dream_candidate-scroll, .dsh-dream_inspector-scroll { overflow: visible; }\n  .dsh-dream_pane-resizer, .dsh-dream_workbench-grid[data-detail='false'] .dsh-dream_pane-inspector,\n  .dsh-dream_workbench-grid[data-detail='true'] :is(.dsh-dream_pane-list, .dsh-dream_pane-rail) { display: none; }\n  .dsh-dream_inspector-toolbar { padding-inline: 10px; }\n  .dsh-dream_inspector-scroll { padding: 12px 10px 20px; }\n  .dsh-dream_pane-inspector .dsh-dream_back { display: inline-flex; align-self: flex-start; margin: 8px 10px 0; }\n  .dsh-dream_settingsPage, .dsh-dream_documentPage { padding: 12px; }\n}\n\n@media (prefers-reduced-motion: reduce) {\n  .dsh-dream_cand-row, .dsh-dream_verify-block, .dsh-dream_settings-card { animation: none !important; }\n  :is(.dsh-dream_cand-row, .dsh-dream_verify-block, .dsh-dream_settings-card, .dsh-dream_control-card, .dsh-dream_redacted-token):hover { transform: none; translate: none; }\n  ::view-transition-old(dsh-dream-workbench), ::view-transition-new(dsh-dream-workbench) { animation: none; }\n}";
// Editable browser entry. Build with node scripts/build-client.mjs.
window.__ModuleLoader__.load(__stardustUpdatesWrap({ id: "@stardustlc/dsh-dream", factory: (require) => {
        var module = { exports: {} };
        var exports = module.exports;
        "use strict";
        const React = require("react");
        const { useState, useEffect, useLayoutEffect, useCallback, useRef, useId } = React;
        const h = React.createElement;
        /**
 * DeepSeek Harness (>=0.2.2-rc.3) Unified Style Switcher, Layout & Motion Primitives v3
 * Shared across STARDUSTLC666 workbench plugins:
 *   dsh-email, dsh-calendar, dsh-cite, dsh-dream, dsh-code-security,
 *   dsh-rss, dsh-ppt, dsh-remotion, dsh-hyperframes
 *
 * Zero external runtime imports: accepts `React` and optional `require` so this
 * module can be bundled via esbuild IIFE or inlined into classic DSH client
 * scripts without requiring `react` in plugin `node_modules` or triggering
 * eager UI `require()` calls during `window.__ModuleLoader__.load`.
 */

const DSH_STYLE_STORAGE_KEY = 'dsh-stardust:ui-style';
const DSH_STYLE_EVENT = 'dsh-stardust-style';
const DSH_DEFAULT_STYLE = 'harness';

const DSH_FONT_STORAGE_KEY = 'dsh-stardust:ui-font';
const DSH_FONT_EVENT = 'dsh-stardust-font';
const DSH_DEFAULT_FONT = 'arcade';

const DSH_FONTS = Object.freeze([
  Object.freeze({
    id: 'arcade',
    zh: '幼圆等宽（默认）',
    zhShort: '幼圆',
    en: 'YouYuan Mono (Default)',
    enShort: 'YouYuan',
  }),
  Object.freeze({
    id: 'auto',
    zh: '跟随风格专属字',
    zhShort: '专属字',
    en: 'Match Style Font',
    enShort: 'Style Font',
  }),
  Object.freeze({
    id: 'songkai',
    zh: '中宋+楷书',
    zhShort: '中宋楷',
    en: 'Song + Kai',
    enShort: 'Song+Kai',
  }),
  Object.freeze({
    id: 'fangsong',
    zh: '工程仿宋',
    zhShort: '仿宋',
    en: 'Blueprint FangSong',
    enShort: 'FangSong',
  }),
  Object.freeze({
    id: 'poster',
    zh: '重磅画报黑',
    zhShort: '画报黑',
    en: 'Poster Sans',
    enShort: 'Poster',
  }),
  Object.freeze({
    id: 'retro98',
    zh: '千禧新宋',
    zhShort: '新宋98',
    en: 'Retro 98 SimSun',
    enShort: 'Retro 98',
  }),
  Object.freeze({
    id: 'serif',
    zh: '思源书宋',
    zhShort: '书宋',
    en: 'Book Serif',
    enShort: 'Serif',
  }),
  Object.freeze({
    id: 'modern',
    zh: '现代思源黑',
    zhShort: '思源黑',
    en: 'Modern Sans',
    enShort: 'Modern',
  }),
]);

const DSH_STYLES = Object.freeze([
  Object.freeze({
    id: 'harness',
    zh: '原生清透',
    zhShort: '原生',
    en: 'Native Airy',
    enShort: 'Native',
    swatch: '#4176e6',
    surface: '#f8fafc',
  }),
  Object.freeze({
    id: 'cream',
    zh: '米白纸感',
    zhShort: '米白色',
    en: 'Warm Cream',
    enShort: 'Cream',
    swatch: '#9e5829',
    surface: '#faf7f0',
  }),
  Object.freeze({
    id: 'claude',
    zh: 'Claude 暖书卷',
    zhShort: 'Claude风',
    en: 'Claude Warmth',
    enShort: 'Claude',
    swatch: '#c96442',
    surface: '#f5f4ed',
  }),
  Object.freeze({
    id: 'pixel8bit',
    zh: '8-Bit 掌机',
    zhShort: '8-Bit',
    en: 'Bright 8-Bit',
    enShort: '8-Bit',
    swatch: '#2e7d5b',
    surface: '#f4f6e8',
  }),
  Object.freeze({
    id: 'mint',
    zh: '晴空薄荷',
    zhShort: '薄荷',
    en: 'Airy Mint',
    enShort: 'Mint',
    swatch: '#0f766e',
    surface: '#f5fafb',
  }),
  Object.freeze({
    id: 'glass',
    zh: '晴昼琉璃',
    zhShort: '琉璃',
    en: 'Daylight Glass',
    enShort: 'Glass',
    swatch: '#4f6df5',
    surface: '#f3f7ff',
  }),
  Object.freeze({
    id: 'eink',
    zh: '护眼墨水屏',
    zhShort: '墨水屏',
    en: 'E-Ink Paper',
    enShort: 'E-Ink',
    swatch: '#171716',
    surface: '#f2f1ec',
  }),
  Object.freeze({
    id: 'blueprint',
    zh: '工程晒图',
    zhShort: '晒图',
    en: 'Blueprint',
    enShort: 'Blueprint',
    swatch: '#0d3b66',
    surface: '#eaf3fb',
  }),
  Object.freeze({
    id: 'risograph',
    zh: '波普孔版',
    zhShort: '孔版',
    en: 'Riso Zine',
    enShort: 'Riso',
    swatch: '#ff3e7f',
    surface: '#faf6ee',
  }),
  Object.freeze({
    id: 'win98',
    zh: '千禧复古',
    zhShort: '复古98',
    en: 'Retro 98',
    enShort: 'Retro 98',
    swatch: '#1b4f9c',
    surface: '#dcdcdc',
  }),
  Object.freeze({
    id: 'songhui',
    zh: '宋韵朱砂',
    zhShort: '宋韵',
    en: 'Song Xuan',
    enShort: 'Song',
    swatch: '#b83b2a',
    surface: '#f7f3e8',
  }),
  Object.freeze({
    id: 'frutiger',
    zh: '晴空水晶',
    zhShort: '水晶',
    en: 'Aqua Gloss',
    enShort: 'Aqua',
    swatch: '#0ea5e9',
    surface: '#eaf7ff',
  }),
  Object.freeze({
    id: 'gazette',
    zh: '铅字晨报',
    zhShort: '晨报',
    en: 'Gazette',
    enShort: 'Gazette',
    swatch: '#9b1c1c',
    surface: '#f6f3ec',
  }),
]);

const VALID_STYLE_IDS = new Set(DSH_STYLES.map(preset => preset.id));
const VALID_FONT_IDS = new Set(DSH_FONTS.map(preset => preset.id));

function resolveWindow(win) {
  if (win && typeof win === 'object') return win;
  return typeof window !== 'undefined' ? window : null;
}

function resolveReact(explicitReact) {
  if (explicitReact && typeof explicitReact.createElement === 'function') return explicitReact;
  if (typeof globalThis !== 'undefined' && globalThis.React && typeof globalThis.React.createElement === 'function') {
    return globalThis.React;
  }
  return null;
}

function clampNumber(value, min, max) {
  const lo = Number.isFinite(min) ? min : 0;
  const hi = Number.isFinite(max) ? Math.max(lo, max) : lo;
  const num = Number(value);
  if (!Number.isFinite(num)) return lo;
  return Math.min(hi, Math.max(lo, num));
}

function normalizeDshStyle(value) {
  const key = typeof value === 'string' ? value.trim() : '';
  return VALID_STYLE_IDS.has(key) ? key : DSH_DEFAULT_STYLE;
}

function getDshStylePreset(value) {
  const id = normalizeDshStyle(value);
  return DSH_STYLES.find(preset => preset.id === id) || DSH_STYLES[0];
}

function readDshStyle(win) {
  const target = resolveWindow(win);
  if (!target) return DSH_DEFAULT_STYLE;
  try {
    const raw = target.localStorage?.getItem(DSH_STYLE_STORAGE_KEY);
    return normalizeDshStyle(raw);
  } catch {
    return DSH_DEFAULT_STYLE;
  }
}

function normalizeDshFont(value) {
  const key = typeof value === 'string' ? value.trim() : '';
  return VALID_FONT_IDS.has(key) ? key : DSH_DEFAULT_FONT;
}

function getDshFontPreset(value) {
  const id = normalizeDshFont(value);
  return DSH_FONTS.find(preset => preset.id === id) || DSH_FONTS[0];
}

function readDshFont(win) {
  const target = resolveWindow(win);
  if (!target) return DSH_DEFAULT_FONT;
  try {
    const raw = target.localStorage?.getItem(DSH_FONT_STORAGE_KEY);
    return normalizeDshFont(raw);
  } catch {
    return DSH_DEFAULT_FONT;
  }
}

/**
 * Stamps `[data-dsh-style]`, `[data-dsh-font]`, and `[data-window-drag-exclude]` onto
 * any currently open portaled `[role="dialog"]` / `[role="menu"]` surfaces in
 * `document.body` that were synced via `createOverlaySyncRef` or carry
 * `[data-dsh-portal-synced]`, plus `[data-dsh-font]` onto `document.documentElement`.
 */
function syncPortaledOverlays(style, doc, font) {
  const normalized = normalizeDshStyle(style);
  const normalizedFont = normalizeDshFont(font ?? readDshFont());
  const targetDoc = doc || (typeof document !== 'undefined' ? document : null);
  if (!targetDoc) return;
  if (targetDoc.documentElement && typeof targetDoc.documentElement.setAttribute === 'function') {
    targetDoc.documentElement.setAttribute('data-dsh-font', normalizedFont);
  }
  if (typeof targetDoc.querySelectorAll !== 'function') return;
  for (const el of targetDoc.querySelectorAll('[data-dsh-portal-synced]')) {
    el.setAttribute('data-dsh-style', normalized);
    el.setAttribute('data-dsh-font', normalizedFont);
    if (!el.hasAttribute('data-window-drag-exclude')) {
      el.setAttribute('data-window-drag-exclude', '');
    }
  }
}

function syncPortaledFont(font, doc) {
  const normalizedFont = normalizeDshFont(font);
  const targetDoc = doc || (typeof document !== 'undefined' ? document : null);
  if (!targetDoc) return;
  if (targetDoc.documentElement && typeof targetDoc.documentElement.setAttribute === 'function') {
    targetDoc.documentElement.setAttribute('data-dsh-font', normalizedFont);
  }
  if (typeof targetDoc.querySelectorAll !== 'function') return;
  for (const el of targetDoc.querySelectorAll('[data-dsh-portal-synced], [data-dsh-style]')) {
    el.setAttribute('data-dsh-font', normalizedFont);
  }
}

function writeDshStyle(nextStyle, win) {
  const normalized = normalizeDshStyle(nextStyle);
  const target = resolveWindow(win);
  if (target) {
    try {
      target.localStorage?.setItem(DSH_STYLE_STORAGE_KEY, normalized);
    } catch {
      // Restricted storage: keep in-memory + custom event sync working.
    }
    syncPortaledOverlays(normalized, target.document, readDshFont(target));
    if (typeof target.dispatchEvent === 'function') {
      try {
        const CustomEventCtor = target.CustomEvent || (typeof CustomEvent === 'function' ? CustomEvent : null);
        if (CustomEventCtor) {
          target.dispatchEvent(new CustomEventCtor(DSH_STYLE_EVENT, { detail: { style: normalized } }));
        } else if (typeof Event === 'function') {
          const ev = new Event(DSH_STYLE_EVENT);
          ev.detail = { style: normalized };
          target.dispatchEvent(ev);
        }
      } catch {
        // Ignore synthetic event errors in minimal VM environments.
      }
    }
  }
  return normalized;
}

function writeDshFont(nextFont, win) {
  const normalized = normalizeDshFont(nextFont);
  const target = resolveWindow(win);
  if (target) {
    try {
      target.localStorage?.setItem(DSH_FONT_STORAGE_KEY, normalized);
    } catch {
      // Restricted storage: keep in-memory + custom event sync working.
    }
    syncPortaledFont(normalized, target.document);
    if (typeof target.dispatchEvent === 'function') {
      try {
        const CustomEventCtor = target.CustomEvent || (typeof CustomEvent === 'function' ? CustomEvent : null);
        if (CustomEventCtor) {
          target.dispatchEvent(new CustomEventCtor(DSH_FONT_EVENT, { detail: { font: normalized } }));
        } else if (typeof Event === 'function') {
          const ev = new Event(DSH_FONT_EVENT);
          ev.detail = { font: normalized };
          target.dispatchEvent(ev);
        }
      } catch {
        // Ignore synthetic event errors in minimal VM environments.
      }
    }
  }
  return normalized;
}

function subscribeDshStyle(onChange, win) {
  const target = resolveWindow(win);
  if (!target || typeof target.addEventListener !== 'function' || typeof onChange !== 'function') {
    return () => {};
  }
  const onCustom = event => {
    const next = normalizeDshStyle(event?.detail?.style ?? readDshStyle(target));
    syncPortaledOverlays(next, target.document, readDshFont(target));
    onChange(next);
  };
  const onStorage = event => {
    if (event && event.key !== null && event.key !== undefined && event.key !== DSH_STYLE_STORAGE_KEY) {
      return;
    }
    const next = normalizeDshStyle(event?.newValue ?? readDshStyle(target));
    syncPortaledOverlays(next, target.document, readDshFont(target));
    onChange(next);
  };
  target.addEventListener(DSH_STYLE_EVENT, onCustom);
  target.addEventListener('storage', onStorage);
  return () => {
    target.removeEventListener(DSH_STYLE_EVENT, onCustom);
    target.removeEventListener('storage', onStorage);
  };
}

function subscribeDshFont(onChange, win) {
  const target = resolveWindow(win);
  if (!target || typeof target.addEventListener !== 'function' || typeof onChange !== 'function') {
    return () => {};
  }
  const onCustom = event => {
    const next = normalizeDshFont(event?.detail?.font ?? readDshFont(target));
    syncPortaledFont(next, target.document);
    onChange(next);
  };
  const onStorage = event => {
    if (event && event.key !== null && event.key !== undefined && event.key !== DSH_FONT_STORAGE_KEY) {
      return;
    }
    const next = normalizeDshFont(event?.newValue ?? readDshFont(target));
    syncPortaledFont(next, target.document);
    onChange(next);
  };
  target.addEventListener(DSH_FONT_EVENT, onCustom);
  target.addEventListener('storage', onStorage);
  return () => {
    target.removeEventListener(DSH_FONT_EVENT, onCustom);
    target.removeEventListener('storage', onStorage);
  };
}

/**
 * React hook returning `[style, setStyle]`, synced across plugins, tabs, and
 * portaled dialogs via `localStorage['dsh-stardust:ui-style']` + `dsh-stardust-style`.
 * Safe in minimal VM registration tests where `React.useState` may be absent.
 */
function useDshStyle(React, win) {
  if (!React || typeof React.useState !== 'function') {
    return [readDshStyle(win), next => writeDshStyle(next, win)];
  }
  const [style, setStyleState] = React.useState(() => readDshStyle(win));
  if (typeof React.useEffect === 'function') {
    React.useEffect(() => {
      const current = readDshStyle(win);
      setStyleState(prev => (prev === current ? prev : current));
      syncPortaledOverlays(current, resolveWindow(win)?.document, readDshFont(win));
      return subscribeDshStyle(next => {
        setStyleState(prev => (prev === next ? prev : next));
      }, win);
    }, [win]);
  }
  const setStyle = next => {
    const resolved = typeof next === 'function' ? next(style) : next;
    const applied = writeDshStyle(resolved, win);
    setStyleState(applied);
    return applied;
  };
  return [style, setStyle];
}

/**
 * React hook returning `[font, setFont]`, synced via `localStorage['dsh-stardust:ui-font']`
 * + `dsh-stardust-font` and applied via `[data-dsh-font]`.
 */
function useDshFont(React, win) {
  if (!React || typeof React.useState !== 'function') {
    return [readDshFont(win), next => writeDshFont(next, win)];
  }
  const [font, setFontState] = React.useState(() => readDshFont(win));
  if (typeof React.useEffect === 'function') {
    React.useEffect(() => {
      const current = readDshFont(win);
      setFontState(prev => (prev === current ? prev : current));
      syncPortaledFont(current, resolveWindow(win)?.document);
      return subscribeDshFont(next => {
        setFontState(prev => (prev === next ? prev : next));
      }, win);
    }, [win]);
  }
  const setFont = next => {
    const resolved = typeof next === 'function' ? next(font) : next;
    const applied = writeDshFont(resolved, win);
    setFontState(applied);
    return applied;
  };
  return [font, setFont];
}

/**
 * Callback ref for elements rendered inside host `@deepseek-ai/dsh-client-ui-primitives`
 * `Modal` or `Menu` portals (`createPortal(..., document.body)`).
 * Host `Modal` and `Menu` do not spread arbitrary `data-*` props onto their outer
 * `<div role="dialog">` / `<div role="menu">` wrapper, so attaching this ref to an
 * inner header/body wrapper promotes `data-dsh-style`, `data-dsh-font`, and
 * `data-window-drag-exclude` onto the portaled overlay frame itself.
 */
function createOverlaySyncRef(style, font) {
  const normalized = normalizeDshStyle(style);
  const normalizedFont = normalizeDshFont(font ?? readDshFont());
  return node => {
    if (!node || typeof node.setAttribute !== 'function') return;
    node.setAttribute('data-dsh-style', normalized);
    node.setAttribute('data-dsh-font', normalizedFont);
    node.setAttribute('data-window-drag-exclude', '');
    node.setAttribute('data-dsh-portal-synced', 'true');
    if (typeof node.closest === 'function') {
      const overlay = node.closest('[role="dialog"], [role="alertdialog"], [role="menu"], dialog');
      if (overlay) {
        overlay.setAttribute('data-dsh-style', normalized);
        overlay.setAttribute('data-dsh-font', normalizedFont);
        overlay.setAttribute('data-window-drag-exclude', '');
        overlay.setAttribute('data-dsh-portal-synced', 'true');
      }
    }
  };
}

/**
 * Shared crisp 24x24 stroke icons for workbench headers, buttons, and micro-animations.
 */
const DSH_ICON_PATHS = Object.freeze({
  mail: ['M3 5h18v14H3z', 'm3 6 9 7 9-7'],
  inbox: ['M4 13 6 5h12l2 8v6H4z', 'M4 13h5l1 3h4l1-3h5'],
  send: ['m22 2-7 20-4-9-9-4Z', 'M22 2 11 13'],
  search: ['M10.5 18a7.5 7.5 0 1 0 0-15 7.5 7.5 0 0 0 0 15Z', 'm16 16 5 5'],
  plus: ['M12 5v14M5 12h14'],
  refresh: ['M20 7a9 9 0 1 0 1 8', 'M20 2v5h-5'],
  close: ['m6 6 12 12M18 6 6 18'],
  left: ['m14 5-7 7 7 7'],
  right: ['m10 5 7 7-7 7'],
  down: ['m5 9 7 7 7-7'],
  download: ['M12 3v12m-5-5 5 5 5-5', 'M4 16v5h16v-5'],
  file: ['M4 3h10l6 6v12H4z', 'M14 3v6h6M8 13h8M8 17h6'],
  folder: ['M3 5h7l2 3h9v12H3z'],
  edit: ['m15 4 5 5-10 10-6 1 1-6Z', 'm13 6 5 5'],
  trash: ['M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7M14 10v7'],
  info: ['M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Z', 'M12 11v6M12 7h.01'],
  check: ['m5 12 4 4L19 6'],
  star: ['m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9Z'],
  reply: ['m9 5-7 7 7 7v-5h6c3 0 5 2 6 5 0-8-4-11-12-11Z'],
  lock: ['M5 10h14v11H5z', 'M8 10V7a4 4 0 0 1 8 0v3M12 14v3'],
  clip: ['m8 13 6-6a2.5 2.5 0 0 1 3.5 3.5l-7 7a4 4 0 0 1-5.7-5.7l8-8a5 5 0 0 1 7.1 7.1l-8 8'],
  clock: ['M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Z', 'M12 6v6l4 2'],
  image: ['M3 4h18v16H3z', 'm3 17 6-6 5 5 2-2 5 5M16 8h.01'],
  copy: ['M9 9h10v11H9z', 'M5 15H4V4h10v1'],
  external: ['M14 4h6v6', 'M10 14 20 4', 'M18 13v6H5V6h6'],
  link: ['M10 13a5 5 0 0 0 7.1 0l2.8-2.8a5 5 0 0 0-7.1-7.1L11 4.9', 'M14 11a5 5 0 0 0-7.1 0l-2.8 2.8a5 5 0 0 0 7.1 7.1L13 19.1'],
  play: ['m7 5 12 7-12 7Z'],
  palette: ['M12 3a9 9 0 1 0 0 18h1.5a2.5 2.5 0 0 0 0-5H12a2 2 0 0 1 0-4h4a5 5 0 0 0 5-5c0-2.2-4-4-9-4Z', 'M7.5 10.5h.01M10.5 7.5h.01M14.5 7.5h.01'],
  sparkles: ['m12 3 1.8 4.2L18 9l-4.2 1.8L12 15l-1.8-4.2L6 9l4.2-1.8Z', 'M19 15v4M17 17h4'],
  calendar: ['M4 6h16v14H4z', 'M8 3v4M16 3v4M4 10h16'],
  shield: ['M12 3 5 6v6c0 5 3.4 8.3 7 9 3.6-.7 7-4 7-9V6Z'],
  rss: ['M5 19a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z', 'M4 11a9 9 0 0 1 9 9', 'M4 5a15 15 0 0 1 15 15'],
  grip: ['M9 6h.01M9 12h.01M9 18h.01M15 6h.01M15 12h.01M15 18h.01'],
});

function renderDshIcon(React, { name = 'file', size = 16, paths = DSH_ICON_PATHS, ...props } = {}) {
  const h = React.createElement;
  const segments = paths[name] || DSH_ICON_PATHS[name] || DSH_ICON_PATHS.file;
  return h(
    'svg',
    {
      width: size,
      height: size,
      viewBox: '0 0 24 24',
      fill: 'none',
      stroke: 'currentColor',
      strokeWidth: 1.65,
      strokeLinecap: 'round',
      strokeLinejoin: 'round',
      'aria-hidden': 'true',
      focusable: 'false',
      'data-dsh-icon': name,
      ...props,
    },
    segments.map((d, index) => h('path', { key: index, d })),
  );
}

/**
 * Measures the active `[role="tab"][aria-selected="true"]` inside a `[role="tablist"]`
 * and drives CSS variables `--dsh-tab-x` / `--dsh-tab-w` for `.dsh-tab-indicator`.
 * Falls back cleanly to static `::after` border underline when layout is unavailable (jsdom)
 * or under `@media (forced-colors: active)`.
 */
function useSlidingTabIndicator(React, activeValue, options = {}) {
  const tablistRef = typeof React?.useRef === 'function' ? React.useRef(null) : { current: null };
  const [metrics, setMetrics] = typeof React?.useState === 'function'
    ? React.useState({ x: 0, width: 0, ready: false })
    : [{ x: 0, width: 0, ready: false }, () => {}];

  const syncIndicator = () => {
    const list = tablistRef.current;
    if (!list || typeof list.querySelector !== 'function') return;
    const activeTab = list.querySelector('[role="tab"][aria-selected="true"]');
    if (!activeTab) {
      list.setAttribute?.('data-indicator-ready', 'false');
      setMetrics(prev => (prev.ready ? { x: 0, width: 0, ready: false } : prev));
      return;
    }
    let x = typeof activeTab.offsetLeft === 'number' ? activeTab.offsetLeft : 0;
    let width = typeof activeTab.offsetWidth === 'number' ? activeTab.offsetWidth : 0;
    if (!width && typeof activeTab.getBoundingClientRect === 'function' && typeof list.getBoundingClientRect === 'function') {
      const tabRect = activeTab.getBoundingClientRect();
      const listRect = list.getBoundingClientRect();
      if (tabRect && listRect && tabRect.width > 0) {
        width = tabRect.width;
        x = tabRect.left - listRect.left + (list.scrollLeft || 0);
      }
    }
    const ready = width > 0;
    if (list.style && typeof list.style.setProperty === 'function') {
      list.style.setProperty('--dsh-tab-x', `${Math.round(x)}px`);
      list.style.setProperty('--dsh-tab-w', `${Math.round(width)}px`);
    }
    list.setAttribute?.('data-indicator-ready', ready ? 'true' : 'false');
    setMetrics(prev => (
      prev.x === Math.round(x) && prev.width === Math.round(width) && prev.ready === ready
        ? prev
        : { x: Math.round(x), width: Math.round(width), ready }
    ));
  };

  const effectHook = typeof React?.useLayoutEffect === 'function'
    ? React.useLayoutEffect
    : (typeof React?.useEffect === 'function' ? React.useEffect : null);

  if (effectHook) {
    const deps = Array.isArray(options?.deps) ? [activeValue, ...options.deps] : [activeValue];
    effectHook(() => {
      syncIndicator();
      const list = tablistRef.current;
      const win = resolveWindow(options?.win);
      let ro = null;
      if (list && typeof win?.ResizeObserver === 'function') {
        try {
          ro = new win.ResizeObserver(() => syncIndicator());
          ro.observe(list);
        } catch {
          ro = null;
        }
      }
      if (win && typeof win.addEventListener === 'function') {
        win.addEventListener('resize', syncIndicator);
      }
      return () => {
        ro?.disconnect?.();
        if (win && typeof win.removeEventListener === 'function') {
          win.removeEventListener('resize', syncIndicator);
        }
      };
    }, deps);
  }

  const indicatorStyle = {
    '--dsh-tab-x': `${metrics.x}px`,
    '--dsh-tab-w': `${metrics.width}px`,
  };

  return {
    tablistRef,
    ready: metrics.ready,
    indicatorStyle,
    tablistProps: {
      ref: tablistRef,
      'data-dsh-tablist': '',
      'data-indicator-ready': metrics.ready ? 'true' : 'false',
    },
    indicatorProps: {
      className: 'dsh-tab-indicator',
      'aria-hidden': 'true',
      style: indicatorStyle,
    },
    syncIndicator,
  };
}

/**
 * Resizable split-pane hook with `localStorage` persistence, clamping, reset,
 * and ready-to-spread `resizerProps` for `DshSplitResizer`.
 */
function useResizableSplit(
  React,
  { key, initial = 320, min = 220, max = 560, orientation = 'vertical', reverse = false, win } = {},
) {
  const clampedInitial = clampNumber(initial, min, max);
  const readStored = () => {
    const target = resolveWindow(win);
    if (!key || !target) return clampedInitial;
    try {
      const raw = target.localStorage?.getItem(key);
      if (raw == null || raw === '') return clampedInitial;
      const parsed = Number(raw);
      return Number.isFinite(parsed) ? clampNumber(parsed, min, max) : clampedInitial;
    } catch {
      return clampedInitial;
    }
  };

  const writeStored = nextSize => {
    const clamped = Math.round(clampNumber(nextSize, min, max));
    const target = resolveWindow(win);
    if (key && target) {
      try {
        target.localStorage?.setItem(key, String(clamped));
      } catch {
        // Ignore restricted storage errors.
      }
    }
    return clamped;
  };

  const hasHooks = Boolean(React && typeof React.useState === 'function');
  const [size, setSizeState] = hasHooks ? React.useState(() => readStored()) : [readStored(), () => {}];
  const [isDragging, setIsDragging] = hasHooks ? React.useState(false) : [false, () => {}];

  const setSize = next => {
    const resolved = typeof next === 'function' ? next(size) : next;
    const applied = writeStored(resolved);
    setSizeState(applied);
    return applied;
  };

  const reset = () => {
    const applied = writeStored(clampedInitial);
    setSizeState(applied);
    return applied;
  };

  return {
    size,
    width: size,
    setSize,
    reset,
    isDragging,
    setIsDragging,
    paneStyle: { '--dsh-split-size': `${size}px` },
    resizerProps: {
      value: size,
      initial: clampedInitial,
      min,
      max,
      orientation,
      reverse,
      onChange: setSize,
      onReset: reset,
      onDraggingChange: setIsDragging,
    },
  };
}

function renderDshSplitResizer(
  React,
  {
    value = 320,
    initial,
    min = 220,
    max = 560,
    orientation = 'vertical',
    reverse = false,
    step = 16,
    label = 'Resize pane',
    onChange,
    onReset,
    onDraggingChange,
    className,
    style,
    ...rest
  } = {},
) {
  const R = resolveReact(React);
  if (!R) return null;
  const h = R.createElement;
  const dragRef = typeof R.useRef === 'function' ? R.useRef(null) : { current: null };
  const [dragging, setDragging] = typeof R.useState === 'function' ? R.useState(false) : [false, () => {}];

  const isHorizontal = orientation === 'horizontal';
  const clampedValue = Math.round(clampNumber(value, min, max));

  const setDragActive = active => {
    setDragging(active);
    onDraggingChange?.(active);
  };

  const cleanupWindowListeners = () => {
    const drag = dragRef.current;
    if (drag?.cleanup) {
      drag.cleanup();
    }
    dragRef.current = null;
  };

  if (typeof R.useEffect === 'function') {
    R.useEffect(() => cleanupWindowListeners, []);
  }

  const updateFromClientPos = (clientX, clientY) => {
    const drag = dragRef.current;
    if (!drag) return;
    const rawDelta = isHorizontal ? (clientY - drag.startY) : (clientX - drag.startX);
    const delta = reverse ? -rawDelta : rawDelta;
    const next = Math.round(clampNumber(drag.startValue + delta, min, max));
    onChange?.(next);
  };

  const handlePointerDown = event => {
    if (event?.button !== undefined && event.button !== 0) return;
    event?.preventDefault?.();
    const targetEl = event?.currentTarget;
    const pointerId = event?.pointerId;
    const startX = Number(event?.clientX ?? 0);
    const startY = Number(event?.clientY ?? 0);

    cleanupWindowListeners();

    let captured = false;
    if (targetEl && typeof targetEl.setPointerCapture === 'function' && pointerId !== undefined) {
      try {
        targetEl.setPointerCapture(pointerId);
        captured = true;
      } catch {
        captured = false;
      }
    }

    const win = resolveWindow();
    let cleanup = null;
    if (!captured && win && typeof win.addEventListener === 'function') {
      const onWinMove = moveEvent => updateFromClientPos(Number(moveEvent.clientX ?? 0), Number(moveEvent.clientY ?? 0));
      const onWinUp = () => {
        cleanupWindowListeners();
        setDragActive(false);
      };
      win.addEventListener('pointermove', onWinMove);
      win.addEventListener('mousemove', onWinMove);
      win.addEventListener('pointerup', onWinUp);
      win.addEventListener('mouseup', onWinUp);
      win.addEventListener('pointercancel', onWinUp);
      cleanup = () => {
        win.removeEventListener('pointermove', onWinMove);
        win.removeEventListener('mousemove', onWinMove);
        win.removeEventListener('pointerup', onWinUp);
        win.removeEventListener('mouseup', onWinUp);
        win.removeEventListener('pointercancel', onWinUp);
      };
    }

    dragRef.current = { startX, startY, startValue: clampedValue, pointerId, captured, cleanup };
    setDragActive(true);
  };

  const handlePointerMove = event => {
    if (!dragRef.current) return;
    updateFromClientPos(Number(event?.clientX ?? 0), Number(event?.clientY ?? 0));
  };

  const handlePointerEnd = event => {
    const drag = dragRef.current;
    if (!drag) return;
    if (drag.captured && event?.currentTarget && typeof event.currentTarget.releasePointerCapture === 'function' && drag.pointerId !== undefined) {
      try {
        event.currentTarget.releasePointerCapture(drag.pointerId);
      } catch {
        // Ignore release errors when pointer already detached.
      }
    }
    cleanupWindowListeners();
    setDragActive(false);
  };

  const handleKeyDown = event => {
    const key = event?.key;
    const deltaStep = event?.shiftKey ? step * 2 : step;
    const dir = reverse ? -1 : 1;
    let next = null;
    if ((!isHorizontal && key === 'ArrowLeft') || (isHorizontal && key === 'ArrowUp')) {
      next = clampNumber(clampedValue - deltaStep * dir, min, max);
    } else if ((!isHorizontal && key === 'ArrowRight') || (isHorizontal && key === 'ArrowDown')) {
      next = clampNumber(clampedValue + deltaStep * dir, min, max);
    } else if (key === 'Home') {
      next = min;
    } else if (key === 'End') {
      next = max;
    }
    if (next !== null) {
      event?.preventDefault?.();
      onChange?.(Math.round(next));
    }
  };

  const handleDoubleClick = () => {
    if (typeof onReset === 'function') {
      onReset();
    } else if (initial !== undefined) {
      onChange?.(Math.round(clampNumber(initial, min, max)));
    }
  };

  return h('div', {
    ...rest,
    role: 'separator',
    tabIndex: 0,
    'aria-orientation': orientation,
    'aria-label': label,
    'aria-valuemin': min,
    'aria-valuemax': max,
    'aria-valuenow': clampedValue,
    'data-dsh-resizer': '',
    'data-dragging': dragging ? 'true' : 'false',
    'data-window-drag-exclude': '',
    className: ['dsh-split-resizer', className].filter(Boolean).join(' '),
    style,
    onPointerDown: handlePointerDown,
    onPointerMove: handlePointerMove,
    onPointerUp: handlePointerEnd,
    onPointerCancel: handlePointerEnd,
    onLostPointerCapture: handlePointerEnd,
    onKeyDown: handleKeyDown,
    onDoubleClick: handleDoubleClick,
  });
}

function createSplitResizerComponent(React) {
  return function DshSplitResizerWithReact(props) {
    return renderDshSplitResizer(React, props);
  };
}

function DshSplitResizer(props = {}) {
  const { React: explicitReact, ...rest } = props;
  return renderDshSplitResizer(resolveReact(explicitReact), rest);
}

/**
 * Theme-tinted shimmer skeleton helper (`DshSkeleton` / `createSkeletonComponent` / `renderDshSkeleton`).
 * Honors `prefers-reduced-motion: reduce` and `eink` zero-distraction mode automatically via CSS.
 */
function renderDshSkeleton(
  React,
  {
    variant = 'text',
    lines = 3,
    width,
    height,
    radius,
    animated = true,
    label,
    className,
    style,
    ...rest
  } = {},
) {
  const R = resolveReact(React);
  if (!R) return null;
  const h = R.createElement;
  const a11yProps = label
    ? { role: 'status', 'aria-busy': 'true', 'aria-label': label }
    : { 'aria-hidden': 'true' };

  const baseBar = (barWidth, barHeight, key) =>
    h('span', {
      key,
      className: 'dsh-skeleton',
      'data-dsh-skeleton': variant,
      'data-animated': animated ? 'true' : 'false',
      style: {
        width: barWidth ?? width,
        height: barHeight ?? height,
        borderRadius: radius,
      },
    });

  if (variant === 'circle') {
    return h('span', {
      ...a11yProps,
      ...rest,
      className: ['dsh-skeleton', 'dsh-skeleton-circle', className].filter(Boolean).join(' '),
      'data-dsh-skeleton': 'circle',
      'data-animated': animated ? 'true' : 'false',
      style: { width, height, ...style },
    });
  }

  if (variant === 'rect') {
    return h('span', {
      ...a11yProps,
      ...rest,
      className: ['dsh-skeleton', className].filter(Boolean).join(' '),
      'data-dsh-skeleton': 'rect',
      'data-animated': animated ? 'true' : 'false',
      style: { width, height: height ?? '80px', borderRadius: radius, ...style },
    });
  }

  if (variant === 'row') {
    return h(
      'div',
      {
        ...a11yProps,
        ...rest,
        className: ['dsh-skeleton-row', className].filter(Boolean).join(' '),
        style,
      },
      h('span', {
        className: 'dsh-skeleton dsh-skeleton-circle',
        'data-dsh-skeleton': 'circle',
        'data-animated': animated ? 'true' : 'false',
      }),
      h(
        'div',
        { className: 'dsh-skeleton-group' },
        baseBar('58%', '12px', 'r1'),
        baseBar('84%', '10px', 'r2'),
      ),
    );
  }

  if (variant === 'card') {
    return h(
      'div',
      {
        ...a11yProps,
        ...rest,
        className: ['dsh-skeleton-card', className].filter(Boolean).join(' '),
        style,
      },
      baseBar('46%', '14px', 'c1'),
      baseBar('100%', '11px', 'c2'),
      baseBar('74%', '11px', 'c3'),
    );
  }

  const count = Math.max(1, Math.round(Number(lines) || 1));
  if (count === 1) {
    return h('span', {
      ...a11yProps,
      ...rest,
      className: ['dsh-skeleton', className].filter(Boolean).join(' '),
      'data-dsh-skeleton': 'text',
      'data-animated': animated ? 'true' : 'false',
      style: { width, height, borderRadius: radius, ...style },
    });
  }

  const bars = [];
  for (let i = 0; i < count; i += 1) {
    const isLast = i === count - 1;
    bars.push(baseBar(isLast ? '68%' : '100%', height, `l-${i}`));
  }
  return h(
    'div',
    {
      ...a11yProps,
      ...rest,
      className: ['dsh-skeleton-group', className].filter(Boolean).join(' '),
      style,
    },
    bars,
  );
}

function createSkeletonComponent(React) {
  return function DshSkeletonWithReact(props) {
    return renderDshSkeleton(React, props);
  };
}

function DshSkeleton(props = {}) {
  const { React: explicitReact, ...rest } = props;
  return renderDshSkeleton(resolveReact(explicitReact), rest);
}

/**
 * Lazily resolves `@deepseek-ai/dsh-client-ui-primitives` on render and supplies
 * semantic, accessible HTML fallbacks when running in standalone `jsdom` or `node:vm`
 * tests where host UI primitives are not mounted.
 *
 * IMPORTANT: Call ONLY inside component render paths — never eagerly inside
 * `window.__ModuleLoader__.load({ factory })` or `apply(ctx)`.
 */
const DSH_PRIMITIVES_CACHE = new WeakMap();
let fallbackControlSeq = 0;

function resolveHostPrimitives(React, requireFn) {
  if (typeof requireFn === 'function' && DSH_PRIMITIVES_CACHE.has(requireFn)) {
    return DSH_PRIMITIVES_CACHE.get(requireFn);
  }
  const h = React.createElement;
  let host = null;
  if (typeof requireFn === 'function') {
    try {
      host = requireFn('@deepseek-ai/dsh-client-ui-primitives') || null;
    } catch {
      host = null;
    }
  }

  function FallbackButton({ variant = 'ghost', size = 'md', icon, className, children, type = 'button', ...rest }) {
    const cls = ['dsh-btn', `dsh-btn-${variant}`, `dsh-btn-${size}`, className].filter(Boolean).join(' ');
    return h(
      'button',
      { type, className: cls, ...rest },
      icon != null ? h('span', { className: 'dsh-fallback-btn-icon' }, icon) : null,
      children,
    );
  }

  function FallbackInput({ icon, className, ...rest }) {
    const cls = ['dsh-fallback-input-wrap', className].filter(Boolean).join(' ');
    return h(
      'span',
      { className: cls },
      icon != null ? h('span', { className: 'dsh-fallback-input-icon' }, icon) : null,
      h('input', rest),
    );
  }

  function FallbackCheckbox({ id, checked = false, onChange, label, disabled = false, title, className, ...rest }) {
    const inputId = id || (typeof React.useId === 'function' ? React.useId() : 'dsh-chk-' + (++fallbackControlSeq));
    return h(
      'label',
      { htmlFor: inputId, className: ['dsh-checkbox-label', className].filter(Boolean).join(' '), title },
      h('input', {
        id: inputId,
        type: 'checkbox',
        checked: Boolean(checked),
        disabled,
        'aria-label': rest['aria-label'] || (typeof label === 'string' ? label : undefined),
        onChange: event => onChange?.(typeof event === 'boolean' ? event : Boolean(event?.target?.checked)),
        ...rest,
      }),
      label != null ? h('span', null, label) : null,
    );
  }

  function FallbackSwitch({ checked = false, onChange, label, disabled = false, title, className }) {
    return h(
      'button',
      {
        type: 'button',
        role: 'switch',
        'aria-checked': Boolean(checked),
        'aria-label': label,
        title,
        disabled,
        className,
        onClick: () => { if (!disabled) onChange?.(!checked); },
      },
      h('span', null),
    );
  }

  function FallbackSegmentedControl({ id, value, options = [], onChange, label, disabled = false, className }) {
    function handleKeys(event, index) {
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event?.key)) return;
      event.preventDefault?.();
      const enabled = options.map((opt, idx) => ({ opt, idx })).filter(item => !item.opt.disabled);
      if (!enabled.length) return;
      const pos = Math.max(0, enabled.findIndex(item => item.idx === index));
      const nextItem = event.key === 'Home'
        ? enabled[0]
        : event.key === 'End'
          ? enabled[enabled.length - 1]
          : enabled[(pos + (event.key === 'ArrowRight' ? 1 : -1) + enabled.length) % enabled.length];
      if (nextItem && !disabled) {
        onChange?.(nextItem.opt.value);
        event.currentTarget?.parentElement?.querySelectorAll('[role="tab"]')?.[nextItem.idx]?.focus?.();
      }
    }
    return h(
      'div',
      { role: 'tablist', 'aria-label': label, className: ['dsh-segmented-fallback', className].filter(Boolean).join(' ') },
      options.map((opt, index) => {
        const selected = opt.value === value;
        return h(
          'button',
          {
            key: opt.value,
            id: id ? `${id}-${opt.value}` : undefined,
            type: 'button',
            role: 'tab',
            title: opt.title,
            'aria-selected': selected,
            tabIndex: selected ? 0 : -1,
            disabled: disabled || Boolean(opt.disabled),
            onClick: () => {
              if (!disabled && !opt.disabled && opt.value !== value) onChange?.(opt.value);
            },
            onKeyDown: event => handleKeys(event, index),
          },
          opt.label,
        );
      }),
    );
  }

  function FallbackSegmentedTabs({ label, value, onChange, items = [], className }) {
    function handleKeys(event, index) {
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event?.key)) return;
      event.preventDefault?.();
      if (!items.length) return;
      const next = event.key === 'Home' ? 0 : event.key === 'End' ? items.length - 1 : (index + (event.key === 'ArrowRight' ? 1 : -1) + items.length) % items.length;
      const target = items[next];
      if (target) {
        onChange?.(target.value);
        event.currentTarget?.parentElement?.querySelectorAll('[role="tab"]')?.[next]?.focus?.();
      }
    }
    return h(
      'div',
      { role: 'tablist', 'aria-label': label, className: ['dsh-segmented-fallback', className].filter(Boolean).join(' ') },
      items.map((item, index) => {
        const selected = item.value === value;
        return h(
          'button',
          {
            key: item.value,
            id: item.id,
            type: 'button',
            role: 'tab',
            'aria-selected': selected,
            tabIndex: selected ? 0 : -1,
            onClick: () => { if (item.value !== value) onChange?.(item.value); },
            onKeyDown: event => handleKeys(event, index),
          },
          item.label,
        );
      }),
    );
  }

  function FallbackMenuSurface({ className, children, ...rest }) {
    return h('div', { className, ...rest }, children);
  }

  function FallbackPill({ active, className, children, ...rest }) {
    return h(
      'button',
      {
        type: 'button',
        'data-active': active ? 'true' : undefined,
        className: ['dsh-pill-fallback', className].filter(Boolean).join(' '),
        ...rest,
      },
      children,
    );
  }

  function FallbackTag({ tone, className, children, ...rest }) {
    return h(
      'span',
      {
        'data-tone': tone || undefined,
        className: ['dsh-tag-fallback', className].filter(Boolean).join(' '),
        ...rest,
      },
      children,
    );
  }

  function FallbackDiffBlock({ diffs = [] }) {
    return h(
      'div',
      { className: 'dsh-diff-fallback' },
      diffs.map((item, index) =>
        h(
          'section',
          { key: item.path || index },
          h('strong', null, item.path),
          item.oldText ? h('pre', { 'data-diff': 'old' }, '- ' + item.oldText) : null,
          item.newText ? h('pre', { 'data-diff': 'new' }, '+ ' + item.newText) : null,
        ),
      ),
    );
  }

  function renderPortalSyncNode(styleValue, fontValue) {
    const syncStyle = normalizeDshStyle(styleValue ?? readDshStyle());
    const syncFont = normalizeDshFont(fontValue ?? readDshFont());
    return h('span', {
      key: '__dsh_portal_sync__',
      ref: createOverlaySyncRef(syncStyle, syncFont),
      hidden: true,
      'aria-hidden': 'true',
      'data-dsh-style': syncStyle,
      'data-dsh-font': syncFont,
    });
  }

  function FallbackMenu({
    open = false,
    anchor,
    items = [],
    children,
    selectedId,
    onSelect,
    onClose,
    footer,
    className,
    listClassName,
    dshStyle,
    dshFont,
  }) {
    const style = normalizeDshStyle(dshStyle ?? readDshStyle());
    const font = normalizeDshFont(dshFont ?? readDshFont());
    return h(
      'div',
      { className: ['dsh-style-fallback-wrap', className].filter(Boolean).join(' ') },
      anchor,
      open
        ? h(
            'div',
            {
              role: 'menu',
              'data-dsh-style': style,
              'data-dsh-font': font,
              'data-window-drag-exclude': '',
              'data-dsh-portal-synced': 'true',
              className: ['dsh-style-fallback-menu', listClassName].filter(Boolean).join(' '),
              onKeyDown: event => {
                if (event?.key === 'Escape') {
                  event.stopPropagation?.();
                  onClose?.();
                }
              },
            },
            items.map(item => {
              const stylePreset = VALID_STYLE_IDS.has(item.id) ? getDshStylePreset(item.id) : null;
              return h(
                'button',
                {
                  key: item.id,
                  type: 'button',
                  role: 'menuitemradio',
                  'aria-checked': item.id === selectedId,
                  disabled: Boolean(item.disabled),
                  className: 'dsh-style-fallback-item',
                  onClick: () => {
                    if (!item.disabled) {
                      onSelect?.(item.id);
                      onClose?.();
                    }
                  },
                },
                h(
                  'span',
                  { className: 'dsh-style-fallback-item-leading' },
                  stylePreset
                    ? h('span', {
                        className: 'dsh-style-swatch',
                        'aria-hidden': 'true',
                        style: { '--dsh-swatch-color': stylePreset.swatch },
                      })
                    : null,
                  h('span', null, item.label),
                ),
                item.id === selectedId ? h('span', { 'aria-hidden': 'true' }, '✓') : null,
              );
            }),
            children,
            footer,
          )
        : null,
    );
  }

  function FallbackModal({
    open = true,
    onClose,
    title,
    closeLabel = 'Close',
    children,
    footer,
    className,
    contentClassName,
    onKeyDownCapture,
    headless = false,
    dshStyle,
    dshFont,
  }) {
    if (!open) return null;
    const style = normalizeDshStyle(dshStyle ?? readDshStyle());
    const font = normalizeDshFont(dshFont ?? readDshFont());
    return h(
      'div',
      {
        className: 'dsh-fallback-modal-root',
        role: 'presentation',
        'data-dsh-style': style,
        'data-dsh-font': font,
        'data-window-drag-exclude': '',
        'data-dsh-portal-synced': 'true',
        onKeyDownCapture: event => {
          onKeyDownCapture?.(event);
          if (!event?.defaultPrevented && event?.key === 'Escape') {
            onClose?.();
          }
        },
      },
      h('div', { className: 'dsh-fallback-modal-mask', 'aria-hidden': 'true', onClick: onClose }),
      h(
        'div',
        {
          role: 'dialog',
          'aria-modal': 'true',
          'aria-label': title,
          tabIndex: -1,
          'data-dsh-style': style,
          'data-dsh-font': font,
          'data-window-drag-exclude': '',
          'data-dsh-portal-synced': 'true',
          className: ['dsh-fallback-modal-dialog', className].filter(Boolean).join(' '),
        },
        headless
          ? children
          : h(
              React.Fragment || 'div',
              null,
              h(
                'header',
                null,
                h('h2', null, title),
                h('button', { type: 'button', 'aria-label': closeLabel, onClick: onClose }, '×'),
              ),
              h('div', { className: contentClassName }, children),
              footer ? h('footer', null, footer) : null,
            ),
      ),
    );
  }

  const WrappedMenu = host?.Menu
    ? function HostMenuWithStyle({ dshStyle, dshFont, children, ...menuProps }) {
        if (!menuProps.open) {
          return children !== undefined ? h(host.Menu, menuProps, children) : h(host.Menu, menuProps);
        }
        const syncNode = renderPortalSyncNode(dshStyle, dshFont);
        return children !== undefined && children !== null
          ? h(host.Menu, menuProps, children, syncNode)
          : h(host.Menu, menuProps, syncNode);
      }
    : FallbackMenu;

  const WrappedModal = host?.Modal
    ? function HostModalWithStyle({ dshStyle, dshFont, children, ...modalProps }) {
        if (!modalProps.open) {
          return children !== undefined ? h(host.Modal, modalProps, children) : h(host.Modal, modalProps);
        }
        const syncNode = renderPortalSyncNode(dshStyle, dshFont);
        return children !== undefined && children !== null
          ? h(host.Modal, modalProps, children, syncNode)
          : h(host.Modal, modalProps, syncNode);
      }
    : FallbackModal;

  const resolved = {
    ...(host || {}),
    isFallback: !host,
    Button: host?.Button || FallbackButton,
    Input: host?.Input || FallbackInput,
    Checkbox: host?.Checkbox || FallbackCheckbox,
    Switch: host?.Switch || FallbackSwitch,
    SegmentedControl: host?.SegmentedControl || FallbackSegmentedControl,
    SegmentedTabs: host?.SegmentedTabs || FallbackSegmentedTabs,
    MenuSurface: host?.MenuSurface || FallbackMenuSurface,
    Pill: host?.Pill || FallbackPill,
    Tag: host?.Tag || FallbackTag,
    DiffBlock: host?.DiffBlock || FallbackDiffBlock,
    Menu: WrappedMenu,
    Modal: WrappedModal,
  };
  if (typeof requireFn === 'function') {
    DSH_PRIMITIVES_CACHE.set(requireFn, resolved);
  }
  return resolved;
}

/**
 * Compact standalone Font Pairing Switcher (`FontSwitcher`), synced via
 * `localStorage['dsh-stardust:ui-font']` + `dsh-stardust-font` and `[data-dsh-font]`.
 */
function createFontSwitcherComponent(React, requireFn) {
  const h = React.createElement;
  return function FontSwitcher({
    font: controlledFont,
    style: controlledStyle,
    onChange,
    lang = 'zh',
    id = 'dsh-font-switcher',
    compact = true,
    disabled = false,
    align = 'end',
    className,
    open: controlledOpen,
    onOpenChange,
  } = {}) {
    const [syncedFont, setSyncedFont] = useDshFont(React);
    const [syncedStyle] = useDshStyle(React);
    const activeFont = normalizeDshFont(controlledFont ?? syncedFont);
    const activeStyle = normalizeDshStyle(controlledStyle ?? syncedStyle);
    const [internalOpen, setInternalOpen] = typeof React.useState === 'function' ? React.useState(false) : [false, () => {}];
    const open = controlledOpen !== undefined ? Boolean(controlledOpen) : internalOpen;
    const setOpen = next => {
      const resolved = typeof next === 'function' ? next(open) : Boolean(next);
      if (controlledOpen === undefined) setInternalOpen(resolved);
      onOpenChange?.(resolved);
    };
    const isZh = String(lang || '').toLowerCase().startsWith('zh');
    const preset = getDshFontPreset(activeFont);
    const P = resolveHostPrimitives(React, requireFn);
    const triggerLabel = isZh ? `字体搭配：${preset.zh}` : `Font pairing: ${preset.en}`;
    const visibleText = compact
      ? (isZh ? preset.zhShort : preset.enShort)
      : (isZh ? preset.zh : preset.en);
    const items = DSH_FONTS.map(option => ({
      id: option.id,
      label: isZh ? `${option.zh} (${option.enShort})` : `${option.en}`,
    }));
    const selectFont = nextId => {
      const applied = writeDshFont(nextId);
      setSyncedFont(applied);
      onChange?.(applied);
      setOpen(false);
    };

    return h(P.Menu, {
      open: open && !disabled,
      selectedId: activeFont,
      dshStyle: activeStyle,
      dshFont: activeFont,
      items,
      align,
      portal: !P.isFallback,
      autoFocus: true,
      minWidthFromAnchor: true,
      className,
      onClose: () => setOpen(false),
      onSelect: selectFont,
      anchor: h(
        P.Button,
        {
          id,
          variant: 'outline',
          size: 'sm',
          disabled,
          className: 'dsh-font-trigger',
          'aria-label': triggerLabel,
          'aria-haspopup': 'menu',
          'aria-expanded': Boolean(open && !disabled),
          title: triggerLabel,
          onClick: () => setOpen(prev => !prev),
          onKeyDown: event => {
            if (!open && (event.key === 'ArrowDown' || event.key === 'ArrowUp')) {
              event.preventDefault?.();
              setOpen(true);
            }
          },
        },
        h('span', { className: 'dsh-font-glyph', 'aria-hidden': 'true' }, isZh ? '字' : 'Aa'),
        h('span', { className: 'dsh-font-label' }, visibleText),
        renderDshIcon(React, { name: 'down', size: 13 }),
      ),
    });
  };
}

/**
 * Ready-made 13-preset Style Switcher + compact Font Pairing Switcher (`StyleSwitcher`).
 * Renders the style menu trigger with a live color swatch alongside the compact
 * font-pairing trigger (`showFontSwitcher = true` by default), syncing via
 * `localStorage['dsh-stardust:ui-style']` / `['dsh-stardust:ui-font']` and custom events.
 */
function createStyleSwitcherComponent(React, requireFn) {
  const h = React.createElement;
  const FontSwitcher = createFontSwitcherComponent(React, requireFn);
  return function StyleSwitcher({
    style: controlledStyle,
    font: controlledFont,
    onChange,
    onFontChange,
    showFontSwitcher = true,
    lang = 'zh',
    id = 'dsh-style-switcher',
    compact = false,
    disabled = false,
    align = 'end',
    className,
    formatOptionLabel,
    formatTriggerLabel,
    formatAriaLabel,
  } = {}) {
    const [syncedStyle, setSyncedStyle] = useDshStyle(React);
    const [syncedFont] = useDshFont(React);
    const activeStyle = normalizeDshStyle(controlledStyle ?? syncedStyle);
    const activeFont = normalizeDshFont(controlledFont ?? syncedFont);
    const [open, setOpen] = typeof React.useState === 'function' ? React.useState(false) : [false, () => {}];
    const [fontOpen, setFontOpen] = typeof React.useState === 'function' ? React.useState(false) : [false, () => {}];
    const isZh = String(lang || '').toLowerCase().startsWith('zh');
    const preset = getDshStylePreset(activeStyle);
    const P = resolveHostPrimitives(React, requireFn);
    const triggerLabel = typeof formatAriaLabel === 'function'
      ? formatAriaLabel(preset, isZh)
      : (isZh ? `界面风格：${preset.zh}` : `UI style: ${preset.en}`);
    const visibleText = typeof formatTriggerLabel === 'function'
      ? formatTriggerLabel(preset, compact, isZh)
      : (compact ? (isZh ? preset.zhShort : preset.enShort) : (isZh ? preset.zh : preset.en));
    const items = DSH_STYLES.map(option => ({
      id: option.id,
      label: typeof formatOptionLabel === 'function'
        ? formatOptionLabel(option, isZh)
        : (isZh ? `${option.zh} (${option.enShort})` : `${option.en}`),
    }));
    const selectStyle = nextId => {
      const applied = writeDshStyle(nextId);
      setSyncedStyle(applied);
      onChange?.(applied);
      setOpen(false);
    };

    return h(
      'div',
      {
        className: ['dsh-style-switcher', className].filter(Boolean).join(' '),
        'data-window-drag-exclude': '',
      },
      h(P.Menu, {
        open: open && !disabled,
        selectedId: activeStyle,
        dshStyle: activeStyle,
        dshFont: activeFont,
        items,
        align,
        portal: !P.isFallback,
        autoFocus: true,
        minWidthFromAnchor: true,
        onClose: () => setOpen(false),
        onSelect: selectStyle,
        anchor: h(
          P.Button,
          {
            id,
            variant: 'outline',
            size: 'sm',
            disabled,
            className: 'dsh-style-trigger',
            'aria-label': triggerLabel,
            'aria-haspopup': 'menu',
            'aria-expanded': Boolean(open && !disabled),
            title: triggerLabel,
            onClick: () => {
              setFontOpen(false);
              setOpen(prev => !prev);
            },
            onKeyDown: event => {
              if (!open && (event.key === 'ArrowDown' || event.key === 'ArrowUp')) {
                event.preventDefault?.();
                setFontOpen(false);
                setOpen(true);
              }
            },
          },
          h('span', {
            className: 'dsh-style-swatch',
            'aria-hidden': 'true',
            style: { '--dsh-swatch-color': preset.swatch },
          }),
          h('span', { className: 'dsh-style-label' }, visibleText),
          renderDshIcon(React, { name: 'down', size: 14 }),
        ),
      }),
      showFontSwitcher
        ? h(FontSwitcher, {
            id: `${id}-font`,
            font: controlledFont,
            style: activeStyle,
            onChange: onFontChange,
            lang,
            compact: true,
            disabled,
            align,
            open: fontOpen && !disabled,
            onOpenChange: next => {
              if (next) setOpen(false);
              setFontOpen(next);
            },
          })
        : null,
    );
  };
}

const DREAM_LANGUAGES = {
  zh: '简体中文', en: 'English', ja: '日本語', ko: '한국어',
  de: 'Deutsch', fr: 'Français', es: 'Español', ru: 'Русский',
};
const DREAM_LANGUAGE_KEY = 'dsh-dream-ui-language';
const DREAM_TRANSLATION_ORDER = ['en', 'ja', 'ko', 'de', 'fr', 'es', 'ru'];
const languageListeners = new Set();
let dreamLanguage = '';

function normalizeDreamLanguage(value) {
  const code = String(value ?? '').toLowerCase().split(/[-_]/)[0];
  return Object.hasOwn(DREAM_LANGUAGES, code) ? code : '';
}

function loadDreamLanguage() {
  try { return normalizeDreamLanguage(window.localStorage.getItem(DREAM_LANGUAGE_KEY)); }
  catch { return ''; }
}

function setDreamLanguage(value) {
  const next = normalizeDreamLanguage(value);
  if (dreamLanguage === next) return;
  dreamLanguage = next;
  try {
    if (next) window.localStorage.setItem(DREAM_LANGUAGE_KEY, next);
    else window.localStorage.removeItem(DREAM_LANGUAGE_KEY);
  } catch { /* Storage may be disabled. */ }
  for (const receive of languageListeners) receive();
}

// English, Japanese, Korean, German, French, Spanish, Russian.
const DREAM_MESSAGES = {
  'Dream 记忆': ['Dream memory', 'Dream メモリ', 'Dream 메모리', 'Dream-Speicher', 'Mémoire Dream', 'Memoria Dream', 'Память Dream'],
  'Dream 视图': ['Dream views', 'Dream ビュー', 'Dream 보기', 'Dream-Ansichten', 'Vues Dream', 'Vistas de Dream', 'Разделы Dream'],
  '待审阅': ['Awaiting review', 'レビュー待ち', '검토 대기', 'Zu prüfen', 'À examiner', 'Por revisar', 'На проверке'],
  '已采纳': ['Accepted', '採用済み', '채택됨', 'Übernommen', 'Acceptées', 'Aceptadas', 'Принятые'],
  '日记': ['Journal', '日誌', '일지', 'Tagebuch', 'Journal', 'Diario', 'Журнал'],
  '规则记录': ['Rule history', 'ルール履歴', '규칙 기록', 'Regelverlauf', 'Historique des règles', 'Historial de reglas', 'История правил'],
  '设置': ['Settings', '設定', '설정', 'Einstellungen', 'Paramètres', 'Ajustes', 'Настройки'],
  '界面语言': ['Interface language', '表示言語', '표시 언어', 'Anzeigesprache', 'Langue de l’interface', 'Idioma de la interfaz', 'Язык интерфейса'],
  '跟随 DSH': ['Follow DSH', 'DSH に従う', 'DSH 설정 따르기', 'Wie DSH', 'Comme DSH', 'Según DSH', 'Как в DSH'],
  '工作台皮肤': ['Workbench style', 'ワークベンチの外観', '작업대 스타일', 'Arbeitsbereichsdesign', 'Style de l’espace de travail', 'Estilo del área de trabajo', 'Стиль рабочей области'],
  '界面风格': ['UI style', '外観スタイル', '화면 스타일', 'Oberflächenstil', 'Style d’interface', 'Estilo de interfaz', 'Стиль интерфейса'],
  '原生清透': ['Native Airy', '標準クリア', '기본 클리어', 'Nativ luftig', 'Natif aérien', 'Nativo claro', 'Чистый стандарт'],
  '原生': ['Native', '標準', '기본', 'Nativ', 'Natif', 'Nativo', 'Стандарт'],
  '米白纸感': ['Warm Cream', 'ウォームクリーム', '웜 크림', 'Warmes Creme', 'Crème chaude', 'Crema cálido', 'Тёплый кремовый'],
  '米白色': ['Cream', 'クリーム', '크림', 'Creme', 'Crème', 'Crema', 'Кремовый'],
  'Claude 暖书卷': ['Claude Warmth', 'Claude ウォーム', 'Claude 웜', 'Claude-Wärme', 'Chaleur Claude', 'Calidez Claude', 'Тёплый Claude'],
  'Claude风': ['Claude', 'Claude', 'Claude', 'Claude', 'Claude', 'Claude', 'Claude'],
  '8-Bit 像素': ['Bright 8-Bit', '8-Bit ピクセル', '8-Bit 픽셀', '8-Bit Pixel', 'Pixel 8-Bit', 'Píxel 8-Bit', '8-битный пиксель'],
  '8-Bit 掌机': ['Bright 8-Bit', '8-Bit ゲーム機', '8-Bit 콘솔', '8-Bit Konsole', 'Console 8-Bit', 'Consola 8-Bit', '8-битная консоль'],
  '8-Bit像素': ['8-Bit', '8-Bit', '8-Bit', '8-Bit', '8-Bit', '8-Bit', '8-Bit'],
  '8-Bit': ['8-Bit', '8-Bit', '8-Bit', '8-Bit', '8-Bit', '8-Bit', '8-Bit'],
  '晴空薄荷': ['Airy Mint', 'エアリーミント', '에어리 민트', 'Luftige Minze', 'Menthe aérienne', 'Menta clara', 'Свежая мята'],
  '薄荷': ['Mint', 'ミント', '민트', 'Minze', 'Menthe', 'Menta', 'Мята'],
  '晴昼琉璃': ['Daylight Glass', '晴昼ガラス', '주간 유리', 'Tageslicht-Glas', 'Verre diurne', 'Cristal diurno', 'Дневное стекло'],
  '琉璃': ['Glass', 'ガラス', '유리', 'Glas', 'Verre', 'Cristal', 'Стекло'],
  '护眼墨水屏': ['E-Ink Paper', 'E-Ink ペーパー', 'E-Ink 페이퍼', 'E-Ink-Papier', 'Papier E-Ink', 'Papel E-Ink', 'Бумага E-Ink'],
  '墨水屏': ['E-Ink', 'E-Ink', 'E-Ink', 'E-Ink', 'E-Ink', 'E-Ink', 'E-Ink'],
  '工程晒图': ['Blueprint', 'ブループリント', '청사진', 'Blaupause', 'Bleu technique', 'Cianotipo', 'Чертёж'],
  '晒图': ['Blueprint', 'ブループリント', '청사진', 'Blaupause', 'Bleu', 'Cianotipo', 'Чертёж'],
  '波普孔版': ['Riso Zine', 'リソグラフ', '리소그래프', 'Risografie', 'Risographie', 'Risografía', 'Ризограф'],
  '孔版': ['Riso', 'リソ', '리소', 'Riso', 'Riso', 'Riso', 'Ризо'],
  '千禧复古': ['Retro 98', 'レトロ98', '레트로 98', 'Retro 98', 'Rétro 98', 'Retro 98', 'Ретро 98'],
  '复古98': ['Retro 98', 'レトロ98', '레트로 98', 'Retro 98', 'Rétro 98', 'Retro 98', 'Ретро 98'],
  '宋韵朱砂': ['Song Xuan', '宋韻朱砂', '송운 주사', 'Song-Xuan', 'Song Xuan', 'Song Xuan', 'Сун Сюань'],
  '宋韵': ['Song', '宋韻', '송운', 'Song', 'Song', 'Song', 'Сун'],
  '晴空水晶': ['Aqua Gloss', 'アクアグロス', '아쿠아 글로스', 'Aqua-Glanz', 'Aqua Gloss', 'Aqua Gloss', 'Аква-глянец'],
  '水晶': ['Aqua', 'アクア', '아쿠아', 'Aqua', 'Aqua', 'Aqua', 'Аква'],
  '快速采纳': ['Quick accept', 'クイック採用', '빠른 채택', 'Schnell übernehmen', 'Adoption rapide', 'Aceptar rápido', 'Быстро принять'],
  '复制经验': ['Copy lesson', '経験をコピー', '경험 복사', 'Erkenntnis kopieren', 'Copier la leçon', 'Copiar lección', 'Копировать урок'],
  'DSH 原生': ['DSH Native', 'DSH 標準', 'DSH 기본', 'DSH-Standard', 'DSH natif', 'DSH nativo', 'Стандарт DSH'],
  'Arc 浮岛': ['Arc Island', 'Arc アイランド', 'Arc 아일랜드', 'Arc Island', 'Arc flottant', 'Isla Arc', 'Остров Arc'],
  'Raycast 聚光': ['Raycast', 'Raycast', 'Raycast', 'Raycast', 'Raycast', 'Raycast', 'Raycast'],
  'Bento 卡片': ['Bento', 'Bento', 'Bento', 'Bento', 'Bento', 'Bento', 'Bento'],
  '命令面板': ['Command palette', 'コマンドパレット', '명령 팔레트', 'Befehlspalette', 'Palette de commandes', 'Paleta de comandos', 'Палитра команд'],
  '搜索命令…': ['Search commands…', 'コマンドを検索…', '명령 검색…', 'Befehle suchen…', 'Rechercher une commande…', 'Buscar comandos…', 'Найти команду…'],
  '没有匹配的命令': ['No matching commands', '一致するコマンドがありません', '일치하는 명령이 없습니다', 'Keine passenden Befehle', 'Aucune commande correspondante', 'No hay comandos que coincidan', 'Команды не найдены'],
  '关闭': ['Close', '閉じる', '닫기', 'Schließen', 'Fermer', 'Cerrar', 'Закрыть'],
  '刷新': ['Refresh', '更新', '새로 고침', 'Aktualisieren', 'Actualiser', 'Actualizar', 'Обновить'],
  '重试': ['Retry', '再試行', '다시 시도', 'Erneut versuchen', 'Réessayer', 'Reintentar', 'Повторить'],
  '加载中…': ['Loading…', '読み込み中…', '불러오는 중…', 'Wird geladen…', 'Chargement…', 'Cargando…', 'Загрузка…'],
  '正在处理…': ['Working…', '処理中…', '처리 중…', 'Wird verarbeitet…', 'Traitement…', 'Procesando…', 'Выполняется…'],
  '标题': ['Title', 'タイトル', '제목', 'Titel', 'Titre', 'Título', 'Заголовок'],
  '确认采纳': ['Confirm acceptance', '採用を確定', '채택 확인', 'Übernahme bestätigen', 'Confirmer l’acceptation', 'Confirmar aceptación', 'Подтвердить принятие'],
  '丢弃': ['Discard', '破棄', '버리기', 'Verwerfen', 'Écarter', 'Descartar', 'Отклонить'],
  '更多审阅操作': ['More review actions', 'その他のレビュー操作', '추가 검토 작업', 'Weitere Prüfaktionen', 'Autres actions de revue', 'Más acciones de revisión', 'Другие действия проверки'],
  '审阅状态': ['Review status', 'レビュー状態', '검토 상태', 'Prüfstatus', 'État de la revue', 'Estado de revisión', 'Статус проверки'],
  '审阅动作': ['Review action', 'レビュー操作', '검토 작업', 'Prüfaktion', 'Action de revue', 'Acción de revisión', 'Действие проверки'],
  '收起审阅': ['Collapse review', 'レビューを閉じる', '검토 접기', 'Prüfung einklappen', 'Replier la revue', 'Contraer revisión', 'Свернуть проверку'],
  '重新送审': ['Reopen for review', '再レビューに戻す', '검토에 다시 보내기', 'Erneut zur Prüfung öffnen', 'Renvoyer en revue', 'Volver a enviar a revisión', 'Вернуть на проверку'],
  '标记待复核': ['Mark for recheck', '再確認待ちにする', '재검토 필요 표시', 'Zur erneuten Prüfung markieren', 'Marquer à revérifier', 'Marcar para revisar de nuevo', 'Отметить для перепроверки'],
  '驳回': ['Reject', '却下', '반려', 'Ablehnen', 'Rejeter', 'Rechazar', 'Отклонить'],
  '确认审阅': ['Confirm review', 'レビューを確定', '검토 확인', 'Prüfung bestätigen', 'Confirmer la revue', 'Confirmar revisión', 'Подтвердить проверку'],
  '处理冲突': ['Resolve conflict', '競合を解決', '충돌 해결', 'Konflikt lösen', 'Résoudre le conflit', 'Resolver conflicto', 'Разрешить конфликт'],
  '冲突经验': ['Conflicting lesson', '競合する経験', '충돌하는 경험', 'Konkurrierende Erkenntnis', 'Leçon en conflit', 'Lección en conflicto', 'Конфликтующий урок'],
  '处理方式': ['Resolution', '解決方法', '해결 방법', 'Lösung', 'Résolution', 'Resolución', 'Способ решения'],
  '采用这条，驳回对方': ['Keep this lesson and reject the other', 'この経験を採用し、相手を却下', '이 경험을 채택하고 상대를 반려', 'Diese Erkenntnis behalten, andere ablehnen', 'Conserver cette leçon et rejeter l’autre', 'Mantener esta lección y rechazar la otra', 'Оставить этот урок, отклонить другой'],
  '放弃这条，保留对方': ['Reject this lesson and keep the other', 'この経験を却下し、相手を採用', '이 경험을 반려하고 상대를 유지', 'Diese Erkenntnis ablehnen, andere behalten', 'Rejeter cette leçon et conserver l’autre', 'Rechazar esta lección y mantener la otra', 'Отклонить этот урок, оставить другой'],
  '合并到这条，对方留作历史': ['Merge here and archive the other', 'この経験に統合し、相手は履歴に残す', '이 경험에 병합하고 상대는 기록에 보관', 'Hier zusammenführen und andere archivieren', 'Fusionner ici et archiver l’autre', 'Combinar aquí y archivar la otra', 'Объединить здесь, другой сохранить в истории'],
  '处理依据': ['Reason for decision', '判断の根拠', '결정 근거', 'Entscheidungsgrund', 'Motif de la décision', 'Motivo de la decisión', 'Причина решения'],
  '说明哪个来源支持这次决定…': ['Describe which source supports your decision…', '判断を裏付ける出典を記載…', '결정을 뒷받침하는 출처를 입력…', 'Geben Sie die Quelle für Ihre Entscheidung an…', 'Indiquez la source qui appuie votre décision…', 'Indica qué fuente respalda tu decisión…', 'Опишите источник, подтверждающий решение…'],
  '在对话里处理': ['Continue in chat', 'チャットで続ける', '채팅에서 계속', 'Im Chat fortfahren', 'Continuer dans la discussion', 'Continuar en el chat', 'Продолжить в чате'],
  '复制审阅命令': ['Copy review command', 'レビューコマンドをコピー', '검토 명령 복사', 'Prüfbefehl kopieren', 'Copier la commande de revue', 'Copiar comando de revisión', 'Копировать команду проверки'],
  '复制命令': ['Copy command', 'コマンドをコピー', '명령 복사', 'Befehl kopieren', 'Copier la commande', 'Copiar comando', 'Копировать команду'],
  '刷新列表': ['Refresh list', 'リストを更新', '목록 새로 고침', 'Liste aktualisieren', 'Actualiser la liste', 'Actualizar lista', 'Обновить список'],
  '已刷新经验列表。': ['Lessons refreshed.', '経験リストを更新しました。', '경험 목록을 새로 고쳤습니다.', 'Erkenntnisse aktualisiert.', 'Liste des leçons actualisée.', 'Lista de lecciones actualizada.', 'Список уроков обновлён.'],
  '修订对比': ['Compare revisions', 'リビジョンを比較', '리비전 비교', 'Versionen vergleichen', 'Comparer les révisions', 'Comparar revisiones', 'Сравнить версии'],
  '审阅变更预览': ['Preview review changes', 'レビュー変更をプレビュー', '검토 변경 사항 미리보기', 'Vorschau der Prüfänderungen', 'Aperçu des changements de revue', 'Vista previa de la revisión', 'Предпросмотр изменений'],
  '版本': ['Revision', 'リビジョン', '리비전', 'Version', 'Révision', 'Revisión', 'Версия'],
  '确认审阅后': ['after confirmation', '確定後', '확인 후', 'nach Bestätigung', 'après confirmation', 'tras confirmar', 'после подтверждения'],
  '差异': ['Diff', '差分', '차이', 'Änderungen', 'Différences', 'Diferencias', 'Различия'],
  '自动换行': ['Wrap lines', '行を折り返す', '줄바꿈 사용', 'Zeilen umbrechen', 'Renvoyer à la ligne', 'Ajustar líneas', 'Переносить строки'],
  '取消自动换行': ['Disable wrapping', '折り返しを解除', '줄바꿈 해제', 'Zeilenumbruch aus', 'Désactiver le retour à la ligne', 'Desactivar ajuste', 'Отключить перенос'],
  '复制差异': ['Copy diff', '差分をコピー', '차이 복사', 'Änderungen kopieren', 'Copier les différences', 'Copiar diferencias', 'Копировать различия'],
  '已复制': ['Copied', 'コピー済み', '복사됨', 'Kopiert', 'Copié', 'Copiado', 'Скопировано'],
  '收起': ['Collapse', '折りたたむ', '접기', 'Einklappen', 'Replier', 'Contraer', 'Свернуть'],
  '收起差异': ['Collapse diff', '差分を折りたたむ', '차이 접기', 'Änderungen einklappen', 'Replier les différences', 'Contraer diferencias', 'Свернуть различия'],
  '展开': ['Expand', '展開', '펼치기', 'Aufklappen', 'Développer', 'Expandir', 'Развернуть'],
  '展开差异': ['Expand diff', '差分を展開', '차이 펼치기', 'Änderungen aufklappen', 'Développer les différences', 'Expandir diferencias', 'Развернуть различия'],
  '这两个版本的可展示字段相同。': ['The displayed fields are the same in both revisions.', '表示項目は両リビジョンで同じです。', '두 리비전의 표시 필드가 같습니다.', 'Die angezeigten Felder sind in beiden Versionen gleich.', 'Les champs affichés sont identiques dans les deux révisions.', 'Los campos visibles coinciden en ambas revisiones.', 'Отображаемые поля обеих версий совпадают.'],
  '掩码预览': ['Mask preview', 'マスクのプレビュー', '마스크 미리보기', 'Maskenvorschau', 'Aperçu du masquage', 'Vista previa de la máscara', 'Просмотр маски'],
  '已脱敏': ['Redacted', 'マスク済み', '가려짐', 'Maskiert', 'Masqué', 'Oculto', 'Скрыто'],
  '疑似 sk 密钥': ['Possible sk key', 'sk キーの可能性', 'sk 키 추정', 'Möglicher sk-Schlüssel', 'Clé sk possible', 'Posible clave sk', 'Возможный ключ sk'],
  '疑似 GitHub 令牌': ['Possible GitHub token', 'GitHub トークンの可能性', 'GitHub 토큰 추정', 'Mögliches GitHub-Token', 'Jeton GitHub possible', 'Posible token de GitHub', 'Возможный токен GitHub'],
  '疑似 GitHub 细粒度令牌': ['Possible fine-grained GitHub token', 'GitHub の詳細な権限付きトークンの可能性', 'GitHub 세분화 토큰 추정', 'Mögliches fein abgestuftes GitHub-Token', 'Jeton GitHub à autorisations fines possible', 'Posible token de GitHub con permisos detallados', 'Возможный токен GitHub с детальными правами'],
  '疑似 Slack 令牌': ['Possible Slack token', 'Slack トークンの可能性', 'Slack 토큰 추정', 'Mögliches Slack-Token', 'Jeton Slack possible', 'Posible token de Slack', 'Возможный токен Slack'],
  '疑似 Groq 密钥': ['Possible Groq key', 'Groq キーの可能性', 'Groq 키 추정', 'Möglicher Groq-Schlüssel', 'Clé Groq possible', 'Posible clave de Groq', 'Возможный ключ Groq'],
  '疑似 AWS 访问密钥': ['Possible AWS access key', 'AWS アクセスキーの可能性', 'AWS 액세스 키 추정', 'Möglicher AWS-Zugriffsschlüssel', 'Clé AWS possible', 'Posible clave de acceso de AWS', 'Возможный ключ доступа AWS'],
  '疑似 JWT': ['Possible JWT', 'JWT の可能性', 'JWT 추정', 'Mögliches JWT', 'JWT possible', 'Posible JWT', 'Возможный JWT'],
  '凭据': ['Credential', '認証情報', '인증 정보', 'Zugangsdaten', 'Identifiant secret', 'Credencial', 'Учётные данные'],
  '长令牌': ['Long token', '長いトークン', '긴 토큰', 'Langes Token', 'Jeton long', 'Token largo', 'Длинный токен'],
  '重新模糊': ['Blur again', '再度ぼかす', '다시 흐리게', 'Erneut ausblenden', 'Flouter à nouveau', 'Volver a difuminar', 'Снова размыть'],
  '临时查看内容': ['Reveal temporarily', '一時的に表示', '일시적으로 표시', 'Vorübergehend anzeigen', 'Afficher temporairement', 'Mostrar temporalmente', 'Показать временно'],
  '来源与证据': ['Sources and evidence', '出典と証拠', '출처 및 근거', 'Quellen und Belege', 'Sources et preuves', 'Fuentes y evidencias', 'Источники и доказательства'],
  '证据摘要': ['Evidence summary', '証拠の要約', '근거 요약', 'Zusammenfassung der Belege', 'Résumé des preuves', 'Resumen de evidencias', 'Сводка доказательств'],
  '为什么被扣下：': ['Review reason: ', 'レビューの理由：', '검토 사유: ', 'Prüfgrund: ', 'Motif de la revue : ', 'Motivo de revisión: ', 'Причина проверки: '],
  '查看来源记录': ['Inspect source record', '出典の記録を確認', '출처 기록 확인', 'Quelleneintrag prüfen', 'Consulter la source', 'Consultar el registro de origen', 'Посмотреть запись источника'],
  '未提供摘要': ['No summary provided', '要約がありません', '요약 없음', 'Keine Zusammenfassung', 'Aucun résumé', 'Sin resumen', 'Нет краткого описания'],
  '已读到来源': ['Source read', '出典を確認済み', '출처 확인됨', 'Quelle gelesen', 'Source consultée', 'Fuente consultada', 'Источник прочитан'],
  '待核验': ['Unverified', '未検証', '미검증', 'Ungeprüft', 'Non vérifié', 'Sin verificar', 'Не проверено'],
  '会话': ['Session', 'セッション', '세션', 'Sitzung', 'Session', 'Sesión', 'Сессия'],
  '用户纠正': ['User correction', 'ユーザーの訂正', '사용자 수정 사항', 'Nutzerkorrektur', 'Correction utilisateur', 'Corrección del usuario', 'Исправление пользователя'],
  '本地资料': ['Local material', 'ローカル資料', '로컬 자료', 'Lokales Material', 'Document local', 'Material local', 'Локальные материалы'],
  '会话：': ['Session: ', 'セッション：', '세션: ', 'Sitzung: ', 'Session : ', 'Sesión: ', 'Сессия: '],
  ' · 记录 ': [' · Record ', ' · 記録 ', ' · 기록 ', ' · Eintrag ', ' · Entrée ', ' · Registro ', ' · Запись '],
  '记录时间：': ['Recorded: ', '記録日時：', '기록 시간: ', 'Erfasst: ', 'Enregistré le : ', 'Fecha de registro: ', 'Записано: '],
  '来源校验值：': ['Source checksum: ', '出典のチェックサム：', '출처 체크섬: ', 'Quellprüfsumme: ', 'Somme de contrôle : ', 'Suma de verificación: ', 'Контрольная сумма источника: '],
  '已核对当前会话原文；不代表结论正确。': ['Source checked against this session. Verify the conclusion separately.', 'このセッションの出典を確認済みです。結論は別途検証してください。', '이 세션의 출처를 확인했습니다. 결론은 별도로 검증하세요.', 'Die Quelle wurde in dieser Sitzung geprüft. Prüfen Sie die Schlussfolgerung separat.', 'Source vérifiée dans cette session. Vérifiez la conclusion séparément.', 'Fuente cotejada con esta sesión. Verifica la conclusión por separado.', 'Источник сверен с сессией. Проверьте вывод отдельно.'],
  '未关联来源记录，使用前请核对依据。': ['Check the evidence before using this lesson. No source record is linked.', '使用前に根拠を確認してください。参照元の記録がありません。', '사용하기 전에 근거를 확인하세요. 연결된 출처가 없습니다.', 'Prüfen Sie die Grundlage vor der Verwendung. Keine Quelle ist verknüpft.', 'Vérifiez les éléments avant d’utiliser cette leçon. Aucune source n’est liée.', 'Verifica la evidencia antes de usar la lección. No hay ninguna fuente enlazada.', 'Проверьте доказательства перед использованием. Ссылка на источник отсутствует.'],
  '没有关联来源记录，采纳前请核对依据。': ['Check the evidence before accepting. No source record is linked.', '採用前に根拠を確認してください。参照元の記録がありません。', '채택하기 전에 근거를 확인하세요. 연결된 출처가 없습니다.', 'Prüfen Sie die Grundlage vor der Übernahme. Keine Quelle ist verknüpft.', 'Vérifiez les éléments avant d’accepter. Aucune source n’est liée.', 'Verifica la evidencia antes de aceptar. No hay ninguna fuente enlazada.', 'Проверьте доказательства перед принятием. Ссылка на источник отсутствует.'],
  '建议行动': ['Suggested action', '推奨アクション', '권장 조치', 'Empfohlene Aktion', 'Action suggérée', 'Acción sugerida', 'Рекомендуемое действие'],
  '未标注具体动作': ['No action specified', '操作の記載なし', '명시된 조치 없음', 'Keine Aktion angegeben', 'Aucune action précisée', 'No se especificó ninguna acción', 'Действие не указано'],
  '范围、条件与例外': ['Scope, conditions and exceptions', '範囲・条件・例外', '범위, 조건 및 예외', 'Geltungsbereich, Bedingungen und Ausnahmen', 'Portée, conditions et exceptions', 'Alcance, condiciones y excepciones', 'Область, условия и исключения'],
  '适用范围': ['Scope', '適用範囲', '적용 범위', 'Geltungsbereich', 'Portée', 'Alcance', 'Область применения'],
  '适用条件': ['When to use', '適用条件', '적용 조건', 'Anwendungsbedingungen', 'Conditions d’utilisation', 'Cuándo aplicarla', 'Условия применения'],
  '未标注适用条件': ['No conditions specified', '条件の記載なし', '명시된 조건 없음', 'Keine Bedingungen angegeben', 'Aucune condition précisée', 'No se especificaron condiciones', 'Условия не указаны'],
  '适用环境': ['Environment', '適用環境', '적용 환경', 'Umgebung', 'Environnement', 'Entorno', 'Среда'],
  '例外与补充': ['Exceptions and context', '例外と補足', '예외 및 추가 정보', 'Ausnahmen und Kontext', 'Exceptions et contexte', 'Excepciones y contexto', 'Исключения и контекст'],
  '未记录例外': ['No recorded exceptions', '例外の記録なし', '기록된 예외 없음', 'Keine Ausnahmen verzeichnet', 'Aucune exception enregistrée', 'No hay excepciones registradas', 'Исключения не записаны'],
  '最近核验：': ['Last verified: ', '最終確認：', '최근 검증: ', 'Zuletzt geprüft: ', 'Dernière vérification : ', 'Última verificación: ', 'Последняя проверка: '],
  '最近取回：': ['Last retrieved: ', '最終取得：', '최근 가져옴: ', 'Zuletzt abgerufen: ', 'Dernier rappel : ', 'Última recuperación: ', 'Последнее извлечение: '],
  '尚未核验': ['Never verified', '未検証', '검증 기록 없음', 'Noch nie geprüft', 'Jamais vérifié', 'Aún sin verificar', 'Ещё не проверено'],
  '已到复核时间': ['Review deadline reached', '再確認の期限に達しました', '재검토 기한 도달', 'Prüffrist erreicht', 'Échéance de vérification atteinte', 'Fecha de revisión alcanzada', 'Наступил срок перепроверки'],
  '取回仅表示提供参考，不等于重新核验。': ['Retrieved for reference. Verify the lesson again as needed.', '参考として取得しました。必要に応じて再確認してください。', '참고용으로 가져왔습니다. 필요하면 다시 검증하세요.', 'Als Referenz abgerufen. Bei Bedarf erneut prüfen.', 'Rappelée à titre de référence. Vérifiez-la à nouveau si nécessaire.', 'Recuperada como referencia. Vuelve a verificarla si es necesario.', 'Извлечено для справки. При необходимости проверьте ещё раз.'],
  '全局': ['Global', 'グローバル', '전역', 'Global', 'Global', 'Global', 'Глобально'],
  '项目': ['Project', 'プロジェクト', '프로젝트', 'Projekt', 'Projet', 'Proyecto', 'Проект'],
  '工作区': ['Workspace', 'ワークスペース', '작업 영역', 'Arbeitsbereich', 'Espace de travail', 'Espacio de trabajo', 'Рабочая область'],
  '范围未标注': ['Scope unspecified', '適用範囲の記載なし', '범위 미지정', 'Geltungsbereich nicht angegeben', 'Portée non précisée', 'Alcance sin especificar', 'Область применения не указана'],
  '刚刚': ['Just now', 'たった今', '방금', 'Gerade eben', 'À l’instant', 'Ahora mismo', 'Только что'],
  '今天': ['Today', '今日', '오늘', 'Heute', 'Aujourd’hui', 'Hoy', 'Сегодня'],
  '昨天': ['Yesterday', '昨日', '어제', 'Gestern', 'Hier', 'Ayer', 'Вчера'],
  '调整候选列表宽度': ['Resize candidate list', '候補リストの幅を調整', '후보 목록 너비 조정', 'Breite der Kandidatenliste ändern', 'Redimensionner la liste des candidates', 'Ajustar el ancho de la lista de candidatas', 'Изменить ширину списка кандидатов'],
  '选中候选': ['Select candidate', '候補を選択', '후보 선택', 'Kandidaten auswählen', 'Sélectionner la candidate', 'Seleccionar candidata', 'Выбрать кандидата'],
  '选中候选：': ['Select candidate: ', '候補を選択：', '후보 선택: ', 'Kandidat: ', 'Sélectionner : ', 'Seleccionar: ', 'Выбрать кандидата: '],
  '项目与主题': ['Project and topic', 'プロジェクトとトピック', '프로젝트와 주제', 'Projekt und Thema', 'Projet et sujet', 'Proyecto y tema', 'Проект и тема'],
  '全部项目与主题': ['All projects and topics', 'すべてのプロジェクトとトピック', '모든 프로젝트와 주제', 'Alle Projekte und Themen', 'Tous les projets et sujets', 'Todos los proyectos y temas', 'Все проекты и темы'],
  '暂时读不到经验': ['Lessons are unavailable', '経験を読み込めません', '경험을 불러올 수 없습니다', 'Erkenntnisse sind nicht verfügbar', 'Leçons indisponibles', 'Lecciones no disponibles', 'Уроки недоступны'],
  '没有匹配的经验': ['No matching lessons', '一致する経験がありません', '일치하는 경험이 없습니다', 'Keine passenden Erkenntnisse', 'Aucune leçon correspondante', 'No hay lecciones que coincidan', 'Уроки не найдены'],
  '没有待审阅的经验': ['No lessons awaiting review', 'レビュー待ちの経験はありません', '검토 대기 중인 경험이 없습니다', 'Keine Erkenntnisse zur Prüfung', 'Aucune leçon à examiner', 'No hay lecciones por revisar', 'Нет уроков на проверке'],
  '还没有已采纳的经验': ['No accepted lessons yet', '採用済みの経験はまだありません', '아직 채택된 경험이 없습니다', 'Noch keine übernommenen Erkenntnisse', 'Aucune leçon acceptée pour le moment', 'Aún no hay lecciones aceptadas', 'Принятых уроков пока нет'],
  '审阅筛选与自动记忆': ['Review filters and automatic memory', 'レビューの絞り込みと自動メモリ', '검토 필터 및 자동 메모리', 'Prüffilter und automatischer Speicher', 'Filtres de revue et mémoire automatique', 'Filtros de revisión y memoria automática', 'Фильтры проверки и автопамять'],
  '自动记忆': ['Automatic memory', '自動メモリ', '자동 메모리', 'Automatischer Speicher', 'Mémoire automatique', 'Memoria automática', 'Автоматическая память'],
  '候选经验由你确认采纳。': ['You confirm which candidates to accept.', '候補の採用はあなたが確定します。', '채택할 후보는 직접 확인합니다.', 'Sie bestätigen, welche Kandidaten übernommen werden.', 'Vous confirmez quelles candidates accepter.', 'Tú confirmas qué candidatas aceptar.', 'Вы подтверждаете, какие кандидаты принять.'],
  '候选经验': ['Candidate lessons', '経験の候補', '경험 후보', 'Vorgeschlagene Erkenntnisse', 'Leçons candidates', 'Lecciones candidatas', 'Уроки-кандидаты'],
  '候选（未采纳）': ['Candidate (not accepted)', '候補（未採用）', '후보 (미채택)', 'Kandidat', 'Candidate à examiner', 'Candidata pendiente', 'Кандидат на рассмотрении'],
  '可用': ['Usable', '使用可能', '사용 가능', 'Verfügbar', 'Utilisable', 'Utilizable', 'Доступно'],
  '有冲突': ['Conflict', '競合あり', '충돌 있음', 'Konflikt', 'Conflit', 'Conflicto', 'Конфликт'],
  '待复核': ['Needs recheck', '再確認待ち', '재검토 필요', 'Erneute Prüfung nötig', 'À revérifier', 'Por comprobar de nuevo', 'Нужна перепроверка'],
  '已驳回': ['Rejected', '却下済み', '반려됨', 'Abgelehnt', 'Rejetée', 'Rechazada', 'Отклонён'],
  '已驳回历史': ['Rejected history', '却下履歴', '반려 기록', 'Abgelehnte Erkenntnisse', 'Historique des rejets', 'Historial de rechazos', 'История отклонений'],
  '没有已驳回记录。': ['No rejected lessons.', '却下した経験はありません。', '반려된 경험이 없습니다.', 'Keine abgelehnten Erkenntnisse.', 'Aucune leçon rejetée.', 'No hay lecciones rechazadas.', 'Отклонённых уроков нет.'],
  '搜索经验': ['Search lessons', '経験を検索', '경험 검색', 'Erkenntnisse suchen', 'Rechercher des leçons', 'Buscar lecciones', 'Поиск уроков'],
  '已选': ['Selected', '選択済み', '선택됨', 'Ausgewählt', 'Sélectionnées', 'Seleccionadas', 'Выбрано'],
  '批量采纳': ['Accept selected', '選択した候補を採用', '선택 항목 채택', 'Auswahl übernehmen', 'Accepter la sélection', 'Aceptar selección', 'Принять выбранные'],
  '批量驳回': ['Reject selected', '選択した候補を却下', '선택 항목 반려', 'Auswahl ablehnen', 'Rejeter la sélection', 'Rechazar selección', 'Отклонить выбранные'],
  '请只选择同范围、同主题的候选。': ['Select candidates with the same scope and topic.', '範囲とトピックが同じ候補を選択してください。', '범위와 주제가 같은 후보를 선택하세요.', 'Wählen Sie Kandidaten mit gleichem Geltungsbereich und Thema.', 'Sélectionnez des candidates de même portée et de même sujet.', 'Selecciona candidatas con el mismo alcance y tema.', 'Выберите кандидатов с одинаковой областью и темой.'],
  '全局经验会用于所有项目；我已核对并同意。': ['I’ve reviewed and approved use of this global lesson in every project.', 'このグローバルな経験を全プロジェクトで使うことを確認し、同意します。', '이 전역 경험을 모든 프로젝트에서 사용하는 것을 검토하고 승인합니다.', 'Ich habe die Verwendung in allen Projekten geprüft und stimme zu.', 'J’ai vérifié et approuvé l’utilisation de cette leçon dans tous les projets.', 'He revisado y aprobado el uso de esta lección global en todos los proyectos.', 'Я проверил и одобрил применение этого урока во всех проектах.'],
  '已完成所选候选的审阅。': ['Selected candidates reviewed.', '選択した候補のレビューが完了しました。', '선택한 후보의 검토를 완료했습니다.', 'Ausgewählte Kandidaten geprüft.', 'La sélection a été examinée.', 'Se revisaron las candidatas seleccionadas.', 'Выбранные кандидаты проверены.'],
  '显示': ['Showing', '表示', '표시', 'Angezeigt', 'Affichées', 'Mostrando', 'Показано'],
  '显示更多经验': ['Show more lessons', 'さらに経験を表示', '경험 더 보기', 'Weitere Erkenntnisse anzeigen', 'Afficher plus de leçons', 'Mostrar más lecciones', 'Показать ещё уроки'],
  '切换候选': ['Move between candidates', '候補を切り替え', '후보 이동', 'Zwischen Kandidaten wechseln', 'Parcourir les candidates', 'Ir de una candidata a otra', 'Переключать кандидатов'],
  '经验详情': ['Lesson details', '経験の詳細', '경험 상세 정보', 'Details zur Erkenntnis', 'Détail de la leçon', 'Detalles de la lección', 'Сведения об уроке'],
  '返回列表': ['Back to list', 'リストに戻る', '목록으로 돌아가기', 'Zurück zur Liste', 'Retour à la liste', 'Volver a la lista', 'К списку'],
  '选择一条经验': ['Select a lesson', '経験を選択', '경험을 선택하세요', 'Erkenntnis auswählen', 'Sélectionner une leçon', 'Selecciona una lección', 'Выберите урок'],
  '清空筛选': ['Clear filters', '絞り込みを解除', '필터 초기화', 'Filter zurücksetzen', 'Effacer les filtres', 'Borrar filtros', 'Сбросить фильтры'],
  '偏好': ['Preference', '好み', '선호', 'Präferenz', 'Préférence', 'Preferencia', 'Предпочтение'],
  '流程': ['Procedure', '手順', '절차', 'Vorgehen', 'Procédure', 'Procedimiento', 'Процедура'],
  '避坑': ['Pitfall', '注意点', '주의점', 'Stolperfalle', 'Piège', 'Riesgo habitual', 'Типичная ошибка'],
  '事实': ['Fact', '事実', '사실', 'Fakt', 'Fait', 'Hecho', 'Факт'],
  '自动整理': ['Auto collect', '自動整理', '자동 정리', 'Automatisch sammeln', 'Collecte automatique', 'Recogida automática', 'Автосбор'],
  '自动取回': ['Auto recall', '自動取得', '자동 가져오기', 'Automatisch abrufen', 'Rappel automatique', 'Recuperación automática', 'Автоизвлечение'],
  '自动记忆与预算': ['Automatic memory and limits', '自動メモリと上限', '자동 메모리 및 한도', 'Automatischer Speicher und Limits', 'Mémoire automatique et limites', 'Memoria automática y límites', 'Автопамять и лимиты'],
  '自动功能状态暂时无法读取，请刷新重试。': ['Automatic memory status is unavailable. Refresh to retry.', '自動メモリの状態を取得できません。更新してください。', '자동 메모리 상태를 읽을 수 없습니다. 새로 고침하세요.', 'Der Speicherstatus ist nicht verfügbar. Bitte aktualisieren.', 'État de la mémoire indisponible. Actualisez pour réessayer.', 'El estado no está disponible. Actualiza para volver a intentarlo.', 'Статус памяти недоступен. Обновите страницу.'],
  '现在整理待处理轮次': ['Consolidate queued turns now', '待機中のターンを今すぐ整理', '대기 중인 턴 지금 정리', 'Wartende Gesprächsrunden jetzt verarbeiten', 'Traiter les échanges en attente', 'Consolidar turnos en espera', 'Обработать очередь диалогов'],
  '立即整理': ['Collect now', '今すぐ整理', '지금 정리', 'Jetzt sammeln', 'Collecter', 'Recopilar ahora', 'Собрать сейчас'],
  '状态异常，请检查 DSH 日志。': ['Check the DSH logs for this status error.', '状態エラーです。DSH のログを確認してください。', '상태 오류입니다. DSH 로그를 확인하세요.', 'Prüfen Sie den Statusfehler in den DSH-Logs.', 'Consultez les journaux DSH pour cette erreur.', 'Consulta los registros de DSH para este error.', 'Проверьте ошибку состояния в журнале DSH.'],
  '当前宿主服务尚未就绪；手动工具仍可使用。': ['Manual tools are available while the host service starts.', 'ホストサービスの起動中は手動ツールを使用できます。', '호스트 서비스가 시작되는 동안 수동 도구를 사용할 수 있습니다.', 'Während des Dienststarts sind manuelle Werkzeuge verfügbar.', 'Les outils manuels sont disponibles pendant le démarrage du service.', 'Las herramientas manuales están disponibles mientras se inicia el servicio.', 'Ручные инструменты доступны, пока служба запускается.'],
  '正在整理': ['Consolidating', '整理中', '정리 중', 'Verarbeitung läuft', 'Consolidation', 'Consolidando', 'Обработка'],
  '全局默认已暂停；聊天独立设置仍生效': ['Global collection paused. Chat overrides are still active.', '全体の自動整理を一時停止中です。チャット個別設定は有効です。', '전역 정리가 일시 중지됐습니다. 채팅별 설정은 적용됩니다.', 'Globale Sammlung pausiert. Chat-Einstellungen gelten weiter.', 'Collecte globale en pause. Les réglages par chat restent actifs.', 'Recogida global en pausa. Siguen vigentes los ajustes de cada chat.', 'Глобальный сбор приостановлен. Настройки чатов действуют.'],
  '已就绪，等待符合条件的任务': ['Ready for a qualifying task', '準備完了。対象タスクを待っています', '조건에 맞는 작업 대기 중', 'Bereit für eine passende Aufgabe', 'Prêt pour une tâche admissible', 'Listo para una tarea que cumpla los criterios', 'Готово к подходящей задаче'],
  '今日模型调用': ['Model calls today', '今日のモデル呼び出し', '오늘 모델 호출', 'Modellaufrufe heute', 'Appels au modèle aujourd’hui', 'Llamadas al modelo hoy', 'Вызовы модели сегодня'],
  '调用冷却': ['Call cooldown', '呼び出しの待機時間', '호출 대기 시간', 'Wartezeit zwischen Aufrufen', 'Délai entre appels', 'Espera entre llamadas', 'Пауза между вызовами'],
  '秒': ['sec', '秒', '초', 'Sek.', 's', 's', 'с'],
  '待整理轮次': ['Queued turns', '待機中のターン', '대기 중인 턴', 'Wartende Gesprächsrunden', 'Échanges en attente', 'Turnos en espera', 'Диалоги в очереди'],
  '整理间隔': ['Idle delay', '整理までの待機時間', '정리 전 대기 시간', 'Wartezeit bei Inaktivität', 'Délai d’inactivité', 'Espera por inactividad', 'Пауза бездействия'],
  '单项目合并上限': ['Merge limit per project', 'プロジェクトごとの結合上限', '프로젝트별 병합 한도', 'Zusammenführungslimit je Projekt', 'Limite de fusion par projet', 'Límite de combinación por proyecto', 'Лимит объединения на проект'],
  '过期 / 超出容量': ['Expired / overflow', '期限切れ / 容量超過', '만료 / 초과', 'Abgelaufen / Überlauf', 'Expirés / excédent', 'Caducados / excedentes', 'Истекло / сверх лимита'],
  '单次输出上限': ['Output limit per call', '呼び出しごとの出力上限', '호출당 출력 한도', 'Ausgabelimit je Aufruf', 'Limite de sortie par appel', 'Límite de salida por llamada', 'Лимит вывода на вызов'],
  '沿用会话模型和整理预算。待处理片段最多保留 24 小时、32 轮。': ['Uses the session model and budget. Pending excerpts are kept for up to 24 hours and 32 turns.', 'セッションのモデルと予算を使用します。待機中の抜粋は最大24時間、32ターン保持します。', '세션 모델과 예산을 사용합니다. 대기 중인 발췌는 최대 24시간, 32턴 보관됩니다.', 'Verwendet Modell und Budget der Sitzung. Auszüge bleiben bis zu 24 Stunden und 32 Gesprächsrunden in der Warteschlange.', 'Utilise le modèle et le budget de la session. Les extraits en attente sont conservés jusqu’à 24 heures et 32 échanges.', 'Usa el modelo y presupuesto de la sesión. Los fragmentos se conservan hasta 24 horas y 32 turnos.', 'Использует модель и бюджет сессии. Фрагменты хранятся до 24 часов и 32 ходов.'],
  '最近检查': ['Last check', '最終チェック', '최근 확인', 'Letzte Prüfung', 'Dernier contrôle', 'Última comprobación', 'Последняя проверка'],
  '已检查': ['Checked', '確認済み', '확인됨', 'Geprüft', 'Contrôlé', 'Comprobado', 'Проверено'],
  '已保存新候选，等待审阅': ['Candidates saved for review', '候補を保存しました。レビュー待ちです', '후보를 저장했습니다. 검토 대기 중입니다', 'Kandidaten zur Prüfung gespeichert', 'Candidates enregistrées pour examen', 'Candidatas guardadas para revisión', 'Кандидаты сохранены на проверку'],
  '已合并重复经验': ['Duplicate lessons merged', '重複する経験を統合しました', '중복 경험을 병합했습니다', 'Doppelte Erkenntnisse zusammengeführt', 'Leçons en double fusionnées', 'Lecciones duplicadas combinadas', 'Повторяющиеся уроки объединены'],
  '没有可复用的新经验': ['No reusable lessons found', '再利用できる新しい経験がありません', '재사용할 새 경험이 없습니다', 'Keine wiederverwendbaren Erkenntnisse gefunden', 'Aucune leçon réutilisable trouvée', 'No se encontraron lecciones reutilizables', 'Новых уроков для повторного использования нет'],
  '普通闲聊，已跳过': ['Casual chat skipped', '雑談をスキップしました', '일상 대화를 건너뛰었습니다', 'Small Talk übersprungen', 'Discussion informelle ignorée', 'Charla informal omitida', 'Необязательный разговор пропущен'],
  '缺少可见来源，已跳过': ['Skipped because no source is available', '参照元がないためスキップしました', '출처가 없어 건너뛰었습니다', 'Ohne verfügbare Quelle übersprungen', 'Ignoré faute de source', 'Omitido por falta de fuentes', 'Пропущено из-за отсутствия источника'],
  '今天的整理预算已用完': ['Daily consolidation budget reached', '本日の整理上限に達しました', '오늘 정리 한도에 도달했습니다', 'Tageslimit für Verarbeitung erreicht', 'Limite de consolidation quotidienne atteinte', 'Se alcanzó el límite diario de consolidación', 'Дневной лимит обработки исчерпан'],
  '冷却中，轮次保留等待整理': ['Cooling down. Turns stay queued.', '待機時間中です。ターンはキューに残ります', '대기 시간입니다. 턴은 대기열에 유지됩니다', 'Wartezeit aktiv. Gesprächsrunden bleiben vorgemerkt.', 'Délai en cours. Les échanges restent en attente.', 'En espera. Se conservan los turnos pendientes.', 'Пауза. Диалоги остаются в очереди.'],
  '已加入队列，安静后合并整理': ['Queued for consolidation after inactivity', 'キューに追加しました。操作が止まると整理します', '대기열에 추가했습니다. 유휴 상태에서 정리합니다', 'Verarbeitung nach Inaktivität vorgemerkt', 'En attente de consolidation après inactivité', 'En cola para consolidar tras un periodo de inactividad', 'В очереди на обработку после периода бездействия'],
  '自动整理已暂停': ['Automatic collection paused', '自動整理を一時停止しました', '자동 정리가 일시 중지됐습니다', 'Automatische Sammlung pausiert', 'Collecte automatique en pause', 'Recogida automática en pausa', 'Автосбор приостановлен'],
  '任务未正常完成，已跳过': ['Unfinished task skipped', '完了していないタスクをスキップしました', '미완료 작업을 건너뛰었습니다', 'Unerledigte Aufgabe übersprungen', 'Tâche inachevée ignorée', 'Tarea incompleta omitida', 'Незавершённая задача пропущена'],
  '当前会话尚无可用模型': ['No model available for this session', 'このセッションで使えるモデルがありません', '이 세션에 사용 가능한 모델이 없습니다', 'Kein Modell für diese Sitzung verfügbar', 'Aucun modèle disponible pour cette session', 'No hay modelo disponible para esta sesión', 'Для этой сессии нет доступной модели'],
  '正在整理候选经验': ['Collecting candidate lessons', '経験の候補を整理中', '경험 후보 정리 중', 'Erkenntniskandidaten werden gesammelt', 'Collecte des leçons candidates', 'Recopilando lecciones candidatas', 'Сбор уроков-кандидатов'],
  '整理超时，本次已停止': ['Consolidation stopped after a timeout', 'タイムアウトのため整理を停止しました', '시간 초과로 정리를 중지했습니다', 'Verarbeitung nach Zeitüberschreitung beendet', 'Consolidation arrêtée après expiration du délai', 'Consolidación detenida por tiempo de espera', 'Обработка остановлена по тайм-ауту'],
  '已暂停辅助调用，未完成轮次保留': ['Auxiliary call stopped. Unfinished turns stay queued.', '補助呼び出しを停止しました。未完了ターンは残ります', '보조 호출을 중지했습니다. 미완료 턴은 유지됩니다', 'Zusatzaufruf beendet. Offene Runden bleiben in der Warteschlange.', 'Appel auxiliaire arrêté. Les échanges incomplets restent en attente.', 'Llamada auxiliar detenida. Se conservan los turnos pendientes.', 'Вспомогательный вызов остановлен. Незавершённые диалоги остаются в очереди.'],
  '已有新任务，旧轮次不再整理': ['Superseded by a newer task', '新しいタスクが始まったため整理を見送りました', '새 작업으로 인해 이전 턴 정리를 건너뛰었습니다', 'Durch eine neuere Aufgabe ersetzt', 'Remplacé par une tâche plus récente', 'Sustituido por una tarea más reciente', 'Заменено более новой задачей'],
  '模型返回失败或无法核验，请检查 DSH 模型连接': ['Model output failed or could not be verified. Check the DSH model connection.', 'モデル出力の失敗か検証エラーです。DSH の接続を確認してください', '모델 출력에 실패했거나 검증할 수 없습니다. DSH 연결을 확인하세요', 'Modellausgabe fehlgeschlagen oder nicht prüfbar. Prüfen Sie die DSH-Modellverbindung.', 'Sortie du modèle en échec ou non vérifiable. Vérifiez la connexion dans DSH.', 'La salida del modelo falló o no pudo verificarse. Revisa la conexión de DSH.', 'Вывод модели не получен или не проверен. Проверьте подключение в DSH.'],
  '内容超过预算，已跳过': ['Input exceeded the budget', '入力が上限を超えました', '입력이 한도를 초과했습니다', 'Eingabe überschreitet das Limit', 'Entrée au-delà de la limite', 'La entrada superó el límite', 'Входные данные превысили лимит'],
  '正在读取状态…': ['Loading status…', '状態を読み込み中…', '상태 불러오는 중…', 'Status wird geladen…', 'Chargement de l’état…', 'Cargando estado…', 'Загрузка статуса…'],
  '聊天记忆设置': ['Chat memory settings', 'チャットのメモリ設定', '채팅 메모리 설정', 'Chat-Speichereinstellungen', 'Mémoire de la discussion', 'Ajustes de memoria del chat', 'Настройки памяти чата'],
  '使用记忆': ['Use memory', 'メモリを使用', '메모리 사용', 'Speicher verwenden', 'Utiliser la mémoire', 'Usar memoria', 'Использовать память'],
  '贡献记忆': ['Contribute to memory', 'メモリに追加', '메모리에 추가', 'Zum Speicher beitragen', 'Alimenter la mémoire', 'Aportar a la memoria', 'Пополнять память'],
  '跟随全局': ['Follow global setting', '全体設定に従う', '전역 설정 따르기', 'Globale Einstellung übernehmen', 'Suivre le réglage global', 'Seguir el ajuste global', 'Как в общих настройках'],
  '仅此聊天开启': ['Enable for this chat', 'このチャットで有効', '이 채팅에서 활성화', 'In diesem Chat aktivieren', 'Activer pour cette discussion', 'Activar en este chat', 'Включить в этом чате'],
  '仅此聊天关闭': ['Disable for this chat', 'このチャットで無効', '이 채팅에서 비활성화', 'In diesem Chat deaktivieren', 'Désactiver pour cette discussion', 'Desactivar en este chat', 'Отключить в этом чате'],
  '两个选项独立保存；关闭贡献会移除该聊天尚未整理的片段，已有经验仍保留。': ['Settings are saved separately. Turning off contributions removes queued excerpts and keeps existing lessons.', '設定は個別に保存されます。追加を無効にすると待機中の抜粋が消え、既存の経験は残ります。', '설정은 별도로 저장됩니다. 추가를 끄면 대기 중인 발췌는 삭제되며 기존 경험은 유지됩니다.', 'Die Einstellungen werden getrennt gespeichert. Das Abschalten von Beiträgen löscht wartende Auszüge und behält bestehende Erkenntnisse.', 'Les réglages sont enregistrés séparément. Désactiver la contribution retire les extraits en attente et conserve les leçons.', 'Los ajustes se guardan por separado. Desactivar la aportación elimina los fragmentos pendientes y conserva las lecciones.', 'Настройки сохраняются отдельно. Отключение пополнения удаляет ожидающие фрагменты и сохраняет уроки.'],
  '显示与脱敏': ['Display and redaction', '表示とマスキング', '표시 및 마스킹', 'Anzeige und Maskierung', 'Affichage et masquage', 'Visualización y enmascarado', 'Отображение и маскирование'],
  '隐私模式': ['Privacy mode', 'プライバシーモード', '개인정보 보호 모드', 'Privatsphärenmodus', 'Mode confidentialité', 'Modo de privacidad', 'Режим приватности'],
  '隐私模式：开': ['Privacy mode on', 'プライバシーモード有効', '개인정보 보호 모드 켜짐', 'Privatsphärenmodus aktiv', 'Confidentialité activée', 'Privacidad activada', 'Приватность включена'],
  '隐私模式：显示层模糊；DOM 仍为明文，不改文件、不加密。点击卡片可临时查看。': ['Privacy mode blurs the display. Text stays in the DOM. Open a card to see it temporarily.', 'プライバシーモードは表示をぼかします。テキストは DOM に残ります。カードを開くと一時表示できます。', '개인정보 보호 모드는 표시를 흐리게 합니다. 텍스트는 DOM에 남습니다. 카드를 열어 일시적으로 볼 수 있습니다.', 'Der Privatsphärenmodus macht die Anzeige unscharf. Der Text bleibt im DOM. Eine Karte zeigt ihn vorübergehend an.', 'Le mode confidentialité floute l’affichage. Le texte reste dans le DOM. Ouvrez une carte pour le voir temporairement.', 'El modo de privacidad difumina la pantalla. El texto permanece en el DOM. Abre una tarjeta para verlo temporalmente.', 'Режим приватности размывает изображение. Текст остаётся в DOM. Откройте карточку для временного просмотра.'],
  '显示层模糊；DOM 仍为明文，不改文件、不加密': ['Blurs the display. The DOM keeps the text, and files stay intact.', '表示をぼかします。DOM のテキストとファイルはそのままです。', '표시를 흐리게 합니다. DOM 텍스트와 파일은 그대로 유지됩니다.', 'Macht die Anzeige unscharf. DOM-Text und Dateien bleiben bestehen.', 'Floute l’affichage. Le texte reste dans le DOM et les fichiers sont préservés.', 'Difumina la pantalla. El texto permanece en el DOM y los archivos se conservan.', 'Размывает изображение. Текст остаётся в DOM, файлы сохраняются.'],
  'maskSecrets 由插件配置管理，证据中的脱敏槽位可展开查看掩码。': ['Configure maskSecrets in the plugin. Expand a redaction marker to see its mask.', 'maskSecrets はプラグイン設定で管理します。マーカーを展開してマスクを表示できます。', '플러그인에서 maskSecrets를 설정합니다. 표시를 펼쳐 마스크를 확인할 수 있습니다.', 'Konfigurieren Sie maskSecrets im Plugin. Klappen Sie eine Markierung auf, um die Maske zu sehen.', 'Configurez maskSecrets dans le plugin. Développez un repère pour afficher le masque.', 'Configura maskSecrets en el complemento. Expande una marca para ver la máscara.', 'Настройте maskSecrets в плагине. Раскройте отметку, чтобы увидеть маску.'],
  '反向代理访问': ['Reverse proxy access', 'リバースプロキシアクセス', '리버스 프록시 액세스', 'Zugriff über Reverse Proxy', 'Accès par proxy inverse', 'Acceso por proxy inverso', 'Доступ через обратный прокси'],
  '代理来源与 Host 使用各自的白名单。通过插件配置管理：': ['Set the allowed proxy addresses and Host values in the plugin configuration.', '許可するプロキシアドレスと Host の値をプラグインで設定します。', '허용된 프록시 주소와 Host 값을 플러그인에 설정하세요.', 'Erlaubte Proxy-Adressen und Host-Werte lassen sich im Plugin einstellen.', 'Configurez les adresses de proxy et les valeurs Host autorisées dans le plugin.', 'Configura las direcciones del proxy y los valores de Host permitidos en el complemento.', 'Задайте допустимые адреса прокси и значения Host в конфигурации плагина.'],
  '日志与健康检查': ['Journal and health check', 'ログとヘルスチェック', '로그 및 상태 확인', 'Protokoll und Zustandsprüfung', 'Journal et diagnostic', 'Registro y diagnóstico', 'Журнал и диагностика'],
  '在 DSH 对话中运行 dream_health 检查日记和会话存储。': ['Run dream_health in a DSH chat to check journal and session storage.', 'DSH チャットで dream_health を実行し、日誌とセッションの保存先を確認します。', 'DSH 채팅에서 dream_health를 실행해 일지와 세션 저장소를 확인하세요.', 'Führen Sie dream_health im DSH-Chat aus, um Tagebuch- und Sitzungsspeicher zu prüfen.', 'Exécutez dream_health dans DSH pour vérifier le stockage du journal et des sessions.', 'Ejecuta dream_health en DSH para comprobar el almacenamiento del diario y las sesiones.', 'Выполните dream_health в чате DSH, чтобы проверить хранилище журнала и сессий.'],
  '复制检查命令': ['Copy health command', '確認コマンドをコピー', '상태 확인 명령 복사', 'Prüfbefehl kopieren', 'Copier la commande de diagnostic', 'Copiar comando de diagnóstico', 'Копировать команду проверки'],
  '预览规则变更': ['Preview rule changes', 'ルール変更をプレビュー', '규칙 변경 미리보기', 'Regeländerungen vorschauen', 'Aperçu des changements de règles', 'Vista previa de cambios en reglas', 'Предпросмотр изменений правил'],
  '复制项目预览命令': ['Copy project preview command', 'プロジェクトのプレビューコマンドをコピー', '프로젝트 미리보기 명령 복사', 'Projekt-Vorschaubefehl kopieren', 'Copier la commande d’aperçu du projet', 'Copiar comando de vista previa del proyecto', 'Копировать команду предпросмотра проекта'],
  '规则变更预览': ['Rule change preview', 'ルール変更のプレビュー', '규칙 변경 미리보기', 'Vorschau der Regeländerungen', 'Aperçu des changements de règles', 'Vista previa de los cambios de reglas', 'Предпросмотр изменений правил'],
  '取消预览': ['Cancel preview', 'プレビューをキャンセル', '미리보기 취소', 'Vorschau abbrechen', 'Annuler l’aperçu', 'Cancelar vista previa', 'Отменить предпросмотр'],
  '应用此变更': ['Apply this change', '変更を適用', '이 변경 적용', 'Änderung anwenden', 'Appliquer ce changement', 'Aplicar este cambio', 'Применить изменение'],
  '写入记录': ['Write history', '書き込み履歴', '쓰기 기록', 'Schreibverlauf', 'Historique des écritures', 'Historial de escrituras', 'Журнал записей'],
  '还没有写入记录': ['No rule writes yet', 'ルールの書き込みはまだありません', '아직 규칙 쓰기 기록이 없습니다', 'Noch keine Regeländerungen geschrieben', 'Aucune écriture de règles pour le moment', 'Aún no se han escrito reglas', 'Записей правил пока нет'],
  '回滚这次变更': ['Roll back this change', '変更をロールバック', '이 변경 롤백', 'Änderung zurücksetzen', 'Annuler ce changement', 'Revertir este cambio', 'Откатить изменение'],
  '取消回滚': ['Cancel rollback', 'ロールバックをキャンセル', '롤백 취소', 'Rücksetzung abbrechen', 'Annuler le rétablissement', 'Cancelar reversión', 'Отменить откат'],
  '确认回滚管理块': ['Confirm managed block rollback', '管理ブロックのロールバックを確定', '관리 블록 롤백 확인', 'Rücksetzung des verwalteten Blocks bestätigen', 'Confirmer le rétablissement du bloc géré', 'Confirmar reversión del bloque administrado', 'Подтвердить откат управляемого блока'],
  '可回滚': ['Can roll back', 'ロールバック可能', '롤백 가능', 'Rücksetzung möglich', 'Rétablissement possible', 'Reversión disponible', 'Откат доступен'],
  '不可回滚': ['Rollback unavailable', 'ロールバック不可', '롤백 불가', 'Rücksetzung nicht verfügbar', 'Rétablissement indisponible', 'Reversión no disponible', 'Откат недоступен'],
  '新建': ['Created', '作成', '생성됨', 'Erstellt', 'Créé', 'Creado', 'Создано'],
  '替换管理块': ['Replaced managed block', '管理ブロックを置換', '관리 블록 교체', 'Verwalteten Block ersetzt', 'Bloc géré remplacé', 'Bloque administrado reemplazado', 'Управляемый блок заменён'],
  '追加管理块': ['Appended managed block', '管理ブロックを追加', '관리 블록 추가', 'Verwalteten Block angehängt', 'Bloc géré ajouté', 'Bloque administrado añadido', 'Управляемый блок добавлен'],
  '未改动': ['Unchanged', '変更なし', '변경 없음', 'Unverändert', 'Inchangé', 'Sin cambios', 'Без изменений'],
  '回滚': ['Rolled back', 'ロールバック済み', '롤백됨', 'Zurückgesetzt', 'Rétabli', 'Revertido', 'Выполнен откат'],
  '搜索反思与教训…': ['Search reflections and takeaways…', '振り返りと学びを検索…', '회고 및 교훈 검색…', 'Reflexionen und Lehren suchen…', 'Rechercher réflexions et enseignements…', 'Buscar reflexiones y aprendizajes…', 'Поиск по заметкам и выводам…'],
  '筛选': ['Filter', '絞り込み', '필터', 'Filtern', 'Filtrer', 'Filtrar', 'Фильтр'],
  '筛选梦境': ['Filter dreams', '夢を絞り込む', '꿈 필터링', 'Träume filtern', 'Filtrer les rêves', 'Filtrar sueños', 'Фильтровать сны'],
  '只看有教训的梦': ['Only dreams with takeaways', '学びのある夢のみ', '교훈이 있는 꿈만', 'Nur Träume mit Lehren', 'Rêves avec des enseignements', 'Solo sueños con aprendizajes', 'Только сны с выводами'],
  '清空搜索': ['Clear search', '検索を消去', '검색 지우기', 'Suche zurücksetzen', 'Effacer la recherche', 'Borrar búsqueda', 'Сбросить поиск'],
  '完成': ['Done', '完了', '완료', 'Fertig', 'Terminé', 'Listo', 'Готово'],
  '梦境总数': ['Total dreams', '夢の総数', '전체 꿈', 'Träume insgesamt', 'Total des rêves', 'Total de sueños', 'Всего снов'],
  '时间跨度': ['Date range', '期間', '기간', 'Zeitraum', 'Période', 'Periodo', 'Период'],
  '最近一场': ['Latest dream', '最新の夢', '최근 꿈', 'Neuester Traum', 'Dernier rêve', 'Último sueño', 'Последний сон'],
  '心境': ['Mood', '気分', '기분', 'Stimmung', 'Humeur', 'Estado de ánimo', 'Настроение'],
  '教训榜': ['Takeaways', '学び', '교훈', 'Wichtigste Lehren', 'Enseignements', 'Aprendizajes', 'Выводы'],
  '常见教训': ['Frequent takeaway', 'よくある学び', '자주 나온 교훈', 'Häufige Lehre', 'Enseignement fréquent', 'Aprendizaje frecuente', 'Частый вывод'],
  '梦境时间线': ['Dream timeline', '夢のタイムライン', '꿈 타임라인', 'Traumchronik', 'Chronologie des rêves', 'Cronología de sueños', 'Хронология снов'],
  '筛选结果': ['Filtered results', '絞り込み結果', '필터 결과', 'Gefilterte Ergebnisse', 'Résultats filtrés', 'Resultados filtrados', 'Результаты фильтрации'],
  '搜索结果': ['Search results', '検索結果', '검색 결과', 'Suchergebnisse', 'Résultats de recherche', 'Resultados de búsqueda', 'Результаты поиска'],
  '显示更早的梦': ['Show older dreams', '古い夢を表示', '이전 꿈 보기', 'Ältere Träume anzeigen', 'Afficher les rêves plus anciens', 'Mostrar sueños anteriores', 'Показать более ранние сны'],
  '展开全文': ['Expand full text', '全文を表示', '전체 텍스트 펼치기', 'Volltext anzeigen', 'Développer le texte', 'Expandir texto completo', 'Развернуть текст'],
  '全部梦境日记': ['All dreams', 'すべての夢', '모든 꿈', 'Alle Träume', 'Tous les rêves', 'Todos los sueños', 'Все сны'],
  '这次有用': ['Useful this time', '今回は役に立った', '이번에 유용함', 'Diesmal hilfreich', 'Utile cette fois', 'Útil esta vez', 'В этот раз полезно'],
  '这次不适用': ['Not applicable this time', '今回は適用外', '이번에는 적용 불가', 'Diesmal nicht anwendbar', 'Non applicable cette fois', 'Esta vez no se aplica', 'В этот раз не применимо'],
  '场景备注（可选）': ['Context note (optional)', '状況メモ（任意）', '상황 메모(선택)', 'Kontextnotiz (optional)', 'Note de contexte (facultative)', 'Nota de contexto (opcional)', 'Заметка о контексте (необязательно)'],
  '反馈场景备注': ['Feedback context', 'フィードバックの状況', '피드백 상황', 'Kontext der Rückmeldung', 'Contexte de l’avis', 'Contexto del comentario', 'Контекст отзыва'],
  '这次在哪个场景使用…': ['Where did you use this lesson?…', 'どのような状況で使いましたか…', '어떤 상황에서 사용했나요…', 'In welchem Kontext haben Sie sie verwendet?…', 'Dans quel contexte l’avez-vous utilisée ?…', '¿En qué situación la usaste?…', 'Где вы применили этот урок?…'],
  '使用反馈 · 有用 ': ['Feedback · useful ', '使用感 · 役に立った ', '사용 피드백 · 유용함 ', 'Rückmeldung · hilfreich ', 'Avis · utile ', 'Comentarios · útil ', 'Отзывы · полезно '],
  ' · 不适用 ': [' · not applicable ', ' · 適用外 ', ' · 적용 불가 ', ' · nicht anwendbar ', ' · non applicable ', ' · no se aplica ', ' · не применимо '],
  '有用': ['Useful', '役に立った', '유용함', 'Hilfreich', 'Utile', 'Útil', 'Полезно'],
  '不适用': ['Not applicable', '適用外', '적용 불가', 'Nicht anwendbar', 'Non applicable', 'No se aplica', 'Не применимо'],
  '还没有梦境日记': ['No dreams yet', '夢の日誌はまだありません', '아직 꿈 일지가 없습니다', 'Noch keine Träume', 'Pas encore de rêves', 'Aún no hay sueños', 'Снов пока нет'],
  '有 ': ['With ', 'あり ', '있음 ', 'Mit ', 'Avec ', 'Con ', 'С '],
  '做个梦': ['Have a dream', '夢を見て振り返って', '꿈을 꾸며 회고해 줘', 'Träume und reflektiere', 'Fais un rêve et fais le bilan', 'Ten un sueño y reflexiona', 'Сделай запись сна и подведи итоги'],
  '复制「做个梦」': ['Copy “Have a dream”', '「夢を見て」をコピー', '「꿈꾸기」 프롬프트 복사', '„Träume“-Prompt kopieren', 'Copier « Fais un rêve »', 'Copiar «Ten un sueño»', 'Скопировать запрос сна'],
  '复盘最近的对话并提炼可复用的项目经验': [
    'Review our recent conversation and distill reusable project lessons',
    '最近の会話を振り返り、再利用できるプロジェクトの経験を整理して',
    '최근 대화를 복기하고 재사용 가능한 프로젝트 경험을 정리해 줘',
    'Überprüfe unser letztes Gespräch und arbeite wiederverwendbare Projekterkenntnisse heraus',
    'Fais le bilan de nos échanges récents et extrais des leçons de projet réutilisables',
    'Revisa nuestra conversación reciente y extrae lecciones reutilizables del proyecto',
    'Проанализируй недавний диалог и выдели переиспользуемые уроки проекта',
  ],
  '复制复盘提炼指令': ['Copy distill prompt', '振り返り指示をコピー', '복기 프롬프트 복사', 'Reflexions-Prompt kopieren', 'Copier l’invite de bilan', 'Copiar instrucción de revisión', 'Скопировать запрос ретроспективы'],
  '已复制指令，粘贴到对话发送即可': ['Prompt copied — paste into chat', 'コピーしました。チャットに貼り付けて送信してください', '복사됨 — 채팅에 붙여넣어 보내세요', 'Kopiert — im Chat einfügen', 'Copié — collez dans le chat', 'Copiado — pégalo en el chat', 'Скопировано — вставьте в чат'],
  '复制失败': ['Copy failed', 'コピー失敗', '복사 실패', 'Kopieren fehlgeschlagen', 'Échec de la copie', 'Error al copiar', 'Не удалось скопировать'],
  '前往设置': ['Open Settings', '設定を開く', '설정 열기', 'Einstellungen öffnen', 'Ouvrir les paramètres', 'Ir a Ajustes', 'Открыть настройки'],
  '查看已采纳': ['View Accepted', '採用済みを見る', '채택됨 보기', 'Übernommene ansehen', 'Voir les leçons acceptées', 'Ver Aceptadas', 'Открыть принятые'],
  '查看待审阅': ['View Awaiting review', 'レビュー待ちを見る', '검토 대기 보기', 'Zu prüfen ansehen', 'Voir À examiner', 'Ver Por revisar', 'Открыть на проверке'],
  '查看待审阅经验': ['View Awaiting review', 'レビュー待ちの経験を見る', '검토 대기 경험 보기', 'Zu prüfende Erkenntnisse ansehen', 'Voir les leçons à examiner', 'Ver lecciones por revisar', 'Посмотреть уроки на проверке'],
  '完成实际任务后，开启「自动整理」或在对话里让助手复盘，提炼出的候选经验会先进入这里等你核对证据与范围。': [
    'After real tasks finish, Auto collect (or asking the assistant to reflect in chat) distills candidate lessons here so you can verify sources and scope before adoption.',
    '実務タスク完了後、「自動整理」またはチャットでの振り返り指示で抽出された候補がここに入り、出典と適用範囲を確認できます。',
    '실제 작업 완료 후 「자동 정리」 또는 채팅 복기 요청으로 추출된 후보 경험이 이곳에 모이며, 출처와 범위를 검토할 수 있습니다.',
    'Nach echten Aufgaben landen automatisch oder per Chat-Reflexion extrahierte Kandidaten hier zur Prüfung von Quellen und Geltungsbereich.',
    'Après une tâche réelle, la collecte auto ou une demande de bilan envoie ici les leçons candidates pour vérifier sources et portée.',
    'Tras completar tareas reales, la recogida automática o pedir una revisión en el chat envía aquí las candidatas para verificar fuentes y alcance.',
    'После реальных задач автосбор или запрос ретроспективы в чате помещает сюда кандидатов для проверки источников и области применения.',
  ],
  '已采纳的经验会在后续相关任务中自动作为参考取回，也可预览写入项目 AGENTS.md。': [
    'Accepted lessons are recalled automatically in matching tasks and can be previewed before writing to AGENTS.md.',
    '採用済みの経験は関連タスクで自動的に参照され、プレビュー後に AGENTS.md へ書き込めます。',
    '채택된 경험은 관련 작업에서 자동으로 참조되며 미리보기 후 AGENTS.md에 기록할 수 있습니다.',
    'Übernommene Erkenntnisse werden bei passenden Aufgaben abgerufen und können mit Vorschau in AGENTS.md geschrieben werden.',
    'Les leçons acceptées sont rappelées dans les tâches pertinentes et peuvent être prévisualisées avant écriture dans AGENTS.md.',
    'Las lecciones aceptadas se recuperan en tareas relacionadas y pueden previsualizarse antes de escribirse en AGENTS.md.',
    'Принятые уроки автоматически подтягиваются в подходящих задачах и могут быть записаны в AGENTS.md после предпросмотра.',
  ],
  '等待新的候选经验': ['Ready for candidate lessons', '新しい経験候補を待機中', '새 후보 경험 대기 중', 'Bereit für neue Kandidaten', 'En attente de nouvelles candidates', 'Esperando nuevas candidatas', 'Ожидание новых кандидатов'],
  '候选经验绝不会自动生效——每条都会展示会话原文来源、适用条件与范围，由你决定采纳或丢弃。': [
    'Candidates never take effect automatically — each shows its session source, conditions, and scope so you decide what to accept or discard.',
    '候補が自動適用されることはありません。会話の出典・条件・範囲を確認し、採用または破棄をあなたが決めます。',
    '후보는 절대 자동 적용되지 않습니다. 대화 원문 출처·조건·범위를 확인한 뒤 채택 여부를 직접 결정하세요.',
    'Kandidaten werden nie automatisch aktiv — jede zeigt Quelle, Bedingungen und Umfang, damit Sie über Annahme oder Verwerfen entscheiden.',
    'Aucune candidate ne s’applique d’office : chacune affiche sa source, ses conditions et sa portée avant votre décision.',
    'Las candidatas nunca se activan solas: cada una muestra su fuente, condiciones y alcance para que decidas si aceptarla o descartarla.',
    'Кандидаты никогда не применяются автоматически: для каждого показаны источник, условия и область применения.',
  ],
  '引导': ['Tour', 'ガイド', '가이드', 'Tour', 'Guide', 'Guía', 'Гид'],
  '使用引导': ['Interactive guide', '使い方ガイド', '사용 가이드', 'Kurzanleitung', 'Guide interactif', 'Guía interactiva', 'Интерактивный гид'],
  '跳过': ['Skip', 'スキップ', '건너뛰기', 'Überspringen', 'Passer', 'Omitir', 'Пропустить'],
  '上一步': ['Back', '戻る', '이전', 'Zurück', 'Précédent', 'Anterior', 'Назад'],
  '下一步': ['Next', '次へ', '다음', 'Weiter', 'Suivant', 'Siguiente', 'Далее'],
  '完成引导': ['Done', '完了', '완료', 'Fertig', 'Terminer', 'Listo', 'Готово'],
  '开启自动整理与自动召回': [
    'Enable auto-collect & recall',
    '自動整理と自動参照をオンにする',
    '자동 정리 및 자동 회상 켜기',
    'Autosammlung & Abruf aktivieren',
    'Activer collecte et rappel auto',
    'Activar recogida y recuerdo auto',
    'Автосбор и автоприменение',
  ],
  '日常排障或写代码时保持开启，空闲时会自动从真实会话提取候选经验，无需手动记笔记。': [
    'Leave Auto collect on while debugging or coding — idle turns extract candidate lessons from real sessions automatically.',
    '普段の作業中にオンにしておくと、待機中に実際の会話から経験候補を自動抽出します。',
    '평소 디버깅·개발 중 켜 두면 유휴 시간에 실제 대화에서 후보 경험을 자동 추출합니다.',
    'Lassen Sie die Autosammlung beim Arbeiten aktiv — im Leerlauf werden Kandidaten automatisch extrahiert.',
    'Gardez la collecte auto active pendant vos tâches : les candidates sont extraites automatiquement au repos.',
    'Déjalo activo mientras trabajas: en reposo extraerá candidatas automáticamente de tus sesiones reales.',
    'Оставьте включённым во время работы: в простое кандидаты автоматически извлекаются из реальных сессий.',
  ],
  '立即整理或发一句「做个梦」': [
    'Distill now or send “Have a dream”',
    '今すぐ整理、または「夢を見る」と送信',
    '지금 정리하거나 「꿈꾸기」 보내기',
    'Sofort ordnen oder „Träum kurz“ senden',
    'Trier maintenant ou envoyer « Fais un rêve »',
    'Organizar ahora o enviar «Ten un sueño»',
    'Разобрать сейчас или отправить «Приснись сон»',
  ],
  '点这里立即整理待处理轮次；也可在下方一键复制指令发到聊天，让助手复盘最近对话并写下反思日记。': [
    'Click here to process queued turns immediately, or copy the prompt below into chat to replay recent sessions and write a journal.',
    'ここを押すと未処理ターンを即時整理します。下の指示をチャットに送って振り返り日誌を書くこともできます。',
    '여기를 눌러 대기 중인 턴을 즉시 정리하거나, 아래 명령을 복사해 채팅에 보내 회고 일지를 작성하세요.',
    'Hier klicken, um ausstehende Runden sofort zu verarbeiten, oder den Prompt unten für ein Tagebuch in den Chat kopieren.',
    'Cliquez ici pour traiter les tours en attente, ou copiez l’invite ci-dessous dans le chat pour rédiger un journal.',
    'Haz clic aquí para procesar turnos pendientes al instante, o copia la instrucción abajo en el chat para crear un diario.',
    'Нажмите здесь для немедленного разбора очереди или скопируйте запрос ниже в чат для записи дневника.',
  ],
  '先核对原文证据，再确认采纳': [
    'Verify source evidence before adopting',
    '出典の証拠を確認してから採用',
    '원문 근거를 확인한 뒤 채택',
    'Quellen prüfen und erst dann übernehmen',
    'Vérifier les preuves avant d’adopter',
    'Verificar la evidencia antes de adoptar',
    'Проверьте источники перед принятием',
  ],
  '所有候选默认扣留在「待审阅」，展示原话出处、适用范围与密钥脱敏预览；只有你点「确认采纳」才会真正生效。': [
    'Every candidate waits in Awaiting review with exact session quotes, scope, and secret redaction — nothing takes effect until you confirm.',
    'すべての候補は「レビュー待ち」に保留され、発言の出典・範囲・マスク結果を確認して採用するまで有効になりません。',
    '모든 후보는 「검토 대기」에 보류되며 원문 출처·범위·민감정보 마스킹을 확인하고 채택해야만 실제 적용됩니다.',
    'Alle Kandidaten warten unter „Zu prüfen“ mit Originalzitat, Bereich und Schwärzung — aktiv wird nur, was Sie bestätigen.',
    'Chaque candidate reste dans « À examiner » avec citation source, portée et masquage jusqu’à votre confirmation.',
    'Toda candidata espera en «Por revisar» con cita original, alcance y censura de claves hasta que confirmes su adopción.',
    'Все кандидаты удерживаются в «На проверке» с цитатами, областью и маскировкой секретов до вашего подтверждения.',
  ],
  '预览写入 AGENTS.md 与一键回滚': [
    'Preview writes to AGENTS.md & rollback',
    'AGENTS.md への差分書き込みとロールバック',
    'AGENTS.md 미리보기 반영 및 롤백',
    'Vorschau für AGENTS.md & Rollback',
    'Aperçu vers AGENTS.md et annulation',
    'Vista previa en AGENTS.md y reversión',
    'Предпросмотр записи в AGENTS.md и откат',
  ],
  '在「已采纳」可将经验生成差异预览写入项目 AGENTS.md，每次写入都记录在「规则记录」中并支持随时回滚。': [
    'Turn accepted lessons into diff-previewed AGENTS.md rules, with full audit history and one-click rollback in Rule history.',
    '採用した経験は差分プレビュー付きで AGENTS.md に反映でき、「ルール履歴」からいつでも安全にロールバックできます。',
    '채택된 경험은 diff 미리보기로 AGENTS.md에 반영할 수 있으며, 「규칙 기록」에서 언제든 안전하게 롤백할 수 있습니다.',
    'Übernommene Lehren lassen sich mit Diff-Vorschau in AGENTS.md schreiben und im „Regelverlauf“ jederzeit zurückrollen.',
    'Les leçons adoptées peuvent être écrites dans AGENTS.md après aperçu diff, avec retour arrière dans « Historique des règles ».',
    'Las lecciones adoptadas pueden escribirse en AGENTS.md tras ver el diff, con reversión segura en «Historial de reglas».',
    'Принятые уроки можно записать в AGENTS.md после просмотра diff и в любой момент откатить в «Истории правил».',
  ],
};

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

function DreamCoachmarkTour({ rootRef, tabId, activeTab, changeTab, skin, font, step, manual, layout: rawLayout, setLayout, onStep, onClose }) {
  const layerRef = useRef(null);
  const cardRef = useRef(null);
  const nextBtnRef = useRef(null);
  const titleId = (typeof useId === 'function' ? useId() : 'dream-tour') + '-title';
  const [copiedTourPrompt, setCopiedTourPrompt] = useState(false);
  const tabSelector = suffix => '[id="' + String(tabId || '').replace(/["\\]/g, '\\$&') + '-' + suffix + '"]';
  const steps = [
    {
      id: 'auto',
      selector: '[data-tour="dream-auto"]',
      fallback: tabSelector('review'),
      side: 'right',
      title: t('开启自动整理与自动召回'),
      desc: t('日常排障或写代码时保持开启，空闲时会自动从真实会话提取候选经验，无需手动记笔记。'),
    },
    {
      id: 'flush',
      selector: '[data-tour="dream-flush"]',
      side: 'bottom',
      title: t('立即整理或发一句「做个梦」'),
      desc: t('点这里立即整理待处理轮次；也可在下方一键复制指令发到聊天，让助手复盘最近对话并写下反思日记。'),
      prompt: t('做个梦'),
      promptLabel: t('复制「做个梦」'),
    },
    {
      id: 'review',
      selector: '[data-tour="dream-list"]',
      fallback: tabSelector('review'),
      side: 'right',
      title: t('先核对原文证据，再确认采纳'),
      desc: t('所有候选默认扣留在「待审阅」，展示原话出处、适用范围与密钥脱敏预览；只有你点「确认采纳」才会真正生效。'),
    },
    {
      id: 'bridge',
      selector: tabSelector('bridge'),
      fallback: '[data-tour="dream-tabs"]',
      side: 'bottom',
      title: t('预览写入 AGENTS.md 与一键回滚'),
      desc: t('在「已采纳」可将经验生成差异预览写入项目 AGENTS.md，每次写入都记录在「规则记录」中并支持随时回滚。'),
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
    function measure() {
      const scope = rootRef?.current || (typeof document !== 'undefined' ? document : null);
      if (!scope || typeof scope.querySelector !== 'function') return;
      const target = safeTourQuery(scope, current.selector) || safeTourQuery(scope, current.fallback);
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

function MemoryDetail({ row, base, privacy, reviewMode, onChanged, onExit, batchPending }) {
  const [peek, setPeek] = useState(false);
  const [diffOpen, setDiffOpen] = useState(false);
  const masked = privacy && !peek;
  const previous = base ? normalizeKnowledge({ lessons: [base] }, new Date(), 1).rows[0] : null;
  const canCompare = previous || (reviewMode && row.revision >= 1);
  const compareLabel = previous ? t('修订对比') : t('审阅变更预览');
  const sourcesRead = row.evidence.length > 0 && row.evidence.every(source => source.verification === 'read');
  const toolbar = h('div', { className: css.meta },
    h(ScopeBadge, { row }),
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
      h('div', { className: css.privateText },
        h(ReviewBlock, { index: 0, title: t('建议行动') },
          h('h2', { tabIndex: -1, 'data-dream-detail-title': true, 'data-dsh-editorial-heading': '', 'data-dsh-serif': '', className: css.inspectorTitle }, row.title),
          h('p', null, row.action || t('未标注具体动作'))),
        h(ReviewBlock, { index: 1, title: t('来源与证据') },
          row.evidence.length ? row.evidence.map(source => h('div', { key: source.id, className: css.evidence },
            h('blockquote', { className: css['evidence-quote'] }, h(EvidenceText, { text: source.summary || t('未提供摘要') })),
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
        h(ReviewBlock, { index: 2, title: t('范围、条件与例外') },
          h('dl', { className: css.scopeFacts },
            h('dt', null, t('适用范围')), h('dd', null, row.scopeLabel),
            h('dt', null, t('适用条件')), h('dd', null, row.when || t('未标注适用条件')),
            row.applicability ? h(React.Fragment, null, h('dt', null, t('适用环境')), h('dd', null, row.applicability)) : null,
            h('dt', null, t('例外与补充')), h('dd', null, row.exceptions.length ? row.exceptions.join(' · ') : t('未记录例外'))),
          h('p', { className: css.muted, title: row.lastTitle }, t('最近核验：') + row.lastText),
          row.lastRetrievedAt ? h('p', { className: css.muted, title: t('取回仅表示提供参考，不等于重新核验。') }, t('最近取回：') + formatDate(row.lastRetrievedAt) + ' ' + formatTime(row.lastRetrievedAt)) : null)),
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

function MemoryBoard({ vm, revisions, reviewMode, error, loading, privacy, onChanged, onRetry, moveRef, automation, onNavigateTab }) {
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
  const batchLock = useRef(false);
  const copyTimerRef = useRef(null);
  const splitRef = useRef(null);
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
    return Array.from(listRef.current?.querySelectorAll?.('[data-dream-row]') || []).find(node => node.dataset.dreamRow === id);
  }
  function select(row, focus = true) {
    focusNext.current = focus;
    setActiveId(row.id);
  }
  useLayoutEffect(() => {
    if (!focusNext.current) return;
    focusNext.current = false;
    if (detailRef.current?.getClientRects?.().length && !listRef.current?.getClientRects?.().length) {
      if (splitRef.current?.parentElement) splitRef.current.parentElement.scrollTop = 0;
      detailRef.current.querySelector?.('[data-dream-detail-title]')?.focus({ preventScroll: true });
    } else if (active) {
      const node = rowNode(active.id);
      node?.querySelector?.('button')?.focus({ preventScroll: true });
      node?.scrollIntoView?.({ block: 'nearest' });
    }
  }, [activeId, active?.id, limit]);
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
      else rowNode(rows[next].id)?.scrollIntoView?.({ block: 'nearest' });
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
        key: active.id, row: active, base: revisions.get(active.id), privacy, reviewMode, onChanged, batchPending: pending,
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
    'data-dsh-card': '',
    style: { '--stagger-idx': index }, ...spotlightHandlers,
  }, h('h2', { 'data-dsh-serif': '' }, title), children);
}

function DreamSettings({ automation, privacy, onPrivacyChange, onReview, skin, setSkin }) {
  const [chatId, setChatId] = useState('');
  const { value, pending, failure, change, canFlush } = automation;
  const chats = value?.sessions || [];
  const chat = chats.find(row => row.sessionId === chatId) || chats[0];
  const lastDate = Number.isFinite(value?.last?.at) ? new Date(value.last.at).toISOString() : '';
  const interval = Math.ceil(Math.max(0, Number(value?.cooldownMinutes) || 0) * 60);
  const format = new Intl.NumberFormat(languageOf());
  const styleOptions = DSH_STYLES.map(preset => ({
    value: preset.id,
    label: t(preset.zhShort),
    title: t(preset.zh),
  }));
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
          h(W.Button, { icon: 'sparkle', spinning: Boolean(value.running), variant: 'primary', disabled: !canFlush, onClick: () => change({ operation: 'automatic-flush' }) }, t('现在整理待处理轮次')),
          h(W.Button, { onClick: onReview }, t('待审阅') + ' · ' + format.format(value.candidates ?? 0)))) :
        failure ? null : h(W.Skeleton, { variant: 'text', lines: 3, label: t('正在读取状态…') })),
    chat ? h(SettingCard, { title: t('聊天记忆设置'), index: 1 },
      h('label', { className: css.scopePicker, htmlFor: 'dream-settings-session' }, t('会话'), h('select', {
        id: 'dream-settings-session', value: chat.sessionId, disabled: pending, onChange: event => setChatId(event.target.value),
      }, chats.map(row => h('option', { key: row.sessionId, value: row.sessionId }, (row.cwd || '') + ' · ' + row.sessionId.slice(0, 8))))),
      [['use', '使用记忆'], ['contribute', '贡献记忆']].map(([key, label]) => h('label', {
        className: css.scopePicker, key, htmlFor: 'dream-settings-chat-' + key,
      }, t(label), h('select', {
        id: 'dream-settings-chat-' + key,
        disabled: pending, value: chat[key] == null ? 'inherit' : String(chat[key]),
        onChange: event => change({ operation: 'automatic-chat', sessionId: chat.sessionId,
          [key]: event.target.value === 'inherit' ? null : event.target.value === 'true' }),
      }, h('option', { value: 'inherit' }, t('跟随全局')),
      h('option', { value: 'true' }, t('仅此聊天开启')),
      h('option', { value: 'false' }, t('仅此聊天关闭'))))),
      h('p', { className: css.muted }, t('两个选项独立保存；关闭贡献会移除该聊天尚未整理的片段，已有经验仍保留。'))) : null,
    h(SettingCard, { title: t('显示与脱敏'), index: 2 },
      h('div', { className: css.scopePicker },
        h('span', null, t('界面风格')),
        h(W.SegmentedControl, {
          id: 'dream-settings-style',
          label: t('界面风格'),
          value: skin,
          options: styleOptions,
          onChange: setSkin,
        })),
      h('label', { className: css.scopePicker, htmlFor: 'dream-settings-language' }, t('界面语言'), h('select', {
        id: 'dream-settings-language', 'aria-label': t('界面语言'), value: dreamLanguage, onChange: event => setDreamLanguage(event.target.value),
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

        // Interface language follows DSH; user content and stored records keep their original text.
        let localeService;
        const EN = Object.freeze({
            '已到复核时间': 'Review deadline reached',
            '最近取回：': 'Last retrieved: ',
            '取回仅表示提供参考，不等于重新核验。': 'Retrieval means reference exposure, not renewed verification.',
            '偏好': 'Preference', '流程': 'Procedure', '避坑': 'Pitfall', '事实': 'Fact',
            '项目与主题': 'Project and topic', '全部待核实': 'All awaiting review',
            '批量采纳': 'Accept selected', '批量驳回': 'Reject selected',
            '全局经验会用于所有项目；我已核对并同意。': 'Global memory applies to every project. I have reviewed and agree to this scope.',
            '仅用户确认采纳的经验会自动复用；模型只能建议采纳。': 'Only lessons accepted by you are reused automatically. The model can recommend acceptance.',
            '需要你确认采纳：请先核对来源与适用范围': 'Your acceptance is required. Check the sources and scope first.',
            '选中候选：': 'Select candidate: ', '已完成所选候选的审阅。': 'Selected candidates reviewed.',
            '先展开核对来源、条件与例外；只批量处理同范围、同主题且无冲突的候选。': 'Expand sources, conditions and exceptions first. Batch review requires candidates with the same scope and topic and no conflicts.',
            "自动整理的内容在「经验」页待审阅；日记可让助手复盘时单独生成。": "Automatically collected lessons await review in Lessons. Ask the assistant to reflect when you want a separate journal entry.",
            "查看待审阅经验": "Review candidate lessons",
            "请求失败（HTTP ": "Request failed (HTTP ",
            "服务器返回的不是 JSON（HTTP ": "The server did not return JSON (HTTP ",
            "登录状态已失效，请重新打开 DSH 页面后重试。": "Your session has expired. Reopen DSH and try again.",
            "当前宿主尚未提供此操作，请升级 DSH，或使用下方对话命令。": "This host does not support this action. Update DSH or use the chat command below.",
            "候选（未采纳）": "Candidate (not accepted)",
            "可用": "Usable",
            "有冲突": "Disputed",
            "待复核": "Needs review",
            "已驳回": "Rejected",
            "未知状态": "Unknown state",
            "平台 ": "Platform ",
            "；等 ": "; and ",
            " 条适用范围": " more conditions",
            "范围未标注": "Scope not specified",
            "暂无可展示的证据摘要": "No evidence summary available",
            "尚未核验": "Not verified yet",
            "没有 lastValidatedAt（从未核验）": "No lastValidatedAt (never verified)",
            "未加载的经验（": "Lesson not loaded (",
            "共 ": "Total: ",
            " 条": " records",
            "还没有经验": "No lessons yet",
            "日志过大，仅回放最近一段事件": "The log is large; only recent events were replayed",
            "有 ": "",
            " 行损坏已跳过": " damaged lines were skipped",
            "；events.jsonl 未改动。": "; events.jsonl was preserved.",
            "还没有经验记录": "No lesson records yet",
            "经验是带证据、有适用条件的技术结论：收尾时用 dream_learn 提交候选，证据足够、范围明确的会出现在这里。": "Lessons are technical conclusions with evidence and conditions. Submit a candidate with dream_learn; records with sufficient evidence and a clear scope appear here.",
            "旧日记里的教训不会自动升级为经验；采纳、驳回或标记冲突请用 dream_review。": "Journal observations do not become lessons automatically. Use dream_review to accept, reject or flag conflicts.",
            "已驳回：不参与默认检索与注入": "Rejected: excluded from default retrieval and injection",
            "待复核：条件或依赖可能已过期，默认不注入": "Needs review: conditions or dependencies may be outdated; not injected by default",
            "冲突未解决：默认不注入，先 resolve-conflict": "Unresolved conflict: not injected by default; use resolve-conflict first",
            "候选：可被检索到，但默认不作为任务建议注入": "Candidate: retrievable, but not injected as task advice by default",
            "证据不足：没有独立证据，默认不注入": "Insufficient independent evidence: not injected by default",
            "版本不匹配：当前依赖版本不满足适用范围": "Version mismatch: the dependency version is outside the applicable range",
            "超出条数预算，本次未取回": "Not retrieved: record limit reached",
            "超出字符预算：按排名整条装入，遇到第一条放不下即停": "Character limit reached: complete records are added by rank until the next one cannot fit",
            "超出字符预算，本次未取回": "Not retrieved: character limit reached",
            "新建": "Created",
            "替换管理块": "Replaced managed block",
            "追加管理块": "Appended managed block",
            "未改动": "Unchanged",
            "回滚": "Rolled back",
            "未知动作": "Unknown action",
            "时间未知": "Unknown time",
            "没有记录时间": "No timestamp recorded",
            "目标未记录": "Target not recorded",
            "没有经验引用": "No lesson references",
            "可回滚": "Rollback available",
            "不可回滚": "Rollback unavailable",
            "还没有写入记录": "No rule changes yet",
            "写入记录来自 dream_bridge 的 preview → apply；面板只读展示目标、时间、经验 revision 与前后哈希，不会写文件。": "Changes are recorded by dream_bridge preview → apply. This log shows the target, time, lesson revisions and before/after hashes.",
            "在可桥接经验行点「复制预览命令」，回到对话里执行；写操作只在工具中完成。": "Preview an eligible project lesson, review the changes and apply them. Chat commands are also available.",
            "没有待核实的经验 —— 候选、有冲突、待复核的经验会出现在这里，并写明被扣下的原因。": "Candidates, disputed lessons and lessons needing review appear here, with an explanation of why they are held.",
            "刚刚": "Just now",
            " 分钟前": " min ago",
            " 小时前": " h ago",
            " 天前": " days ago",
            "今天": "Today",
            "昨天": "Yesterday",
            "筛选后 ": "Filtered: ",
            " 场": " dreams",
            "」命中 ": "” matches ",
            " 场梦": " dreams",
            "筛选当前已加载的 ": "Filtering the ",
            " 场 · 命中 ": " loaded dreams · Matches: ",
            "新梦在前": "Newest first",
            "（已达路由上限）": " (route limit reached)",
            "最近 ": "Recent: ",
            " 场 / 共 ": " dreams / Total: ",
            "新梦在前 · 最多显示 ": "Newest first · Up to ",
            "搜索结果 · 最多显示 ": "Search results · Up to ",
            "本页内最近 ": "Most recent on this page: ",
            "（统计未给 lastAt，按本页已加载的 ": "(lastAt is missing; calculated from the ",
            " 场现算）": " dreams loaded on this page)",
            "同一天": "Same day",
            "约 ": "About ",
            " 天": " days",
            "第 1 场梦 · ": "First dream · ",
            " · 心境「": " · Mood: “",
            " 场梦 · 本页最近 ": " dreams · Loaded: ",
            "最近：": "Latest: ",
            "心境": "Mood",
            "1 场梦，先不谈分布 —— 再做梦会累积。": "One dream so far. More dreams will build a mood history.",
            "左 → 右：从早到晚": "Left → right: oldest to newest",
            "教训榜": "Recurring observations",
            "还没有教训 —— 记梦时带上 lessons，出现次数会在这里累积。": "No observations yet. Include lessons when recording dreams to track recurring observations.",
            "常见教训": "Recurring observation",
            "次数仅表示日记里的出现频率；出现 ≥3 次标为「常见教训」。写入项目规则前仍需核验来源并审阅经验。最近时间取自 stats.lastAt；统计缺失时按本页已加载的梦现算。": "Counts show journal frequency only; ≥3 occurrences marks a recurring observation. Verify sources and review lessons before writing project rules. Recency uses stats.lastAt, or the dreams loaded on this page when missing.",
            "复制命令": "Copy command",
            "已复制": "Copied",
            "剪贴板不可用：请手动选中上面的命令复制。": "Clipboard unavailable. Select and copy the command above manually.",
            "重新送审": "Reopen for review",
            "处理冲突": "Resolve conflict",
            "驳回这条": "Reject this lesson",
            "标记待复核": "Mark for review",
            "驳回": "Reject",
            "采纳": "Accept",
            "管理块内容已一致，无需写入。": "The managed block already matches; no write was needed.",
            "请求超时，请先刷新确认结果后再重试。": "Request timed out. Refresh to check the result before retrying.",
            "已更新「": "Updated the review state of “",
            "」的审阅状态。": "”.",
            "已记录使用反馈；「": "Feedback recorded; the review state of “",
            "」的审阅状态保持原样。": "” is unchanged.",
            "的操作": " — actions",
            "收起审阅": "Hide review",
            "审阅详情": "Review details",
            "预览规则变更": "Preview rule changes",
            "复制项目预览命令": "Copy project preview command",
            "正在处理…": "Working…",
            "已刷新经验列表。": "Lesson list refreshed.",
            "刷新列表": "Refresh list",
            "审阅动作": "Review action",
            "冲突经验": "Conflicting lesson",
            "处理方式": "Resolution",
            "采用这条，驳回对方": "Accept this lesson and reject the other",
            "放弃这条，保留对方": "Reject this lesson and keep the other",
            "合并到这条，对方留作历史": "Merge into this lesson and retain the other as history",
            "处理依据": "Reason for resolution",
            "说明哪个来源支持这次决定…": "Explain which source supports this decision…",
            "确认审阅": "Confirm review",
            "在对话里处理": "Handle in chat",
            "选择冲突经验并填写处理依据后即可处理。": "Select the conflicting lesson and provide a reason first.",
            "复制审阅命令": "Copy review command",
            "规则变更预览": "Rule change preview",
            "目标：": "Target: ",
            "管理块内容已经一致，无需更改。": "The managed block already matches; no changes are needed.",
            "将按此预览重建 Dream 管理块，请核对新增和删除内容。块外内容保留，写入前创建回滚备份。": "Check the additions and deletions before rebuilding the Dream managed block. Content outside the block is preserved; a rollback backup is created before writing.",
            "规则已应用，可在「写入记录」中回滚。": "Rules applied. You can roll back from the Rule changes tab.",
            "应用此变更": "Apply these changes",
            "取消预览": "Cancel preview",
            "使用反馈 · 有用 ": "Usage feedback · Useful: ",
            " · 不适用 ": " · Not applicable: ",
            "场景备注（可选）": "Context note (optional)",
            "反馈场景备注": "Feedback context note",
            "这次在哪个场景使用…": "Where did you use this lesson…",
            "这次有用": "Useful this time",
            "这次不适用": "Not applicable this time",
            "记录使用情况，供之后复核；采纳与驳回由审阅决定。": "Feedback records usage for future review. Acceptance and rejection remain review decisions.",
            "有用": "Useful",
            "不适用": "Not applicable",
            "已恢复上一次的 Dream 管理块，块外内容保留。": "The previous Dream managed block was restored; content outside the block was preserved.",
            "取消回滚": "Cancel rollback",
            "回滚这次变更": "Roll back this change",
            "将恢复「": "Restore the previous Dream managed block in “",
            "」的前一个 Dream 管理块。块外内容保留；管理块已被修改时会拒绝回滚。": "”. Content outside the block is preserved. Rollback is refused if the managed block has changed.",
            "正在回滚…": "Rolling back…",
            "确认回滚管理块": "Confirm block rollback",
            "隐私模式：点击此条临时查看": "Privacy mode: click to reveal temporarily",
            "最近核验：": "Last verified: ",
            "何时用：": "When to use: ",
            "未标注适用条件": "No conditions specified",
            "怎么做：": "What to do: ",
            "未标注具体动作": "No action specified",
            "适用范围与证据": "Scope and evidence",
            "范围：": "Scope: ",
            "适用：": "Applies to: ",
            "例外：": "Exceptions: ",
            "证据：": "Evidence: ",
            "没有关联来源记录，采纳前请核对依据。": "No linked sources. Check the evidence before accepting.",
            "来源记录 · ": "Source record · ",
            "已读到来源": "Source read",
            "待核验": "Unverified",
            "会话": "Session",
            "用户纠正": "User correction",
            "本地资料": "Local artifact",
            "未提供摘要": "No summary provided",
            "会话：": "Session: ",
            " · 记录 ": " · Record ",
            "记录时间：": "Recorded: ",
            "核验说明：": "Verification: ",
            "已核对当前会话原文；不代表结论正确。": "Matched the current session source; this does not prove the conclusion is correct.",
            "来源校验值：": "Source hash: ",
            "为什么被扣下：": "Why held: ",
            "已审阅经验": "Reviewed lessons",
            "重试": "Retry",
            "读取经验失败：": "Could not load lessons: ",
            "旧日记不受影响；修好后点「重试」。": "Your journal is preserved. Retry after resolving the error.",
            "经验": "Lessons",
            "加载中…": "Loading…",
            "查看 ": "Show ",
            "经验状态": "Lesson state",
            "可用经验": "Usable lessons",
            "已驳回历史": "Rejected history",
            "暂无可用经验；待核实的记录在下方。": "No usable lessons yet. Records needing review are below.",
            "没有已驳回记录。": "No rejected records.",
            "显示更多经验": "Show more lessons",
            "只显示最近 ": "Showing the most recent ",
            " 条经验。": " lessons.",
            "采纳记录仍需满足当前任务的平台、版本与项目条件；来源已读不代表结论永远适用。": "Accepted lessons must still match the platform, version and project of the current task. A source being read does not mean its conclusions always apply.",
            "待核实": "Needs verification",
            " 条待核实": " need verification",
            "没有待核实的经验": "No lessons awaiting verification",
            "显示更多待核实经验": "Show more pending lessons",
            "这些经验默认不会作为任务建议注入。先核对来源与适用范围，再决定采纳、驳回或继续复核。": "These lessons are not injected as task advice by default. Check sources and scope before accepting, rejecting or reviewing further.",
            "写入记录": "Rule changes",
            "读取写入记录失败：": "Could not load rule changes: ",
            " 次写入 · ": " changes · ",
            " 次可回滚": " can be rolled back",
            "经验：": "Lessons: ",
            "前哈希：": "Before hash: ",
            "后哈希：": "After hash: ",
            "备份标识与回滚命令": "Backup ID and rollback command",
            " 条记录。": " records.",
            "回滚恢复对应备份的 Dream 管理块；块外内容保留，外部修改的管理块会停止回滚。": "Rollback restores the backed-up Dream managed block and preserves content outside it. External changes to the block prevent rollback.",
            "隐私模式：点击卡片临时查看": "Privacy mode: click the card to reveal temporarily",
            "心境：": "Mood: ",
            "收起": "Collapse",
            "展开全文": "Read more",
            "没有找到「": "No dreams matching “",
            "」相关的梦": "”",
            "换个关键词试试，或者清空搜索看全部梦境。": "Try another keyword, or clear the search to see all dreams.",
            "清空搜索": "Clear search",
            "还没有梦境日记": "No dreams yet",
            "对 agent 说「做个梦」，它会回放最近的会话、反思之后把第一场梦写进这里。": "Ask your agent to “have a dream”. It will replay recent sessions, reflect and record its first dream here.",
            "对 agent 说「做个梦」": "Ask your agent to “have a dream”",
            "搜索反思与教训…": "Search reflections and observations…",
            "搜索梦境": "Search dreams",
            "筛选作用于已加载窗口，不影响全量统计": "Filters apply to loaded dreams; overall statistics are unchanged",
            "筛选": "Filter",
            "筛选梦境": "Filter dreams",
            " 场，不影响全量统计": " loaded dreams; overall statistics are unchanged",
            "只看有教训的梦": "Only dreams with observations",
            "清空筛选": "Clear filters",
            "完成": "Done",
            "显示层模糊；DOM 仍为明文，不改文件、不加密": "Display blur only; the DOM remains readable. Files are unchanged and not encrypted",
            "隐私模式：开": "Privacy mode: on",
            "隐私模式": "Privacy mode",
            "重新读取梦境日记": "Reload the dream journal",
            "刷新": "Refresh",
            "读取梦境日记失败：": "Could not load the dream journal: ",
            "暂时读不到梦境日记": "The dream journal is unavailable",
            "等宿主路由就绪后点上面的「重试」；如果一直失败，看一眼 DSH 日志里有没有 [dsh-dream] 告警。": "Retry after the host is ready. If the problem persists, check DSH logs for [dsh-dream] warnings.",
            "梦境总数": "Total dreams",
            "本页显示最近 ": "Most recent loaded: ",
            "全部梦境日记": "All dreams",
            "时间跨度": "Time span",
            "最近一场": "Latest dream",
            " 种": " moods",
            "最常见：": "Most common: ",
            "梦境时间线": "Dream timeline",
            "筛选结果": "Filtered results",
            "搜索结果": "Search results",
            "没有符合筛选的梦（筛选作用于已加载的 ": "No matching dreams (filters apply to the ",
            " 场）。": " loaded dreams).",
            "梦境面板视图": "Dream views",
            "日记": "Journal",
            "隐私模式：显示层模糊；DOM 仍为明文，不改文件、不加密。点击卡片可临时查看。": "Privacy mode blurs the display only. The DOM remains readable; files are unchanged and not encrypted. Click a card to reveal it temporarily.",
            "显示更早的梦": "Show older dreams",
            "数据来自梦境日记（dreams.jsonl）": "Data from the dream journal (dreams.jsonl)",
            "梦境日记": "Dream journal",
            "自动整理任务经验，审阅后回用；日记保留独立的反思记录。": "Collect lessons from tasks and reuse them after review; journals keep separate reflections."
        });
        function languageOf(locale = localeService) {
            try {
                return dreamLanguage || normalizeDreamLanguage(locale?.getSnapshot?.().active) || 'zh';
            }
            catch {
                return 'zh';
            }
        }
        function t(zh) {
            const language = languageOf();
            if (language === 'zh') return zh;
            const messages = Object.hasOwn(DREAM_MESSAGES, zh) ? DREAM_MESSAGES[zh] : undefined;
            return messages?.[DREAM_TRANSLATION_ORDER.indexOf(language)] ?? messages?.[0] ?? EN[zh] ?? zh;
        }
        function displayError(error) {
            const message = error?.message || String(error || '');
            if (languageOf() === 'zh')
                return message;
            if (EN[message] || DREAM_MESSAGES[message])
                return t(message);
            if (!/[\u3400-\u9fff]/.test(message))
                return message;
            const hints = {
                revision: 'This lesson or project changed. Refresh and review again; your input is preserved.',
                conflict: 'The target changed. Preview the current rules again before applying.',
                'preview-mismatch': 'The preview no longer matches. Create a new preview.',
                'preview-expired': 'The preview expired. Create a new preview.',
                'not-rollbackable': 'Rollback is unavailable because the managed block changed or its backup is missing.',
                'ineligible': 'This lesson is not eligible for rule writing. Check its scope and review state.',
                'read-only': 'The target is read-only. Check its permissions before retrying.',
                'marker': 'The managed block markers are invalid. Check the file before retrying.',
                'path-outside-project': 'The target must stay inside the project directory.',
                'unsupported-encoding': 'The target file encoding is unsupported. Use UTF-8.',
                'target-is-directory': 'The selected target is a directory; select a file.',
                'not-found': 'The lesson, target or backup was not found. Refresh and check the project.',
                forbidden: 'This operation must be performed from the authenticated Dream panel.',
                'too-large': 'The request is too large. Shorten the input and try again.',
                cancelled: 'The operation was cancelled. Refresh to check the result before retrying.',
                io: 'The operation could not access its files. Check the project location and file permissions, then refresh before retrying.',
                internal: 'Could not load the records. Check the DSH logs and retry.',
                invalid: 'The input or selected record is no longer valid. Check the fields and refresh the list.',
            };
            return (hints[error?.code] || 'The operation failed. Check the DSH logs, then refresh before retrying.')
                + (error?.status ? ' (HTTP ' + error.status + (error.code ? ', ' + error.code : '') + ')' : '');
        }
        function rollbackReasonText(reason) {
            if (languageOf() === 'zh')
                return reason;
            return ({ '目标文件不可读': 'Target file is unreadable', '文件不存在': 'File does not exist',
                '管理块标记异常': 'Invalid managed block markers', '管理块已被移除': 'Managed block was removed',
                '管理块已被外部修改': 'Managed block changed externally' })[reason]
                || (/[\u3400-\u9fff]/.test(reason) ? 'Check the target file and backup' : reason);
        }
        function scopeText(label) {
            if (languageOf() === 'zh')
                return label;
            if (label === '全局') return t('全局');
            return label.replace(/^(工作区|项目) /, (_label, scope) => t(scope) + ' ')
                .replace(/（工作区 (.*)）$/, (_label, workspace) => ' (' + t('工作区') + ' ' + workspace + ')');
        }
        function evidenceText(summary) {
            if (languageOf() === 'zh')
                return summary;
            return summary
                .replace(/^无证据（仅候选，不可作为已证实结论）$/, 'No evidence (candidate only; not an established conclusion)')
                .replace(/^证据暂不可核对（(\d+) 条引用缺失）$/, 'Evidence unavailable ($1 missing references)')
                .replace(/^独立证据 (\d+) 条（已读 (\d+) \/ 仅声明 (\d+)）(:|：)?/, (_head, total, read, claimed, colon) => 'Independent sources: ' + total + ' (read: ' + read + ' / claimed: ' + claimed + ')' + (colon ? ': ' : ''));
        }
        function useLanguage(locale) {
            const [, rerender] = useState(0);
            useEffect(() => {
                const update = () => rerender(n => n + 1);
                const release = locale?.subscribe?.(update);
                languageListeners.add(update);
                update();
                return () => { release?.(); languageListeners.delete(update); };
            }, [locale]);
        }
        // 相对路径按 document.baseURI 解析：反代挂在 /tools/dsh/ 这类前缀下也不会打偏。
        const ROUTE = "_dsh/dsh-dream/journal";
        const ACTION_ROUTE = "api/dsh-dream/actions";
        const KNOWLEDGE_ROUTE = "_dsh/dsh-dream/knowledge";
        const BRIDGE_ROUTE = "_dsh/dsh-dream/bridge";
        const KNOWLEDGE_LIMIT = 50;
        const BRIDGE_LIMIT = 50;
        const KNOWLEDGE_STATES = ["candidate", "usable", "disputed", "stale", "rejected"];
        const HELD_STATES = ["candidate", "disputed", "stale"];
        const DEFAULT_LIMIT = 50;
        const MORE_LIMIT = 500;
        const FETCH_TIMEOUT_MS = 15000;
        const SEARCH_DEBOUNCE_MS = 300;
        const MOOD_SLOTS = 4;
        const PRIVACY_KEY = "dsh-dream:privacy";
        // ───────────────────────── 纯工具（不依赖 DOM，测试可直接调） ─────────────────────────
        function pad2(value) {
            return value < 10 ? "0" + String(value) : String(value);
        }
        function timestampOf(iso) {
            const value = Date.parse(iso);
            return Number.isFinite(value) ? value : 0;
        }
        /** 路由 URL：按 document.baseURI 解析，兼容反代前缀；环境不齐时退回相对路径。 */
        function routeUrlFor(route, query) {
            const suffix = query === "" || query === undefined || query === null ? "" : "?" + query;
            const relative = route + suffix;
            try {
                let base = null;
                if (typeof document !== "undefined" && document !== null && typeof document.baseURI === "string" && document.baseURI !== "") {
                    base = document.baseURI;
                }
                else if (typeof location !== "undefined" && location !== null && typeof location.href === "string" && location.href !== "") {
                    base = location.href;
                }
                if (base === null)
                    return relative;
                return new URL(relative, base).toString();
            }
            catch (error) {
                return relative;
            }
        }
        /** 梦境日记路由的快捷方式（保持既有调用语义）。 */
        function routeUrl(query) {
            return routeUrlFor(ROUTE, query);
        }
        function errorMessageOf(body, status) {
            if (body !== null && typeof body === "object") {
                if (body.error !== null && typeof body.error === "object" && typeof body.error.message === "string" && body.error.message !== "")
                    return body.error.message;
                if (typeof body.message === "string" && body.message !== "")
                    return body.message;
            }
            return t("请求失败（HTTP ") + String(status) + "）";
        }
        /** GET /_dsh/dsh-dream/journal：契约体 { dreams, stats, query, limit }。 */
        async function fetchJournal(query, limit) {
            const params = ["limit=" + String(limit)];
            if (query !== "")
                params.unshift("q=" + encodeURIComponent(query));
            const init = { credentials: "same-origin" };
            // 请求必须有上限：挂起的 Promise 会让面板一直转圈，表现成「日记打不开」。
            if (typeof AbortSignal !== "undefined" && typeof AbortSignal.timeout === "function")
                init.signal = AbortSignal.timeout(FETCH_TIMEOUT_MS);
            const res = await fetch(routeUrl(params.join("&")), init);
            let body = null;
            try {
                body = await res.json();
            }
            catch (error) {
                body = null;
            }
            if (body === null || typeof body !== "object")
                throw new Error(t("服务器返回的不是 JSON（HTTP ") + String(res.status) + "）");
            if (res.ok !== true || body.ok === false) {
                const failure = new Error(errorMessageOf(body, res.status));
                failure.status = res.status;
                failure.code = body.error !== null && typeof body.error === "object" ? body.error.code : undefined;
                throw failure;
            }
            // 契约体就是 { dreams, stats, query, limit }；万一被包进 { ok, value } 信封也认。
            const data = Array.isArray(body.dreams) ? body : (body.value !== null && typeof body.value === "object" ? body.value : body);
            return {
                dreams: data.dreams,
                stats: data.stats,
                query: typeof data.query === "string" ? data.query : query,
                limit: typeof data.limit === "number" ? data.limit : limit,
            };
        }
        /** GET /_dsh/dsh-dream/knowledge：只读契约体 { lessons, evidence, stats }，无查询参数。 */
        async function fetchKnowledge() {
            const init = { credentials: "same-origin" };
            if (typeof AbortSignal !== "undefined" && typeof AbortSignal.timeout === "function")
                init.signal = AbortSignal.timeout(FETCH_TIMEOUT_MS);
            const res = await fetch(routeUrlFor(KNOWLEDGE_ROUTE, ""), init);
            let body = null;
            try {
                body = await res.json();
            }
            catch (error) {
                body = null;
            }
            if (body === null || typeof body !== "object")
                throw new Error(t("服务器返回的不是 JSON（HTTP ") + String(res.status) + "）");
            if (res.ok !== true || body.ok === false) {
                const failure = new Error(errorMessageOf(body, res.status));
                failure.status = res.status;
                failure.code = body.error !== null && typeof body.error === "object" ? body.error.code : undefined;
                throw failure;
            }
            // 契约体就是 { lessons, evidence, stats }；万一被包进 { ok, value } 信封也认。
            const data = body.value !== null && typeof body.value === "object" ? body.value : body;
            return {
                lessons: Array.isArray(data.lessons) ? data.lessons : [],
                evidence: Array.isArray(data.evidence) ? data.evidence : [],
                stats: data.stats !== null && typeof data.stats === "object" ? data.stats : null,
            };
        }
        /** GET /_dsh/dsh-dream/bridge：只读契约体 { records, stats }，无查询参数。 */
        async function fetchBridgeRecords() {
            const init = { credentials: "same-origin" };
            if (typeof AbortSignal !== "undefined" && typeof AbortSignal.timeout === "function")
                init.signal = AbortSignal.timeout(FETCH_TIMEOUT_MS);
            const res = await fetch(routeUrlFor(BRIDGE_ROUTE, ""), init);
            let body = null;
            try {
                body = await res.json();
            }
            catch (error) {
                body = null;
            }
            if (body === null || typeof body !== "object")
                throw new Error(t("服务器返回的不是 JSON（HTTP ") + String(res.status) + "）");
            if (res.ok !== true || body.ok === false) {
                const failure = new Error(errorMessageOf(body, res.status));
                failure.status = res.status;
                failure.code = body.error !== null && typeof body.error === "object" ? body.error.code : undefined;
                throw failure;
            }
            const data = body.value !== null && typeof body.value === "object" ? body.value : body;
            return {
                records: Array.isArray(data.records) ? data.records : [],
                stats: data.stats !== null && typeof data.stats === "object" ? data.stats : null,
            };
        }
        async function postAction(body) {
            const init = { method: "POST", credentials: "same-origin", headers: { "content-type": "application/json", "x-dsh-dream-action": "1" }, body: JSON.stringify(body) };
            if (typeof AbortSignal !== "undefined" && typeof AbortSignal.timeout === "function")
                init.signal = AbortSignal.timeout(FETCH_TIMEOUT_MS);
            const res = await fetch(routeUrlFor(ACTION_ROUTE, ""), init);
            let value = null;
            try {
                value = await res.json();
            }
            catch (error) { /* Preserve HTTP status for useful recovery hints. */ }
            if (res.ok !== true || value === null || value.ok === false) {
                const hint = res.status === 401 ? t("登录状态已失效，请重新打开 DSH 页面后重试。")
                    : res.status === 404 ? t("当前宿主尚未提供此操作，请升级 DSH，或使用下方对话命令。")
                        : errorMessageOf(value, res.status);
                const failure = new Error(hint);
                failure.code = value && value.error ? value.error.code : undefined;
                failure.status = res.status;
                throw failure;
            }
            return value;
        }
        /** 复制命令到剪贴板；没有 clipboard / 被拒绝时返回 false，调用方回退为可选中文本。 */
        async function copyText(text) {
            const value = String(text);
            if (value === "")
                return false;
            try {
                if (typeof navigator !== "undefined" && navigator !== null && navigator.clipboard !== undefined && navigator.clipboard !== null && typeof navigator.clipboard.writeText === "function") {
                    await navigator.clipboard.writeText(value);
                    return true;
                }
            }
            catch (error) { /* 权限被拒 / 非安全上下文：回退展示可选中文本 */ }
            return false;
        }
        function normalizeDreams(value, limit) {
            if (!Array.isArray(value) || limit <= 0)
                return [];
            const out = [];
            for (const raw of value) {
                if (raw === null || typeof raw !== "object")
                    continue;
                const reflection = typeof raw.reflection === "string" ? raw.reflection : "";
                if (reflection === "")
                    continue;
                out.push({
                    id: typeof raw.id === "string" ? raw.id : "",
                    at: typeof raw.at === "string" ? raw.at : "",
                    reflection: reflection,
                    lessons: Array.isArray(raw.lessons) ? raw.lessons.filter((lesson) => typeof lesson === "string" && lesson.trim() !== "") : [],
                    mood: typeof raw.mood === "string" && raw.mood.trim() !== "" ? raw.mood.trim() : "平静",
                });
            }
            // 服务端已倒序；这里再兜一次（坏时间排到最后），保证「新梦在前」不被实现细节破坏。
            out.sort((a, b) => timestampOf(b.at) - timestampOf(a.at));
            return out.slice(0, limit);
        }
        function normalizeStats(value, dreams) {
            const source = value !== null && typeof value === "object" ? value : {};
            const moodCounts = new Map();
            if (source.moods !== null && typeof source.moods === "object") {
                for (const key of Object.keys(source.moods)) {
                    const count = source.moods[key];
                    if (typeof count === "number" && count > 0)
                        moodCounts.set(key === "" ? "平静" : key, count);
                }
            }
            if (moodCounts.size === 0)
                for (const dream of dreams)
                    moodCounts.set(dream.mood, (moodCounts.get(dream.mood) || 0) + 1);
            const moods = Array.from(moodCounts.entries())
                .map(([mood, count]) => ({ mood: mood, count: count }))
                .sort((a, b) => b.count - a.count || String(a.mood).localeCompare(String(b.mood), "zh"));
            const total = typeof source.total === "number" && source.total >= 0 ? source.total : dreams.length;
            const topLessons = [];
            if (Array.isArray(source.topLessons)) {
                for (const raw of source.topLessons) {
                    if (raw === null || typeof raw !== "object")
                        continue;
                    if (typeof raw.lesson !== "string" || raw.lesson.trim() === "")
                        continue;
                    topLessons.push({
                        lesson: raw.lesson,
                        count: typeof raw.count === "number" && raw.count > 0 ? raw.count : 1,
                        lastAt: typeof raw.lastAt === "string" ? raw.lastAt : "",
                    });
                }
            }
            if (topLessons.length === 0) {
                // 后端没给统计（或还没接上）时按当前页现算一份，面板不至于空着。
                const counts = new Map();
                for (const dream of dreams)
                    for (const lesson of dream.lessons) {
                        const key = lesson.toLowerCase();
                        counts.set(key, (counts.get(key) || 0) + 1);
                    }
                const sorted = Array.from(counts.entries()).sort((a, b) => b[1] - a[1]).slice(0, 10);
                for (const entry of sorted) {
                    let original = "";
                    let lastAt = "";
                    for (const dream of dreams) {
                        for (const lesson of dream.lessons) {
                            if (lesson.toLowerCase() !== entry[0])
                                continue;
                            if (original === "")
                                original = lesson;
                            if (timestampOf(dream.at) > timestampOf(lastAt))
                                lastAt = dream.at;
                        }
                    }
                    topLessons.push({ lesson: original || entry[0], count: entry[1], lastAt: lastAt });
                }
            }
            return { total: total, moods: moods, topLessons: topLessons };
        }
        /** 只认契约里的 5 个状态；未知状态不冒充候选。 */
        function normalizeLessonState(value) {
            return KNOWLEDGE_STATES.indexOf(value) !== -1 ? value : "unknown";
        }
        /** 状态 → 中文标签（面板文案集中在这里）。 */
        function lessonStateLabel(state) {
            switch (state) {
                case "candidate": return t("候选（未采纳）");
                case "usable": return t("可用");
                case "disputed": return t("有冲突");
                case "stale": return t("待复核");
                case "rejected": return t("已驳回");
                default: return t("未知状态");
            }
        }
        /** 状态 → 视觉类名：candidate 与 disputed 必须不同色，其余状态各自可辨。 */
        function lessonStateClass(state) {
            switch (state) {
                case "candidate": return "dshd-kstate-candidate";
                case "usable": return "dshd-kstate-usable";
                case "disputed": return "dshd-kstate-disputed";
                case "stale": return "dshd-kstate-stale";
                case "rejected": return "dshd-kstate-rejected";
                default: return "dshd-kstate-unknown";
            }
        }
        /** 只取字符串字段并去首尾空白；坏形状降级为 ""，不让面板崩。 */
        function trimmedText(value) {
            return typeof value === "string" ? value.trim() : "";
        }
        /** applicability 数组 → 紧凑适用串（package + versions / platform）；坏形状跳过，空数组给 ""。 */
        function applicabilityTextOf(value) {
            if (!Array.isArray(value))
                return "";
            const parts = [];
            for (const raw of value) {
                if (raw === null || typeof raw !== "object")
                    continue;
                const pkg = trimmedText(raw.package);
                const versions = trimmedText(raw.versions);
                const platform = trimmedText(raw.platform);
                const main = pkg !== "" ? (versions !== "" ? pkg + " " + versions : pkg) : versions;
                const bits = [];
                if (main !== "")
                    bits.push(main);
                if (platform !== "")
                    bits.push(t("平台 ") + platform);
                if (bits.length > 0)
                    parts.push(bits.join(" · "));
            }
            if (parts.length === 0)
                return "";
            if (parts.length > 4)
                return parts.slice(0, 4).join("；") + t("；等 ") + String(parts.length) + t(" 条适用范围");
            return parts.join("；");
        }
        /**
         * 经验视图模型：只投影展示所需字段（title / when / applicability / exceptions /
         * state / scopeLabel / evidenceSummary / lastValidatedAt），并派生 revision / 扣留原因 /
         * 可桥接标记与复制命令所需的稳定字段；不碰权重、向量、原始 JSON。
         * limit 只截断渲染行数，byState 仍按全量统计；truncated / badLines 原样带给提示行。
         */
        function normalizeKnowledge(value, now, limit) {
            const source = value !== null && typeof value === "object" ? value : {};
            const cap = typeof limit === "number" && limit > 0 ? limit : KNOWLEDGE_LIMIT;
            const rawLessons = Array.isArray(source.lessons) ? source.lessons : [];
            const lessonTitles = new Map();
            const globalLessons = new Set(rawLessons.filter(raw => raw?.scope?.global === true).map(raw => raw.id));
            for (const raw of rawLessons) {
                if (raw !== null && typeof raw === "object" && trimmedText(raw.id) !== "") {
                    lessonTitles.set(trimmedText(raw.id), trimmedText(raw.title) || trimmedText(raw.action));
                }
            }
            const statsSource = source.stats !== null && typeof source.stats === "object" ? source.stats : {};
            const byState = {};
            const rows = [];
            for (const raw of rawLessons) {
                if (raw === null || typeof raw !== "object")
                    continue;
                const title = trimmedText(raw.title);
                const action = trimmedText(raw.action);
                if (title === "" && action === "")
                    continue;
                const state = raw.humanReviewRequired === true ? 'candidate' : raw.reviewDue === true && raw.state === 'usable' ? 'stale' : normalizeLessonState(raw.state);
                byState[state] = (byState[state] || 0) + 1;
                if (rows.length >= cap)
                    continue;
                const lastValidatedAt = trimmedText(raw.lastValidatedAt);
                rows.push({
                    id: trimmedText(raw.id),
                    kind: trimmedText(raw.kind),
                    groupKey: JSON.stringify([raw.kind, raw.scope?.global === true, raw.scope?.projectId ?? null, raw.scope?.workspaceRoot ?? null]),
                    isGlobal: raw.scope?.global === true,
                    hasGlobalConflicts: Array.isArray(raw.conflictIds) && raw.conflictIds.some(id => globalLessons.has(id)),
                    reviewDue: raw.reviewDue === true,
                    lastRetrievedAt: trimmedText(raw.lastRetrievedAt),
                    title: title !== "" ? title : action,
                    action: action,
                    when: trimmedText(raw.when),
                    applicability: applicabilityTextOf(raw.applicability),
                    exceptions: Array.isArray(raw.exceptions)
                        ? raw.exceptions.filter((item) => typeof item === "string" && item.trim() !== "").map((item) => item.trim()).slice(0, 10)
                        : [],
                    state: state,
                    stateLabel: lessonStateLabel(state),
                    stateClass: lessonStateClass(state),
                    scopeLabel: scopeText(trimmedText(raw.scopeLabel)) || t("范围未标注"),
                    evidenceSummary: evidenceText(trimmedText(raw.evidenceSummary)) || t("暂无可展示的证据摘要"),
                    evidence: Array.isArray(source.evidence) && Array.isArray(raw.evidenceIds)
                        ? source.evidence.filter(function (item) { return item && raw.evidenceIds.indexOf(item.id) !== -1; }).slice(0, 20) : [],
                    feedback: raw.feedback && typeof raw.feedback === "object" ? raw.feedback : { useful: 0, notApplicable: 0, recent: [] },
                    lastValidatedAt: lastValidatedAt,
                    lastText: lastValidatedAt === "" ? t("尚未核验") : relativeTime(lastValidatedAt, now),
                    lastTitle: lastValidatedAt === "" ? t("没有 lastValidatedAt（从未核验）") : formatDate(lastValidatedAt) + (formatTime(lastValidatedAt) === "" ? "" : " " + formatTime(lastValidatedAt)),
                    revision: typeof raw.revision === "number" && Number.isFinite(raw.revision) && raw.revision >= 0 ? Math.floor(raw.revision) : 0,
                    independentSupportCount: typeof raw.independentSupportCount === "number" && raw.independentSupportCount > 0 ? Math.floor(raw.independentSupportCount) : 0,
                    projectId: typeof raw.scope === "object" && raw.scope !== null ? trimmedText(raw.scope.projectId) : "",
                    workspaceRoot: typeof raw.scope === "object" && raw.scope !== null ? trimmedText(raw.scope.workspaceRoot) : "",
                    conflictIds: Array.isArray(raw.conflictIds) ? raw.conflictIds.filter(function (id) { return typeof id === "string" && id.trim() !== ""; }) : [],
                    conflicts: Array.isArray(raw.conflictIds) ? raw.conflictIds.filter(function (id) { return typeof id === "string" && id.trim() !== ""; }).map(function (id) { return { id: id, title: lessonTitles.get(id) || t("未加载的经验（") + id + "）" }; }) : [],
                    holdReason: raw.reviewDue === true ? 'review-due' : trimmedText(raw.holdReason) !== "" ? trimmedText(raw.holdReason) : holdReasonOf(raw),
                    holdReasonLabel: raw.reviewDue === true ? t('已到复核时间') : trimmedText(raw.holdReasonLabel) !== "" ? t(trimmedText(raw.holdReasonLabel)) : skippedReasonLabel(holdReasonOf(raw)),
                    bridgeable: raw.humanReviewRequired !== true && raw.reviewDue !== true && bridgeableOf(raw.state) && trimmedText(raw.id) !== "",
                    candidate: state === "candidate" && raw.state === "candidate",
                    disputed: state === "disputed",
                });
            }
            const total = typeof statsSource.lessons === "number" && statsSource.lessons >= 0 ? statsSource.lessons : rawLessons.length;
            const evidenceTotal = typeof statsSource.evidence === "number" && statsSource.evidence >= 0 ? statsSource.evidence : 0;
            const badLinesRaw = statsSource.badLines;
            const badLines = typeof badLinesRaw === "number" && Number.isFinite(badLinesRaw) && badLinesRaw > 0 ? Math.floor(badLinesRaw) : 0;
            return {
                rows: rows,
                total: total,
                shown: rows.length,
                stats: { lessons: total, evidence: evidenceTotal, byState: byState, truncated: statsSource.truncated === true, badLines: badLines },
            };
        }
        /** 经验区块的统计文案：按状态计数，不包装成可靠度。 */
        function knowledgeCountText(stats) {
            const source = stats !== null && typeof stats === "object" ? stats : {};
            const byState = source.byState !== null && typeof source.byState === "object" ? source.byState : {};
            const parts = [];
            for (const state of KNOWLEDGE_STATES) {
                const count = typeof byState[state] === "number" && byState[state] > 0 ? byState[state] : 0;
                if (count > 0)
                    parts.push(lessonStateLabel(state) + " " + String(count));
            }
            if (parts.length === 0) {
                const total = typeof source.lessons === "number" && source.lessons > 0 ? source.lessons : 0;
                return total > 0 ? t("共 ") + String(total) + t(" 条") : t("还没有经验");
            }
            return parts.join(" · ");
        }
        /** 截断 / 坏行提示：无问题时给 ""；确保面板不静默展示不完整的经验集。 */
        function knowledgeNoticeText(stats) {
            const source = stats !== null && typeof stats === "object" ? stats : {};
            const truncated = source.truncated === true;
            const badLines = typeof source.badLines === "number" && Number.isFinite(source.badLines) && source.badLines > 0 ? Math.floor(source.badLines) : 0;
            if (truncated !== true && badLines === 0)
                return "";
            const parts = [];
            if (truncated === true)
                parts.push(t("日志过大，仅回放最近一段事件"));
            if (badLines > 0)
                parts.push(t("有 ") + String(badLines) + t(" 行损坏已跳过"));
            return parts.join("；") + t("；events.jsonl 未改动。");
        }
        /** 经验区块的独立空态：与「还没有梦境日记」分开，说明经验从哪来。 */
        function knowledgeEmptyState() {
            return {
                title: t("还没有经验记录"),
                body: t("经验是带证据、有适用条件的技术结论：收尾时用 dream_learn 提交候选，证据足够、范围明确的会出现在这里。"),
                hint: t("旧日记里的教训不会自动升级为经验；采纳、驳回或标记冲突请用 dream_review。"),
            };
        }
        /** 检索层 skipped reason 的中文映射（面板扣留原因文案；与 retrieval.ts 的 reason 常量同名）。 */
        function skippedReasonLabel(reason) {
            switch (trimmedText(reason)) {
                case 'human-review-required': return t('需要你确认采纳：请先核对来源与适用范围');
                case "state:rejected": return t("已驳回：不参与默认检索与注入");
                case "state:stale": return t("待复核：条件或依赖可能已过期，默认不注入");
                case "state:disputed": return t("冲突未解决：默认不注入，先 resolve-conflict");
                case "candidate-hold": return t("候选：可被检索到，但默认不作为任务建议注入");
                case "no-evidence": return t("证据不足：没有独立证据，默认不注入");
                case "version-mismatch": return t("版本不匹配：当前依赖版本不满足适用范围");
                case "limit": return t("超出条数预算，本次未取回");
                case "budget-stop": return t("超出字符预算：按排名整条装入，遇到第一条放不下即停");
                case "budget": return t("超出字符预算，本次未取回");
                default: return "";
            }
        }
        /** 浏览态的确定性扣留原因；version-mismatch 需要 query / 包名上下文，不在此列。 */
        function holdReasonOf(lesson) {
            const source = lesson !== null && typeof lesson === "object" ? lesson : {};
            if (source.humanReviewRequired === true)
                return 'human-review-required';
            const state = normalizeLessonState(source.state);
            if (state === "disputed")
                return "state:disputed";
            if (state === "stale")
                return "state:stale";
            if (state === "rejected")
                return "state:rejected";
            if (state === "candidate") {
                const support = typeof source.independentSupportCount === "number" && source.independentSupportCount > 0 ? source.independentSupportCount : 0;
                return support === 0 ? "no-evidence" : "candidate-hold";
            }
            return "";
        }
        /** 面板上的「可桥接」只按契约状态判断：usable；scope / 用户采纳等资格由 dream_bridge 执行时校验。 */
        function bridgeableOf(state) {
            return normalizeLessonState(state) === "usable";
        }
        /** 复制命令里的默认 action：按状态给最常用的一步，用户可在对话里再改。 */
        function reviewActionFor(state) {
            switch (normalizeLessonState(state)) {
                case "candidate": return "accept";
                case "disputed": return "resolve-conflict";
                case "stale": return "accept";
                case "usable": return "mark-stale";
                case "rejected": return "reopen";
                default: return "";
            }
        }
        /** 派生 dream_review 复制命令；缺 id 时给 ""（面板不展示不可执行命令）。 */
        function reviewCommandOf(lesson, options) {
            const source = lesson !== null && typeof lesson === "object" ? lesson : {};
            const id = trimmedText(source.id);
            if (id === "" || !Number.isInteger(source.revision) || source.revision < 1)
                return "";
            const opts = options || {};
            const action = opts.action || reviewActionFor(source.state);
            if (action === "")
                return "";
            const args = { action: action, lessonId: id, expectedRevision: source.revision };
            if (action === "resolve-conflict") {
                if (!["prefer", "drop", "merge"].includes(opts.resolution) || trimmedText(opts.note) === "" || !Array.isArray(opts.affectedIds) || opts.affectedIds.length === 0)
                    return "";
                args.resolution = opts.resolution;
                args.note = opts.note.trim();
                args.affectedIds = opts.affectedIds;
            }
            return "dream_review " + JSON.stringify(args);
        }
        /** 派生 dream_bridge preview 复制命令（单条经验）；projectId 来自 payload，scopeLabel 只展示。 */
        function bridgePreviewCommandOf(lessonId, projectId, workspaceRoot) {
            const id = trimmedText(lessonId);
            if (id === "")
                return "";
            const project = trimmedText(projectId);
            const args = { mode: "preview", lessonIds: [id] };
            if (project !== "")
                args.projectId = project;
            const root = trimmedText(workspaceRoot);
            if (root !== "")
                args.path = root.replace(/[\\/]+$/, "") + "/AGENTS.md";
            return "dream_bridge " + JSON.stringify(args);
        }
        function bridgeRollbackCommandOf(row) {
            if (!row || row.rollbackable !== true || trimmedText(row.target) === "")
                return "";
            const backupId = trimmedText(row.id) || trimmedText(row.backupId);
            if (backupId === "")
                return "";
            return "dream_bridge " + JSON.stringify({ mode: "rollback", backupId: backupId, path: row.target });
        }
        /** 哈希只展示前 12 位；空值给 ""。 */
        function shortHash(value) {
            const text = trimmedText(value);
            if (text === "")
                return "";
            return text.length > 12 ? text.slice(0, 12) + "…" : text;
        }
        function bridgeActionLabel(action) {
            switch (trimmedText(action)) {
                case "create": return t("新建");
                case "replace": return t("替换管理块");
                case "append": return t("追加管理块");
                case "unchanged": return t("未改动");
                case "rollback": return t("回滚");
                default: return trimmedText(action) || t("未知动作");
            }
        }
        /** 写入记录视图模型：只投影展示字段，不展示原始 JSON / 管理块正文。 */
        function normalizeBridgeRecords(value, now, limit) {
            const source = value !== null && typeof value === "object" ? value : {};
            const cap = typeof limit === "number" && limit > 0 ? limit : BRIDGE_LIMIT;
            const rawRecords = Array.isArray(source.records) ? source.records : [];
            const statsSource = source.stats !== null && typeof source.stats === "object" ? source.stats : {};
            const rows = [];
            let rollbackableCount = 0;
            for (const raw of rawRecords) {
                if (raw === null || typeof raw !== "object")
                    continue;
                const id = trimmedText(raw.backupId);
                const target = trimmedText(raw.target);
                if (id === "" && target === "")
                    continue;
                const rollbackable = raw.rollbackable === true;
                if (rollbackable)
                    rollbackableCount += 1;
                if (rows.length >= cap)
                    continue;
                const at = trimmedText(raw.at);
                const lessonRefs = [];
                if (Array.isArray(raw.lessons)) {
                    for (const item of raw.lessons) {
                        if (item !== null && typeof item === "object") {
                            const lessonId = trimmedText(item.lessonId);
                            if (lessonId === "")
                                continue;
                            const revision = typeof item.revision === "number" && Number.isFinite(item.revision) && item.revision >= 0 ? Math.floor(item.revision) : 0;
                            lessonRefs.push(lessonId + "@" + String(revision));
                        }
                        else if (typeof item === "string" && item.trim() !== "") {
                            lessonRefs.push(item.trim());
                        }
                    }
                }
                const rollbackReason = trimmedText(raw.rollbackReason);
                rows.push({
                    id: id,
                    at: at,
                    atText: at === "" ? t("时间未知") : relativeTime(at, now),
                    atTitle: at === "" ? t("没有记录时间") : formatDate(at) + (formatTime(at) === "" ? "" : " " + formatTime(at)),
                    target: target || t("目标未记录"),
                    action: trimmedText(raw.action),
                    actionLabel: bridgeActionLabel(raw.action),
                    lessons: lessonRefs,
                    lessonsText: lessonRefs.length === 0 ? t("没有经验引用") : lessonRefs.join("、"),
                    beforeShort: shortHash(raw.beforeSha256),
                    afterShort: shortHash(raw.afterSha256),
                    rollbackable: rollbackable,
                    rollbackText: rollbackable ? t("可回滚") : (t("不可回滚") + (rollbackReason !== "" ? (languageOf() === 'en' ? ': ' : '：') + rollbackReasonText(rollbackReason) : "")),
                    rollbackReason: rollbackReason,
                });
            }
            const total = typeof statsSource.total === "number" && statsSource.total >= 0 ? statsSource.total : rawRecords.length;
            const statsRollback = typeof statsSource.rollbackable === "number" && statsSource.rollbackable >= 0 ? statsSource.rollbackable : rollbackableCount;
            return {
                rows: rows,
                total: total,
                shown: rows.length,
                rollbackable: statsRollback,
            };
        }
        /** 「写入记录」的独立空态。 */
        function bridgeEmptyState() {
            return {
                title: t("还没有写入记录"),
                body: t("写入记录来自 dream_bridge 的 preview → apply；面板只读展示目标、时间、经验 revision 与前后哈希，不会写文件。"),
                hint: t("在可桥接经验行点「复制预览命令」，回到对话里执行；写操作只在工具中完成。"),
            };
        }
        /** 「待核实」的独立空态。 */
        function reviewQueueEmptyState() {
            return t("没有待核实的经验 —— 候选、有冲突、待复核的经验会出现在这里，并写明被扣下的原因。");
        }
        function spanOf(dreams) {
            let min = null;
            let max = null;
            for (const dream of dreams) {
                const ts = timestampOf(dream.at);
                if (ts === 0)
                    continue;
                if (min === null || ts < min)
                    min = ts;
                if (max === null || ts > max)
                    max = ts;
            }
            if (min === null)
                return null;
            return { from: min, to: max, days: Math.floor((max - min) / 86400000) };
        }
        function formatDate(iso) {
            const date = new Date(iso);
            if (!Number.isFinite(date.getTime()))
                return iso === "" ? t("时间未知") : iso;
            return date.getFullYear() + "-" + pad2(date.getMonth() + 1) + "-" + pad2(date.getDate());
        }
        function formatTime(iso) {
            const date = new Date(iso);
            if (!Number.isFinite(date.getTime()))
                return "";
            return pad2(date.getHours()) + ":" + pad2(date.getMinutes());
        }
        function shortDate(ms) {
            const date = new Date(ms);
            return pad2(date.getMonth() + 1) + "-" + pad2(date.getDate());
        }
        /** 跨度的紧凑写法：同年用 MM-DD → MM-DD，跨年才带年份 —— 窄卡片里也不截断。 */
        function spanTextOf(span) {
            const from = new Date(span.from);
            const to = new Date(span.to);
            if (formatDate(from.toISOString()) === formatDate(to.toISOString()))
                return formatDate(from.toISOString());
            if (from.getFullYear() === to.getFullYear())
                return shortDate(span.from) + " → " + shortDate(span.to);
            return formatDate(from.toISOString()) + " → " + formatDate(to.toISOString());
        }
        function relativeTime(iso, now) {
            const ts = timestampOf(iso);
            if (ts === 0)
                return "";
            const diff = now.getTime() - ts;
            const minute = 60000;
            const hour = 3600000;
            const day = 86400000;
            if (diff < minute)
                return t("刚刚");
            if (diff < hour)
                return Math.floor(diff / minute) + t(" 分钟前");
            if (diff < day)
                return Math.floor(diff / hour) + t(" 小时前");
            if (diff < day * 30)
                return Math.floor(diff / day) + t(" 天前");
            return formatDate(iso);
        }
        /** 「最近一次出现」用的短文案：今天/昨天/N 天前/日期。 */
        function recentText(iso, now) {
            const ts = timestampOf(iso);
            if (ts === 0)
                return "";
            const date = new Date(ts);
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            const that = new Date(date.getFullYear(), date.getMonth(), date.getDate());
            const days = Math.round((today.getTime() - that.getTime()) / 86400000);
            if (days <= 0)
                return t("今天");
            if (days === 1)
                return t("昨天");
            if (days < 30)
                return String(days) + t(" 天前");
            return formatDate(iso);
        }
        /** 卡片头部的相对时间：与日期重复（≥30 天）时返回空串，别重复贴一个日期。 */
        function dreamAgo(dream, now) {
            const text = recentText(dream.at, now);
            return text === formatDate(dream.at) ? "" : text;
        }
        /** lastAt 缺失时的降级：在已加载的梦里找这条教训最近一次出现。 */
        function localLastAtFor(dreams, lesson) {
            const needle = String(lesson).toLowerCase();
            let best = "";
            for (const dream of dreams) {
                if (timestampOf(dream.at) <= timestampOf(best))
                    continue;
                for (const item of dream.lessons) {
                    if (item.toLowerCase() === needle) {
                        best = dream.at;
                        break;
                    }
                }
            }
            return best;
        }
        /** 极简行内标记：只认 **加粗**；其余原样，绝不用 dangerouslySetInnerHTML。 */
        const BOLD_RE = /\*\*([^*\n]+)\*\*/g;
        function inlineNodes(text, keyPrefix) {
            const nodes = [];
            let last = 0;
            let index = 0;
            let match;
            BOLD_RE.lastIndex = 0;
            while ((match = BOLD_RE.exec(text)) !== null) {
                if (match.index > last)
                    nodes.push(text.slice(last, match.index));
                nodes.push(h("strong", { key: keyPrefix + "-b" + String(index) }, match[1]));
                last = match.index + match[0].length;
                index += 1;
            }
            if (last < text.length)
                nodes.push(text.slice(last));
            return nodes;
        }
        function moodSlot(mood) {
            const text = String(mood);
            let hash = 0;
            for (let i = 0; i < text.length; i++)
                hash = (hash * 31 + text.charCodeAt(i)) % 997;
            return hash % MOOD_SLOTS;
        }
        /** 心境 → 颜色槽；0 用 business 默认色，1/2/3 分别是 success/warn/error。 */
        function toneClass(slot) {
            return slot === 0 ? "" : "dshd-tone-" + String(slot % MOOD_SLOTS);
        }
        function isCollapsible(text) {
            return String(text).split(/\r?\n/).length > 4 || String(text).length > 220;
        }
        /** 筛选条件归一：坏形状一律降级，不因为外部数据崩面板。 */
        function cleanupFilters(filters) {
            const source = filters !== null && typeof filters === "object" ? filters : {};
            const moods = Array.isArray(source.moods) ? source.moods.filter(function (mood) { return typeof mood === "string" && mood !== ""; }) : [];
            // 契约字段是 withLessons；onlyWithLessons 只是旧写法别名，两个都认。
            return { moods: moods, withLessons: source.withLessons === true || source.onlyWithLessons === true };
        }
        /** 生效中的筛选项数（用于按钮上的计数）：心境每选一个算 1，只看有教训算 1。 */
        function filterCountOf(filters) {
            const clean = cleanupFilters(filters);
            return clean.moods.length + (clean.withLessons === true ? 1 : 0);
        }
        /** 筛选只作用于「已加载窗口」，不冒充全量；无筛选时原样返回。 */
        function applyFilters(dreams, filters) {
            const list = Array.isArray(dreams) ? dreams : [];
            const clean = cleanupFilters(filters);
            if (filterCountOf(clean) === 0)
                return list;
            return list.filter(function (dream) {
                if (clean.moods.length > 0 && clean.moods.indexOf(dream.mood) === -1)
                    return false;
                if (clean.withLessons === true && dream.lessons.length === 0)
                    return false;
                return true;
            });
        }
        /** ≥8 场才值得摆筛选入口；0 场连搜索框都不渲染，同思路。 */
        function shouldShowFilters(loaded) {
            return typeof loaded === "number" && loaded >= 8;
        }
        /** 已加载的比总数少、且还没到路由上限 500，才需要「显示更早的梦」。 */
        function needsOlderDreams(loaded, total) {
            return typeof loaded === "number" && typeof total === "number" && loaded < total && loaded < MORE_LIMIT;
        }
        function countTextOf(query, total, count, filterCount, visibleCount) {
            if (filterCount > 0)
                return t("筛选后 ") + String(visibleCount) + " / " + String(count) + t(" 场");
            if (query !== "")
                return (languageOf() === "en" ? "“" : "「") + query + t("」命中 ") + String(count) + t(" 场");
            return t("共 ") + String(total) + t(" 场梦");
        }
        function listHintOf(query, count, filterCount, visibleCount) {
            if (filterCount > 0)
                return t("筛选当前已加载的 ") + String(count) + t(" 场 · 命中 ") + String(visibleCount) + t(" 场");
            if (query !== "")
                return (languageOf() === "en" ? "“" : "「") + query + t("」命中 ") + String(count) + t(" 场");
            return t("新梦在前");
        }
        function footerTextOf(query, limit, total, count) {
            if (limit > DEFAULT_LIMIT) {
                const capped = limit >= MORE_LIMIT && count < total ? t("（已达路由上限）") : "";
                return t("最近 ") + String(limit) + t(" 场 / 共 ") + String(total) + t(" 场") + capped;
            }
            return query === "" ? t("新梦在前 · 最多显示 ") + String(DEFAULT_LIMIT) + t(" 场") : t("搜索结果 · 最多显示 ") + String(DEFAULT_LIMIT) + t(" 场");
        }
        /** 面板的视图模型：所有文案/数字集中在这里算，组件只负责画。 */
        function viewModelOf(dreams, stats, now) {
            const list = Array.isArray(dreams) ? dreams : [];
            const total = stats !== null && typeof stats === "object" && typeof stats.total === "number" ? stats.total : list.length;
            const moodRows = stats !== null && typeof stats === "object" && Array.isArray(stats.moods) ? stats.moods : [];
            const rawLessons = stats !== null && typeof stats === "object" && Array.isArray(stats.topLessons) ? stats.topLessons : [];
            const lessonTotal = rawLessons.reduce((sum, row) => sum + (typeof row.count === "number" ? row.count : 0), 0);
            // 排序规则（lead 定案）：出现次数降序，同次数按 lastAt 降序，再按文本；并列不加奖牌色。
            const sortedLessons = rawLessons.slice().sort((a, b) => (b.count - a.count)
                || (timestampOf(b.lastAt) - timestampOf(a.lastAt))
                || String(a.lesson).localeCompare(String(b.lesson), "zh"));
            const lessonRows = sortedLessons.map((row, index) => {
                const fromStats = timestampOf(row.lastAt) > 0;
                const knownAt = fromStats ? row.lastAt : localLastAtFor(list, row.lesson);
                return {
                    rank: index + 1,
                    lesson: row.lesson,
                    count: row.count,
                    share: Math.max(6, Math.round(row.count / Math.max(lessonTotal, 1) * 100)),
                    showBar: row.count >= 2,
                    candidate: row.count >= 3,
                    lastText: knownAt === "" ? "" : (fromStats ? t("最近 ") : t("本页内最近 ")) + recentText(knownAt, now),
                    lastTitle: knownAt === "" ? "" : formatDate(knownAt) + (formatTime(knownAt) === "" ? "" : " " + formatTime(knownAt))
                        + (fromStats ? "" : t("（统计未给 lastAt，按本页已加载的 ") + String(list.length) + t(" 场现算）")),
                };
            });
            const span = spanOf(list);
            const spanText = span === null ? "" : spanTextOf(span);
            const spanFull = span === null ? "" : formatDate(new Date(span.from).toISOString()) + " → " + formatDate(new Date(span.to).toISOString());
            const spanHint = span === null ? "" : (span.days === 0 ? t("同一天") : t("约 ") + String(span.days) + t(" 天"));
            const blocks = list.slice().reverse().map((dream, index) => ({
                key: "block-" + (dream.id !== "" ? dream.id : "no-id") + "-" + String(index),
                tone: toneClass(moodSlot(dream.mood)),
                title: formatDate(dream.at) + (formatTime(dream.at) === "" ? "" : " " + formatTime(dream.at)) + " · " + dream.mood,
            }));
            const headline = headlineOf(list, total, span, now);
            return {
                total: total,
                count: list.length,
                showTiles: list.length >= 2,
                moodRows: moodRows,
                lessonRows: lessonRows,
                lessonTotal: lessonTotal,
                blocks: blocks,
                span: span,
                spanText: spanText,
                spanFull: spanFull,
                spanHint: spanHint,
                latestText: list.length === 0 ? "" : relativeTime(list[0].at, now),
                latestDate: list.length === 0 ? "" : formatDate(list[0].at),
                headline: headline,
                moodCount: moodRows.length,
            };
        }
        /** 标题行：1 场梦有专用文案（不出现「跨度 0 天」）；0 场不渲染。 */
        function headlineOf(dreams, total, span, now) {
            if (dreams.length === 0)
                return "";
            if (dreams.length === 1 && total <= 1) {
                const dream = dreams[0];
                return t("第 1 场梦 · ") + formatDate(dream.at) + t(" · 心境「") + dream.mood + (languageOf() === "en" ? "”" : "」");
            }
            const parts = [];
            parts.push(total > dreams.length ? t("共 ") + String(total) + t(" 场梦 · 本页最近 ") + String(dreams.length) + t(" 场") : String(dreams.length) + t(" 场梦"));
            if (span !== null)
                parts.push(span.from === span.to ? formatDate(new Date(span.from).toISOString()) : formatDate(new Date(span.from).toISOString()) + " → " + formatDate(new Date(span.to).toISOString()));
            parts.push(t("最近：") + relativeTime(dreams[0].at, now));
            return parts.join(" · ");
        }
        function loadPrivacy() {
            try {
                if (typeof window === "undefined" || window === null || window.localStorage === undefined)
                    return false;
                return window.localStorage.getItem(PRIVACY_KEY) === "1";
            }
            catch (error) {
                return false;
            }
        }
        function savePrivacy(value) {
            try {
                if (typeof window === "undefined" || window === null || window.localStorage === undefined)
                    return;
                window.localStorage.setItem(PRIVACY_KEY, value === true ? "1" : "0");
            }
            catch (error) { /* 隐私模式/配额满写不进去就算了，状态只活在内存里 */ }
        }
        // ───────────────────────── 小组件 ─────────────────────────
        function Btn({ on, pressed, variant, children, ...props }) {
            return h(W.Button, { ...props, variant: on && !variant ? 'toolbar' : variant, 'aria-pressed': pressed }, children);
        }
        function StatTile(props) {
            return h("div", { className: css['dshd-tile'], 'data-dsh-card': '' }, [
                h("div", { className: css['dshd-tile-label'], key: "l" }, props.label),
                h("div", { className: css['dshd-tile-value'], key: "v", title: props.title === undefined ? props.value : props.title }, props.value),
                props.hint === "" || props.hint === undefined ? null : h("div", { className: css['dshd-tile-hint'], key: "h", title: props.hint }, props.hint),
            ]);
        }
        function MoodCard(props) {
            const vm = props.vm;
            return h("section", { className: css['dshd-card'], 'data-dsh-card': '' }, [
                h("h4", { key: "t" }, t("心境")),
                h("div", { className: css['dshd-mblocks'], key: "blocks" }, vm.blocks.map((block) => h("span", {
                    key: block.key,
                    className: clsx(css['dshd-mblock'], css[block.tone]),
                    title: block.title,
                }))),
                vm.count === 1
                    ? h("div", { className: css['dshd-hint'], key: "one" }, [
                        h("span", { key: "txt" }, t("1 场梦，先不谈分布 —— 再做梦会累积。")),
                        " ",
                        h(W.CopyPrompt, { key: "cp", prompt: t("做个梦"), label: t("复制「做个梦」") }),
                    ])
                    : h("div", { key: "legend" }, [
                        h("div", { className: css['dshd-note'], key: "cap" }, t("左 → 右：从早到晚")),
                        h("div", { className: css['dshd-legend'], key: "rows" }, vm.moodRows.map((row, index) => h("div", { className: css['dshd-legend-row'], key: "mood-" + String(index) + "-" + row.mood }, [
                            h("span", { className: clsx(css['dshd-mblock'], css[toneClass(moodSlot(row.mood))]), key: "d" }),
                            h("span", { className: css['dshd-legend-name'], key: "n", title: row.mood }, row.mood),
                            h("span", { className: css['dshd-legend-count'], key: "c" }, String(row.count) + t(" 场")),
                        ]))),
                    ]),
            ]);
        }
        function LessonCard(props) {
            const vm = props.vm;
            return h("section", { className: css['dshd-card'], 'data-dsh-card': '' }, [
                h("h4", { key: "t" }, t("教训榜")),
                vm.lessonRows.length === 0
                    ? h("div", { className: css['dshd-hint'], key: "e" }, t("还没有教训 —— 记梦时带上 lessons，出现次数会在这里累积。"))
                    : h("div", { key: "rows" }, vm.lessonRows.map((row, index) => h("div", { className: css['dshd-lesson'], key: "lesson-" + String(index) + "-" + row.lesson }, [
                        h("span", { className: css['dshd-rank'], key: "r" }, String(row.rank)),
                        h("span", { className: css['dshd-lesson-body'], key: "b" }, [
                            h("span", { className: css['dshd-lesson-text'], key: "t" }, row.lesson),
                            row.showBar ? h("span", { className: css['dshd-track'], key: "bar" }, h("span", { className: css['dshd-fill'], key: "fill", style: { width: String(row.share) + "%" } })) : null,
                        ]),
                        h("span", { className: css['dshd-lesson-meta'], key: "m" }, [
                            h("span", { className: css['dshd-times'], key: "c" }, "×", h("b", { key: "n" }, String(row.count))),
                            row.lastText === "" ? null : h("span", { className: css['dshd-last'], key: "l", title: row.lastTitle }, row.lastText),
                            row.candidate ? h("span", { className: css['dshd-badge'], key: "badge" }, t("常见教训")) : null,
                        ]),
                    ]))),
                h("div", { className: css['dshd-note'], key: "note" }, t("次数仅表示日记里的出现频率；出现 ≥3 次标为「常见教训」。写入项目规则前仍需核验来源并审阅经验。最近时间取自 stats.lastAt；统计缺失时按本页已加载的梦现算。")),
            ]);
        }
        /** 复制命令按钮：成功给「已复制」，剪贴板不可用时回退为可选中文本。 */
        function CopyCommand(props) {
            const command = typeof props.command === "string" ? props.command : "";
            const [copied, setCopied] = useState(false);
            const [failed, setFailed] = useState(false);
            if (command === "")
                return null;
            const onCopy = function () {
                copyText(command).then(function (ok) {
                    setCopied(ok === true);
                    setFailed(ok !== true);
                });
            };
            const label = props.label === undefined ? t("复制命令") : props.label;
            return h("span", { className: css['dshd-copywrap'] }, [
                h(Btn, {
                    key: "b",
                    icon: copied === true ? 'check' : 'copy',
                    'data-copied': copied === true ? 'true' : undefined,
                    onClick: onCopy,
                    disabled: props.disabled === true,
                    title: props.title === undefined ? command : props.title,
                }, copied === true ? t("已复制") : label),
                failed === true ? h("code", { key: "cmd", className: css['dshd-cmd'], tabIndex: 0 }, command) : null,
                failed === true ? h("span", { key: "hint", className: css['dshd-note'] }, t("剪贴板不可用：请手动选中上面的命令复制。")) : null,
            ]);
        }
        function ReviewControls(props) {
            const row = props.row;
            const reviewFormId = typeof useId === "function" ? useId() : "dream-review-" + row.id;
            const [open, setOpen] = useState(false);
            const [action, setAction] = useState(reviewActionFor(row.state));
            const [resolution, setResolution] = useState("prefer");
            const [note, setNote] = useState("");
            const [feedbackNote, setFeedbackNote] = useState("");
            const [feedbackRetry, setFeedbackRetry] = useState(null);
            const [affected, setAffected] = useState(function () { return row.conflictIds[0] || ""; });
// Update protection: dsh-dream.review-note
__stardustUpdatesGuard(React, "dsh-dream.review-note", { dirty: !!note.trim() || !!feedbackNote.trim() });

            const [pending, setPending] = useState(false);
            const submitLock = useRef(false);
            const [completed, setCompleted] = useState(false);
            const [error, setError] = useState("");
            const [preview, setPreview] = useState(null);
            const [globalConfirmed, setGlobalConfirmed] = useState(false);
            useEffect(function () { setGlobalConfirmed(false); }, [row.id, row.revision]);
            const commands = row.state === "rejected" ? [["reopen", t("重新送审")]]
                : row.state === "disputed" ? [["resolve-conflict", t("处理冲突")], ["reject", t("丢弃")]]
                    : row.state === "usable" ? [["mark-stale", t("标记待复核")], ["reject", t("驳回")]]
                        : [["accept", t("确认采纳")], ["reject", t("丢弃")], ["mark-stale", t("标记待复核")]];
            const reviewBusy = pending || completed || props.batchPending;
            const effectiveAction = commands.some(function (item) { return item[0] === action; }) ? action : commands[0][0];
            const needsGlobalConfirmation = (row.isGlobal && commands.some(item => item[0] === 'accept')) || (row.state === 'disputed' && (row.isGlobal || row.hasGlobalConflicts));
            const command = reviewCommandOf(row, { action: effectiveAction, resolution: resolution, note: note, affectedIds: affected === "" ? [] : [affected] });
            const submit = async function (body, message, isPreview) {
                if (submitLock.current || completed || props.batchPending)
                    return;
                submitLock.current = true;
                setPending(true);
                setError("");
                try {
                    const result = await postAction(body);
                    if (isPreview)
                        setPreview(result);
                    else {
                        if (body.operation === 'review') {
                            if (body.action === 'accept' || body.action === 'reject') await props.onExit?.(body.action);
                            setCompleted(true);
                        }
                        setPreview(null);
                        if (props.onChanged)
                            props.onChanged(result.unchanged === true ? t("管理块内容已一致，无需写入。") : message);
                    }
                }
                catch (failure) {
                    setError(failure.name === "TimeoutError" ? t("请求超时，请先刷新确认结果后再重试。") : displayError(failure));
                    if (body.operation === "apply")
                        setPreview(null);
                }
                finally {
                    submitLock.current = false;
                    setPending(false);
                }
            };
            const review = function (chosen) {
                return submit({ operation: "review", action: chosen, lessonId: row.id, expectedRevision: row.revision, confirmGlobal: globalConfirmed, resolution: resolution, note: note, affectedIds: affected === "" ? [] : [affected] }, t("已更新「") + row.title + t("」的审阅状态。"));
            };
            const feedback = function (vote) {
                const signature = row.id + "@" + row.revision + ":" + vote + ":" + feedbackNote;
                const requestId = feedbackRetry && feedbackRetry.signature === signature ? feedbackRetry.id
                    : typeof crypto !== "undefined" && typeof crypto.randomUUID === "function" ? crypto.randomUUID() : "feedback_" + Date.now() + "_" + Math.random().toString(36).slice(2);
                setFeedbackRetry({ signature: signature, id: requestId });
                return submit({ operation: "feedback", lessonId: row.id, expectedRevision: row.revision, vote: vote, requestId: requestId, ...(feedbackNote.trim() === "" ? {} : { note: feedbackNote.trim() }) }, t("已记录使用反馈；「") + row.title + t("」的审阅状态保持原样。"));
            };
            return h(React.Fragment, null,
              h("header", { className: css['inspector-toolbar'] }, props.toolbar,
                h("div", { className: css.actions, role: "group", "aria-label": row.title + t("的操作") }, [
                    ...commands.filter(function (item) { return item[0] !== "resolve-conflict" && item[0] !== "mark-stale"; }).map(function (item) {
                        const shortcut = props.shortcuts && ({ accept: 'A', reject: 'D' })[item[0]];
                        return h(Btn, {
                            key: item[0], size: 'sm', variant: item[0] === 'accept' ? 'primary' : undefined,
                            icon: item[0] === 'accept' ? 'check' : item[0] === 'reject' ? 'trash' : undefined,
                            className: item[0] === 'reject' ? css.danger : undefined,
                            disabled: reviewBusy || row.revision < 1 || (item[0] === 'accept' && row.isGlobal && !globalConfirmed),
                            onClick: () => review(item[0]),
                            'data-dream-command': shortcut ? item[0] : undefined,
                            'aria-keyshortcuts': shortcut || undefined,
                        }, item[1]);
                    }),
                    h(Btn, { key: "review", size: 'sm', icon: 'down', disabled: reviewBusy, onClick: function () { setOpen(!open); }, "aria-expanded": open }, open ? t("收起审阅") : row.state === "disputed" ? t("处理冲突") : t("更多审阅操作")),
                    row.bridgeable === true && row.workspaceRoot !== "" ? h(Btn, { key: "preview", size: 'sm', disabled: reviewBusy || props.masked, icon: 'diff', "data-dream-command": 'bridge-diff', onClick: function () { submit({ operation: "preview", lessonId: row.id, expectedRevision: row.revision }, "", true); } }, t("预览规则变更")) : null,
                    row.bridgeable === true && row.workspaceRoot === "" ? h(CopyCommand, { key: "preview-command", command: bridgePreviewCommandOf(row.id, row.projectId, row.workspaceRoot), label: t("复制项目预览命令") }) : null,
                ])),
              h("div", { className: css['inspector-scroll'] }, [
                needsGlobalConfirmation ? h(W.Checkbox, { key: 'global-confirm', className: clsx(css.checkLabel, css['dshd-note']), checked: globalConfirmed, disabled: reviewBusy, onChange: checked => setGlobalConfirmed(checked), label: t('全局经验会用于所有项目；我已核对并同意。') }) : null,
                pending ? h("div", { key: "pending", role: "status", className: css['dshd-note'] }, t("正在处理…")) : null,
                error !== "" ? h("div", { key: "error", role: "alert", className: css['dshd-hint'] }, [error, h(Btn, { key: "refresh", icon: 'refresh', disabled: pending, onClick: function () { if (props.onChanged)
                            props.onChanged(t("已刷新经验列表。")); } }, t("刷新列表"))]) : null,
                open ? h("div", { className: css['dshd-reviewform'], key: "form", onKeyDown: function (event) {
                        if (event.key === "Escape" && !pending) {
                            event.preventDefault();
                            event.stopPropagation();
                            setOpen(false);
                        }
                    } }, [
                    h("label", { key: "action", htmlFor: reviewFormId + "-action" }, [t("审阅动作"), h("select", { id: reviewFormId + "-action", "aria-label": t("审阅动作"), disabled: pending, value: effectiveAction, onChange: function (event) { setAction(event.target.value); } }, commands.map(function (item) { return h("option", { value: item[0], key: item[0] }, item[1]); }))]),
                    effectiveAction === "resolve-conflict" ? h("div", { key: "conflict" }, [
                        h("label", { key: "against", htmlFor: reviewFormId + "-against" }, [t("冲突经验"), h("select", { id: reviewFormId + "-against", "aria-label": t("冲突经验"), disabled: pending, value: affected, onChange: function (event) { setAffected(event.target.value); } }, row.conflicts.map(function (item) { return h("option", { key: item.id, value: item.id, title: item.title }, item.title); }))]),
                        h("label", { key: "resolution", htmlFor: reviewFormId + "-resolution" }, [t("处理方式"), h("select", { id: reviewFormId + "-resolution", "aria-label": t("处理方式"), disabled: pending, value: resolution, onChange: function (event) { setResolution(event.target.value); } }, [
                                h("option", { key: "prefer", value: "prefer" }, t("采用这条，驳回对方")),
                                h("option", { key: "drop", value: "drop" }, t("放弃这条，保留对方")),
                                h("option", { key: "merge", value: "merge" }, t("合并到这条，对方留作历史")),
                            ])]),
                        h("label", { key: "note", htmlFor: reviewFormId + "-note" }, [t("处理依据"), h("textarea", { id: reviewFormId + "-note", "aria-label": t("处理依据"), disabled: pending, rows: 2, maxLength: 500, value: note, placeholder: t("说明哪个来源支持这次决定…"), onChange: function (event) { setNote(event.target.value); } })]),
                    ]) : null,
                    h(Btn, { key: "confirm", disabled: reviewBusy || command === "" || (!globalConfirmed && ((effectiveAction === 'accept' && row.isGlobal) || (effectiveAction === 'resolve-conflict' && (row.isGlobal || row.hasGlobalConflicts)))), onClick: function () { review(effectiveAction); }, variant: "primary" }, t("确认审阅")),
                    h("details", { key: "fallback" }, [h("summary", { key: "summary" }, t("在对话里处理")), command === "" ? h("div", { key: "hint", className: css['dshd-note'] }, t("选择冲突经验并填写处理依据后即可处理。")) : h(CopyCommand, { key: "copy", command: command, label: t("复制审阅命令") })]),
                ]) : null,
                h(React.Fragment, { key: 'checks' }, props.children),
                preview && !props.masked ? h(W.Dialog, { key: "preview", title: t("规则变更预览"), busy: pending, onClose: () => setPreview(null) }, [
                    h("div", { key: "target", className: css['dshd-note'] }, t("目标：") + preview.resolvedPath),
                    h("pre", { key: "diff", className: css['dshd-diff'], tabIndex: 0 }, preview.diff
                        ? preview.diff.split('\n').map((line, index) => h('span', {
                            key: index, className: clsx(css.diffLine, line.startsWith('+') && !line.startsWith('+++') && css.diffAdd,
                                line.startsWith('-') && !line.startsWith('---') && css.diffRemove),
                        }, line || '\u00a0'))
                        : t("管理块内容已经一致，无需更改。")),
                    h("div", { key: "help", className: css['dshd-note'] }, t("将按此预览重建 Dream 管理块，请核对新增和删除内容。块外内容保留，写入前创建回滚备份。")),
                    h('div', { key: 'actions', className: css.actions },
                        h(Btn, { disabled: pending, onClick: () => setPreview(null) }, t("取消预览")),
                        h(Btn, { disabled: pending, variant: "primary", onClick: () => submit({ operation: "apply", token: preview.token }, t("规则已应用，可在「写入记录」中回滚。")) }, t("应用此变更"))),
                ]) : null,
                h("details", { key: "feedback", className: css['dshd-feedback'] }, [
                    h("summary", { key: "summary" }, t("使用反馈 · 有用 ") + (row.feedback.useful || 0) + t(" · 不适用 ") + (row.feedback.notApplicable || 0)),
                    h("label", { key: "note", htmlFor: reviewFormId + "-feedback-note" }, [t("场景备注（可选）"), h("textarea", { id: reviewFormId + "-feedback-note", "aria-label": t("反馈场景备注"), rows: 2, disabled: pending, maxLength: 500, value: feedbackNote, placeholder: t("这次在哪个场景使用…"), onChange: function (event) { setFeedbackNote(event.target.value); } })]),
                    h(Btn, { key: "useful", disabled: pending, onClick: function () { feedback("useful"); } }, t("这次有用")),
                    h(Btn, { key: "not", disabled: pending, onClick: function () { feedback("not-applicable"); } }, t("这次不适用")),
                    h("div", { key: "help", className: css['dshd-note'] }, t("记录使用情况，供之后复核；采纳与驳回由审阅决定。")),
                    ...(Array.isArray(row.feedback.recent) ? row.feedback.recent.slice(-3).reverse().map(function (item, index) {
                        return h("div", { key: "recent-" + index, className: css['dshd-note'] }, formatDate(item.at) + " · " + (item.vote === "useful" ? t("有用") : t("不适用")) + (item.note ? " · " + item.note : ""));
                    }) : []),
                ]),
              ]));
        }
        function RollbackControl(props) {
            const [confirm, setConfirm] = useState(false);
            const [pending, setPending] = useState(false);
// Update protection: dsh-dream.rollback
__stardustUpdatesGuard(React, "dsh-dream.rollback", { busy: pending });

            const [error, setError] = useState("");
            const rollback = async function () {
                if (pending)
                    return;
                setPending(true);
                setError("");
                try {
                    await postAction({ operation: "rollback", backupId: props.row.id });
                    setConfirm(false);
                    if (props.onChanged)
                        props.onChanged(t("已恢复上一次的 Dream 管理块，块外内容保留。"));
                }
                catch (failure) {
                    setError(displayError(failure));
                }
                finally {
                    setPending(false);
                }
            };
            return h("div", { className: css['dshd-reviewform'] }, [
                h(Btn, { key: "start", disabled: pending, onClick: function () { setConfirm(!confirm); } }, confirm ? t("取消回滚") : t("回滚这次变更")),
                confirm ? h("div", { key: "confirm" }, [
                    h("p", { key: "target", className: css['dshd-note'] }, t("将恢复「") + props.row.target + t("」的前一个 Dream 管理块。块外内容保留；管理块已被修改时会拒绝回滚。")),
                    h(Btn, { key: "apply", variant: "primary", disabled: pending, onClick: rollback }, pending ? t("正在回滚…") : t("确认回滚管理块")),
                ]) : null,
                error ? h("div", { key: "error", role: "alert", className: css['dshd-hint'] }, error) : null,
            ]);
        }
        function BridgeLogCard(props) {
            const vm = props.vm;
            const head = function (extra) {
                return h("div", { className: css['dshd-khead'], key: "head" }, [
                    h("h4", { key: "t", 'data-dsh-serif': '' }, t("写入记录")),
                    h("span", { className: css['dshd-spacer'], key: "s" }),
                    extra,
                ]);
            };
            if (props.error !== null && props.error !== undefined) {
                return h("section", { className: clsx(css['dshd-card'], css['dshd-kcard']), 'data-dsh-card': '' }, [
                    head(h(Btn, { key: "retry", icon: 'refresh', onClick: props.onRetry, disabled: props.loading === true }, t("重试"))),
                    h("div", { className: css['dshd-hint'], key: "e", role: "alert" }, t("读取写入记录失败：") + displayError(props.error)),
                ]);
            }
            if (props.loading === true) {
                return h("section", { className: clsx(css['dshd-card'], css['dshd-kcard']), 'data-dsh-card': '' }, [
                    head(h("span", { className: css['dshd-hint'], key: "l" }, t("加载中…"))),
                    h(W.Skeleton, { key: "skel-1", variant: "row", label: t("加载中…") }),
                    h(W.Skeleton, { key: "skel-2", variant: "row" }),
                ]);
            }
            if (vm.rows.length === 0) {
                const empty = bridgeEmptyState();
                return h("section", { className: clsx(css['dshd-card'], css['dshd-kcard']), 'data-dsh-card': '' }, [
                    h("h4", { key: "t" }, t("写入记录")),
                    h("div", { className: css['dshd-kempty'], key: "empty" }, [
                        h("div", { className: css['dshd-kempty-title'], key: "t2" }, empty.title),
                        h("p", { className: css['dshd-kempty-body'], key: "b" }, empty.body),
                        h("p", { className: css['dshd-note'], key: "h" }, empty.hint),
                    ]),
                ]);
            }
            return h("section", { className: clsx(css['dshd-card'], css['dshd-kcard']), 'data-dsh-card': '' }, [
                head(h("span", { className: css['dshd-hint'], key: "c" }, String(vm.total) + t(" 次写入 · ") + String(vm.rollbackable) + t(" 次可回滚"))),
                h("div", { className: css['dshd-krows'], key: "rows" }, vm.rows.map(function (row, index) {
                    return h("div", { className: css['dshd-bridge'], 'data-dsh-row': '', key: row.id !== "" ? row.id : "bridge-" + String(index) }, [
                        h("div", { className: css['dshd-bridge-head'], key: "h" }, [
                            h("span", { className: css['dshd-kbadge'], key: "a" }, row.actionLabel),
                            h("span", { className: css['dshd-bridge-target'], key: "t", title: row.target }, row.target),
                            h("span", { className: css['dshd-spacer'], key: "s" }),
                            h("span", { className: css['dshd-klast'], key: "at", title: row.atTitle }, row.atText),
                        ]),
                        h("div", { className: css['dshd-bridge-meta'], key: "m" }, [
                            h("span", { key: "lessons", title: row.lessonsText }, t("经验：") + row.lessonsText),
                            row.beforeShort === "" ? null : h("span", { key: "before" }, t("前哈希：") + row.beforeShort),
                            row.afterShort === "" ? null : h("span", { key: "after" }, t("后哈希：") + row.afterShort),
                            h("span", { key: "rb", className: row.rollbackable ? css['dshd-rollback-ok'] : css['dshd-rollback-no'] }, row.rollbackText),
                        ]),
                        h("details", { key: "backup" }, [
                            h("summary", { key: "summary" }, t("备份标识与回滚命令")),
                            h("code", { key: "id", className: css['dshd-cmd'] }, row.id),
                            row.rollbackable === true ? h("code", { key: "command", className: css['dshd-cmd'], tabIndex: 0 }, bridgeRollbackCommandOf(row)) : null,
                        ]),
                        row.rollbackable === true ? h(RollbackControl, { key: "rollback", row: row, onChanged: props.onChanged }) : null,
                    ]);
                })),
                vm.shown < vm.total ? h("div", { className: css['dshd-note'], key: "more" }, t("只显示最近 ") + String(vm.shown) + " / " + String(vm.total) + t(" 条记录。")) : null,
                h("div", { className: css['dshd-note'], key: "note" }, t("回滚恢复对应备份的 Dream 管理块；块外内容保留，外部修改的管理块会停止回滚。")),
            ]);
        }
        function DreamCard(props) {
            const dream = props.dream;
            const privacy = props.privacy === true;
            const collapsible = isCollapsible(dream.reflection);
            const [expanded, setExpanded] = useState(false);
            const [peek, setPeek] = useState(false);
            const timeText = formatDate(dream.at) + (formatTime(dream.at) === "" ? "" : " " + formatTime(dream.at));
            const clickCard = privacy ? function () { setPeek(peek !== true); } : undefined;
            return h("article", {
                className: clsx(css['dshd-dream'], css['dshd-mood-' + moodSlot(dream.mood)], privacy && peek && css['dshd-peek']),
                'data-dsh-card': '',
                onClick: clickCard,
                title: privacy ? t("隐私模式：点击卡片临时查看") : undefined,
            }, [
                h("header", { className: css['dshd-dream-head'], key: "h" }, [
                    h("time", { className: css['dshd-time'], key: "t", dateTime: dream.at === "" ? undefined : dream.at, title: dream.at === "" ? timeText : timeText + " · " + dream.at }, timeText),
                    dreamAgo(dream, props.now) === "" ? null : h("span", { className: css['dshd-ago'], key: "a" }, dreamAgo(dream, props.now)),
                    h("span", { className: css['dshd-mood'], key: "m", title: t("心境：") + dream.mood }, [
                        h("i", { className: clsx(css['dshd-mooddot'], css[toneClass(moodSlot(dream.mood))]), key: "d" }),
                        dream.mood,
                    ]),
                    h("span", { className: css['dshd-spacer'], key: "s" }),
                    collapsible ? h("button", {
                        type: "button",
                        className: css['dshd-linkbtn'],
                        key: "btn",
                        onClick: function (event) { if (event !== undefined && event.stopPropagation !== undefined)
                            event.stopPropagation(); setExpanded(expanded !== true); },
                    }, expanded === true ? t("收起") : t("展开全文")) : null,
                ]),
                h("div", { className: clsx(css['dshd-reflection'], collapsible && !expanded && css['dshd-clamp']), key: "r" }, inlineNodes(dream.reflection, "reflection-" + String(props.index))),
                dream.lessons.length === 0 ? null : h("ol", { className: css['dshd-lessons'], key: "l" }, dream.lessons.map((lesson, index) => h("li", { key: "li-" + String(index) + "-" + lesson }, [
                    h("span", { className: css['dshd-num'], key: "n" }, String(index + 1)),
                    h("span", { className: css['dshd-lesson-li'], key: "t" }, inlineNodes(lesson, "lesson-" + String(props.index) + "-" + String(index))),
                ]))),
            ]);
        }
        function EmptyState(props) {
            const moon = h("svg", { width: 34, height: 34, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.6, strokeLinecap: "round", strokeLinejoin: "round", 'aria-hidden': true, key: "i" }, [
                h("path", { key: "p", d: "M21 12.8A8.5 8.5 0 1 1 11.2 3a6.5 6.5 0 0 0 9.8 9.8z" }),
            ]);
            if (props.query !== undefined && props.query !== "") {
                return h("div", { className: css['dshd-empty'] }, [
                    moon,
                    h("h3", { key: "t" }, t("没有找到「") + props.query + t("」相关的梦")),
                    h("p", { key: "p" }, t("换个关键词试试，或者清空搜索看全部梦境。")),
                    props.onClear ? h("div", { key: "a" }, h(Btn, { onClick: props.onClear }, t("清空搜索"))) : null,
                ]);
            }
            return h("div", { className: css['dshd-empty'] }, [
                moon,
                h("h3", { key: "t" }, t("还没有梦境日记")),
                h("p", { key: "p" }, t("自动整理的内容在「经验」页待审阅；日记可让助手复盘时单独生成。")),
                h("div", { className: css['dshd-chips'], key: "c" }, [
                    h(W.CopyPrompt, { key: "s1", variant: "primary", prompt: t("做个梦"), label: t("复制「做个梦」") }),
                    h(W.CopyPrompt, { key: "s2", prompt: t("复盘最近的对话并提炼可复用的项目经验"), label: t("复制复盘提炼指令") }),
                    props.onReview ? h(Btn, { key: "s3", icon: "book", size: "sm", onClick: props.onReview }, t("查看待审阅经验")) : null,
                ]),
            ]);
        }
        function Skeleton() {
            return h("div", { className: css.skeletonWrap, role: "status", 'aria-busy': "true", 'aria-label': t("加载中…") },
                [0, 1, 2].map((index) => h(W.Skeleton, { variant: "card", key: String(index) })));
        }
        // ───────────────────────── 主面板 ─────────────────────────
        function DreamPanel({workbench=false}={}) {
            const [activeTab, setActiveTab] = useState("review");
            const root = useRef(null);
            const moveCandidate = useRef(null);
            const tabId = useId();
            const [skin, setSkin] = useDreamStyle(root);
            const [font, setFont] = useDreamFont(root);
            const [paletteActions, setPaletteActions] = useState(null);
            const [dreams, setDreams] = useState([]);
            const [stats, setStats] = useState(null);
            const [loading, setLoading] = useState(true);
            const [error, setError] = useState(null);
            const [queryInput, setQueryInput] = useState("");
            const [query, setQuery] = useState("");
            const [reloadToken, setReloadToken] = useState(0);
            const [actionNotice, setActionNotice] = useState("");
            const [now, setNow] = useState(function () { return new Date(); });
            const [privacy, setPrivacy] = useState(loadPrivacy);
            const [filters, setFilters] = useState({ moods: [], withLessons: false });
            const [filterOpen, setFilterOpen] = useState(false);
            const [limit, setLimit] = useState(DEFAULT_LIMIT);
            const [knowledge, setKnowledge] = useState(() => ({ data: null, revisions: new Map() }));
            const [knowledgeLoading, setKnowledgeLoading] = useState(true);
            const [knowledgeError, setKnowledgeError] = useState(null);
            const [bridge, setBridge] = useState(null);
            const [bridgeLoading, setBridgeLoading] = useState(true);
            const [bridgeError, setBridgeError] = useState(null);
            const reload = useCallback(() => setReloadToken(value => value + 1), []);
            const automation = useAutomaticMemory(reloadToken, reload);
            const openPalette = useCallback(() => {
                const buttons = [...root.current.querySelectorAll('[data-dream-command]:enabled')];
                setPaletteActions(buttons.map(button => ({
                    id: button.dataset.dreamCommand,
                    label: button.textContent.trim(),
                    shortcut: button.getAttribute('aria-keyshortcuts'),
                    run: () => { if (button.isConnected) button.click(); },
                })));
            }, []);
            function changeTab(value) {
                if (value === activeTab) return;
                runViewTransition(root.current, () => { setFilterOpen(false); setActiveTab(value); });
            }
            useEffect(() => {
                if (!filterOpen) return;
                const panel = root.current;
                const doc = panel.ownerDocument;
                function outside(event) {
                    if (!event.target.closest?.('[data-dream-journal-filter]')) setFilterOpen(false);
                }
                function escape(event) {
                    if (event.key !== 'Escape' || !panel.contains(event.target)) return;
                    event.preventDefault();
                    event.stopPropagation();
                    setFilterOpen(false);
                    panel.querySelector('[data-dream-journal-filter] > button')?.focus();
                }
                doc.addEventListener('pointerdown', outside);
                doc.addEventListener('keydown', escape, true);
                return () => {
                    doc.removeEventListener('pointerdown', outside);
                    doc.removeEventListener('keydown', escape, true);
                };
            }, [filterOpen]);
            useEffect(() => {
                const panel = root.current;
                const doc = panel.ownerDocument;
                function handle(event) {
                    if (event.defaultPrevented || event.isComposing || event.keyCode === 229 || !panel.getClientRects().length || panel.closest('[inert], [hidden]')) return;
                    const focused = doc.activeElement;
                    if (!panel.contains(focused) && !(workbench && focused === doc.body)) return;
                    const topLayer = [...doc.querySelectorAll('[aria-modal="true"], [role="menu"]')].at(-1);
                    if (topLayer && !topLayer.contains(panel)) return;
                    const key = event.key.toLowerCase();
                    if ((event.ctrlKey || event.metaKey) && !event.altKey && !event.shiftKey && key === 'k') {
                        event.preventDefault();
                        event.stopPropagation();
                        if (!event.repeat) openPalette();
                        return;
                    }
                    if (activeTab !== 'review' || event.altKey || event.ctrlKey || event.metaKey || focused?.closest(editableSelector)) return;
                    if ((key === 'j' || key === 'k') && moveCandidate.current?.(key === 'j' ? 1 : -1)) {
                        event.preventDefault();
                        event.stopPropagation();
                    } else if (!event.repeat && (key === 'a' || key === 'd')) {
                        const command = panel.querySelector(key === 'a' ? '[data-dream-command="accept"]:enabled' : '[data-dream-command="reject"]:enabled');
                        if (command) {
                            event.preventDefault();
                            event.stopPropagation();
                            command.click();
                        }
                    }
                }
                doc.addEventListener('keydown', handle, true);
                return () => doc.removeEventListener('keydown', handle, true);
            }, [activeTab, workbench, openPalette]);
            // 搜索防抖：连续打字只发一次请求；回车立即生效。
            useEffect(function () {
                const timer = setTimeout(function () { setQuery(queryInput.trim()); }, SEARCH_DEBOUNCE_MS);
                return function () { clearTimeout(timer); };
            }, [queryInput]);
            useEffect(function () {
                let alive = true;
                setLoading(true);
                setError(null);
                fetchJournal(query, limit).then(function (payload) {
                    if (alive !== true)
                        return;
                    const list = normalizeDreams(payload.dreams, limit);
                    setDreams(list);
                    setStats(normalizeStats(payload.stats, list));
                    setNow(new Date());
                    setLoading(false);
                }).catch(function (failure) {
                    if (alive !== true)
                        return;
                    setError(failure instanceof Error ? failure : new Error(String(failure)));
                    setLoading(false);
                });
                return function () { alive = false; };
            }, [query, limit, reloadToken]);
            // 经验区块独立取数：知识路由挂了但日记读不出来时，经验仍能显示（反之亦然）。
            useEffect(function () {
                let alive = true;
                setKnowledgeLoading(true);
                setKnowledgeError(null);
                fetchKnowledge().then(function (payload) {
                    if (alive !== true)
                        return;
                    setKnowledge(previous => historyAfter(previous, payload));
                    setKnowledgeLoading(false);
                }).catch(function (failure) {
                    if (alive !== true)
                        return;
                    setKnowledgeError(failure instanceof Error ? failure : new Error(String(failure)));
                    setKnowledgeLoading(false);
                });
                return function () { alive = false; };
            }, [reloadToken]);
            // 写入记录独立取数：桥接目录不存在时返回空，不影响其余区块。
            useEffect(function () {
                let alive = true;
                setBridgeLoading(true);
                setBridgeError(null);
                fetchBridgeRecords().then(function (payload) {
                    if (alive !== true)
                        return;
                    setBridge(payload);
                    setBridgeLoading(false);
                }).catch(function (failure) {
                    if (alive !== true)
                        return;
                    setBridgeError(failure instanceof Error ? failure : new Error(String(failure)));
                    setBridgeLoading(false);
                    setBridge(null);
                });
                return function () { alive = false; };
            }, [reloadToken]);
            const vm = viewModelOf(dreams, stats, now);
            const knowledgeVm = normalizeKnowledge(knowledge.data, now);
            const bridgeVm = bridge === null ? { rows: [], total: 0, shown: 0, rollbackable: 0 } : normalizeBridgeRecords(bridge, now);
            const pristine = vm.count === 0 && query === "";
            const filterCount = filterCountOf(filters);
            const visibleDreams = applyFilters(dreams, filters);
            const showFilterButton = shouldShowFilters(vm.count) || filterCount > 0;
            const canLoadMore = needsOlderDreams(vm.count, vm.total) && limit < MORE_LIMIT;
            const clearSearch = function () { setQueryInput(""); setQuery(""); };
            const togglePrivacy = function () {
                const next = privacy !== true;
                setPrivacy(next);
                savePrivacy(next);
            };
            const toggleMoodFilter = function (mood) {
                setFilters(function (prev) {
                    const has = prev.moods.indexOf(mood) !== -1;
                    return { moods: has === true ? prev.moods.filter(function (item) { return item !== mood; }) : prev.moods.concat([mood]), withLessons: prev.withLessons === true };
                });
            };
            const toggleOnlyLessons = function () {
                setFilters(function (prev) { return { moods: prev.moods, withLessons: prev.withLessons !== true }; });
            };
            const clearFilters = function () { setFilters({ moods: [], withLessons: false }); };
            const showMore = function () { if (limit < MORE_LIMIT)
                setLimit(MORE_LIMIT); };
            const onChanged = function (message) { setActionNotice(message); setReloadToken(function (value) { return value + 1; }); };
            const showKnowledge = function () { if (knowledgeLoading !== true)
                setReloadToken(function (value) { return value + 1; }); };
            const showBridge = function () { if (bridgeLoading !== true)
                setReloadToken(function (value) { return value + 1; }); };
            const bridgeLogCard = h(BridgeLogCard, {
                key: "bridge-log",
                vm: bridgeVm,
                loading: bridgeLoading === true,
                error: bridgeError,
                onRetry: showBridge,
                onChanged: onChanged,
            });
            const toolbar = h("div", { className: css['dshd-toolbar'], key: "toolbar" }, [pristine || activeTab !== "journal" ? null : h("div", { className: css['dshd-search'], key: "search" }, [
                    h(W.Search, {
                        key: "search-input",
                        type: "search",
                        value: queryInput,
                        label: t("搜索反思与教训…"),
                        onChange: function (event) { setQueryInput(event.target.value); },
                        onKeyDown: function (event) { if (event.key === "Enter")
                            setQuery(event.target.value.trim()); },
                    }),
                    queryInput === "" ? null : h(W.IconButton, {
                        key: "clear-search",
                        icon: 'close',
                        label: t("清空搜索"),
                        variant: 'ghost',
                        onClick: clearSearch,
                    }),
                ]),
h("span", { className: css['dshd-spacer'], key: "spacer" }),
pristine || activeTab !== "journal" ? null : h("span", { className: css['dshd-hint'], key: "count" }, loading === true
                    ? t("加载中…")
                    : countTextOf(query, vm.total, vm.count, filterCount, visibleDreams.length)),
showFilterButton === true && activeTab === "journal" ? h("div", { className: css['dshd-filter'], key: "filter", 'data-dream-journal-filter': true, 'data-window-drag-exclude': '' }, [
                    h(Btn, {
                        key: "btn",
                        on: filterCount > 0,
                        pressed: filterCount > 0,
                        'aria-expanded': filterOpen,
                        onClick: function () { setFilterOpen(filterOpen !== true); },
                        title: t("筛选作用于已加载窗口，不影响全量统计"),
                    }, t("筛选") + (filterCount > 0 ? " · " + String(filterCount) : ""), h(W.Icon, { name: 'down', size: 13 })),
                    filterOpen === true ? h(nativeUI().MenuSurface, { ref: createOverlaySyncRef(skin, font), 'data-dsh-style': skin, 'data-dsh-font': font, className: clsx(css['dshd-filterpop'], css.surface), key: "pop", role: "group", 'data-window-drag-exclude': '', "aria-label": t("筛选梦境") }, [
                        h("div", { className: css['dshd-filtertitle'], key: "title" }, t("筛选当前已加载的 ") + String(vm.count) + t(" 场，不影响全量统计")),
                        h("div", { key: "moods" }, vm.moodRows.map(function (row) {
                            const on = filters.moods.indexOf(row.mood) !== -1;
                            return h(nativeUI().Pill, {
                                key: "mood-" + row.mood,
                                className: css.filterPill,
                                active: on,
                                "aria-pressed": on === true ? "true" : "false",
                                onClick: function () { toggleMoodFilter(row.mood); },
                            }, row.mood);
                        })),
                        h("div", { key: "only" }, h(nativeUI().Pill, {
                            className: css.filterPill,
                            active: filters.withLessons,
                            "aria-pressed": filters.withLessons === true ? "true" : "false",
                            onClick: toggleOnlyLessons,
                        }, t("只看有教训的梦"))),
                        h("div", { className: css['dshd-filterfoot'], key: "foot" }, [
                            h("button", { key: "clearbtn", type: "button", className: css['dshd-linkbtn'], onClick: clearFilters, disabled: filterCount === 0 }, t("清空筛选")),
                            h(Btn, { key: "done", onClick: function () { setFilterOpen(false); } }, t("完成")),
                        ]),
                    ]) : null,
                ]) : null,
pristine ? null : h(W.CopyPrompt, {
                    key: "dream-copy",
                    prompt: t("做个梦"),
                    label: t("复制「做个梦」"),
                }),
pristine ? null : h(Btn, {
                    key: "privacy",
                    onClick: togglePrivacy,
                    on: privacy === true,
                    pressed: privacy === true,
                    title: t("显示层模糊；DOM 仍为明文，不改文件、不加密"),
                }, privacy === true ? t("隐私模式：开") : t("隐私模式"))]);
            const errorBox = error === null ? null : h("div", { className: clsx(css['dshd-alert'], css.error), role: "alert", key: "error" }, [
                h("span", { key: "m" }, t("读取梦境日记失败：") + displayError(error)),
                h("span", { className: css['dshd-spacer'], key: "s" }),
                h(Btn, { key: "retry", onClick: reload, variant: "primary" }, t("重试")),
            ]);
            const body = function () {
                if (activeTab === 'review' || activeTab === 'knowledge') return h(MemoryBoard, {
                    key: activeTab, vm: knowledgeVm, revisions: knowledge.revisions, reviewMode: activeTab === 'review',
                    error: knowledgeError, loading: knowledgeLoading, privacy, onRetry: showKnowledge, onChanged,
                    moveRef: moveCandidate, automation, onNavigateTab: changeTab,
                });
                if (activeTab === 'bridge') return h('div', { className: css.documentPage }, bridgeLogCard);
                if (activeTab === 'settings') return h(DreamSettings, {
                    automation, privacy, onPrivacyChange: togglePrivacy, skin, setSkin, onReview: () => { changeTab('review'); reload(); },
                });
                if (loading === true && vm.count === 0)
                    return h(Skeleton, { key: "skeleton" });
                if (vm.count === 0) {
                    if (error !== null)
                        return h("div", { key: "failed-wrap" }, [
                            h("div", { className: css['dshd-empty'], key: "failed" }, [
                                h("h3", { key: "t" }, t("暂时读不到梦境日记")),
                                h("p", { key: "p" }, t("等宿主路由就绪后点上面的「重试」；如果一直失败，看一眼 DSH 日志里有没有 [dsh-dream] 告警。")),
                            ]),
                        ]);
                    return h(EmptyState, { key: "empty", query: query, onClear: query === "" ? null : clearSearch, onReview: () => changeTab('review') });
                }
                return h("div", { key: "content" }, [
                    vm.showTiles
                        ? h("div", { className: css['dshd-tiles'], key: "tiles" }, [
                            h(StatTile, { key: "total", label: t("梦境总数"), value: String(vm.total) + t(" 场"), hint: vm.total > vm.count ? t("本页显示最近 ") + String(vm.count) + t(" 场") : t("全部梦境日记") }),
                            h(StatTile, { key: "span", label: t("时间跨度"), value: vm.spanText, hint: vm.spanHint, title: vm.spanFull }),
                            h(StatTile, { key: "latest", label: t("最近一场"), value: vm.latestText, hint: vm.latestDate }),
                            h(StatTile, { key: "mood", label: t("心境"), value: String(vm.moodCount) + t(" 种"), hint: vm.moodCount === 0 ? "" : t("最常见：") + vm.moodRows[0].mood }),
                        ])
                        : h("div", { className: css['dshd-headline'], key: "headline" }, vm.headline),
                    h("div", { className: css['dshd-two'], key: "two" }, [
                        h(MoodCard, { key: "mood", vm: vm }),
                        h(LessonCard, { key: "lessons", vm: vm }),
                    ]),
                    h("div", { className: css['dshd-listhead'], key: "listhead" }, [
                        h("h4", { key: "t" }, query === "" && filterCount === 0 ? t("梦境时间线") : (query === "" ? t("筛选结果") : t("搜索结果"))),
                        h("span", { className: css['dshd-hint'], key: "n" }, listHintOf(query, vm.count, filterCount, visibleDreams.length)),
                    ]),
                    visibleDreams.length === 0 && filterCount > 0
                        ? h("div", { className: css['dshd-filterempty'], key: "filtered" }, [
                            h("span", { key: "t" }, t("没有符合筛选的梦（筛选作用于已加载的 ") + String(vm.count) + t(" 场）。")),
                            h("span", { className: css['dshd-spacer'], key: "s" }),
                            h(Btn, { key: "clearbtn", onClick: clearFilters }, t("清空筛选")),
                        ])
                        : h("div", { className: css['dshd-timeline'], key: "timeline" }, visibleDreams.map(function (dream, index) {
                            return h(DreamCard, { key: (dream.id !== "" ? dream.id : "dream") + "#" + String(index), dream: dream, now: now, privacy: privacy, index: index });
                        })),
                ]);
            };
            const reviewCount = knowledgeVm.rows.filter(row => HELD_STATES.includes(row.state)).length;
            return __stardustUpdatesInlinePage(React,h(W.Page, {
                root, workbench, activeTab, changeTab, tabId, skin, setSkin, font, setFont, paletteActions, openPalette,
                closePalette: () => setPaletteActions(null), privacy, togglePrivacy, automation, actionNotice, reviewCount,
            }, activeTab === 'journal' ? h('div', { className: css.documentPage }, errorBox, toolbar, body(),
                h('div', { className: css['dshd-footer'] },
                    h('span', null, footerTextOf(query, limit, vm.total, vm.count)),
                    canLoadMore ? h(W.Button, { onClick: showMore, disabled: loading }, t('显示更早的梦')) : null)) : body()),"@stardustlc/dsh-dream");
        }
        function DreamSection({locale,workbench=false}={}) { useLanguage(locale); return h(DreamPanel,{workbench}); }
        // ───────────────────────── 挂载 ─────────────────────────
        const inject = ["slots", "locale"];
        function apply(ctx) {
            dreamLanguage = loadDreamLanguage();
            registerWorkbench(ctx, {
                id: 'dsh-dream.workbench', label: () => t('Dream 记忆'), component: DreamSection, inject: () => ({ locale: localeService }),
            });

            try {
                localeService = ctx.get?.("locale") || ctx.locale;
            }
            catch {
                localeService = ctx.locale;
            }
            try {
                ctx.effect(function () {
                    const id = "dsh-dream/client";
                    if (document.querySelector("style[data-plugin-css='" + id + "']") !== null)
                        return function () { };
                    const style = document.createElement("style");
                    style.dataset.plugin = "dsh-dream";
                    style.dataset.pluginCss = id;
                    style.textContent = styleText;
                    document.head.appendChild(style);
                    return function () { style.remove(); };
                }, "dsh-dream: styles");
            }
            catch (error) { /* 无 DOM 环境（纯 node 侧冒烟）时跳过 */ }
            try {
                ctx.slots.inject("settings.section", function () {
                    return ctx.slots.register({
                        name: "settings.section",
                        id: "dsh-dream",
                        order: 55,
                        label: () => t('Dream 记忆'),
                        inject: function () { return { locale: localeService }; },
                    }, DreamSection);
                });
            }
            catch (error) { /* 没有 slots 服务：仍是合法插件，只是没有设置页 */ }
        }
        exports.apply = apply;
        exports.inject = inject;
        // 纯函数内部件：验证脚本可直接取来测，不必另抄一份算法。
        exports.__internals = {
            displayError: displayError,
            routeUrl: routeUrl,
            routeUrlFor: routeUrlFor,
            KNOWLEDGE_ROUTE: KNOWLEDGE_ROUTE,
            KNOWLEDGE_LIMIT: KNOWLEDGE_LIMIT,
            fetchKnowledge: fetchKnowledge,
            fetchBridgeRecords: fetchBridgeRecords,
            postAction: postAction,
            copyText: copyText,
            normalizeBridgeRecords: normalizeBridgeRecords,
            skippedReasonLabel: skippedReasonLabel,
            holdReasonOf: holdReasonOf,
            bridgeableOf: bridgeableOf,
            reviewActionFor: reviewActionFor,
            reviewCommandOf: reviewCommandOf,
            bridgePreviewCommandOf: bridgePreviewCommandOf,
            bridgeRollbackCommandOf: bridgeRollbackCommandOf,
            shortHash: shortHash,
            bridgeActionLabel: bridgeActionLabel,
            bridgeEmptyState: bridgeEmptyState,
            reviewQueueEmptyState: reviewQueueEmptyState,
            BRIDGE_ROUTE: BRIDGE_ROUTE,
            BRIDGE_LIMIT: BRIDGE_LIMIT,
            normalizeKnowledge: normalizeKnowledge,
            normalizeLessonState: normalizeLessonState,
            applicabilityTextOf: applicabilityTextOf,
            knowledgeNoticeText: knowledgeNoticeText,
            lessonStateLabel: lessonStateLabel,
            lessonStateClass: lessonStateClass,
            knowledgeCountText: knowledgeCountText,
            knowledgeEmptyState: knowledgeEmptyState,
            fetchJournal: fetchJournal,
            normalizeDreams: normalizeDreams,
            normalizeStats: normalizeStats,
            spanOf: spanOf,
            formatDate: formatDate,
            formatTime: formatTime,
            relativeTime: relativeTime,
            inlineNodes: inlineNodes,
            moodSlot: moodSlot,
            toneClass: toneClass,
            isCollapsible: isCollapsible,
            cleanupFilters: cleanupFilters,
            filterCountOf: filterCountOf,
            applyFilters: applyFilters,
            shouldShowFilters: shouldShowFilters,
            needsOlderDreams: needsOlderDreams,
            countTextOf: countTextOf,
            listHintOf: listHintOf,
            footerTextOf: footerTextOf,
            MORE_LIMIT: MORE_LIMIT,
            recentText: recentText,
            dreamAgo: dreamAgo,
            loadPrivacy: loadPrivacy,
            savePrivacy: savePrivacy,
            spanTextOf: spanTextOf,
            localLastAtFor: localLastAtFor,
            viewModelOf: viewModelOf,
            DEFAULT_LIMIT: DEFAULT_LIMIT,
            DSH_STYLES: DSH_STYLES,
            DSH_STYLE_STORAGE_KEY: DSH_STYLE_STORAGE_KEY,
            DSH_STYLE_EVENT: DSH_STYLE_EVENT,
            readDshStyle: readDshStyle,
            writeDshStyle: writeDshStyle,
            normalizeDshStyle: normalizeDshStyle,
            DSH_FONTS: DSH_FONTS,
            DSH_FONT_STORAGE_KEY: DSH_FONT_STORAGE_KEY,
            DSH_FONT_EVENT: DSH_FONT_EVENT,
            DSH_DEFAULT_FONT: DSH_DEFAULT_FONT,
            readDshFont: readDshFont,
            writeDshFont: writeDshFont,
            normalizeDshFont: normalizeDshFont,
            subscribeDshFont: subscribeDshFont,
        };
        return module.exports;
    } },{"name":"@stardustlc/dsh-dream","version":"0.1.0","hasWorkbench":true,"packageVersion":"0.17.0","label":"Dream 记忆","labelEn":"Dream","suiteComponent":true,"sectionIds":["dsh-dream"],"iconData":"data:image/webp;base64,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"}));

})();

/* STARDUSTLC_UPDATE_CLIENT_BODY_END */
})();
