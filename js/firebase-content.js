import { collection, doc, getDoc, getDocs, query, where } from 'https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js';
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
    const [productos, categorias, anuncios, carouselSlides, examples, visibilitySnap, saleTermsSnap, legalTermsSnap] = await Promise.all([
      leerPublicados('products'),
      leerPublicados('categories'),
      leerPublicados('announcements'),
      leerPublicados('carouselSlides'),
      leerPublicados('examples'),
      getDoc(doc(db, 'siteSettings', 'visibility')),
      getDoc(doc(db, 'legalPages', 'sale')),
      getDoc(doc(db, 'legalPages', 'terms'))
    ]);
    const visibility = visibilitySnap.exists() ? visibilitySnap.data() : {};
    const legalPages = {
      sale: saleTermsSnap.exists() ? saleTermsSnap.data() : null,
      terms: legalTermsSnap.exists() ? legalTermsSnap.data() : null
    };
    window.aplicarContenidoFirebase?.({ productos, categorias, carouselSlides, visibility, examples, legalPages });
    mostrarAnuncio(anuncios);
  } catch (error) {
    console.info('El contenido Firebase todavía no está disponible; se conserva el catálogo local.', error.code || error.message);
  } finally {
    document.querySelector('.carrusel')?.classList.remove('carrusel-esperando');
  }
}

cargarContenidoPublicado();
