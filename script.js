
  import { initializeApp as _0x811a } from "https://www.gstatic.com/firebasejs/10.5.2/firebase-app.js";
  import { 
    getFirestore as _0x272b, collection as _0x26bf, getDocs as _0x3b6b, query as _0x3156, orderBy as _0x2ee4, enableIndexedDbPersistence as _0x2f60 
  } from "https://www.gstatic.com/firebasejs/10.5.2/firebase-firestore.js";

  const _0x5f8b = [
    "AIzaSyBfoxEnVep0wX5V_KVS-cd8o5sUMvrFY4c",
    "primeintelmedia-e2fe3.firebaseapp.com",
    "https://primeintelmedia-e2fe3-default-rtdb.firebaseio.com",
    "primeintelmedia-e2fe3",
    "primeintelmedia-e2fe3.firebasestorage.app",
    "228866357632",
    "1:228866357632:web:72dc9942f1cd41d857a965",
    "G-G0HRRV932S",
    "boon_cached_posts",
    "boon_cached_authors",
    'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="900" height="400" viewBox="0 0 900 400"><rect width="100%" height="100%" fill="%23f1f5f9"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%2394a3b8" font-size="20">Media Asset Unavailable</text></svg>',
    "Editorial",
    "searchForm",
    "searchInput",
    "searchSuggestions",
    "sidebarSearchForm",
    "sidebarSearchInput",
    "bannerSearchForm",
    "bannerSearchInput",
    "authors",
    "newsPosts",
    "createdAt",
    "desc",
    "heroLeftContainer",
    "heroRightContainer",
    "trendingContainer",
    "editorsChoiceContainer",
    "videoContainer",
    "recentBandContainer",
    "recentStoriesContainer",
    "categoryFilter",
    "ALL"
  ];

  const _0x16b0 = {
    apiKey: _0x5f8b[0],
    authDomain: _0x5f8b[1],
    databaseURL: _0x5f8b[2],
    projectId: _0x5f8b[3],
    storageBucket: _0x5f8b[4],
    messagingSenderId: _0x5f8b[5],
    appId: _0x5f8b[6],
    measurementId: _0x5f8b[7]
  };

  const _0x1c3a = { POSTS: _0x5f8b[8], AUTHORS: _0x5f8b[9] };
  const _0x28ed = _0x811a(_0x16b0);
  const _0x272bInstance = _0x272b(_0x28ed);

  _0x2f60(_0x272bInstance).catch((_0x12a0) => {});

  const _0x3b5f = _0x5f8b[10];
  let _0x4d1c = [];
  let _0x460c = new Map();

  function _0x27c1(_0x1b93) {
    if (!_0x1b93 || !_0x1b93[_0x5f8b[21]]) return 0;
    if (typeof _0x1b93[_0x5f8b[21]] === "number") return _0x1b93[_0x5f8b[21]];
    if (typeof _0x1b93[_0x5f8b[21]].toMillis === "function") return _0x1b93[_0x5f8b[21]].toMillis();
    if (_0x1b93[_0x5f8b[21]].seconds) return _0x1b93[_0x5f8b[21]].seconds * 1000;
    return new Date(_0x1b93[_0x5f8b[21]]).getTime() || 0;
  }

  function _0x3df7(_0x1b93) {
    return Number(_0x1b93.views || _0x1b93.viewCount || 0);
  }

  function _0x128b(_0x1b93) {
    const _0x59ee = _0x27c1(_0x1b93);
    if (!_0x59ee) return "";
    return new Date(_0x59ee).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  }

  function _0x4f4f(_0x1b93) {
    const _0x5a31 = _0x1b93.authorId || _0x1b93.author || _0x1b93.authorRef;
    if (_0x5a31 && _0x460c.has(_0x5a31)) return _0x460c.get(_0x5a31);
    if (typeof _0x1b93.author === "string" && _0x1b93.author.length > 0 && !_0x460c.has(_0x1b93.author)) return _0x1b93.author;
    return _0x5f8b[11];
  }

  window.navigateToArticle = (_0x5028) => { window.location.href = `reader.html?id=${_0x5028}`; };

  function _0x4852() {
    const _0x21d2 = document.getElementById(_0x5f8b[12]),
          _0x1d36 = document.getElementById(_0x5f8b[13]),
          _0x450b = document.getElementById(_0x5f8b[14]),
          _0x4d51 = document.getElementById(_0x5f8b[15]),
          _0x2aeb = document.getElementById(_0x5f8b[16]),
          _0x55dc = document.getElementById(_0x5f8b[17]),
          _0x5c42 = document.getElementById(_0x5f8b[18]);

    const _0x3c2a = (_0x1a8f) => { if (_0x1a8f) window.location.href = `searched.html?q=${encodeURIComponent(_0x1a8f)}`; };

    if (_0x21d2 && _0x1d36) {
      _0x21d2.addEventListener("submit", (_0x30eb) => { _0x30eb.preventDefault(); _0x3c2a(_0x1d36.value.trim()); });
      _0x1d36.addEventListener("input", (_0x30eb) => {
        const _0x1a8f = _0x30eb.target.value.toLowerCase().trim();
        if (!_0x1a8f || !_0x450b) { if (_0x450b) { _0x450b.style.display = "none"; _0x450b.innerHTML = ""; } return; }
        const _0x298d = _0x4d1c.filter(_0x2d1f => {
          return (_0x2d1f.title || "").toLowerCase().includes(_0x1a8f) ||
                 (_0x2d1f.category || "").toLowerCase().includes(_0x1a8f) ||
                 (_0x2d1f.summary || "").toLowerCase().includes(_0x1a8f) ||
                 _0x4f4f(_0x2d1f).toLowerCase().includes(_0x1a8f);
        }).slice(0, 5);
        if (_0x298d.length === 0) {
          _0x450b.innerHTML = `<div style="padding: 0.75rem; color: #64748b; font-size: 0.8rem;">No matches found. Press Enter to search.</div>`;
        } else {
          _0x450b.innerHTML = _0x298d.map(_0x2d1f => `
            <div class="suggestion-item" onclick="navigateToArticle('${_0x2d1f.id}')">
              <img class="suggestion-thumb" src="${_0x2d1f.imageUrl || _0x3b5f}" onerror="this.onerror=null; this.src=_0x3b5f;" alt="${_0x2d1f.title}">
              <div style="overflow: hidden;">
                <div style="font-weight: 700; color: #0f172a; font-size: 0.8rem; text-overflow: ellipsis; overflow: hidden; white-space: nowrap;">${_0x2d1f.title}</div>
                <span class="text-accent" style="font-size: 0.65rem; text-transform: uppercase; font-weight: 700;">${_0x2d1f.category || 'News'}</span>
              </div>
            </div>`).join('');
        }
        _0x450b.style.display = "block";
      });
      document.addEventListener("click", (_0x30eb) => {
        if (_0x450b && !_0x21d2.contains(_0x30eb.target) && !_0x450b.contains(_0x30eb.target)) _0x450b.style.display = "none";
      });
    }
    if (_0x55dc && _0x5c42) _0x55dc.addEventListener("submit", (_0x30eb) => { _0x30eb.preventDefault(); _0x3c2a(_0x5c42.value.trim()); });
    if (_0x4d51 && _0x2aeb) _0x4d51.addEventListener("submit", (_0x30eb) => { _0x30eb.preventDefault(); _0x3c2a(_0x2aeb.value.trim()); });
  }

  function _0x1c8b() {
    try {
      const _0x5cdd = localStorage.getItem(_0x1c3a.AUTHORS), _0x2a8e = localStorage.getItem(_0x1c3a.POSTS);
      if (_0x5cdd) _0x460c = new Map(Object.entries(JSON.parse(_0x5cdd)));
      if (_0x2a8e) { _0x4d1c = JSON.parse(_0x2a8e); _0x4f0e(); _0x13df(); _0x4852(); }
    } catch (_0x30eb) {}
  }

  async function _0x2e00() {
    _0x1c8b();
    try {
      const _0x413a = await _0x3b6b(_0x26bf(_0x272bInstance, _0x5f8b[19]));
      _0x460c.clear();
      const _0x1ce1 = {};
      _0x413a.forEach(_0x4463 => {
        const _0x1a21 = _0x4463.data();
        const _0x53ff = _0x1a21.name || _0x1a21.displayName || _0x1a21.fullName || _0x5f8b[11];
        _0x460c.set(_0x4463.id, _0x53ff);
        _0x1ce1[_0x4463.id] = _0x53ff;
      });

      const _0x300c = _0x3156(_0x26bf(_0x272bInstance, _0x5f8b[20]), _0x2ee4(_0x5f8b[21], _0x5f8b[22]));
      const _0x2213 = await _0x3b6b(_0x300c);
      const _0x17c0 = [];
      _0x2213.forEach((_0x4463) => {
        const _0x1a21 = _0x4463.data();
        _0x17c0.push({ id: _0x4463.id, ..._0x1a21, createdAt: _0x27c1({ createdAt: _0x1a21.createdAt }) });
      });

      _0x17c0.sort((_0x1d3f, _0x213b) => _0x27c1(_0x213b) - _0x27c1(_0x1d3f));
      _0x4d1c = _0x17c0;

      _0x4f0e(); _0x13df(); _0x4852();
      localStorage.setItem(_0x1c3a.AUTHORS, JSON.stringify(_0x1ce1));
      localStorage.setItem(_0x1c3a.POSTS, JSON.stringify(_0x17c0));
    } catch (_0x30eb) {}
  }

  function _0x4f0e() {
    _0x5e08(); _0x3bc1(); _0x46d2(); _0x5c72(); _0x5b3f(); _0x5bf4();
  }

  function _0x5e08() {
    const _0x49ca = document.getElementById(_0x5f8b[23]), _0x140e = document.getElementById(_0x5f8b[24]);
    if (!_0x49ca || !_0x140e) return;
    const _0x2370 = _0x4d1c.filter(_0x2d1f => _0x2d1f.isFeatured).sort((_0x1d3f, _0x213b) => _0x27c1(_0x213b) - _0x27c1(_0x1d3f));
    const _0x34ee = _0x2370.length > 0 ? _0x2370 : _0x4d1c;
    if (_0x34ee.length === 0) {
      _0x49ca.innerHTML = `<img src="${_0x3b5f}" alt="Default Banner" class="hero-left-bg img-cover"><div class="hero-left-overlay"></div><div class="hero-content-box"><div class="meta-text"><span class="text-accent">Welcome</span></div><h1 class="hero-title">Welcome to BoonNews</h1></div>`;
      _0x140e.innerHTML = `<ul style="display: flex; flex-direction: column; gap: 1.5rem;"><li style="color: #64748b;">No posts available.</li></ul>`;
      return;
    }
    const _0x2cd5 = _0x34ee[0], _0x1c92 = _0x128b(_0x2cd5), _0x296f = _0x4f4f(_0x2cd5);
    _0x49ca.setAttribute('onclick', `navigateToArticle('${_0x2cd5.id}')`);
    _0x49ca.innerHTML = `<div class="hero-left-img-wrapper"><img src="${_0x2cd5.imageUrl || _0x3b5f}" onerror="this.onerror=null; this.src=_0x3b5f;" alt="${_0x2cd5.title}" class="hero-left-bg"></div><div class="hero-left-body"><div class="hero-left-meta"><span class="text-accent">${_0x2cd5.category || 'Featured'}</span><span>•</span><span class="author-name">By ${_0x296f}</span>${_0x1c92 ? `<span>•</span><span>${_0x1c92}</span>` : ''}</div><h2 class="hero-left-title"><a href="reader.html?id=${_0x2cd5.id}" style="color: #222;" onclick="event.stopPropagation();">${_0x2cd5.title}</a></h2></div>`;

    const _0x5d90 = _0x34ee.slice(1, 3);
    if (_0x5d90.length === 0) {
      _0x140e.innerHTML = `<ul style="display: flex; flex-direction: column; gap: 1.5rem;"><li style="color: #64748b; font-size: 0.85rem;">Check back soon for more top stories!</li></ul>`;
      return;
    }
    _0x140e.innerHTML = `<ul style="display: flex; flex-direction: column; gap: 1.5rem;">${_0x5d90.map((_0x2d1f, _0x3e17) => `<li class="side-post" onclick="navigateToArticle('${_0x2d1f.id}')"><div class="side-img-frame"><img src="${_0x2d1f.imageUrl || _0x3b5f}" onerror="this.onerror=null; this.src=_0x3b5f;" alt="${_0x2d1f.title}" class="img-cover"></div><div><span class="text-accent side-post-tag">${_0x2d1f.category || 'News'}</span><h2><a href="reader.html?id=${_0x2d1f.id}" class="post-title-link" onclick="event.stopPropagation();">${_0x2d1f.title}</a></h2></div></li>${_0x3e17 < _0x5d90.length - 1 ? '<li class="wavy-divider"></li>' : ''}`).join('')}</ul>`;
  }

  function _0x3bc1() {
    const _0x1c7e = document.getElementById(_0x5f8b[25]); if (!_0x1c7e) return;
    const _0x2774 = [..._0x4d1c].sort((_0x1d3f, _0x213b) => _0x3df7(_0x213b) - _0x3df7(_0x1d3f)).slice(0, 8);
    if (_0x2774.length === 0) { _0x1c7e.innerHTML = `<li style="color: #64748b; padding: 2rem 0;">No trending posts available.</li>`; return; }
    _0x1c7e.innerHTML = _0x2774.map(_0x2d1f => `<li class="slider-card" onclick="navigateToArticle('${_0x2d1f.id}')"><div class="card-img-wrapper"><span class="bolt-badge"><i class="fa-solid fa-bolt"></i></span><img src="${_0x2d1f.imageUrl || _0x3b5f}" onerror="this.onerror=null; this.src=_0x3b5f;" alt="${_0x2d1f.title}" class="img-cover"></div><div class="card-body"><div class="card-meta"><span class="text-accent">${_0x2d1f.category || 'Trending'}</span><span>•</span><span>By ${_0x4f4f(_0x2d1f)}</span></div><h3 class="card-title"><a href="reader.html?id=${_0x2d1f.id}" class="post-title-link" onclick="event.stopPropagation();">${_0x2d1f.title}</a></h3><div class="card-stats"><span><i class="fa-solid fa-chart-simple"></i> ${_0x3df7(_0x2d1f)}</span><span><i class="fa-regular fa-clock"></i> ${_0x2d1f.minutesRead || 1}m read</span></div></div></li>`).join('');
  }

  function _0x46d2() {
    const _0x1c7e = document.getElementById(_0x5f8b[26]); if (!_0x1c7e) return;
    const _0x2668 = _0x4d1c.filter(_0x2d1f => _0x2d1f.postType === 'editor-choice').sort((_0x1d3f, _0x213b) => _0x27c1(_0x213b) - _0x27c1(_0x1d3f));
    if (_0x2668.length === 0) { _0x1c7e.innerHTML = `<li style="color: #64748b; padding: 1rem 0;">No Editor's Choice stories assigned yet.</li>`; return; }
    _0x1c7e.innerHTML = _0x2668.map((_0x2d1f, _0x1ebd) => `<li class="editor-item" onclick="navigateToArticle('${_0x2d1f.id}')"><div class="num-circle"><img src="${_0x2d1f.imageUrl || _0x3b5f}" onerror="this.onerror=null; this.src=_0x3b5f;" alt="${_0x2d1f.title}"><span>0${_0x1ebd + 1}</span></div><div class="item-details"><div class="card-meta"><span class="text-accent">${_0x2d1f.category || 'Choice'}</span><span>•</span><span>By ${_0x4f4f(_0x2d1f)}</span></div><h4><a href="reader.html?id=${_0x2d1f.id}" class="post-title-link" onclick="event.stopPropagation();">${_0x2d1f.title}</a></h4></div></li>`).join('');
  }

  function _0x5c72() {
    const _0x1c7e = document.getElementById(_0x5f8b[27]); if (!_0x1c7e) return;
    const _0x2668 = _0x4d1c.filter(_0x2d1f => _0x2d1f.postType === 'video').sort((_0x1d3f, _0x213b) => _0x27c1(_0x213b) - _0x27c1(_0x1d3f));
    if (_0x2668.length === 0) { _0x1c7e.innerHTML = `<div style="color: #64748b; padding: 1rem 0; width: 100%;">No video posts active.</div>`; return; }
    const _0x1b43 = _0x2668[0], _0x39c5 = _0x2668.slice(1, 3);
    const _0x43d3 = `<div class="video-large-featured" onclick="navigateToArticle('${_0x1b43.id}')"><div class="video-player-container"><img src="${_0x1b43.imageUrl || _0x3b5f}" onerror="this.onerror=null; this.src=_0x3b5f;" alt="${_0x1b43.title}" class="video-bg"><div class="play-btn-circle"><i class="fa-solid fa-play"></i></div></div><div class="meta-text" style="margin-top: 1.25rem;"><span class="text-accent">${_0x1b43.category || 'Video'}</span><span class="author-date" style="color: #64748b;">•</span><span class="author-date" style="color: #64748b;">By ${_0x4f4f(_0x1b43)}</span></div><h2><a href="reader.html?id=${_0x1b43.id}" class="post-title-link" onclick="event.stopPropagation();">${_0x1b43.title}</a></h2></div>`;
    const _0x5109 = _0x39c5.length > 0 ? `<ul class="video-sidebar-list">${_0x39c5.map((_0x32cf, _0x1ebd) => `<li class="video-row-item" onclick="navigateToArticle('${_0x32cf.id}')"><div class="video-mini-thumb"><img src="${_0x32cf.imageUrl || _0x3b5f}" onerror="this.onerror=null; this.src=_0x3b5f;" alt="${_0x32cf.title}"><div class="mini-play-btn"><i class="fa-solid fa-play"></i></div></div><div><div class="card-meta"><span class="text-accent">${_0x32cf.category || 'Video'}</span><span>•</span><span>By ${_0x4f4f(_0x32cf)}</span></div><h3><a href="reader.html?id=${_0x32cf.id}" class="post-title-link" onclick="event.stopPropagation();">${_0x32cf.title}</a></h3></div></li>${_0x1ebd < _0x39c5.length - 1 ? '<li class="wavy-divider"></li>' : ''}`).join('')}</ul>` : `<div style="color: #64748b; font-size: 0.85rem; padding: 1rem;">More videos coming soon!</div>`;
    _0x1c7e.innerHTML = _0x43d3 + _0x5109;
  }

  function _0x5b3f() {
    const _0x1c7e = document.getElementById(_0x5f8b[28]); if (!_0x1c7e) return;
    const _0x10d1 = [..._0x4d1c].sort((_0x1d3f, _0x213b) => _0x27c1(_0x213b) - _0x27c1(_0x1d3f));
    if (_0x10d1.length === 0) { _0x1c7e.innerHTML = `<div style="color: #64748b; padding: 2rem 0;">No recent posts found.</div>`; return; }
    const _0x24d4 = _0x10d1.slice(0, 2), _0x21f5 = _0x10d1.slice(2, 6);
    const _0x515d = `<ul class="stories-top-split">${_0x24d4.map(_0x2d1f => `<li class="story-large-card" onclick="navigateToArticle('${_0x2d1f.id}')"><div class="story-banner-frame"><img src="${_0x2d1f.imageUrl || _0x3b5f}" onerror="this.onerror=null; this.src=_0x3b5f;" alt="${_0x2d1f.title}" class="img-cover"></div><div class="meta-text"><span class="text-accent" style="font-size:12px;padding:8px;">${_0x2d1f.category || 'Recent'}</span><span class="author-date" style="color: #64748b;">•</span><span class="author-date" style="color: #64748b;font-size:12px;padding:8px;">By ${_0x4f4f(_0x2d1f)}</span>${_0x128b(_0x2d1f) ? `<span class="author-date" style="color: #64748b;">• </span><span class="author-date" style="color: #64748b;font-size:12px;">${_0x128b(_0x2d1f)}</span>` : ''}</div><h2><a href="reader.html?id=${_0x2d1f.id}" class="post-title-link" onclick="event.stopPropagation();">${_0x2d1f.title}</a></h2></li>`).join('')}</ul>`;
    const _0x3013 = _0x21f5.length > 0 ? `<ul class="stories-bottom-grid">${_0x21f5.map(_0x2d1f => `<li class="story-mini-card" onclick="navigateToArticle('${_0x2d1f.id}')"><div class="story-thumb-frame"><img src="${_0x2d1f.imageUrl || _0x3b5f}" onerror="this.onerror=null; this.src=_0x3b5f;" alt="${_0x2d1f.title}" class="img-cover"></div><div class="card-meta"><span class="text-accent">${_0x2d1f.category || 'Recent'}</span><span>•</span><span>By ${_0x4f4f(_0x2d1f)}</span></div><h3><a href="reader.html?id=${_0x2d1f.id}" class="post-title-link" onclick="event.stopPropagation();">${_0x2d1f.title}</a></h3></li>`).join('')}</ul>` : '';
    _0x1c7e.innerHTML = _0x515d + _0x3013;
  }

  function _0x5bf4(_0x3861 = _0x5f8b[31]) {
    const _0x1c7e = document.getElementById(_0x5f8b[29]); if (!_0x1c7e) return;
    let _0x2668 = _0x4d1c.filter(_0x2d1f => _0x2d1f.postType === 'standard' || !_0x2d1f.postType);
    if (_0x3861 !== _0x5f8b[31]) _0x2668 = _0x2668.filter(_0x2d1f => _0x2d1f.category === _0x3861);
    _0x2668.sort((_0x1d3f, _0x213b) => _0x27c1(_0x213b) - _0x27c1(_0x1d3f));
    if (_0x2668.length === 0) { _0x1c7e.innerHTML = `<div style="color: #64748b; padding: 2rem 0;">No stories found in this section.</div>`; return; }
    const _0x24d4 = _0x2668.slice(0, 2), _0x21f5 = _0x2668.slice(2, 6);
    const _0x515d = `<ul class="stories-top-split">${_0x24d4.map(_0x2d1f => `<li class="story-large-card" onclick="navigateToArticle('${_0x2d1f.id}')"><div class="story-banner-frame"><img src="${_0x2d1f.imageUrl || _0x3b5f}" onerror="this.onerror=null; this.src=_0x3b5f;" alt="${_0x2d1f.title}" class="img-cover"></div><div class="meta-text"><span class="text-accent" style="font-size:12px;padding:8px;">${_0x2d1f.category || 'Story'}</span><span class="author-date" style="color: #64748b;">•</span><span class="author-date" style="color: #64748b;font-size:12px;padding:8px;">By ${_0x4f4f(_0x2d1f)}</span>${_0x128b(_0x2d1f) ? `<span class="author-date" style="color: #64748b;">• </span><span class="author-date" style="color: #64748b;font-size:12px;">${_0x128b(_0x2d1f)}</span>` : ''}</div><h2><a href="reader.html?id=${_0x2d1f.id}" class="post-title-link" onclick="event.stopPropagation();">${_0x2d1f.title}</a></h2></li>`).join('')}</ul>`;
    const _0x3013 = _0x21f5.length > 0 ? `<ul class="stories-bottom-grid">${_0x21f5.map(_0x2d1f => `<li class="story-mini-card" onclick="navigateToArticle('${_0x2d1f.id}')"><div class="story-thumb-frame"><img src="${_0x2d1f.imageUrl || _0x3b5f}" onerror="this.onerror=null; this.src=_0x3b5f;" alt="${_0x2d1f.title}" class="img-cover"></div><div class="card-meta"><span class="text-accent">${_0x2d1f.category || 'Story'}</span><span>•</span><span>By ${_0x4f4f(_0x2d1f)}</span></div><h3><a href="reader.html?id=${_0x2d1f.id}" class="post-title-link" onclick="event.stopPropagation();">${_0x2d1f.title}</a></h3></li>`).join('')}</ul>` : '';
    _0x1c7e.innerHTML = _0x515d + _0x3013;
  }

  function _0x13df() {
    const _0x1247 = document.getElementById(_0x5f8b[30]); if (!_0x1247) return;
    const _0x3841 = [...new Set(_0x4d1c.map(_0x2d1f => _0x2d1f.category).filter(Boolean))];
    _0x1247.innerHTML = `<option value="ALL">All Categories</option>` + _0x3841.map(_0x5990 => `<option value="${_0x5990}">${_0x5990}</option>`).join('');
    _0x1247.addEventListener("change", (_0x30eb) => _0x5bf4(_0x30eb.target.value));
  }

  _0x2e00();
