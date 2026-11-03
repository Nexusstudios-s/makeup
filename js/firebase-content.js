import { collection, getDocs, query, where } from 'https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js';
import { db } from './firebase-client.js';

async function leerPublicados(nombre) {
  const consulta = query(collection(db, nombre), where('published', '==', true));
  const resultado = await getDocs(consulta);
  return resultado.docs.map(documento => ({ id: documento.id, ...documento.data() }));
}

function mostrarAnuncio(anuncios) {
  const ahora = Date.now();
  const activos = anuncios
    .filter(anuncio => anuncio.active !== false)
    .filter(anuncio => !anuncio.expiresAt || anuncio.expiresAt.toDate().getTime() > ahora)
    .sort((a, b) => (b.priority || 0) - (a.priority || 0));
  const anuncio = activos[0];
  if (!anuncio) return;

  const aviso = document.createElement('aside');
  aviso.className = 'anuncio-publicado';
  aviso.setAttribute('aria-label', 'Anuncio');
  const texto = document.createElement('div');
  const titulo = document.createElement('strong');
  titulo.textContent = anuncio.title || 'Novedad';
  const cuerpo = document.createElement('p');
  cuerpo.textContent = anuncio.body || '';
  texto.append(titulo, cuerpo);
  aviso.append(texto);

  if (typeof anuncio.link === 'string' && /^\/(?!\/)/.test(anuncio.link)) {
    const enlace = document.createElement('a');
    enlace.className = 'anuncio-enlace';
    enlace.href = anuncio.link;
    enlace.textContent = anuncio.linkLabel || 'Ver más';
    aviso.append(enlace);
  }

  document.querySelector('.cabecera')?.insertAdjacentElement('afterend', aviso);
}

async function cargarContenidoPublicado() {
  try {
    const [productos, categorias, anuncios] = await Promise.all([
      leerPublicados('products'),
      leerPublicados('categories'),
      leerPublicados('announcements')
    ]);
    if ((productos.length || categorias.length) && window.aplicarContenidoFirebase) {
      window.aplicarContenidoFirebase({ productos, categorias });
    }
    mostrarAnuncio(anuncios);
  } catch (error) {
    console.info('El contenido Firebase todavía no está disponible; se conserva el catálogo local.', error.code || error.message);
  }
}

cargarContenidoPublicado();
