(() => {
  const dataEl = document.getElementById('pinterest-data');
  const boardsEl = document.getElementById('boards');
  const libraryEl = document.getElementById('library');
  const bottomNavEl = document.getElementById('bottomNav');

  let data = { boards: [] };
  try { data = JSON.parse(dataEl.textContent || '{"boards":[]}'); }
  catch (err) { console.error('Invalid Pinterest data:', err); }

  const boards = Array.isArray(data.boards) ? data.boards : [];
  let activeBoard = 0;
  const expandedSections = new Set();
  const icons = ['⌂','▦','▧','☆','♧'];

  function boardPinCount(board) {
    return (board.sections || []).reduce((n, s) => n + ((s.pins || []).length), 0)
      + ((board.unsectionedPins || []).length);
  }

  function renderTopTabs() {
    boardsEl.innerHTML = '';
    boards.forEach((board, index) => {
      const button = document.createElement('button');
      button.className = 'board-tab' + (index === activeBoard ? ' active' : '');
      button.textContent = board.name || 'Untitled';
      const badge = document.createElement('span');
      badge.className = 'badge';
      badge.textContent = boardPinCount(board);
      button.appendChild(badge);
      button.addEventListener('click', () => {
        activeBoard = index;
        renderAll();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
      boardsEl.appendChild(button);
    });
  }

  function renderBottomNav() {
    bottomNavEl.innerHTML = '';
    boards.forEach((board, index) => {
      const button = document.createElement('button');
      button.className = 'bottom-btn' + (index === activeBoard ? ' active' : '');
      const icon = document.createElement('span');
      icon.className = 'bottom-icon';
      icon.textContent = icons[index % icons.length];
      const label = document.createElement('span');
      label.textContent = board.name || 'Board';
      button.append(icon, label);
      button.addEventListener('click', () => {
        activeBoard = index;
        renderAll();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
      bottomNavEl.appendChild(button);
    });
  }

  function createPin(pin) {
    const item = document.createElement('article');
    item.className = 'pin';
    const card = document.createElement('div');
    card.className = 'pin-card';
    const link = document.createElement('a');
    link.className = 'pin-image-link';
    link.href = pin.pinUrl || '#';
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.title = 'Open Pinterest Pin';
    const img = document.createElement('img');
    img.src = pin.imageUrl || '';
    img.alt = pin.title || 'Pinterest reference';
    img.loading = 'lazy';
    img.decoding = 'async';
    img.referrerPolicy = 'no-referrer';
    const open = document.createElement('span');
    open.className = 'pin-open';
    open.textContent = '↗';
    open.setAttribute('aria-hidden', 'true');
    link.append(img, open);
    card.appendChild(link);
    item.appendChild(card);
    if (pin.title) {
      const title = document.createElement('div');
      title.className = 'pin-title';
      title.textContent = pin.title;
      item.appendChild(title);
    }
    if (pin.subtitle) {
      const subtitle = document.createElement('div');
      subtitle.className = 'pin-subtitle';
      subtitle.textContent = pin.subtitle;
      item.appendChild(subtitle);
    }
    return item;
  }

  function createSection(section) {
    const pins = Array.isArray(section.pins) ? section.pins : [];
    if (!pins.length) return null;
    const sectionEl = document.createElement('section');
    sectionEl.className = 'section';
    const head = document.createElement('div');
    head.className = 'section-head';
    const nameWrap = document.createElement('div');
    nameWrap.className = 'section-name-wrap';
    const name = document.createElement('h2');
    name.className = 'section-name';
    name.textContent = section.name || 'Untitled';
    const count = document.createElement('span');
    count.className = 'section-count';
    count.textContent = `${pins.length} ${pins.length === 1 ? 'Pin' : 'Pins'}`;
    nameWrap.append(name, count);
    const viewAll = document.createElement('button');
    viewAll.className = 'view-all';
    const key = section.id || section.name;
    viewAll.textContent = expandedSections.has(key) ? 'Show less' : 'View all';
    viewAll.addEventListener('click', () => {
      if (expandedSections.has(key)) expandedSections.delete(key);
      else expandedSections.add(key);
      renderAll();
    });
    head.append(nameWrap, viewAll);
    const grid = document.createElement('div');
    grid.className = 'grid';
    (expandedSections.has(key) ? pins : pins.slice(0, 2)).forEach(pin => grid.appendChild(createPin(pin)));
    sectionEl.append(head, grid);
    return sectionEl;
  }

  function createUnsectioned(board) {
    const pins = Array.isArray(board.unsectionedPins) ? board.unsectionedPins : [];
    if (!pins.length) return null;
    const section = document.createElement('section');
    section.className = 'section free-section';
    const head = document.createElement('div');
    head.className = 'section-head';
    const nameWrap = document.createElement('div');
    nameWrap.className = 'section-name-wrap';
    const name = document.createElement('h2');
    name.className = 'section-name';
    name.textContent = 'Other references';
    const count = document.createElement('span');
    count.className = 'section-count';
    count.textContent = `${pins.length} ${pins.length === 1 ? 'Pin' : 'Pins'}`;
    nameWrap.append(name, count);
    const viewAll = document.createElement('button');
    viewAll.className = 'view-all';
    viewAll.textContent = expandedSections.has('__unsectioned__') ? 'Show less' : 'View all';
    viewAll.addEventListener('click', () => {
      if (expandedSections.has('__unsectioned__')) expandedSections.delete('__unsectioned__');
      else expandedSections.add('__unsectioned__');
      renderAll();
    });
    head.append(nameWrap, viewAll);
    const grid = document.createElement('div');
    grid.className = 'grid';
    (expandedSections.has('__unsectioned__') ? pins : pins.slice(0, 2)).forEach(pin => grid.appendChild(createPin(pin)));
    section.append(head, grid);
    return section;
  }

  function renderLibrary() {
    libraryEl.innerHTML = '';
    if (!boards.length) {
      libraryEl.innerHTML = '<div class="empty">No Pinterest data synced yet.</div>';
      return;
    }
    const board = boards[activeBoard];
    const heading = document.createElement('div');
    heading.className = 'board-heading';
    const h1 = document.createElement('h1');
    h1.textContent = (board.name || 'Untitled').toUpperCase();
    heading.appendChild(h1);
    libraryEl.appendChild(heading);
    (board.sections || []).forEach(section => {
      const el = createSection(section);
      if (el) libraryEl.appendChild(el);
    });
    const free = createUnsectioned(board);
    if (free) libraryEl.appendChild(free);
  }

  function renderAll() {
    renderTopTabs();
    renderBottomNav();
    renderLibrary();
  }

  document.getElementById('menuBtn').addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
  document.getElementById('searchBtn').addEventListener('click', () => alert('Search can be added later without changing the Pinterest sync format.'));

  if (boards.length) activeBoard = 0;
  renderAll();
})();
