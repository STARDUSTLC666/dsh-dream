// Generated from templates/client.js, templates/panels/ and templates/workbench-ui.js. Edit the sources.
(function () {
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
      h('style', null, styles),
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
    return h('div', { className: cx('w-status', 'w-status-' + tone, className), role: tone === 'error' ? 'alert' : 'status', 'aria-live': tone === 'error' ? 'assertive' : 'polite' }, h(Icon, { name: tone === 'success' ? 'check' : 'info', size: 18 }), h('div', null, children));
  }
  function Empty({ title, children, action, icon = 'file' }) {
    return h('div', { className: 'w-empty' }, h(Icon, { name: icon, size: 32 }), h('h2', null, title), children ? h('div', { className: 'w-muted' }, children) : null, action ? h('div', { className: 'w-toolbar' }, action) : null);
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
    return h('div', { className: 'w-overlay', onClick: event => { if (!busy && event.target === event.currentTarget) onClose(); } },
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
.dshw{--w-bg:var(--dsw-alias-bg-layer-1,#fff);--w-soft:var(--dsw-alias-bg-layer-2,#f7f8fa);--w-text:var(--dsw-alias-label-primary,#18202c);--w-muted:var(--dsw-alias-label-secondary,#667085);--w-border:var(--dsw-alias-border-l3,#e7e9ef);--w-accent:var(--dsh-plugin-workbench-accent,#4f6bdb);--w-selected:color-mix(in srgb,var(--w-accent) 10%,var(--w-bg));--w-primary:var(--w-text);--w-on-primary:var(--w-bg);container-type:inline-size;container-name:dsh-workbench;color:var(--w-text);background:var(--w-bg);font:14px/1.65 var(--dsh-font-family-content,system-ui,-apple-system,"Segoe UI","Microsoft YaHei",sans-serif);min-width:0;max-width:100%;box-sizing:border-box;text-align:start;color-scheme:inherit}
.dshw *,.dshw *:before,.dshw *:after{box-sizing:border-box}.dshw h1,.dshw h2,.dshw h3,.dshw h4,.dshw p{margin:0}.dshw h1{font-size:30px;line-height:1.25;letter-spacing:-.025em;font-weight:650}.dshw h2{font-size:24px;line-height:1.35;font-weight:650;letter-spacing:-.015em;overflow-wrap:anywhere}.dshw h3,.dshw h4{font-size:16px;line-height:1.4;font-weight:600}.dshw a{color:var(--w-accent);text-underline-offset:3px;overflow-wrap:anywhere}.dshw button,.dshw input,.dshw select,.dshw textarea{font:inherit;color:inherit;max-width:100%}.dshw input:not([type=checkbox]):not([type=radio]):not([type=file]),.dshw select,.dshw textarea{background:var(--w-bg);border:1px solid var(--w-border);border-radius:8px;padding:8px 11px;min-width:0;line-height:1.5}.dshw input:not([type=checkbox]):not([type=radio]):not([type=file]),.dshw select{min-height:38px}.dshw textarea{resize:vertical}.dshw input[type=checkbox],.dshw input[type=radio]{width:16px;height:16px;flex-shrink:0;accent-color:var(--w-accent)}.dshw :focus-visible{outline:2px solid var(--w-accent);outline-offset:3px}.dshw button:disabled,.dshw input:disabled,.dshw select:disabled,.dshw textarea:disabled{opacity:.5;cursor:not-allowed}.dshw label{font-size:13px}.dshw fieldset{min-width:0;border:1px solid var(--w-border);border-radius:8px}.dshw summary{cursor:pointer;font-weight:550;list-style:none;display:flex;align-items:center;gap:8px}.dshw summary::-webkit-details-marker{display:none}.dshw summary:after{content:'';display:block;margin-inline-start:auto;width:7px;height:7px;border-inline-end:1.75px solid currentColor;border-bottom:1.75px solid currentColor;transform:rotate(45deg);flex-shrink:0}.dshw details[open]>summary:after{transform:rotate(225deg)}.dshw details>summary+*{margin-top:12px}.dshw pre{white-space:pre-wrap;overflow-wrap:anywhere;font:12px/1.7 ui-monospace,SFMono-Regular,Consolas,monospace;max-width:100%;background:var(--w-soft);border-radius:6px;padding:14px}.dshw img,.dshw video,.dshw iframe{max-width:100%}
.w-page{display:flex;flex-direction:column;position:relative;padding:0;min-height:540px;gap:0}.w-page[data-main=true]{height:100%;min-height:0;padding:calc(24px + var(--dsh-frame-top-clearance,0px)) 28px 0 max(28px,var(--dsh-frame-leading-clearance,0px));overflow:auto}.w-page-header{display:flex;justify-content:space-between;gap:24px;align-items:flex-start;padding-bottom:22px;flex-shrink:0}.w-heading{min-width:0}.w-subtitle{margin-top:8px!important;font-size:14px;color:var(--w-muted);line-height:1.6}.w-header-actions,.w-toolbar,.w-actions{display:flex;align-items:center;flex-wrap:wrap;gap:8px;min-width:0}.w-header-actions{justify-content:flex-end}.w-body,.w-tabs-layout{display:flex;flex-direction:column;flex:1;min-height:0;min-width:0}.w-body{overflow:auto}.w-tab-panel{flex:1;min-width:0;min-height:0;display:flex;flex-direction:column;overflow:auto}.w-tabs{display:flex;align-items:stretch;gap:20px;border-bottom:1px solid var(--w-border);flex-shrink:0;overflow-x:auto;scrollbar-width:thin}.dshw .w-tabs>button{border:0;border-bottom:2px solid transparent;background:transparent;padding:11px 8px 13px;white-space:nowrap;font-size:14px;font-weight:550;cursor:pointer;color:var(--w-muted);display:flex;align-items:center;gap:7px}.dshw .w-tabs>button[aria-selected=true]{border-bottom-color:var(--w-accent);color:var(--w-accent)}.w-count,.w-tag{font-size:12px;line-height:1.5;display:inline-flex;align-items:center;flex-shrink:0;background:var(--w-soft);border-radius:5px;padding:1px 6px;color:var(--w-muted)}.w-tabs [aria-selected=true] .w-count,.w-selected .w-tag{color:var(--w-accent);background:var(--w-selected)}
.dshw .w-button{display:inline-flex;justify-content:center;align-items:center;gap:7px;background:var(--w-bg);border:1px solid var(--w-border);border-radius:8px;padding:8px 12px;min-height:36px;line-height:1.4;font-size:14px;font-weight:500;cursor:pointer;text-decoration:none;white-space:normal}.dshw .w-button:not(:disabled):hover{background:var(--w-soft)}.dshw .w-primary{background:var(--w-primary);border-color:var(--w-primary);color:var(--w-on-primary)}.dshw .w-primary:not(:disabled):hover{background:var(--w-primary);opacity:.9}.dshw .w-ghost{background:transparent;border-color:transparent}.dshw .w-danger{color:var(--dsw-alias-state-error-primary,#b43c3c)}.dshw .w-icon-button{width:36px;min-width:36px;padding:8px}.dshw .w-button svg{flex-shrink:0}.w-muted{color:var(--w-muted);font-size:12px;line-height:1.6}.w-section{padding:24px 0;border-bottom:1px solid var(--w-border);min-width:0}.w-section>h3{margin-bottom:12px}.w-section>p+p{margin-top:8px}.w-fields{display:grid;gap:16px;min-width:0}.w-field{display:grid;gap:6px;min-width:0}.w-field>input,.w-field>select,.w-field>textarea{width:100%}.w-status{display:flex;align-items:flex-start;gap:8px;padding:11px 13px;margin:12px 0;border:1px solid var(--w-border);border-radius:8px;background:var(--w-soft);font-size:13px;overflow-wrap:anywhere;flex-shrink:0}.w-status>svg{flex-shrink:0;margin-top:2px}.w-status-error{color:var(--dsw-alias-state-error-primary,#ad3636)}.w-status-success{color:var(--dsw-alias-state-success-primary,#24794a)}.w-empty{display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;gap:14px;max-width:580px;padding:48px 24px;margin:auto;min-height:280px;overflow-wrap:anywhere}.w-empty>svg{color:var(--w-muted)}.w-empty h2{font-size:20px}.w-empty .w-muted{font-size:14px}.w-empty .w-toolbar{justify-content:center}
.w-split{display:grid;grid-template-columns:minmax(240px,var(--w-list-width)) minmax(0,1fr);min-height:460px;flex:1;min-width:0}.w-master{min-width:0;border-inline-end:1px solid var(--w-border);overflow:auto;padding-bottom:24px}.w-detail{min-width:0;padding:26px 28px;overflow:auto;overflow-wrap:anywhere;display:flex;flex-direction:column}.w-master-toolbar{display:flex;align-items:center;gap:8px;flex-wrap:wrap;padding:20px 16px}.w-search{display:flex;align-items:center;gap:8px;border:1px solid var(--w-border);border-radius:8px;padding:0 10px;min-width:0;flex:1;background:var(--w-bg)}.w-search>svg{color:var(--w-muted);flex-shrink:0}.dshw .w-search>input{border:0!important;background:transparent!important;padding:8px 0!important;width:100%;outline-offset:0}.w-row{display:flex;gap:0;min-width:0;position:relative;border-bottom:1px solid var(--w-border);border-inline-start:3px solid transparent}.w-row-select{display:flex;align-items:flex-start;padding:21px 0 0 14px}.dshw .w-row-button{display:flex;flex-direction:column;align-items:stretch;gap:7px;text-align:start;width:100%;padding:18px 18px 18px 16px;border:0;background:transparent;color:inherit;min-width:0;cursor:pointer;line-height:1.5}.dshw .w-row-button:hover{background:var(--w-soft)}.w-row-head{display:flex;align-items:flex-start;gap:10px;justify-content:space-between;min-width:0}.w-row-head>strong{font-size:14px;line-height:1.5;font-weight:600;overflow-wrap:anywhere}.w-row-meta,.w-row-description{color:var(--w-muted);font-size:12px;line-height:1.6;overflow-wrap:anywhere}.w-row-description{display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}.w-selected{background:var(--w-selected);border-inline-start-color:var(--w-accent)}.w-back{display:none!important}.w-detail-title{margin-bottom:12px!important}.w-detail-meta{color:var(--w-muted);font-size:13px;display:flex;align-items:center;gap:8px;flex-wrap:wrap}.w-detail-footer{padding:24px 0;display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-top:auto;border-top:1px solid var(--w-border)}.w-detail-footer .w-muted{flex:1;min-width:160px}.w-definition{display:grid;grid-template-columns:minmax(80px,120px) minmax(0,1fr);gap:8px 16px;font-size:14px;margin:20px 0}.w-definition dt{color:var(--w-muted)}.w-definition dd{margin:0;min-width:0;overflow-wrap:anywhere}
.w-switch-label{display:inline-flex;align-items:center;gap:8px;font-size:13px;position:relative;cursor:pointer}.w-switch-label>input{position:absolute;opacity:0;inset-inline-end:0;width:36px!important;height:22px!important;margin:0;cursor:pointer}.w-switch-track{width:36px;height:22px;border-radius:12px;display:block;background:var(--w-border);border:1px solid var(--w-border);pointer-events:none;padding:2px;transition:background .15s}.w-switch-track:before{content:'';display:block;width:16px;height:16px;border-radius:50%;background:#fff;box-shadow:0 1px 2px #0002;transition:transform .15s}.w-switch-label>input:checked+.w-switch-track{background:var(--w-accent);border-color:var(--w-accent)}.w-switch-label>input:checked+.w-switch-track:before{transform:translateX(14px)}.w-switch-label>input:focus-visible+.w-switch-track{outline:2px solid var(--w-accent);outline-offset:3px}.w-switch-label:has(>input:disabled){opacity:.5;cursor:not-allowed}
.w-overlay{position:fixed;inset:0;background:#0005;display:flex;justify-content:flex-end;z-index:1000;padding:12px;overflow:auto}.w-dialog{width:min(620px,100%);max-height:100%;display:flex;flex-direction:column;min-height:0;background:var(--w-bg);color:var(--w-text);border:1px solid var(--w-border);border-radius:12px;box-shadow:0 18px 70px #0003}.w-dialog-header{display:flex;justify-content:space-between;align-items:center;gap:16px;padding:20px 24px;border-bottom:1px solid var(--w-border);flex-shrink:0}.w-dialog-header>h2{font-size:20px}.w-dialog-body{overflow:auto;padding:20px 24px;min-height:0}.w-editor-grid{display:grid;grid-template-columns:210px minmax(0,1fr) 300px;min-height:500px;flex:1}.w-editor-list{padding:20px 12px;border-inline-end:1px solid var(--w-border);min-width:0}.w-editor-canvas{background:var(--w-soft);padding:20px;min-width:0;display:flex;flex-direction:column;gap:14px}.w-editor-inspector{padding:24px;border-inline-start:1px solid var(--w-border);min-width:0;overflow:auto}.w-editor-inspector h3{margin-bottom:18px}.w-preview-empty{display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center;gap:12px;aspect-ratio:16/9;min-height:180px;background:var(--w-soft);border:1px solid var(--w-border);border-radius:8px;padding:24px;color:var(--w-muted)}.w-content-pad{padding:24px 0}.w-stack{display:flex;flex-direction:column;gap:16px;min-width:0}.w-scroll-x{overflow:auto;max-width:100%}
@container dsh-workbench (max-width:1000px){.w-editor-grid{grid-template-columns:160px minmax(0,1fr)}.w-editor-inspector{grid-column:1/-1;border-inline-start:0;border-top:1px solid var(--w-border)}.w-header-actions{max-width:60%}.w-split{grid-template-columns:minmax(240px,32%) minmax(0,1fr)}}
@container dsh-workbench (max-width:760px){.w-page-header{gap:14px;flex-wrap:wrap;padding-bottom:18px}.w-heading{flex:1;min-width:170px}.dshw h1{font-size:24px}.w-header-actions{max-width:100%;justify-content:flex-start}.w-subtitle{font-size:13px}.w-tabs{gap:12px}.dshw .w-tabs>button{padding:10px 4px 12px}.w-split{display:block;min-height:360px}.w-split[data-selected=false]>.w-detail{display:none}.w-split[data-selected=true]>.w-master{display:none}.w-master{border-inline-end:0}.w-detail{padding:20px 0}.w-back{display:inline-flex!important;align-self:flex-start;margin:0 0 16px!important}.w-detail h2{font-size:22px}.w-master-toolbar{padding:16px 0}.dshw .w-row-button{padding:16px 10px}.w-detail-footer{position:static}.w-detail-footer .w-muted{flex-basis:100%}.w-editor-grid{display:flex;flex-direction:column}.w-editor-list{border-inline-end:0;border-bottom:1px solid var(--w-border);padding:16px 0}.w-editor-canvas{padding:16px 0;background:var(--w-bg)}.w-editor-inspector{padding:20px 0}.w-dialog-header,.w-dialog-body{padding:16px}.w-button{min-height:40px}.w-definition{grid-template-columns:80px minmax(0,1fr)}}
@media(max-width:700px){.w-page[data-main=true]{padding:calc(16px + var(--dsh-frame-top-clearance,0px)) 16px 0 max(16px,var(--dsh-frame-leading-clearance,0px))}.w-overlay{padding:8px}.w-dialog{width:100%}}
@media(prefers-reduced-motion:reduce){.dshw *,.dshw *:before{scroll-behavior:auto!important;transition:none!important;animation:none!important}}
`;
  return { Icon, Button, IconButton, Page, Tabs, Status, Empty, Split, Row, Search, Switch, Dialog, register, styles };
}

// Editable browser entry. Build with node scripts/build-client.mjs.
window.__ModuleLoader__.load({ id: "@stardustlc/dsh-dream", factory: (require) => {
        var module = { exports: {} };
        var exports = module.exports;
        "use strict";
        const React = require("react");
        const W = createWorkbenchUI(React);
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

        const { useState, useEffect } = React;
        const h = React.createElement;
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
                return String(locale?.getSnapshot?.().active || '').startsWith('en') ? 'en' : 'zh';
            }
            catch {
                return 'zh';
            }
        }
        function t(zh) { return languageOf() === 'en' ? (EN[zh] ?? zh) : zh; }
        function displayError(error) {
            const message = error?.message || String(error || '');
            if (languageOf() !== 'en')
                return message;
            if (EN[message])
                return EN[message];
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
            if (languageOf() !== 'en')
                return reason;
            return ({ '目标文件不可读': 'Target file is unreadable', '文件不存在': 'File does not exist',
                '管理块标记异常': 'Invalid managed block markers', '管理块已被移除': 'Managed block was removed',
                '管理块已被外部修改': 'Managed block changed externally' })[reason]
                || (/[\u3400-\u9fff]/.test(reason) ? 'Check the target file and backup' : reason);
        }
        function scopeText(label) {
            if (languageOf() !== 'en')
                return label;
            return label.replace(/^全局$/, 'Global').replace(/^工作区 /, 'Workspace ').replace(/^项目 /, 'Project ');
        }
        function evidenceText(summary) {
            if (languageOf() !== 'en')
                return summary;
            return summary
                .replace(/^无证据（仅候选，不可作为已证实结论）$/, 'No evidence (candidate only; not an established conclusion)')
                .replace(/^证据暂不可核对（(\d+) 条引用缺失）$/, 'Evidence unavailable ($1 missing references)')
                .replace(/^独立证据 (\d+) 条（已读 (\d+) \/ 仅声明 (\d+)）(:|：)?/, (_head, total, read, claimed, colon) => 'Independent sources: ' + total + ' (read: ' + read + ' / claimed: ' + claimed + ')' + (colon ? ': ' : ''));
        }
        function useLanguage(locale) {
            const [, rerender] = useState(0);
            useEffect(() => { const update = () => rerender(n => n + 1); update(); return locale?.subscribe?.(update); }, [locale]);
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
        function Btn(props) {
            return h("button", {
                type: "button",
                className: "dshd-btn" + (props.variant === "primary" ? " primary" : "") + (props.on === true ? " on" : ""),
                onClick: props.onClick,
                disabled: props.disabled === true,
                title: props.title,
                "aria-expanded": props["aria-expanded"],
                "aria-pressed": props.pressed === undefined ? undefined : props.pressed,
            }, props.children);
        }
        function StatTile(props) {
            return h("div", { className: "dshd-tile" }, [
                h("div", { className: "dshd-tile-label", key: "l" }, props.label),
                h("div", { className: "dshd-tile-value", key: "v", title: props.title === undefined ? props.value : props.title }, props.value),
                props.hint === "" || props.hint === undefined ? null : h("div", { className: "dshd-tile-hint", key: "h", title: props.hint }, props.hint),
            ]);
        }
        function MoodCard(props) {
            const vm = props.vm;
            return h("section", { className: "dshd-card" }, [
                h("h4", { key: "t" }, t("心境")),
                h("div", { className: "dshd-mblocks", key: "blocks" }, vm.blocks.map((block) => h("span", {
                    key: block.key,
                    className: "dshd-mblock " + block.tone,
                    title: block.title,
                }))),
                vm.count === 1
                    ? h("div", { className: "dshd-hint", key: "one" }, t("1 场梦，先不谈分布 —— 再做梦会累积。"))
                    : h("div", { key: "legend" }, [
                        h("div", { className: "dshd-note", key: "cap" }, t("左 → 右：从早到晚")),
                        h("div", { className: "dshd-legend", key: "rows" }, vm.moodRows.map((row, index) => h("div", { className: "dshd-legend-row", key: "mood-" + String(index) + "-" + row.mood }, [
                            h("span", { className: "dshd-mblock " + toneClass(moodSlot(row.mood)), key: "d" }),
                            h("span", { className: "dshd-legend-name", key: "n", title: row.mood }, row.mood),
                            h("span", { className: "dshd-legend-count", key: "c" }, String(row.count) + t(" 场")),
                        ]))),
                    ]),
            ]);
        }
        function LessonCard(props) {
            const vm = props.vm;
            return h("section", { className: "dshd-card" }, [
                h("h4", { key: "t" }, t("教训榜")),
                vm.lessonRows.length === 0
                    ? h("div", { className: "dshd-hint", key: "e" }, t("还没有教训 —— 记梦时带上 lessons，出现次数会在这里累积。"))
                    : h("div", { key: "rows" }, vm.lessonRows.map((row, index) => h("div", { className: "dshd-lesson", key: "lesson-" + String(index) + "-" + row.lesson }, [
                        h("span", { className: "dshd-rank", key: "r" }, String(row.rank)),
                        h("span", { className: "dshd-lesson-body", key: "b" }, [
                            h("span", { className: "dshd-lesson-text", key: "t" }, row.lesson),
                            row.showBar ? h("span", { className: "dshd-track", key: "bar" }, h("span", { className: "dshd-fill", key: "fill", style: { width: String(row.share) + "%" } })) : null,
                        ]),
                        h("span", { className: "dshd-lesson-meta", key: "m" }, [
                            h("span", { className: "dshd-times", key: "c" }, "×", h("b", { key: "n" }, String(row.count))),
                            row.lastText === "" ? null : h("span", { className: "dshd-last", key: "l", title: row.lastTitle }, row.lastText),
                            row.candidate ? h("span", { className: "dshd-badge", key: "badge" }, t("常见教训")) : null,
                        ]),
                    ]))),
                h("div", { className: "dshd-note", key: "note" }, t("次数仅表示日记里的出现频率；出现 ≥3 次标为「常见教训」。写入项目规则前仍需核验来源并审阅经验。最近时间取自 stats.lastAt；统计缺失时按本页已加载的梦现算。")),
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
            return h("span", { className: "dshd-copywrap" }, [
                h(Btn, { key: "b", onClick: onCopy, disabled: props.disabled === true, title: props.title === undefined ? command : props.title }, copied === true ? t("已复制") : label),
                failed === true ? h("code", { key: "cmd", className: "dshd-cmd", tabIndex: 0 }, command) : null,
                failed === true ? h("span", { key: "hint", className: "dshd-note" }, t("剪贴板不可用：请手动选中上面的命令复制。")) : null,
            ]);
        }
        /** 面板保持只读：先让人看清决策，再生成可直接粘贴进对话的完整命令。 */
        function ReviewControls(props) {
            const row = props.row;
            const [open, setOpen] = useState(false);
            const [action, setAction] = useState(reviewActionFor(row.state));
            const [resolution, setResolution] = useState("prefer");
            const [note, setNote] = useState("");
            const [feedbackNote, setFeedbackNote] = useState("");
            const [feedbackRetry, setFeedbackRetry] = useState(null);
            const [affected, setAffected] = useState(function () { return row.conflictIds[0] || ""; });
            const [pending, setPending] = useState(false);
            const [error, setError] = useState("");
            const [preview, setPreview] = useState(null);
            const [globalConfirmed, setGlobalConfirmed] = useState(false);
            useEffect(function () { setGlobalConfirmed(false); }, [row.id, row.revision]);
            const commands = row.state === "rejected" ? [["reopen", t("重新送审")]]
                : row.state === "disputed" ? [["resolve-conflict", t("处理冲突")], ["reject", t("驳回这条")]]
                    : row.state === "usable" ? [["mark-stale", t("标记待复核")], ["reject", t("驳回")]]
                        : [["accept", t("采纳")], ["reject", t("驳回")], ["mark-stale", t("标记待复核")]];
            const effectiveAction = commands.some(function (item) { return item[0] === action; }) ? action : commands[0][0];
            const needsGlobalConfirmation = (row.isGlobal && commands.some(item => item[0] === 'accept')) || (row.state === 'disputed' && (row.isGlobal || row.hasGlobalConflicts));
            const command = reviewCommandOf(row, { action: effectiveAction, resolution: resolution, note: note, affectedIds: affected === "" ? [] : [affected] });
            const submit = async function (body, message, isPreview) {
                if (pending)
                    return;
                setPending(true);
                setError("");
                try {
                    const result = await postAction(body);
                    if (isPreview)
                        setPreview(result);
                    else {
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
            return h("div", { className: "dshd-review", role: "group", "aria-label": row.title + t("的操作"), onClick: function (event) { event.stopPropagation(); } }, [
                needsGlobalConfirmation ? h('label', { key: 'global-confirm', className: 'dshd-note' }, [h('input', { type: 'checkbox', checked: globalConfirmed, disabled: pending, onChange: event => setGlobalConfirmed(event.target.checked) }), t('全局经验会用于所有项目；我已核对并同意。')]) : null,
                h("div", { className: "dshd-kcmd", key: "buttons" }, [
                    ...commands.filter(function (item) { return item[0] !== "resolve-conflict" && item[0] !== "mark-stale"; }).map(function (item) {
                        return h(Btn, { key: item[0], variant:item[0] === "accept" ? "primary" : undefined, disabled: pending || row.revision < 1 || (item[0] === 'accept' && row.isGlobal && !globalConfirmed), onClick: function () { review(item[0]); } }, item[1]);
                    }),
                    h(Btn, { key: "review", disabled: pending, onClick: function () { setOpen(!open); }, "aria-expanded": open }, open ? t("收起审阅") : row.state === "disputed" ? t("处理冲突") : dreamText("更多审阅操作", "More review actions")),
                    row.bridgeable === true && row.workspaceRoot !== "" ? h(Btn, { key: "preview", disabled: pending, onClick: function () { submit({ operation: "preview", lessonId: row.id, expectedRevision: row.revision }, "", true); } }, t("预览规则变更")) : null,
                    row.bridgeable === true && row.workspaceRoot === "" ? h(CopyCommand, { key: "preview-command", command: bridgePreviewCommandOf(row.id, row.projectId, row.workspaceRoot), label: t("复制项目预览命令") }) : null,
                ]),
                pending ? h("div", { key: "pending", role: "status", className: "dshd-note" }, t("正在处理…")) : null,
                error !== "" ? h("div", { key: "error", role: "alert", className: "dshd-hint" }, [error, h(Btn, { key: "refresh", disabled: pending, onClick: function () { if (props.onChanged)
                            props.onChanged(t("已刷新经验列表。")); } }, t("刷新列表"))]) : null,
                open ? h("div", { className: "dshd-reviewform", key: "form", onKeyDown: function (event) {
                        if (event.key === "Escape" && !pending) {
                            event.preventDefault();
                            event.stopPropagation();
                            setOpen(false);
                        }
                    } }, [
                    h("label", { key: "action" }, [t("审阅动作"), h("select", { "aria-label": t("审阅动作"), disabled: pending, value: effectiveAction, onChange: function (event) { setAction(event.target.value); } }, commands.map(function (item) { return h("option", { value: item[0], key: item[0] }, item[1]); }))]),
                    effectiveAction === "resolve-conflict" ? h("div", { key: "conflict" }, [
                        h("label", { key: "against" }, [t("冲突经验"), h("select", { "aria-label": t("冲突经验"), disabled: pending, value: affected, onChange: function (event) { setAffected(event.target.value); } }, row.conflicts.map(function (item) { return h("option", { key: item.id, value: item.id, title: item.title }, item.title); }))]),
                        h("label", { key: "resolution" }, [t("处理方式"), h("select", { "aria-label": t("处理方式"), disabled: pending, value: resolution, onChange: function (event) { setResolution(event.target.value); } }, [
                                h("option", { key: "prefer", value: "prefer" }, t("采用这条，驳回对方")),
                                h("option", { key: "drop", value: "drop" }, t("放弃这条，保留对方")),
                                h("option", { key: "merge", value: "merge" }, t("合并到这条，对方留作历史")),
                            ])]),
                        h("label", { key: "note" }, [t("处理依据"), h("textarea", { "aria-label": t("处理依据"), disabled: pending, rows: 2, maxLength: 500, value: note, placeholder: t("说明哪个来源支持这次决定…"), onChange: function (event) { setNote(event.target.value); } })]),
                    ]) : null,
                    h(Btn, { key: "confirm", disabled: pending || command === "" || (!globalConfirmed && ((effectiveAction === 'accept' && row.isGlobal) || (effectiveAction === 'resolve-conflict' && (row.isGlobal || row.hasGlobalConflicts)))), onClick: function () { review(effectiveAction); }, variant: "primary" }, t("确认审阅")),
                    h("details", { key: "fallback" }, [h("summary", { key: "summary" }, t("在对话里处理")), command === "" ? h("div", { key: "hint", className: "dshd-note" }, t("选择冲突经验并填写处理依据后即可处理。")) : h(CopyCommand, { key: "copy", command: command, label: t("复制审阅命令") })]),
                ]) : null,
                preview ? h("section", { key: "preview", className: "dshd-reviewform", "aria-label": t("规则变更预览") }, [
                    h("strong", { key: "heading" }, t("规则变更预览")),
                    h("div", { key: "target", className: "dshd-note" }, t("目标：") + preview.resolvedPath),
                    h("pre", { key: "diff", className: "dshd-diff", tabIndex: 0 }, preview.diff || t("管理块内容已经一致，无需更改。")),
                    h("div", { key: "help", className: "dshd-note" }, t("将按此预览重建 Dream 管理块，请核对新增和删除内容。块外内容保留，写入前创建回滚备份。")),
                    h(Btn, { key: "apply", disabled: pending, variant: "primary", onClick: function () { submit({ operation: "apply", token: preview.token }, t("规则已应用，可在「写入记录」中回滚。")); } }, t("应用此变更")),
                    h(Btn, { key: "cancel", disabled: pending, onClick: function () { setPreview(null); } }, t("取消预览")),
                ]) : null,
                h("details", { key: "feedback", className: "dshd-feedback" }, [
                    h("summary", { key: "summary" }, t("使用反馈 · 有用 ") + (row.feedback.useful || 0) + t(" · 不适用 ") + (row.feedback.notApplicable || 0)),
                    h("label", { key: "note" }, [t("场景备注（可选）"), h("textarea", { "aria-label": t("反馈场景备注"), rows: 2, disabled: pending, maxLength: 500, value: feedbackNote, placeholder: t("这次在哪个场景使用…"), onChange: function (event) { setFeedbackNote(event.target.value); } })]),
                    h(Btn, { key: "useful", disabled: pending, onClick: function () { feedback("useful"); } }, t("这次有用")),
                    h(Btn, { key: "not", disabled: pending, onClick: function () { feedback("not-applicable"); } }, t("这次不适用")),
                    h("div", { key: "help", className: "dshd-note" }, t("记录使用情况，供之后复核；采纳与驳回由审阅决定。")),
                    ...(Array.isArray(row.feedback.recent) ? row.feedback.recent.slice(-3).reverse().map(function (item, index) {
                        return h("div", { key: "recent-" + index, className: "dshd-note" }, formatDate(item.at) + " · " + (item.vote === "useful" ? t("有用") : t("不适用")) + (item.note ? " · " + item.note : ""));
                    }) : []),
                ]),
            ]);
        }
        function RollbackControl(props) {
            const [confirm, setConfirm] = useState(false);
            const [pending, setPending] = useState(false);
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
            return h("div", { className: "dshd-reviewform" }, [
                h(Btn, { key: "start", disabled: pending, onClick: function () { setConfirm(!confirm); } }, confirm ? t("取消回滚") : t("回滚这次变更")),
                confirm ? h("div", { key: "confirm" }, [
                    h("p", { key: "target", className: "dshd-note" }, t("将恢复「") + props.row.target + t("」的前一个 Dream 管理块。块外内容保留；管理块已被修改时会拒绝回滚。")),
                    h(Btn, { key: "apply", variant: "primary", disabled: pending, onClick: rollback }, pending ? t("正在回滚…") : t("确认回滚管理块")),
                ]) : null,
                error ? h("div", { key: "error", role: "alert", className: "dshd-hint" }, error) : null,
            ]);
        }
        function KnowledgeRow(props) {
            const row = props.row;
            const privacy = props.privacy === true;
            const [peek, setPeek] = useState(false);
            const reveal = privacy === true ? function () { setPeek(peek !== true); } : undefined;
            return h("div", {
                className: "dshd-knowledge " + row.stateClass + (privacy === true && peek === true ? " dshd-peek" : ""),
                onClick: reveal,
                title: privacy === true ? t("隐私模式：点击此条临时查看") : undefined,
            }, [
                h("div", { className: "dshd-khead", key: "h" }, [
                    h("span", { className: "dshd-kbadge", key: "b" }, row.stateLabel),
                    h("span", { className: "dshd-ktitle", key: "t", title: row.title }, row.title),
                ]),
                h("div", { className: "dshd-kmeta", key: "m" }, [
                    h("span", { className: "dshd-klast", key: "l", title: row.lastTitle }, t("最近核验：") + row.lastText),
                    row.lastRetrievedAt ? h('span', { className: 'dshd-klast', key: 'retrieved', title: t('取回仅表示提供参考，不等于重新核验。') }, t('最近取回：') + formatDate(row.lastRetrievedAt) + ' ' + formatTime(row.lastRetrievedAt)) : null,
                ]),
                h("div", { className: "dshd-kbody", key: "body" }, [
                    h("div", { key: "when" }, t("何时用：") + (row.when !== "" ? row.when : t("未标注适用条件"))),
                    h("div", { key: "action", className: "dshd-action" }, t("怎么做：") + (row.action || t("未标注具体动作"))),
                    h("details", { key: "details", onClick: function (event) { event.stopPropagation(); } }, [
                        h("summary", { key: "summary" }, t("适用范围与证据")),
                        h("div", { key: "scope" }, t("范围：") + row.scopeLabel),
                        row.applicability !== "" ? h("div", { key: "applicability" }, t("适用：") + row.applicability) : null,
                        row.exceptions.length > 0 ? h("div", { key: "exceptions" }, t("例外：") + row.exceptions.join("；")) : null,
                        h("div", { key: "evidence" }, t("证据：") + row.evidenceSummary),
                        row.evidence.length === 0 ? h("div", { key: "sources-empty", className: "dshd-note" }, t("没有关联来源记录，采纳前请核对依据。")) : h("div", { key: "sources", className: "dshd-sources" }, row.evidence.map(function (item) {
                            return h("details", { key: item.id }, [
                                h("summary", { key: "summary" }, t("来源记录 · ") + (item.verification === "read" ? t("已读到来源") : t("待核验")) + " · " + (item.kind === "session" ? t("会话") : item.kind === "user-correction" ? t("用户纠正") : t("本地资料"))),
                                h("div", { key: "summary-text" }, item.summary || t("未提供摘要")),
                                item.sessionId ? h("div", { key: "session", className: "dshd-note" }, t("会话：") + item.sessionId + (Number.isInteger(item.recordSeq) ? t(" · 记录 ") + item.recordSeq : "")) : null,
                                h("div", { key: "date", className: "dshd-note" }, t("记录时间：") + formatDate(item.observedAt)),
                                item.verificationReason ? h("div", { key: "reason", className: "dshd-note" }, t("核验说明：") + (item.verificationReason === 'live-session-source-verified' ? t("已核对当前会话原文；不代表结论正确。") : item.verificationReason)) : null,
                                item.sourceHash ? h("code", { key: "hash", className: "dshd-cmd", title: item.sourceHash }, t("来源校验值：") + item.sourceHash) : null,
                            ]);
                        })),
                    ]),
                    props.showHoldReason === true && row.holdReasonLabel !== "" ? h("div", { key: "hold", className: "dshd-holdreason" }, t("为什么被扣下：") + row.holdReasonLabel) : null,
                ]),
                h(ReviewControls, { row: row, key: row.id + "@" + row.revision, onChanged: props.onChanged }),
            ]);
        }
        function KnowledgeCard(props) {
            const vm = props.vm;
            const [stateFilter, setStateFilter] = useState("usable");
            const [pageSize, setPageSize] = useState(5);
            const reviewed = vm.rows.filter(function (row) { return row.state === stateFilter; });
            const notice = knowledgeNoticeText(vm === null || vm === undefined ? null : vm.stats);
            const noticeNode = notice === "" ? null : h("div", { className: "dshd-knotice", key: "notice", role: "status" }, notice);
            const head = function (extra) {
                return h("div", { className: "dshd-khead", key: "head" }, [
                    h("h4", { key: "t" }, t("已审阅经验")),
                    h("span", { className: "dshd-spacer", key: "s" }),
                    extra,
                ]);
            };
            if (props.error !== null && props.error !== undefined) {
                return h("section", { className: "dshd-card dshd-kcard" }, [
                    head(h(Btn, { key: "retry", onClick: props.onRetry, disabled: props.loading === true }, t("重试"))),
                    h("div", { className: "dshd-hint", key: "e", role: "alert" }, t("读取经验失败：") + displayError(props.error)),
                    h("div", { className: "dshd-note", key: "n" }, t("旧日记不受影响；修好后点「重试」。")),
                ]);
            }
            if (props.empty === true) {
                const empty = knowledgeEmptyState();
                return h("section", { className: "dshd-card dshd-kcard" }, [
                    h("h4", { key: "t" }, t("经验")),
                    noticeNode,
                    h("div", { className: "dshd-kempty", key: "e" }, [
                        h("div", { className: "dshd-kempty-title", key: "t2" }, empty.title),
                        h("p", { className: "dshd-kempty-body", key: "b" }, empty.body),
                        h("p", { className: "dshd-note", key: "h" }, empty.hint),
                    ]),
                ]);
            }
            return h("section", { className: "dshd-card dshd-kcard" }, [
                head(props.loading === true
                    ? h("span", { className: "dshd-hint", key: "loading" }, t("加载中…"))
                    : h("span", { className: "dshd-hint", key: "count" }, knowledgeCountText(vm.stats))),
                noticeNode,
                h("label", { className: "dshd-note", key: "filter" }, [t("查看 "), h("select", { "aria-label": t("经验状态"), value: stateFilter, onChange: function (event) { setStateFilter(event.target.value); setPageSize(5); } }, [
                        h("option", { key: "usable", value: "usable" }, t("可用经验")), h("option", { key: "rejected", value: "rejected" }, t("已驳回历史")),
                    ])]),
                reviewed.length === 0 ? h("div", { className: "dshd-hint", key: "none" }, stateFilter === "usable" ? t("暂无可用经验；待核实的记录在下方。") : t("没有已驳回记录。")) : null,
                h("div", { className: "dshd-krows", key: "rows" }, reviewed.slice(0, pageSize).map(function (row, index) {
                    return h(KnowledgeRow, { key: row.id !== "" ? row.id : "k" + String(index), row: row, onChanged: props.onChanged, privacy: props.privacy === true });
                })),
                reviewed.length > pageSize ? h(Btn, { key: "next", onClick: function () { setPageSize(pageSize + 5); } }, t("显示更多经验")) : null,
                vm.shown < vm.total
                    ? h("div", { className: "dshd-note", key: "more" }, t("只显示最近 ") + String(vm.shown) + " / " + String(vm.total) + t(" 条经验。"))
                    : null,
                h("div", { className: "dshd-note", key: "note" }, t("采纳记录仍需满足当前任务的平台、版本与项目条件；来源已读不代表结论永远适用。")),
            ]);
        }
        /** 「待核实」只读区块：candidate / disputed / stale + 被扣下的原因（复用 KnowledgeRow）。 */
        function ReviewQueueCard(props) {
            const vm = props.vm;
            const [pageSize, setPageSize] = useState(5);
            const [group, setGroup] = useState('');
            const [selected, setSelected] = useState([]);
            const [pending, setPending] = useState(false);
            const [failure, setFailure] = useState('');
            const [retry, setRetry] = useState(null);
            const [globalConfirmed, setGlobalConfirmed] = useState(false);
            const all = vm !== null && vm !== undefined && Array.isArray(vm.rows)
                ? vm.rows.filter(function (row) { return HELD_STATES.indexOf(row.state) !== -1; })
                : [];
            const rows = group === '' ? all : all.filter(row => row.groupKey === group);
            const groups = [...new Map(all.map(row => [row.groupKey, row.scopeLabel + ' · ' + t(({ preference: '偏好', procedure: '流程', pitfall: '避坑', fact: '事实' })[row.kind] || row.kind)]))];
            const picked = rows.filter(row => selected.includes(row.id) && row.candidate && !row.conflictIds.length);
            const globalSelection = picked.filter(row => row.isGlobal).map(row => row.id).join(',');
            useEffect(function () { setGlobalConfirmed(false); }, [globalSelection]);
            async function batch(action) {
                if (pending || !picked.length)
                    return;
                const items = picked.map(row => ({ lessonId: row.id, expectedRevision: row.revision }));
                const signature = JSON.stringify({ action, items });
                const id = retry?.signature === signature ? retry.id : crypto.randomUUID();
                setRetry({ signature, id });
                setPending(true);
                setFailure('');
                try {
                    await postAction({ operation: 'review-batch', action, items, requestId: id, confirmGlobal: globalConfirmed });
                    setSelected([]);
                    setRetry(null);
                    props.onChanged?.(t('已完成所选候选的审阅。'));
                }
                catch (error) {
                    setFailure(displayError(error));
                }
                finally {
                    setPending(false);
                }
            }
            const head = function (extra) {
                return h("div", { className: "dshd-khead", key: "head" }, [
                    h("h4", { key: "t" }, t("待核实")),
                    h("span", { className: "dshd-spacer", key: "s" }),
                    extra,
                ]);
            };
            if (props.error !== null && props.error !== undefined) {
                return h("section", { className: "dshd-card dshd-kcard" }, [
                    head(h(Btn, { key: "retry", onClick: props.onRetry, disabled: props.loading === true }, t("重试"))),
                    h("div", { className: "dshd-hint", key: "e", role: "alert" }, t("读取经验失败：") + displayError(props.error)),
                ]);
            }
            if (props.loading === true && rows.length === 0) {
                return h("section", { className: "dshd-card dshd-kcard" }, [
                    head(h("span", { className: "dshd-hint", key: "l" }, t("加载中…"))),
                ]);
            }
            return h("section", { className: "dshd-card dshd-kcard" }, [
                head(rows.length === 0 ? null : h("span", { className: "dshd-hint", key: "c" }, String(rows.length) + t(" 条待核实"))),
                all.length ? h('label', { key: 'groups', className: 'dshd-note' }, [t('项目与主题'), ' ', h('select', { 'aria-label': t('项目与主题'), value: group, disabled: pending, onChange: event => { setGroup(event.target.value); setSelected([]); setPageSize(5); } }, [h('option', { key: 'all', value: '' }, t('全部待核实')), ...groups.map(([key, label]) => h('option', { key, value: key }, label))])]) : null,
                globalSelection ? h('label', { key: 'batch-global-confirm', className: 'dshd-note' }, [h('input', { type: 'checkbox', checked: globalConfirmed, disabled: pending, onChange: event => setGlobalConfirmed(event.target.checked) }), t('全局经验会用于所有项目；我已核对并同意。')]) : null,
                picked.length ? h('div', { key: 'batch', className: 'dshd-kcmd' }, [h(Btn, { key: 'accept', disabled: pending || (!!globalSelection && !globalConfirmed) || new Set(picked.map(row => row.groupKey)).size > 1, onClick: () => batch('accept') }, t('批量采纳') + ' (' + picked.length + ')'), h(Btn, { key: 'reject', disabled: pending || new Set(picked.map(row => row.groupKey)).size > 1, onClick: () => batch('reject') }, t('批量驳回') + ' (' + picked.length + ')')]) : null,
                failure ? h('p', { key: 'failure', role: 'alert' }, failure) : null,
                all.length ? h('p', { key: 'batch-note', className: 'dshd-note' }, t('先展开核对来源、条件与例外；只批量处理同范围、同主题且无冲突的候选。')) : null,
                rows.length === 0
                    ? h("div", { className: "dshd-kempty", key: "empty" }, [
                        h("div", { className: "dshd-kempty-title", key: "t" }, t("没有待核实的经验")),
                        h("p", { className: "dshd-kempty-body", key: "b" }, reviewQueueEmptyState()),
                    ])
                    : h("div", { className: "dshd-krows", key: "rows" }, rows.slice(0, pageSize).map(function (row, index) {
                        return h('div', { key: row.id || 'held-' + index }, [
                            row.candidate && !row.conflictIds.length ? h('label', { key: 'select', className: 'dshd-note' }, [h('input', { type: 'checkbox', checked: selected.includes(row.id), disabled: pending || (!selected.includes(row.id) && selected.length >= 20), onChange: event => setSelected(event.target.checked ? [...selected, row.id] : selected.filter(id => id !== row.id)) }), ' ' + t('选中候选：') + row.title]) : null,
                            h(KnowledgeRow, { key: 'row', row: row, onChanged: props.onChanged, privacy: props.privacy === true, showHoldReason: true }),
                        ]);
                    })),
                rows.length > pageSize ? h(Btn, { key: "more", onClick: function () { setPageSize(pageSize + 5); } }, t("显示更多待核实经验")) : null,
                h("div", { className: "dshd-note", key: "note" }, t("这些经验默认不会作为任务建议注入。先核对来源与适用范围，再决定采纳、驳回或继续复核。")),
            ]);
        }
        /** 「写入记录」只读区块：<journalDir>/bridge/ 的桥接应用记录。 */
        function BridgeLogCard(props) {
            const vm = props.vm;
            const head = function (extra) {
                return h("div", { className: "dshd-khead", key: "head" }, [
                    h("h4", { key: "t" }, t("写入记录")),
                    h("span", { className: "dshd-spacer", key: "s" }),
                    extra,
                ]);
            };
            if (props.error !== null && props.error !== undefined) {
                return h("section", { className: "dshd-card dshd-kcard" }, [
                    head(h(Btn, { key: "retry", onClick: props.onRetry, disabled: props.loading === true }, t("重试"))),
                    h("div", { className: "dshd-hint", key: "e", role: "alert" }, t("读取写入记录失败：") + displayError(props.error)),
                ]);
            }
            if (props.loading === true) {
                return h("section", { className: "dshd-card dshd-kcard" }, [
                    head(h("span", { className: "dshd-hint", key: "l" }, t("加载中…"))),
                ]);
            }
            if (vm.rows.length === 0) {
                const empty = bridgeEmptyState();
                return h("section", { className: "dshd-card dshd-kcard" }, [
                    h("h4", { key: "t" }, t("写入记录")),
                    h("div", { className: "dshd-kempty", key: "empty" }, [
                        h("div", { className: "dshd-kempty-title", key: "t2" }, empty.title),
                        h("p", { className: "dshd-kempty-body", key: "b" }, empty.body),
                        h("p", { className: "dshd-note", key: "h" }, empty.hint),
                    ]),
                ]);
            }
            return h("section", { className: "dshd-card dshd-kcard" }, [
                head(h("span", { className: "dshd-hint", key: "c" }, String(vm.total) + t(" 次写入 · ") + String(vm.rollbackable) + t(" 次可回滚"))),
                h("div", { className: "dshd-krows", key: "rows" }, vm.rows.map(function (row, index) {
                    return h("div", { className: "dshd-bridge", key: row.id !== "" ? row.id : "bridge-" + String(index) }, [
                        h("div", { className: "dshd-bridge-head", key: "h" }, [
                            h("span", { className: "dshd-kbadge", key: "a" }, row.actionLabel),
                            h("span", { className: "dshd-bridge-target", key: "t", title: row.target }, row.target),
                            h("span", { className: "dshd-spacer", key: "s" }),
                            h("span", { className: "dshd-klast", key: "at", title: row.atTitle }, row.atText),
                        ]),
                        h("div", { className: "dshd-bridge-meta", key: "m" }, [
                            h("span", { key: "lessons", title: row.lessonsText }, t("经验：") + row.lessonsText),
                            row.beforeShort === "" ? null : h("span", { key: "before" }, t("前哈希：") + row.beforeShort),
                            row.afterShort === "" ? null : h("span", { key: "after" }, t("后哈希：") + row.afterShort),
                            h("span", { key: "rb", className: row.rollbackable === true ? "dshd-rollback-ok" : "dshd-rollback-no" }, row.rollbackText),
                        ]),
                        h("details", { key: "backup" }, [
                            h("summary", { key: "summary" }, t("备份标识与回滚命令")),
                            h("code", { key: "id", className: "dshd-cmd" }, row.id),
                            row.rollbackable === true ? h("code", { key: "command", className: "dshd-cmd", tabIndex: 0 }, bridgeRollbackCommandOf(row)) : null,
                        ]),
                        row.rollbackable === true ? h(RollbackControl, { key: "rollback", row: row, onChanged: props.onChanged }) : null,
                    ]);
                })),
                vm.shown < vm.total ? h("div", { className: "dshd-note", key: "more" }, t("只显示最近 ") + String(vm.shown) + " / " + String(vm.total) + t(" 条记录。")) : null,
                h("div", { className: "dshd-note", key: "note" }, t("回滚恢复对应备份的 Dream 管理块；块外内容保留，外部修改的管理块会停止回滚。")),
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
                className: "dshd-dream dshd-mood-" + String(moodSlot(dream.mood)) + (privacy && peek === true ? " dshd-peek" : ""),
                onClick: clickCard,
                title: privacy ? t("隐私模式：点击卡片临时查看") : undefined,
            }, [
                h("header", { className: "dshd-dream-head", key: "h" }, [
                    h("time", { className: "dshd-time", key: "t", dateTime: dream.at === "" ? undefined : dream.at, title: dream.at === "" ? timeText : timeText + " · " + dream.at }, timeText),
                    dreamAgo(dream, props.now) === "" ? null : h("span", { className: "dshd-ago", key: "a" }, dreamAgo(dream, props.now)),
                    h("span", { className: "dshd-mood", key: "m", title: t("心境：") + dream.mood }, [
                        h("i", { className: "dshd-mooddot " + toneClass(moodSlot(dream.mood)), key: "d" }),
                        dream.mood,
                    ]),
                    h("span", { className: "dshd-spacer", key: "s" }),
                    collapsible ? h("button", {
                        type: "button",
                        className: "dshd-linkbtn",
                        key: "btn",
                        onClick: function (event) { if (event !== undefined && event.stopPropagation !== undefined)
                            event.stopPropagation(); setExpanded(expanded !== true); },
                    }, expanded === true ? t("收起") : t("展开全文")) : null,
                ]),
                h("div", { className: "dshd-reflection" + (collapsible && expanded !== true ? " dshd-clamp" : ""), key: "r" }, inlineNodes(dream.reflection, "reflection-" + String(props.index))),
                dream.lessons.length === 0 ? null : h("ol", { className: "dshd-lessons", key: "l" }, dream.lessons.map((lesson, index) => h("li", { key: "li-" + String(index) + "-" + lesson }, [
                    h("span", { className: "dshd-num", key: "n" }, String(index + 1)),
                    h("span", { className: "dshd-lesson-li", key: "t" }, inlineNodes(lesson, "lesson-" + String(props.index) + "-" + String(index))),
                ]))),
            ]);
        }
        function EmptyState(props) {
            const moon = h("svg", { width: 34, height: 34, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.6, strokeLinecap: "round", strokeLinejoin: "round", key: "i" }, [
                h("path", { key: "p", d: "M21 12.8A8.5 8.5 0 1 1 11.2 3a6.5 6.5 0 0 0 9.8 9.8z" }),
            ]);
            if (props.query !== undefined && props.query !== "") {
                return h("div", { className: "dshd-empty" }, [
                    moon,
                    h("h3", { key: "t" }, t("没有找到「") + props.query + t("」相关的梦")),
                    h("p", { key: "p" }, t("换个关键词试试，或者清空搜索看全部梦境。")),
                    props.onClear ? h("div", { key: "a" }, h(Btn, { onClick: props.onClear }, t("清空搜索"))) : null,
                ]);
            }
            return h("div", { className: "dshd-empty" }, [
                moon,
                h("h3", { key: "t" }, t("还没有梦境日记")),
                h("p", { key: "p" }, t("自动整理的内容在「经验」页待审阅；日记可让助手复盘时单独生成。")),
                h("div", { className: "dshd-chips", key: "c" }, [
                    h("span", { className: "dshd-chip", key: "s1" }, t("对 agent 说「做个梦」")),
                    h("span", { className: "dshd-chip", key: "s2" }, "dream_digest → dream_save"),
                ]),
            ]);
        }
        function Skeleton() {
            return h("div", null, [0, 1, 2].map((index) => h("div", { className: "dshd-skel", key: String(index) })));
        }
        function AutomaticMemoryCard(props) {
const [settingsOpen,setSettingsOpen] = useState(false);
            const [value, setValue] = useState(null);
            const [failure, setFailure] = useState(null);
            const [pending, setPending] = useState(false);
            const [chatId, setChatId] = useState('');
            const a = function (zh, en) { return languageOf() === 'en' ? en : zh; };
            useEffect(function () {
                let alive = true, timer;
                const controller = new AbortController();
                async function refresh() {
                    try {
                        const response = await fetch(routeUrlFor('api/dsh-dream/automatic', ''), { credentials: 'same-origin', signal: controller.signal });
                        if (!response.ok)
                            throw new Error(a('自动功能状态暂时无法读取，请刷新重试。', 'Automatic memory status is unavailable. Refresh to retry.'));
                        const payload = await response.json();
                        if (alive) {
                            setValue(payload.automatic);
                            setFailure(null);
                        }
                    }
                    catch (error) {
                        if (alive)
                            setFailure(error);
                    }
                    if (alive)
                        timer = setTimeout(refresh, 15000);
                }
                refresh();
                return function () { alive = false; clearTimeout(timer); controller.abort(); };
            }, [props.reloadToken]);
            async function change(body) {
                setPending(true);
                setFailure(null);
                try {
                    const result = await postAction(body);
                    setValue(result.automatic);
                }
                catch (error) {
                    setFailure(error);
                }
                finally {
                    setPending(false);
                }
            }
            const toggle = (key, next) => change({ operation: 'automatic', [key]: next });
            const reasons = {
                saved: a('已保存新候选，等待审阅', 'New candidates saved; review required'),
                merged: a('已合并重复经验', 'Duplicate lessons merged'),
                'nothing-useful': a('没有可复用的新经验', 'No reusable new lessons'),
                'ordinary-chat': a('普通闲聊，已跳过', 'Ordinary chat skipped'),
                'no-source': a('缺少可见来源，已跳过', 'No visible sources; skipped'),
                'daily-budget': a('今天的整理预算已用完', 'Daily consolidation budget reached'),
                cooldown: a('冷却中，轮次保留等待整理', 'Cooling down; queued turns retained'),
                queued: a('已加入队列，安静后合并整理', 'Queued; consolidate after quiet time'),
                disabled: a('自动整理已暂停', 'Automatic collection paused'),
                unfinished: a('任务未正常完成，已跳过', 'Turn did not complete normally; skipped'),
                'no-model': a('当前会话尚无可用模型', 'No model route for this session'),
                recording: a('正在整理候选经验', 'Collecting candidate lessons'),
                timeout: a('整理超时，本次已停止', 'Consolidation timed out and stopped'),
                cancelled: a('已暂停辅助调用，未完成轮次保留', 'Auxiliary call stopped; unfinished turns retained'),
                superseded: a('已有新任务，旧轮次不再整理', 'New work superseded this turn; skipped'),
                'model-error': a('模型返回失败或无法核验，请检查 DSH 模型连接', 'Model output failed or could not be verified. Check the DSH model connection.'),
                'input-limit': a('内容超过预算，已跳过', 'Input exceeds the budget; skipped'),
            };
            const last = value && value.last;
            const chats = value?.sessions || [];
            const chosenId = chats.some(row => row.sessionId === chatId) ? chatId : (chats[0]?.sessionId || '');
            const chat = chats.find(row => row.sessionId === chosenId);
            const minutes = Math.max(0, Number(value && value.cooldownMinutes) || 0);
            const seconds = Math.ceil(minutes * 60);
            const interval = minutes < 1 ? String(seconds) + a(' 秒', seconds === 1 ? ' second' : ' seconds') : new Intl.NumberFormat(languageOf() === 'en' ? 'en-US' : 'zh-CN', { maximumFractionDigits: 2 }).format(minutes) + a(' 分钟', minutes === 1 ? ' minute' : ' minutes');
            return h('div', {className:'dream-auto'},
  h(W.Switch, {label:dreamText('自动整理','Auto collect'),checked:value?.enabled === true,disabled:pending || !value,onChange:event=>toggle('enabled',event.target.checked)}),
  h(W.Switch, {label:dreamText('自动取回','Auto recall'),checked:value?.retrievalEnabled === true,disabled:pending || !value,onChange:event=>toggle('retrievalEnabled',event.target.checked)}),
  h(W.IconButton, {icon:'settings',label:dreamText('自动记忆与预算','Automatic memory and limits'),onClick:()=>setSettingsOpen(true)}),
  settingsOpen ? h(W.Dialog, {title:dreamText('自动记忆与预算','Automatic memory and limits'),closeLabel:dreamText('关闭','Close'),onClose:()=>setSettingsOpen(false)}, h('div', {className:'dream-settings-content'}, [h('p', { key: 'intro' }, a('任务结束后整理可复用经验，不用记住“做梦”口令。新经验先待审阅，不自动修改项目规则。', 'Collect reusable lessons after tasks, without a trigger phrase. New lessons await review; project rules are not changed automatically.')),
failure ? h('p', { key: 'error', role: 'alert' }, displayError(failure)) : null,
!value ? (failure ? null : h('p', { key: 'loading' }, a('正在读取状态…', 'Loading status…'))) : h('div', { key: 'controls' }, [
                    h('p', { key: 'status', role: 'status' }, value.problem ? a('状态异常，请检查 DSH 日志。', 'Status error. Check the DSH logs.') : value.available ? (value.running ? a('正在整理', 'Consolidating') : value.enabled === false ? a('全局默认已暂停；聊天独立设置仍生效', 'Global collection is paused; chat overrides still apply') : a('已就绪，等待符合条件的任务', 'Ready; waiting for a qualifying task')) : a('当前宿主服务尚未就绪；手动工具仍可使用。', 'Host services are not ready; manual tools remain available.')),
                    h('label', { key: 'collect', style: { display: 'block', marginBottom: '8px' } }, [
                        h('input', { key: 'input', type: 'checkbox', checked: value.enabled === true, disabled: pending, onChange: event => toggle('enabled', event.target.checked) }),
                        ' ' + a('默认自动整理候选经验', 'Collect candidate lessons by default'),
                    ]),
                    h('label', { key: 'retrieve', style: { display: 'block' } }, [
                        h('input', { key: 'input', type: 'checkbox', checked: value.retrievalEnabled === true, disabled: pending, onChange: event => toggle('retrievalEnabled', event.target.checked) }),
                        ' ' + a('默认自动取回已采纳经验', 'Retrieve accepted lessons by default'),
                    ]),
                    h('p', { key: 'budget' }, a('今天已调用模型 ', 'Model calls today: ') + String(value.callsToday ?? 0) + ' / ' + String(value.maxCallsPerDay ?? 0) + a(' 次；每次间隔至少 ', '; at least ') + interval + a('。', ' between calls.')),
                    h('p', { key: 'queue' }, a('待整理 ', 'Queued turns: ') + (value.pendingTurns ?? 0) + a(' 轮；安静 ', '; quiet time: ') + (value.idleSeconds ?? 60) + a(' 秒后，同项目最多合并 ', ' seconds; up to ') + (value.maxBatchTurns ?? 4) + a(' 轮。', ' turns per project in a batch.')),
                    h(Btn, { key: 'review', onClick: props.onReview }, a('待审阅 ', 'Awaiting review: ') + String(value.candidates ?? 0)),
                    h('details', { key: 'advanced', className: 'dshd-note' }, [
                        h('summary', { key: 'summary', style: { cursor: 'pointer', marginTop: '10px' } }, a('聊天设置与整理预算', 'Chat controls and consolidation limits')),
                        h(Btn, { key: 'flush', disabled: pending || !value.available || value.mainTaskRunning || !value.pendingTurns, onClick: () => change({ operation: 'automatic-flush' }) }, a('现在整理待处理轮次', 'Consolidate queued turns now')),
                        h('p', { key: 'retention', className: 'dshd-note' }, a('手动整理仍遵守冷却和每日预算。待处理片段最多保留 24 小时、32 轮；过期 ', 'Manual consolidation respects cooldown and daily budget. Pending excerpts keep for up to 24 hours / 32 turns; expired: ') + (value.expiredTurns ?? 0) + a(' 轮，超出容量 ', '; overflow: ') + (value.overflowTurns ?? 0) + a(' 轮。', ' turns.')),
                        chat ? h('div', { key: 'chat', className: 'dshd-reviewform' }, [
                            h('label', { key: 'select' }, [a('聊天记忆设置', 'Chat memory settings'), h('select', { 'aria-label': a('聊天记忆设置', 'Chat memory settings'), value: chosenId, disabled: pending, onChange: event => setChatId(event.target.value) }, chats.map(row => h('option', { key: row.sessionId, value: row.sessionId }, (row.cwd || '') + ' · ' + row.sessionId.slice(0, 8))))]),
                            ...[['use', a('使用记忆', 'Use memory')], ['contribute', a('贡献记忆', 'Contribute memory')]].map(([key, label]) => h('label', { key }, [label, h('select', { 'aria-label': label, disabled: pending, value: chat[key] === null ? 'inherit' : String(chat[key]), onChange: event => change({ operation: 'automatic-chat', sessionId: chosenId, [key]: event.target.value === 'inherit' ? null : event.target.value === 'true' }) }, [h('option', { key: 'inherit', value: 'inherit' }, a('跟随全局', 'Follow global default')), h('option', { key: 'true', value: 'true' }, a('仅此聊天开启', 'Enable for this chat')), h('option', { key: 'false', value: 'false' }, a('仅此聊天关闭', 'Disable for this chat'))])])),
                            h('p', { key: 'note', className: 'dshd-note' }, a('两个选项独立保存；关闭贡献会移除该聊天尚未整理的片段，已有经验仍保留。', 'Both controls persist independently. Disabling contribution removes pending excerpts for this chat; existing lessons remain.')),
                        ]) : null,
                        h('p', { key: 'cost', className: 'dshd-note' }, a('沿用当前会话模型，会消耗模型额度；普通闲聊跳过。每次最多 ', 'Uses the current session model and its quota; ordinary chat is skipped. Up to ') + String(value.maxOutputTokens ?? 0) + a(' 个输出 token。', ' output tokens per call.')),
                    ]),
                    last ? h('p', { key: 'last' }, a('最近检查：', 'Last check: ') + formatDate(new Date(last.at).toISOString()) + ' ' + formatTime(new Date(last.at).toISOString()) + ' · ' + (reasons[last.reason] || a('已检查', 'Checked'))) : null,
                ])])) : null);
        }
        // ───────────────────────── 主面板 ─────────────────────────
        function DreamPanel({workbench=false}={}) {
            const [activeTab, setActiveTab] = useState("review");
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
            const [knowledge, setKnowledge] = useState(null);
            const [knowledgeLoading, setKnowledgeLoading] = useState(true);
            const [knowledgeError, setKnowledgeError] = useState(null);
            const [bridge, setBridge] = useState(null);
            const [bridgeLoading, setBridgeLoading] = useState(true);
            const [bridgeError, setBridgeError] = useState(null);
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
            }, [query, reloadToken]);
            // 经验区块独立取数：知识路由挂了但日记读不出来时，经验仍能显示（反之亦然）。
            useEffect(function () {
                let alive = true;
                setKnowledgeLoading(true);
                setKnowledgeError(null);
                fetchKnowledge().then(function (payload) {
                    if (alive !== true)
                        return;
                    setKnowledge(payload);
                    setKnowledgeLoading(false);
                }).catch(function (failure) {
                    if (alive !== true)
                        return;
                    setKnowledgeError(failure instanceof Error ? failure : new Error(String(failure)));
                    setKnowledgeLoading(false);
                    setKnowledge(null);
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
            const knowledgeVm = knowledge === null ? { rows: [], total: 0, shown: 0, stats: null } : normalizeKnowledge(knowledge, now);
            const bridgeVm = bridge === null ? { rows: [], total: 0, shown: 0, rollbackable: 0 } : normalizeBridgeRecords(bridge, now);
            const pristine = vm.count === 0 && query === "";
            const filterCount = filterCountOf(filters);
            const visibleDreams = applyFilters(dreams, filters);
            const showFilterButton = shouldShowFilters(vm.count) || filterCount > 0;
            const canLoadMore = needsOlderDreams(vm.count, vm.total) && limit < MORE_LIMIT;
            const reload = function () { setReloadToken(function (value) { return value + 1; }); };
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
            const knowledgeCard = h(KnowledgeCard, {
                key: "knowledge",
                vm: knowledgeVm,
                loading: knowledgeLoading === true,
                error: knowledgeError,
                empty: knowledgeError === null && knowledgeLoading !== true && knowledgeVm.rows.length === 0,
                privacy: privacy === true,
                onRetry: showKnowledge,
                onChanged: onChanged,
            });
            const reviewQueueCard = h(ReviewQueueCard, {
                key: "review-queue",
                vm: knowledgeVm,
                loading: knowledgeLoading === true,
                error: knowledgeError,
                privacy: privacy === true,
                onRetry: showKnowledge,
                onChanged: onChanged,
            });
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
            // 筛选 popover：点面板外任意处收起；纯 node 冒烟没有事件系统就跳过。
            useEffect(function () {
                if (filterOpen !== true)
                    return function () { };
                if (typeof document === "undefined" || document === null || typeof document.addEventListener !== "function")
                    return function () { };
                const onDown = function (event) {
                    const pop = document.querySelector(".dshd-filterpop");
                    if (pop !== null && typeof pop.contains === "function" && pop.contains(event.target) === true)
                        return;
                    setFilterOpen(false);
                };
                const onKey = function (event) {
                    if (event.key !== "Escape")
                        return;
                    event.preventDefault();
                    event.stopPropagation();
                    event.stopImmediatePropagation();
                    setFilterOpen(false);
                    const trigger = document.querySelector(".dshd-filter button");
                    if (trigger && typeof trigger.focus === "function")
                        trigger.focus();
                };
                document.addEventListener("mousedown", onDown);
                document.addEventListener("keydown", onKey, true);
                return function () { document.removeEventListener("mousedown", onDown); document.removeEventListener("keydown", onKey, true); };
            }, [filterOpen]);
            const searchIcon = h("svg", { width: 14, height: 14, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", key: "i" }, [
                h("circle", { key: "c", cx: 11, cy: 11, r: 7 }),
                h("path", { key: "l", d: "M20 20l-3.2-3.2" }),
            ]);
            const toolbar = h("div", { className: "dshd-toolbar", key: "toolbar" }, [pristine || activeTab !== "journal" ? null : h("div", { className: "dshd-search", key: "search" }, [
                    searchIcon,
                    h("input", {
                        key: "search-input",
                        className: "dshd-input",
                        type: "text",
                        value: queryInput,
                        placeholder: t("搜索反思与教训…"),
                        "aria-label": t("搜索梦境"),
                        onChange: function (event) { setQueryInput(event.target.value); },
                        onKeyDown: function (event) { if (event.key === "Enter")
                            setQuery(event.target.value.trim()); },
                    }),
                    queryInput === "" ? null : h("button", {
                        key: "clear-search",
                        type: "button",
                        className: "dshd-clear",
                        "aria-label": t("清空搜索"),
                        onClick: clearSearch,
                    }, "×"),
                ]),
h("span", { className: "dshd-spacer", key: "spacer" }),
pristine || activeTab !== "journal" ? null : h("span", { className: "dshd-hint", key: "count" }, loading === true
                    ? t("加载中…")
                    : countTextOf(query, vm.total, vm.count, filterCount, visibleDreams.length)),
showFilterButton === true && activeTab === "journal" ? h("div", { className: "dshd-filter", key: "filter" }, [
                    h(Btn, {
                        key: "btn",
                        on: filterCount > 0,
                        pressed: filterCount > 0,
                        onClick: function () { setFilterOpen(filterOpen !== true); },
                        title: t("筛选作用于已加载窗口，不影响全量统计"),
                    }, t("筛选") + (filterCount > 0 ? " · " + String(filterCount) : "") + " ▾"),
                    filterOpen === true ? h("div", { className: "dshd-filterpop", key: "pop", role: "group", "aria-label": t("筛选梦境") }, [
                        h("div", { className: "dshd-filtertitle", key: "title" }, t("筛选当前已加载的 ") + String(vm.count) + t(" 场，不影响全量统计")),
                        h("div", { key: "moods" }, vm.moodRows.map(function (row) {
                            const on = filters.moods.indexOf(row.mood) !== -1;
                            return h("button", {
                                key: "mood-" + row.mood,
                                type: "button",
                                className: "dshd-chipbtn" + (on === true ? " on" : ""),
                                "aria-pressed": on === true ? "true" : "false",
                                onClick: function () { toggleMoodFilter(row.mood); },
                            }, row.mood);
                        })),
                        h("div", { key: "only" }, h("button", {
                            type: "button",
                            className: "dshd-chipbtn" + (filters.withLessons === true ? " on" : ""),
                            "aria-pressed": filters.withLessons === true ? "true" : "false",
                            onClick: toggleOnlyLessons,
                        }, t("只看有教训的梦"))),
                        h("div", { className: "dshd-filterfoot", key: "foot" }, [
                            h("button", { key: "clearbtn", type: "button", className: "dshd-linkbtn", onClick: clearFilters, disabled: filterCount === 0 }, t("清空筛选")),
                            h(Btn, { key: "done", onClick: function () { setFilterOpen(false); } }, t("完成")),
                        ]),
                    ]) : null,
                ]) : null,
pristine ? null : h(Btn, {
                    key: "privacy",
                    onClick: togglePrivacy,
                    on: privacy === true,
                    pressed: privacy === true,
                    title: t("显示层模糊；DOM 仍为明文，不改文件、不加密"),
                }, privacy === true ? t("隐私模式：开") : t("隐私模式"))]);
            const errorBox = error === null ? null : h("div", { className: "dshd-alert error", role: "alert", key: "error" }, [
                h("span", { key: "m" }, t("读取梦境日记失败：") + displayError(error)),
                h("span", { className: "dshd-spacer", key: "s" }),
                h(Btn, { key: "retry", onClick: reload, variant: "primary" }, t("重试")),
            ]);
            const body = function () {
                if (activeTab === 'review' || activeTab === 'knowledge') return h(MemoryBoard, {vm:knowledgeVm,mode:activeTab === 'review' ? 'review' : 'accepted',error:knowledgeError,loading:knowledgeLoading,privacy,onRetry:showKnowledge,onChanged});
                if (activeTab === 'bridge') return bridgeLogCard;
                if (loading === true && vm.count === 0)
                    return h(Skeleton, { key: "skeleton" });
                if (vm.count === 0) {
                    if (error !== null)
                        return h("div", { key: "failed-wrap" }, [
                            h("div", { className: "dshd-empty", key: "failed" }, [
                                h("h3", { key: "t" }, t("暂时读不到梦境日记")),
                                h("p", { key: "p" }, t("等宿主路由就绪后点上面的「重试」；如果一直失败，看一眼 DSH 日志里有没有 [dsh-dream] 告警。")),
                            ]),
                        ]);
                    return h(EmptyState, { key: "empty", query: query, onClear: query === "" ? null : clearSearch });
                }
                return h("div", { key: "content" }, [
                    vm.showTiles
                        ? h("div", { className: "dshd-tiles", key: "tiles" }, [
                            h(StatTile, { key: "total", label: t("梦境总数"), value: String(vm.total) + t(" 场"), hint: vm.total > vm.count ? t("本页显示最近 ") + String(vm.count) + t(" 场") : t("全部梦境日记") }),
                            h(StatTile, { key: "span", label: t("时间跨度"), value: vm.spanText, hint: vm.spanHint, title: vm.spanFull }),
                            h(StatTile, { key: "latest", label: t("最近一场"), value: vm.latestText, hint: vm.latestDate }),
                            h(StatTile, { key: "mood", label: t("心境"), value: String(vm.moodCount) + t(" 种"), hint: vm.moodCount === 0 ? "" : t("最常见：") + vm.moodRows[0].mood }),
                        ])
                        : h("div", { className: "dshd-headline", key: "headline" }, vm.headline),
                    h("div", { className: "dshd-two", key: "two" }, [
                        h(MoodCard, { key: "mood", vm: vm }),
                        h(LessonCard, { key: "lessons", vm: vm }),
                    ]),
                    h("div", { className: "dshd-listhead", key: "listhead" }, [
                        h("h4", { key: "t" }, query === "" && filterCount === 0 ? t("梦境时间线") : (query === "" ? t("筛选结果") : t("搜索结果"))),
                        h("span", { className: "dshd-hint", key: "n" }, listHintOf(query, vm.count, filterCount, visibleDreams.length)),
                    ]),
                    visibleDreams.length === 0 && filterCount > 0
                        ? h("div", { className: "dshd-filterempty", key: "filtered" }, [
                            h("span", { key: "t" }, t("没有符合筛选的梦（筛选作用于已加载的 ") + String(vm.count) + t(" 场）。")),
                            h("span", { className: "dshd-spacer", key: "s" }),
                            h(Btn, { key: "clearbtn", onClick: clearFilters }, t("清空筛选")),
                        ])
                        : h("div", { className: "dshd-timeline", key: "timeline" }, visibleDreams.map(function (dream, index) {
                            return h(DreamCard, { key: (dream.id !== "" ? dream.id : "dream") + "#" + String(index), dream: dream, now: now, privacy: privacy, index: index });
                        })),
                ]);
            };
            return h(W.Page, {workbench,title:dreamText('Dream 记忆','Dream memory'),subtitle:dreamText('审阅、复用和管理任务经验。','Review, reuse and manage task experience.'),className:'dshd-root dream-workbench' + (privacy ? ' dshd-privacy' : ''),
 actions:h(React.Fragment,null,h(AutomaticMemoryCard,{reloadToken,onReview:()=>{setActiveTab('review');reload();}}),h(W.Button,{variant:'ghost',onClick:togglePrivacy,'aria-pressed':privacy,title:t('显示层模糊；DOM 仍为明文，不改文件、不加密')},privacy?t('隐私模式：开'):t('隐私模式')),h(W.IconButton,{icon:'refresh',label:t('刷新'),onClick:reload,disabled:loading || knowledgeLoading}))},
 h('style',null,DREAM_WORKBENCH_CSS),
 h(W.Status,null,actionNotice),
 h(W.Tabs,{label:dreamText('Dream 视图','Dream views'),value:activeTab,onChange:value=>{setFilterOpen(false);setActiveTab(value);},items:[
 {id:'review',label:dreamText('待审阅','Awaiting review'),count:knowledgeVm.rows.filter(row=>HELD_STATES.includes(row.state)).length},
 {id:'knowledge',label:dreamText('已采纳','Accepted')},{id:'journal',label:t('日记')},{id:'bridge',label:dreamText('规则记录','Rule history')}]},
 activeTab === 'journal' ? h('div',{className:'dream-journal'},errorBox,toolbar,body(),h('div',{className:'dshd-footer'},h('span',null,footerTextOf(query,limit,vm.total,vm.count)),canLoadMore?h(W.Button,{onClick:showMore,disabled:loading},t('显示更早的梦')):null)) : body(),
 privacy ? h('p',{className:'w-muted',role:'status'},t('隐私模式：显示层模糊；DOM 仍为明文，不改文件、不加密。点击卡片可临时查看。')) : null));
        }
        function DreamSection({locale,workbench=false}={}) { useLanguage(locale); return h(DreamPanel,{workbench}); }
        /* @ui-css-start */
        const CSS = [
            ".dshd-root{color:var(--dsw-alias-label-primary,#111);font-size:13px;line-height:1.6}",
            ".dshd-shell{background:var(--dsw-alias-bg-layer-1,#fff);border:1px solid var(--dsw-alias-border-l2,rgba(0,0,0,.08));border-radius:14px;padding:14px 16px;container-type:inline-size}",
            ".dshd-sub{color:var(--dsw-alias-label-tertiary,#6b7280);font-size:12px;margin:4px 0 12px}",
            ".dshd-toolbar{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:12px}",
            ".dshd-search{position:relative;display:flex;align-items:center;flex:1;min-width:180px}",
            ".dshd-search svg{position:absolute;left:9px;color:var(--dsw-alias-label-tertiary,#6b7280);pointer-events:none}",
            ".dshd-input{width:100%;box-sizing:border-box;background:var(--dsw-specific-input-major,var(--dsw-alias-bg-layer-2,rgba(0,0,0,.03)));border:1px solid var(--dsw-alias-border-l2,rgba(0,0,0,.12));border-radius:9px;padding:6px 28px 6px 30px;font:inherit;color:inherit}",
            ".dshd-input:focus{outline:2px solid var(--dsw-alias-state-business-primary,#2563eb);outline-offset:-1px}",
            ".dshd-clear{position:absolute;right:5px;border:0;background:transparent;color:var(--dsw-alias-label-tertiary,#6b7280);font-size:16px;line-height:1;cursor:pointer;padding:2px 6px;border-radius:6px}",
            ".dshd-clear:hover{background:color-mix(in srgb,var(--dsw-alias-label-primary,#111) 8%,transparent);color:var(--dsw-alias-label-primary,#111)}",
            ".dshd-spacer{flex:1}",
            ".dshd-btn{display:inline-flex;align-items:center;gap:4px;border:1px solid var(--dsw-alias-border-l2,rgba(0,0,0,.1));background:var(--dsw-alias-bg-layer-1,#fff);color:var(--dsw-alias-label-primary,#111);border-radius:9px;padding:5px 11px;font-size:12px;cursor:pointer;transition:background .12s,border-color .12s}",
            ".dshd-btn:hover:not(:disabled){background:color-mix(in srgb,var(--dsw-alias-label-primary,#111) 6%,transparent)}",
            ".dshd-btn:disabled{opacity:.5;cursor:not-allowed}",
            ".dshd-btn.primary{background:var(--dsw-alias-button-primary-fill,#2563eb);border-color:transparent;color:#fff}",
            ".dshd-btn.primary:hover:not(:disabled){background:var(--dsw-alias-button-primary-hover,#1d4ed8)}",
            ".dshd-btn.on{border-color:var(--dsw-alias-state-warn-primary,#f59e0b);background:color-mix(in srgb,var(--dsw-alias-state-warn-primary,#f59e0b) 18%,transparent)}",
            ".dshd-filter{position:relative}",
            ".dshd-filterpop{position:absolute;right:0;top:calc(100% + 6px);z-index:6;width:min(280px,86vw);background:var(--dsw-alias-bg-layer-1,#fff);border:1px solid var(--dsw-alias-border-l2,rgba(0,0,0,.12));border-radius:12px;padding:10px 11px;box-shadow:var(--dsw-elevation-prominent,0 10px 28px rgba(0,0,0,.18))}",
            ".dshd-filtertitle{font-size:11px;color:var(--dsw-alias-label-tertiary,#6b7280);margin-bottom:7px}",
            ".dshd-chipbtn{display:inline-flex;align-items:center;border:1px solid var(--dsw-alias-border-l2,rgba(0,0,0,.12));background:transparent;color:var(--dsw-alias-label-primary,#111);border-radius:999px;padding:2px 9px;font-size:12px;cursor:pointer;margin:0 6px 6px 0}",
            ".dshd-chipbtn.on{background:color-mix(in srgb,var(--dsw-alias-state-business-primary,#2563eb) 14%,transparent);border-color:var(--dsw-alias-state-business-primary,#2563eb)}",
            ".dshd-filterfoot{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-top:2px}",
            ".dshd-filterempty{display:flex;align-items:center;gap:8px;border-radius:10px;padding:10px 12px;font-size:12px;margin-bottom:10px;background:var(--dsw-alias-bg-layer-2,rgba(0,0,0,.03));color:var(--dsw-alias-label-tertiary,#6b7280)}",
            ".dshd-hint{color:var(--dsw-alias-label-tertiary,#6b7280);font-size:12px}",
            ".dshd-note{font-size:11px;color:var(--dsw-alias-label-tertiary,#6b7280);margin-top:8px}",
            ".dshd-headline{font-size:13px;font-weight:600;margin:0 0 10px}",
            ".dshd-tiles{display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:8px;margin-bottom:12px}",
            ".dshd-tile{background:var(--dsw-alias-bg-layer-2,rgba(0,0,0,.03));border-radius:11px;padding:9px 11px;min-width:0}",
            ".dshd-tile-label{font-size:11px;color:var(--dsw-alias-label-tertiary,#6b7280)}",
            ".dshd-tile-value{font-size:17px;font-weight:600;margin-top:1px;overflow-wrap:anywhere;line-height:1.35}",
            ".dshd-tile-hint{font-size:11px;color:var(--dsw-alias-label-tertiary,#6b7280);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}",
            ".dshd-two{display:grid;grid-template-columns:minmax(0,3fr) minmax(0,2fr);gap:10px;margin-bottom:16px}",
            ".dshd-card{background:var(--dsw-alias-bg-layer-2,rgba(0,0,0,.03));border-radius:12px;padding:11px 12px;min-width:0}",
            ".dshd-card h4{margin:0 0 8px;font-size:13px;font-weight:600}",
            ".dshd-mblocks{display:flex;flex-wrap:wrap;gap:3px;margin-bottom:8px}",
            ".dshd-mblock{display:inline-block;width:12px;height:12px;border-radius:3px;flex:0 0 auto;background:var(--dsw-alias-state-business-primary,#2563eb)}",
            ".dshd-tone-1{background:var(--dsw-alias-state-success-primary,#16a34a)}",
            ".dshd-tone-2{background:var(--dsw-alias-state-warn-primary,#f59e0b)}",
            ".dshd-tone-3{background:var(--dsw-alias-state-error-primary,#dc2626)}",
            ".dshd-legend{display:flex;flex-direction:column;gap:4px}",
            ".dshd-legend-row{display:flex;align-items:center;gap:7px;font-size:12px}",
            ".dshd-legend-name{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}",
            ".dshd-legend-count{color:var(--dsw-alias-label-tertiary,#6b7280);font-size:11px;font-variant-numeric:tabular-nums}",
            ".dshd-lesson{display:flex;gap:8px;align-items:flex-start;padding:5px 0;border-bottom:1px dashed var(--dsw-alias-border-l2,rgba(0,0,0,.08));flex-wrap:wrap}",
            ".dshd-lesson:last-child{border-bottom:0;padding-bottom:0}",
            ".dshd-rank{flex:0 0 auto;width:18px;height:18px;border-radius:6px;background:var(--dsw-alias-bg-layer-1,#fff);border:1px solid var(--dsw-alias-border-l2,rgba(0,0,0,.1));color:var(--dsw-alias-label-tertiary,#6b7280);font-size:11px;display:flex;align-items:center;justify-content:center;font-variant-numeric:tabular-nums}",
            ".dshd-lesson-body{flex:1;min-width:140px;display:flex;flex-direction:column;gap:4px}",
            ".dshd-lesson-meta{flex:0 0 auto;display:flex;align-items:center;gap:6px;flex-wrap:wrap}",
            ".dshd-last{font-size:11px;color:var(--dsw-alias-label-tertiary,#6b7280);white-space:nowrap}",
            ".dshd-lesson-text{font-size:12px;word-break:break-word}",
            ".dshd-track{display:block;height:6px;border-radius:999px;background:color-mix(in srgb,var(--dsw-alias-label-primary,#111) 8%,transparent);overflow:hidden}",
            ".dshd-fill{display:block;height:100%;border-radius:999px;background:var(--dsw-alias-state-business-primary,#2563eb);min-width:6px}",
            ".dshd-times{flex:0 0 auto;font-size:11px;color:var(--dsw-alias-label-tertiary,#6b7280);font-variant-numeric:tabular-nums}",
            ".dshd-times b{color:var(--dsw-alias-label-primary,#111)}",
            ".dshd-badge{flex:0 0 auto;font-size:11px;padding:1px 7px;border-radius:999px;background:color-mix(in srgb,var(--dsw-alias-state-warn-primary,#f59e0b) 18%,transparent);color:var(--dsw-alias-label-primary,#111);white-space:nowrap}",
            ".dshd-listhead{display:flex;align-items:baseline;justify-content:space-between;gap:8px;margin:2px 0 8px}",
            ".dshd-listhead h4{margin:0;font-size:13px;font-weight:600}",
            ".dshd-timeline{display:flex;flex-direction:column;gap:8px}",
            ".dshd-dream{background:var(--dsw-alias-bg-layer-2,rgba(0,0,0,.03));border-radius:12px;padding:10px 12px;border-left:3px solid var(--dsw-alias-state-business-primary,#2563eb);min-width:0}",
            ".dshd-dream.dshd-mood-1{border-left-color:var(--dsw-alias-state-success-primary,#16a34a)}",
            ".dshd-dream.dshd-mood-2{border-left-color:var(--dsw-alias-state-warn-primary,#f59e0b)}",
            ".dshd-dream.dshd-mood-3{border-left-color:var(--dsw-alias-state-error-primary,#dc2626)}",
            ".dshd-dream-head{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:5px}",
            ".dshd-time{font-size:12px;color:var(--dsw-alias-label-tertiary,#6b7280);font-variant-numeric:tabular-nums}",
            ".dshd-ago{font-size:11px;color:var(--dsw-alias-label-tertiary,#6b7280)}",
            ".dshd-mood{display:inline-flex;align-items:center;gap:5px;font-size:11px;padding:1px 8px;border-radius:999px;background:color-mix(in srgb,var(--dsw-alias-label-primary,#111) 6%,transparent);color:var(--dsw-alias-label-primary,#111);max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}",
            ".dshd-mooddot{width:6px;height:6px;border-radius:999px;flex:0 0 auto;background:var(--dsw-alias-state-business-primary,#2563eb)}",
            ".dshd-linkbtn{border:0;background:transparent;color:var(--dsw-alias-state-business-primary,#2563eb);font-size:12px;cursor:pointer;padding:1px 4px;border-radius:6px}",
            ".dshd-linkbtn:hover{background:color-mix(in srgb,var(--dsw-alias-state-business-primary,#2563eb) 10%,transparent)}",
            ".dshd-reflection{white-space:pre-wrap;word-break:break-word}",
            ".dshd-clamp{display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:4;overflow:hidden;max-height:6.4em}",
            ".dshd-lessons{margin:8px 0 0;padding:0;list-style:none;display:flex;flex-direction:column;gap:4px}",
            ".dshd-lessons li{display:flex;gap:7px;align-items:flex-start;font-size:12px}",
            ".dshd-num{flex:0 0 auto;min-width:17px;height:17px;border-radius:5px;background:color-mix(in srgb,var(--dsw-alias-state-business-primary,#2563eb) 14%,transparent);color:var(--dsw-alias-state-business-primary,#2563eb);font-size:11px;display:inline-flex;align-items:center;justify-content:center;font-variant-numeric:tabular-nums}",
            ".dshd-lesson-li{flex:1;min-width:0;word-break:break-word}",
            ".dshd-privacy .dshd-reflection,.dshd-privacy .dshd-lessons{filter:blur(4px)}",
            ".dshd-privacy .dshd-dream.dshd-peek .dshd-reflection,.dshd-privacy .dshd-dream.dshd-peek .dshd-lessons{filter:none}",
            ".dshd-alert{display:flex;gap:8px;align-items:center;border-radius:10px;padding:8px 10px;font-size:12px;margin-bottom:10px;background:color-mix(in srgb,var(--dsw-alias-label-primary,#111) 5%,transparent)}",
            ".dshd-alert.error{background:color-mix(in srgb,var(--dsw-alias-state-error-primary,#dc2626) 12%,transparent);color:var(--dsw-alias-state-error-primary,#dc2626)}",
            ".dshd-empty{padding:28px 18px;text-align:center;color:var(--dsw-alias-label-tertiary,#6b7280)}",
            ".dshd-empty svg{color:var(--dsw-alias-label-tertiary,#6b7280);opacity:.75}",
            ".dshd-empty h3{color:var(--dsw-alias-label-primary,#111);margin:8px 0 6px;font-size:15px}",
            ".dshd-empty p{margin:0 auto 10px;max-width:430px;font-size:12px}",
            ".dshd-chips{display:flex;gap:6px;justify-content:center;flex-wrap:wrap}",
            ".dshd-chip{font-family:ui-monospace,Consolas,monospace;font-size:11px;background:var(--dsw-alias-bg-layer-2,rgba(0,0,0,.05));border-radius:999px;padding:2px 9px;color:var(--dsw-alias-label-tertiary,#6b7280)}",
            ".dshd-skel{height:58px;border-radius:12px;margin-bottom:8px;background:linear-gradient(90deg,var(--dsw-alias-bg-layer-2,rgba(0,0,0,.04)) 25%,color-mix(in srgb,var(--dsw-alias-label-primary,#111) 10%,transparent) 37%,var(--dsw-alias-bg-layer-2,rgba(0,0,0,.04)) 63%);background-size:400% 100%;animation:dshd-shimmer 1.4s ease infinite}",
            "@keyframes dshd-shimmer{0%{background-position:100% 0}100%{background-position:0 0}}",
            ".dshd-footer{margin-top:12px;display:flex;align-items:center;gap:8px;justify-content:space-between;color:var(--dsw-alias-label-tertiary,#6b7280);font-size:11px;flex-wrap:wrap}",
            ".dshd-kcard{margin:2px 0 14px}",
            ".dshd-khead{display:flex;align-items:baseline;gap:8px;margin-bottom:8px}",
            ".dshd-khead h4{margin:0;font-size:13px;font-weight:600}",
            ".dshd-krows{display:flex;flex-direction:column;gap:7px}",
            ".dshd-knowledge{border-left:3px solid var(--dsw-alias-label-tertiary,#6b7280);background:var(--dsw-alias-bg-layer-1,#fff);border-radius:9px;padding:8px 10px;min-width:0}",
            ".dshd-knowledge.dshd-kstate-candidate{border-left-color:var(--dsw-alias-state-warn-primary,#f59e0b)}",
            ".dshd-knowledge.dshd-kstate-disputed{border-left-color:var(--dsw-alias-state-error-primary,#dc2626);background:color-mix(in srgb,var(--dsw-alias-state-error-primary,#dc2626) 6%,var(--dsw-alias-bg-layer-1,#fff))}",
            ".dshd-knowledge.dshd-kstate-usable{border-left-color:var(--dsw-alias-state-success-primary,#16a34a)}",
            ".dshd-knowledge.dshd-kstate-stale,.dshd-knowledge.dshd-kstate-rejected,.dshd-knowledge.dshd-kstate-unknown{border-left-color:var(--dsw-alias-label-tertiary,#6b7280);opacity:.86}",
            ".dshd-kbadge{flex:0 0 auto;font-size:11px;padding:1px 7px;border-radius:999px;background:color-mix(in srgb,var(--dsw-alias-label-primary,#111) 8%,transparent);white-space:nowrap}",
            ".dshd-kstate-candidate .dshd-kbadge{background:color-mix(in srgb,var(--dsw-alias-state-warn-primary,#f59e0b) 22%,transparent)}",
            ".dshd-kstate-disputed .dshd-kbadge{background:color-mix(in srgb,var(--dsw-alias-state-error-primary,#dc2626) 20%,transparent);color:var(--dsw-alias-state-error-primary,#dc2626)}",
            ".dshd-kstate-usable .dshd-kbadge{background:color-mix(in srgb,var(--dsw-alias-state-success-primary,#16a34a) 18%,transparent)}",
            ".dshd-ktitle{font-size:12px;font-weight:600;word-break:break-word}",
            ".dshd-kmeta{display:flex;gap:10px;flex-wrap:wrap;font-size:11px;color:var(--dsw-alias-label-tertiary,#6b7280);margin-top:2px}",
            ".dshd-kbody{margin-top:5px;display:flex;flex-direction:column;gap:3px;font-size:12px;word-break:break-word}",
            ".dshd-kempty{padding:14px 10px;text-align:center;color:var(--dsw-alias-label-tertiary,#6b7280)}",
            ".dshd-kempty-title{color:var(--dsw-alias-label-primary,#111);font-weight:600;font-size:13px;margin-bottom:4px}",
            ".dshd-kempty-body{margin:0 auto 5px;max-width:460px;font-size:12px}",
            ".dshd-knotice{font-size:11px;color:var(--dsw-alias-label-primary,#111);background:color-mix(in srgb,var(--dsw-alias-state-warn-primary,#f59e0b) 14%,transparent);border-radius:8px;padding:5px 8px;margin-bottom:7px}",
            ".dshd-privacy .dshd-kbody{filter:blur(4px)}",
            ".dshd-privacy .dshd-knowledge.dshd-peek .dshd-kbody{filter:none}",
            ".dshd-kcmd{display:flex;gap:6px;flex-wrap:wrap;margin-top:6px}",
            ".dshd-tabs{display:flex;gap:4px;margin-bottom:8px;flex-wrap:wrap}",
            ".dshd-action{font-weight:500;white-space:pre-wrap}",
            ".dshd-kbody details summary,.dshd-bridge-row details summary{cursor:pointer;color:var(--dsw-alias-label-tertiary,#6b7280);font-size:11px}",
            ".dshd-reviewform{margin-top:8px;padding:9px;border:1px solid var(--dsw-alias-border-l2,rgba(0,0,0,.12));border-radius:8px}",
            ".dshd-reviewform label{display:flex;flex-direction:column;gap:3px;margin-bottom:6px;font-size:12px}",
            ".dshd-reviewform .dshd-btn,.dshd-feedback .dshd-btn{margin:4px 5px 0 0}",
            ".dshd-diff{white-space:pre-wrap;overflow-wrap:anywhere;max-height:320px;overflow:auto;padding:10px;border-radius:6px;font:11px/1.65 ui-monospace,Consolas,monospace;background:var(--dsw-alias-bg-layer-2,rgba(0,0,0,.04));color:inherit}",
            ".dshd-feedback{margin-top:8px;font-size:12px}.dshd-feedback summary{cursor:pointer}.dshd-feedback label{display:flex;flex-direction:column;gap:4px;margin-top:8px}.dshd-feedback textarea{font:inherit;color:inherit;background:var(--dsw-alias-bg-layer-1,#fff);border:1px solid var(--dsw-alias-border-l2,rgba(0,0,0,.12));border-radius:6px;padding:6px;max-width:100%;box-sizing:border-box}",
            ".dshd-sources{padding:6px 0}.dshd-sources details{margin-top:6px}.dshd-reviewform{min-width:0}",
            ".dshd-privacy .dshd-feedback,.dshd-privacy .dshd-diff{filter:blur(4px)}.dshd-privacy .dshd-knowledge.dshd-peek .dshd-feedback,.dshd-privacy .dshd-knowledge.dshd-peek .dshd-diff{filter:none}",
            ".dshd-reviewform select,.dshd-reviewform textarea,.dshd-kcard select{background:var(--dsw-alias-bg-layer-1,#fff);color:inherit;border:1px solid var(--dsw-alias-border-l2,rgba(0,0,0,.12));border-radius:6px;max-width:100%;padding:4px;font:inherit;box-sizing:border-box}",
            ".dshd-copywrap{display:inline-flex;flex-direction:column;gap:3px;max-width:100%;align-items:flex-start}",
            ".dshd-cmd{display:block;font-family:ui-monospace,Consolas,monospace;font-size:11px;white-space:pre-wrap;word-break:break-all;background:var(--dsw-alias-bg-layer-2,rgba(0,0,0,.04));border-radius:6px;padding:4px 7px;user-select:text;cursor:text;color:inherit;max-width:100%}",
            ".dshd-holdreason{font-size:11px;color:var(--dsw-alias-state-warn-primary,#f59e0b);margin-top:4px}",
            ".dshd-bridge{background:var(--dsw-alias-bg-layer-1,#fff);border-radius:9px;padding:8px 10px;border-left:3px solid var(--dsw-alias-border-l2,rgba(0,0,0,.12));min-width:0}",
            ".dshd-bridge-head{display:flex;align-items:baseline;gap:8px;flex-wrap:wrap}",
            ".dshd-bridge-target{font-size:12px;font-weight:600;word-break:break-all;min-width:0}",
            ".dshd-bridge-meta{display:flex;gap:10px;flex-wrap:wrap;font-size:11px;color:var(--dsw-alias-label-tertiary,#6b7280);margin-top:3px}",
            ".dshd-rollback-ok{color:var(--dsw-alias-state-success-primary,#16a34a)}",
            ".dshd-rollback-no{color:var(--dsw-alias-label-tertiary,#6b7280)}",
            "@container (max-width:620px){.dshd-two{grid-template-columns:1fr}.dshd-toolbar .dshd-hint{display:none}}",
            "@media(max-width:640px){[role=dialog]:has(.dshd-root){display:flex;flex-direction:column}[role=dialog]:has(.dshd-root)>nav{display:flex;flex-direction:row;align-items:center;flex-shrink:0;gap:6px;width:auto;max-width:100%;height:auto;padding:10px;overflow-x:auto;border-right:0;border-bottom:1px solid var(--dsw-alias-border-l2,rgba(0,0,0,.12))}[role=dialog]:has(.dshd-root)>nav>*{flex-shrink:0}[role=dialog]:has(.dshd-root)>nav>div:has(>button){display:flex;flex-direction:row;gap:6px}[role=dialog]:has(.dshd-root)>nav button{width:auto;flex-shrink:0}[role=dialog]:has(.dshd-root)>div{min-width:0;min-height:0;flex:1}.dshd-reviewform,.dshd-feedback{max-width:100%}}"
        ].join("");
        /* @ui-css-end */
        // ───────────────────────── 挂载 ─────────────────────────
        const inject = ["slots", "locale"];
        function apply(ctx) {
W.register(ctx,{id:'dsh-dream.workbench',label:()=>dreamText('Dream 记忆','Dream memory'),icon:'book',component:DreamSection,inject:()=>({locale:localeService}),order:50});

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
                    style.textContent = CSS;
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
                        label: function () { return dreamText("Dream 记忆", "Dream memory"); },
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
        };
        return module.exports;
    } });

})();
