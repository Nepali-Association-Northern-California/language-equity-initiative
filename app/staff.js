/*
 * NANC staff portal: Data Reviewer, Program Manager and Admin pages.
 * Uses Supabase Auth for sign-in and the tables/policies in db/schema.sql.
 * The database enforces every permission; hiding a menu item here is only a convenience.
 */
(function () {
  'use strict';

  var C = window.Charts;
  var esc = C.esc;
  var CFG = window.APP_CONFIG || {};
  var SURVEY = window.SURVEY;
  var app = document.getElementById('staff-app');

  if (!CFG.supabaseUrl || !CFG.supabaseAnonKey || !window.supabase) {
    app.innerHTML = '<div class="auth-wrap"><div class="auth-card"><h1>Staff portal not configured</h1>' +
      '<p>Add the Supabase URL and key to <code>config.js</code>, and check the internet connection.</p></div></div>';
    return;
  }

  var sb = window.supabase.createClient(CFG.supabaseUrl, CFG.supabaseAnonKey, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
  });

  /* ------------------------------------------------------------ survey metadata */
  var RANK = { reviewer: 1, manager: 2, admin: 3 };
  var ROLE_LABEL = { reviewer: 'Data Reviewer', manager: 'Program Manager', admin: 'Admin' };
  var QINDEX = {};
  var SECTION_OF = {};
  var SENSITIVE = {};
  SURVEY.sections.forEach(function (s, i) {
    s.questions.forEach(function (q) {
      QINDEX[q.id] = q;
      SECTION_OF[q.id] = i;
      if (s.sensitive) SENSITIVE[q.id] = true;
    });
  });
  var MODE_LABEL = { self: 'Self-completed', in_person: 'In person (volunteer)', phone: 'By phone (volunteer)', paper: 'Paper form entry' };
  var LANG_LABEL = { en: 'English', ne: 'Nepali' };
  var FILTER_QUESTIONS = ['D2', 'D3', 'D4', 'D5', 'L2'];
  var FG_STATUS = { planned: 'Planned', completed: 'Completed', cancelled: 'Cancelled' };
  var TR_STATUS = ['requested', 'translating', 'review', 'approved', 'published'];
  var TR_STATUS_LABEL = { requested: 'Requested', translating: 'Translating', review: 'Community review', approved: 'Approved', published: 'Published' };

  function optLabel(q, v) {
    var list = q.options || q.cols || [];
    for (var i = 0; i < list.length; i++) if (list[i].v === v) return list[i].en;
    return v;
  }
  function rowLabel(q, v) {
    for (var i = 0; i < (q.rows || []).length; i++) if (q.rows[i].v === v) return q.rows[i].en;
    return v;
  }

  /* ------------------------------------------------------------ state */
  var session = null;
  var profile = null;
  var recovery = false;
  var routeToken = 0;
  var cache = { responses: null, settings: null };
  var filters = blankFilters();
  var ui = { section: 0, page: 0, showExcluded: false, trTab: 'requests', trStatus: '', editing: null, namesFgOnly: false };
  var currentRender = null;

  function blankFilters() { return { range: 'all', from: '', to: '', D2: '', D3: '', D4: '', D5: '', L2: '', language: '', mode: '' }; }
  function can(min) { return !!(profile && profile.active && profile.role && RANK[profile.role] >= RANK[min]); }

  /* ------------------------------------------------------------ utilities */
  function fmtDate(iso) {
    if (!iso) return '—';
    var d = new Date(iso.length === 10 ? iso + 'T00:00:00' : iso);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }
  function fmtDateTime(iso) {
    if (!iso) return '—';
    return new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });
  }
  function minutes(r) {
    if (!r.started_at || !r.submitted_at) return null;
    var m = (new Date(r.submitted_at) - new Date(r.started_at)) / 60000;
    return m > 0 && m < 240 ? m : null;
  }
  function median(arr) {
    if (!arr.length) return null;
    var s = arr.slice().sort(function (a, b) { return a - b; });
    var mid = Math.floor(s.length / 2);
    return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
  }
  function answeredCount(r) {
    return Object.keys(r.answers || {}).filter(function (k) { return QINDEX[k]; }).length;
  }
  function weekStart(d) {
    var x = new Date(d);
    x.setHours(0, 0, 0, 0);
    x.setDate(x.getDate() - ((x.getDay() + 6) % 7));
    return x;
  }
  function toast(msg, kind) {
    var el = document.createElement('div');
    el.className = 'toast ' + (kind || 'ok');
    el.setAttribute('role', 'status');
    el.textContent = msg;
    document.body.appendChild(el);
    setTimeout(function () { el.remove(); }, 4200);
  }
  function errMsg(e) { return (e && (e.message || e.error_description)) || 'Something went wrong.'; }
  function audit(action, target, details) {
    if (!session) return;
    sb.from('audit_log').insert({ action: action, target: target || null, details: details || null, email: profile && profile.email, user_id: session.user.id })
      .then(function () {});
  }
  function download(filename, text, type) {
    var blob = new Blob([text], { type: type || 'text/csv;charset=utf-8' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
  }
  function csv(rows) {
    return '﻿' + rows.map(function (r) {
      return r.map(function (c) {
        var s = c == null ? '' : String(c);
        return /[",\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
      }).join(',');
    }).join('\r\n');
  }
  function stamp() { return new Date().toISOString().slice(0, 10); }
  function formData(form) {
    var o = {};
    new FormData(form).forEach(function (v, k) { o[k] = typeof v === 'string' ? v.trim() : v; });
    return o;
  }
  function badge(text, kind) { return '<span class="badge ' + (kind || '') + '">' + esc(text) + '</span>'; }
  function card(title, sub, chart, opts) {
    opts = opts || {};
    var id = 'c' + Math.random().toString(36).slice(2, 8);
    return '<section class="panel ' + (opts.cls || '') + '" id="' + id + '">' +
      '<header class="panel-head"><div><h3>' + title + '</h3>' + (sub ? '<p class="panel-sub">' + sub + '</p>' : '') + '</div>' +
      (chart.table ? '<button type="button" class="btn-link" data-action="toggle-table" data-target="' + id + '">Table view</button>' : '') +
      '</header><div class="panel-chart">' + chart.html + '</div>' +
      (chart.table ? '<div class="panel-table" hidden>' + chart.table + '</div>' : '') + '</section>';
  }

  /* ------------------------------------------------------------ data access */
  async function loadResponses(force) {
    if (cache.responses && !force) return cache.responses;
    var all = [], from = 0, size = 1000;
    for (;;) {
      var r = await sb.rpc('fetch_responses').range(from, from + size - 1);
      if (r.error) throw r.error;
      all = all.concat(r.data || []);
      if (!r.data || r.data.length < size) break;
      from += size;
    }
    cache.responses = all;
    cache.loadedAt = new Date();
    return all;
  }
  async function loadSettings(force) {
    if (cache.settings && !force) return cache.settings;
    var r = await sb.from('settings').select('*');
    if (r.error) throw r.error;
    var s = {};
    (r.data || []).forEach(function (row) { s[row.key] = row.value; });
    cache.settings = s;
    return s;
  }
  async function loadTable(name, order) {
    var q = sb.from(name).select('*');
    if (order) q = q.order(order.col, { ascending: !!order.asc, nullsFirst: false });
    var r = await q;
    if (r.error) throw r.error;
    return r.data || [];
  }

  /* ------------------------------------------------------------ filters */
  function applyFilters(rows) {
    var f = filters;
    var from = f.from ? new Date(f.from + 'T00:00:00') : null;
    var to = f.to ? new Date(f.to + 'T23:59:59') : null;
    if (f.range !== 'all' && f.range !== 'custom') {
      from = new Date(Date.now() - parseInt(f.range, 10) * 86400000);
      to = null;
    }
    return rows.filter(function (r) {
      var t = new Date(r.submitted_at);
      if (from && t < from) return false;
      if (to && t > to) return false;
      if (f.language && r.language !== f.language) return false;
      if (f.mode && r.mode !== f.mode) return false;
      for (var i = 0; i < FILTER_QUESTIONS.length; i++) {
        var k = FILTER_QUESTIONS[i];
        if (f[k] && (r.answers || {})[k] !== f[k]) return false;
      }
      return true;
    });
  }
  function demographicFilterOn() {
    var f = filters;
    return !!(f.language || f.mode || FILTER_QUESTIONS.some(function (k) { return f[k]; }));
  }
  function filterBar() {
    var f = filters;
    var sel = function (key, label, options) {
      return '<label class="filter"><span>' + esc(label) + '</span><select data-filter="' + key + '">' +
        '<option value="">All</option>' + options.map(function (o) {
          return '<option value="' + esc(o.v) + '"' + (f[key] === o.v ? ' selected' : '') + '>' + esc(o.en) + '</option>';
        }).join('') + '</select></label>';
    };
    var ranges = [['all', 'All time'], ['7', 'Last 7 days'], ['30', 'Last 30 days'], ['90', 'Last 90 days'], ['custom', 'Custom range']];
    var html = '<div class="filters" role="search">' +
      '<label class="filter"><span>Date range</span><select data-filter="range">' + ranges.map(function (r) {
        return '<option value="' + r[0] + '"' + (f.range === r[0] ? ' selected' : '') + '>' + r[1] + '</option>';
      }).join('') + '</select></label>';
    if (f.range === 'custom') {
      html += '<label class="filter"><span>From</span><input type="date" data-filter="from" value="' + esc(f.from) + '"></label>' +
        '<label class="filter"><span>To</span><input type="date" data-filter="to" value="' + esc(f.to) + '"></label>';
    }
    html += sel('D2', 'City', QINDEX.D2.options) + sel('D3', 'Age', QINDEX.D3.options) + sel('D4', 'Gender', QINDEX.D4.options) +
      sel('D5', 'Years in US', QINDEX.D5.options) + sel('L2', 'English ability', QINDEX.L2.options) +
      sel('language', 'Survey language', [{ v: 'en', en: 'English' }, { v: 'ne', en: 'Nepali' }]) +
      sel('mode', 'How completed', Object.keys(MODE_LABEL).map(function (k) { return { v: k, en: MODE_LABEL[k] }; })) +
      '<button type="button" class="btn-link" data-action="reset-filters">Reset</button></div>';
    return html;
  }

  /* ------------------------------------------------------------ question summaries */
  function summarize(q, rows, suppress) {
    var answered;
    if (q.type === 'single') {
      answered = rows.filter(function (r) { return r.answers[q.id] != null; });
      var items = q.options.map(function (o) {
        return { label: o.en, count: answered.filter(function (r) { return r.answers[q.id] === o.v; }).length };
      });
      return { n: answered.length, chart: C.bars(items, answered.length, { suppress: suppress }) };
    }
    if (q.type === 'multi') {
      answered = rows.filter(function (r) { return Array.isArray(r.answers[q.id]) && r.answers[q.id].length; });
      var mitems = q.options.map(function (o) {
        return { label: o.en, count: answered.filter(function (r) { return r.answers[q.id].indexOf(o.v) !== -1; }).length };
      }).sort(function (a, b) { return b.count - a.count; });
      return { n: answered.length, chart: C.bars(mitems, answered.length, { suppress: suppress }) };
    }
    if (q.type === 'matrix') {
      answered = rows.filter(function (r) { return r.answers[q.id] && Object.keys(r.answers[q.id]).length; });
      var mrows = q.rows.map(function (row) {
        var counts = q.cols.map(function (col) {
          return answered.filter(function (r) { return r.answers[q.id][row.v] === col.v; }).length;
        });
        return { label: row.en, counts: counts, total: counts.reduce(function (a, b) { return a + b; }, 0) };
      });
      return { n: answered.length, chart: C.stacked(mrows, q.cols.map(function (c) { return c.en; }), { suppress: suppress }) };
    }
    if (q.type === 'counts') {
      answered = rows.filter(function (r) { return r.answers[q.id]; });
      var people = 0;
      var citems = q.rows.map(function (row) {
        var households = 0;
        answered.forEach(function (r) {
          var n = r.answers[q.id][row.v] || 0;
          people += n;
          if (n > 0) households++;
        });
        return { label: row.en, count: households };
      });
      var ch = C.bars(citems, answered.length, { suppress: suppress });
      ch.html = '<p class="panel-note">Share of households with at least one person in each age group. People counted in total: ' +
        C.fmtNum(people) + '.</p>' + ch.html;
      return { n: answered.length, chart: ch };
    }
    return null;
  }

  function weeklyPoints(rows) {
    if (!rows.length) return [];
    var byWeek = {};
    rows.forEach(function (r) {
      var k = weekStart(r.submitted_at).getTime();
      byWeek[k] = (byWeek[k] || 0) + 1;
    });
    var keys = Object.keys(byWeek).map(Number).sort(function (a, b) { return a - b; });
    var pts = [];
    var d = new Date(keys[0]);
    var last = keys[keys.length - 1];
    while (d.getTime() <= last) {
      var t = weekStart(d).getTime();
      pts.push({
        label: 'Week of ' + d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        short: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        count: byWeek[t] || 0
      });
      d.setDate(d.getDate() + 7);   // calendar step, safe across daylight-saving changes
    }
    return pts;
  }

  /* ============================================================ AUTH PAGES */
  function authShell(inner) {
    app.innerHTML = '<div class="auth-wrap"><div class="auth-card">' +
      '<div class="auth-brand"><span class="brand-mark">N</span><div><strong>NANC Staff Portal</strong><span>Community Needs Survey</span></div></div>' +
      inner + '</div><p class="auth-foot"><a href="index.html">Go to the public survey</a></p></div>';
  }

  function renderLogin(tab, notice) {
    tab = tab || 'signin';
    var tabs = [['signin', 'Sign in'], ['request', 'Request access'], ['forgot', 'Forgot password']];
    var html = '<div class="tabs" role="tablist">' + tabs.map(function (t) {
      return '<button type="button" role="tab" aria-selected="' + (t[0] === tab) + '" class="tab' + (t[0] === tab ? ' is-active' : '') +
        '" data-action="auth-tab" data-tab="' + t[0] + '">' + t[1] + '</button>';
    }).join('') + '</div>';
    if (notice) html += '<p class="notice">' + esc(notice) + '</p>';
    if (tab === 'signin') {
      html += '<form data-form="signin" class="stack-form">' +
        '<label>Email<input type="email" name="email" autocomplete="username" required></label>' +
        '<label>Password<input type="password" name="password" autocomplete="current-password" required></label>' +
        '<button class="btn btn-primary" type="submit">Sign in</button>' +
        '<button class="btn btn-ghost" type="button" data-action="magic-link">Email me a sign-in link instead</button></form>';
    } else if (tab === 'request') {
      html += '<p class="muted">Staff and volunteers who review data can request an account. An admin must approve it and assign a role before you can see any data.</p>' +
        '<form data-form="signup" class="stack-form">' +
        '<label>Full name<input type="text" name="full_name" autocomplete="name" required></label>' +
        '<label>Email<input type="email" name="email" autocomplete="username" required></label>' +
        '<label>Password (at least 10 characters)<input type="password" name="password" minlength="10" autocomplete="new-password" required></label>' +
        '<button class="btn btn-primary" type="submit">Request access</button></form>';
    } else {
      html += '<form data-form="forgot" class="stack-form">' +
        '<label>Email<input type="email" name="email" autocomplete="username" required></label>' +
        '<button class="btn btn-primary" type="submit">Send reset link</button></form>';
    }
    authShell(html);
  }

  function renderSetPassword() {
    authShell('<h1>Choose a new password</h1><form data-form="new-password" class="stack-form">' +
      '<label>New password (at least 10 characters)<input type="password" name="password" minlength="10" autocomplete="new-password" required></label>' +
      '<button class="btn btn-primary" type="submit">Save password</button></form>');
  }

  function renderPending() {
    var inactive = profile && profile.role && !profile.active;
    authShell('<h1>' + (inactive ? 'Account disabled' : 'Waiting for approval') + '</h1>' +
      '<p>Signed in as <strong>' + esc(session.user.email) + '</strong>.</p>' +
      '<p>' + (inactive ? 'An admin has turned off access for this account.' :
        'An admin needs to approve your account and assign a role before you can see survey data. Please contact the NANC program team.') + '</p>' +
      '<div class="btn-row"><button class="btn btn-primary" data-action="recheck">Check again</button>' +
      '<button class="btn btn-ghost" data-action="sign-out">Sign out</button></div>');
  }

  /* ============================================================ SHELL + ROUTING */
  var ROUTES = [
    { id: 'operations', label: 'Program dashboard', min: 'manager', render: renderOperations },
    { id: 'dashboard', label: 'Survey dashboard', min: 'reviewer', render: renderDashboard },
    { id: 'responses', label: 'Responses', min: 'reviewer', render: renderResponses },
    { id: 'export', label: 'Export data', min: 'reviewer', render: renderExport },
    { id: 'focus-groups', label: 'Focus groups', min: 'reviewer', render: renderFocusGroups },
    { id: 'translations', label: 'Translations', min: 'reviewer', render: renderTranslations },
    { id: 'users', label: 'Users & roles', min: 'admin', group: 'Admin', render: renderUsers },
    { id: 'names', label: 'Names (restricted)', min: 'admin', group: 'Admin', render: renderNames },
    { id: 'settings', label: 'Settings & audit log', min: 'admin', group: 'Admin', render: renderSettings },
    { id: 'account', label: 'My account', min: 'reviewer', hidden: true, render: renderAccount }
  ];
  function defaultRoute() { return can('manager') ? 'operations' : 'dashboard'; }
  function parseHash() {
    var h = location.hash.replace(/^#\/?/, '');
    var parts = h.split('?');
    var params = {};
    (parts[1] || '').split('&').forEach(function (p) { if (p) { var kv = p.split('='); params[kv[0]] = decodeURIComponent(kv[1] || ''); } });
    return { id: parts[0] || defaultRoute(), params: params };
  }

  async function loadProfile() {
    var r = await sb.from('profiles').select('*').eq('id', session.user.id).maybeSingle();
    if (r.error) throw r.error;
    return r.data;
  }

  async function route() {
    var token = ++routeToken;
    if (recovery) return renderSetPassword();
    if (!session) { profile = null; return renderLogin(); }
    if (!profile || profile.id !== session.user.id) {
      try { profile = await loadProfile(); } catch (e) { authShell('<h1>Could not load your account</h1><p>' + esc(errMsg(e)) + '</p>'); return; }
      if (token !== routeToken) return;
    }
    if (!profile || !profile.role || !profile.active) return renderPending();
    var h = parseHash();
    var r = ROUTES.filter(function (x) { return x.id === h.id; })[0];
    if (!r || !can(r.min)) { location.replace('#/' + defaultRoute()); return; }
    renderShell(r);
    var view = document.getElementById('view');
    currentRender = function () { return r.render(view, h.params); };
    try {
      await currentRender();
    } catch (e) {
      if (token === routeToken) view.innerHTML = '<div class="panel error-panel"><h3>Could not load this page</h3><p>' + esc(errMsg(e)) + '</p></div>';
    }
  }
  function rerender() { if (currentRender) currentRender(); }

  function renderShell(active) {
    var groups = {};
    ROUTES.forEach(function (r) {
      if (r.hidden || !can(r.min)) return;
      var g = r.group || 'Main';
      (groups[g] = groups[g] || []).push(r);
    });
    var nav = Object.keys(groups).map(function (g) {
      return '<div class="nav-group">' + (g !== 'Main' ? '<p class="nav-title">' + esc(g) + '</p>' : '') +
        groups[g].map(function (r) {
          return '<a href="#/' + r.id + '" class="nav-link' + (r.id === active.id ? ' is-active' : '') + '"' +
            (r.id === active.id ? ' aria-current="page"' : '') + '>' + esc(r.label) + '</a>';
        }).join('') + '</div>';
    }).join('');
    app.innerHTML = '<div class="shell">' +
      '<aside class="sidebar" id="sidebar"><div class="side-brand"><span class="brand-mark">N</span><div><strong>NANC</strong><span>Staff portal</span></div></div>' +
      '<nav aria-label="Staff">' + nav + '</nav>' +
      '<div class="side-user"><p class="who">' + esc(profile.full_name || profile.email) + '</p>' +
      '<p>' + badge(ROLE_LABEL[profile.role], 'role-' + profile.role) + '</p>' +
      '<a href="#/account" class="nav-link small">My account</a>' +
      '<button type="button" class="btn-link" data-action="sign-out">Sign out</button></div></aside>' +
      '<div class="content"><header class="content-head">' +
      '<button type="button" class="menu-btn" data-action="toggle-nav" aria-controls="sidebar" aria-expanded="false" aria-label="Menu">☰</button>' +
      '<h1>' + esc(active.label) + '</h1><span class="head-meta" id="head-meta"></span></header>' +
      '<main id="view" class="view"><p class="loading">Loading…</p></main></div></div>';
  }

  /* ============================================================ SURVEY DASHBOARD (all roles) */
  async function renderDashboard(view) {
    var rows = await loadResponses();
    var valid = rows.filter(function (r) { return !r.excluded; });
    var f = applyFilters(valid);
    var suppress = demographicFilterOn();
    document.getElementById('head-meta').innerHTML = refreshButton();

    var html = filterBar() + '<p class="showing">Showing <strong>' + C.fmtNum(f.length) + '</strong> of ' + C.fmtNum(valid.length) +
      ' responses' + (suppress ? ' · groups under 5 people are hidden to protect privacy' : '') + '.</p>';

    if (!valid.length) {
      view.innerHTML = html + '<div class="panel empty-panel"><h3>No responses yet</h3><p>Charts appear here once surveys are submitted.</p></div>';
      return;
    }
    if (suppress && f.length < 5) {
      view.innerHTML = html + '<div class="panel empty-panel"><h3>Fewer than 5 responses match these filters</h3>' +
        '<p>Results are hidden so no one can be identified. Remove a filter to see results.</p></div>';
      return;
    }

    var mins = f.map(minutes).filter(function (m) { return m != null; });
    var last7 = f.filter(function (r) { return new Date(r.submitted_at) > Date.now() - 7 * 86400000; }).length;
    var ne = f.filter(function (r) { return r.language === 'ne'; }).length;
    var assisted = f.filter(function (r) { return r.mode !== 'self'; }).length;
    html += '<div class="stats">' +
      C.statTile('Responses', C.fmtNum(f.length), valid.length !== f.length ? 'of ' + C.fmtNum(valid.length) + ' total' : 'all valid responses') +
      C.statTile('Last 7 days', C.fmtNum(last7), 'new responses') +
      C.statTile('Answered in Nepali', C.fmtPct(C.pct(ne, f.length)), C.fmtNum(ne) + ' responses') +
      C.statTile('Volunteer-assisted', C.fmtPct(C.pct(assisted, f.length)), 'in person, phone or paper') +
      C.statTile('Median time', mins.length ? Math.round(median(mins)) + ' min' : '—', 'to complete the survey') + '</div>';

    html += card('Responses per week', 'Submitted surveys, by week', C.columns(weeklyPoints(f), { label: 'Responses per week', periodLabel: 'Week' }));

    html += '<div class="section-tabs" role="tablist" aria-label="Survey sections">' + SURVEY.sections.map(function (s, i) {
      return '<button type="button" role="tab" class="tab' + (ui.section === i ? ' is-active' : '') + '" aria-selected="' + (ui.section === i) +
        '" data-action="section-tab" data-section="' + i + '">' + (i + 1) + '. ' + esc(s.title.en) + '</button>';
    }).join('') + '</div>';

    var section = SURVEY.sections[ui.section];
    if (section.sensitive) {
      html += '<p class="notice">Sensitive section. Results are shown only as totals and are never listed person by person' +
        (can('manager') ? '' : ' for the Data Reviewer role') + '.</p>';
    }
    html += '<div class="grid-cards">';
    section.questions.forEach(function (q) {
      var s = summarize(q, f, suppress);
      if (!s) return;
      var skipped = f.length - s.n;
      var sub = 'Answered by ' + C.fmtNum(s.n) + (skipped > 0 ? ' · skipped or not shown to ' + C.fmtNum(skipped) : '') +
        (q.type === 'multi' ? ' · people could choose more than one' : '');
      html += card('<span class="qcode">' + esc(q.id) + '</span> ' + esc(q.en), esc(sub),
        s.n ? s.chart : { html: '<p class="empty">No answers yet.</p>', table: '' },
        { cls: q.type === 'matrix' && q.rows.length > 6 ? 'wide' : '' });
    });
    html += '</div>';
    view.innerHTML = html;
  }

  function refreshButton() {
    return (cache.loadedAt ? 'Updated ' + cache.loadedAt.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) + ' · ' : '') +
      '<button type="button" class="btn-link" data-action="refresh">Refresh</button>';
  }

  /* ============================================================ PROGRAM DASHBOARD (manager+) */
  async function renderOperations(view) {
    var results = await Promise.all([loadResponses(), loadSettings(), loadTable('focus_groups'), loadTable('translation_requests')]);
    var rows = results[0], settings = results[1], groups = results[2], requests = results[3];
    document.getElementById('head-meta').innerHTML = refreshButton();
    var valid = rows.filter(function (r) { return !r.excluded; });
    var excluded = rows.length - valid.length;
    var target = Number(settings.target_responses) || 300;
    var end = settings.program_end ? new Date(settings.program_end + 'T23:59:59') : null;
    var start = settings.program_start ? new Date(settings.program_start + 'T00:00:00') : null;
    var daysLeft = end ? Math.max(0, Math.ceil((end - Date.now()) / 86400000)) : null;
    var weeksLeft = daysLeft != null ? Math.max(1, daysLeft / 7) : null;
    var remaining = Math.max(0, target - valid.length);
    var thisWeek = valid.filter(function (r) { return weekStart(r.submitted_at).getTime() === weekStart(new Date()).getTime(); }).length;
    var lastWeekStart = weekStart(new Date()).getTime() - 7 * 86400000;
    var lastWeek = valid.filter(function (r) { return weekStart(r.submitted_at).getTime() === lastWeekStart; }).length;
    var assisted = valid.filter(function (r) { return r.mode !== 'self'; }).length;
    var fgDone = groups.filter(function (g) { return g.status === 'completed'; });
    var fgPlanned = groups.filter(function (g) { return g.status === 'planned'; });
    var participants = fgDone.reduce(function (a, g) { return a + (g.participants || 0); }, 0);
    var published = requests.filter(function (r) { return r.status === 'published'; }).length;

    var html = '<section class="panel hero-panel"><div class="hero-row"><div>' +
      '<p class="stat-label">Valid survey responses</p>' +
      '<p class="hero-value">' + C.fmtNum(valid.length) + '<span class="hero-of"> of ' + C.fmtNum(target) + ' target</span></p></div>' +
      '<div class="hero-side"><p><strong>' + C.fmtPct(C.pct(valid.length, target)) + '</strong> of target</p>' +
      (daysLeft != null ? '<p>' + C.fmtNum(daysLeft) + ' days left · need about <strong>' + C.fmtNum(Math.ceil(remaining / weeksLeft)) + '</strong> per week</p>' : '') +
      '</div></div>' + C.meter(valid.length, target, 'Progress toward response target') +
      '<p class="panel-note">Program ' + fmtDate(settings.program_start) + ' to ' + fmtDate(settings.program_end) +
      (start && Date.now() < start ? ' · not started yet' : '') + '. Admins can change the target in Settings.</p></section>';

    html += '<div class="stats">' +
      C.statTile('This week', C.fmtNum(thisWeek), 'last week: ' + C.fmtNum(lastWeek)) +
      C.statTile('Volunteer-assisted', C.fmtPct(C.pct(assisted, valid.length)), C.fmtNum(assisted) + ' responses') +
      C.statTile('Excluded', C.fmtNum(excluded), 'test, duplicate or invalid') +
      C.statTile('Focus groups held', C.fmtNum(fgDone.length), C.fmtNum(fgPlanned.length) + ' planned · ' + C.fmtNum(participants) + ' participants') +
      C.statTile('Translations published', C.fmtNum(published), 'of ' + C.fmtNum(requests.length) + ' requests') + '</div>';

    html += card('Responses per week', 'All valid responses', C.columns(weeklyPoints(valid), { label: 'Responses per week', periodLabel: 'Week' }));

    html += '<div class="grid-cards">';
    // by volunteer
    var vol = {};
    valid.forEach(function (r) {
      var k = r.mode === 'self' ? 'Self-completed (no volunteer)' : (r.volunteer_code || 'Volunteer not named');
      vol[k] = vol[k] || { n: 0, last: r.submitted_at };
      vol[k].n++;
      if (r.submitted_at > vol[k].last) vol[k].last = r.submitted_at;
    });
    var volRows = Object.keys(vol).sort(function (a, b) { return vol[b].n - vol[a].n; }).map(function (k) {
      return [k, C.fmtNum(vol[k].n), fmtDate(vol[k].last)];
    });
    html += '<section class="panel"><header class="panel-head"><div><h3>Surveys by volunteer</h3><p class="panel-sub">Who collected responses, and when they last submitted one</p></div></header>' +
      (volRows.length ? C.table(['Volunteer', 'Surveys', 'Last submitted'], volRows) : '<p class="empty">No responses yet.</p>') + '</section>';

    var modeItems = Object.keys(MODE_LABEL).map(function (k) { return { label: MODE_LABEL[k], count: valid.filter(function (r) { return r.mode === k; }).length }; });
    html += card('How surveys were completed', 'Share of valid responses', C.bars(modeItems, valid.length));
    var cityQ = QINDEX.D2;
    var withCity = valid.filter(function (r) { return r.answers.D2; });
    var cityItems = cityQ.options.map(function (o) { return { label: o.en, count: withCity.filter(function (r) { return r.answers.D2 === o.v; }).length }; })
      .sort(function (a, b) { return b.count - a.count; });
    html += card('Coverage by city', 'Responses by city, to spot areas that need more outreach', C.bars(cityItems, withCity.length));
    var langItems = [{ label: 'Nepali', count: valid.filter(function (r) { return r.language === 'ne'; }).length },
      { label: 'English', count: valid.filter(function (r) { return r.language === 'en'; }).length }];
    html += card('Survey language', 'Language chosen by the respondent', C.bars(langItems, valid.length));

    // translation priorities from L9
    var l9 = QINDEX.L9;
    var l9Answered = valid.filter(function (r) { return Array.isArray(r.answers.L9) && r.answers.L9.length; });
    var prio = l9.options.filter(function (o) { return o.v !== 'other'; }).map(function (o) {
      var reqs = requests.filter(function (q) { return q.topic === o.v; });
      return { v: o.v, label: o.en, count: l9Answered.filter(function (r) { return r.answers.L9.indexOf(o.v) !== -1; }).length, reqs: reqs };
    }).sort(function (a, b) { return b.count - a.count; }).slice(0, 10);
    html += '<section class="panel wide"><header class="panel-head"><div><h3>Translation priorities from the survey</h3>' +
      '<p class="panel-sub">Top 10 topics respondents want in Nepali first (question L9), and the translation work already started</p></div></header>' +
      C.table(['Topic', 'Chosen by', 'Share', 'Translation requests'], prio.map(function (p) {
        var st = p.reqs.length ? p.reqs.map(function (q) { return TR_STATUS_LABEL[q.status]; }).join(', ') : 'None yet';
        return [p.label, C.fmtNum(p.count), C.fmtPct(C.pct(p.count, l9Answered.length)), st];
      })) + '<p class="panel-note"><a href="#/translations">Open the translation tracker</a></p></section>';

    // data quality
    var suspicious = valid.filter(function (r) {
      var m = minutes(r);
      return answeredCount(r) < 10 || (m != null && m < 3);
    });
    html += '<section class="panel wide"><header class="panel-head"><div><h3>Data quality check</h3>' +
      '<p class="panel-sub">Responses with fewer than 10 answered questions or finished in under 3 minutes. Review them and exclude tests or duplicates.</p></div></header>' +
      (suspicious.length ? C.table(['Submitted', 'Response', 'Answered questions', 'Minutes'], suspicious.slice(0, 15).map(function (r) {
        var m = minutes(r);
        return [fmtDateTime(r.submitted_at), r.id.slice(0, 8), answeredCount(r), m == null ? '—' : m.toFixed(1)];
      })) + (suspicious.length > 15 ? '<p class="panel-note">' + (suspicious.length - 15) + ' more.</p>' : '') +
        '<p class="panel-note"><a href="#/responses">Open responses to review</a></p>'
        : '<p class="empty">Nothing to review.</p>') + '</section>';
    html += '</div>';
    view.innerHTML = html;
  }

  /* ============================================================ RESPONSES */
  async function renderResponses(view, params) {
    var rows = await loadResponses();
    document.getElementById('head-meta').innerHTML = refreshButton();
    if (params.id) return renderResponseDetail(view, rows.filter(function (r) { return r.id === params.id; })[0]);

    var base = can('manager') && ui.showExcluded ? rows : rows.filter(function (r) { return !r.excluded; });
    var f = applyFilters(base).slice().reverse();
    var suppress = demographicFilterOn();
    var pageSize = 25;
    var pages = Math.max(1, Math.ceil(f.length / pageSize));
    ui.page = Math.min(ui.page, pages - 1);
    var html = filterBar();
    html += '<div class="toolbar"><p class="showing">' + C.fmtNum(f.length) + ' responses, newest first.' +
      (can('manager') ? '' : ' Free-text answers and volunteer names are hidden for the Data Reviewer role.') + '</p>' +
      (can('manager') ? '<label class="check"><input type="checkbox" data-action="show-excluded"' + (ui.showExcluded ? ' checked' : '') + '> Show excluded</label>' : '') + '</div>';
    if (suppress && f.length < 5 && f.length > 0) {
      view.innerHTML = html + '<div class="panel empty-panel"><h3>Fewer than 5 responses match these filters</h3><p>Remove a filter to see the list.</p></div>';
      return;
    }
    var slice = f.slice(ui.page * pageSize, ui.page * pageSize + pageSize);
    html += '<div class="panel"><div class="table-wrap"><table class="data-table clickable"><thead><tr>' +
      '<th>Submitted</th><th>Response</th><th>Language</th><th>How</th><th>City</th><th>Age</th><th class="num">Answered</th><th>Status</th></tr></thead><tbody>' +
      slice.map(function (r) {
        return '<tr data-action="open-response" data-id="' + r.id + '" tabindex="0">' +
          '<td>' + esc(fmtDateTime(r.submitted_at)) + '</td><td><code>' + esc(r.id.slice(0, 8)) + '</code></td>' +
          '<td>' + esc(LANG_LABEL[r.language]) + '</td><td>' + esc(MODE_LABEL[r.mode] || r.mode) + '</td>' +
          '<td>' + esc(r.answers.D2 ? optLabel(QINDEX.D2, r.answers.D2) : '—') + '</td>' +
          '<td>' + esc(r.answers.D3 ? optLabel(QINDEX.D3, r.answers.D3) : '—') + '</td>' +
          '<td class="num">' + answeredCount(r) + '</td>' +
          '<td>' + (r.excluded ? badge('Excluded', 'warn') : badge('Included', 'ok')) + '</td></tr>';
      }).join('') + (slice.length ? '' : '<tr><td colspan="8" class="empty">No responses match.</td></tr>') +
      '</tbody></table></div>' +
      '<div class="pager"><button class="btn btn-ghost" data-action="page" data-dir="-1"' + (ui.page === 0 ? ' disabled' : '') + '>Previous</button>' +
      '<span>Page ' + (ui.page + 1) + ' of ' + pages + '</span>' +
      '<button class="btn btn-ghost" data-action="page" data-dir="1"' + (ui.page >= pages - 1 ? ' disabled' : '') + '>Next</button></div></div>';
    view.innerHTML = html;
  }

  function answerText(q, val) {
    if (q.type === 'single') return optLabel(q, val);
    if (q.type === 'multi') return val.map(function (v) { return optLabel(q, v); }).join('; ');
    if (q.type === 'matrix') return Object.keys(val).map(function (k) { return rowLabel(q, k) + ': ' + optLabel(q, val[k]); }).join('\n');
    if (q.type === 'counts') return Object.keys(val).filter(function (k) { return val[k]; }).map(function (k) { return rowLabel(q, k) + ': ' + val[k]; }).join('\n') || 'None entered';
    return String(val);
  }

  function renderResponseDetail(view, r) {
    if (!r) { view.innerHTML = '<div class="panel"><p>Response not found. <a href="#/responses">Back to responses</a></p></div>'; return; }
    var m = minutes(r);
    var html = '<p><a href="#/responses" class="btn-link">‹ Back to responses</a></p>' +
      '<section class="panel"><div class="detail-meta">' +
      '<div><span>Response</span><strong><code>' + esc(r.id) + '</code></strong></div>' +
      '<div><span>Submitted</span><strong>' + esc(fmtDateTime(r.submitted_at)) + '</strong></div>' +
      '<div><span>Language</span><strong>' + esc(LANG_LABEL[r.language]) + '</strong></div>' +
      '<div><span>How</span><strong>' + esc(MODE_LABEL[r.mode] || r.mode) + '</strong></div>' +
      (can('manager') ? '<div><span>Volunteer</span><strong>' + esc(r.volunteer_code || '—') + '</strong></div>' : '') +
      '<div><span>Time taken</span><strong>' + (m == null ? '—' : Math.round(m) + ' min') + '</strong></div>' +
      '<div><span>Status</span><strong>' + (r.excluded ? badge('Excluded', 'warn') + ' ' + esc(r.exclude_reason || '') : badge('Included', 'ok')) + '</strong></div></div>';
    if (can('manager')) {
      html += '<div class="btn-row">' + (r.excluded
        ? '<button class="btn btn-ghost" data-action="include-response" data-id="' + r.id + '">Include in results again</button>'
        : '<button class="btn btn-ghost" data-action="exclude-response" data-id="' + r.id + '">Exclude from results…</button>') +
        (can('admin') ? '<button class="btn btn-danger" data-action="delete-response" data-id="' + r.id + '">Delete permanently</button>' : '') + '</div>';
    }
    html += '</section>';
    SURVEY.sections.forEach(function (s) {
      var hide = s.sensitive && !can('manager');
      html += '<section class="panel"><h3>' + esc(s.title.en) + '</h3>';
      if (hide) {
        html += '<p class="muted">Hidden for the Data Reviewer role. This section appears only as totals on the dashboard.</p></section>';
        return;
      }
      html += '<dl class="answers">';
      s.questions.forEach(function (q) {
        var val = r.answers[q.id];
        var other = r.answers[q.id + '_other'];
        var text = val == null || (Array.isArray(val) && !val.length) ? '' : answerText(q, val);
        html += '<div class="answer-row"><dt><span class="qcode">' + esc(q.id) + '</span> ' + esc(q.en) + '</dt><dd' + (text ? '' : ' class="muted"') + '>' +
          esc(text || 'Not answered') + (other ? '<br><em>Other: ' + esc(other) + '</em>' : '') + '</dd></div>';
      });
      html += '</dl></section>';
    });
    view.innerHTML = html;
  }

  /* ============================================================ EXPORT */
  function exportColumns(includeFree) {
    var cols = [];
    SURVEY.sections.forEach(function (s) {
      if (s.sensitive && !can('manager')) return;
      s.questions.forEach(function (q) {
        if (q.type === 'single') cols.push({ key: q.id, get: function (a) { return a[q.id]; }, q: q, label: q.en });
        else if (q.type === 'multi') q.options.forEach(function (o) {
          cols.push({ key: q.id + '_' + o.v, q: q, label: q.en + ' — ' + o.en, get: function (a) { var v = a[q.id]; return Array.isArray(v) && v.length ? (v.indexOf(o.v) !== -1 ? 1 : 0) : ''; } });
        });
        else if (q.type === 'matrix' || q.type === 'counts') q.rows.forEach(function (row) {
          cols.push({ key: q.id + '_' + row.v, q: q, label: q.en + ' — ' + row.en, get: function (a) { return (a[q.id] || {})[row.v]; } });
        });
        var hasOther = (q.options || q.rows || []).some(function (o) { return o.other; });
        if (hasOther && includeFree) cols.push({ key: q.id + '_other_text', q: q, label: q.en + ' — Other (text)', get: function (a) { return a[q.id + '_other']; } });
      });
    });
    return cols;
  }

  async function renderExport(view) {
    var rows = await loadResponses();
    var valid = rows.filter(function (r) { return !r.excluded; });
    var mgr = can('manager');
    view.innerHTML =
      '<div class="grid-cards">' +
      '<section class="panel"><h3>Responses (CSV)</h3><p>One row per response, with coded answers. Multi-select questions get one 0/1 column per option. Opens in Excel with Nepali text intact.</p>' +
      '<p class="muted">' + C.fmtNum(valid.length) + ' valid responses' + (rows.length - valid.length ? ', ' + (rows.length - valid.length) + ' excluded' : '') + '.</p>' +
      (mgr ? '<label class="check"><input type="checkbox" id="exp-excluded"> Include excluded responses</label>' : '') +
      '<p class="muted">' + (mgr ? 'Includes free-text "Other" answers and volunteer names.' : 'Free-text answers, volunteer names and the sensitive section (mental health and safety) are left out for the Data Reviewer role.') + '</p>' +
      '<button class="btn btn-primary" data-action="export-responses">Download responses</button></section>' +
      '<section class="panel"><h3>Codebook (CSV)</h3><p>Explains every column: the question, the answer codes and their English and Nepali labels. Share it with anyone who uses the responses file.</p>' +
      '<button class="btn btn-primary" data-action="export-codebook">Download codebook</button></section>' +
      '<section class="panel"><h3>Summary tables (CSV)</h3><p>Counts and percentages for every answer to every question, for all valid responses. Useful for grant reports.</p>' +
      '<button class="btn btn-primary" data-action="export-summary">Download summary</button></section></div>' +
      '<p class="muted">Every download is recorded in the audit log.</p>';
  }

  function exportResponses() {
    var mgr = can('manager');
    var incl = mgr && document.getElementById('exp-excluded') && document.getElementById('exp-excluded').checked;
    var rows = cache.responses.filter(function (r) { return incl || !r.excluded; });
    var cols = exportColumns(mgr);
    var head = ['response_id', 'survey_version', 'submitted_at', 'language', 'mode'].concat(mgr ? ['volunteer_code', 'excluded', 'exclude_reason'] : []).concat(['minutes'])
      .concat(cols.map(function (c) { return c.key; }));
    var out = [head];
    rows.forEach(function (r) {
      var m = minutes(r);
      out.push([r.id, r.survey_version, r.submitted_at, r.language, r.mode].concat(mgr ? [r.volunteer_code, r.excluded ? 1 : 0, r.exclude_reason] : [])
        .concat([m == null ? '' : m.toFixed(1)]).concat(cols.map(function (c) { var v = c.get(r.answers || {}); return v == null ? '' : v; })));
    });
    download('nanc-survey-responses-' + stamp() + '.csv', csv(out));
    audit('export.responses', null, { rows: rows.length, include_excluded: !!incl });
  }

  function exportCodebook() {
    var out = [['column', 'question_id', 'section', 'question_en', 'question_ne', 'code', 'label_en', 'label_ne']];
    SURVEY.sections.forEach(function (s) {
      s.questions.forEach(function (q) {
        var sec = s.title.en;
        if (q.type === 'single') q.options.forEach(function (o) { out.push([q.id, q.id, sec, q.en, q.ne, o.v, o.en, o.ne]); });
        if (q.type === 'multi') q.options.forEach(function (o) { out.push([q.id + '_' + o.v, q.id, sec, q.en, q.ne, '1 = selected, 0 = not selected', o.en, o.ne]); });
        if (q.type === 'matrix') q.rows.forEach(function (row) {
          q.cols.forEach(function (c) { out.push([q.id + '_' + row.v, q.id, sec, q.en + ' — ' + row.en, q.ne + ' — ' + row.ne, c.v, c.en, c.ne]); });
        });
        if (q.type === 'counts') q.rows.forEach(function (row) { out.push([q.id + '_' + row.v, q.id, sec, q.en + ' — ' + row.en, q.ne + ' — ' + row.ne, 'number of people', '', '']); });
        if ((q.options || q.rows || []).some(function (o) { return o.other; })) {
          out.push([q.id + '_other_text', q.id, sec, q.en + ' — Other (please specify)', q.ne, 'free text', 'Program Manager and Admin exports only', '']);
        }
      });
    });
    download('nanc-survey-codebook-' + stamp() + '.csv', csv(out));
    audit('export.codebook');
  }

  function exportSummary() {
    var valid = cache.responses.filter(function (r) { return !r.excluded; });
    var out = [['question_id', 'question', 'row', 'answer', 'count', 'answered', 'percent']];
    SURVEY.sections.forEach(function (s) {
      s.questions.forEach(function (q) {
        if (q.type === 'single' || q.type === 'multi') {
          var ans = valid.filter(function (r) { var v = r.answers[q.id]; return q.type === 'single' ? v != null : Array.isArray(v) && v.length; });
          q.options.forEach(function (o) {
            var n = ans.filter(function (r) { return q.type === 'single' ? r.answers[q.id] === o.v : r.answers[q.id].indexOf(o.v) !== -1; }).length;
            out.push([q.id, q.en, '', o.en, n, ans.length, C.pct(n, ans.length)]);
          });
        } else if (q.type === 'matrix') {
          q.rows.forEach(function (row) {
            var ans = valid.filter(function (r) { return r.answers[q.id] && r.answers[q.id][row.v]; });
            q.cols.forEach(function (c) {
              var n = ans.filter(function (r) { return r.answers[q.id][row.v] === c.v; }).length;
              out.push([q.id, q.en, row.en, c.en, n, ans.length, C.pct(n, ans.length)]);
            });
          });
        } else if (q.type === 'counts') {
          var hh = valid.filter(function (r) { return r.answers[q.id]; });
          q.rows.forEach(function (row) {
            var people = hh.reduce(function (a, r) { return a + (r.answers[q.id][row.v] || 0); }, 0);
            out.push([q.id, q.en, row.en, 'total people', people, hh.length, '']);
          });
        }
      });
    });
    download('nanc-survey-summary-' + stamp() + '.csv', csv(out));
    audit('export.summary', null, { responses: valid.length });
  }

  /* ============================================================ FOCUS GROUPS */
  async function renderFocusGroups(view) {
    var groups = await loadTable('focus_groups', { col: 'session_date', asc: false });
    var mgr = can('manager');
    var done = groups.filter(function (g) { return g.status === 'completed'; });
    var themeCount = {};
    done.forEach(function (g) { (g.themes || []).forEach(function (t) { themeCount[t] = (themeCount[t] || 0) + 1; }); });
    var themes = Object.keys(themeCount).map(function (t) { return { label: t, count: themeCount[t] }; }).sort(function (a, b) { return b.count - a.count; });

    var html = '<div class="stats">' +
      C.statTile('Sessions held', C.fmtNum(done.length), '') +
      C.statTile('Planned', C.fmtNum(groups.filter(function (g) { return g.status === 'planned'; }).length), '') +
      C.statTile('Participants reached', C.fmtNum(done.reduce(function (a, g) { return a + (g.participants || 0); }, 0)), 'across completed sessions') + '</div>';
    if (mgr) html += '<div class="toolbar"><span></span><button class="btn btn-primary" data-action="fg-new">+ New session</button></div>';
    if (ui.editing && ui.editing.type === 'fg') html += focusGroupForm(ui.editing.row);

    html += '<div class="grid-cards">';
    html += '<section class="panel wide"><header class="panel-head"><div><h3>Sessions</h3><p class="panel-sub">Record notes without names or details that identify anyone.</p></div></header>' +
      (groups.length ? '<div class="table-wrap"><table class="data-table"><thead><tr><th>Date</th><th>Session</th><th>Status</th><th>Language</th><th class="num">People</th><th>Themes</th>' + (mgr ? '<th></th>' : '') + '</tr></thead><tbody>' +
        groups.map(function (g) {
          return '<tr><td>' + esc(fmtDate(g.session_date)) + '</td><td><strong>' + esc(g.title) + '</strong><br><span class="muted">' +
            esc([g.location, g.facilitator && 'Facilitator: ' + g.facilitator].filter(Boolean).join(' · ')) + '</span>' +
            (g.summary ? '<details><summary>Summary</summary><p class="pre">' + esc(g.summary) + '</p></details>' : '') + '</td>' +
            '<td>' + badge(FG_STATUS[g.status], g.status === 'completed' ? 'ok' : g.status === 'cancelled' ? 'muted' : 'info') + '</td>' +
            '<td>' + esc({ ne: 'Nepali', en: 'English', mixed: 'Mixed' }[g.language]) + '</td>' +
            '<td class="num">' + (g.participants == null ? '—' : g.participants) + '</td>' +
            '<td>' + (g.themes || []).map(function (t) { return '<span class="chip-tag">' + esc(t) + '</span>'; }).join(' ') + '</td>' +
            (mgr ? '<td class="actions"><button class="btn-link" data-action="fg-edit" data-id="' + g.id + '">Edit</button> <button class="btn-link danger" data-action="fg-delete" data-id="' + g.id + '">Delete</button></td>' : '') + '</tr>';
        }).join('') + '</tbody></table></div>' : '<p class="empty">No sessions recorded yet.</p>') + '</section>';
    html += card('Themes heard across sessions', 'Number of completed sessions where each theme came up',
      themes.length ? C.bars(themes, done.length) : { html: '<p class="empty">Tag themes on completed sessions to see them here.</p>', table: '' });
    html += '</div>';
    view.innerHTML = html;
    view._groups = groups;
  }

  function focusGroupForm(g) {
    g = g || {};
    var opt = function (v, l, cur) { return '<option value="' + v + '"' + (cur === v ? ' selected' : '') + '>' + l + '</option>'; };
    return '<section class="panel form-panel"><h3>' + (g.id ? 'Edit session' : 'New session') + '</h3>' +
      '<form data-form="fg" class="grid-form">' + (g.id ? '<input type="hidden" name="id" value="' + g.id + '">' : '') +
      '<label class="span2">Title<input name="title" required value="' + esc(g.title || '') + '"></label>' +
      '<label>Date<input type="date" name="session_date" value="' + esc(g.session_date || '') + '"></label>' +
      '<label>Status<select name="status">' + opt('planned', 'Planned', g.status || 'planned') + opt('completed', 'Completed', g.status) + opt('cancelled', 'Cancelled', g.status) + '</select></label>' +
      '<label>Location<input name="location" value="' + esc(g.location || '') + '"></label>' +
      '<label>Language<select name="language">' + opt('ne', 'Nepali', g.language || 'ne') + opt('en', 'English', g.language) + opt('mixed', 'Mixed', g.language) + '</select></label>' +
      '<label>Facilitator<input name="facilitator" value="' + esc(g.facilitator || '') + '"></label>' +
      '<label>Participants<input type="number" min="0" name="participants" value="' + (g.participants == null ? '' : g.participants) + '"></label>' +
      '<label class="span2">Topic<input name="topic" value="' + esc(g.topic || '') + '"></label>' +
      '<label class="span2">Themes (separate with commas)<input name="themes" placeholder="interpreter access, DMV test, health insurance" value="' + esc((g.themes || []).join(', ')) + '"></label>' +
      '<label class="span2">Summary notes (no names)<textarea name="summary" rows="5">' + esc(g.summary || '') + '</textarea></label>' +
      '<div class="span2 btn-row"><button class="btn btn-primary" type="submit">Save</button><button class="btn btn-ghost" type="button" data-action="cancel-edit">Cancel</button></div>' +
      '</form></section>';
  }

  /* ============================================================ TRANSLATIONS */
  async function renderTranslations(view) {
    var mgr = can('manager');
    var html = '<div class="tabs" role="tablist">' + [['requests', 'Translation requests'], ['glossary', 'Glossary']].map(function (t) {
      return '<button type="button" role="tab" class="tab' + (ui.trTab === t[0] ? ' is-active' : '') + '" aria-selected="' + (ui.trTab === t[0]) +
        '" data-action="tr-tab" data-tab="' + t[0] + '">' + t[1] + '</button>';
    }).join('') + '</div>';

    if (ui.trTab === 'glossary') {
      var terms = await loadTable('glossary', { col: 'term_en', asc: true });
      if (mgr) {
        html += '<section class="panel form-panel"><h3>Add a term</h3><form data-form="glossary" class="grid-form">' +
          '<label>English term<input name="term_en" required></label><label>Approved Nepali<input name="term_ne" required lang="ne"></label>' +
          '<label class="span2">Notes<input name="notes" placeholder="When to use it, alternatives to avoid"></label>' +
          '<div class="span2"><button class="btn btn-primary" type="submit">Add term</button></div></form></section>';
      }
      html += '<section class="panel"><header class="panel-head"><div><h3>Approved terms</h3><p class="panel-sub">Use these words in every translation so the community sees consistent language.</p></div></header>' +
        (terms.length ? '<div class="table-wrap"><table class="data-table"><thead><tr><th>English</th><th>Nepali</th><th>Notes</th>' + (mgr ? '<th></th>' : '') + '</tr></thead><tbody>' +
          terms.map(function (t) {
            return '<tr><td>' + esc(t.term_en) + '</td><td lang="ne">' + esc(t.term_ne) + '</td><td>' + esc(t.notes || '') + '</td>' +
              (mgr ? '<td class="actions"><button class="btn-link danger" data-action="gl-delete" data-id="' + t.id + '">Delete</button></td>' : '') + '</tr>';
          }).join('') + '</tbody></table></div>' : '<p class="empty">No terms yet.</p>') + '</section>';
      view.innerHTML = html;
      return;
    }

    var reqs = await loadTable('translation_requests', { col: 'created_at', asc: false });
    var l9 = QINDEX.L9;
    html += '<div class="stats">' + TR_STATUS.map(function (s) {
      return C.statTile(TR_STATUS_LABEL[s], C.fmtNum(reqs.filter(function (r) { return r.status === s; }).length), '');
    }).join('') + '</div>';
    html += '<div class="toolbar"><label class="filter"><span>Status</span><select data-action="tr-status"><option value="">All</option>' +
      TR_STATUS.map(function (s) { return '<option value="' + s + '"' + (ui.trStatus === s ? ' selected' : '') + '>' + TR_STATUS_LABEL[s] + '</option>'; }).join('') +
      '</select></label>' + (mgr ? '<button class="btn btn-primary" data-action="tr-new">+ New request</button>' : '') + '</div>';
    if (ui.editing && ui.editing.type === 'tr') html += translationForm(ui.editing.row);
    var shown = reqs.filter(function (r) { return !ui.trStatus || r.status === ui.trStatus; });
    var today = new Date().toISOString().slice(0, 10);
    html += '<section class="panel">' + (shown.length ? '<div class="table-wrap"><table class="data-table"><thead><tr><th>Document</th><th>Topic</th><th>Priority</th><th>Status</th><th>Due</th><th>People</th><th>Links</th>' + (mgr ? '<th></th>' : '') + '</tr></thead><tbody>' +
      shown.map(function (r) {
        var overdue = r.due_date && r.due_date < today && r.status !== 'published';
        var statusCell = mgr
          ? '<select data-action="tr-set-status" data-id="' + r.id + '" aria-label="Status">' + TR_STATUS.map(function (s) {
              return '<option value="' + s + '"' + (r.status === s ? ' selected' : '') + '>' + TR_STATUS_LABEL[s] + '</option>';
            }).join('') + '</select>'
          : esc(TR_STATUS_LABEL[r.status]);
        var link = function (u, l) { return u && /^https?:\/\//.test(u) ? '<a href="' + esc(u) + '" target="_blank" rel="noopener">' + l + '</a>' : ''; };
        return '<tr><td><strong>' + esc(r.title) + '</strong>' + (r.partner ? '<br><span class="muted">For ' + esc(r.partner) + '</span>' : '') + '</td>' +
          '<td>' + esc(r.topic ? optLabel(l9, r.topic) : '—') + '</td>' +
          '<td>' + badge(r.priority.charAt(0).toUpperCase() + r.priority.slice(1), r.priority === 'high' ? 'warn' : r.priority === 'low' ? 'muted' : 'info') + '</td>' +
          '<td>' + statusCell + '</td>' +
          '<td>' + (overdue ? badge('Overdue', 'warn') + ' ' : '') + esc(fmtDate(r.due_date)) + '</td>' +
          '<td>' + esc([r.translator && 'Translator: ' + r.translator, r.reviewer && 'Reviewer: ' + r.reviewer].filter(Boolean).join(' · ') || '—') + '</td>' +
          '<td>' + [link(r.source_url, 'English'), link(r.translated_url, 'Nepali')].filter(Boolean).join(' · ') + '</td>' +
          (mgr ? '<td class="actions"><button class="btn-link" data-action="tr-edit" data-id="' + r.id + '">Edit</button> <button class="btn-link danger" data-action="tr-delete" data-id="' + r.id + '">Delete</button></td>' : '') + '</tr>';
      }).join('') + '</tbody></table></div>' : '<p class="empty">No translation requests' + (ui.trStatus ? ' with this status' : '') + '.</p>') + '</section>';
    view.innerHTML = html;
    view._requests = reqs;
  }

  function translationForm(r) {
    r = r || { priority: 'medium', status: 'requested' };
    var opt = function (v, l, cur) { return '<option value="' + esc(v) + '"' + (cur === v ? ' selected' : '') + '>' + esc(l) + '</option>'; };
    return '<section class="panel form-panel"><h3>' + (r.id ? 'Edit request' : 'New translation request') + '</h3>' +
      '<form data-form="tr" class="grid-form">' + (r.id ? '<input type="hidden" name="id" value="' + r.id + '">' : '') +
      '<label class="span2">Document title<input name="title" required value="' + esc(r.title || '') + '"></label>' +
      '<label>Topic (from survey question L9)<select name="topic"><option value="">—</option>' +
      QINDEX.L9.options.map(function (o) { return opt(o.v, o.en, r.topic); }).join('') + '</select></label>' +
      '<label>Requested by (partner)<input name="partner" value="' + esc(r.partner || '') + '"></label>' +
      '<label>Priority<select name="priority">' + opt('high', 'High', r.priority) + opt('medium', 'Medium', r.priority) + opt('low', 'Low', r.priority) + '</select></label>' +
      '<label>Status<select name="status">' + TR_STATUS.map(function (s) { return opt(s, TR_STATUS_LABEL[s], r.status); }).join('') + '</select></label>' +
      '<label>Translator<input name="translator" value="' + esc(r.translator || '') + '"></label>' +
      '<label>Community reviewer<input name="reviewer" value="' + esc(r.reviewer || '') + '"></label>' +
      '<label>Due date<input type="date" name="due_date" value="' + esc(r.due_date || '') + '"></label><span></span>' +
      '<label>English source link<input type="url" name="source_url" placeholder="https://" value="' + esc(r.source_url || '') + '"></label>' +
      '<label>Nepali version link<input type="url" name="translated_url" placeholder="https://" value="' + esc(r.translated_url || '') + '"></label>' +
      '<label class="span2">Notes<textarea name="notes" rows="3">' + esc(r.notes || '') + '</textarea></label>' +
      '<div class="span2 btn-row"><button class="btn btn-primary" type="submit">Save</button><button class="btn btn-ghost" type="button" data-action="cancel-edit">Cancel</button></div>' +
      '</form></section>';
  }

  /* ============================================================ ADMIN: USERS */
  async function renderUsers(view) {
    var users = await loadTable('profiles', { col: 'created_at', asc: false });
    var pending = users.filter(function (u) { return !u.role && u.active; });
    var staff = users.filter(function (u) { return u.role || !u.active; });
    var roleSelect = function (u) {
      var self = u.id === profile.id;
      return '<select data-action="set-role" data-id="' + u.id + '"' + (self ? ' disabled title="You cannot change your own role"' : '') + ' aria-label="Role for ' + esc(u.email) + '">' +
        '<option value="">No access</option>' + ['reviewer', 'manager', 'admin'].map(function (r) {
          return '<option value="' + r + '"' + (u.role === r ? ' selected' : '') + '>' + ROLE_LABEL[r] + '</option>';
        }).join('') + '</select>';
    };
    var html = '<section class="panel"><header class="panel-head"><div><h3>Waiting for approval</h3>' +
      '<p class="panel-sub">People who used "Request access" on the sign-in page. Choose a role to let them in.</p></div></header>' +
      (pending.length ? '<div class="table-wrap"><table class="data-table"><thead><tr><th>Name</th><th>Email</th><th>Requested</th><th>Give role</th><th></th></tr></thead><tbody>' +
        pending.map(function (u) {
          return '<tr><td>' + esc(u.full_name || '—') + '</td><td>' + esc(u.email) + '</td><td>' + esc(fmtDate(u.created_at)) + '</td>' +
            '<td>' + roleSelect(u) + '</td><td class="actions"><button class="btn-link danger" data-action="deny-user" data-id="' + u.id + '">Deny</button></td></tr>';
        }).join('') + '</tbody></table></div>' : '<p class="empty">No one is waiting.</p>') + '</section>';
    html += '<section class="panel"><header class="panel-head"><div><h3>Staff</h3><p class="panel-sub">' +
      'Data Reviewer: dashboards and de-identified data. Program Manager: also full answers, focus groups and translations. Admin: also users, names, settings.</p></div></header>' +
      '<div class="table-wrap"><table class="data-table"><thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Access</th><th>Since</th></tr></thead><tbody>' +
      staff.map(function (u) {
        var self = u.id === profile.id;
        return '<tr><td>' + esc(u.full_name || '—') + (self ? ' ' + badge('You', 'info') : '') + '</td><td>' + esc(u.email) + '</td><td>' + roleSelect(u) + '</td>' +
          '<td><label class="check"><input type="checkbox" data-action="set-active" data-id="' + u.id + '"' + (u.active ? ' checked' : '') + (self ? ' disabled' : '') + '> Active</label></td>' +
          '<td>' + esc(fmtDate(u.created_at)) + '</td></tr>';
      }).join('') + '</tbody></table></div></section>';
    view.innerHTML = html;
  }

  /* ============================================================ ADMIN: NAMES */
  async function renderNames(view) {
    var res = await Promise.all([loadTable('contacts', { col: 'created_at', asc: false }), loadResponses()]);
    var contacts = res[0];
    var byId = {};
    res[1].forEach(function (r) { byId[r.id] = r; });
    audit('contacts.view', null, { rows: contacts.length });
    var rows = contacts.map(function (c) {
      var r = byId[c.response_id];
      return { c: c, fg: r && r.answers.P5 ? optLabel(QINDEX.P5, r.answers.P5) : '—', fgv: r && r.answers.P5 };
    }).filter(function (x) { return !ui.namesFgOnly || x.fgv === 'yes' || x.fgv === 'maybe'; });
    view.innerHTML = '<p class="notice warn">Restricted. Names are kept apart from answers and are for focus-group invitations only. ' +
      'Every visit to this page is recorded in the audit log. Do not copy names into other systems.</p>' +
      '<div class="toolbar"><label class="check"><input type="checkbox" data-action="names-fg"' + (ui.namesFgOnly ? ' checked' : '') + '> Only people interested in a focus group</label>' +
      '<span class="btn-row"><button class="btn btn-ghost" data-action="names-export">Download list</button>' +
      '<button class="btn btn-danger" data-action="names-delete-all">Delete all names…</button></span></div>' +
      '<section class="panel">' + (rows.length ? '<div class="table-wrap"><table class="data-table"><thead><tr><th>First name</th><th>Last name</th><th>Focus group interest</th><th>Submitted</th><th></th></tr></thead><tbody>' +
        rows.map(function (x) {
          return '<tr><td>' + esc(x.c.first_name || '') + '</td><td>' + esc(x.c.last_name || '') + '</td><td>' + esc(x.fg) + '</td><td>' + esc(fmtDate(x.c.created_at)) + '</td>' +
            '<td class="actions"><a class="btn-link" href="#/responses?id=' + x.c.response_id + '">Response</a> <button class="btn-link danger" data-action="name-delete" data-id="' + x.c.response_id + '">Delete</button></td></tr>';
        }).join('') + '</tbody></table></div>' : '<p class="empty">No names stored.</p>') + '</section>';
    view._names = rows;
  }

  /* ============================================================ ADMIN: SETTINGS */
  async function renderSettings(view) {
    var res = await Promise.all([loadSettings(true), sb.from('audit_log').select('*').order('at', { ascending: false }).limit(200)]);
    var s = res[0];
    if (res[1].error) throw res[1].error;
    var log = res[1].data || [];
    view.innerHTML = '<div class="grid-cards">' +
      '<section class="panel form-panel"><h3>Program settings</h3><form data-form="settings" class="grid-form">' +
      '<label>Response target<input type="number" min="1" name="target_responses" value="' + esc(s.target_responses || 300) + '" required></label><span></span>' +
      '<label>Program start<input type="date" name="program_start" value="' + esc(s.program_start || '') + '"></label>' +
      '<label>Program end<input type="date" name="program_end" value="' + esc(s.program_end || '') + '"></label>' +
      '<div class="span2"><button class="btn btn-primary" type="submit">Save settings</button></div></form></section>' +
      '<section class="panel"><h3>Clean up before launch</h3><p>Remove test submissions so they do not count in results.</p><div class="btn-row">' +
      '<button class="btn btn-ghost" data-action="delete-test">Delete connection-test rows</button>' +
      '<button class="btn btn-danger" data-action="delete-all-responses">Delete ALL responses…</button></div>' +
      '<p class="muted">To remove a single response, open it from Responses and delete it there.</p></section></div>' +
      '<section class="panel"><header class="panel-head"><div><h3>Audit log</h3><p class="panel-sub">Latest 200 actions: sign-ins to restricted pages, exports, role changes and deletions.</p></div></header>' +
      (log.length ? C.table(['When', 'Who', 'Action', 'Target', 'Details'], log.map(function (l) {
        return [fmtDateTime(l.at), l.email || '—', l.action, l.target || '', l.details ? JSON.stringify(l.details) : ''];
      })) : '<p class="empty">No activity yet.</p>') + '</section>';
  }

  /* ============================================================ ACCOUNT */
  async function renderAccount(view) {
    view.innerHTML = '<section class="panel form-panel"><h3>' + esc(profile.full_name || profile.email) + '</h3>' +
      '<p>' + esc(profile.email) + ' · ' + badge(ROLE_LABEL[profile.role], 'role-' + profile.role) + '</p>' +
      '<form data-form="new-password" class="stack-form narrow"><label>New password (at least 10 characters)<input type="password" name="password" minlength="10" autocomplete="new-password" required></label>' +
      '<button class="btn btn-primary" type="submit">Change password</button></form></section>';
  }

  /* ============================================================ EVENTS */
  function redirectUrl() { return location.href.split('#')[0]; }

  app.addEventListener('submit', async function (e) {
    var form = e.target;
    var kind = form.dataset.form;
    if (!kind) return;
    e.preventDefault();
    var btn = form.querySelector('[type=submit]');
    if (btn) btn.disabled = true;
    var d = formData(form);
    try {
      if (kind === 'signin') {
        var r = await sb.auth.signInWithPassword({ email: d.email, password: d.password });
        if (r.error) throw r.error;
      } else if (kind === 'signup') {
        var su = await sb.auth.signUp({ email: d.email, password: d.password, options: { data: { full_name: d.full_name }, emailRedirectTo: redirectUrl() } });
        if (su.error) throw su.error;
        renderLogin('signin', 'Request sent. Confirm your email using the link we sent, then an admin will approve your account.');
        return;
      } else if (kind === 'forgot') {
        var fr = await sb.auth.resetPasswordForEmail(d.email, { redirectTo: redirectUrl() });
        if (fr.error) throw fr.error;
        renderLogin('signin', 'If that email has an account, a reset link is on its way.');
        return;
      } else if (kind === 'new-password') {
        var up = await sb.auth.updateUser({ password: d.password });
        if (up.error) throw up.error;
        recovery = false;
        toast('Password saved.');
        if (location.hash.indexOf('account') === -1) route(); else form.reset();
      } else if (kind === 'fg') {
        var row = {
          title: d.title, session_date: d.session_date || null, status: d.status, location: d.location || null, language: d.language,
          facilitator: d.facilitator || null, participants: d.participants === '' ? null : parseInt(d.participants, 10), topic: d.topic || null,
          summary: d.summary || null, themes: d.themes ? d.themes.split(',').map(function (t) { return t.trim().toLowerCase(); }).filter(Boolean) : []
        };
        var fq = d.id ? sb.from('focus_groups').update(row).eq('id', d.id) : sb.from('focus_groups').insert(row);
        var fres = await fq;
        if (fres.error) throw fres.error;
        ui.editing = null;
        toast('Session saved.');
        rerender();
      } else if (kind === 'tr') {
        var tr = {
          title: d.title, topic: d.topic || null, partner: d.partner || null, priority: d.priority, status: d.status, translator: d.translator || null,
          reviewer: d.reviewer || null, due_date: d.due_date || null, source_url: d.source_url || null, translated_url: d.translated_url || null, notes: d.notes || null
        };
        var tq = d.id ? sb.from('translation_requests').update(tr).eq('id', d.id) : sb.from('translation_requests').insert(tr);
        var tres = await tq;
        if (tres.error) throw tres.error;
        ui.editing = null;
        toast('Request saved.');
        rerender();
      } else if (kind === 'glossary') {
        var gres = await sb.from('glossary').insert({ term_en: d.term_en, term_ne: d.term_ne, notes: d.notes || null });
        if (gres.error) throw gres.error;
        toast('Term added.');
        rerender();
      } else if (kind === 'settings') {
        var sres = await sb.from('settings').upsert([
          { key: 'target_responses', value: parseInt(d.target_responses, 10) },
          { key: 'program_start', value: d.program_start || '' },
          { key: 'program_end', value: d.program_end || '' }
        ]);
        if (sres.error) throw sres.error;
        audit('settings.update', null, d);
        cache.settings = null;
        toast('Settings saved.');
        rerender();
      }
    } catch (err) {
      toast(errMsg(err), 'error');
    } finally {
      if (btn && document.body.contains(btn)) btn.disabled = false;
    }
  });

  app.addEventListener('change', async function (e) {
    var el = e.target;
    if (el.dataset.filter) {
      filters[el.dataset.filter] = el.value;
      ui.page = 0;
      rerender();
      return;
    }
    var action = el.dataset.action;
    try {
      if (action === 'show-excluded') { ui.showExcluded = el.checked; ui.page = 0; rerender(); }
      else if (action === 'names-fg') { ui.namesFgOnly = el.checked; rerender(); }
      else if (action === 'tr-status') { ui.trStatus = el.value; rerender(); }
      else if (action === 'tr-set-status') {
        var r = await sb.from('translation_requests').update({ status: el.value }).eq('id', el.dataset.id);
        if (r.error) throw r.error;
        toast('Status updated.');
      } else if (action === 'set-role') {
        var rr = await sb.from('profiles').update({ role: el.value || null }).eq('id', el.dataset.id);
        if (rr.error) throw rr.error;
        toast(el.value ? 'Role set to ' + ROLE_LABEL[el.value] + '.' : 'Access removed.');
        rerender();
      } else if (action === 'set-active') {
        var ra = await sb.from('profiles').update({ active: el.checked }).eq('id', el.dataset.id);
        if (ra.error) throw ra.error;
        toast(el.checked ? 'Access turned on.' : 'Access turned off.');
      }
    } catch (err) {
      toast(errMsg(err), 'error');
      rerender();
    }
  });

  app.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && e.target.matches('tr[data-action=open-response]')) e.target.click();
  });

  app.addEventListener('click', async function (e) {
    var el = e.target.closest('[data-action]');
    if (!el || el.tagName === 'SELECT' || (el.tagName === 'INPUT' && el.type !== 'button')) return;
    var a = el.dataset.action;
    try {
      if (a === 'auth-tab') renderLogin(el.dataset.tab);
      else if (a === 'magic-link') {
        var email = app.querySelector('input[name=email]').value.trim();
        if (!email) { toast('Enter your email first.', 'error'); return; }
        var ml = await sb.auth.signInWithOtp({ email: email, options: { shouldCreateUser: false, emailRedirectTo: redirectUrl() } });
        if (ml.error) throw ml.error;
        renderLogin('signin', 'Check your email for a sign-in link.');
      }
      else if (a === 'sign-out') { await sb.auth.signOut(); cache = { responses: null, settings: null }; location.hash = ''; }
      else if (a === 'recheck') { profile = null; route(); }
      else if (a === 'toggle-nav') {
        var open = document.querySelector('.shell').classList.toggle('nav-open');
        el.setAttribute('aria-expanded', String(open));
      }
      else if (a === 'toggle-table') {
        var panel = document.getElementById(el.dataset.target);
        var t = panel.querySelector('.panel-table'), c = panel.querySelector('.panel-chart');
        var showTable = t.hidden;
        t.hidden = !showTable; c.hidden = showTable;
        el.textContent = showTable ? 'Chart view' : 'Table view';
      }
      else if (a === 'refresh') { cache.responses = null; cache.settings = null; rerender(); }
      else if (a === 'reset-filters') { filters = blankFilters(); ui.page = 0; rerender(); }
      else if (a === 'section-tab') { ui.section = parseInt(el.dataset.section, 10); rerender(); }
      else if (a === 'page') { ui.page += parseInt(el.dataset.dir, 10); rerender(); window.scrollTo(0, 0); }
      else if (a === 'open-response') location.hash = '#/responses?id=' + el.dataset.id;
      else if (a === 'exclude-response') {
        var reason = prompt('Why exclude this response? (for example: test entry, duplicate, not eligible)');
        if (reason === null) return;
        var ex = await sb.from('responses').update({ excluded: true, exclude_reason: reason || 'No reason given' }).eq('id', el.dataset.id);
        if (ex.error) throw ex.error;
        audit('response.exclude', el.dataset.id, { reason: reason });
        cache.responses = null; toast('Response excluded from results.'); rerender();
      }
      else if (a === 'include-response') {
        var inc = await sb.from('responses').update({ excluded: false, exclude_reason: null }).eq('id', el.dataset.id);
        if (inc.error) throw inc.error;
        audit('response.include', el.dataset.id);
        cache.responses = null; toast('Response included again.'); rerender();
      }
      else if (a === 'delete-response') {
        if (!confirm('Delete this response permanently? This cannot be undone.')) return;
        var del = await sb.from('responses').delete().eq('id', el.dataset.id);
        if (del.error) throw del.error;
        audit('response.delete', el.dataset.id);
        cache.responses = null; toast('Response deleted.'); location.hash = '#/responses';
      }
      else if (a === 'export-responses') exportResponses();
      else if (a === 'export-codebook') exportCodebook();
      else if (a === 'export-summary') exportSummary();
      else if (a === 'fg-new') { ui.editing = { type: 'fg', row: null }; rerender(); }
      else if (a === 'fg-edit') { ui.editing = { type: 'fg', row: document.getElementById('view')._groups.filter(function (g) { return g.id === el.dataset.id; })[0] }; rerender(); window.scrollTo(0, 0); }
      else if (a === 'fg-delete') {
        if (!confirm('Delete this focus group session?')) return;
        var fd = await sb.from('focus_groups').delete().eq('id', el.dataset.id);
        if (fd.error) throw fd.error;
        toast('Session deleted.'); rerender();
      }
      else if (a === 'cancel-edit') { ui.editing = null; rerender(); }
      else if (a === 'tr-tab') { ui.trTab = el.dataset.tab; ui.editing = null; rerender(); }
      else if (a === 'tr-new') { ui.editing = { type: 'tr', row: null }; rerender(); }
      else if (a === 'tr-edit') { ui.editing = { type: 'tr', row: document.getElementById('view')._requests.filter(function (r) { return r.id === el.dataset.id; })[0] }; rerender(); window.scrollTo(0, 0); }
      else if (a === 'tr-delete') {
        if (!confirm('Delete this translation request?')) return;
        var td = await sb.from('translation_requests').delete().eq('id', el.dataset.id);
        if (td.error) throw td.error;
        toast('Request deleted.'); rerender();
      }
      else if (a === 'gl-delete') {
        if (!confirm('Delete this glossary term?')) return;
        var gd = await sb.from('glossary').delete().eq('id', el.dataset.id);
        if (gd.error) throw gd.error;
        rerender();
      }
      else if (a === 'deny-user') {
        if (!confirm('Deny access for this person?')) return;
        var du = await sb.from('profiles').update({ active: false }).eq('id', el.dataset.id);
        if (du.error) throw du.error;
        toast('Access denied.'); rerender();
      }
      else if (a === 'names-export') {
        var rows = document.getElementById('view')._names || [];
        download('nanc-focus-group-contacts-' + stamp() + '.csv', csv([['first_name', 'last_name', 'focus_group_interest', 'submitted']].concat(rows.map(function (x) {
          return [x.c.first_name, x.c.last_name, x.fg, x.c.created_at];
        }))));
        audit('contacts.export', null, { rows: rows.length });
      }
      else if (a === 'name-delete') {
        if (!confirm('Delete this name? The survey answers stay.')) return;
        var nd = await sb.from('contacts').delete().eq('response_id', el.dataset.id);
        if (nd.error) throw nd.error;
        audit('contacts.delete', el.dataset.id);
        rerender();
      }
      else if (a === 'names-delete-all') {
        if (prompt('This deletes every stored name. Survey answers stay. Type DELETE to confirm.') !== 'DELETE') return;
        var na = await sb.from('contacts').delete().not('response_id', 'is', null);
        if (na.error) throw na.error;
        audit('contacts.delete_all');
        toast('All names deleted.'); rerender();
      }
      else if (a === 'delete-test') {
        var dt = await sb.from('responses').delete().eq('survey_version', 'connection-test').select('id');
        if (dt.error) throw dt.error;
        audit('responses.delete_test', null, { rows: (dt.data || []).length });
        cache.responses = null; toast('Deleted ' + (dt.data || []).length + ' test rows.'); rerender();
      }
      else if (a === 'delete-all-responses') {
        if (prompt('This permanently deletes EVERY survey response and name. Type DELETE ALL to confirm.') !== 'DELETE ALL') return;
        var da = await sb.from('responses').delete().not('id', 'is', null).select('id');
        if (da.error) throw da.error;
        audit('responses.delete_all', null, { rows: (da.data || []).length });
        cache.responses = null; toast('Deleted ' + (da.data || []).length + ' responses.'); rerender();
      }
    } catch (err) {
      toast(errMsg(err), 'error');
    }
  });

  /* ============================================================ START */
  C.initTooltips();
  sb.auth.onAuthStateChange(function (event, s) {
    session = s;
    if (event === 'PASSWORD_RECOVERY') recovery = true;
    if (event === 'SIGNED_OUT') { profile = null; cache = { responses: null, settings: null }; }
    if (event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') return;
    setTimeout(route, 0);   // never call Supabase from inside this callback
  });
  window.addEventListener('hashchange', function () {
    ui.editing = null;
    var shell = document.querySelector('.shell');
    if (shell) shell.classList.remove('nav-open');
    route();
  });
})();
