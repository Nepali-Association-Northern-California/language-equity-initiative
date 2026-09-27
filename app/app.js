/*
 * NANC survey app. No build step, no dependencies.
 * Renders window.SURVEY (survey-data.js), autosaves a draft in this browser,
 * and submits to Supabase when configured in config.js (otherwise saves locally for testing).
 */
(function () {
  'use strict';

  var SURVEY = window.SURVEY;
  var CFG = window.APP_CONFIG || {};
  var DRAFT_KEY = 'nanc_survey_draft_v1';
  var QUEUE_KEY = 'nanc_survey_queue_v1';
  var LOCAL_KEY = 'nanc_survey_local_v1';
  var VOL_KEY = 'nanc_survey_volunteer_v1';

  var UI = {
    en: {
      appTitle: 'Community Needs Survey',
      org: 'Nepali Association of Northern California',
      switchLang: 'नेपाली',
      welcome: 'Help us understand the needs of the Nepali community in West Contra Costa County.',
      minutes: 'About 15 minutes · Voluntary · Your answers are kept private',
      chooseLang: 'Choose your language to begin',
      continueTitle: 'You have an unfinished survey on this device.',
      continueBtn: 'Continue where I left off',
      discardBtn: 'Start over',
      brandTitle: 'Language Equity & Access',
      nav: [['index.html', 'Home'], ['about.html', 'About'], ['activities.html', 'What we do'], ['timeline.html', 'Timeline'],
        ['resources.html', 'Resources'], ['get-involved.html', 'Get involved'], ['contact.html', 'Contact']],
      takeSurvey: 'Take the survey',
      menu: 'Menu',
      footerSponsor: 'Funded by Contra Costa County through the West Contra Costa Community Impact Fund.',
      projectSite: 'Project website',
      staffSignIn: 'Staff and volunteer sign in',
      volunteerMode: 'Volunteer mode',
      signedInAs: 'Signed in as',
      mySurveys: 'My surveys',
      signOut: 'Sign out',
      volunteerSignIn: 'Volunteer? Sign in to record the surveys you collect',
      volunteerPending: 'Your volunteer account is waiting for an admin to approve it. Surveys you collect now are not credited to you yet.',
      mode: 'How is this survey being done?',
      modes: { self: 'Respondent filled it on my device', in_person: 'In person, volunteer helping', phone: 'By phone', paper: 'Typing in a paper form' },
      sectionOf: 'Section {n} of {t}',
      back: 'Back',
      next: 'Next',
      submit: 'Submit survey',
      sending: 'Sending…',
      required: 'Required',
      selectUpTo: 'Select up to {n}.',
      maxReached: 'You can choose up to {n}. Unselect one to choose another.',
      requiredError: 'Please answer this question to continue.',
      pleaseSpecify: 'Please specify',
      clear: 'Clear answer',
      people: 'people',
      less: 'Fewer',
      more: 'More',
      skipNote: 'You can skip any question that is not marked Required.',
      timeSpent: 'Time spent',
      timerPaused: 'Timer paused while you are away',
      aboutTotal: 'about 15 minutes in total',
      paused: 'paused',
      finishedIn: 'You finished the survey in about {n} minutes.',
      thanksTitle: 'Thank you!',
      thanksBody: 'Your answers have been saved. They will be used only in summary form to plan programs and services for the Nepali community.',
      declinedTitle: 'Thank you for your time',
      declinedBody: 'You chose not to take part, so no answers were saved.',
      offlineSaved: 'You are offline. Your answers are saved on this device and will be sent automatically when the internet is back.',
      demoSaved: 'Test mode: no server is connected yet, so this response is saved in this browser only.',
      helpTitle: 'If you need help now',
      help: ['Emergency: call 911', 'Mental health crisis: call or text 988', 'Community services and referrals: call 211'],
      newSurvey: 'Start another survey',
      exportLocal: 'Download test responses saved on this device ({n})',
      pending: '{n} survey(s) waiting to upload',
      consentTitle: 'Before you begin'
    },
    ne: {
      appTitle: 'सामुदायिक आवश्यकता सर्वेक्षण',
      org: 'नेपाली एसोसिएसन अफ नर्दर्न क्यालिफोर्निया',
      switchLang: 'English',
      welcome: 'पश्चिम कन्ट्रा कोस्टा काउन्टीमा बस्ने नेपाली समुदायका आवश्यकताहरू बुझ्न हामीलाई सहयोग गर्नुहोस्।',
      minutes: 'करिब १५ मिनेट · स्वैच्छिक · तपाईंका उत्तरहरू गोप्य राखिन्छन्',
      chooseLang: 'सुरु गर्न आफ्नो भाषा छान्नुहोस्',
      continueTitle: 'यस उपकरणमा तपाईंको अधुरो सर्वेक्षण छ।',
      continueBtn: 'छोडेको ठाउँबाट जारी राख्नुहोस्',
      discardBtn: 'नयाँ सुरु गर्नुहोस्',
      brandTitle: 'भाषिक समानता तथा पहुँच',
      nav: [['index.html', 'गृहपृष्ठ'], ['about.html', 'परियोजनाबारे'], ['activities.html', 'हाम्रा गतिविधि'], ['timeline.html', 'समयरेखा'],
        ['resources.html', 'स्रोत सामग्री'], ['get-involved.html', 'सहभागी हुनुहोस्'], ['contact.html', 'सम्पर्क']],
      takeSurvey: 'सर्वेक्षणमा भाग लिनुहोस्',
      menu: 'मेनु',
      footerSponsor: 'कन्ट्रा कोस्टा काउन्टीको पश्चिम कन्ट्रा कोस्टा सामुदायिक प्रभाव कोषमार्फत आर्थिक सहयोग।',
      projectSite: 'परियोजना वेबसाइट',
      staffSignIn: 'कर्मचारी तथा स्वयंसेवक साइन इन',
      volunteerMode: 'स्वयंसेवक मोड',
      signedInAs: 'साइन इन गर्ने',
      mySurveys: 'मेरा सर्वेक्षणहरू',
      signOut: 'साइन आउट',
      volunteerSignIn: 'स्वयंसेवक हुनुहुन्छ? आफूले सङ्कलन गरेका सर्वेक्षण रेकर्ड गर्न साइन इन गर्नुहोस्',
      volunteerPending: 'तपाईंको स्वयंसेवक खाता एडमिनको स्वीकृतिको पर्खाइमा छ। अहिले सङ्कलन गरेका सर्वेक्षण तपाईंको नाममा गनिँदैनन्।',
      mode: 'यो सर्वेक्षण कसरी भरिँदैछ?',
      modes: { self: 'उत्तरदाताले मेरो उपकरणमा आफैँ भर्नुभयो', in_person: 'प्रत्यक्ष भेटमा, स्वयंसेवकको सहयोगमा', phone: 'फोनबाट', paper: 'कागजी फारामबाट प्रविष्टि' },
      sectionOf: 'खण्ड {n} / {t}',
      back: 'पछाडि',
      next: 'अर्को',
      submit: 'सर्वेक्षण पेस गर्नुहोस्',
      sending: 'पठाउँदै…',
      required: 'अनिवार्य',
      selectUpTo: 'बढीमा {n} वटा छान्नुहोस्।',
      maxReached: 'तपाईं बढीमा {n} वटा छान्न सक्नुहुन्छ। अर्को छान्न एउटा हटाउनुहोस्।',
      requiredError: 'अगाडि बढ्न कृपया यो प्रश्नको उत्तर दिनुहोस्।',
      pleaseSpecify: 'कृपया उल्लेख गर्नुहोस्',
      clear: 'उत्तर हटाउनुहोस्',
      people: 'जना',
      less: 'घटाउनुहोस्',
      more: 'बढाउनुहोस्',
      skipNote: '"अनिवार्य" भनी उल्लेख नगरिएका प्रश्नहरू छोड्न सक्नुहुन्छ।',
      timeSpent: 'लागेको समय',
      timerPaused: 'तपाईं टाढा हुँदा समय रोकिएको छ',
      aboutTotal: 'जम्मा करिब १५ मिनेट',
      paused: 'रोकिएको',
      finishedIn: 'तपाईंले करिब {n} मिनेटमा सर्वेक्षण पूरा गर्नुभयो।',
      thanksTitle: 'धन्यवाद!',
      thanksBody: 'तपाईंका उत्तरहरू सुरक्षित गरिएका छन्। यिनीहरू नेपाली समुदायका लागि कार्यक्रम तथा सेवा योजना बनाउन समग्र सारांशका रूपमा मात्र प्रयोग गरिनेछन्।',
      declinedTitle: 'तपाईंको समयका लागि धन्यवाद',
      declinedBody: 'तपाईंले सहभागी नहुने छनोट गर्नुभयो, त्यसैले कुनै उत्तर सुरक्षित गरिएको छैन।',
      offlineSaved: 'तपाईं अफलाइन हुनुहुन्छ। तपाईंका उत्तरहरू यही उपकरणमा सुरक्षित छन् र इन्टरनेट फर्केपछि आफैँ पठाइनेछन्।',
      demoSaved: 'परीक्षण मोड: सर्भर अझै जोडिएको छैन, त्यसैले यो उत्तर यही ब्राउजरमा मात्र सुरक्षित छ।',
      helpTitle: 'तत्काल सहयोग चाहिएमा',
      help: ['आपत्कालीन अवस्था: ९११ मा फोन गर्नुहोस्', 'मानसिक स्वास्थ्य संकट: ९८८ मा फोन वा सन्देश पठाउनुहोस्', 'सामुदायिक सेवा र रेफरल: २११ मा फोन गर्नुहोस्'],
      newSurvey: 'अर्को सर्वेक्षण सुरु गर्नुहोस्',
      exportLocal: 'यस उपकरणमा सुरक्षित परीक्षण उत्तरहरू डाउनलोड गर्नुहोस् ({n})',
      pending: '{n} वटा सर्वेक्षण पठाउन बाँकी',
      consentTitle: 'सुरु गर्नुअघि'
    }
  };

  /* ------------------------------------------------------------ storage */
  function load(key, fallback) {
    try { var v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch (e) { return fallback; }
  }
  function store(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* storage unavailable */ }
  }
  function remove(key) {
    try { localStorage.removeItem(key); } catch (e) { /* ignore */ }
  }

  /* ------------------------------------------------------------ state */
  var volunteer = load(VOL_KEY, { mode: 'in_person' });
  if (!volunteer.mode) volunteer.mode = 'in_person';
  var VPROF_KEY = 'nanc_volunteer_profile_v1';
  var vprofile = load(VPROF_KEY, null);
  var SITE_LANG_KEY = 'nanc_site_lang';   // shared with the project website
  function siteLang() {
    var l = load(SITE_LANG_KEY, null);
    if (l === 'en' || l === 'ne') return l;
    try { l = localStorage.getItem(SITE_LANG_KEY); } catch (e) { l = null; }
    return l === 'ne' ? 'ne' : 'en';
  }
  function rememberLang(l) { try { localStorage.setItem(SITE_LANG_KEY, l); } catch (e) { /* ignore */ } }
  var state = freshState(siteLang());
  var draft = load(DRAFT_KEY, null);
  var statusMessage = '';

  function freshState(lang) {
    return { lang: lang, page: 'start', answers: {}, id: uuid(), startedAt: null, activeMs: 0, sectionMs: {} };
  }
  function saveDraft() {
    if (state.page === 'start' || state.page === 'thanks' || state.page === 'declined') return;
    store(DRAFT_KEY, state);
  }

  /* ------------------------------------------------------------ helpers */
  var QINDEX = {};
  SURVEY.consent.questions.forEach(function (q) { QINDEX[q.id] = q; });
  SURVEY.sections.forEach(function (s) { s.questions.forEach(function (q) { QINDEX[q.id] = q; }); });

  function uuid() {
    if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      var r = Math.random() * 16 | 0; return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
  }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function t(key) { return UI[state.lang][key]; }
  function tr(obj) { return obj ? (obj[state.lang] || obj.en) : ''; }
  function num(n) {
    if (state.lang !== 'ne') return String(n);
    return String(n).replace(/[0-9]/g, function (d) { return '०१२३४५६७८९'[d]; });
  }
  function fmt(s, vars) { return s.replace(/\{(\w+)\}/g, function (_, k) { return num(vars[k]); }); }
  function isVisible(q) {
    if (!q.showIf) return true;
    return q.showIf.in.indexOf(state.answers[q.showIf.q]) !== -1;
  }
  function sectionIndex() { return state.page.charAt(0) === 's' ? parseInt(state.page.slice(1), 10) : -1; }

  /* ------------------------------------------------------------ rendering */
  var app = document.getElementById('app');

  function render(keepScroll) {
    var y = window.scrollY;
    document.documentElement.lang = state.lang === 'ne' ? 'ne' : 'en';
    document.title = t('appTitle') + ' · NANC';
    var body;
    if (state.page === 'start') body = renderStart();
    else if (state.page === 'consent') body = renderConsent();
    else if (state.page === 'thanks') body = renderEnd(t('thanksTitle'), t('thanksBody'), true);
    else if (state.page === 'declined') body = renderEnd(t('declinedTitle'), t('declinedBody'), false);
    else body = renderSection(SURVEY.sections[sectionIndex()], sectionIndex());
    app.innerHTML = renderHeader() + '<main class="page" id="main">' + body + '</main>' + (timing() ? '' : renderFooter());
    window.scrollTo(0, keepScroll ? y : 0);
  }

  // Same header as the project website. Full menu on the start and end pages; while someone is answering,
  // a compact header (logo, timer, language) keeps them focused. Their draft is saved either way.
  function renderHeader() {
    var i = sectionIndex();
    var full = !timing();
    var progress = '';
    if (i >= 0) {
      var pct = Math.round(((i + 1) / SURVEY.sections.length) * 100);
      progress =
        '<div class="progress" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="' + pct + '">' +
        '<div class="progress-bar" style="width:' + pct + '%"></div></div>';
    }
    var nav = '';
    if (full) {
      nav = '<nav id="site-nav" class="site-nav" aria-label="Main"><ul>' + t('nav').map(function (n) {
        return '<li><a href="' + n[0] + '">' + esc(n[1]) + '</a></li>';
      }).join('') + '<li class="nav-cta"><a href="survey.html" class="btn-pill" aria-current="page">' + esc(t('takeSurvey')) + '</a></li></ul></nav>';
    }
    return '<header class="topbar">' +
      '<div class="topbar-inner">' +
      '<a class="brand" href="index.html"><img src="NANC_Logo.png" alt="" width="44" height="44">' +
      '<span class="brand-text"><strong>' + esc(t('brandTitle')) + '</strong><span>' + esc(t('appTitle')) + '</span></span></a>' +
      '<div class="bar-actions">' +
      (timing() ? '<span class="timer" id="timer-chip" role="timer" aria-label="' + esc(t('timeSpent')) + '" title="' + esc(t('timeSpent')) + '">' +
        '<span class="timer-icon" aria-hidden="true">⏱</span><span id="timer">' + fmtClock(state.activeMs || 0) + '</span></span>' : '') +
      '<button type="button" class="lang-btn" data-action="toggle-lang" lang="' + (state.lang === 'en' ? 'ne' : 'en') + '">' +
      esc(t('switchLang')) + '</button>' +
      (full ? '<button type="button" class="menu-toggle" data-action="toggle-menu" aria-expanded="false" aria-controls="site-nav">' +
        '<span aria-hidden="true">☰</span><span class="sr-only">' + esc(t('menu')) + '</span></button>' : '') +
      '</div></div>' + nav + progress + '</header>';
  }

  function renderFooter() {
    return '<footer class="site-footer"><div class="footer-inner">' +
      '<img src="NANC_Logo.png" alt="NANC logo" width="56" height="56">' +
      '<div><p>' + esc(t('footerSponsor')) + '</p>' +
      '<p class="footer-links"><a href="index.html">' + esc(t('projectSite')) + '</a> · <a href="contact.html">' + esc(t('nav')[6][1]) + '</a> · ' +
      '<a href="staff.html">' + esc(t('staffSignIn')) + '</a></p></div></div></footer>';
  }

  function renderStart() {
    var html = '<section class="hero">' +
      '<p class="eyebrow">' + esc(UI.en.org) + '<br><span lang="ne">' + esc(UI.ne.org) + '</span></p>' +
      '<h1>' + esc(UI.en.appTitle) + '<br><span lang="ne">' + esc(UI.ne.appTitle) + '</span></h1>' +
      '<p class="lead">' + esc(UI.en.welcome) + '</p>' +
      '<p class="lead" lang="ne">' + esc(UI.ne.welcome) + '</p>' +
      '<p class="meta">' + esc(UI.en.minutes) + '<br><span lang="ne">' + esc(UI.ne.minutes) + '</span></p></section>';

    if (draft && draft.page && draft.page !== 'start') {
      html += '<div class="card notice">' +
        '<p>' + esc(UI[draft.lang].continueTitle) + '</p>' +
        '<div class="btn-row"><button type="button" class="btn btn-primary" data-action="resume">' + esc(UI[draft.lang].continueBtn) + '</button>' +
        '<button type="button" class="btn btn-ghost" data-action="discard">' + esc(UI[draft.lang].discardBtn) + '</button></div></div>';
    }

    html += '<p class="choose">' + esc(UI.en.chooseLang) + ' · <span lang="ne">' + esc(UI.ne.chooseLang) + '</span></p>' +
      '<div class="lang-choices">' +
      '<button type="button" class="lang-choice" data-action="start" data-lang="ne" lang="ne"><span class="big">नेपाली</span><span>सर्वेक्षण सुरु गर्नुहोस्</span></button>' +
      '<button type="button" class="lang-choice" data-action="start" data-lang="en"><span class="big">English</span><span>Start the survey</span></button>' +
      '</div>';

    html += renderVolunteerBlock();

    var queue = load(QUEUE_KEY, []);
    if (queue.length) html += '<p class="small-note">' + esc(fmt(UI.en.pending, { n: queue.length })) + '</p>';
    var local = load(LOCAL_KEY, []);
    if (local.length) {
      html += '<p class="small-note"><button type="button" class="link-btn" data-action="export">' +
        esc(fmt(UI.en.exportLocal, { n: local.length })) + '</button></p>';
    }
    return html;
  }

  function timeLine() {
    return '<p class="time-line" id="time-line"><span aria-hidden="true">⏱</span> ' + esc(t('timeSpent')) + ' ' +
      '<strong data-timer>' + fmtClock(state.activeMs || 0) + '</strong>' +
      '<span class="time-paused"> (' + esc(t('paused')) + ')</span> · ' + esc(t('aboutTotal')) + '</p>';
  }

  /* Volunteer sign-in happens on the staff page; this page reads that login (same site, same browser). */
  function both(key) { return esc(UI.en[key]) + '<br><span lang="ne">' + esc(UI.ne[key]) + '</span>'; }
  function renderVolunteerBlock() {
    var session = getSession();
    if (isVolunteer()) {
      var modes = ['in_person', 'phone', 'paper', 'self'];
      var html = '<section class="card volunteer is-signed-in"><p class="vol-title"><strong>' + esc(UI.en.volunteerMode) + ' · <span lang="ne">' + esc(UI.ne.volunteerMode) + '</span></strong><br>' +
        esc(UI.en.signedInAs) + ': <strong>' + esc(vprofile.name) + '</strong></p>' +
        '<fieldset class="field"><legend>' + esc(UI.en.mode) + ' · <span lang="ne">' + esc(UI.ne.mode) + '</span></legend><div class="options">';
      modes.forEach(function (m) {
        var on = volunteer.mode === m;
        html += '<label class="opt' + (on ? ' is-checked' : '') + '"><input type="radio" name="vol-mode" data-vol="mode" value="' + m + '"' + (on ? ' checked' : '') + '>' +
          '<span class="opt-box" aria-hidden="true"></span><span class="opt-label">' + esc(UI.en.modes[m]) + ' · <span lang="ne">' + esc(UI.ne.modes[m]) + '</span></span></label>';
      });
      return html + '</div></fieldset><p class="vol-links"><a href="staff.html#/volunteer">' + esc(UI.en.mySurveys) + '</a> · ' +
        '<button type="button" class="link-btn" data-action="vol-signout">' + esc(UI.en.signOut) + '</button></p></section>';
    }
    if (session && vprofile && vprofile.id === session.user.id) {
      return '<section class="card volunteer"><p>' + both('volunteerPending') + '</p><p class="vol-links"><button type="button" class="link-btn" data-action="vol-signout">' +
        esc(UI.en.signOut) + '</button></p></section>';
    }
    return '<p class="small-note vol-signin"><a href="staff.html">' + both('volunteerSignIn') + '</a></p>';
  }

  function renderConsent() {
    var c = SURVEY.consent;
    var html = '<h1 class="section-title">' + esc(tr(c.title)) + '</h1>' + timeLine() + '<div class="card prose">';
    c.paragraphs.forEach(function (p) { html += '<p>' + esc(tr(p)) + '</p>'; });
    html += '</div>';
    c.questions.forEach(function (q) { html += renderQuestion(q); });
    html += renderNav(false, false);
    return html;
  }

  function renderSection(section, i) {
    var html = '<p class="step">' + esc(fmt(t('sectionOf'), { n: i + 1, t: SURVEY.sections.length })) + '</p>' +
      '<h1 class="section-title">' + esc(tr(section.title)) + '</h1>' + timeLine();
    if (section.intro) html += '<p class="section-intro">' + esc(tr(section.intro)) + '</p>';
    if (i === 0) html += '<p class="skip-note">' + esc(t('skipNote')) + '</p>';
    if (section.sensitive) html += renderHelpBox();
    section.questions.forEach(function (q) { html += renderQuestion(q); });
    html += renderNav(true, i === SURVEY.sections.length - 1);
    return html;
  }

  function renderNav(showBack, isLast) {
    return '<nav class="nav">' +
      (showBack ? '<button type="button" class="btn btn-ghost" data-action="back">‹ ' + esc(t('back')) + '</button>' : '<span></span>') +
      '<button type="button" class="btn btn-primary" data-action="' + (isLast ? 'submit' : 'next') + '">' +
      esc(isLast ? t('submit') : t('next')) + (isLast ? '' : ' ›') + '</button></nav>';
  }

  function renderHelpBox() {
    return '<aside class="help-box"><strong>' + esc(t('helpTitle')) + '</strong><ul>' +
      t('help').map(function (h) { return '<li>' + esc(h) + '</li>'; }).join('') + '</ul></aside>';
  }

  function renderEnd(title, bodyText, showStatus) {
    return '<section class="end card">' +
      '<div class="end-icon" aria-hidden="true">✓</div>' +
      '<h1>' + esc(title) + '</h1><p>' + esc(bodyText) + '</p>' +
      (showStatus && state.activeMs ? '<p class="duration">' + esc(fmt(t('finishedIn'), { n: Math.max(1, Math.round(state.activeMs / 60000)) })) + '</p>' : '') +
      (showStatus && statusMessage ? '<p class="status">' + esc(statusMessage) + '</p>' : '') +
      '</section>' + renderHelpBox() +
      '<div class="center"><button type="button" class="btn btn-primary" data-action="restart">' + esc(t('newSurvey')) + '</button></div>';
  }

  function renderQuestion(q) {
    var hidden = !isVisible(q);
    var hint = q.hint ? tr(q.hint) : '';
    if (q.max) hint = fmt(t('selectUpTo'), { n: q.max });
    var head =
      '<legend class="q-title"><span class="q-code">' + esc(q.id) + '</span>' +
      '<span class="q-text">' + esc(tr(q)) + '</span>' +
      (q.required ? '<span class="req">' + esc(t('required')) + '</span>' : '') + '</legend>' +
      (hint ? '<p class="q-hint">' + esc(hint) + '</p>' : '');
    var bodyHtml;
    if (q.type === 'text') bodyHtml = renderText(q);
    else if (q.type === 'single' || q.type === 'multi') bodyHtml = renderOptions(q);
    else if (q.type === 'matrix') bodyHtml = renderMatrix(q);
    else if (q.type === 'counts') bodyHtml = renderCounts(q);
    return '<fieldset class="q card" id="q-' + q.id + '" data-qcard="' + q.id + '"' + (hidden ? ' hidden' : '') + '>' +
      head + bodyHtml + '<p class="q-error" role="alert"></p></fieldset>';
  }

  function renderText(q) {
    return '<input class="text-input" type="text" id="in-' + q.id + '" data-text="' + q.id + '" autocomplete="off" aria-label="' +
      esc(tr(q)) + '" value="' + esc(state.answers[q.id] || '') + '">';
  }

  function renderOptions(q) {
    var type = q.type === 'single' ? 'radio' : 'checkbox';
    var value = state.answers[q.id];
    var html = '<div class="options">';
    q.options.forEach(function (opt) {
      var on = q.type === 'single' ? value === opt.v : (value || []).indexOf(opt.v) !== -1;
      var id = 'in-' + q.id + '-' + opt.v;
      html += '<label class="opt' + (on ? ' is-checked' : '') + '" for="' + id + '">' +
        '<input type="' + type + '" id="' + id + '" name="' + q.id + '" value="' + esc(opt.v) + '" data-q="' + q.id + '"' + (on ? ' checked' : '') + '>' +
        '<span class="opt-box" aria-hidden="true"></span><span class="opt-label">' + esc(tr(opt)) + '</span></label>';
      if (opt.other && on) html += otherInput(q.id + '_other');
    });
    html += '</div>';
    if (q.type === 'single' && value) {
      html += '<button type="button" class="link-btn clear" data-action="clear" data-q="' + q.id + '">' + esc(t('clear')) + '</button>';
    }
    return html;
  }

  function otherInput(key) {
    return '<input class="text-input other-input" type="text" id="in-' + key + '" data-text="' + key + '" placeholder="' +
      esc(t('pleaseSpecify')) + '" aria-label="' + esc(t('pleaseSpecify')) + '" value="' + esc(state.answers[key] || '') + '">';
  }

  function renderMatrix(q) {
    var value = state.answers[q.id] || {};
    var html = '<div class="matrix">';
    q.rows.forEach(function (row) {
      var labelId = 'lbl-' + q.id + '-' + row.v;
      html += '<div class="mrow" role="radiogroup" aria-labelledby="' + labelId + '">' +
        '<p class="mrow-label" id="' + labelId + '">' + esc(tr(row)) + '</p>';
      if (row.other) html += otherInput(q.id + '_other');
      html += '<div class="chips" style="--cols:' + q.cols.length + '">';
      q.cols.forEach(function (col) {
        var on = value[row.v] === col.v;
        var id = 'in-' + q.id + '-' + row.v + '-' + col.v;
        html += '<label class="chip' + (on ? ' is-checked' : '') + '" for="' + id + '">' +
          '<input type="radio" id="' + id + '" name="' + q.id + '__' + row.v + '" value="' + esc(col.v) + '" data-q="' + q.id + '" data-row="' + row.v + '"' + (on ? ' checked' : '') + '>' +
          '<span>' + esc(tr(col)) + '</span></label>';
      });
      html += '</div></div>';
    });
    return html + '</div>';
  }

  function renderCounts(q) {
    var value = state.answers[q.id] || {};
    var html = '<div class="counts">';
    q.rows.forEach(function (row) {
      var n = value[row.v] || 0;
      var id = 'in-' + q.id + '-' + row.v;
      html += '<div class="count-row"><label for="' + id + '">' + esc(tr(row)) + '</label>' +
        '<div class="stepper">' +
        '<button type="button" class="step-btn" data-action="step" data-q="' + q.id + '" data-row="' + row.v + '" data-delta="-1" aria-label="' + esc(t('less')) + '">−</button>' +
        '<input type="number" inputmode="numeric" min="0" max="30" id="' + id + '" data-count="' + q.id + '" data-row="' + row.v + '" value="' + n + '">' +
        '<button type="button" class="step-btn" data-action="step" data-q="' + q.id + '" data-row="' + row.v + '" data-delta="1" aria-label="' + esc(t('more')) + '">+</button>' +
        '<span class="unit">' + esc(t('people')) + '</span></div></div>';
    });
    return html + '</div>';
  }

  function rerenderQuestion(qid, focusId) {
    var el = document.getElementById('q-' + qid);
    if (!el) return;
    el.outerHTML = renderQuestion(QINDEX[qid]);
    if (focusId) {
      var f = document.getElementById(focusId);
      if (f) f.focus({ preventScroll: true });
    }
    refreshConditionals();
  }

  function refreshConditionals() {
    Object.keys(QINDEX).forEach(function (id) {
      var q = QINDEX[id];
      if (!q.showIf) return;
      var el = document.getElementById('q-' + id);
      if (el) el.hidden = !isVisible(q);
    });
  }

  function showError(qid, msg) {
    var el = document.querySelector('#q-' + qid + ' .q-error');
    if (el) el.textContent = msg || '';
  }

  /* ------------------------------------------------------------ events */
  app.addEventListener('change', function (e) {
    var input = e.target;
    if (input.dataset.vol === 'mode') {
      volunteer.mode = input.value; store(VOL_KEY, volunteer); render(true); return;
    }
    var qid = input.dataset.q;
    if (!qid) return;
    var q = QINDEX[qid];

    if (q.type === 'single') {
      state.answers[qid] = input.value;
    } else if (q.type === 'multi') {
      var arr = (state.answers[qid] || []).slice();
      var opt = q.options.filter(function (o) { return o.v === input.value; })[0];
      var exclusives = q.options.filter(function (o) { return o.exclusive; }).map(function (o) { return o.v; });
      if (input.checked) {
        if (opt.exclusive) arr = [opt.v];
        else {
          arr = arr.filter(function (v) { return exclusives.indexOf(v) === -1; });
          if (q.max && arr.length >= q.max) {
            input.checked = false;
            showError(qid, fmt(t('maxReached'), { n: q.max }));
            return;
          }
          arr.push(opt.v);
        }
      } else {
        arr = arr.filter(function (v) { return v !== opt.v; });
      }
      state.answers[qid] = arr;
    } else if (q.type === 'matrix') {
      var m = Object.assign({}, state.answers[qid] || {});
      m[input.dataset.row] = input.value;
      state.answers[qid] = m;
    }
    saveDraft();
    rerenderQuestion(qid, input.id);
  });

  app.addEventListener('input', function (e) {
    var el = e.target;
    if (el.dataset.text) { state.answers[el.dataset.text] = el.value; saveDraft(); return; }
    if (el.dataset.count) {
      var c = Object.assign({}, state.answers[el.dataset.count] || {});
      var n = parseInt(el.value, 10);
      c[el.dataset.row] = isNaN(n) || n < 0 ? 0 : Math.min(n, 30);
      state.answers[el.dataset.count] = c;
      saveDraft();
    }
  });

  app.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-action]');
    if (!btn) return;
    var action = btn.dataset.action;

    if (action === 'toggle-lang') { state.lang = state.lang === 'en' ? 'ne' : 'en'; rememberLang(state.lang); saveDraft(); render(true); }
    else if (action === 'toggle-menu') {
      var open = document.body.classList.toggle('nav-open');
      btn.setAttribute('aria-expanded', String(open));
    }
    else if (action === 'start') {
      state = freshState(btn.dataset.lang);
      rememberLang(btn.dataset.lang);
      state.page = 'consent';
      state.startedAt = new Date().toISOString();
      lastTick = lastInteraction = Date.now();
      remove(DRAFT_KEY); draft = null;
      saveDraft(); render();
    }
    else if (action === 'resume') { state = draft; state.activeMs = state.activeMs || 0; state.sectionMs = state.sectionMs || {}; draft = null; lastTick = lastInteraction = Date.now(); render(); }
    else if (action === 'discard') { remove(DRAFT_KEY); draft = null; render(); }
    else if (action === 'next') goNext();
    else if (action === 'back') {
      var i = sectionIndex();
      state.page = i <= 0 ? 'consent' : 's' + (i - 1);
      saveDraft(); render();
    }
    else if (action === 'submit') submit(btn);
    else if (action === 'clear') {
      delete state.answers[btn.dataset.q];
      delete state.answers[btn.dataset.q + '_other'];
      saveDraft(); rerenderQuestion(btn.dataset.q);
    }
    else if (action === 'step') {
      var qid = btn.dataset.q, row = btn.dataset.row;
      var c = Object.assign({}, state.answers[qid] || {});
      c[row] = Math.max(0, Math.min(30, (c[row] || 0) + parseInt(btn.dataset.delta, 10)));
      state.answers[qid] = c;
      saveDraft();
      var input = document.getElementById('in-' + qid + '-' + row);
      if (input) input.value = c[row];
    }
    else if (action === 'restart') { state = freshState(state.lang); statusMessage = ''; document.body.classList.remove('nav-open'); render(); }
    else if (action === 'export') exportLocal();
    else if (action === 'vol-signout') volunteerSignOut();
  });

  function goNext() {
    if (state.page === 'consent') {
      var c3 = state.answers.C3;
      if (!c3) {
        showError('C3', t('requiredError'));
        document.getElementById('q-C3').scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
      }
      if (c3 === 'no') {
        remove(DRAFT_KEY);
        state.answers = {};
        state.page = 'declined';
        render();
        return;
      }
      state.page = 's0';
    } else {
      state.page = 's' + (sectionIndex() + 1);
    }
    saveDraft(); render();
  }

  /* ------------------------------------------------------------ submission */
  function buildPayload() {
    var answers = {};
    var contact = {};
    Object.keys(state.answers).forEach(function (key) {
      var base = key.replace(/_other$/, '');
      var q = QINDEX[base];
      if (!q || !isVisible(q)) return;
      var val = state.answers[key];
      if (key !== base) {
        // keep "other" text only if the Other option/row is actually in use
        var main = state.answers[base];
        var used = q.type === 'matrix' ? main && main.other : (Array.isArray(main) ? main.indexOf('other') !== -1 : main === 'other');
        if (!used || !String(val).trim()) return;
      }
      if (q.contact) { if (String(val).trim()) contact[key] = String(val).trim(); return; }
      if (q.id === 'C3') return;
      answers[key] = val;
    });
    return {
      response: {
        id: state.id,
        survey_version: SURVEY.version,
        language: state.lang,
        mode: isVolunteer() ? volunteer.mode : 'self',
        volunteer_code: isVolunteer() ? vprofile.name : null,
        started_at: state.startedAt,
        submitted_at: new Date().toISOString(),
        duration_seconds: Math.round((state.activeMs || 0) / 1000),
        section_seconds: sectionSeconds(),
        answers: answers
      },
      contact: Object.keys(contact).length ? { response_id: state.id, first_name: contact.C1 || null, last_name: contact.C2 || null } : null,
      asVolunteer: isVolunteer()
    };
  }

  function backendConfigured() { return !!(CFG.supabaseUrl && CFG.supabaseAnonKey); }

  function postRow(table, row, token) {
    return fetch(CFG.supabaseUrl.replace(/\/$/, '') + '/rest/v1/' + table, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: CFG.supabaseAnonKey,
        Authorization: 'Bearer ' + (token || CFG.supabaseAnonKey),
        Prefer: 'return=minimal'
      },
      body: JSON.stringify(row)
    }).then(function (res) {
      // 409 = already uploaded (retry after a lost response); treat as success
      if (!res.ok && res.status !== 409) { var err = new Error(table + ' ' + res.status); err.status = res.status; throw err; }
    });
  }

  // Send one response. Assisted surveys go with the volunteer's login so the database stamps who collected them.
  // Nothing is ever dropped: if the login has expired or been removed, the survey is sent without it
  // (the volunteer's name is kept as text, marked unverified); if the database lacks newer columns, they are left out.
  function postResponse(row, token) {
    return postRow('responses', row, token).catch(function (err) {
      if (token && (err.status === 401 || err.status === 403)) return postResponse(row, null);
      if (err.status === 400 && 'duration_seconds' in row) {
        var legacy = Object.assign({}, row);
        delete legacy.duration_seconds;
        delete legacy.section_seconds;
        return postResponse(legacy, token);
      }
      throw err;
    });
  }

  function send(payload) {
    return (payload.asVolunteer ? freshToken() : Promise.resolve(null)).then(function (token) {
      return postResponse(payload.response, token);
    }).then(function () {
      return payload.contact ? postRow('contacts', payload.contact) : null;
    });
  }

  /* ------------------------------------------------------------ volunteer login (shared with staff.html) */
  function apiBase() { return CFG.supabaseUrl.replace(/\/$/, ''); }
  function authKey() {
    try { return 'sb-' + new URL(CFG.supabaseUrl).hostname.split('.')[0] + '-auth-token'; } catch (e) { return null; }
  }
  function getSession() {
    if (!backendConfigured()) return null;
    var sess = load(authKey(), null);
    return sess && sess.refresh_token && sess.user ? sess : null;
  }
  function isVolunteer() {
    var sess = getSession();
    return !!(sess && vprofile && vprofile.id === sess.user.id && vprofile.role && vprofile.active);
  }
  // Resolves to a valid access token, or null if the person is signed out. Rejects only when offline.
  function freshToken() {
    var sess = getSession();
    if (!sess) return Promise.resolve(null);
    if (sess.expires_at && sess.expires_at * 1000 - Date.now() > 60000) return Promise.resolve(sess.access_token);
    return fetch(apiBase() + '/auth/v1/token?grant_type=refresh_token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', apikey: CFG.supabaseAnonKey },
      body: JSON.stringify({ refresh_token: sess.refresh_token })
    }).then(function (res) {
      if (res.status === 400 || res.status === 401 || res.status === 403) return null;
      if (!res.ok) throw new Error('auth ' + res.status);
      return res.json().then(function (d) {
        var next = Object.assign({}, sess, d);
        next.expires_at = Math.floor(Date.now() / 1000) + (d.expires_in || 3600);
        store(authKey(), next);
        return next.access_token;
      });
    });
  }
  function loadVolunteerProfile() {
    var sess = getSession();
    if (!sess) { vprofile = null; remove(VPROF_KEY); return; }
    if (!navigator.onLine) return;   // keep the saved profile for offline field work
    freshToken().then(function (token) {
      if (!token) { vprofile = null; remove(VPROF_KEY); return null; }
      return fetch(apiBase() + '/rest/v1/profiles?select=id,full_name,email,role,active&id=eq.' + encodeURIComponent(sess.user.id), {
        headers: { apikey: CFG.supabaseAnonKey, Authorization: 'Bearer ' + token }
      }).then(function (res) { return res.ok ? res.json() : []; }).then(function (rows) {
        var p = rows[0];
        vprofile = p ? { id: p.id, name: p.full_name || p.email, role: p.role, active: p.active } : null;
        if (vprofile) store(VPROF_KEY, vprofile); else remove(VPROF_KEY);
      });
    }).catch(function () { /* offline: keep what we have */ }).then(function () {
      if (state.page === 'start') render(true);
    });
  }
  function volunteerSignOut() {
    var sess = getSession();
    if (sess && navigator.onLine) {
      fetch(apiBase() + '/auth/v1/logout', { method: 'POST', headers: { apikey: CFG.supabaseAnonKey, Authorization: 'Bearer ' + sess.access_token } })
        .catch(function () {});
    }
    remove(authKey());
    remove(VPROF_KEY);
    vprofile = null;
    render(true);
  }

  function submit(btn) {
    btn.disabled = true;
    btn.textContent = t('sending');
    var payload = buildPayload();
    var done = function (msg) {
      statusMessage = msg;
      remove(DRAFT_KEY);
      state.page = 'thanks';
      render();
    };
    if (!backendConfigured()) {
      var local = load(LOCAL_KEY, []);
      local.push(payload);
      store(LOCAL_KEY, local);
      done(t('demoSaved'));
      return;
    }
    send(payload).then(function () { done(''); }).catch(function () {
      var q = load(QUEUE_KEY, []);
      q.push(payload);
      store(QUEUE_KEY, q);
      done(t('offlineSaved'));
    });
  }

  function flushQueue() {
    if (!backendConfigured() || !navigator.onLine) return;
    var q = load(QUEUE_KEY, []);
    if (!q.length) return;
    var remaining = [];
    q.reduce(function (p, item) {
      return p.then(function () { return send(item).catch(function () { remaining.push(item); }); });
    }, Promise.resolve()).then(function () {
      store(QUEUE_KEY, remaining);
      if (state.page === 'start') render(true);
    });
  }

  function exportLocal() {
    var data = load(LOCAL_KEY, []);
    var blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'nanc-survey-test-responses.json';
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  /* ------------------------------------------------------------ timer (active time only) */
  // Counts only while the survey page is on screen and someone has touched it in the last 5 minutes,
  // so a phone left on a table or a survey resumed next day does not inflate the time.
  var IDLE_LIMIT = 5 * 60 * 1000;
  var lastTick = Date.now();
  var lastInteraction = Date.now();
  var tickCount = 0;

  function timing() { return state.page === 'consent' || sectionIndex() >= 0; }
  function sectionKey() { return state.page === 'consent' ? 'consent' : SURVEY.sections[sectionIndex()].id; }
  function fmtClock(ms) {
    var total = Math.floor(ms / 1000);
    return num(Math.floor(total / 60)) + ':' + num(('0' + (total % 60)).slice(-2));
  }
  function sectionSeconds() {
    var out = {};
    Object.keys(state.sectionMs || {}).forEach(function (k) { out[k] = Math.round(state.sectionMs[k] / 1000); });
    return out;
  }
  function tick() {
    var now = Date.now();
    var delta = Math.min(now - lastTick, 5000);
    lastTick = now;
    var paused = document.visibilityState !== 'visible' || now - lastInteraction > IDLE_LIMIT;
    if (timing() && !paused) {
      state.activeMs = (state.activeMs || 0) + delta;
      state.sectionMs = state.sectionMs || {};
      var k = sectionKey();
      state.sectionMs[k] = (state.sectionMs[k] || 0) + delta;
      if (++tickCount % 5 === 0) saveDraft();
    }
    var clock = fmtClock(state.activeMs || 0);
    var shown = document.querySelectorAll('#timer, [data-timer]');
    for (var i = 0; i < shown.length; i++) shown[i].textContent = clock;
    var chip = document.getElementById('timer-chip');
    if (chip) {
      chip.classList.toggle('is-paused', paused);
      chip.title = paused ? t('timerPaused') : t('timeSpent');
    }
    var line = document.getElementById('time-line');
    if (line) line.classList.toggle('is-paused', paused);
  }
  ['pointerdown', 'keydown', 'input', 'scroll', 'touchstart'].forEach(function (ev) {
    document.addEventListener(ev, function () { lastInteraction = Date.now(); }, { passive: true, capture: true });
  });
  document.addEventListener('visibilitychange', function () {
    lastTick = Date.now();
    if (document.visibilityState === 'hidden') saveDraft();
  });
  setInterval(tick, 1000);

  window.addEventListener('online', flushQueue);

  if ('serviceWorker' in navigator && location.protocol !== 'file:') {
    navigator.serviceWorker.register('sw.js').catch(function () { /* offline cache is optional */ });
  }

  render();
  loadVolunteerProfile();
  flushQueue();
})();
