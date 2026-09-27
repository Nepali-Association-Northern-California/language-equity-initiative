/*
 * NANC Language Equity & Access Project: public website.
 * Shared header, footer, language switch and timeline status for every page.
 *
 * EDIT CONTACT DETAILS HERE. Empty values show "coming soon" on the site instead of a blank.
 */
window.SITE = {
  orgName: { en: 'Nepali Association of Northern California (NANC)', ne: 'नेपाली एसोसिएसन अफ नर्दर्न क्यालिफोर्निया (NANC)' },
  email: '',                 // e.g. 'info@example.org'
  phone: '',                 // e.g. '(510) 555-0100'
  address: { en: '', ne: '' },   // street, city, CA ZIP
  mapUrl: '',                // Google Maps link to the community center
  hours: { en: '', ne: '' },     // e.g. 'Saturdays 10am–2pm'
  facebook: '',              // full https:// link
  whatsapp: '',              // full https:// link to a WhatsApp group or chat
  website: ''                // NANC main website, full https:// link
};

(function () {
  'use strict';
  var S = window.SITE;
  var LANG_KEY = 'nanc_site_lang';

  var NAV = [
    { href: 'index.html', en: 'Home', ne: 'गृहपृष्ठ' },
    { href: 'about.html', en: 'About', ne: 'परियोजनाबारे' },
    { href: 'activities.html', en: 'What we do', ne: 'हाम्रा गतिविधि' },
    { href: 'timeline.html', en: 'Timeline', ne: 'समयरेखा' },
    { href: 'resources.html', en: 'Resources', ne: 'स्रोत सामग्री' },
    { href: 'get-involved.html', en: 'Get involved', ne: 'सहभागी हुनुहोस्' },
    { href: 'contact.html', en: 'Contact', ne: 'सम्पर्क' }
  ];

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function bi(en, ne) { return '<span lang="en">' + en + '</span><span lang="ne">' + ne + '</span>'; }
  var SOON = bi('Coming soon', 'चाँडै उपलब्ध हुनेछ');

  /* ---------------------------------------------------------------- language */
  function initialLang() {
    var q = new URLSearchParams(location.search).get('lang');
    if (q === 'en' || q === 'ne') return q;
    try { var saved = localStorage.getItem(LANG_KEY); if (saved) return saved; } catch (e) { /* ignore */ }
    return (navigator.language || '').toLowerCase().indexOf('ne') === 0 ? 'ne' : 'en';
  }
  function setLang(lang) {
    document.documentElement.setAttribute('data-lang', lang);
    document.documentElement.setAttribute('lang', lang);
    try { localStorage.setItem(LANG_KEY, lang); } catch (e) { /* ignore */ }
    var t = document.querySelector('meta[name="title-' + lang + '"]');
    if (t) document.title = t.getAttribute('content');
    var btn = document.getElementById('lang-toggle');
    if (btn) btn.setAttribute('aria-label', lang === 'en' ? 'नेपालीमा हेर्नुहोस्' : 'View in English');
  }

  /* ---------------------------------------------------------------- header / footer */
  var page = (location.pathname.split('/').pop() || 'index.html');

  function header() {
    var links = NAV.map(function (n) {
      var cur = n.href === page;
      return '<li><a href="' + n.href + '"' + (cur ? ' aria-current="page"' : '') + '>' + bi(n.en, n.ne) + '</a></li>';
    }).join('');
    return '<a class="skip" href="#main">' + bi('Skip to content', 'मुख्य सामग्रीमा जानुहोस्') + '</a>' +
      '<div class="bar"><a class="brand" href="index.html">' +
      '<img src="NANC_Logo.png" alt="" width="48" height="48">' +
      '<span class="brand-text"><strong>' + bi('Language Equity &amp; Access Initiative', 'भाषिक समानता तथा पहुँच परियोजना') + '</strong>' +
      '<span>' + bi('A NANC community project', 'NANC को सामुदायिक परियोजना') + '</span></span></a>' +
      '<div class="bar-actions">' +
      '<button type="button" id="lang-toggle" class="lang-toggle"><span lang="en">नेपाली</span><span lang="ne">English</span></button>' +
      '<button type="button" class="menu-toggle" aria-expanded="false" aria-controls="site-nav">' +
      '<span aria-hidden="true">☰</span><span class="sr-only">' + bi('Menu', 'मेनु') + '</span></button></div></div>' +
      '<nav id="site-nav" class="site-nav" aria-label="Main"><ul>' + links +
      '<li class="nav-cta"><a href="survey.html" class="btn btn-accent">' + bi('Take the survey', 'सर्वेक्षणमा भाग लिनुहोस्') + '</a></li></ul></nav>';
  }

  function contactLines() {
    var out = [];
    out.push('<li><strong>' + bi('Address', 'ठेगाना') + ':</strong> ' +
      (S.address.en ? bi(esc(S.address.en), esc(S.address.ne || S.address.en)) : SOON) + '</li>');
    out.push('<li><strong>' + bi('Email', 'इमेल') + ':</strong> ' +
      (S.email ? '<a href="mailto:' + esc(S.email) + '">' + esc(S.email) + '</a>' : SOON) + '</li>');
    out.push('<li><strong>' + bi('Phone', 'फोन') + ':</strong> ' +
      (S.phone ? '<a href="tel:' + esc(S.phone.replace(/[^\d+]/g, '')) + '">' + esc(S.phone) + '</a>' : SOON) + '</li>');
    return out.join('');
  }

  function footer() {
    return '<div class="foot-grid">' +
      '<div><img src="NANC_Logo.png" alt="NANC logo" width="72" height="72" class="foot-logo">' +
      '<p>' + bi('Language Equity &amp; Access Initiative, run by the ' + esc(S.orgName.en) + ', serving since 1994.',
        'भाषिक समानता तथा पहुँच परियोजना, ' + esc(S.orgName.ne) + ' द्वारा सञ्चालित, सन् १९९४ देखि सेवामा।') + '</p></div>' +
      '<div><h2>' + bi('Contact', 'सम्पर्क') + '</h2><ul class="plain">' + contactLines() + '</ul></div>' +
      '<div><h2>' + bi('Quick links', 'छिटो लिङ्क') + '</h2><ul class="plain">' +
      '<li><a href="survey.html">' + bi('Take the survey', 'सर्वेक्षणमा भाग लिनुहोस्') + '</a></li>' +
      '<li><a href="resources.html">' + bi('Nepali resources', 'नेपाली स्रोत सामग्री') + '</a></li>' +
      '<li><a href="get-involved.html">' + bi('Volunteer with us', 'स्वयंसेवक बन्नुहोस्') + '</a></li>' +
      '<li><a href="staff.html">' + bi('Staff and volunteer sign in', 'कर्मचारी तथा स्वयंसेवक साइन इन') + '</a></li></ul></div></div>' +
      '<div class="sponsor-line"><p>' + bi(
        'Funded by <strong>Contra Costa County</strong> through the <strong>West Contra Costa Community Impact Fund</strong>. This website shares project information only and does not provide medical, legal or emergency help. In an emergency call <strong>911</strong>. For a mental health crisis call or text <strong>988</strong>.',
        '<strong>कन्ट्रा कोस्टा काउन्टी</strong>को <strong>पश्चिम कन्ट्रा कोस्टा सामुदायिक प्रभाव कोष</strong> (West Contra Costa Community Impact Fund) मार्फत आर्थिक सहयोग। यो वेबसाइटले परियोजनाको जानकारी मात्र दिन्छ; चिकित्सा, कानुनी वा आपत्कालीन सहायता दिँदैन। आपत्कालीन अवस्थामा <strong>९११</strong> मा फोन गर्नुहोस्। मानसिक स्वास्थ्य संकटमा <strong>९८८</strong> मा फोन वा सन्देश पठाउनुहोस्।') +
      '</p><p class="copy">© 2026 NANC</p></div>';
  }

  /* ---------------------------------------------------------------- contact blocks on pages */
  function fillContact() {
    var el = document.querySelectorAll('[data-contact]');
    for (var i = 0; i < el.length; i++) {
      var k = el[i].getAttribute('data-contact');
      var html = SOON;
      if (k === 'address' && S.address.en) {
        html = bi(esc(S.address.en), esc(S.address.ne || S.address.en)) +
          (S.mapUrl ? '<br><a href="' + esc(S.mapUrl) + '" target="_blank" rel="noopener">' + bi('Open in maps', 'नक्सामा हेर्नुहोस्') + '</a>' : '');
      } else if (k === 'email' && S.email) {
        html = '<a href="mailto:' + esc(S.email) + '">' + esc(S.email) + '</a>';
      } else if (k === 'phone' && S.phone) {
        html = '<a href="tel:' + esc(S.phone.replace(/[^\d+]/g, '')) + '">' + esc(S.phone) + '</a>';
      } else if (k === 'hours' && S.hours.en) {
        html = bi(esc(S.hours.en), esc(S.hours.ne || S.hours.en));
      } else if ((k === 'facebook' || k === 'whatsapp' || k === 'website') && S[k]) {
        html = '<a href="' + esc(S[k]) + '" target="_blank" rel="noopener">' + esc(S[k].replace(/^https?:\/\//, '')) + '</a>';
      }
      el[i].innerHTML = html;
    }
  }

  /* ---------------------------------------------------------------- timeline status */
  function markTimeline() {
    var now = new Date();
    var items = document.querySelectorAll('[data-start][data-end]');
    for (var i = 0; i < items.length; i++) {
      var s = new Date(items[i].getAttribute('data-start') + 'T00:00:00');
      var e = new Date(items[i].getAttribute('data-end') + 'T23:59:59');
      var state = now > e ? 'done' : now >= s ? 'now' : 'next';
      items[i].classList.add('is-' + state);
      var badge = items[i].querySelector('.status');
      if (badge) {
        badge.innerHTML = state === 'done' ? bi('Completed', 'सम्पन्न') : state === 'now' ? bi('Happening now', 'अहिले चलिरहेको') : bi('Coming up', 'आगामी');
      }
    }
  }

  /* ---------------------------------------------------------------- start */
  document.getElementById('site-header').innerHTML = header();
  document.getElementById('site-footer').innerHTML = footer();
  fillContact();
  markTimeline();
  setLang(initialLang());

  document.addEventListener('click', function (e) {
    if (e.target.closest('#lang-toggle')) {
      setLang(document.documentElement.getAttribute('data-lang') === 'en' ? 'ne' : 'en');
    }
    var m = e.target.closest('.menu-toggle');
    if (m) {
      var open = document.body.classList.toggle('nav-open');
      m.setAttribute('aria-expanded', String(open));
    }
  });
})();
