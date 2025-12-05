// Reescritura robusta: IntersectionObserver que selecciona la sección más visible
const navbar = document.querySelector('.navbar');
const navUl = navbar.querySelector('ul');
navUl.style.position = 'relative';
const navLinks = document.querySelectorAll('.navbar ul li a');
const sections = Array.from(document.querySelectorAll('header[id], section[id], footer[id]'));

// crear línea (si no existe ya)
let line = navUl.querySelector('.nav-line');
if (!line) {
    line = document.createElement('div');
    line.className = 'nav-line';
    navUl.appendChild(line);
}

function updateLine(activeLink) {
    if (!activeLink) return;
    const rect = activeLink.getBoundingClientRect();
    const ulRect = navUl.getBoundingClientRect();
    line.style.width = rect.width + 'px';
    const left = rect.left - ulRect.left + navUl.scrollLeft;
    line.style.left = left + 'px';
}

let activeId = null;
let raf = null;
function setActive(id) {
    if (!id || id === activeId) return;
    activeId = id;
    navLinks.forEach(l => l.classList.toggle('active', l.getAttribute('href') === `#${id}`));
    const activeLink = document.querySelector(`.navbar ul li a[href="#${id}"]`);
    if (activeLink) {
        if (raf) cancelAnimationFrame(raf);
        raf = requestAnimationFrame(() => updateLine(activeLink));
    }
}

// observer logic with map of ratios
let observer = null;
let visibility = new Map();
const SWITCH_DELAY = 220; // ms
let switchTimeout = null;

function createObserver() {
    if (observer) observer.disconnect();
    visibility.clear();

    const navH = navbar.offsetHeight || 60;
    const options = {
        root: null,
        // reducir la exclusión inferior para que el footer pueda intersectar correctamente
        rootMargin: `-${navH}px 0px 0px 0px`,
        threshold: [0, 0.1, 0.25, 0.5, 0.75, 1]
    };

    observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            const id = entry.target.getAttribute('id');
            if (!id) return;
            if (entry.isIntersecting) {
                visibility.set(id, entry.intersectionRatio);
            } else {
                visibility.delete(id);
            }
        });

        if (visibility.size === 0) return;

        // choose the id with highest ratio
        let bestId = null;
        let bestRatio = 0;
        visibility.forEach((ratio, id) => {
            if (ratio > bestRatio) { bestRatio = ratio; bestId = id; }
        });

        if (!bestId) return;

        // debounce change to avoid flicker
        if (switchTimeout) clearTimeout(switchTimeout);
        switchTimeout = setTimeout(() => {
            setActive(bestId);
            switchTimeout = null;
        }, SWITCH_DELAY);
    }, options);

    sections.forEach(s => observer.observe(s));
}

createObserver();

// Si llegamos al final del documento, forzar el último id (útil para footer)
window.addEventListener('scroll', () => {
    const scrollBottom = window.scrollY + window.innerHeight;
    const docHeight = document.documentElement.scrollHeight;
    if (scrollBottom >= docHeight - 4) {
        const lastSection = sections[sections.length - 1];
        if (lastSection) setActive(lastSection.getAttribute('id'));
    }
});

// re-create observer on resize (navbar height may change)
window.addEventListener('resize', () => {
    // update line position for current active link
    const activeLink = document.querySelector('.navbar ul li a.active');
    if (activeLink) updateLine(activeLink);
    // recreate observer to update rootMargin
    createObserver();
});

// initial position on load
window.addEventListener('load', () => {
    const activeLink = document.querySelector('.navbar ul li a.active') || navLinks[0];
    if (activeLink) {
        setActive(activeLink.getAttribute('href').replace('#',''));
        updateLine(activeLink);
    }
});

// click behaviour
navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
        // let anchor navigation occur then update line
        const id = link.getAttribute('href').replace('#','');
        setTimeout(() => setActive(id), 50);
    });
});

