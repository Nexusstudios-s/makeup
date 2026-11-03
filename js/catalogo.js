const parametros = new URLSearchParams(location.search);
const clave = parametros.get('c');
const abrirId = parametros.get('p');
const categoria = CATEGORIAS[clave];

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
  const colores = CATEGORIAS[producto.categoria].colores;
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

if (!categoria) {
  document.querySelector('.chips').remove();
  document.querySelector('.barra-filtros').remove();
  encabezado.innerHTML = '<div><h1>Categoría no encontrada</h1><p class="intro">Elige una de nuestras categorías desde el inicio.</p><a class="boton" href="/#categorias">Ver categorías</a></div>';
} else {
  document.title = `${categoria.titulo} · ${MARCA_COMPLETA}`;
  encabezado.style.setProperty('--a', categoria.colores[0]);
  encabezado.style.setProperty('--b', categoria.colores[1]);
  encabezado.querySelector('h1').textContent = categoria.titulo;
  encabezado.querySelector('.intro').textContent = categoria.texto;

  document.querySelector('.chips').innerHTML = Object.entries(CATEGORIAS)
    .filter(([, c]) => c.publicado !== false)
    .map(([k, c]) => `<a class="chip${k === clave ? ' activo' : ''}" href="/categoria?c=${k}">${c.titulo}</a>`)
    .join('');

  buscador.addEventListener('input', pintar);
  selector.addEventListener('change', pintar);

  rejilla.addEventListener('click', e => {
    const tarjeta = e.target.closest('[data-id]');
    if (!tarjeta) return;
    e.preventDefault();
    abrirDetalle(PRODUCTOS.find(p => p.id === tarjeta.dataset.id));
  });

  pintar();

  const pedido = PRODUCTOS.find(p => p.id === abrirId);
  if (pedido) abrirDetalle(pedido);
}

window.actualizarCatalogoFirebase = () => {
  const categoriaActual = CATEGORIAS[clave];
  if (!categoriaActual || categoriaActual.publicado === false) return;
  document.title = `${categoriaActual.titulo} · ${MARCA_COMPLETA}`;
  encabezado.style.setProperty('--a', categoriaActual.colores[0]);
  encabezado.style.setProperty('--b', categoriaActual.colores[1]);
  encabezado.querySelector('h1').textContent = categoriaActual.titulo;
  encabezado.querySelector('.intro').textContent = categoriaActual.texto;
  document.querySelector('.chips').innerHTML = Object.entries(CATEGORIAS)
    .filter(([, cat]) => cat.publicado !== false)
    .map(([k, cat]) => `<a class="chip${k === clave ? ' activo' : ''}" href="/categoria?c=${k}">${cat.titulo}</a>`)
    .join('');
  pintar();
};
