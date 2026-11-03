const parametros = new URLSearchParams(location.search);
const clave = parametros.get('c');
const abrirId = parametros.get('p');
let categoria = CATEGORIAS[clave];

const encabezado = document.querySelector('.encabezado-cat');
const rejilla = document.querySelector('.productos');
const dialogo = document.querySelector('.detalle');
const buscador = document.querySelector('.buscador');
const selector = document.querySelector('.orden');
const total = document.querySelector('.total');

dialogo.addEventListener('keydown', e => {
  if (e.key !== 'Escape') return;
  e.preventDefault();
  dialogo.close();
});

function ordenar(lista, orden) {
  if (orden === 'nombre') return [...lista].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
  return lista;
}

function pintar() {
  const texto = buscador.value.trim().toLowerCase();
  const base = PRODUCTOS.filter(p => p.categoria === clave);
  const lista = ordenar(
    base.filter(p => `${p.nombre} ${p.descripcion}`.toLowerCase().includes(texto)),
    selector.value
  );
  rejilla.innerHTML = lista.length
    ? lista.map(tarjetaProducto).join('')
    : '<p class="vacio">No encontramos productos con esa búsqueda. Prueba con otra palabra.</p>';
  total.textContent = `${lista.length} ${lista.length === 1 ? 'producto' : 'productos'}`;
  ocultarImagenesRotas(rejilla);
}

function abrirDetalle(producto) {
  if (!producto) return;
  const colores = CATEGORIAS[producto.categoria]?.colores || ['#e7d7d2', '#cdb5ad'];
  const tonos = producto.tonos || [];
  let tono = tonos.length ? tonos[0].n : '';

  dialogo.style.setProperty('--a', colores[0]);
  dialogo.style.setProperty('--b', colores[1]);
  dialogo.innerHTML = `
    <button class="x" aria-label="Cerrar">${ICONOS.cerrar}</button>
    <div class="detalle-cuerpo">
      <div class="foto"><img src="${producto.imagen}" alt="${producto.nombre}"></div>
      <div class="info">
        <h2>${producto.nombre}</h2>
        <p class="precio">${formatoPrecio(producto.precio)}</p>
        <p class="producto-disponibilidad producto-disponibilidad-${producto.availability || 'inquire'}">${producto.availability === 'available' ? 'Disponible' : producto.availability === 'soldOut' ? 'Agotado' : 'Consultar disponibilidad'}</p>
        <p>${producto.descripcion}</p>
        ${tonos.length ? `
          <div>
            <p class="tono-actual">Tono: <strong>${tono}</strong></p>
            <div class="tonos">
              ${tonos.map((t, i) => `<button class="tono" style="--c:${t.c}" data-tono="${t.n}" aria-label="${t.n}" aria-pressed="${i === 0}"></button>`).join('')}
            </div>
          </div>` : ''}
        <ul>${producto.detalles.map(d => `<li>${d}</li>`).join('')}</ul>
        <a class="boton" data-pedido target="_blank" rel="noopener noreferrer">Consultar por WhatsApp</a>
      </div>
    </div>`;
  
  dialogo.querySelector('.info').insertAdjacentHTML('beforeend', `
    <section class="producto-resenas" aria-labelledby="resenas-titulo">
      <div class="producto-resenas-cabecera">
        <div><p class="sobrelinea">Experiencias reales</p><h3 id="resenas-titulo">Reseñas del producto</h3></div>
        <div class="resenas-resumen"><strong data-review-average>—</strong><span data-review-stars aria-label="Sin calificación">☆☆☆☆☆</span><small data-review-count>Calculando opiniones…</small></div>
      </div>
      <div class="resenas-lista" data-review-list aria-live="polite"><p class="resena-vacia">Cargando reseñas…</p></div>
      <form class="resena-form" data-review-form hidden>
        <h4>Comparte tu experiencia</h4>
        <fieldset class="resena-calificacion">
          <legend>Tu calificación</legend>
          <div class="resena-estrellas" role="group" aria-label="Elige de una a cinco estrellas">
            ${[1, 2, 3, 4, 5].map(valor => `<button type="button" data-review-rating="${valor}" aria-label="${valor} ${valor === 1 ? 'estrella' : 'estrellas'}" aria-pressed="false">★</button>`).join('')}
          </div>
        </fieldset>
        <label>Tu reseña<textarea name="body" rows="3" required minlength="8" maxlength="1000" placeholder="¿Qué te gustó del producto? Comparte una opinión respetuosa y útil."></textarea></label>
        <button class="boton resena-enviar" type="submit" disabled>Enviar reseña</button>
        <p class="resena-feedback" data-review-feedback role="status" aria-live="polite"></p>
      </form>
      <p class="resena-login" data-review-login hidden><span>Inicia sesión para dejar una reseña.</span> <button class="resena-login-boton" type="button" data-review-login-open>Iniciar sesión</button></p>
    </section>
  `);
  
  configurarResenas(dialogo, producto);

  const pedido = dialogo.querySelector('[data-pedido]');
  const actualizarPedido = () => {
    const mensaje = [
      `Hola, quiero consultar este producto: ${producto.nombre}.`,
      `Precio: ${formatoPrecio(producto.precio)}.`,
      tono ? `Color elegido: ${tono}.` : '',
      `Detalles: ${producto.detalles.join(', ')}.`
    ].filter(Boolean).join('\n');
    pedido.href = enlaceWhatsApp(mensaje);
  };
  actualizarPedido();

  dialogo.onclick = e => {
    if (e.target === dialogo || e.target.closest('.x')) {
      dialogo.close();
      return;
    }
    const boton = e.target.closest('.tono');
    if (!boton) return;
    tono = boton.dataset.tono;
    dialogo.querySelectorAll('.tono').forEach(t => t.setAttribute('aria-pressed', t === boton));
    dialogo.querySelector('.tono-actual strong').textContent = tono;
    actualizarPedido();
  };

  ocultarImagenesRotas(dialogo);
  dialogo.showModal();
}

const INSIGNIAS_RESEÑA = {
  cliente: { label: 'Cliente verificado', symbol: '✓' },
  vip: { label: 'Cliente VIP', symbol: 'V' },
  veterano: { label: 'Cliente veterano', symbol: '★' }
};

function estrellasTexto(rating) {
  const score = Math.max(0, Math.min(5, Number(rating) || 0));
  return `${'★'.repeat(score)}${'☆'.repeat(5 - score)}`;
}

function agregarInsigniasReseña(zona, badges = {}) {
  Object.entries(INSIGNIAS_RESEÑA).forEach(([key, badge]) => {
    if (badges[key] !== true) return;
    const icon = document.createElement('span');
    icon.className = `resena-insignia resena-insignia-${key}`;
    icon.textContent = badge.symbol;
    icon.title = badge.label;
    icon.setAttribute('aria-label', badge.label);
    zona.append(icon);
  });
}

async function configurarResenas(modalProducto, producto) {
  reviewAuthEvents?.abort();
  const lifecycle = new AbortController();
  reviewAuthEvents = lifecycle;
  const lista = modalProducto.querySelector('[data-review-list]');
  const form = modalProducto.querySelector('[data-review-form]');
  const login = modalProducto.querySelector('[data-review-login]');
  const feedback = modalProducto.querySelector('[data-review-feedback]');
  const average = modalProducto.querySelector('[data-review-average]');
  const summaryStars = modalProducto.querySelector('[data-review-stars]');
  const count = modalProducto.querySelector('[data-review-count]');
  const starButtons = [...modalProducto.querySelectorAll('[data-review-rating]')];
  let rating = 0;
  let requestId = 0;

  const setRating = value => {
    rating = value;
    starButtons.forEach(button => {
      const active = Number(button.dataset.reviewRating) <= rating;
      button.setAttribute('aria-pressed', String(Number(button.dataset.reviewRating) === rating));
      button.classList.toggle('activa', active);
    });
    form.querySelector('[type="submit"]').disabled = !rating;
  };

  starButtons.forEach(button => button.addEventListener('click', () => setRating(Number(button.dataset.reviewRating))));
  modalProducto.querySelector('[data-review-login-open]').addEventListener('click', () => {
    modalProducto.close();
    document.querySelector('[data-auth-open]')?.click();
  });

  async function cargarResenas() {
    const currentRequest = ++requestId;
    try {
      const db = window.__firebaseDb;
      if (!db) throw new Error('Las reseñas todavía no están disponibles.');
      const { collection, getDocs, query, where } = await import('https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js');
      const reviewsQuery = query(
        collection(db, 'products', producto.id, 'reviews'),
        where('approved', '==', true)
      );
      const snapshot = await getDocs(reviewsQuery);
      if (currentRequest !== requestId) return;
      const reviews = snapshot.docs.map(documento => ({ id: documento.id, ...documento.data() }))
        .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      const averageRating = reviews.length
        ? reviews.reduce((sum, review) => sum + Number(review.rating || 0), 0) / reviews.length
        : 0;
      average.textContent = reviews.length ? averageRating.toFixed(1) : '—';
      summaryStars.textContent = estrellasTexto(Math.round(averageRating));
      summaryStars.setAttribute('aria-label', `${averageRating.toFixed(1)} de 5 estrellas`);
      count.textContent = `${reviews.length} ${reviews.length === 1 ? 'reseña' : 'reseñas'}`;
      lista.replaceChildren();

      if (!reviews.length) {
        const empty = document.createElement('p');
        empty.className = 'resena-vacia';
        empty.textContent = 'Aún no hay reseñas aprobadas. Puedes compartir la primera.';
        lista.append(empty);
        return;
      }

      reviews.forEach(review => {
        const card = document.createElement('article');
        card.className = 'resena-card';
        const header = document.createElement('div');
        header.className = 'resena-card-header';
        const author = document.createElement('strong');
        author.textContent = review.authorName || 'Cliente';
        const badges = document.createElement('span');
        badges.className = 'resena-insignias';
        agregarInsigniasReseña(badges, review.authorBadges);
        const stars = document.createElement('span');
        stars.className = 'resena-card-estrellas';
        stars.textContent = estrellasTexto(review.rating);
        stars.setAttribute('aria-label', `${review.rating} de 5 estrellas`);
        header.append(author, badges, stars);
        const body = document.createElement('p');
        body.textContent = review.body || '';
        card.append(header, body);
        lista.append(card);
      });
    } catch (error) {
      if (currentRequest !== requestId) return;
      lista.innerHTML = '<p class="resena-vacia">No pudimos cargar las reseñas por ahora.</p>';
      console.info('No se pudieron cargar las reseñas del producto.', error.code || error.message);
    }
  }

  async function actualizarAccesoResena() {
    const user = window.__firebaseAuth?.currentUser;
    form.hidden = !user;
    login.hidden = Boolean(user);
    if (!user) {
      feedback.textContent = '';
      return;
    }
    try {
      const { doc, getDoc } = await import('https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js');
      const existing = await getDoc(doc(window.__firebaseDb, 'products', producto.id, 'reviews', user.uid));
      if (existing.exists() && existing.data().approved) {
        form.hidden = true;
        login.hidden = false;
        login.textContent = 'Ya compartiste una reseña publicada para este producto. Gracias por tu opinión.';
      } else if (existing.exists()) {
        form.elements.body.value = existing.data().body || '';
        setRating(Number(existing.data().rating) || 0);
        feedback.textContent = 'Tu reseña está pendiente de aprobación. Puedes actualizarla aquí.';
      }
    } catch (error) {
      feedback.textContent = 'No pudimos verificar tu reseña anterior.';
    }
  }

  form.addEventListener('submit', async event => {
    event.preventDefault();
    const user = window.__firebaseAuth?.currentUser;
    const body = form.elements.body.value.trim();
    if (!user) {
      login.hidden = false;
      form.hidden = true;
      return;
    }
    if (!rating || body.length < 8) {
      feedback.textContent = 'Elige una calificación y escribe al menos 8 caracteres.';
      return;
    }

    const submit = form.querySelector('[type="submit"]');
    submit.disabled = true;
    feedback.textContent = 'Enviando reseña…';
    try {
      const { collection, doc, getDoc, serverTimestamp, setDoc, updateDoc } = await import('https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js');
      const db = window.__firebaseDb;
      const reviewRef = doc(db, 'products', producto.id, 'reviews', user.uid);
      const oldReview = await getDoc(reviewRef);
      if (oldReview.exists() && oldReview.data().approved) {
        feedback.textContent = 'Esta reseña ya fue aprobada y no puede modificarse.';
        return;
      }
      const profileSnap = await getDoc(doc(db, 'profiles', user.uid));
      const profile = profileSnap.data() || {};
      const assigned = profile.badges || {};
      const authorBadges = Object.fromEntries(Object.keys(INSIGNIAS_RESEÑA).map(key => [key, Boolean(assigned[key])]));
      const reviewData = {
        rating,
        body,
        updatedAt: serverTimestamp()
      };
      if (oldReview.exists()) {
        await updateDoc(reviewRef, reviewData);
      } else {
        await setDoc(reviewRef, {
          ...reviewData,
          productId: producto.id,
          productName: producto.nombre,
          authorId: user.uid,
          authorName: user.displayName || profile.displayName || user.email?.split('@')[0] || 'Cliente',
          authorBadges,
          approved: false,
          createdAt: serverTimestamp()
        });
      }
      feedback.textContent = '¡Gracias! Tu reseña se mostrará cuando el equipo la apruebe.';
      form.elements.body.value = '';
      setRating(0);
    } catch (error) {
      feedback.textContent = error.message || 'No pudimos enviar la reseña. Intenta de nuevo.';
    } finally {
      submit.disabled = !rating;
    }
  });

  window.addEventListener('auth:state-change', actualizarAccesoResena, { signal: lifecycle.signal });
  if (!window.__firebaseAuth) window.addEventListener('firebase:ready', actualizarAccesoResena, { once: true, signal: lifecycle.signal });
  modalProducto.addEventListener('close', () => lifecycle.abort(), { once: true });
  await Promise.all([cargarResenas(), actualizarAccesoResena()]);
}

let reviewAuthEvents = null;

function renderizarCategoria() {
  categoria = CATEGORIAS[clave];
  if (!categoria) {
    document.querySelector('.chips').innerHTML = '';
    encabezado.innerHTML = '<div><h1>Cargando categoría…</h1><p class="intro">Estamos buscando los productos publicados.</p><a class="boton" href="/#categorias">Ver categorías</a></div>';
    rejilla.innerHTML = '';
    return;
  }
  document.title = `${categoria.titulo} · ${MARCA_COMPLETA}`;
  encabezado.style.setProperty('--a', categoria.colores[0]);
  encabezado.style.setProperty('--b', categoria.colores[1]);
  encabezado.querySelector('h1').textContent = categoria.titulo;
  encabezado.querySelector('.intro').textContent = categoria.texto;

  document.querySelector('.chips').innerHTML = Object.entries(CATEGORIAS)
    .filter(([, c]) => c.publicado !== false)
    .map(([k, c]) => `<a class="chip${k === clave ? ' activo' : ''}" href="/categoria?c=${k}">${c.titulo}</a>`)
    .join('');

  pintar();

  const pedido = PRODUCTOS.find(p => p.id === abrirId);
  if (pedido) abrirDetalle(pedido);
}

buscador.addEventListener('input', pintar);
selector.addEventListener('change', pintar);
rejilla.addEventListener('click', e => {
  const tarjeta = e.target.closest('[data-id]');
  if (!tarjeta) return;
  e.preventDefault();
  abrirDetalle(PRODUCTOS.find(p => p.id === tarjeta.dataset.id));
});

renderizarCategoria();

window.actualizarCatalogoFirebase = () => {
  renderizarCategoria();
};
