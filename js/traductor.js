const IDIOMAS = [
  { codigo: 'es', texto: 'ES', nombre: 'Español' },
  { codigo: 'en', texto: 'EN', nombre: 'English' },
  { codigo: 'pt', texto: 'PT', nombre: 'Português' }
];

let idiomaActual = 'es';
try { idiomaActual = localStorage.getItem('idioma') || 'es'; } catch (e) {}

function marcarIdioma() {
  document.querySelectorAll('.idiomas button').forEach(boton => {
    boton.classList.toggle('activo', boton.dataset.idioma === idiomaActual);
  });
}

function aplicarIdioma(codigo) {
  const combo = document.querySelector('.goog-te-combo');
  if (!combo) return false;
  combo.value = codigo;
  combo.dispatchEvent(new Event('change'));
  return true;
}

function restaurarEspanol() {
  const caducada = 'expires=Thu, 01 Jan 1970 00:00:00 GMT';
  const host = location.hostname;
  document.cookie = `googtrans=;${caducada};path=/`;
  document.cookie = `googtrans=;${caducada};path=/;domain=${host}`;
  document.cookie = `googtrans=;${caducada};path=/;domain=.${host}`;
  location.reload();
}

function elegirIdioma(codigo) {
  idiomaActual = codigo;
  try { localStorage.setItem('idioma', codigo); } catch (e) {}
  marcarIdioma();
  if (codigo === 'es') restaurarEspanol();
  else aplicarIdioma(codigo);
}

function iniciarTraductor() {
  new google.translate.TranslateElement({
    pageLanguage: 'es',
    includedLanguages: 'es,en,pt',
    autoDisplay: false
  }, 'google_translate_element');
  if (idiomaActual === 'es') return;
  let intentos = 0;
  const espera = setInterval(() => {
    intentos += 1;
    if (aplicarIdioma(idiomaActual) || intentos > 30) clearInterval(espera);
  }, 300);
}

document.querySelectorAll('.idiomas').forEach(zona => {
  zona.innerHTML = IDIOMAS.map(i =>
    `<button data-idioma="${i.codigo}" aria-label="${i.nombre}" lang="${i.codigo}">${i.texto}</button>`
  ).join('');
  zona.addEventListener('click', e => {
    const boton = e.target.closest('button');
    if (boton) elegirIdioma(boton.dataset.idioma);
  });
});

marcarIdioma();
