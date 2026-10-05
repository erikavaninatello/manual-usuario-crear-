function showSection(id) {
  document.querySelectorAll('.section').forEach(section => {
    const isActive = section.id === 'sec-' + id;
    section.classList.toggle('active', isActive);
    section.setAttribute('aria-hidden', String(!isActive));
  });

  document.querySelectorAll('.nav-item').forEach(item => {
    const isActive = item.dataset.section === id;
    item.classList.toggle('active', isActive);
    if (isActive) item.setAttribute('aria-current', 'page');
    else item.removeAttribute('aria-current');
  });

  document.querySelectorAll('.mobile-tab[data-mobile-section]').forEach(tab => {
    const isActive = tab.dataset.mobileSection === id;
    tab.classList.toggle('active', isActive);
    if (isActive) tab.setAttribute('aria-current', 'page');
    else tab.removeAttribute('aria-current');
  });

  const moreTab = document.getElementById('mobileMoreTab');
  const hasQuickTab = ['portada', 'asistencia', 'pagos', 'alumnos'].includes(id);
  moreTab.classList.toggle('active', !hasQuickTab);
  if (!hasQuickTab) moreTab.setAttribute('aria-current', 'page');
  else moreTab.removeAttribute('aria-current');

  if (window.matchMedia('(max-width: 760px)').matches) {
    const sidebar = document.getElementById('sidebar');
    const navToggle = document.getElementById('mobileNavToggle');
    sidebar.classList.remove('mobile-nav-open');
    document.body.classList.remove('mobile-nav-open');
    navToggle.setAttribute('aria-expanded', 'false');
    navToggle.setAttribute('aria-label', 'Abrir menú');
    moreTab.setAttribute('aria-expanded', 'false');
  }

  document.getElementById('main').scrollTop = 0;
  window.scrollTo(0, 0);
}

const searchInput = document.getElementById('searchInput');
searchInput.addEventListener('input', function(event) {
  const query = event.target.value.trim().toLowerCase();
  document.querySelectorAll('.nav-item').forEach(item => {
    const sectionId = item.getAttribute('data-section');
    const target = document.getElementById('sec-' + sectionId);
    const text = (item.textContent + ' ' + (target ? target.textContent : '')).toLowerCase();
    item.style.display = !query || text.includes(query) ? 'flex' : 'none';
  });
  if (query && window.matchMedia('(max-width: 760px)').matches) openMobileNav();
});

document.addEventListener('keydown', event => {
  const isTyping = event.target.matches('input, textarea, [contenteditable="true"]');
  if (event.key === 'Escape' && sidebar.classList.contains('mobile-nav-open')) {
    closeMobileNav();
    mobileMoreTab.focus();
    return;
  }
  if (event.key === '/' && !isTyping && !event.ctrlKey && !event.metaKey && !event.altKey) {
    event.preventDefault();
    searchInput.focus();
  }
});

const themeToggle = document.getElementById('themeToggle');
themeToggle.addEventListener('click', () => {
  const isDark = document.body.classList.toggle('dark-theme');
  themeToggle.setAttribute('aria-pressed', String(isDark));
  themeToggle.setAttribute('aria-label', isDark ? 'Activar modo claro' : 'Activar modo oscuro');
});

const sidebar = document.getElementById('sidebar');
const mobileNavToggle = document.getElementById('mobileNavToggle');
const mobileMoreTab = document.getElementById('mobileMoreTab');
const mobileNavBackdrop = document.getElementById('mobileNavBackdrop');

function openMobileNav() {
  sidebar.classList.add('mobile-nav-open');
  document.body.classList.add('mobile-nav-open');
  mobileMoreTab.classList.add('active');
  mobileNavToggle.setAttribute('aria-expanded', 'true');
  mobileNavToggle.setAttribute('aria-label', 'Cerrar menú');
  mobileMoreTab.setAttribute('aria-expanded', 'true');
}

function closeMobileNav() {
  sidebar.classList.remove('mobile-nav-open');
  document.body.classList.remove('mobile-nav-open');
  const currentSection = document.querySelector('.section.active')?.id.replace('sec-', '');
  const highlightMore = !['portada', 'asistencia', 'pagos', 'alumnos'].includes(currentSection);
  mobileMoreTab.classList.toggle('active', highlightMore);
  mobileNavToggle.setAttribute('aria-expanded', 'false');
  mobileNavToggle.setAttribute('aria-label', 'Abrir menú');
  mobileMoreTab.setAttribute('aria-expanded', 'false');
  if (highlightMore) mobileMoreTab.setAttribute('aria-current', 'page');
  else mobileMoreTab.removeAttribute('aria-current');
}

mobileNavToggle.addEventListener('click', () => {
  if (sidebar.classList.contains('mobile-nav-open')) closeMobileNav();
  else openMobileNav();
});

mobileMoreTab.addEventListener('click', () => {
  if (sidebar.classList.contains('mobile-nav-open')) closeMobileNav();
  else openMobileNav();
});

mobileNavBackdrop.addEventListener('click', closeMobileNav);
document.querySelectorAll('.mobile-tab[data-mobile-section]').forEach(tab => {
  tab.addEventListener('click', () => showSection(tab.dataset.mobileSection));
});

window.matchMedia('(min-width: 761px)').addEventListener('change', event => {
  if (!event.matches) return;
  closeMobileNav();
});

document.querySelectorAll('.nav-item').forEach(item => {
  item.setAttribute('role', 'button');
  item.setAttribute('tabindex', '0');
  item.setAttribute('aria-controls', 'sec-' + item.dataset.section);
  item.addEventListener('keydown', event => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      showSection(item.dataset.section);
    }
  });
});

document.querySelectorAll('.role-card').forEach(card => {
  card.setAttribute('role', 'button');
  card.setAttribute('tabindex', '0');
  card.addEventListener('keydown', event => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      showSection('inicio-nav');
    }
  });
});

showSection('portada');
