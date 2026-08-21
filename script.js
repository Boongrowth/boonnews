 import { initializeApp } from "https://www.gstatic.com/firebasejs/10.5.2/firebase-app.js";
      import { 
        getFirestore, collection, getDocs, query, orderBy, doc, getDoc 
      } from "https://www.gstatic.com/firebasejs/10.5.2/firebase-firestore.js";
      import { 
        getAuth, onAuthStateChanged, signOut 
      } from "https://www.gstatic.com/firebasejs/10.5.2/firebase-auth.js";

      const firebaseConfig = {
        apiKey: "AIzaSyBfoxEnVep0wX5V_KVS-cd8o5sUMvrFY4c",
  authDomain: "primeintelmedia-e2fe3.firebaseapp.com",
  databaseURL: "https://primeintelmedia-e2fe3-default-rtdb.firebaseio.com",
  projectId: "primeintelmedia-e2fe3",
  storageBucket: "primeintelmedia-e2fe3.firebasestorage.app",
  messagingSenderId: "228866357632",
  appId: "1:228866357632:web:72dc9942f1cd41d857a965",
  measurementId: "G-G0HRRV932S"
};

      const app = initializeApp(firebaseConfig);
      const db = getFirestore(app);
      const auth = getAuth(app);

      const FALLBACK_IMG = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="900" height="400" viewBox="0 0 900 400"><rect width="100%" height="100%" fill="%23f1f5f9"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%2394a3b8" font-size="20">Media Asset Unavailable</text></svg>';

      let allPosts = [];

      // 0. AUTHENTICATION & POINT BALANCE SIDEBAR RENDERER
      function setupAuthSidebarListener() {
        const sidebarAuthContainer = document.getElementById("sidebarAuthContainer");
        if (!sidebarAuthContainer) return;

        onAuthStateChanged(auth, async (user) => {
          if (user) {
            let points = 0;
            let displayName = user.displayName || user.email.split('@')[0] || "Member";

            try {
              const userRef = doc(db, "users", user.uid);
              const userSnap = await getDoc(userRef);
              if (userSnap.exists()) {
                const data = userSnap.data();
                points = data.points || data.pointBalance || 0;
                if (data.name || data.displayName) {
                  displayName = data.name || data.displayName;
                }
              }
            } catch (err) {
              console.warn("Could not retrieve user points:", err);
            }

            const initial = displayName.charAt(0).toUpperCase();

            sidebarAuthContainer.innerHTML = `
              <div class="sidebar-auth-card">
                <div class="auth-card-left">
                  <div class="user-avatar-circle">${initial}</div>
                  <div class="user-info-text">
                    <span class="user-name-label">${displayName}</span>
                    <span class="user-points-badge"><i class="fa-solid fa-coins"></i> ${points} Pts</span>
                  </div>
                </div>
                <button class="logout-btn-icon" id="sidebarLogoutBtn" title="Log Out">
                  <i class="fa-solid fa-right-from-bracket"></i>
                </button>
              </div>
            `;

            document.getElementById("sidebarLogoutBtn")?.addEventListener("click", () => {
              signOut(auth).then(() => window.location.reload());
            });

          } else {
            sidebarAuthContainer.innerHTML = `
              <a href="login.html" class="sidebar-login-btn">
                <i class="fa-solid fa-right-to-bracket"></i>
                <span>Sign In / Login</span>
              </a>
            `;
          }
        });
      }

      function getPostTime(post) {
        if (!post.createdAt) return 0;
        if (typeof post.createdAt.toMillis === 'function') {
          return post.createdAt.toMillis();
        }
        if (post.createdAt.seconds) {
          return post.createdAt.seconds * 1000;
        }
        return new Date(post.createdAt).getTime() || 0;
      }

      function getPostViews(post) {
        return Number(post.views || post.viewCount || 0);
      }

      function formatDate(post) {
        const rawTime = getPostTime(post);
        if (!rawTime) return '';
        return new Date(rawTime).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric'
        });
      }

      window.navigateToArticle = (id) => {
        window.location.href = `reader.html?id=${id}`;
      };

      // SEARCH FUNCTIONALITY (HEADER, SIDEBAR & POST-HEADER BANNER)
      function setupSearch() {
        const searchForm = document.getElementById("searchForm");
        const searchInput = document.getElementById("searchInput");
        const searchSuggestions = document.getElementById("searchSuggestions");
        const sidebarSearchForm = document.getElementById("sidebarSearchForm");
        const sidebarSearchInput = document.getElementById("sidebarSearchInput");
        const bannerSearchForm = document.getElementById("bannerSearchForm");
        const bannerSearchInput = document.getElementById("bannerSearchInput");

        const executeSearch = (term) => {
            if (term) {
                window.location.href = `searched.html?q=${encodeURIComponent(term)}`;
            }
        };

        if (searchForm && searchInput) {
            searchForm.addEventListener("submit", (e) => {
              e.preventDefault();
              executeSearch(searchInput.value.trim());
            });

            searchInput.addEventListener("input", (e) => {
              const term = e.target.value.toLowerCase().trim();
              if (!term || !searchSuggestions) {
                if (searchSuggestions) {
                    searchSuggestions.style.display = "none";
                    searchSuggestions.innerHTML = "";
                }
                return;
              }

              const matches = allPosts.filter(post => {
                const title = (post.title || "").toLowerCase();
                const category = (post.category || "").toLowerCase();
                const summary = (post.summary || "").toLowerCase();
                return title.includes(term) || category.includes(term) || summary.includes(term);
              }).slice(0, 5);

              if (matches.length === 0) {
                searchSuggestions.innerHTML = `<div style="padding: 0.75rem; color: #64748b; font-size: 0.8rem;">No matches found. Press Enter to search.</div>`;
              } else {
                searchSuggestions.innerHTML = matches.map(post => `
                  <div class="suggestion-item" onclick="navigateToArticle('${post.id}')">
                    <img class="suggestion-thumb" src="${post.imageUrl || FALLBACK_IMG}" onerror="this.onerror=null; this.src=FALLBACK_IMG;" alt="${post.title}">
                    <div style="overflow: hidden;">
                      <div style="font-weight: 700; color: #0f172a; font-size: 0.8rem; text-overflow: ellipsis; overflow: hidden; white-space: nowrap;">${post.title}</div>
                      <span class="text-accent" style="font-size: 0.65rem; text-transform: uppercase; font-weight: 700;">${post.category || 'News'}</span>
                    </div>
                  </div>
                `).join('');
              }
              searchSuggestions.style.display = "block";
            });

            document.addEventListener("click", (e) => {
              if (searchSuggestions && !searchForm.contains(e.target) && !searchSuggestions.contains(e.target)) {
                searchSuggestions.style.display = "none";
              }
            });
        }

        if (bannerSearchForm && bannerSearchInput) {
            bannerSearchForm.addEventListener("submit", (e) => {
                e.preventDefault();
                executeSearch(bannerSearchInput.value.trim());
            });
        }

        if (sidebarSearchForm && sidebarSearchInput) {
            sidebarSearchForm.addEventListener("submit", (e) => {
                e.preventDefault();
                executeSearch(sidebarSearchInput.value.trim());
            });
        }
      }

      async function fetchNewsPosts() {
        try {
          const q = query(collection(db, "newsPosts"), orderBy("createdAt", "desc"));
          const querySnapshot = await getDocs(q);

          allPosts = [];
          querySnapshot.forEach((docSnap) => {
            allPosts.push({ id: docSnap.id, ...docSnap.data() });
          });

          allPosts.sort((a, b) => getPostTime(b) - getPostTime(a));

          renderPage();
          populateCategoryFilter();
          setupSearch();

        } catch (err) {
          console.error("Firestore read error:", err);
        }
      }

      function renderPage() {
        renderHeroSection();
        renderTrending();
        renderEditorsChoice();
        renderVideoFeed();
        renderRecentSlider();
        renderRecentStories();
      }

      // 1. HERO SECTION RENDERER
      function renderHeroSection() {
        const heroLeft = document.getElementById("heroLeftContainer");
        const heroRight = document.getElementById("heroRightContainer");

        if (!heroLeft || !heroRight) return;

        const featuredPosts = allPosts
          .filter(p => p.isFeatured)
          .sort((a, b) => getPostTime(b) - getPostTime(a));

        const displayPosts = featuredPosts.length > 0 ? featuredPosts : allPosts;

        if (displayPosts.length === 0) {
          heroLeft.innerHTML = `
            <img src="${FALLBACK_IMG}" alt="Default Banner" class="hero-left-bg img-cover">
            <div class="hero-left-overlay"></div>
            <div class="hero-content-box">
              <div class="meta-text"><span class="text-accent">Welcome</span></div>
              <h1 class="hero-title">Welcome to BoonNews</h1>
            </div>`;
          heroRight.innerHTML = `<ul style="display: flex; flex-direction: column; gap: 1.5rem;"><li style="color: #64748b;">No posts available.</li></ul>`;
          return;
        }

        const mainPost = displayPosts[0];
        const postDate = formatDate(mainPost);
        const author = mainPost.author || 'Editorial';

        heroLeft.setAttribute('onclick', `navigateToArticle('${mainPost.id}')`);
        heroLeft.innerHTML = `
          <img src="${mainPost.imageUrl || FALLBACK_IMG}" onerror="this.onerror=null; this.src=FALLBACK_IMG;" alt="${mainPost.title}" class="hero-left-bg img-cover">
          <div class="hero-left-overlay"></div>
          <div class="hero-content-box">
            <div class="meta-text">
              <span class="text-accent">${mainPost.category || 'Technology'}</span>
              <span class="author-date">•</span>
              <span class="author-date">By ${author}</span>
              ${postDate ? `<span class="author-date">•</span><span class="author-date">${postDate}</span>` : ''}
            </div>
            <h1 class="hero-title">
              <a href="reader.html?id=${mainPost.id}" style="color: #fff;" onclick="event.stopPropagation();">${mainPost.title}</a>
            </h1>
          </div>
        `;

        const rightPosts = displayPosts.slice(1, 3);

        if (rightPosts.length === 0) {
          heroRight.innerHTML = `<ul style="display: flex; flex-direction: column; gap: 1.5rem;"><li style="color: #64748b; font-size: 0.85rem;">Check back soon for more top stories!</li></ul>`;
          return;
        }

        heroRight.innerHTML = `
          <ul style="display: flex; flex-direction: column; gap: 1.5rem;">
            ${rightPosts.map((post, idx) => `
              <li class="side-post" onclick="navigateToArticle('${post.id}')">
                <div class="side-img-frame">
                  <img src="${post.imageUrl || FALLBACK_IMG}" onerror="this.onerror=null; this.src=FALLBACK_IMG;" alt="${post.title}" class="img-cover">
                </div>
                <div>
                  <span class="text-accent side-post-tag">${post.category || 'News'}</span>
                  <h2>
                    <a href="reader.html?id=${post.id}" class="post-title-link" onclick="event.stopPropagation();">${post.title}</a>
                  </h2>
                </div>
              </li>
              ${idx < rightPosts.length - 1 ? '<li class="wavy-divider"></li>' : ''}
            `).join('')}
          </ul>
        `;
      }

      // 2. TRENDING SECTION SLIDER
      function renderTrending() {
        const container = document.getElementById("trendingContainer");
        if (!container) return;

        const trendingPosts = [...allPosts]
          .sort((a, b) => getPostViews(b) - getPostViews(a))
          .slice(0, 8);

        if (trendingPosts.length === 0) {
          container.innerHTML = `<li style="color: #64748b; padding: 2rem 0;">No trending posts available.</li>`;
          return;
        }

        container.innerHTML = trendingPosts.map(post => `
          <li class="slider-card" onclick="navigateToArticle('${post.id}')">
            <div class="card-img-wrapper">
              <span class="bolt-badge"><i class="fa-solid fa-bolt"></i></span>
              <img src="${post.imageUrl || FALLBACK_IMG}" onerror="this.onerror=null; this.src=FALLBACK_IMG;" alt="${post.title}" class="img-cover">
            </div>
            <div class="card-body">
              <div class="card-meta">
                <span class="text-accent">${post.category || 'Trending'}</span>
                <span>•</span>
                <span>By ${post.author || 'Editorial'}</span>
              </div>
              <h3 class="card-title">
                <a href="articleviewmi.html?id=${post.id}" class="post-title-link" onclick="event.stopPropagation();">${post.title}</a>
              </h3>
              <div class="card-stats">
                <span><i class="fa-solid fa-chart-simple"></i> ${getPostViews(post)}</span>
                <span><i class="fa-regular fa-clock"></i> ${post.minutesRead || 1}m read</span>
              </div>
            </div>
          </li>
        `).join('');
      }

      // 3. EDITOR'S CHOICE SECTION
      function renderEditorsChoice() {
        const container = document.getElementById("editorsChoiceContainer");
        if (!container) return;

        const items = allPosts
          .filter(p => p.postType === 'editor-choice')
          .sort((a, b) => getPostTime(b) - getPostTime(a));

        if (items.length === 0) {
          container.innerHTML = `<li style="color: #64748b; padding: 1rem 0;">No Editor's Choice stories assigned yet.</li>`;
          return;
        }

        container.innerHTML = items.map((post, index) => `
          <li class="editor-item" onclick="navigateToArticle('${post.id}')">
            <div class="num-circle">
              <img src="${post.imageUrl || FALLBACK_IMG}" onerror="this.onerror=null; this.src=FALLBACK_IMG;" alt="${post.title}">
              <span>0${index + 1}</span>
            </div>
            <div class="item-details">
              <div class="card-meta">
                <span class="text-accent">${post.category || 'Choice'}</span>
                <span>•</span>
                <span>By ${post.author || 'Editorial'}</span>
              </div>
              <h4>
                <a href="reader.html?id=${post.id}" class="post-title-link" onclick="event.stopPropagation();">${post.title}</a>
              </h4>
            </div>
          </li>
        `).join('');
      }

      // 4. VIDEO FEED
      function renderVideoFeed() {
        const container = document.getElementById("videoContainer");
        if (!container) return;

        const items = allPosts
          .filter(p => p.postType === 'video')
          .sort((a, b) => getPostTime(b) - getPostTime(a));

        if (items.length === 0) {
          container.innerHTML = `<div style="color: #64748b; padding: 1rem 0; width: 100%;">No video posts active.</div>`;
          return;
        }

        const featuredVideo = items[0];
        const sidebarVideos = items.slice(1, 3);

        const featuredHtml = `
          <div class="video-large-featured" onclick="navigateToArticle('${featuredVideo.id}')">
            <div class="video-player-container">
              <img src="${featuredVideo.imageUrl || FALLBACK_IMG}" onerror="this.onerror=null; this.src=FALLBACK_IMG;" alt="${featuredVideo.title}" class="video-bg">
              <div class="play-btn-circle"><i class="fa-solid fa-play"></i></div>
            </div>
            <div class="meta-text" style="margin-top: 1.25rem;">
              <span class="text-accent">${featuredVideo.category || 'Video'}</span>
              <span class="author-date" style="color: #64748b;">•</span>
              <span class="author-date" style="color: #64748b;">By ${featuredVideo.author || 'Editorial'}</span>
            </div>
            <h2>
              <a href="reader.html?id=${featuredVideo.id}" class="post-title-link" onclick="event.stopPropagation();">${featuredVideo.title}</a>
            </h2>
          </div>
        `;

        const sidebarHtml = sidebarVideos.length > 0 ? `
          <ul class="video-sidebar-list">
            ${sidebarVideos.map((video, idx) => `
              <li class="video-row-item" onclick="navigateToArticle('${video.id}')">
                <div class="video-mini-thumb">
                  <img src="${video.imageUrl || FALLBACK_IMG}" onerror="this.onerror=null; this.src=FALLBACK_IMG;" alt="${video.title}">
                  <div class="mini-play-btn"><i class="fa-solid fa-play"></i></div>
                </div>
                <div>
                  <div class="card-meta">
                    <span class="text-accent">${video.category || 'Video'}</span>
                    <span>•</span>
                    <span>By ${video.author || 'Editorial'}</span>
                  </div>
                  <h3>
                    <a href="reader.html?id=${video.id}" class="post-title-link" onclick="event.stopPropagation();">${video.title}</a>
                  </h3>
                </div>
              </li>
              ${idx < sidebarVideos.length - 1 ? '<li class="wavy-divider"></li>' : ''}
            `).join('')}
          </ul>
        ` : `<div style="color: #64748b; font-size: 0.85rem; padding: 1rem;">More videos coming soon!</div>`;

        container.innerHTML = featuredHtml + sidebarHtml;
      }

      // 5. RECENT POSTS SLIDER (LIGHT BAND)
      function renderRecentSlider() {
        const container = document.getElementById("sliderContainer2");
        if (!container) return;

        const recentPosts = [...allPosts]
          .sort((a, b) => getPostTime(b) - getPostTime(a))
          .slice(0, 8);

        if (recentPosts.length === 0) {
          container.innerHTML = `<li style="color: #64748b; padding: 2rem 0;">No recent posts found.</li>`;
          return;
        }

        container.innerHTML = recentPosts.map(post => `
          <li class="slider-card" style="background-color: #ffffff;" onclick="navigateToArticle('${post.id}')">
            <div class="card-img-wrapper">
              <span class="bolt-badge"><i class="fa-solid fa-bolt"></i></span>
              <img src="${post.imageUrl || FALLBACK_IMG}" onerror="this.onerror=null; this.src=FALLBACK_IMG;" alt="${post.title}" class="img-cover">
            </div>
            <div class="card-body">
              <div class="card-meta">
                <span class="text-accent">${post.category || 'General'}</span>
                <span>•</span>
                <span>By ${post.author || 'Editorial'}</span>
              </div>
              <h3 class="card-title">
                <a href="reader.html?id=${post.id}" class="post-title-link" onclick="event.stopPropagation();">${post.title}</a>
              </h3>
            </div>
          </li>
        `).join('');
      }

      // 6. POPULAR STORIES FEED
      function renderRecentStories(selectedCategory = 'ALL') {
        const container = document.getElementById("recentStoriesContainer");
        if (!container) return;

        let items = allPosts.filter(p => p.postType === 'standard' || !p.postType);

        if (selectedCategory !== 'ALL') {
          items = items.filter(p => p.category === selectedCategory);
        }

        items.sort((a, b) => getPostTime(b) - getPostTime(a));

        if (items.length === 0) {
          container.innerHTML = `<div style="color: #64748b; padding: 2rem 0;">No stories found in this section.</div>`;
          return;
        }

        const topPosts = items.slice(0, 2);
        const bottomPosts = items.slice(2, 6);

        const topSplitHtml = `
          <ul class="stories-top-split">
            ${topPosts.map(post => `
              <li class="story-large-card" onclick="navigateToArticle('${post.id}')">
                <div class="story-banner-frame">
                  <img src="${post.imageUrl || FALLBACK_IMG}" onerror="this.onerror=null; this.src=FALLBACK_IMG;" alt="${post.title}" class="img-cover">
                </div>
                <div class="meta-text">
                  <span class="text-accent">${post.category || 'Story'}</span>
                  <span class="author-date" style="color: #64748b;">•</span>
                  <span class="author-date" style="color: #64748b;">By ${post.author || 'Editorial'}</span>
                  ${formatDate(post) ? `<span class="author-date" style="color: #64748b;">•</span><span class="author-date" style="color: #64748b;">${formatDate(post)}</span>` : ''}
                </div>
                <h2>
                  <a href="reader.html?id=${post.id}" class="post-title-link" onclick="event.stopPropagation();">${post.title}</a>
                </h2>
              </li>
            `).join('')}
          </ul>
        `;

        const bottomGridHtml = bottomPosts.length > 0 ? `
          <ul class="stories-bottom-grid">
            ${bottomPosts.map(post => `
              <li class="story-mini-card" onclick="navigateToArticle('${post.id}')">
                <div class="story-thumb-frame">
                  <img src="${post.imageUrl || FALLBACK_IMG}" onerror="this.onerror=null; this.src=FALLBACK_IMG;" alt="${post.title}" class="img-cover">
                </div>
                <div class="card-meta">
                  <span class="text-accent">${post.category || 'Story'}</span>
                  <span>•</span>
                  <span>By ${post.author || 'Editorial'}</span>
                </div>
                <h3>
                  <a href="reader.html?id=${post.id}" class="post-title-link" onclick="event.stopPropagation();">${post.title}</a>
                </h3>
              </li>
            `).join('')}
          </ul>
        ` : '';

        container.innerHTML = topSplitHtml + bottomGridHtml;
      }

      function populateCategoryFilter() {
        const filter = document.getElementById("categoryFilter");
        if (!filter) return;

        const categories = [...new Set(allPosts.map(p => p.category).filter(Boolean))];
        
        filter.innerHTML = `<option value="ALL">All Categories</option>` + 
          categories.map(c => `<option value="${c}">${c}</option>`).join('');

        filter.addEventListener("change", (e) => renderRecentStories(e.target.value));
      }

      // Initialize Authentication and News Feed
      setupAuthSidebarListener();
      fetchNewsPosts();
    
