/* VigiGee CMS renderer — fills page sections from the /data JSON files
   managed in the admin (Pages CMS). Hardcoded markup stays as a fallback,
   so the site never breaks if a data file is missing. */
(function () {
  function load(url) {
    return fetch(url).then(function (r) { return r.ok ? r.json() : null; })
      .catch(function () { return null; });
  }
  function esc(s) { return (s == null ? '' : String(s)); }

  /* ---- Logos page: randomized, 12 at a time, endless "+" loop ---- */
  var grid = document.querySelector('.logos-grid');
  if (grid) {
    load('data/logos.json').then(function (list) {
      if (!Array.isArray(list) || !list.length) return;
      var BATCH = 12;
      function shuffle(a) {
        for (var i = a.length - 1; i > 0; i--) {
          var j = Math.floor(Math.random() * (i + 1));
          var t = a[i]; a[i] = a[j]; a[j] = t;
        }
        return a;
      }
      var pool = shuffle(list.slice());
      var ptr = 0;
      grid.innerHTML = '';
      function addBatch(n) {
        var added = [];
        for (var k = 0; k < n; k++) {
          if (ptr >= pool.length) { shuffle(pool); ptr = 0; } // wrap seamlessly, reshuffle
          var it = pool[ptr++];
          var cell = document.createElement('div');
          cell.className = 'logo-cell';
          var img = document.createElement('img');
          img.src = it.image || ''; img.alt = it.name || ''; img.loading = 'lazy';
          var nm = document.createElement('span');
          nm.className = 'nm'; nm.textContent = it.name || '';
          cell.appendChild(img); cell.appendChild(nm);
          grid.appendChild(cell); added.push(cell);
        }
        requestAnimationFrame(function () {
          added.forEach(function (c, i) {
            c.style.transitionDelay = (i % 4 * 0.06) + 's';
            c.classList.add('in');
          });
        });
      }
      addBatch(BATCH);
      var wrap = document.createElement('div');
      wrap.className = 'more-wrap';
      var btn = document.createElement('button');
      btn.type = 'button'; btn.className = 'more-btn';
      btn.setAttribute('aria-label', 'Show more logos');
      btn.textContent = 'more';
      btn.addEventListener('click', function () { addBatch(BATCH); });
      wrap.appendChild(btn);
      grid.parentNode.insertBefore(wrap, grid.nextSibling);
    });
  }

  /* ---- Trusted By strip (homepage marquee) ---- */
  var track = document.querySelector('.marquee-track');
  if (track) {
    load('data/trusted.json').then(function (list) {
      if (!Array.isArray(list) || !list.length) return;
      track.innerHTML = '';
      for (var pass = 0; pass < 2; pass++) {
        list.forEach(function (it) {
          var img = document.createElement('img');
          img.className = 'tlogo';
          img.src = it.image || ''; img.alt = it.name || '';
          track.appendChild(img);
        });
      }
    });
  }

  /* ---- Projects: Work page grid + homepage featured ---- */
  var workGrids = document.querySelectorAll('.work');
  var detailTitle = document.querySelector('.p-title');

  if (workGrids.length || detailTitle) {
    load('data/projects.json').then(function (data) {
      /* accepts either a plain array or { "projects": [ ... ] } */
      var list = Array.isArray(data) ? data : (data && data.projects) || [];
      if (!Array.isArray(list) || !list.length) return;

      /* build a project card <a> */
      function card(p) {
        var a = document.createElement('a');
        a.className = 'card';
        a.href = 'project.html?slug=' + encodeURIComponent(p.slug);
        var tags = (p.tags || []).map(function (t) {
          return '<span class="tag">' + esc(t) + '</span>';
        }).join('');
        a.innerHTML =
          '<div class="thumb"><img src="' + esc(p.cover) + '" alt="' + esc(p.title) + '" loading="lazy">' +
          '<div class="card-tags">' + tags + '</div>' +
          '<div class="overlay"><h3>' + esc(p.title) + '</h3>' +
          '<div class="tagline">' + esc(p.tagline) + '</div></div>' +
          '</div>';
        return a;
      }

      /* reveal cards we insert (the page's own observer ran before we
         replaced the markup, so it would never see these) */
      function reveal(cards) {
        if (!('IntersectionObserver' in window)) {
          cards.forEach(function (c) { c.classList.add('in'); });
          return;
        }
        var io = new IntersectionObserver(function (en) {
          en.forEach(function (x) {
            if (x.isIntersecting) { x.target.classList.add('in'); io.unobserve(x.target); }
          });
        }, { threshold: .1, rootMargin: '0px 0px -5% 0px' });
        cards.forEach(function (c) { io.observe(c); });
      }

      /* Work page shows all; homepage (#work) shows the first 6 */
      workGrids.forEach(function (gridEl) {
        var isHome = !!gridEl.closest('#work');
        var items = isHome ? list.slice(0, 6) : list;
        gridEl.innerHTML = '';
        var cards = items.map(function (p) {
          var c = card(p); gridEl.appendChild(c); return c;
        });
        reveal(cards);
      });

      /* ---- Project detail page ---- */
      if (detailTitle) {
        var params = new URLSearchParams(location.search);
        var slug = params.get('slug');
        var idx = 0;
        if (slug) {
          for (var i = 0; i < list.length; i++) {
            if (list[i].slug === slug) { idx = i; break; }
          }
        }
        var p = list[idx];
        var next = list[(idx + 1) % list.length];

        document.title = p.title + ' — VigiGee';
        detailTitle.textContent = p.title;

        /* meta blocks (there are two: desktop + mobile) */
        var metaBlocks = document.querySelectorAll('.p-meta');
        metaBlocks.forEach(function (block) {
          block.querySelectorAll('.m').forEach(function (row) {
            var k = (row.querySelector('.k') || {}).textContent || '';
            var v = row.querySelector('.v');
            if (!v) return;
            k = k.trim().toLowerCase();
            if (k === 'year') {
              if (p.year) { v.textContent = p.year; } else { row.style.display = 'none'; }
            } else if (k === 'services') {
              v.textContent = p.services || (p.tags || []).join(', ');
            } else if (k === 'role') {
              if (p.role) { v.textContent = p.role; } else { row.style.display = 'none'; }
            } else if (k === 'link') {
              if (p.link) {
                var link = v.querySelector('a') || document.createElement('a');
                link.className = 'm-link'; link.href = p.link;
                link.target = '_blank'; link.rel = 'noopener';
                link.textContent = p.linkLabel || p.link.replace(/^https?:\/\//, '').replace(/\/$/, '');
                if (!v.contains(link)) { v.innerHTML = ''; v.appendChild(link); }
              } else { row.style.display = 'none'; }
            }
          });
        });

        /* cover */
        var coverImg = document.querySelector('.cover img');
        if (coverImg) { coverImg.src = p.cover; coverImg.alt = p.title; }

        var overviews = document.querySelectorAll('.p-overview');
        var galleries = document.querySelectorAll('.gallery');

        /* overview (first .p-overview) */
        if (overviews[0]) {
          var ob = overviews[0].querySelector('.body');
          if (ob) ob.textContent = p.overview || '';
          if (!p.overview) overviews[0].style.display = 'none';
        }

        /* what we did (second .p-overview) */
        if (overviews[1]) {
          var wb = overviews[1].querySelector('.body');
          if (wb) wb.textContent = p.whatWeDid || '';
          if (!p.whatWeDid) overviews[1].style.display = 'none';
        }

        function galleryCell(item) {
          var cls = item.size === 'half' ? 'g-half' : item.size === 'tall' ? 'g-tall' : 'g-wide';
          var d = document.createElement('div');
          d.className = cls;
          var img = document.createElement('img');
          img.src = item.image || ''; img.alt = ''; img.loading = 'lazy';
          d.appendChild(img);
          return d;
        }

        var gal = p.gallery || [];
        /* first .gallery = single feature image; second = the rest as a grid */
        if (galleries[0]) {
          galleries[0].innerHTML = '';
          if (gal.length) {
            galleries[0].appendChild(galleryCell({ size: 'wide', image: gal[0].image }));
          } else {
            galleries[0].style.display = 'none';
          }
        }
        if (galleries[1]) {
          galleries[1].innerHTML = '';
          var rest = gal.slice(1);
          if (rest.length) {
            rest.forEach(function (it) { galleries[1].appendChild(galleryCell(it)); });
          } else {
            galleries[1].style.display = 'none';
          }
        }

        /* next project */
        var nextLink = document.querySelector('.next a');
        if (nextLink && next) {
          nextLink.href = 'project.html?slug=' + encodeURIComponent(next.slug);
          var nm = nextLink.querySelector('.name');
          if (nm) nm.textContent = next.title;
          var nth = nextLink.querySelector('.thumb');
          if (nth) { nth.src = next.cover; nth.alt = next.title; }
        }
      }
    });
  }
})();
