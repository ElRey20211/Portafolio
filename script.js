/* =============================================
   JOEL ARAUZ — script.js (Engine v6 - Robust Boot)
   ============================================= */

// ========== 1. SAFE PRELOADER (BOOT GUARANTEED) ==========
const loader = document.getElementById('loader');
const loaderNum = document.getElementById('loaderNum');
const loaderBar = document.getElementById('loaderBar');

function dismissLoader() {
  if (loader && !loader.classList.contains('done')) {
    loader.classList.add('done');
    // Ensure pointer events are cleared
    loader.style.pointerEvents = 'none';
  }
}

// Fallback safety timeout: even if any script fails, dismiss loader after 1.8s
setTimeout(dismissLoader, 1800);

let bootProgress = 0;
const bootTimer = setInterval(() => {
  bootProgress += Math.floor(Math.random() * 12) + 6;
  if (bootProgress > 100) bootProgress = 100;
  
  if (loaderNum) loaderNum.textContent = bootProgress.toString().padStart(2, '0');
  if (loaderBar) loaderBar.style.width = bootProgress + '%';

  if (bootProgress >= 100) {
    clearInterval(bootTimer);
    setTimeout(() => {
      dismissLoader();
      playBeep(880, 'sine', 0.12, 0.04);
    }, 250);
  }
}, 30);


// ========== 2. WEB AUDIO SYNTHESIZER ==========
let soundEnabled = false;
let audioCtx = null;

function initAudio() {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) audioCtx = new AudioContextClass();
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
}

function playBeep(freq = 600, type = 'sine', duration = 0.05, gainVol = 0.02) {
  if (!soundEnabled) return;
  try {
    initAudio();
    if (!audioCtx) return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);

    gain.gain.setValueAtTime(gainVol, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration);

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  } catch (e) {
    // Ignore audio context autoplay restrictions
  }
}

const soundToggle = document.getElementById('soundToggle');
const soundIcon = document.getElementById('soundIcon');

if (soundToggle) {
  soundToggle.addEventListener('click', () => {
    initAudio();
    soundEnabled = !soundEnabled;
    soundToggle.classList.toggle('active', soundEnabled);
    if (soundIcon) soundIcon.textContent = soundEnabled ? '[SND:ON]' : '[SND:OFF]';

    if (soundEnabled) {
      playBeep(523.25, 'triangle', 0.07, 0.04);
      setTimeout(() => playBeep(659.25, 'triangle', 0.07, 0.04), 60);
      setTimeout(() => playBeep(783.99, 'triangle', 0.1, 0.04), 120);
    }
  });
}


// ========== 3. THREE.JS 3D INTERACTIVE CORE ==========
const canvas3D = document.getElementById('webgl-canvas');
let scene, camera, renderer, wireframeMesh, particleField;
let mouseX = 0, mouseY = 0;
let targetX = 0, targetY = 0;

function initThree() {
  if (!canvas3D || typeof THREE === 'undefined') return;

  try {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 28;

    renderer = new THREE.WebGLRenderer({ canvas: canvas3D, alpha: true, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    const isLight = document.documentElement.getAttribute('data-theme') === 'light';

    // Complex Torus Knot Wireframe
    const geom = new THREE.TorusKnotGeometry(10, 2.8, 100, 16);
    const mat = new THREE.MeshBasicMaterial({
      color: isLight ? 0x00875a : 0x00ff9d,
      wireframe: true,
      transparent: true,
      opacity: isLight ? 0.08 : 0.13
    });
    wireframeMesh = new THREE.Mesh(geom, mat);
    scene.add(wireframeMesh);

    // Floating ambient 3D star points
    const pCount = 260;
    const pGeom = new THREE.BufferGeometry();
    const positions = new Float32Array(pCount * 3);

    for (let i = 0; i < pCount * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 80;
      positions[i + 1] = (Math.random() - 0.5) * 80;
      positions[i + 2] = (Math.random() - 0.5) * 80;
    }
    pGeom.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const pMat = new THREE.PointsMaterial({
      color: 0x00ff9d,
      size: 0.22,
      transparent: true,
      opacity: 0.25
    });
    particleField = new THREE.Points(pGeom, pMat);
    scene.add(particleField);

    window.addEventListener('resize', onThreeResize, { passive: true });
    window.addEventListener('mousemove', e => {
      mouseX = (e.clientX / window.innerWidth) * 2 - 1;
      mouseY = -(e.clientY / window.innerHeight) * 2 + 1;
    }, { passive: true });

    animateThree();
  } catch (err) {
    console.warn('WebGL init bypassed:', err);
  }
}

function onThreeResize() {
  if (!camera || !renderer) return;
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function animateThree() {
  requestAnimationFrame(animateThree);

  targetX += (mouseX - targetX) * 0.05;
  targetY += (mouseY - targetY) * 0.05;

  if (wireframeMesh) {
    wireframeMesh.rotation.x += 0.003;
    wireframeMesh.rotation.y += 0.004;
    wireframeMesh.rotation.z += 0.002;
    wireframeMesh.position.x = targetX * 6;
    wireframeMesh.position.y = targetY * 4;
  }

  if (particleField) {
    particleField.rotation.y -= 0.001;
  }

  if (renderer && scene && camera) {
    renderer.render(scene, camera);
  }
}

// Start Three after DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initThree);
} else {
  initThree();
}


// ========== 4. THEME SWITCH (LIGHT / DARK) ==========
const themeBtn = document.getElementById('themeBtn');
const themeLabel = document.getElementById('themeLabel');
let currentTheme = localStorage.getItem('ja_theme') || 'dark';

function applyTheme(theme) {
  currentTheme = theme;
  document.documentElement.setAttribute('data-theme', theme);
  try {
    localStorage.setItem('ja_theme', theme);
  } catch (e) {}

  if (themeLabel) {
    themeLabel.textContent = theme === 'dark' ? 'LIGHT' : 'DARK';
  }

  // Update Three.js wireframe color based on theme
  if (wireframeMesh && wireframeMesh.material) {
    wireframeMesh.material.color.setHex(theme === 'dark' ? 0x00ff9d : 0x00875a);
    wireframeMesh.material.opacity = theme === 'dark' ? 0.13 : 0.08;
  }
}

if (themeBtn) {
  themeBtn.addEventListener('click', () => {
    applyTheme(currentTheme === 'dark' ? 'light' : 'dark');
    playBeep(currentTheme === 'dark' ? 440 : 880, 'sine', 0.05, 0.02);
  });
}
applyTheme(currentTheme);


// ========== 5. CURSOR & MAGNETIC PHYSICS ==========
const cursor = document.getElementById('cursor');
const cursorRing = document.getElementById('cursorRing');
let cx = 0, cy = 0;
let rx = 0, ry = 0;

window.addEventListener('mousemove', e => {
  cx = e.clientX;
  cy = e.clientY;
  if (cursor) {
    cursor.style.left = `${cx}px`;
    cursor.style.top = `${cy}px`;
  }
}, { passive: true });

function renderCursorRing() {
  rx += (cx - rx) * 0.14;
  ry += (cy - ry) * 0.14;
  if (cursorRing) {
    cursorRing.style.left = `${rx}px`;
    cursorRing.style.top = `${ry}px`;
  }
  requestAnimationFrame(renderCursorRing);
}
requestAnimationFrame(renderCursorRing);

// Magnetic elements physics
const magneticEls = document.querySelectorAll('.magnetic');
magneticEls.forEach(el => {
  el.addEventListener('mousemove', e => {
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    el.style.transform = `translate(${x * 0.28}px, ${y * 0.28}px)`;
  });
  el.addEventListener('mouseleave', () => {
    el.style.transform = `translate(0px, 0px)`;
  });
  el.addEventListener('mouseenter', () => {
    playBeep(900, 'sine', 0.03, 0.015);
  });
});

// Cursor Hover triggers
const hoverables = document.querySelectorAll('a, button, .project-row, .clink, .skill-col, .terminal-container');
hoverables.forEach(el => {
  el.addEventListener('mouseenter', () => {
    if (cursor) cursor.classList.add('hovered');
    if (cursorRing) cursorRing.classList.add('hovered');
  });
  el.addEventListener('mouseleave', () => {
    if (cursor) cursor.classList.remove('hovered');
    if (cursorRing) cursorRing.classList.remove('hovered');
  });
});


// ========== 6. FLOATING PROJECT HOVER PREVIEW ==========
const hoverPreview = document.getElementById('hoverPreview');
const previewUrl = document.getElementById('previewUrl');
const projectRows = document.querySelectorAll('.project-row');
let previewX = 0, previewY = 0;
let currentPreviewX = 0, currentPreviewY = 0;
let isHoveringProject = false;

window.addEventListener('mousemove', e => {
  previewX = e.clientX + 35;
  previewY = e.clientY + 20;
}, { passive: true });

function renderPreview() {
  if (isHoveringProject && hoverPreview) {
    currentPreviewX += (previewX - currentPreviewX) * 0.12;
    currentPreviewY += (previewY - currentPreviewY) * 0.12;
    hoverPreview.style.left = `${currentPreviewX}px`;
    hoverPreview.style.top = `${currentPreviewY}px`;
  }
  requestAnimationFrame(renderPreview);
}
requestAnimationFrame(renderPreview);

projectRows.forEach(row => {
  row.addEventListener('mouseenter', () => {
    isHoveringProject = true;
    const url = row.getAttribute('data-preview-url');
    if (previewUrl && url) previewUrl.textContent = url;
    if (hoverPreview) hoverPreview.classList.add('active');
    playBeep(450, 'triangle', 0.05, 0.02);
  });
  row.addEventListener('mouseleave', () => {
    isHoveringProject = false;
    if (hoverPreview) hoverPreview.classList.remove('active');
  });
});


// ========== 7. 3D TILT EFFECT ON CARDS ==========
const tiltCards = document.querySelectorAll('.tilt-card');

tiltCards.forEach(card => {
  card.addEventListener('mousemove', e => {
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    const rotateX = ((y - centerY) / centerY) * -7;
    const rotateY = ((x - centerX) / centerX) * 7;
    
    card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.015, 1.015, 1.015)`;
  });

  card.addEventListener('mouseleave', () => {
    card.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`;
  });
});


// ========== 8. INTERACTIVE CLI & COMMANDS ==========
const terminalInput = document.getElementById('terminalInput');
const terminalOutput = document.getElementById('terminalOutput');
const terminalScreen = document.getElementById('terminalScreen');

const CLI_COMMANDS = {
  help: () => `Available commands:
  • <span class="accent">about</span>     - Background & career summary
  • <span class="accent">skills</span>    - Technical stack
  • <span class="accent">projects</span>  - Show highlighted works
  • <span class="accent">contact</span>   - Contact channels
  • <span class="accent">matrix</span>    - Binary flow
  • <span class="accent">clear</span>     - Clear terminal buffer
  • <span class="accent">sudo</span>      - Gain superuser permissions`,
  
  about: () => `Joel Arturo Arauz M. (16 y/o)
&gt; Computer Engineering student based in Bolivia.
&gt; Active programmer since age 10 (6+ years building software).
&gt; Specializing in Full-Stack Architectures (Django, Node.js) and Creative Web Interfaces.`,

  skills: () => `TECH STACK:
  [Frontend] : HTML5, CSS3, JavaScript ES6+, WebGL/Three.js
  [Backend]  : Django (Python), Node.js (Express), REST APIs
  [Tools]    : Git, GitHub, VS Code, Linux basics, Neocities`,

  projects: () => `SELECTED PROJECTS:
  1. Canada20 Virtual Store (Live: https://canada20.neocities.org/#)
  2. Django Full Stack Web Platform (In development)
  3. Node.js Microservices Engine (In development)`,

  contact: () => `CHANNELS:
  • GitHub : https://github.com/ElRey20211
  • Email  : your@email.com
  • Web    : https://ElRey20211.github.io`,

  sudo: () => `<span class="accent">[GRANTED]</span> Superuser access unlocked. Welcome, Joel.`,

  matrix: () => {
    playBeep(220, 'sawtooth', 0.5, 0.08);
    return `<span class="matrix">01001010 01001111 01000101 01001100 00100000 01000001 01010010 01000001 01010101 01011010<br>&gt; Reality is code. Hack the future.</span>`;
  },

  clear: () => {
    if (terminalOutput) terminalOutput.innerHTML = '';
    return null;
  }
};

if (terminalInput) {
  terminalInput.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      const val = terminalInput.value.trim().toLowerCase();
      if (!val) return;

      playBeep(700, 'square', 0.03, 0.02);

      const userLine = document.createElement('p');
      userLine.className = 't-line';
      userLine.innerHTML = `<span class="prompt-sym">joel@dev:~$</span> ${val}`;
      terminalOutput.appendChild(userLine);

      if (CLI_COMMANDS[val]) {
        const response = CLI_COMMANDS[val]();
        if (response !== null) {
          const respLine = document.createElement('div');
          respLine.className = 't-line dim';
          respLine.innerHTML = response;
          terminalOutput.appendChild(respLine);
        }
      } else {
        const errLine = document.createElement('p');
        errLine.className = 't-line error';
        errLine.textContent = `bash: command not found: ${val}. Type 'help' for available commands.`;
        terminalOutput.appendChild(errLine);
        playBeep(250, 'sawtooth', 0.08, 0.03);
      }

      terminalInput.value = '';
      if (terminalScreen) terminalScreen.scrollTop = terminalScreen.scrollHeight;
    }
  });
}


// ========== 9. BILINGUAL TRANSLATION SYSTEM ==========
const TRANSLATIONS = {
  en: {
    roles: ['Creative Technologist', 'Full Stack Learner', 'Problem Solver', 'CS Student', 'WebGL Explorer'],
    badge: 'DEVELOPER · STUDENT · BOLIVIA · CREATIVE CODER · '
  },
  es: {
    roles: ['Tecnólogo Creativo', 'Aprendiz Full Stack', 'Solucionador de Problemas', 'Estudiante de CS', 'Explorador WebGL'],
    badge: 'DESARROLLADOR · ESTUDIANTE · BOLIVIA · PROGRAMADOR CREATIVO · '
  }
};

let currentLang = 'en';

function setLang(langCode) {
  currentLang = langCode;
  document.documentElement.setAttribute('data-lang', langCode);

  document.querySelectorAll('[data-en]').forEach(el => {
    const val = el.getAttribute(`data-${langCode}`);
    if (!val) return;
    if (val.includes('<br>') || val.includes('<em>') || el.innerHTML.includes('<br>') || el.innerHTML.includes('<em>')) {
      el.innerHTML = val;
    } else {
      el.textContent = val;
    }
  });

  const badgeTextPath = document.querySelector('.badge-text textPath');
  if (badgeTextPath) {
    badgeTextPath.textContent = TRANSLATIONS[langCode].badge;
  }

  const enBtn = document.getElementById('langEN');
  const esBtn = document.getElementById('langES');
  if (enBtn) enBtn.classList.toggle('active', langCode === 'en');
  if (esBtn) esBtn.classList.toggle('active', langCode === 'es');

  typingRoles = TRANSLATIONS[langCode].roles;
  roleIndex = 0;
  charIndex = 0;
  isDeleting = false;
  if (typingEl) typingEl.textContent = '';
  clearTimeout(typingTimer);
  typeLoop();

  playBeep(800, 'sine', 0.04, 0.02);
}

const langBtn = document.getElementById('langBtn');
if (langBtn) {
  langBtn.addEventListener('click', () => {
    setLang(currentLang === 'en' ? 'es' : 'en');
  });
}


// ========== 10. TYPING HEADLINE EFFECT ==========
const typingEl = document.getElementById('typingText');
let typingRoles = TRANSLATIONS.en.roles;
let roleIndex = 0;
let charIndex = 0;
let isDeleting = false;
let typingTimer;

function typeLoop() {
  if (!typingEl) return;
  const currentRole = typingRoles[roleIndex];

  if (isDeleting) {
    typingEl.textContent = currentRole.substring(0, charIndex - 1);
    charIndex--;
  } else {
    typingEl.textContent = currentRole.substring(0, charIndex + 1);
    charIndex++;
  }

  let delay = isDeleting ? 40 : 85;

  if (!isDeleting && charIndex === currentRole.length) {
    delay = 2000;
    isDeleting = true;
  } else if (isDeleting && charIndex === 0) {
    isDeleting = false;
    roleIndex = (roleIndex + 1) % typingRoles.length;
    delay = 300;
  }

  typingTimer = setTimeout(typeLoop, delay);
}
typeLoop();


// ========== 11. SCROLL REVEALS & NAVBAR ACTIVE ==========
const revealUp = document.querySelectorAll('.reveal-up');
const revealClip = document.querySelectorAll('.reveal-clip');

const observer = new IntersectionObserver((entries, obs) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      obs.unobserve(entry.target);
    }
  });
}, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });

revealUp.forEach(el => observer.observe(el));
revealClip.forEach(el => observer.observe(el));

const header = document.getElementById('header');
window.addEventListener('scroll', () => {
  if (header) {
    header.classList.toggle('scrolled', window.scrollY > 40);
  }
}, { passive: true });


// ========== 12. MOBILE BURGER ==========
const burger = document.getElementById('burger');
const mobileNav = document.getElementById('mobileNav');

if (burger) {
  burger.addEventListener('click', () => {
    const isOpen = mobileNav.classList.toggle('open');
    const spans = burger.querySelectorAll('span');
    if (isOpen) {
      spans[0].style.transform = 'rotate(45deg) translate(4px, 4px)';
      spans[1].style.transform = 'rotate(-45deg) translate(4px, -4px)';
    } else {
      spans[0].style.transform = '';
      spans[1].style.transform = '';
    }
  });
}

function closeBurger() {
  if (mobileNav) mobileNav.classList.remove('open');
  if (burger) {
    burger.querySelectorAll('span').forEach(s => { s.style.transform = ''; });
  }
}

document.addEventListener('click', e => {
  if (mobileNav && mobileNav.classList.contains('open') && !mobileNav.contains(e.target) && !burger.contains(e.target)) {
    closeBurger();
  }
});
