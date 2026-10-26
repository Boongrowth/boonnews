
      import { initializeApp } from "https://www.gstatic.com/firebasejs/10.5.2/firebase-app.js";
      import { 
        getFirestore, doc, getDoc, collection, getDocs, query, orderBy, limit, updateDoc, increment, addDoc, serverTimestamp, where, initializeFirestore, persistentLocalCache, persistentMultipleTabManager 
      } from "https://www.gstatic.com/firebasejs/10.5.2/firebase-firestore.js";

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
      
      let db;
      try {
        db = initializeFirestore(app, {
          localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() })
        });
      } catch (e) {
        db = getFirestore(app);
      }

      const CACHE_KEY_POSTS = "boon_news_posts_cache";
      const FALLBACK_IMG = 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=1200&auto=format&fit=crop&q=80';
      const FALLBACK_AVATAR = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80';

      let currentArticle = null;
      let allPosts = [];

      // Extract Slug or ID from clean path (/article/slug-or-id) or fallback query (?slug=... or ?id=...)
      function getArticleSlugOrId() {
          const pathParts = window.location.pathname.split('/').filter(Boolean);
          if (pathParts[0] === 'article' && pathParts[1]) {
              return decodeURIComponent(pathParts[1]);
          }
          const urlParams = new URLSearchParams(window.location.search);
          return urlParams.get('slug') || urlParams.get('id');
      }

      const articleSlugOrId = getArticleSlugOrId();

      // Canonical Shareable URL Helper (Clean URL format)
      function getShareableUrl() {
          if (!currentArticle) return window.location.href;
          const identifier = currentArticle.slug || currentArticle.id;
          return `https://boonnewsng.blog/article/${identifier}`;
      }

      // Sidebar Controls
      const sidebar = document.getElementById('sidebarNav');
      const sidebarOverlay = document.getElementById('sidebarOverlay');
      const sidebarToggleBtn = document.getElementById('sidebarToggleBtn');
      const sidebarCloseBtn = document.getElementById('sidebarCloseBtn');

      function openSidebar() {
          sidebar.classList.add('active');
          sidebarOverlay.classList.add('active');
      }

      function closeSidebar() {
          sidebar.classList.remove('active');
          sidebarOverlay.classList.remove('active');
      }

      if (sidebarToggleBtn) sidebarToggleBtn.addEventListener('click', openSidebar);
      if (sidebarCloseBtn) sidebarCloseBtn.addEventListener('click', closeSidebar);
      if (sidebarOverlay) sidebarOverlay.addEventListener('click', closeSidebar);

      // Search Drawer Toggle
      const searchToggleBtn = document.getElementById('searchToggleBtn');
      const searchDrawer = document.getElementById('searchDrawer');

      if (searchToggleBtn && searchDrawer) {
          searchToggleBtn.addEventListener('click', () => {
              searchDrawer.classList.toggle('active');
              if (searchDrawer.classList.contains('active')) {
                  document.getElementById('searchInput').focus();
              }
          });
      }

      // Dark / Light Theme Engine
      const themeToggleBtn = document.getElementById('themeToggle');
      const themeIcon = document.getElementById('themeIcon');

      function setTheme(theme) {
          document.documentElement.setAttribute('data-theme', theme);
          localStorage.setItem('boon_theme', theme);
          if (themeIcon) {
              themeIcon.className = theme === 'dark' ? 'fa-solid fa-sun' : 'fa-solid fa-moon';
          }
      }

      const savedTheme = localStorage.getItem('boon_theme') || 'light';
      setTheme(savedTheme);

      if (themeToggleBtn) {
          themeToggleBtn.addEventListener('click', () => {
              const currentTheme = document.documentElement.getAttribute('data-theme');
              setTheme(currentTheme === 'dark' ? 'light' : 'dark');
          });
      }

      window.navigateToArticle = (slugOrId) => {
        window.location.href = `/article/${slugOrId}`;
      };

      function calculateReadTime(text) {
          if (!text) return 3;
          const words = text.replace(/<[^>]*>/g, '').split(/\s+/).length;
          return Math.max(1, Math.ceil(words / 200));
      }

      window.addEventListener('scroll', () => {
          const winScroll = document.documentElement.scrollTop || document.body.scrollTop;
          const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
          const scrolled = (winScroll / height) * 100;
          
          const progressBar = document.getElementById("readingProgressBar");
          if (progressBar) progressBar.style.width = scrolled + "%";

          const backToTop = document.getElementById("backToTop");
          if (backToTop) backToTop.style.display = winScroll > 300 ? "flex" : "none";
      });

      let currentFontSizeRem = 1.05;
      window.adjustFontSize = (direction) => {
          currentFontSizeRem += direction * 0.05;
          currentFontSizeRem = Math.min(Math.max(currentFontSizeRem, 0.9), 1.35);
          const bodyEl = document.getElementById("articleBody");
          if (bodyEl) bodyEl.style.fontSize = currentFontSizeRem + "rem";
      };

      window.toggleAudioReader = () => {
        if (!('speechSynthesis' in window)) return;
        const icon = document.getElementById('audioIcon');
        if (speechSynthesis.speaking) {
            speechSynthesis.cancel();
            if (icon) icon.className = "fa-solid fa-volume-high";
        } else {
            const bodyText = document.getElementById("articleBody").innerText;
            const titleText = document.getElementById("articleTitle").innerText;
            const utterance = new SpeechSynthesisUtterance(`${titleText}. ${bodyText}`);
            utterance.onend = () => { if (icon) icon.className = "fa-solid fa-volume-high"; };
            speechSynthesis.speak(utterance);
            if (icon) icon.className = "fa-solid fa-pause";
        }
      };

      function setupSearch() {
        const searchForm = document.getElementById("searchForm");
        const searchInput = document.getElementById("searchInput");
        const searchSuggestions = document.getElementById("searchSuggestions");

        const executeSearch = (term) => {
            if (term) window.location.href = `/search?q=${encodeURIComponent(term)}`;
        };

        if (searchForm) searchForm.addEventListener("submit", (e) => { e.preventDefault(); executeSearch(searchInput.value.trim()); });

        const handleSearchInput = (val, container) => {
            const term = val.toLowerCase().trim();
            if (!term) {
                container.style.display = "none";
                container.innerHTML = "";
                return;
            }
            const matches = allPosts.filter(post => {
                return (post.title || "").toLowerCase().includes(term) || (post.category || "").toLowerCase().includes(term);
            }).slice(0, 5);

            if (matches.length === 0) {
                container.innerHTML = `<div style="padding: 0.75rem; color: #64748b; font-size: 0.8rem;">No matches found.</div>`;
            } else {
                container.innerHTML = matches.map(post => `
                  <div class="suggestion-item" onclick="navigateToArticle('${post.slug || post.id}')">
                    <img class="suggestion-thumb" src="${post.imageUrl || FALLBACK_IMG}" loading="lazy" onerror="this.onerror=null; this.src='${FALLBACK_IMG}';" alt="${post.title}">
                    <div style="overflow: hidden;">
                      <div style="font-weight: 700; font-size: 0.8rem; text-overflow: ellipsis; overflow: hidden; white-space: nowrap;">${post.title}</div>
                      <span class="text-accent" style="font-size: 0.65rem; text-transform: uppercase;">${post.category || 'News'}</span>
                    </div>
                  </div>
                `).join('');
            }
            container.style.display = "block";
        };

        if (searchInput) searchInput.addEventListener("input", (e) => handleSearchInput(e.target.value, searchSuggestions));

        document.addEventListener("click", (e) => {
            if (searchSuggestions && searchForm && !searchForm.contains(e.target)) {
                searchSuggestions.style.display = "none";
            }
        });
      }

      function updateSEO(post, authorName) {
        const title = post.title || "Untitled Article";
        const excerpt = post.excerpt || title;
        const imgUrl = post.imageUrl || FALLBACK_IMG;
        const canonicalUrl = getShareableUrl();

        document.title = `${title} | Boon News`;

        const setMetaText = (id, val) => {
            const el = document.getElementById(id);
            if (el) el.innerText = val;
        };

        const setMetaAttr = (id, attr, val) => {
            const el = document.getElementById(id);
            if (el) el.setAttribute(attr, val);
        };

        setMetaText("metaTitle", `${title} | Boon News`);
        setMetaAttr("metaDesc", "content", excerpt);
        setMetaAttr("metaCanonical", "href", canonicalUrl);

        setMetaAttr("ogTitle", "content", title);
        setMetaAttr("ogDesc", "content", excerpt);
        setMetaAttr("ogImage", "content", imgUrl);
        setMetaAttr("ogUrl", "content", canonicalUrl);

        setMetaAttr("twTitle", "content", title);
        setMetaAttr("twDesc", "content", excerpt);
        setMetaAttr("twImage", "content", imgUrl);
        setMetaAttr("twUrl", "content", canonicalUrl);

        const publishedDateStr = post.createdAt ? (post.createdAt.seconds ? new Date(post.createdAt.seconds * 1000).toISOString() : new Date(post.createdAt).toISOString()) : new Date().toISOString();
        const schemaScript = document.getElementById("articleSchema");
        if (schemaScript) {
            schemaScript.textContent = JSON.stringify({
                "@context": "https://schema.org",
                "@type": "NewsArticle",
                "headline": title,
                "image": [imgUrl],
                "datePublished": publishedDateStr,
                "author": [{
                    "@type": "Person",
                    "name": authorName || "Boon News Desk"
                }],
                "publisher": {
                    "@type": "Organization",
                    "name": "Boon News",
                    "logo": {
                        "@type": "ImageObject",
                        "url": "https://boonnewsng.blog/boon-news-og-banner.jpg"
                    }
                }
            });
        }
      }

      async function fetchAuthorDetails(authorRefId) {
          if (!authorRefId) return { name: "Boon News Desk", avatar: FALLBACK_AVATAR };
          try {
              const authorDocRef = doc(db, "authors", authorRefId);
              const authorSnap = await getDoc(authorDocRef);
              if (authorSnap.exists()) {
                  const data = authorSnap.data();
                  return {
                      name: data.name || "Boon News Desk",
                      avatar: data.avatar || data.imageUrl || FALLBACK_AVATAR
                  };
              }
          } catch(e) {}
          return { name: authorRefId, avatar: FALLBACK_AVATAR };
      }

      async function initReaderEngine() {
        const cachedPosts = localStorage.getItem(CACHE_KEY_POSTS);
        if (cachedPosts) {
            try {
                allPosts = JSON.parse(cachedPosts);
                renderSidebarWidgets();
                setupSearch();
                
                const matchedCachedPost = allPosts.find(p => (p.slug === articleSlugOrId || p.id === articleSlugOrId));
                if (matchedCachedPost) {
                    currentArticle = matchedCachedPost;
                    renderArticle(currentArticle);
                }
            } catch(e){}
        }

        if (!articleSlugOrId) {
            renderError("No article specified. Return home to choose a news story.");
            return;
        }

        try {
            let matchedDoc = null;

            // 1. Query Firestore by slug field
            const slugQuery = query(collection(db, "newsPosts"), where("slug", "==", articleSlugOrId), limit(1));
            const slugSnap = await getDocs(slugQuery);
            
            if (!slugSnap.empty) {
                matchedDoc = slugSnap.docs[0];
            } else {
                // 2. Fallback: Query by direct Document ID
                const docRef = doc(db, "newsPosts", articleSlugOrId);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    matchedDoc = docSnap;
                }
            }

            if (matchedDoc) {
                currentArticle = { id: matchedDoc.id, ...matchedDoc.data() };
                renderArticle(currentArticle);
                incrementViews(doc.ref || doc(db, "newsPosts", matchedDoc.id));
                fetchComments();
            } else if (!currentArticle) {
                renderError("The requested news article could not be found.");
            }
        } catch (err) {
            if (!currentArticle) {
                renderError("Unable to load article due to a network connection issue.");
            }
        }

        try {
            const postsSnap = await getDocs(query(collection(db, "newsPosts"), orderBy("createdAt", "desc"), limit(25)));
            allPosts = [];
            postsSnap.forEach(docSnap => {
                allPosts.push({ id: docSnap.id, ...docSnap.data() });
            });
            localStorage.setItem(CACHE_KEY_POSTS, JSON.stringify(allPosts));
            renderSidebarWidgets();
            setupSearch();
        } catch(e) {}
      }

      async function renderArticle(post) {
        const skeleton = document.getElementById("skeletonLoader");
        const wrapper = document.getElementById("articleContentWrapper");
        
        if (skeleton && skeleton.style.display !== "none") {
            skeleton.style.display = "none";
            wrapper.style.display = "block";
            wrapper.classList.add("fade-in");
        }

        const title = post.title || "Untitled Article";
        const rawContent = post.content || post.body || post.excerpt || "No content available.";
        const category = post.category || "News";
        const imgUrl = post.imageUrl || FALLBACK_IMG;
        const views = (post.views || post.viewCount || 0) + 1;

        const authorKey = post.authorId || post.author || "";
        const authorDetails = await fetchAuthorDetails(authorKey);

        updateSEO(post, authorDetails.name);

        const breadcrumbCat = document.getElementById("breadcrumbCategory");
        const breadcrumbTitle = document.getElementById("breadcrumbTitle");
        if (breadcrumbCat) {
            breadcrumbCat.innerText = category;
            breadcrumbCat.href = `/category/${encodeURIComponent(category.toLowerCase())}`;
        }
        if (breadcrumbTitle) {
            breadcrumbTitle.innerText = title;
        }

        document.getElementById("articleCategory").innerText = category;
        document.getElementById("articleTitle").innerText = title;
        document.getElementById("articleAuthor").innerText = authorDetails.name;
        document.getElementById("authorAvatar").src = authorDetails.avatar;
        document.getElementById("articleImage").src = imgUrl;
        document.getElementById("articleViews").innerText = views.toLocaleString();
        document.getElementById("readTime").innerText = calculateReadTime(rawContent);
        
        if (post.createdAt) {
            let dateObj = post.createdAt.seconds ? new Date(post.createdAt.seconds * 1000) : new Date(post.createdAt);
            document.getElementById("articleDate").innerText = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        }

        const formattedContent = rawContent.includes("<p>") ? rawContent : rawContent.split(/\n\n+/).map(p => `<p>${p.trim()}</p>`).join('');
        document.getElementById("articleBody").innerHTML = formattedContent;
      }

      async function incrementViews(docRef) {
        try {
            await updateDoc(docRef, { views: increment(1) });
        } catch(e) {}
      }

      function renderSidebarWidgets() {
        const relatedContainer = document.getElementById("relatedStoriesContainer");
        const trendingContainer = document.getElementById("trendingWidgetContainer");

        if (!allPosts || allPosts.length === 0) return;

        const currentArticleId = currentArticle ? currentArticle.id : null;
        let related = allPosts.filter(p => p.id !== currentArticleId && (currentArticle ? p.category === currentArticle.category : true)).slice(0, 4);
        if (related.length === 0) related = allPosts.filter(p => p.id !== currentArticleId).slice(0, 4);

        if (relatedContainer) {
            relatedContainer.innerHTML = related.map(post => `
                <div class="related-item" onclick="navigateToArticle('${post.slug || post.id}')">
                    <img src="${post.imageUrl || FALLBACK_IMG}" class="related-img" loading="lazy" onerror="this.onerror=null; this.src='${FALLBACK_IMG}';" alt="${post.title}">
                    <div style="overflow: hidden;">
                        <span style="font-size: 0.65rem; color: var(--accent-color); font-weight: 700; text-transform: uppercase;">${post.category || 'News'}</span>
                        <div class="related-text-title">${post.title}</div>
                    </div>
                </div>
            `).join('');
        }

        const trending = [...allPosts].sort((a,b) => (b.views || 0) - (a.views || 0)).slice(0, 4);
        if (trendingContainer) {
            trendingContainer.innerHTML = trending.map((post, idx) => `
                <div class="related-item" onclick="navigateToArticle('${post.slug || post.id}')">
                    <span style="font-size: 1.1rem; font-weight: 800; color: var(--accent-color); font-family: 'Outfit';">0${idx + 1}</span>
                    <div style="overflow: hidden;">
                        <div class="related-text-title">${post.title}</div>
                        <span style="font-size: 0.7rem; color: var(--text-muted);">${post.views || 0} readers</span>
                    </div>
                </div>
            `).join('');
        }
      }

      function renderError(message) {
        const skeleton = document.getElementById("skeletonLoader");
        if (skeleton) skeleton.style.display = "none";
        
        const wrapper = document.getElementById("articleContentWrapper");
        if (wrapper) {
            wrapper.style.display = "block";
            wrapper.innerHTML = `
                <div style="text-align: center; padding: 2rem 1rem;">
                    <i class="fa-solid fa-circle-exclamation" style="font-size: 2.2rem; color: var(--accent-color); margin-bottom: 0.75rem;"></i>
                    <h2>Article Not Found</h2>
                    <p style="color: var(--text-muted); margin-top: 6px; font-size: 0.9rem;">${message}</p>
                    <a href="/" style="display: inline-block; margin-top: 1rem; background: var(--accent-color); color: white; padding: 8px 18px; border-radius: 6px; font-weight: 700; font-size: 0.85rem;">Back to Home</a>
                </div>
            `;
        }
      }

      const commentForm = document.getElementById("commentForm");
      if (commentForm) {
          commentForm.addEventListener("submit", async (e) => {
              e.preventDefault();
              const nameInput = document.getElementById("commenterName");
              const textInput = document.getElementById("commentText");
              const submitBtn = document.getElementById("commentSubmitBtn");

              const name = nameInput.value.trim();
              const text = textInput.value.trim();

              if (!name || !text || !currentArticle) return;

              const lastCommentTime = localStorage.getItem("last_comment_time");
              if (lastCommentTime && Date.now() - parseInt(lastCommentTime) < 15000) {
                  alert("Please wait 15 seconds before posting another comment.");
                  return;
              }

              submitBtn.disabled = true;
              submitBtn.innerText = "Posting...";

              try {
                  const commentsRef = collection(db, "newsPosts", currentArticle.id, "comments");
                  await addDoc(commentsRef, {
                      authorName: name,
                      comment: text,
                      timestamp: serverTimestamp()
                  });

                  localStorage.setItem("last_comment_time", Date.now().toString());
                  nameInput.value = "";
                  textInput.value = "";
                  await fetchComments();
              } catch (err) {
                  console.error("Error submitting comment:", err);
              } finally {
                  submitBtn.disabled = false;
                  submitBtn.innerText = "Post Comment";
              }
          });
      }

      async function fetchComments() {
          if (!currentArticle) return;
          try {
              const commentsRef = collection(db, "newsPosts", currentArticle.id, "comments");
              const q = query(commentsRef, orderBy("timestamp", "desc"));
              const snap = await getDocs(q);
              const commentsList = document.getElementById("commentsList");

              if (!commentsList) return;

              if (snap.empty) {
                  commentsList.innerHTML = `<p style="color: var(--text-muted); font-size: 0.825rem;" id="noCommentsMsg">Be the first to comment on this article.</p>`;
                  return;
              }

              commentsList.innerHTML = "";
              snap.forEach(docSnap => {
                  const data = docSnap.data();
                  const time = data.timestamp ? new Date(data.timestamp.seconds * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Just now';
                  
                  const div = document.createElement("div");
                  div.className = "comment-item";
                  div.innerHTML = `
                      <div class="comment-header">
                          <strong style="color: var(--text-main);">${data.authorName}</strong>
                          <span>${time}</span>
                      </div>
                      <p style="font-size: 0.875rem; color: var(--text-main);">${data.comment}</p>
                  `;
                  commentsList.appendChild(div);
              });
          } catch(e){}
      }

      window.shareOnPlatform = async (platform) => {
          const url = getShareableUrl();
          const title = currentArticle ? currentArticle.title : "Boon News";

          if (platform === 'native') {
              if (navigator.share) {
                  try {
                      await navigator.share({ title, url });
                      return;
                  } catch (err) {}
              } else {
                  copyArticleLink();
                  return;
              }
          }

          let shareUrl = "";
          if (platform === 'twitter') shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`;
          if (platform === 'facebook') shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
          if (platform === 'whatsapp') shareUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(title)}%20${encodeURIComponent(url)}`;

          if (shareUrl) window.open(shareUrl, '_blank', 'width=600,height=400');
      };

      window.copyArticleLink = () => {
          const shareUrl = getShareableUrl();
          navigator.clipboard.writeText(shareUrl);
          
          const toast = document.createElement('div');
          toast.innerText = "Link copied to clipboard!";
          toast.style.cssText = "position:fixed; bottom:20px; left:50%; transform:translateX(-50%); background:#0f172a; color:#fff; padding:6px 14px; border-radius:6px; font-size:0.8rem; z-index:2000; box-shadow: 0 4px 12px rgba(0,0,0,0.2);";
          document.body.appendChild(toast);
          setTimeout(() => toast.remove(), 2500);
      };

      initReaderEngine();
    
