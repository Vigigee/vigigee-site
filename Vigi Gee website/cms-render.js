/* VigiGee CMS renderer — fills page sections from the /data JSON files
   managed in the admin (Pages CMS). Hardcoded markup stays as a fallback,
   so the site never breaks if a data file is missing. */
(function () {
  function load(url) {
    return fetch(url).then(function (r) { return r.ok ? r.json() : null; })
      .catch(function () { return null; });
  }

  /* ---- Logos page ---- */
  var grid = document.querySelector('.logos-grid');
  if (grid) {
    load('data/logos.json').then(function (list) {
      if (!Array.isArray(list) || !list.length) return;
      grid.innerHTML = '';
      list.forEach(function (it) {
        var cell = document.createElement('div');
        cell.className = 'logo-cell';
        var img = document.createElement('img');
        img.src = it.image || ''; img.alt = it.name || '';
        var nm = document.createElement('span');
        nm.className = 'nm'; nm.textContent = it.name || '';
        cell.appendChild(img); cell.appendChild(nm);
        grid.appendChild(cell);
      });
      var cells = [].slice.call(grid.querySelectorAll('.logo-cell'));
      requestAnimationFrame(function () {
        cells.forEach(function (c) { c.classList.add('in'); });
      });
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
