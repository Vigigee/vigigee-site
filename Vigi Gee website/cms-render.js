/* VigiGee CMS renderer — fills page sections from the /data JSON files
   managed in the admin (Pages CMS). Hardcoded markup stays as a fallback,
   so the site never breaks if a data file is missing. */
(function () {
  function load(url) {
    return fetch(url).then(function (r) { return r.ok ? r.json() : null; })
      .catch(function () { return null; });
  }

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
      wrap.className = 'logos-more';
      var btn = document.createElement('button');
      btn.type = 'button'; btn.className = 'logos-more-btn';
      btn.setAttribute('aria-label', 'Show more logos');
      btn.textContent = '+';
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
})();
