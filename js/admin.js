import { onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js';
import { addDoc, collection, deleteDoc, doc, getDoc, getDocs, increment, runTransaction, serverTimestamp, setDoc, updateDoc, writeBatch } from 'https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js';
import { auth, db } from './firebase-client.js';

const guard = document.querySelector('[data-admin-guard]');
const panel = document.querySelector('[data-admin-panel]');
const roleBadge = document.querySelector('[data-admin-role]');
const status = document.querySelector('[data-admin-status]');
const userSelects = document.querySelectorAll('[data-user-select]');
const usersList = document.querySelector('[data-users-list]');
const reservationsList = document.querySelector('[data-reservas-list]');
const festivitiesList = document.querySelector('[data-festivities-list]');
const supportChatsList = document.querySelector('[data-support-chats-list]');
const productReviewsList = document.querySelector('[data-product-reviews-list]');
const pendingReviewsCount = document.querySelector('[data-pending-reviews]');
const globalNotificationsList = document.querySelector('[data-global-notifications-list]');
const productsList = document.querySelector('[data-products-list]');
const categoriesList = document.querySelector('[data-categories-list]');
const announcementsList = document.querySelector('[data-announcements-list]');
const productCategorySelect = document.querySelector('[data-product-category-select]');
const productPreview = document.querySelector('[data-product-preview]');
const localProductsList = document.querySelector('[data-local-products-list]');
const localCarouselList = document.querySelector('[data-local-carousel-list]');
const customCarouselList = document.querySelector('[data-custom-carousel-list]');
const carouselForm = document.querySelector('[data-carousel-form]');
const carouselPreview = document.querySelector('[data-carousel-preview]');
const exampleForm = document.querySelector('[data-example-form]');
const examplePreview = document.querySelector('[data-example-preview]');
const localExamplesList = document.querySelector('[data-local-examples-list]');
const customExamplesList = document.querySelector('[data-custom-examples-list]');
const festivityForm = document.querySelector('[data-festivity-form]');
const festivityPreview = document.querySelector('[data-festivity-preview]');
const festivityPreviewImage = document.querySelector('[data-festivity-preview-image]');
const PAGE_LABELS = {
  'index.html': 'Inicio',
  'categoria.html': 'Catálogo',
  'Ejemplos.html': 'Looks',
  'Conexiones.html': 'Conexiones',
  'Condiciones-Venta.html': 'Condiciones de venta',
  'Terminos-Condiciones.html': 'Términos'
};
let siteVisibility = {
  hiddenLocalSlides: [],
  hiddenLocalProducts: [],
  snowfallEnabled: false,
  pumpkinFallEnabled: false
};
let localCarouselSlides = [];
let customCarouselSlides = [];
let localExamples = [];
let customExamples = [];

function setStatus(mensaje, error = false) {
  status.textContent = mensaje;
  status.style.color = error ? '#b14848' : '#477a5b';
}

function activarVistaAdmin(view) {
  document.querySelectorAll('[data-admin-view]').forEach(button => {
    const active = button.dataset.adminView === view;
    button.classList.toggle('activo', active);
    button.setAttribute('aria-current', active ? 'page' : 'false');
  });
  document.querySelectorAll('[data-admin-section]').forEach(section => {
    section.hidden = section.dataset.adminSection !== view;
  });
}

function actualizarResumenAdmin() {
  const counts = {
    users: usersList.querySelectorAll(':scope > .admin-user-row').length,
    reservations: reservationsList.querySelectorAll(':scope > .admin-row').length,
    products: productsList.querySelectorAll(':scope > .admin-row').length,
    festivities: festivitiesList.querySelectorAll(':scope > .admin-row').length
  };
  document.querySelector('[data-stat-users]').textContent = String(counts.users);
  document.querySelector('[data-stat-reservations]').textContent = String(counts.reservations);
  document.querySelector('[data-stat-products]').textContent = String(counts.products);
  document.querySelector('[data-stat-festivities]').textContent = String(counts.festivities);
}

document.querySelectorAll('[data-admin-view]').forEach(button => {
  button.addEventListener('click', () => activarVistaAdmin(button.dataset.adminView));
});
document.querySelectorAll('[data-admin-shortcut]').forEach(button => {
  button.addEventListener('click', () => activarVistaAdmin(button.dataset.adminShortcut));
});
document.querySelector('[data-admin-today]').textContent = new Intl.DateTimeFormat('es-CO', {
  weekday: 'long', day: 'numeric', month: 'long'
}).format(new Date());

function actualizarPreviewFestividad() {
  if (!festivityForm || !festivityPreview) return;
  const file = festivityForm.imageFile.files[0];
  const image = file ? festivityForm.dataset.previewObjectUrl : (festivityForm.imageUrl.value.trim() || festivityForm.dataset.currentImage || '');
  festivityPreviewImage.hidden = !image;
  if (image) festivityPreviewImage.src = image;
  ['left', 'top', 'size', 'rotate'].forEach(name => {
    const value = Number(festivityForm.elements[name].value);
    festivityPreviewImage.style[name === 'left' ? 'left' : name === 'top' ? 'top' : name === 'size' ? 'width' : 'transform'] =
      name === 'left' || name === 'top' ? `${value}%` : name === 'size' ? `${value}%` : `rotate(${value}deg)`;
    const output = document.querySelector(`[data-festivity-output="${name}"]`);
    if (output) output.value = `${value}${name === 'rotate' ? '°' : '%'}`;
  });
  festivityPreview.dataset.location = festivityForm.location.value;
  const pages = [...festivityForm.querySelectorAll('[name="pages"]:checked')].map(input => input.value);
  document.querySelector('[data-festivity-preview-page]').textContent = pages.map(page => PAGE_LABELS[page]).join(', ') || 'Sin páginas';
}

function leerImagenArchivo(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('No se pudo leer la imagen.'));
    reader.readAsDataURL(file);
  });
}

function limitarPorcentaje(value) {
  return Math.min(100, Math.max(0, value));
}

festivityForm.querySelectorAll('input, select').forEach(input => {
  input.addEventListener(input.type === 'checkbox' || input.tagName === 'SELECT' || input.type === 'file' ? 'change' : 'input', actualizarPreviewFestividad);
});
festivityForm.imageUrl.addEventListener('input', () => {
  delete festivityForm.dataset.currentImage;
  festivityForm.imageFile.value = '';
  if (festivityForm.dataset.previewObjectUrl) URL.revokeObjectURL(festivityForm.dataset.previewObjectUrl);
  delete festivityForm.dataset.previewObjectUrl;
  actualizarPreviewFestividad();
});
festivityForm.imageFile.addEventListener('change', () => {
  if (festivityForm.dataset.previewObjectUrl) URL.revokeObjectURL(festivityForm.dataset.previewObjectUrl);
  const file = festivityForm.imageFile.files[0];
  if (file) {
    festivityForm.imageUrl.value = '';
    delete festivityForm.dataset.currentImage;
    festivityForm.dataset.previewObjectUrl = URL.createObjectURL(file);
  }
  actualizarPreviewFestividad();
});
festivityPreview.addEventListener('pointerdown', event => {
  if (!festivityPreviewImage || festivityPreviewImage.hidden) return;
  festivityPreview.setPointerCapture(event.pointerId);
  const bounds = festivityPreview.getBoundingClientRect();
  festivityForm.left.value = String(Math.round(limitarPorcentaje(((event.clientX - bounds.left) / bounds.width) * 100)));
  festivityForm.top.value = String(Math.round(limitarPorcentaje(((event.clientY - bounds.top) / bounds.height) * 100)));
  actualizarPreviewFestividad();
});
festivityPreview.addEventListener('pointermove', event => {
  if (!festivityPreview.hasPointerCapture(event.pointerId)) return;
  const bounds = festivityPreview.getBoundingClientRect();
  festivityForm.left.value = String(Math.round(limitarPorcentaje(((event.clientX - bounds.left) / bounds.width) * 100)));
  festivityForm.top.value = String(Math.round(limitarPorcentaje(((event.clientY - bounds.top) / bounds.height) * 100)));
  actualizarPreviewFestividad();
});
actualizarPreviewFestividad();

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function renderPreviewImage(imageUrl, altText = 'Vista previa') {
  if (!imageUrl) return '';
  return `<img class="admin-preview-image" src="${escapeHtml(imageUrl)}" alt="${escapeHtml(altText)}">`;
}

function renderProductCategoryOptions(categories) {
  if (!productCategorySelect) return;
  const selected = productCategorySelect.value;
  const options = new Map();
  Object.entries(window.catalogoLocal?.categorias || {}).forEach(([id, category]) => options.set(id, category.titulo || id));
  categories.forEach(category => {
    if (category.id) options.set(category.id, category.titulo || category.id);
  });
  productCategorySelect.innerHTML = [...options.entries()]
    .map(([id, title]) => `<option value="${escapeHtml(id)}">${escapeHtml(title)} · ${escapeHtml(id)}</option>`)
    .join('');
  if (selected && options.has(selected)) productCategorySelect.value = selected;
}

renderProductCategoryOptions([]);

async function comprimirImagenProducto(file) {
  if (!file.type.startsWith('image/')) throw new Error('El archivo seleccionado no es una imagen.');
  if (file.size > 20 * 1024 * 1024) throw new Error('La imagen debe pesar menos de 20 MB antes de subirla.');
  const bitmap = await createImageBitmap(file);
  const escala = Math.min(1, 1200 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(bitmap.width * escala));
  canvas.height = Math.max(1, Math.round(bitmap.height * escala));
  canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();

  for (const calidad of [0.82, 0.72, 0.62, 0.52, 0.42]) {
    const dataUrl = canvas.toDataURL('image/jpeg', calidad);
    if (dataUrl.length <= 850000) return dataUrl;
  }
  throw new Error('Esta imagen no se puede comprimir lo suficiente para guardarla en Firestore. Prueba con una foto más pequeña.');
}

function mostrarVistaPreviaProducto(src, nombre = 'Vista previa del producto') {
  if (!productPreview) return;
  if (!src) {
    productPreview.hidden = true;
    productPreview.replaceChildren();
    return;
  }
  productPreview.hidden = false;
  productPreview.innerHTML = `${renderPreviewImage(src, nombre)}<span>Vista previa</span>`;
}

function showCustomPrompt({
  title = 'Escribe algo',
  message = '',
  placeholder = '',
  defaultValue = '',
  confirmText = 'Guardar',
  onConfirm
}) {
  const dialog = document.createElement('dialog');
  dialog.className = 'dialogo-premium';
  dialog.innerHTML = `
    <div class="dialogo-premium__contenido">
      <div class="dialogo-premium__header">
        <span class="dialogo-premium__eyebrow">Acción</span>
        <button class="x" type="button" aria-label="Cerrar">×</button>
      </div>
      <h3>${escapeHtml(title)}</h3>
      <p>${escapeHtml(message)}</p>
      <label class="admin-form">
        <textarea rows="4" placeholder="${escapeHtml(placeholder)}">${escapeHtml(defaultValue)}</textarea>
      </label>
      <div class="dialogo-premium__acciones">
        <button class="boton claro" type="button" data-dialog-cancel>Cancelar</button>
        <button class="boton" type="button" data-dialog-confirm>${escapeHtml(confirmText)}</button>
      </div>
    </div>
  `;

  document.body.appendChild(dialog);
  const textarea = dialog.querySelector('textarea');

  const close = () => {
    dialog.close();
    dialog.remove();
  };

  dialog.querySelector('.x').addEventListener('click', close);
  dialog.querySelector('[data-dialog-cancel]').addEventListener('click', close);
  dialog.querySelector('[data-dialog-confirm]').addEventListener('click', () => {
    const value = textarea.value.trim();
    close();
    onConfirm?.(value);
  });

  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) close();
  });

  dialog.showModal();
  textarea.focus();
}

function slugify(texto) {
  return texto.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80) || 'item';
}

function parseJsonArray(valor, fallback = []) {
  if (!valor || !String(valor).trim()) return fallback;
  try {
    const parsed = JSON.parse(valor);
    return Array.isArray(parsed) ? parsed : fallback;
  } catch {
    return fallback;
  }
}

function parseLineList(value) {
  const text = String(value || '').trim();
  if (!text) return [];
  try {
    const parsed = JSON.parse(text);
    if (Array.isArray(parsed)) return parsed.map(item => String(item).trim()).filter(Boolean);
  } catch {
    // Older product details may already be stored as plain text.
  }
  return text.split(/\r?\n/).map(item => item.trim()).filter(Boolean);
}

function renderUsers(users) {
  window.__adminUsers = users;
  const options = users.map(user => `<option value="${escapeHtml(user.uid)}">${escapeHtml(user.email || user.displayName || user.uid)}</option>`).join('');
  userSelects.forEach(select => {
    select.innerHTML = options || '<option value="">Sin usuarios</option>';
  });

  usersList.innerHTML = users.length
    ? users.map(user => `
      <article class="admin-user-row">
        <div>
          <strong>${escapeHtml(user.displayName || 'Sin nombre')}</strong>
          <small>${escapeHtml(user.email || user.uid)}</small>
        </div>
      </article>`).join('')
    : '<p>No hay perfiles guardados. Aparecerán cuando las cuentas vuelvan a iniciar sesión.</p>';
  actualizarResumenAdmin();
}

function renderList(container, items, renderItem, emptyText) {
  if (!container) return;
  if (!items.length) {
    container.innerHTML = `<p>${emptyText}</p>`;
    return;
  }
  container.innerHTML = items.map(renderItem).join('');
}

async function leerSlidesLocales() {
  const response = await fetch('/index.html');
  if (!response.ok) throw new Error('No pudimos leer las diapositivas originales.');
  const page = new DOMParser().parseFromString(await response.text(), 'text/html');
  return [...page.querySelectorAll('.carrusel .slide[data-slide-id]')].map(slide => ({
    id: slide.dataset.slideId,
    imageUrl: slide.querySelector('img')?.getAttribute('src') || '',
    title: [...slide.querySelectorAll('.titular span')].map(span => span.textContent.trim()).join('\n'),
    body: slide.querySelector('.sub')?.textContent.trim() || '',
    link: slide.querySelector('.texto a')?.getAttribute('href') || '',
    linkLabel: slide.querySelector('.texto a')?.textContent.trim() || ''
  }));
}

async function leerEjemplosLocales() {
  const response = await fetch('/Ejemplos.html');
  if (!response.ok) throw new Error('No pudimos leer las fotos originales de Ejemplos.');
  const page = new DOMParser().parseFromString(await response.text(), 'text/html');
  return [...page.querySelectorAll('.galeria-pagina .look')].map(card => {
    const image = card.querySelector('img');
    const imageUrl = image?.getAttribute('src') || '';
    return {
      id: `local:${imageUrl}`,
      imageUrl,
      title: card.querySelector('.look-titulo')?.textContent.trim() || image?.alt || 'Ejemplo',
      description: card.dataset.galeriaDetalle || image?.alt || '',
      category: card.dataset.galeriaCategoria || ''
    };
  });
}

async function guardarVisibilidad(updates) {
  siteVisibility = { ...siteVisibility, ...updates };
  await setDoc(doc(db, 'siteSettings', 'visibility'), { ...siteVisibility, updatedAt: Date.now() }, { merge: true });
}

document.querySelectorAll('[data-seasonal-effect]').forEach(input => {
  input.addEventListener('change', async () => {
    const key = input.dataset.seasonalEffect;
    const previousValue = !input.checked;
    input.disabled = true;
    try {
      await guardarVisibilidad({ [key]: input.checked });
      setStatus(input.checked ? 'Efecto activado en toda la web.' : 'Efecto desactivado en toda la web.');
    } catch (error) {
      input.checked = previousValue;
      setStatus(error.message || 'No se pudo guardar el efecto.', true);
    } finally {
      input.disabled = false;
    }
  });
});

function renderLocalProducts() {
  const productos = window.catalogoLocal?.productos || [];
  const ocultos = new Set(siteVisibility.hiddenLocalProducts);
  renderList(localProductsList, productos, item => `
    <article class="admin-row preview-row">
      <div class="admin-preview">
        ${renderPreviewImage(item.imagen, item.nombre)}
        <div class="admin-preview-copy"><strong>${escapeHtml(item.nombre)}</strong><small>${escapeHtml(item.categoria || 'Sin categoría')}</small></div>
      </div>
      <button class="boton ${ocultos.has(item.id) ? '' : 'claro'}" type="button" data-toggle-local-product="${escapeHtml(item.id)}">${ocultos.has(item.id) ? 'Mostrar' : 'Ocultar'}</button>
    </article>
  `, 'No hay productos locales en el código.');
  localProductsList.querySelectorAll('[data-toggle-local-product]').forEach(button => {
    button.addEventListener('click', async () => {
      const hidden = new Set(siteVisibility.hiddenLocalProducts);
      hidden.has(button.dataset.toggleLocalProduct) ? hidden.delete(button.dataset.toggleLocalProduct) : hidden.add(button.dataset.toggleLocalProduct);
      try {
        await guardarVisibilidad({ hiddenLocalProducts: [...hidden] });
        renderLocalProducts();
        setStatus('Visibilidad del producto actualizada para todos.');
      } catch (error) {
        setStatus(error.message || 'No se pudo actualizar el producto.', true);
      }
    });
  });
}

function mostrarPreviewCarrusel(src) {
  if (!src) {
    carouselPreview.hidden = true;
    carouselPreview.replaceChildren();
    return;
  }
  carouselPreview.hidden = false;
  carouselPreview.innerHTML = `${renderPreviewImage(src, carouselForm.elements.title.value || 'Vista previa del carrusel')}<span>${escapeHtml(carouselForm.elements.title.value || 'Vista previa')}</span>`;
}

async function refreshCarousel() {
  try {
    const [visibilitySnap, customSnap, slidesLocales] = await Promise.all([
      getDoc(doc(db, 'siteSettings', 'visibility')),
      getDocs(collection(db, 'carouselSlides')),
      leerSlidesLocales()
    ]);
    const data = visibilitySnap.exists() ? visibilitySnap.data() : {};
    siteVisibility = {
      hiddenLocalSlides: Array.isArray(data.hiddenLocalSlides) ? data.hiddenLocalSlides : [],
      hiddenLocalProducts: Array.isArray(data.hiddenLocalProducts) ? data.hiddenLocalProducts : [],
      hiddenLocalExamples: Array.isArray(data.hiddenLocalExamples) ? data.hiddenLocalExamples : [],
      snowfallEnabled: data.snowfallEnabled === true,
      pumpkinFallEnabled: data.pumpkinFallEnabled === true
    };
    document.querySelectorAll('[data-seasonal-effect]').forEach(input => {
      input.checked = siteVisibility[input.dataset.seasonalEffect] === true;
    });
    localCarouselSlides = slidesLocales;
    customCarouselSlides = customSnap.docs.map(documento => ({ id: documento.id, ...documento.data() }));
    const ocultas = new Set(siteVisibility.hiddenLocalSlides);
    renderList(localCarouselList, localCarouselSlides, item => `
      <article class="admin-row preview-row">
        <div class="admin-preview">
          ${renderPreviewImage(item.imageUrl, item.title)}
          <div class="admin-preview-copy"><strong>${escapeHtml(item.title)}</strong><small>${escapeHtml(item.body)}</small></div>
        </div>
        <button class="boton ${ocultas.has(item.id) ? '' : 'claro'}" type="button" data-toggle-local-slide="${escapeHtml(item.id)}">${ocultas.has(item.id) ? 'Mostrar' : 'Ocultar'}</button>
      </article>
    `, 'No hay diapositivas originales.');
    renderList(customCarouselList, customCarouselSlides, item => `
      <article class="admin-row preview-row">
        <div class="admin-preview">
          ${renderPreviewImage(item.imageUrl, item.title)}
          <div class="admin-preview-copy"><strong>${escapeHtml(item.title)}</strong><small>${escapeHtml(item.body)} · ${item.published ? 'Publicada' : 'Oculta'}</small></div>
        </div>
        <div class="row-actions"><button class="boton claro" type="button" data-edit-carousel="${escapeHtml(item.id)}">Editar</button><button class="boton claro" type="button" data-delete-carousel="${escapeHtml(item.id)}">Eliminar</button></div>
      </article>
    `, 'Todavía no agregas fotos al carrusel.');

    localCarouselList.querySelectorAll('[data-toggle-local-slide]').forEach(button => {
      button.addEventListener('click', async () => {
        const hidden = new Set(siteVisibility.hiddenLocalSlides);
        hidden.has(button.dataset.toggleLocalSlide) ? hidden.delete(button.dataset.toggleLocalSlide) : hidden.add(button.dataset.toggleLocalSlide);
        try {
          await guardarVisibilidad({ hiddenLocalSlides: [...hidden] });
          await refreshCarousel();
          setStatus('Visibilidad de la diapositiva actualizada para todos.');
        } catch (error) {
          setStatus(error.message || 'No se pudo actualizar la diapositiva.', true);
        }
      });
    });
    customCarouselList.querySelectorAll('[data-edit-carousel]').forEach(button => {
      button.addEventListener('click', () => {
        const item = customCarouselSlides.find(slide => slide.id === button.dataset.editCarousel);
        if (!item) return;
        carouselForm.elements.title.value = item.title || '';
        carouselForm.elements.body.value = item.body || '';
        const dataImage = item.imageUrl?.startsWith('data:image/');
        carouselForm.elements.imageUrl.value = dataImage ? '' : (item.imageUrl || '');
        carouselForm.dataset.currentImage = item.imageUrl || '';
        carouselForm.elements.link.value = item.link || '';
        carouselForm.elements.linkLabel.value = item.linkLabel || '';
        carouselForm.elements.published.checked = Boolean(item.published);
        carouselForm.dataset.editingId = item.id;
        mostrarPreviewCarrusel(item.imageUrl);
        carouselForm.scrollIntoView({ behavior: 'smooth', block: 'center' });
      });
    });
    customCarouselList.querySelectorAll('[data-delete-carousel]').forEach(button => {
      button.addEventListener('click', async () => {
        try {
          await deleteDoc(doc(db, 'carouselSlides', button.dataset.deleteCarousel));
          await refreshCarousel();
          setStatus('Diapositiva eliminada.');
        } catch (error) {
          setStatus(error.message || 'No se pudo eliminar la diapositiva.', true);
        }
      });
    });
    renderLocalProducts();
  } catch (error) {
    localCarouselList.innerHTML = `<p class="admin-error">No se pudo cargar el carrusel: ${escapeHtml(error.message || 'Error desconocido')}</p>`;
  }
}

async function refreshExamples() {
  try {
    const [visibilitySnap, examplesSnap, originals] = await Promise.all([
      getDoc(doc(db, 'siteSettings', 'visibility')),
      getDocs(collection(db, 'examples')),
      leerEjemplosLocales()
    ]);
    const visibility = visibilitySnap.exists() ? visibilitySnap.data() : {};
    siteVisibility.hiddenLocalExamples = Array.isArray(visibility.hiddenLocalExamples) ? visibility.hiddenLocalExamples : [];
    localExamples = originals;
    customExamples = examplesSnap.docs.map(documento => ({ id: documento.id, ...documento.data() }));
    const ocultos = new Set(siteVisibility.hiddenLocalExamples);

    renderList(localExamplesList, localExamples, item => `
      <article class="admin-row preview-row">
        <div class="admin-preview">${renderPreviewImage(item.imageUrl, item.title)}<div class="admin-preview-copy"><strong>${escapeHtml(item.title)}</strong><small>${escapeHtml(item.description)}</small></div></div>
        <button class="boton ${ocultos.has(item.id) ? '' : 'claro'}" type="button" data-toggle-local-example="${escapeHtml(item.id)}">${ocultos.has(item.id) ? 'Mostrar' : 'Ocultar'}</button>
      </article>
    `, 'No hay ejemplos originales.');
    renderList(customExamplesList, customExamples, item => `
      <article class="admin-row preview-row">
        <div class="admin-preview">${renderPreviewImage(item.imageUrl, item.title)}<div class="admin-preview-copy"><strong>${escapeHtml(item.title)}</strong><small>${escapeHtml(item.description)} · ${item.published ? 'Visible' : 'Oculto'}</small></div></div>
        <div class="row-actions"><button class="boton claro" type="button" data-edit-example="${escapeHtml(item.id)}">Editar</button><button class="boton claro" type="button" data-delete-example="${escapeHtml(item.id)}">Eliminar</button></div>
      </article>
    `, 'Todavía no agregas ejemplos.');

    localExamplesList.querySelectorAll('[data-toggle-local-example]').forEach(button => {
      button.addEventListener('click', async () => {
        const hidden = new Set(siteVisibility.hiddenLocalExamples);
        hidden.has(button.dataset.toggleLocalExample) ? hidden.delete(button.dataset.toggleLocalExample) : hidden.add(button.dataset.toggleLocalExample);
        try {
          await guardarVisibilidad({ hiddenLocalExamples: [...hidden] });
          await refreshExamples();
          setStatus('Visibilidad del ejemplo actualizada para todos.');
        } catch (error) {
          setStatus(error.message || 'No se pudo actualizar el ejemplo.', true);
        }
      });
    });
    customExamplesList.querySelectorAll('[data-edit-example]').forEach(button => {
      button.addEventListener('click', () => {
        const item = customExamples.find(example => example.id === button.dataset.editExample);
        if (!item) return;
        exampleForm.elements.title.value = item.title || '';
        exampleForm.elements.description.value = item.description || '';
        const dataImage = item.imageUrl?.startsWith('data:image/');
        exampleForm.elements.imageUrl.value = dataImage ? '' : (item.imageUrl || '');
        exampleForm.dataset.currentImage = item.imageUrl || '';
        exampleForm.elements.category.value = item.category || 'looks';
        exampleForm.elements.published.checked = Boolean(item.published);
        exampleForm.dataset.editingId = item.id;
        mostrarPreviewEjemplo(item.imageUrl);
        exampleForm.scrollIntoView({ behavior: 'smooth', block: 'center' });
      });
    });
    customExamplesList.querySelectorAll('[data-delete-example]').forEach(button => {
      button.addEventListener('click', async () => {
        try {
          await deleteDoc(doc(db, 'examples', button.dataset.deleteExample));
          await refreshExamples();
          setStatus('Ejemplo eliminado.');
        } catch (error) {
          setStatus(error.message || 'No se pudo eliminar el ejemplo.', true);
        }
      });
    });
  } catch (error) {
    localExamplesList.innerHTML = `<p class="admin-error">No se pudo cargar la galería: ${escapeHtml(error.message || 'Error desconocido')}</p>`;
  }
}

async function leerLegalLocal(key) {
  const file = key === 'sale' ? 'Condiciones-Venta.html' : 'Terminos-Condiciones.html';
  const response = await fetch(`/${file}`);
  if (!response.ok) throw new Error(`No pudimos leer ${file}.`);
  const page = new DOMParser().parseFromString(await response.text(), 'text/html');
  const content = page.querySelector('.contenido-interno');
  const body = [...(content?.children || [])].map(block => {
    const heading = block.querySelector('h2')?.textContent.trim();
    const paragraphs = [...block.querySelectorAll('p, li')].map(element => element.textContent.trim()).filter(Boolean);
    return [heading, ...paragraphs].filter(Boolean).join('\n');
  }).filter(Boolean).join('\n\n');
  return {
    title: page.querySelector('.pagina-hero h1')?.textContent.trim() || '',
    intro: page.querySelector('.pagina-hero .intro')?.textContent.trim() || '',
    body
  };
}

async function refreshLegalPages() {
  try {
    const [saleSnap, termsSnap, saleLocal, termsLocal] = await Promise.all([
      getDoc(doc(db, 'legalPages', 'sale')),
      getDoc(doc(db, 'legalPages', 'terms')),
      leerLegalLocal('sale'),
      leerLegalLocal('terms')
    ]);
    const values = {
      sale: saleSnap.exists() ? saleSnap.data() : saleLocal,
      terms: termsSnap.exists() ? termsSnap.data() : termsLocal
    };
    Object.entries(values).forEach(([key, value]) => {
      const form = document.querySelector(`[data-legal-form="${key}"]`);
      form.elements.title.value = value.title || '';
      form.elements.intro.value = value.intro || '';
      form.elements.body.value = value.body || '';
    });
  } catch (error) {
    setStatus(error.message || 'No se pudieron cargar las páginas legales.', true);
  }
}

function mostrarPreviewEjemplo(src) {
  if (!src) {
    examplePreview.hidden = true;
    examplePreview.replaceChildren();
    return;
  }
  examplePreview.hidden = false;
  examplePreview.innerHTML = `${renderPreviewImage(src, exampleForm.elements.title.value || 'Vista previa del ejemplo')}<span>${escapeHtml(exampleForm.elements.title.value || 'Vista previa')}</span>`;
}

async function refreshUsers() {
  usersList.innerHTML = '<p class="admin-loading">Cargando usuarios…</p>';
  try {
    const snapshot = await getDocs(collection(db, 'profiles'));
    const users = snapshot.docs.map(profile => ({ uid: profile.id, ...profile.data() }));
    users.sort((a, b) => (a.displayName || a.email || '').localeCompare(b.displayName || b.email || '', 'es'));
    renderUsers(users);
  } catch (error) {
    usersList.innerHTML = `<p class="admin-error">No se pudieron cargar los usuarios: ${escapeHtml(error.message || error.code || 'error desconocido')}</p>`;
    setStatus(error.message || 'No se pudo cargar la lista.', true);
  }
}

async function refreshReservations() {
  try {
    const reservasSnap = await getDocs(collection(db, 'reservas'));
    const reservas = reservasSnap.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));
    reservas.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
    document.querySelector('[data-stat-reservations]').textContent = String(reservas.length);

    renderList(reservationsList, reservas, item => `
      <article class="admin-row reserva-row preview-row">
        <div class="admin-preview">
          <div class="admin-preview-copy">
            <strong>${escapeHtml(item.nombre || 'Reserva')}</strong>
            <small>${escapeHtml(item.servicio || 'Sin servicio')} · ${escapeHtml(item.fecha || 'fecha pendiente')} · <span class="admin-tag">${escapeHtml(item.status || 'pendiente')}</span></small>
            <p>${escapeHtml(item.mensaje || 'Sin detalles adicionales')}</p>
          </div>
        </div>
        <div class="row-actions">
          <button class="boton claro" type="button" data-approve="${item.id}">Aceptar</button>
          <button class="boton claro" type="button" data-reject="${item.id}">Rechazar</button>
          <button class="boton claro" type="button" data-delete-reservation="${item.id}">Eliminar</button>
        </div>
      </article>
    `, 'No hay reservas.');

    reservationsList.querySelectorAll('[data-approve]').forEach(button => {
      button.addEventListener('click', async () => {
        const reserva = reservas.find(item => item.id === button.dataset.approve);
        showCustomPrompt({
          title: 'Aceptar reserva',
          message: `Aceptas la cita de ${escapeHtml(reserva?.nombre || 'este cliente')}. Indica la hora o detalle final.`,
          placeholder: 'Confirmado. Hora acordada por WhatsApp.',
          defaultValue: 'Confirmado. Hora acordada por WhatsApp.',
          onConfirm: async (decision) => {
            await actualizarReserva(button.dataset.approve, { status: 'aceptada', decision: decision || 'Confirmado. Hora acordada por WhatsApp.' });
          }
        });
      });
    });

    reservationsList.querySelectorAll('[data-reject]').forEach(button => {
      button.addEventListener('click', async () => {
        const reserva = reservas.find(item => item.id === button.dataset.reject);
        showCustomPrompt({
          title: 'Rechazar reserva',
          message: `Explica por qué no se puede atender la cita de ${escapeHtml(reserva?.nombre || 'este cliente')}.`,
          placeholder: 'No hay disponibilidad para esa fecha.',
          defaultValue: 'No hay disponibilidad para esa fecha.',
          onConfirm: async (motivo) => {
            await actualizarReserva(button.dataset.reject, { status: 'rechazada', decision: motivo || 'No hay disponibilidad para esa fecha.' });
          }
        });
      });
    });

    reservationsList.querySelectorAll('[data-delete-reservation]').forEach(button => {
      button.addEventListener('click', async () => {
        const reserva = reservas.find(item => item.id === button.dataset.deleteReservation);
        if (!confirm(`¿Eliminar la reserva de ${reserva?.nombre || 'este cliente'}?`)) return;
        try {
          await deleteDoc(doc(db, 'reservas', button.dataset.deleteReservation));
          setStatus('Reserva eliminada.');
          await refreshReservations();
        } catch (error) {
          setStatus(error.message || 'No se pudo eliminar la reserva.', true);
        }
      });
    });
  } catch (error) {
    setStatus(error.message || 'No se pudieron cargar las reservas.', true);
  }
}

async function actualizarReserva(id, payload) {
  const docRef = doc(db, 'reservas', id);
  await setDoc(docRef, { ...payload, reviewedAt: Date.now() }, { merge: true });
  const reserva = (await getDocs(collection(db, 'reservas'))).docs.find(docSnap => docSnap.id === id)?.data();
  const userId = reserva?.userId;
  if (userId) {
    await addDoc(collection(db, 'profiles', userId, 'notifications'), {
      title: payload.status === 'aceptada' ? 'Reserva aceptada' : 'Reserva rechazada',
      message: payload.decision || 'Revisa tu agenda.',
      read: false,
      createdAt: Date.now()
    });
  }
  setStatus(`Reserva ${payload.status}.`);
  await refreshReservations();
}

async function refreshFestivities() {
  try {
    const snap = await getDocs(collection(db, 'festivities'));
    const items = snap.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));
    renderList(festivitiesList, items, item => `
      <article class="admin-row preview-row">
        <div class="admin-preview">
          ${renderPreviewImage(item.imageUrl, item.title || item.id)}
          <div class="admin-preview-copy">
            <strong>${escapeHtml(item.title || item.id)}</strong>
            <small>${escapeHtml(item.location || 'floating')} · <span class="admin-tag">${escapeHtml(item.published ? 'Publicada' : 'Oculta')}</span></small>
            <p>${escapeHtml((item.pages || Object.keys(PAGE_LABELS)).map(page => PAGE_LABELS[page] || page).join(', '))}</p>
          </div>
        </div>
        <div class="row-actions">
          <button class="boton claro" type="button" data-edit-festivity="${item.id}">Editar</button>
          <button class="boton claro" type="button" data-delete-festivity="${item.id}">Eliminar</button>
        </div>
      </article>
    `, 'No hay decoraciones guardadas.');
    festivitiesList.querySelectorAll('[data-edit-festivity]').forEach(button => {
      button.addEventListener('click', async () => {
        const item = items.find(entry => entry.id === button.dataset.editFestivity);
        if (!item) return;
        const form = document.querySelector('[data-festivity-form]');
        form.title.value = item.title || '';
        const isDataUrl = item.imageUrl?.startsWith('data:image/');
        form.imageUrl.value = isDataUrl ? '' : (item.imageUrl || '');
        form.dataset.currentImage = item.imageUrl || '';
        form.left.value = item.left ?? 50;
        form.top.value = item.top ?? 20;
        form.size.value = item.size ?? 16;
        form.rotate.value = item.rotate ?? 0;
        form.location.value = item.location || 'floating';
        form.querySelectorAll('[name="pages"]').forEach(input => {
          input.checked = item.pages ? item.pages.includes(input.value) : true;
        });
        form.published.checked = Boolean(item.published);
        actualizarPreviewFestividad();
        form.dataset.editingId = item.id;
        form.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      });
    });
    document.querySelector('[data-stat-festivities]').textContent = String(items.length);
    festivitiesList.querySelectorAll('[data-delete-festivity]').forEach(button => {
      button.addEventListener('click', async () => {
        await deleteDoc(doc(db, 'festivities', button.dataset.deleteFestivity));
        setStatus('Decoración eliminada.');
        await refreshFestivities();
      });
    });
  } catch (error) {
    setStatus(error.message || 'No se pudieron cargar las decoraciones.', true);
  }
}

async function refreshSupportChats() {
  try {
    const snap = await getDocs(collection(db, 'supportChats'));
    const chats = snap.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));
    renderList(supportChatsList, chats, item => `
      <article class="admin-row preview-row">
        <div class="admin-preview">
          <div class="admin-preview-copy">
            <strong>${escapeHtml(item.userName || item.userEmail || 'Cliente')}</strong>
            <small>${escapeHtml(item.userEmail || 'Sin email')} · <span class="admin-tag">${escapeHtml(item.status || 'abierto')}</span></small>
            <p>${escapeHtml(item.lastMessage || 'Sin mensajes aún')}</p>
          </div>
        </div>
        <div class="row-actions">
          <button class="boton claro" type="button" data-reply-chat="${item.id}">Responder</button>
          <button class="boton claro" type="button" data-delete-chat="${item.id}">Eliminar chat</button>
        </div>
      </article>
    `, 'No hay mensajes de soporte.');
    supportChatsList.querySelectorAll('[data-reply-chat]').forEach(button => {
      button.addEventListener('click', async () => {
        const chatId = button.dataset.replyChat;
        showCustomPrompt({
          title: 'Responder cliente',
          message: 'Escribe la respuesta para este usuario.',
          placeholder: 'Gracias por contactarnos.',
          defaultValue: 'Gracias por contactarnos.',
          onConfirm: async (text) => {
            if (!text || !text.trim()) return;
            const token = await auth.currentUser?.getIdTokenResult().catch(() => null);
            const email = (auth.currentUser?.email || '').trim().toLowerCase();
            const role = token?.claims?.admin === true || ['angelicacb05@gmail.com', 'santhiagocaro05@gmail.com'].includes(email) ? 'admin' : 'support';
            const message = {
              sender: 'support',
              role,
              text: text.trim(),
              createdAt: Date.now(),
              createdBy: auth.currentUser?.uid || 'system'
            };
            await addDoc(collection(db, 'supportChats', chatId, 'messages'), message);
            await setDoc(doc(db, 'supportChats', chatId), { lastMessage: text.trim(), status: 'respondido', updatedAt: Date.now() }, { merge: true });
            setStatus('Respuesta enviada al cliente.');
          }
        });
      });
    });
    supportChatsList.querySelectorAll('[data-delete-chat]').forEach(button => {
      button.addEventListener('click', async () => {
        const chat = chats.find(item => item.id === button.dataset.deleteChat);
        if (!confirm(`¿Eliminar el chat con ${chat?.userName || chat?.userEmail || 'este cliente'} y todos sus mensajes?`)) return;
        try {
          const messagesRef = collection(db, 'supportChats', button.dataset.deleteChat, 'messages');
          let messages = await getDocs(messagesRef);
          while (!messages.empty) {
            for (let offset = 0; offset < messages.docs.length; offset += 500) {
              const batch = writeBatch(db);
              messages.docs.slice(offset, offset + 500).forEach(message => batch.delete(message.ref));
              await batch.commit();
            }
            messages = await getDocs(messagesRef);
          }
          await deleteDoc(doc(db, 'supportChats', button.dataset.deleteChat));
          setStatus('Chat y mensajes eliminados.');
          await refreshSupportChats();
        } catch (error) {
          setStatus(error.message || 'No se pudo eliminar el chat.', true);
        }
      });
    });
  } catch (error) {
    setStatus(error.message || 'No se pudieron cargar los mensajes.', true);
  }
}

async function refreshProductReviews() {
  try {
    const productsSnap = await getDocs(collection(db, 'products'));
    const productsById = new Map(productsSnap.docs.map(productDoc => [productDoc.id, {
      id: productDoc.id,
      nombre: productDoc.data().nombre || productDoc.id
    }]));
    (window.catalogoLocal?.productos || []).forEach(product => {
      if (!productsById.has(product.id)) productsById.set(product.id, { id: product.id, nombre: product.nombre || product.id });
    });
    const reviewsByProduct = await Promise.all([...productsById.values()].map(async product => {
      const snap = await getDocs(collection(db, 'products', product.id, 'reviews'));
      return snap.docs.map(reviewDoc => ({
        ...reviewDoc.data(),
        reviewId: reviewDoc.id,
        productId: product.id,
        productName: product.nombre,
        ref: reviewDoc.ref
      }));
    }));
    const pending = reviewsByProduct.flat().filter(review => review.approved !== true);
    if (pendingReviewsCount) {
      pendingReviewsCount.textContent = String(pending.length);
      pendingReviewsCount.hidden = pending.length === 0;
    }
    renderList(productReviewsList, pending, review => {
      const badges = ['cliente', 'vip', 'veterano']
        .filter(key => review.authorBadges?.[key] === true)
        .map(key => `<span class="resena-insignia resena-insignia-${key}" title="${escapeHtml(key)}">${key === 'cliente' ? '✓' : key === 'vip' ? 'V' : '★'}</span>`)
        .join('');
      return `
        <article class="admin-row admin-review-row">
          <div class="admin-review-content">
            <div class="admin-review-heading"><strong>${escapeHtml(review.authorName || 'Cliente')}</strong><span class="resena-insignias">${badges}</span><span class="admin-tag">${'★'.repeat(Math.max(0, Math.min(5, Number(review.rating) || 0)))}${'☆'.repeat(5 - Math.max(0, Math.min(5, Number(review.rating) || 0)))}</span></div>
            <small>${escapeHtml(review.productName)} · ${escapeHtml(review.authorId || '')}</small>
            <p>${escapeHtml(review.body || '')}</p>
          </div>
          <div class="row-actions"><button class="boton" type="button" data-review-action="approve" data-product-id="${escapeHtml(review.productId)}" data-review-id="${escapeHtml(review.reviewId)}">Aprobar</button><button class="boton claro" type="button" data-review-action="reject" data-product-id="${escapeHtml(review.productId)}" data-review-id="${escapeHtml(review.reviewId)}">Rechazar</button></div>
        </article>
      `;
    }, 'No hay reseñas pendientes.');

    productReviewsList.querySelectorAll('[data-review-action="approve"]').forEach(button => {
      button.addEventListener('click', async () => {
        const { productId, reviewId } = button.dataset;
        try {
          await updateDoc(doc(db, 'products', productId, 'reviews', reviewId), { approved: true, reviewedAt: Date.now() });
          setStatus('Reseña aprobada y visible en el producto.');
          await refreshProductReviews();
        } catch (error) {
          setStatus(error.message || 'No se pudo aprobar la reseña.', true);
        }
      });
    });
    productReviewsList.querySelectorAll('[data-review-action="reject"]').forEach(button => {
      button.addEventListener('click', async () => {
        const { productId, reviewId } = button.dataset;
        try {
          await deleteDoc(doc(db, 'products', productId, 'reviews', reviewId));
          setStatus('Reseña rechazada y eliminada.');
          await refreshProductReviews();
        } catch (error) {
          setStatus(error.message || 'No se pudo rechazar la reseña.', true);
        }
      });
    });
  } catch (error) {
    productReviewsList.innerHTML = `<p class="admin-error">No se pudieron cargar las reseñas: ${escapeHtml(error.message || 'Error desconocido')}</p>`;
    if (pendingReviewsCount) pendingReviewsCount.hidden = true;
  }
}

async function refreshGlobalNotifications() {
  try {
    const snap = await getDocs(collection(db, 'globalNotifications'));
    const items = snap.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() })).sort((a, b) => Number(b.createdAt || 0) - Number(a.createdAt || 0));
    renderList(globalNotificationsList, items, item => `
      <article class="admin-row preview-row">
        <div class="admin-preview-copy">
          <strong>${escapeHtml(item.title || 'Notificación global')}</strong>
          <small>${escapeHtml(item.message || 'Sin mensaje')}</small>
        </div>
        <div class="row-actions">
          <button class="boton claro" type="button" data-delete-global-notification="${item.id}">Borrar</button>
        </div>
      </article>
    `, 'No hay notificaciones globales.');

    globalNotificationsList?.querySelectorAll('[data-delete-global-notification]').forEach(button => {
      button.addEventListener('click', async () => {
        await deleteDoc(doc(db, 'globalNotifications', button.dataset.deleteGlobalNotification));
        setStatus('Notificación global eliminada.');
        await refreshGlobalNotifications();
      });
    });
  } catch (error) {
    setStatus(error.message || 'No se pudieron cargar las notificaciones globales.', true);
  }
}

async function refreshContent() {
  try {
    const [productsSnap, categoriesSnap, announcementsSnap] = await Promise.all([
      getDocs(collection(db, 'products')),
      getDocs(collection(db, 'categories')),
      getDocs(collection(db, 'announcements'))
    ]);

    const products = productsSnap.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));
    const categories = categoriesSnap.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));
    const announcements = announcementsSnap.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));
    renderProductCategoryOptions(categories);
    document.querySelector('[data-stat-products]').textContent = String(products.length);

    renderList(productsList, products, item => `
      <article class="admin-row preview-row">
        <div class="admin-preview">
          ${renderPreviewImage(item.imagen, item.nombre || item.id)}
          <div class="admin-preview-copy">
            <strong>${escapeHtml(item.nombre || item.id)}</strong>
            <small>${escapeHtml(item.categoria || 'sin categoría')} · <span class="admin-tag">${escapeHtml(item.published ? 'Publicado' : 'Borrador')}</span></small>
            <p>${escapeHtml(item.descripcion || 'Sin descripción')}</p>
          </div>
        </div>
        <div class="row-actions">
          <button class="boton claro" type="button" data-edit-product="${item.id}">Editar</button>
          <button class="boton claro" type="button" data-delete-product="${item.id}">Eliminar</button>
        </div>
      </article>
    `, 'No hay productos guardados.');

    renderList(categoriesList, categories, item => `
      <article class="admin-row preview-row">
        <div class="admin-preview">
          ${renderPreviewImage(item.imagen, item.titulo || item.id)}
          <div class="admin-preview-copy">
            <strong>${escapeHtml(item.titulo || item.id)}</strong>
            <small><span class="admin-tag">${escapeHtml(item.published ? 'Publicada' : 'Oculta')}</span></small>
            <p>${escapeHtml(item.texto || 'Sin descripción')}</p>
          </div>
        </div>
        <div class="row-actions">
          <button class="boton claro" type="button" data-edit-category="${item.id}">Editar</button>
          <button class="boton claro" type="button" data-delete-category="${item.id}">Eliminar</button>
        </div>
      </article>
    `, 'No hay categorías guardadas.');

    renderList(announcementsList, announcements, item => `
      <article class="admin-row preview-row">
        <div class="admin-preview-copy">
          <strong>${escapeHtml(item.title || item.id)}</strong>
          <small><span class="admin-tag">${escapeHtml(item.published ? 'Publicado' : 'Oculto')}</span> · prioridad ${escapeHtml(item.priority || 1)}</small>
          <p>${escapeHtml(item.body || 'Sin descripción')}</p>
        </div>
        <div class="row-actions">
          <button class="boton claro" type="button" data-edit-announcement="${item.id}">Editar</button>
          <button class="boton claro" type="button" data-delete-announcement="${item.id}">Eliminar</button>
        </div>
      </article>
    `, 'No hay anuncios guardados.');

    productsList.querySelectorAll('[data-edit-product]').forEach(button => {
      button.addEventListener('click', () => cargarProductoEnFormulario(button.dataset.editProduct, products));
    });
    categoriesList.querySelectorAll('[data-edit-category]').forEach(button => {
      button.addEventListener('click', () => cargarCategoriaEnFormulario(button.dataset.editCategory, categories));
    });
    announcementsList.querySelectorAll('[data-edit-announcement]').forEach(button => {
      button.addEventListener('click', () => cargarAnuncioEnFormulario(button.dataset.editAnnouncement, announcements));
    });
    productsList.querySelectorAll('[data-delete-product]').forEach(button => {
      button.addEventListener('click', () => borrarDocumento('products', button.dataset.deleteProduct));
    });
    categoriesList.querySelectorAll('[data-delete-category]').forEach(button => {
      button.addEventListener('click', () => borrarDocumento('categories', button.dataset.deleteCategory));
    });
    announcementsList.querySelectorAll('[data-delete-announcement]').forEach(button => {
      button.addEventListener('click', () => borrarDocumento('announcements', button.dataset.deleteAnnouncement));
    });
  } catch (error) {
    setStatus(error.message || 'No se pudo cargar contenido.', true);
  }
}

async function borrarDocumento(coleccion, id) {
  if (!id) return;
  try {
    await deleteDoc(doc(db, coleccion, id));
    setStatus('Elemento eliminado.');
    await refreshContent();
  } catch (error) {
    setStatus(error.message || 'No se pudo eliminar.', true);
  }
}

function cargarProductoEnFormulario(id, lista) {
  const item = lista.find(entry => entry.id === id);
  if (!item) return;
  const form = document.querySelector('[data-product-form]');
  form.id.value = item.id || '';
  form.nombre.value = item.nombre || '';
  form.categoria.value = item.categoria || '';
  const isDataUrl = item.imagen?.startsWith('data:image/');
  form.imagen.value = isDataUrl ? '' : (item.imagen || '');
  form.dataset.currentImage = item.imagen || '';
  mostrarVistaPreviaProducto(item.imagen, item.nombre || 'Vista previa del producto');
  form.precio.value = item.precio || '';
  form.descripcion.value = item.descripcion || '';
  form.detalles.value = Array.isArray(item.detalles) ? item.detalles.join('\n') : String(item.detalles || '');
  form.tonos.value = JSON.stringify(item.tonos || [], null, 2);
  renderTonosProducto(item.tonos || []);
  form.published.checked = Boolean(item.published);
  form.availability.value = item.availability || 'inquire';
  form.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function cargarCategoriaEnFormulario(id, lista) {
  const item = lista.find(entry => entry.id === id);
  if (!item) return;
  const form = document.querySelector('[data-category-form]');
  form.id.value = item.id || '';
  form.titulo.value = item.titulo || '';
  form.texto.value = item.texto || '';
  form.imagen.value = item.imagen || '';
  form.colores.value = JSON.stringify(item.colores || [], null, 2);
  form.published.checked = Boolean(item.published);
  form.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function cargarAnuncioEnFormulario(id, lista) {
  const item = lista.find(entry => entry.id === id);
  if (!item) return;
  const form = document.querySelector('[data-announcement-form]');
  form.id.value = item.id || '';
  form.title.value = item.title || '';
  form.body.value = item.body || '';
  form.link.value = item.link || '';
  form.linkLabel.value = item.linkLabel || '';
  form.priority.value = item.priority || 1;
  form.expiresAt.value = item.expiresAt ? new Date(item.expiresAt.seconds * 1000).toISOString().slice(0, 10) : '';
  form.published.checked = Boolean(item.published);
  form.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

async function checkAdmin(usuario) {
  if (!usuario) {
    guard.hidden = false;
    panel.hidden = true;
    return;
  }

  const token = await usuario.getIdTokenResult();
  const supportEmails = ['angelicacb05@gmail.com', 'santhiagocaro05@gmail.com'];
  const email = (usuario.email || '').toLowerCase();
  const admin = token.claims.admin === true || supportEmails.includes(email) || token.claims.support === true;
  const support = token.claims.support === true || supportEmails.includes(email);
  if (!admin) {
    guard.hidden = false;
    panel.hidden = true;
    roleBadge.textContent = 'Sin permisos';
    return;
  }

  guard.hidden = true;
  panel.hidden = false;
  activarVistaAdmin('overview');
  roleBadge.textContent = admin && support ? 'Soporte / Admin' : (support ? 'Soporte' : 'Administrador');
  await refreshUsers();
  await refreshReservations();
  await refreshFestivities();
  await refreshSupportChats();
  await refreshProductReviews();
  await refreshCarousel();
  await refreshExamples();
  await refreshLegalPages();
  await refreshGlobalNotifications();
  await refreshContent();
}

onAuthStateChanged(auth, checkAdmin);

document.querySelector('[data-admin-logout]').addEventListener('click', async () => {
  await signOut(auth);
  window.location.href = '/';
});

carouselForm.elements.imageUrl.addEventListener('input', () => {
  carouselForm.elements.imageFile.value = '';
  delete carouselForm.dataset.currentImage;
  if (carouselForm.dataset.previewObjectUrl) URL.revokeObjectURL(carouselForm.dataset.previewObjectUrl);
  delete carouselForm.dataset.previewObjectUrl;
  mostrarPreviewCarrusel(carouselForm.elements.imageUrl.value.trim());
});
carouselForm.elements.imageFile.addEventListener('change', () => {
  if (carouselForm.dataset.previewObjectUrl) URL.revokeObjectURL(carouselForm.dataset.previewObjectUrl);
  const file = carouselForm.elements.imageFile.files[0];
  if (file) {
    carouselForm.elements.imageUrl.value = '';
    delete carouselForm.dataset.currentImage;
    carouselForm.dataset.previewObjectUrl = URL.createObjectURL(file);
  }
  mostrarPreviewCarrusel(carouselForm.dataset.previewObjectUrl || carouselForm.dataset.currentImage);
});
carouselForm.elements.title.addEventListener('input', () => {
  const image = carouselForm.dataset.previewObjectUrl || carouselForm.elements.imageUrl.value || carouselForm.dataset.currentImage;
  mostrarPreviewCarrusel(image);
});

carouselForm.addEventListener('submit', async event => {
  event.preventDefault();
  try {
    const file = carouselForm.elements.imageFile.files[0];
    const imageUrl = file
      ? await comprimirImagenProducto(file)
      : (carouselForm.elements.imageUrl.value.trim() || carouselForm.dataset.currentImage || '');
    const link = carouselForm.elements.link.value.trim();
    if (!imageUrl) {
      setStatus('Agrega una URL o sube una foto para el carrusel.', true);
      return;
    }
    if (link && !link.startsWith('/') && !/^https:\/\//i.test(link)) {
      setStatus('El enlace debe empezar por / o usar https://.', true);
      return;
    }
    const id = carouselForm.dataset.editingId || `slide-${slugify(carouselForm.elements.title.value)}-${Date.now()}`;
    await setDoc(doc(db, 'carouselSlides', id), {
      id,
      title: carouselForm.elements.title.value.trim(),
      body: carouselForm.elements.body.value.trim(),
      imageUrl,
      link,
      linkLabel: carouselForm.elements.linkLabel.value.trim() || 'Ver más',
      published: carouselForm.elements.published.checked,
      updatedAt: Date.now()
    });
    if (carouselForm.dataset.previewObjectUrl) URL.revokeObjectURL(carouselForm.dataset.previewObjectUrl);
    carouselForm.reset();
    delete carouselForm.dataset.editingId;
    delete carouselForm.dataset.currentImage;
    delete carouselForm.dataset.previewObjectUrl;
    mostrarPreviewCarrusel('');
    await refreshCarousel();
    setStatus('Diapositiva guardada en el carrusel.');
  } catch (error) {
    setStatus(error.message || 'No se pudo guardar la diapositiva.', true);
  }
});

exampleForm.elements.imageUrl.addEventListener('input', () => {
  exampleForm.elements.imageFile.value = '';
  delete exampleForm.dataset.currentImage;
  if (exampleForm.dataset.previewObjectUrl) URL.revokeObjectURL(exampleForm.dataset.previewObjectUrl);
  delete exampleForm.dataset.previewObjectUrl;
  mostrarPreviewEjemplo(exampleForm.elements.imageUrl.value.trim());
});
exampleForm.elements.imageFile.addEventListener('change', () => {
  if (exampleForm.dataset.previewObjectUrl) URL.revokeObjectURL(exampleForm.dataset.previewObjectUrl);
  const file = exampleForm.elements.imageFile.files[0];
  if (file) {
    exampleForm.elements.imageUrl.value = '';
    delete exampleForm.dataset.currentImage;
    exampleForm.dataset.previewObjectUrl = URL.createObjectURL(file);
  }
  mostrarPreviewEjemplo(exampleForm.dataset.previewObjectUrl || exampleForm.dataset.currentImage);
});
exampleForm.elements.title.addEventListener('input', () => {
  const image = exampleForm.dataset.previewObjectUrl || exampleForm.elements.imageUrl.value || exampleForm.dataset.currentImage;
  mostrarPreviewEjemplo(image);
});
exampleForm.addEventListener('submit', async event => {
  event.preventDefault();
  try {
    const file = exampleForm.elements.imageFile.files[0];
    const imageUrl = file
      ? await comprimirImagenProducto(file)
      : (exampleForm.elements.imageUrl.value.trim() || exampleForm.dataset.currentImage || '');
    if (!imageUrl) {
      setStatus('Agrega una URL o sube una foto para el ejemplo.', true);
      return;
    }
    const id = exampleForm.dataset.editingId || `example-${slugify(exampleForm.elements.title.value)}-${Date.now()}`;
    await setDoc(doc(db, 'examples', id), {
      id,
      title: exampleForm.elements.title.value.trim(),
      description: exampleForm.elements.description.value.trim(),
      imageUrl,
      category: exampleForm.elements.category.value,
      published: exampleForm.elements.published.checked,
      updatedAt: Date.now()
    });
    if (exampleForm.dataset.previewObjectUrl) URL.revokeObjectURL(exampleForm.dataset.previewObjectUrl);
    exampleForm.reset();
    delete exampleForm.dataset.editingId;
    delete exampleForm.dataset.currentImage;
    delete exampleForm.dataset.previewObjectUrl;
    mostrarPreviewEjemplo('');
    await refreshExamples();
    setStatus('Ejemplo guardado.');
  } catch (error) {
    setStatus(error.message || 'No se pudo guardar el ejemplo.', true);
  }
});

document.querySelectorAll('[data-legal-form]').forEach(form => {
  form.addEventListener('submit', async event => {
    event.preventDefault();
    const page = form.dataset.legalForm;
    try {
      await setDoc(doc(db, 'legalPages', page), {
        title: form.elements.title.value.trim(),
        intro: form.elements.intro.value.trim(),
        body: form.elements.body.value.trim(),
        updatedAt: Date.now()
      });
      setStatus(page === 'sale' ? 'Condiciones de venta publicadas para todos.' : 'Términos y condiciones publicados para todos.');
    } catch (error) {
      setStatus(error.message || 'No se pudo publicar el texto legal.', true);
    }
  });
});

document.querySelector('[data-product-form]').addEventListener('submit', async event => {
  event.preventDefault();
  const form = event.currentTarget;
  try {
    const id = (form.id.value || slugify(form.nombre.value)).trim();
    const file = form.imagenArchivo.files[0];
    const imagen = file
      ? await comprimirImagenProducto(file)
      : (form.imagen.value.trim() || form.dataset.currentImage || '');
    if (!imagen) {
      setStatus('Agrega una URL de imagen o selecciona una foto de tu dispositivo.', true);
      return;
    }
    const payload = {
      id,
      nombre: form.nombre.value.trim(),
      categoria: form.categoria.value,
      imagen,
      precio: form.precio.value ? Number(form.precio.value) : null,
      availability: form.availability.value || 'inquire',
      descripcion: form.descripcion.value.trim(),
      detalles: parseLineList(form.detalles.value),
      tonos: leerTonosProducto(),
      published: form.published.checked,
      updatedAt: Date.now()
    };
    await setDoc(doc(db, 'products', id), payload);
    setStatus('Producto guardado en Firestore.');
    form.reset();
    renderTonosProducto([]);
    delete form.dataset.currentImage;
    form.published.checked = true;
    mostrarVistaPreviaProducto('');
    await refreshContent();
  } catch (error) {
    setStatus(error.message || 'No se pudo guardar el producto.', true);
  }
});

const productForm = document.querySelector('[data-product-form]');
productForm.elements.imagen.addEventListener('input', () => {
  delete productForm.dataset.currentImage;
  productForm.elements.imagenArchivo.value = '';
  mostrarVistaPreviaProducto(productForm.elements.imagen.value.trim(), productForm.elements.nombre.value || 'Vista previa del producto');
});
productForm.elements.imagenArchivo.addEventListener('change', () => {
  const file = productForm.elements.imagenArchivo.files[0];
  delete productForm.dataset.currentImage;
  if (file) productForm.elements.imagen.value = '';
  mostrarVistaPreviaProducto(file ? URL.createObjectURL(file) : productForm.elements.imagen.value.trim(), productForm.elements.nombre.value || 'Vista previa del producto');
});
productForm.elements.nombre.addEventListener('input', () => {
  const image = productForm.elements.imagenArchivo.files[0]
    ? productPreview.querySelector('img')?.src
    : (productForm.elements.imagen.value.trim() || productForm.dataset.currentImage);
  mostrarVistaPreviaProducto(image, productForm.elements.nombre.value || 'Vista previa del producto');
});

const productToneList = document.querySelector('[data-product-tones]');
function renderTonosProducto(tones) {
  productToneList.replaceChildren();
  tones.forEach(tone => agregarTonoProducto(tone));
  sincronizarTonosProducto();
}

function agregarTonoProducto(tone = {}) {
  const row = document.createElement('div');
  row.className = 'product-tone-row';
  row.dataset.productToneRow = '';
  row.innerHTML = `
    <label>Nombre del tono<input type="text" maxlength="32" data-tone-name placeholder="Ej. Rosa suave"></label>
    <label>Color<input type="color" data-tone-color value="#d8a8b8" aria-label="Elegir color del tono"></label>
    <button class="tone-remove" type="button" aria-label="Eliminar tono" title="Eliminar tono">×</button>
  `;
  row.querySelector('[data-tone-name]').value = tone.n || '';
  row.querySelector('[data-tone-color]').value = /^#[0-9a-f]{6}$/i.test(tone.c || '') ? tone.c : '#d8a8b8';
  productToneList.append(row);
}

function leerTonosProducto() {
  return [...productToneList.querySelectorAll('[data-product-tone-row]')]
    .map(row => ({
      n: row.querySelector('[data-tone-name]').value.trim(),
      c: row.querySelector('[data-tone-color]').value
    }))
    .filter(tone => tone.n);
}

function sincronizarTonosProducto() {
  productForm.elements.tonos.value = JSON.stringify(leerTonosProducto());
}

document.querySelector('[data-add-product-tone]').addEventListener('click', () => {
  agregarTonoProducto();
  sincronizarTonosProducto();
  productToneList.lastElementChild.querySelector('[data-tone-name]').focus();
});
productToneList.addEventListener('input', sincronizarTonosProducto);
productToneList.addEventListener('click', event => {
  if (!event.target.closest('.tone-remove')) return;
  event.target.closest('[data-product-tone-row]').remove();
  sincronizarTonosProducto();
});

document.querySelector('[data-category-form]').addEventListener('submit', async event => {
  event.preventDefault();
  const form = event.currentTarget;
  const id = (form.id.value || slugify(form.titulo.value)).trim();
  const payload = {
    id,
    titulo: form.titulo.value.trim(),
    texto: form.texto.value.trim(),
    imagen: form.imagen.value.trim(),
    colores: parseJsonArray(form.colores.value, ['#ecd6c8', '#d9b8a4']),
    published: form.published.checked,
    updatedAt: Date.now()
  };
  await setDoc(doc(db, 'categories', id), payload);
  setStatus('Categoría guardada.');
  form.reset();
  form.published.checked = true;
  await refreshContent();
});

document.querySelector('[data-announcement-form]').addEventListener('submit', async event => {
  event.preventDefault();
  const form = event.currentTarget;
  const id = (form.id.value || slugify(form.title.value)).trim();
  const payload = {
    id,
    title: form.title.value.trim(),
    body: form.body.value.trim(),
    link: form.link.value.trim(),
    linkLabel: form.linkLabel.value.trim() || 'Ver más',
    priority: Number(form.priority.value) || 1,
    expiresAt: form.expiresAt.value ? new Date(`${form.expiresAt.value}T23:59:59`).toISOString() : null,
    published: form.published.checked,
    active: true,
    updatedAt: Date.now()
  };
  await setDoc(doc(db, 'announcements', id), payload);
  setStatus('Anuncio guardado.');
  form.reset();
  form.published.checked = true;
  await refreshContent();
});

document.querySelector('[data-global-notify-form]').addEventListener('submit', async event => {
  event.preventDefault();
  const form = event.currentTarget;
  const title = form.title.value.trim();
  const message = form.message.value.trim();
  if (!title || !message) {
    setStatus('Completa el título y el mensaje de la notificación global.', true);
    return;
  }
  try {
    await addDoc(collection(db, 'globalNotifications'), {
      title,
      message,
      createdAt: Date.now(),
      readBy: []
    });
    setStatus('Notificación global enviada.');
    form.reset();
  } catch (error) {
    setStatus(error.message || 'No se pudo enviar la notificación global.', true);
  }
});

document.querySelector('[data-festivity-form]').addEventListener('submit', async event => {
  event.preventDefault();
  const form = event.currentTarget;
  try {
    const file = form.imageFile.files[0];
    const imageUrl = file
      ? await comprimirImagenProducto(file)
      : (form.imageUrl.value.trim() || form.dataset.currentImage || '');
    const pages = [...form.querySelectorAll('[name="pages"]:checked')].map(input => input.value);
    if (!imageUrl) {
      setStatus('Agrega una URL o sube una imagen.', true);
      return;
    }
    if (!pages.length) {
      setStatus('Selecciona al menos una página para mostrar la decoración.', true);
      return;
    }
    const id = form.dataset.editingId || `fest-${Date.now()}`;
    await setDoc(doc(db, 'festivities', id), {
      id,
      title: form.title.value.trim() || 'Decoración',
      imageUrl,
      pages,
      left: Number(form.left.value),
      top: Number(form.top.value),
      size: Number(form.size.value),
      rotate: Number(form.rotate.value),
      location: form.location.value || 'floating',
      published: form.published.checked,
      updatedAt: Date.now()
    });
    setStatus('Decoración guardada.');
    if (form.dataset.previewObjectUrl) URL.revokeObjectURL(form.dataset.previewObjectUrl);
    form.reset();
    delete form.dataset.editingId;
    delete form.dataset.currentImage;
    delete form.dataset.previewObjectUrl;
    actualizarPreviewFestividad();
    await refreshFestivities();
  } catch (error) {
    setStatus(error.message || 'No se pudo guardar la decoración.', true);
  }
});

document.querySelector('[data-role-form]').addEventListener('submit', async event => {
  event.preventDefault();
  const form = event.currentTarget;
  const uid = form.uid.value;
  const role = form.role.value;
  if (!uid) {
    setStatus('Selecciona un usuario primero.', true);
    return;
  }
  try {
    const userDoc = doc(db, 'profiles', uid);
    const profileSnapshot = await getDoc(userDoc);
    const roles = profileSnapshot.data()?.roles || {};
    await setDoc(userDoc, {
      roles: { ...roles, [role]: true, admin: role === 'admin' || Boolean(roles.admin) },
      updatedAt: serverTimestamp()
    }, { merge: true });
    setStatus('Rol actualizado en Firestore.');
  } catch (error) {
    setStatus(error.message || 'No se pudo actualizar el rol.', true);
  }
});

document.querySelector('[data-badge-form]').addEventListener('submit', async event => {
  event.preventDefault();
  const formulario = event.currentTarget;
  const data = Object.fromEntries(new FormData(formulario).entries());
  if (!data.uid || !data.reason) {
    setStatus('Selecciona usuario y escribe el motivo.', true);
    return;
  }
  try {
    const allowedBadges = new Set(['cliente', 'vip', 'veterano']);
    const reason = data.reason.trim();
    if (!allowedBadges.has(data.badge) || reason.length > 300) throw new Error('La insignia o el motivo no son válidos.');
    await updateDoc(doc(db, 'profiles', data.uid), {
      [`badges.${data.badge}`]: {
        reason,
        assignedBy: auth.currentUser.uid,
        assignedAt: serverTimestamp()
      },
      updatedAt: serverTimestamp()
    });
    setStatus('Insignia actualizada.');
  } catch (error) {
    setStatus(error.message || 'No pudimos actualizar la insignia.', true);
  }
});

document.querySelector('[data-balance-form]').addEventListener('submit', async event => {
  event.preventDefault();
  const formulario = event.currentTarget;
  const data = Object.fromEntries(new FormData(formulario).entries());
  if (!data.uid || !data.reason || data.amountCop === '') {
    setStatus('Completa usuario, motivo y monto.', true);
    return;
  }
  try {
    const amountCop = Number(data.amountCop);
    const reason = data.reason.trim();
    if (!Number.isSafeInteger(amountCop) || amountCop === 0 || reason.length > 300) {
      throw new Error('El ajuste debe ser un valor entero distinto de cero y tener un motivo válido.');
    }
    const profileRef = doc(db, 'profiles', data.uid);
    const movementRef = doc(collection(db, 'profiles', data.uid, 'balanceTransactions'));
    const balanceAfterCop = await runTransaction(db, async transaction => {
      const profileSnapshot = await transaction.get(profileRef);
      const currentBalance = Number(profileSnapshot.data()?.balanceCop || 0);
      const nextBalance = currentBalance + amountCop;
      if (!profileSnapshot.exists() || !Number.isSafeInteger(currentBalance) || !Number.isSafeInteger(nextBalance) || nextBalance < 0) {
        throw new Error('El saldo resultante no puede ser negativo y el perfil debe existir.');
      }
      transaction.update(profileRef, { balanceCop: nextBalance, updatedAt: serverTimestamp() });
      transaction.set(movementRef, {
        amountCop,
        balanceAfterCop: nextBalance,
        reason,
        createdAt: serverTimestamp(),
        createdBy: auth.currentUser.uid
      });
      return nextBalance;
    });
    setStatus(`Saldo ajustado: ${new Intl.NumberFormat('es-CO').format(balanceAfterCop)} COP.`);
  } catch (error) {
    setStatus(error.message || 'No pudimos ajustar el saldo.', true);
  }
});

document.querySelector('[data-purchase-form]').addEventListener('submit', async event => {
  event.preventDefault();
  const formulario = event.currentTarget;
  const data = Object.fromEntries(new FormData(formulario).entries());
  if (!data.uid || !data.reference || !data.totalCop || !data.items) {
    setStatus('Completa todos los campos de la compra.', true);
    return;
  }
  try {
    const reference = data.reference.trim();
    const totalCop = Number(data.totalCop);
    const items = JSON.parse(data.items);
    if (!reference || reference.length > 120 || !Number.isSafeInteger(totalCop) || totalCop < 0 || !Array.isArray(items) || items.length === 0 || items.length > 50) {
      throw new Error('Los datos de la compra no son válidos.');
    }
    const safeItems = items.map(item => {
      const name = typeof item?.name === 'string' ? item.name.trim() : '';
      if (!name || name.length > 120) throw new Error('Cada producto debe tener un nombre válido.');
      const price = Number(item.priceCop);
      return {
        name,
        quantity: Math.min(Math.max(Number(item.quantity) || 1, 1), 100),
        priceCop: Number.isSafeInteger(price) && price >= 0 ? price : null
      };
    });
    const profileRef = doc(db, 'profiles', data.uid);
    const purchaseRef = doc(collection(db, 'profiles', data.uid, 'purchases'));
    await runTransaction(db, async transaction => {
      const profileSnapshot = await transaction.get(profileRef);
      if (!profileSnapshot.exists()) throw new Error('No existe el perfil del cliente.');
      const profile = profileSnapshot.data();
      const updates = { purchaseCount: increment(1), updatedAt: serverTimestamp() };
      if (!profile.badges?.cliente) {
        updates['badges.cliente'] = {
          reason: 'Insignia asignada por una compra confirmada.',
          assignedBy: auth.currentUser.uid,
          assignedAt: serverTimestamp()
        };
      }
      transaction.update(profileRef, updates);
      transaction.set(purchaseRef, {
        reference,
        totalCop,
        items: safeItems,
        status: 'confirmed',
        createdAt: serverTimestamp(),
        recordedBy: auth.currentUser.uid
      });
    });
    setStatus('Compra registrada.');
  } catch (error) {
    setStatus(error.message || 'No pudimos registrar la compra.', true);
  }
});

document.querySelector('[data-refresh-users]').addEventListener('click', refreshUsers);
document.querySelector('[data-refresh-reviews]').addEventListener('click', refreshProductReviews);
