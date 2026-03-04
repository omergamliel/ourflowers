/* app.js — dynamic plant catalog + TOC behavior */
(function () {
  const grid = document.getElementById('plant-grid');
  const searchInput = document.getElementById('plant-search');
  const chips = document.querySelectorAll('.chip[data-tag]');

  let plants = [];
  let activeTag = null;
  let query = '';

  function bindImageShimmer(scope) {
    const wraps = (scope || document).querySelectorAll('.thumb-wrap');
    wraps.forEach((wrap) => {
      const img = wrap.querySelector('img');
      if (!img) return;

      const done = () => {
        wrap.classList.add('loaded');
        img.classList.add('loaded');
      };

      if (img.complete) {
        done();
      } else {
        img.addEventListener('load', done, { once: true });
        img.addEventListener('error', done, { once: true });
      }
    });
  }

  function bindInfoboxShimmer() {
    const infoboxes = document.querySelectorAll('.infobox');
    infoboxes.forEach((box) => {
      const img = box.querySelector('.infobox-img');
      if (!img) return;

      box.classList.add('img-pending');
      const done = () => {
        box.classList.remove('img-pending');
        img.classList.add('loaded');
      };

      if (img.complete) {
        done();
      } else {
        img.addEventListener('load', done, { once: true });
        img.addEventListener('error', done, { once: true });
      }
    });
  }

  function createTagLabel(tag) {
    if (tag === 'שמש מלאה') return '☀️ שמש מלאה';
    if (tag === 'חצי צל') return '🌤️ חצי צל';
    if (tag === 'השקייה נמוכה') return '💧 נמוכה';
    if (tag === 'השקייה בינונית') return '💧💧 בינונית';
    if (tag === 'השקייה גבוהה') return '💧💧💧 גבוהה';
    if (tag === 'לא רעיל') return '✅ לא רעיל';
    if (tag === 'מרפסת') return '🪴 מרפסת';
    return tag;
  }

  function cardHtml(plant) {
    const tags = (plant.tags || []).slice(0, 3).map((tag) => `<span class="tag">${createTagLabel(tag)}</span>`).join('');

    return `<a class="plant-card"
      href="${plant.pageUrl}"
      data-search="${plant.searchText || ''}"
      data-tags="${(plant.tags || []).join(',')}">
      <div class="thumb-wrap">
        <img src="${plant.image}" alt="${plant.hebrewName}" loading="lazy">
      </div>
      <div class="card-body">
        <div class="hebrew-name">${plant.hebrewName}</div>
        <div class="sci-name">${plant.scientificName}</div>
        <div class="card-tags">${tags}</div>
      </div>
    </a>`;
  }

  function render(filtered) {
    if (!grid) return;
    if (filtered.length === 0) {
      grid.innerHTML = '<div class="no-results">לא נמצאו צמחים שתואמים לסינון הנוכחי.</div>';
      grid.classList.remove('is-loading');
      return;
    }

    grid.innerHTML = filtered.map(cardHtml).join('');
    grid.classList.remove('is-loading');
    bindImageShimmer(grid);
  }

  function renderSkeleton(count = 10) {
    if (!grid) return;
    grid.classList.add('is-loading');
    grid.innerHTML = Array.from({ length: count }).map(() => `
      <article class="skeleton-card" aria-hidden="true">
        <div class="skeleton-media"></div>
        <div class="skeleton-content">
          <div class="skeleton-line w-90"></div>
          <div class="skeleton-line w-65"></div>
          <div class="skeleton-line w-40"></div>
        </div>
      </article>
    `).join('');
  }

  function applyFilters() {
    const filtered = plants.filter((plant) => {
      const hay = (plant.searchText || '').toLowerCase();
      const qMatch = !query || hay.includes(query);
      const tMatch = !activeTag || (plant.tags || []).includes(activeTag);
      return qMatch && tMatch;
    });

    render(filtered);
  }

  async function loadPlants() {
    renderSkeleton();
    const inlineData = document.getElementById('plants-data');
    if (inlineData) {
      try {
        plants = JSON.parse(inlineData.textContent || '[]');
        setTimeout(applyFilters, 180);
        return;
      } catch (error) {
        console.error('Failed parsing inline plants data:', error);
      }
    }

    try {
      const response = await fetch('assets/data/plants.json');
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      plants = await response.json();
      applyFilters();
    } catch (error) {
      console.error('Failed loading plants.json:', error);
      if (grid) {
        grid.innerHTML = '<div class="no-results">לא ניתן לטעון נתוני צמחים כרגע.</div>';
      }
    }
  }

  if (searchInput) {
    searchInput.addEventListener('input', (event) => {
      query = event.target.value.trim().toLowerCase();
      applyFilters();
    });
  }

  chips.forEach((chip) => {
    chip.addEventListener('click', () => {
      if (chip.classList.contains('active')) {
        chip.classList.remove('active');
        activeTag = null;
      } else {
        chips.forEach((c) => c.classList.remove('active'));
        chip.classList.add('active');
        activeTag = chip.dataset.tag;
      }
      applyFilters();
    });
  });

  const tocTitle = document.querySelector('.toc-title');
  const tocList = document.querySelector('.toc ol, .toc ul');
  if (tocTitle && tocList) {
    tocTitle.addEventListener('click', () => {
      const open = tocList.style.display !== 'none';
      tocList.style.display = open ? 'none' : '';
      const arrow = tocTitle.querySelector('.toc-arrow');
      if (arrow) arrow.textContent = open ? '▸' : '▾';
    });

    if (window.innerWidth < 700) {
      tocList.style.display = 'none';
      const arrow = tocTitle.querySelector('.toc-arrow');
      if (arrow) arrow.textContent = '▸';
    }
  }

  bindInfoboxShimmer();
  loadPlants();
})();
