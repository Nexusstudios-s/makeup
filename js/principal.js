const ICONOS = {
  chat: '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.4 8.4 0 0 1-12.4 7.4L3 20l1.2-5.4A8.4 8.4 0 1 1 21 11.5z"/></svg>',
  pausa: '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/></svg>',
  play: '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>',
  cerrar: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>',
  flecha: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 17L17 7M8 7h9v9"/></svg>'
};

const enlaceWhatsApp = texto => `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(texto)}`;

const formatoPrecio = valor => {
  if (!Number.isFinite(valor)) return 'Consultar precio';
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0
  }).format(valor);
};

function ocultarImagenesRotas(raiz = document) {
  raiz.querySelectorAll('img, video').forEach(medio => {
    const quitar = () => medio.remove();
    if (medio.tagName === 'IMG' && medio.hasAttribute('src') && medio.complete && medio.naturalWidth === 0) {
      quitar();
      return;
    }
    medio.addEventListener('error', quitar, { once: true });
  });
}

function tarjetaProducto(producto, i = 0) {
  const categoria = CATEGORIAS[producto.categoria];
  const tonos = producto.tonos || [];
  const muestras = tonos.slice(0, 5)
    .map(t => `<span class="muestra" style="--c:${t.c}" title="${t.n}"></span>`).join('');
  const extra = tonos.length > 5 ? `<span class="mas">+${tonos.length - 5}</span>` : '';
  const animacion = document.body.classList.contains('catalogo')
    ? `animation:entrar .8s var(--curva) ${i * 70}ms both;`
    : '';
  return `
    <a class="producto" href="/categoria?c=${producto.categoria}&p=${producto.id}" data-id="${producto.id}"
       style="--a:${categoria.colores[0]};--b:${categoria.colores[1]};${animacion}">
      <div class="foto">
        <img src="${producto.imagen}" alt="${producto.nombre}" loading="lazy">
        ${producto.etiqueta ? `<span class="etiqueta">${producto.etiqueta}</span>` : ''}
        <span class="ver">Ver detalles</span>
      </div>
      <h3>${producto.nombre}</h3>
      <div class="fila">
        <span class="precio">${formatoPrecio(producto.precio)}</span>
        <span class="muestras">${muestras}${extra}</span>
      </div>
    </a>`;
}

function iniciarGeneral() {
  document.querySelectorAll('[data-marca]').forEach(el => { el.textContent = MARCA; });
  document.querySelectorAll('[data-marca-completa]').forEach(el => { el.textContent = MARCA_COMPLETA; });
  document.title = document.title.replace('{marca}', MARCA_COMPLETA);
  document.querySelectorAll('[data-anio]').forEach(el => { el.textContent = new Date().getFullYear(); });
  document.querySelectorAll('[data-whatsapp]').forEach(el => {
    el.href = enlaceWhatsApp('Hola, quiero información sobre sus productos');
  });
  document.querySelectorAll('[data-instagram]').forEach(el => { el.href = INSTAGRAM; });
  document.querySelectorAll('[data-facebook]').forEach(el => configurarRed(el, FACEBOOK));
  document.querySelectorAll('[data-tiktok]').forEach(el => configurarRed(el, TIKTOK));
  const flotante = document.createElement('a');
  flotante.className = 'flotante';
  flotante.href = enlaceWhatsApp('Hola, quiero información sobre sus productos');
  flotante.target = '_blank';
  flotante.rel = 'noopener';
  flotante.setAttribute('aria-label', 'Escribir por WhatsApp');
  flotante.innerHTML = ICONOS.chat;
  document.body.append(flotante);
  document.querySelector('.pie-categorias').innerHTML = Object.entries(CATEGORIAS)
    .map(([clave, cat]) => `<a href="/categoria?c=${clave}">${cat.titulo}</a>`).join('');
  iniciarMenuMovil();
}

function iniciarReserva() {
  const formulario = document.querySelector('[data-reserva-form]');
  if (!formulario) return;

  const fecha = formulario.querySelector('[name="fecha"]');
  const hoy = new Date();
  hoy.setMinutes(hoy.getMinutes() - hoy.getTimezoneOffset());
  fecha.min = hoy.toISOString().slice(0, 10);

  formulario.addEventListener('submit', e => {
    e.preventDefault();
    if (!formulario.reportValidity()) return;

    const campos = new FormData(formulario);
    const fechaPreferida = new Intl.DateTimeFormat('es-CO', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }).format(new Date(`${campos.get('fecha')}T12:00:00`));
    const detalles = String(campos.get('mensaje') || '').trim();
    const mensaje = [
      'Hola, quiero solicitar una cita de maquillaje.',
      `Nombre: ${String(campos.get('nombre') || '').trim()}`,
      `Servicio: ${campos.get('servicio')}`,
      `Fecha preferida: ${fechaPreferida}`,
      `Hora preferida: ${campos.get('hora') || 'Por acordar'}`,
      detalles ? `Detalles: ${detalles}` : ''
    ].filter(Boolean).join('\n');
    const ventana = window.open(enlaceWhatsApp(mensaje), '_blank');
    if (ventana) ventana.opener = null;
    else location.href = enlaceWhatsApp(mensaje);
  });
}

function iniciarMenuMovil() {
  const boton = document.querySelector('.menu-toggle');
  const menu = document.querySelector('#menu-principal');
  if (!boton || !menu) return;

  const cerrar = () => {
    boton.setAttribute('aria-expanded', 'false');
    boton.setAttribute('aria-label', 'Abrir menú');
    document.querySelector('.cabecera').classList.remove('menu-abierto');
  };

  boton.addEventListener('click', () => {
    const abierto = boton.getAttribute('aria-expanded') !== 'true';
    boton.setAttribute('aria-expanded', String(abierto));
    boton.setAttribute('aria-label', abierto ? 'Cerrar menú' : 'Abrir menú');
    document.querySelector('.cabecera').classList.toggle('menu-abierto', abierto);
  });
  menu.addEventListener('click', e => {
    if (e.target.closest('a')) cerrar();
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') cerrar();
  });
  document.addEventListener('click', e => {
    if (!e.target.closest('.barra')) cerrar();
  });
}

function configurarRed(enlace, url) {
  if (url) {
    enlace.href = url;
    enlace.removeAttribute('aria-disabled');
    enlace.removeAttribute('title');
    enlace.setAttribute('aria-label', enlace.getAttribute('aria-label') || enlace.textContent.trim());
    return;
  }
  enlace.setAttribute('aria-disabled', 'true');
}

function iniciarCategorias() {
  const zona = document.querySelector('.categorias');
  if (!zona) return;
  zona.innerHTML = Object.entries(CATEGORIAS).map(([clave, cat]) => {
    const total = PRODUCTOS.filter(p => p.categoria === clave).length;
    return `
      <a class="tarjeta" href="/categoria?c=${clave}" style="--a:${cat.colores[0]};--b:${cat.colores[1]}">
        <img src="${cat.imagen}" alt="">
        <span class="total">${total} ${total === 1 ? 'producto' : 'productos'}</span>
        <span class="circulo">${ICONOS.flecha}</span>
        <div class="panel">
          <h3>${cat.titulo}</h3>
          <p>${cat.texto}</p>
        </div>
      </a>`;
  }).join('');
}

function iniciarDestacados() {
  const zona = document.querySelector('.destacados');
  if (!zona) return;
  zona.innerHTML = PRODUCTOS.filter(p => p.destacado).slice(0, 4).map(tarjetaProducto).join('');
}

function iniciarAparicion() {
  const elementos = document.querySelectorAll('.tarjeta, .look, .destacados .producto, .bloque-interno, .aviso-interno, .tienda-enlace, .integracion');
  if (!elementos.length) return;
  const observador = new IntersectionObserver(entradas => {
    entradas.forEach(entrada => {
      if (!entrada.isIntersecting) return;
      entrada.target.classList.add('visible');
      setTimeout(() => { entrada.target.style.transitionDelay = ''; }, 1400);
      observador.unobserve(entrada.target);
    });
  }, { threshold: 0.15 });
  elementos.forEach((el, i) => {
    el.classList.add('oculta');
    el.style.transitionDelay = `${(i % 3) * 110}ms`;
    observador.observe(el);
  });
}

function iniciarFiltrosGaleria() {
  const galeria = document.querySelector('.galeria-pagina');
  const botones = [...document.querySelectorAll('[data-filtro-galeria]')];
  const resultado = document.querySelector('[data-galeria-resultado]');
  if (!galeria || !botones.length || !resultado) return;

  const tarjetas = [...galeria.querySelectorAll('.look')];
  const cuidadoFacial = /medicube|anua|mixsoon|celimax|skin1004|beauty of joseon|tocobo/i;
  const categorias = new Map(tarjetas.map(tarjeta => {
    const imagen = tarjeta.querySelector('img');
    const ruta = imagen.getAttribute('src');
    const texto = `${tarjeta.querySelector('.look-titulo').textContent} ${tarjeta.dataset.galeriaDetalle} ${imagen.alt}`;
    const asignadas = new Set();

    if (ruta.startsWith('media/looks/') || ruta.startsWith('media/Local/')) asignadas.add('looks');
    if (ruta.startsWith('media/productos/') || ruta.startsWith('media/carrusel/')) asignadas.add('productos');
    if (cuidadoFacial.test(texto)) {
      asignadas.add('cuidado-facial');
      asignadas.add('productos');
    }
    if (/\bnovia(s)?\b/i.test(texto)) {
      asignadas.add('novias');
      asignadas.add('looks');
    }
    return [tarjeta, asignadas];
  }));

  function filtrar(filtro) {
    let visibles = 0;
    tarjetas.forEach(tarjeta => {
      const mostrar = filtro === 'todos' || categorias.get(tarjeta).has(filtro);
      tarjeta.hidden = !mostrar;
      if (mostrar) visibles += 1;
    });

    botones.forEach(boton => {
      boton.setAttribute('aria-pressed', String(boton.dataset.filtroGaleria === filtro));
    });
    resultado.textContent = filtro === 'todos'
      ? `Mostrando las ${visibles} fotos`
      : `Mostrando ${visibles} ${visibles === 1 ? 'foto' : 'fotos'}`;
  }

  botones.forEach(boton => {
    const filtro = boton.dataset.filtroGaleria;
    const cantidad = filtro === 'todos'
      ? tarjetas.length
      : tarjetas.filter(tarjeta => categorias.get(tarjeta).has(filtro)).length;
    boton.querySelector('[data-filtro-conteo]').textContent = cantidad;
    boton.addEventListener('click', () => filtrar(filtro));
  });

  filtrar('todos');
}

function iniciarGaleria() {
  const tarjetas = [...document.querySelectorAll('.look[data-galeria-detalle]')];
  const dialogo = document.querySelector('.galeria-detalle');
  if (!tarjetas.length || !dialogo) return;

  const imagen = dialogo.querySelector('.galeria-imagen');
  const video = dialogo.querySelector('.galeria-video');
  const titulo = dialogo.querySelector('.galeria-titulo');
  const texto = dialogo.querySelector('.galeria-texto');
  const contador = dialogo.querySelector('.galeria-contador');
  let actual = 0;

  function mostrar(indice) {
    actual = (indice + tarjetas.length) % tarjetas.length;
    const tarjeta = tarjetas[actual];
    const foto = tarjeta.querySelector('img');
    const fuenteVideo = tarjeta.dataset.video;

    video.pause();
    video.removeAttribute('src');
    video.hidden = !fuenteVideo;
    video.load();
    imagen.hidden = Boolean(fuenteVideo);
    if (fuenteVideo) {
      video.src = fuenteVideo;
      video.muted = true;
      video.play().catch(() => {});
    } else {
      imagen.src = foto.src;
      imagen.alt = foto.alt;
    }

    titulo.textContent = tarjeta.querySelector('.look-titulo').textContent;
    texto.textContent = tarjeta.dataset.galeriaDetalle;
    contador.textContent = `${actual + 1} / ${tarjetas.length}`;
  }

  tarjetas.forEach((tarjeta, indice) => {
    tarjeta.addEventListener('click', () => {
      mostrar(indice);
      dialogo.showModal();
    });
    tarjeta.addEventListener('pointerenter', () => {
      if (!tarjeta.dataset.video || !matchMedia('(hover: hover)').matches) return;
      let vistaPrevia = tarjeta.querySelector('.look-preview');
      if (!vistaPrevia) {
        vistaPrevia = document.createElement('video');
        vistaPrevia.className = 'look-preview';
        vistaPrevia.muted = true;
        vistaPrevia.loop = true;
        vistaPrevia.playsInline = true;
        tarjeta.prepend(vistaPrevia);
      }
      vistaPrevia.src = tarjeta.dataset.video;
      vistaPrevia.play().catch(() => {});
    });
    tarjeta.addEventListener('pointerleave', () => {
      const vistaPrevia = tarjeta.querySelector('.look-preview');
      if (vistaPrevia) vistaPrevia.pause();
    });
  });

  dialogo.querySelector('.x').addEventListener('click', () => dialogo.close());
  dialogo.querySelector('.galeria-anterior').addEventListener('click', () => mostrar(actual - 1));
  dialogo.querySelector('.galeria-siguiente').addEventListener('click', () => mostrar(actual + 1));
  dialogo.addEventListener('click', e => {
    if (e.target === dialogo) dialogo.close();
  });
  dialogo.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      e.preventDefault();
      dialogo.close();
      return;
    }
    if (e.key === 'ArrowLeft') mostrar(actual - 1);
    if (e.key === 'ArrowRight') mostrar(actual + 1);
  });
  dialogo.addEventListener('close', () => {
    video.pause();
    video.removeAttribute('src');
    video.load();
  });
}

function iniciarCarrusel() {
  const carrusel = document.querySelector('.carrusel');
  if (!carrusel) return;

  const slides = [...carrusel.querySelectorAll('.slide')];
  const contenedorPuntos = carrusel.querySelector('.puntos');
  const botonPausa = carrusel.querySelector('.pausa');
  const contador = carrusel.querySelector('.contador');
  const DURACION = 7000;
  let actual = 0;
  let pausado = false;
  let transcurrido = 0;
  let ultimo = performance.now();

  const puntos = slides.map((_, i) => {
    const punto = document.createElement('button');
    punto.className = 'punto';
    punto.setAttribute('aria-label', `Ir a la diapositiva ${i + 1}`);
    punto.addEventListener('click', () => ir(i));
    contenedorPuntos.append(punto);
    return punto;
  });

  const video = slide => slide.querySelector('video');

  function ir(indice) {
    const nuevo = (indice + slides.length) % slides.length;
    slides.forEach((slide, i) => {
      slide.classList.toggle('activa', i === nuevo);
      if (i !== nuevo && video(slide)) video(slide).pause();
    });
    actual = nuevo;
    transcurrido = 0;
    const v = video(slides[actual]);
    if (v && !pausado) {
      v.currentTime = 0;
      v.play().catch(() => {});
    }
    puntos.forEach((punto, i) => punto.style.setProperty('--p', i < actual ? 1 : 0));
    contador.textContent = `${actual + 1} / ${slides.length}`;
  }

  function alternarPausa() {
    pausado = !pausado;
    carrusel.classList.toggle('pausado', pausado);
    botonPausa.innerHTML = pausado ? ICONOS.play : ICONOS.pausa;
    botonPausa.setAttribute('aria-label', pausado ? 'Reanudar' : 'Pausar');
    const v = video(slides[actual]);
    if (v) pausado ? v.pause() : v.play().catch(() => {});
  }

  function ciclo(ahora) {
    const dt = Math.min(ahora - ultimo, 100);
    ultimo = ahora;
    if (!pausado) {
      transcurrido += dt;
      puntos[actual].style.setProperty('--p', Math.min(transcurrido / DURACION, 1));
      if (transcurrido >= DURACION) ir(actual + 1);
    }
    requestAnimationFrame(ciclo);
  }

  carrusel.querySelector('.anterior').addEventListener('click', () => ir(actual - 1));
  carrusel.querySelector('.siguiente').addEventListener('click', () => ir(actual + 1));
  botonPausa.addEventListener('click', alternarPausa);
  botonPausa.innerHTML = ICONOS.pausa;

  let inicioX = null;
  carrusel.addEventListener('pointerdown', e => { inicioX = e.clientX; });
  carrusel.addEventListener('pointerup', e => {
    if (inicioX === null) return;
    const distancia = e.clientX - inicioX;
    inicioX = null;
    if (Math.abs(distancia) > 50) ir(actual + (distancia < 0 ? 1 : -1));
  });
  carrusel.setAttribute('tabindex', '0');
  carrusel.addEventListener('keydown', e => {
    if (e.key === 'ArrowRight') ir(actual + 1);
    if (e.key === 'ArrowLeft') ir(actual - 1);
  });

  ir(0);
  requestAnimationFrame(ciclo);
}

function iniciarInclinacion() {
  if (!matchMedia('(hover: hover)').matches) return;
  document.querySelectorAll('.tarjeta').forEach(tarjeta => {
    tarjeta.addEventListener('pointermove', e => {
      const caja = tarjeta.getBoundingClientRect();
      const x = (e.clientX - caja.left) / caja.width - 0.5;
      const y = (e.clientY - caja.top) / caja.height - 0.5;
      tarjeta.style.setProperty('--ry', `${x * 8}deg`);
      tarjeta.style.setProperty('--rx', `${-y * 8}deg`);
    });
    tarjeta.addEventListener('pointerleave', () => {
      tarjeta.style.setProperty('--rx', '0deg');
      tarjeta.style.setProperty('--ry', '0deg');
    });
  });
}

function iniciarIntro(alTerminar) {
  const telon = document.querySelector('.telon');
  let visto = matchMedia('(prefers-reduced-motion: reduce)').matches;
  try { visto = visto || sessionStorage.getItem('intro') === '1'; } catch (e) {}
  if (!telon || visto) {
    if (telon) telon.remove();
    document.body.classList.add('listo');
    alTerminar();
    return;
  }
  try { sessionStorage.setItem('intro', '1'); } catch (e) {}
  setTimeout(() => {
    telon.classList.add('salida');
    document.body.classList.add('listo');
    alTerminar();
    setTimeout(() => telon.remove(), 1400);
  }, 1700);
}

iniciarGeneral();
iniciarCategorias();
iniciarDestacados();
iniciarReserva();
iniciarFiltrosGaleria();
iniciarAparicion();
iniciarGaleria();
iniciarInclinacion();
ocultarImagenesRotas();
iniciarIntro(iniciarCarrusel);
