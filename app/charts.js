/*
 * Small, dependency-free chart helpers for the staff dashboards.
 * Every chart returns { html, table } so a card can toggle between the chart and a table view.
 * Marks follow the dataviz spec: <=24px bars, 4px rounded data end, 2px surface gaps,
 * one hue for single-series charts, fixed categorical order for stacked charts, legends for >=2 series.
 * Values shown as "<5" are suppressed small cells (see suppress option).
 */
(function () {
  'use strict';

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function pct(n, d) { return d ? Math.round((n / d) * 1000) / 10 : 0; }
  function fmtPct(p) { return (p % 1 === 0 ? p.toFixed(0) : p.toFixed(1)) + '%'; }
  function fmtNum(n) { return Number(n).toLocaleString('en-US'); }
  function small(n, suppress) { return suppress && n > 0 && n < 5; }
  function countText(n, suppress) { return small(n, suppress) ? '<5' : fmtNum(n); }

  function table(headers, rows) {
    return '<div class="table-wrap"><table class="data-table"><thead><tr>' +
      headers.map(function (h, i) { return '<th' + (i ? ' class="num"' : '') + '>' + esc(h) + '</th>'; }).join('') +
      '</tr></thead><tbody>' +
      rows.map(function (r) {
        return '<tr>' + r.map(function (c, i) { return '<td' + (i ? ' class="num"' : '') + '>' + esc(c) + '</td>'; }).join('') + '</tr>';
      }).join('') + '</tbody></table></div>';
  }

  /* Horizontal bars, one series. items: [{label, count}], denominator: n answering. */
  function bars(items, denominator, opts) {
    opts = opts || {};
    var suppress = !!opts.suppress;
    var max = Math.max.apply(null, items.map(function (i) { return pct(i.count, denominator); }).concat([1]));
    var html = '<div class="bars">' + items.map(function (it) {
      var p = pct(it.count, denominator);
      var hidden = small(it.count, suppress);
      var value = hidden ? '<5' : fmtPct(p);
      var tip = it.label + ' — ' + (hidden ? 'fewer than 5 responses' : fmtPct(p) + ' (' + fmtNum(it.count) + ' of ' + fmtNum(denominator) + ')');
      var w = hidden ? 0 : (p / max) * 100;
      return '<div class="bar-row" data-tip="' + esc(tip) + '" tabindex="0">' +
        '<span class="bar-label">' + esc(it.label) + '</span>' +
        '<span class="bar-track"><span class="bar-fill' + (hidden ? ' is-suppressed' : '') + '" style="width:' + w.toFixed(2) + '%"></span>' +
        '<span class="bar-value">' + esc(value) + '</span></span></div>';
    }).join('') + '</div>';
    var t = table(['Answer', 'Count', 'Percent'], items.map(function (it) {
      var hidden = small(it.count, suppress);
      return [it.label, countText(it.count, suppress), hidden ? '—' : fmtPct(pct(it.count, denominator))];
    }));
    return { html: html, table: t };
  }

  /* 100% stacked bars. rows: [{label, counts: [n per col], total}], cols: [label] */
  var SERIES = 6;
  function luminanceDark(hex) {
    var h = hex.replace('#', '');
    var r = parseInt(h.substr(0, 2), 16) / 255, g = parseInt(h.substr(2, 2), 16) / 255, b = parseInt(h.substr(4, 2), 16) / 255;
    var lin = function (c) { return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
    return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b) < 0.35;
  }
  function seriesColor(i) {
    return getComputedStyle(document.documentElement).getPropertyValue('--series-' + ((i % SERIES) + 1)).trim() || '#2a78d6';
  }
  function stacked(rows, cols, opts) {
    opts = opts || {};
    var suppress = !!opts.suppress;
    var legend = '<ul class="legend">' + cols.map(function (c, i) {
      return '<li><span class="swatch" style="background:var(--series-' + ((i % SERIES) + 1) + ')"></span>' + esc(c) + '</li>';
    }).join('') + '</ul>';
    var body = rows.map(function (r) {
      if (!r.total) {
        return '<div class="stack-row"><span class="bar-label">' + esc(r.label) + '</span><span class="stack-empty">No answers</span></div>';
      }
      if (suppress && r.total < 5) {
        return '<div class="stack-row"><span class="bar-label">' + esc(r.label) + '</span><span class="stack-empty">Fewer than 5 answers</span></div>';
      }
      var segs = r.counts.map(function (n, i) {
        if (!n) return '';
        var p = pct(n, r.total);
        var hidden = small(n, suppress);
        var color = seriesColor(i);
        var ink = luminanceDark(color) ? '#ffffff' : '#0b0b0b';
        var label = !hidden && p >= 12 ? '<span class="seg-label" style="color:' + ink + '">' + fmtPct(p) + '</span>' : '';
        var tip = r.label + ' · ' + cols[i] + ' — ' + (hidden ? 'fewer than 5' : fmtPct(p) + ' (' + fmtNum(n) + ' of ' + fmtNum(r.total) + ')');
        return '<span class="seg" tabindex="0" data-tip="' + esc(tip) + '" style="flex:' + n + ' 1 0;background:var(--series-' + ((i % SERIES) + 1) + ')">' + label + '</span>';
      }).join('');
      return '<div class="stack-row"><span class="bar-label">' + esc(r.label) +
        ' <span class="muted">n=' + esc(countText(r.total, suppress)) + '</span></span><span class="stack">' + segs + '</span></div>';
    }).join('');
    var t = table(['Row'].concat(cols).concat(['Answered']), rows.map(function (r) {
      return [r.label].concat(r.counts.map(function (n) {
        return small(n, suppress) ? '<5' : (r.total ? fmtPct(pct(n, r.total)) + ' (' + n + ')' : '—');
      })).concat([countText(r.total, suppress)]);
    }));
    return { html: legend + '<div class="stacks">' + body + '</div>', table: t };
  }

  /* Columns over time, one series. points: [{label, count}] */
  function columns(points, opts) {
    opts = opts || {};
    if (!points.length) return { html: '<p class="empty">No responses yet.</p>', table: '' };
    var W = 640, H = 200, padL = 36, padB = 26, padT = 16, padR = 8;
    var max = Math.max.apply(null, points.map(function (p) { return p.count; }).concat([1]));
    var step = niceStep(max);
    var top = Math.ceil(max / step) * step;
    var plotW = W - padL - padR, plotH = H - padT - padB;
    var band = plotW / points.length;
    var bw = Math.min(24, band * 0.7);
    var svg = '<svg viewBox="0 0 ' + W + ' ' + H + '" class="col-chart" role="img" aria-label="' + esc(opts.label || 'Chart') + '">';
    for (var v = 0; v <= top; v += step) {
      var y = padT + plotH - (v / top) * plotH;
      svg += '<line class="grid" x1="' + padL + '" x2="' + (W - padR) + '" y1="' + y + '" y2="' + y + '"/>' +
        '<text class="tick" x="' + (padL - 6) + '" y="' + (y + 4) + '" text-anchor="end">' + fmtNum(v) + '</text>';
    }
    var every = Math.ceil(points.length / 8);
    points.forEach(function (p, i) {
      var h = (p.count / top) * plotH;
      var x = padL + i * band + (band - bw) / 2;
      var y = padT + plotH - h;
      var r = Math.min(4, h);
      var d = h > 0
        ? 'M' + x + ',' + (padT + plotH) + 'V' + (y + r) + 'Q' + x + ',' + y + ' ' + (x + r) + ',' + y +
          'H' + (x + bw - r) + 'Q' + (x + bw) + ',' + y + ' ' + (x + bw) + ',' + (y + r) + 'V' + (padT + plotH) + 'Z'
        : '';
      svg += '<g class="col" tabindex="0" data-tip="' + esc(p.label + ' — ' + fmtNum(p.count) + ' responses') + '">' +
        '<rect class="hit" x="' + (padL + i * band) + '" y="' + padT + '" width="' + band + '" height="' + plotH + '"/>' +
        (d ? '<path class="col-fill" d="' + d + '"/>' : '') + '</g>';
      if (i % every === 0) {
        svg += '<text class="tick" x="' + (padL + i * band + band / 2) + '" y="' + (H - 8) + '" text-anchor="middle">' + esc(p.short || p.label) + '</text>';
      }
    });
    svg += '<line class="axis" x1="' + padL + '" x2="' + (W - padR) + '" y1="' + (padT + plotH) + '" y2="' + (padT + plotH) + '"/></svg>';
    var t = table([opts.periodLabel || 'Period', 'Responses'], points.map(function (p) { return [p.label, fmtNum(p.count)]; }));
    return { html: svg, table: t };
  }
  function niceStep(max) {
    var raw = max / 4;
    var mag = Math.pow(10, Math.floor(Math.log10(Math.max(raw, 1))));
    var n = raw / mag;
    return Math.max(1, (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * mag);
  }

  function statTile(label, value, sub) {
    return '<div class="stat"><div class="stat-label">' + esc(label) + '</div>' +
      '<div class="stat-value">' + esc(value) + '</div>' +
      (sub ? '<div class="stat-sub">' + esc(sub) + '</div>' : '') + '</div>';
  }

  function meter(value, target, label) {
    var p = target ? Math.min(100, (value / target) * 100) : 0;
    return '<div class="meter" role="meter" aria-valuemin="0" aria-valuemax="' + target + '" aria-valuenow="' + value + '" aria-label="' + esc(label || 'Progress') + '">' +
      '<div class="meter-fill" style="width:' + p.toFixed(1) + '%"></div></div>';
  }

  /* One floating tooltip for every [data-tip] mark; also on keyboard focus. */
  function initTooltips() {
    var tip = document.createElement('div');
    tip.className = 'tooltip';
    tip.setAttribute('role', 'status');
    tip.hidden = true;
    document.body.appendChild(tip);
    function show(el, x, y) {
      tip.textContent = el.getAttribute('data-tip');
      tip.hidden = false;
      var w = tip.offsetWidth, h = tip.offsetHeight;
      var left = Math.min(window.innerWidth - w - 8, Math.max(8, x + 12));
      var top = y - h - 12 < 8 ? y + 16 : y - h - 12;
      tip.style.left = left + 'px';
      tip.style.top = top + 'px';
    }
    document.addEventListener('pointermove', function (e) {
      var el = e.target.closest && e.target.closest('[data-tip]');
      if (el) show(el, e.clientX, e.clientY); else tip.hidden = true;
    });
    document.addEventListener('focusin', function (e) {
      var el = e.target.closest && e.target.closest('[data-tip]');
      if (!el) { tip.hidden = true; return; }
      var r = el.getBoundingClientRect();
      show(el, r.left + r.width / 2, r.top);
    });
    document.addEventListener('scroll', function () { tip.hidden = true; }, true);
  }

  window.Charts = { bars: bars, stacked: stacked, columns: columns, statTile: statTile, meter: meter, table: table, initTooltips: initTooltips, esc: esc, pct: pct, fmtPct: fmtPct, fmtNum: fmtNum };
})();
