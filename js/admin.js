import { onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js';
import { collection, deleteDoc, doc, getDocs, setDoc } from 'https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js';
import { getFunctions, httpsCallable } from 'https://www.gstatic.com/firebasejs/11.10.0/firebase-functions.js';
import { appFirebase, auth, db } from './firebase-client.js';

const functionsApp = getFunctions(appFirebase, 'us-central1');
const functions = {
  listUsers: httpsCallable(functionsApp, 'listUsers'),
  deleteUser: httpsCallable(functionsApp, 'deleteUser'),
  setCustomerBadge: httpsCallable(functionsApp, 'setCustomerBadge'),
  adjustBalance: httpsCallable(functionsApp, 'adjustBalance'),
  recordPurchase: httpsCallable(functionsApp, 'recordPurchase')
};

const guard = document.querySelector('[data-admin-guard]');
const panel = document.querySelector('[data-admin-panel]');
const roleBadge = document.querySelector('[data-admin-role]');
const status = document.querySelector('[data-admin-status]');
const userSelects = document.querySelectorAll('[data-user-select]');
const usersList = document.querySelector('[data-users-list]');
const productsList = document.querySelector('[data-products-list]');
const categoriesList = document.querySelector('[data-categories-list]');
const announcementsList = document.querySelector('[data-announcements-list]');

function setStatus(mensaje, error = false) {
  status.textContent = mensaje;
  status.style.color = error ? '#b14848' : '#477a5b';
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

function renderUsers(users) {
  window.__adminUsers = users;
  const options = users.map(user => `<option value="${user.uid}">${user.email || user.displayName || user.uid}</option>`).join('');
  userSelects.forEach(select => {
    select.innerHTML = options || '<option value="">Sin usuarios</option>';
  });

  usersList.innerHTML = users.length
    ? users.map(user => `
      <article class="admin-user-row">
        <div>
          <strong>${user.displayName || 'Sin nombre'}</strong>
          <small>${user.email || 'Sin email'}</small>
        </div>
        <button class="boton claro" type="button" data-delete-user="${user.uid}">Eliminar</button>
      </article>`).join('')
    : '<p>No hay usuarios.</p>';

  usersList.querySelectorAll('[data-delete-user]').forEach(boton => {
    boton.addEventListener('click', async () => {
      const uid = boton.dataset.deleteUser;
      if (!uid) return;
      try {
        await functions.deleteUser({ uid });
        setStatus('Usuario eliminado.');
        await refreshUsers();
      } catch (error) {
        setStatus(error.message || 'No pudimos eliminar el usuario.', true);
      }
    });
  });
}

function renderList(container, items, renderItem, emptyText) {
  if (!container) return;
  if (!items.length) {
    container.innerHTML = `<p>${emptyText}</p>`;
    return;
  }
  container.innerHTML = items.map(renderItem).join('');
}

async function refreshUsers() {
  try {
    const resultado = await functions.listUsers({ pageSize: 100 });
    renderUsers(resultado.data.users || []);
  } catch (error) {
    setStatus(error.message || 'No se pudo cargar la lista.', true);
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

    renderList(productsList, products, item => `
      <article class="admin-row">
        <div>
          <strong>${item.nombre || item.id}</strong>
          <small>${item.categoria || 'sin categoría'} · ${item.published ? 'Publicado' : 'Borrador'}</small>
        </div>
        <div class="row-actions">
          <button class="boton claro" type="button" data-edit-product="${item.id}">Editar</button>
          <button class="boton claro" type="button" data-delete-product="${item.id}">Eliminar</button>
        </div>
      </article>
    `, 'No hay productos guardados.');

    renderList(categoriesList, categories, item => `
      <article class="admin-row">
        <div>
          <strong>${item.titulo || item.id}</strong>
          <small>${item.published ? 'Publicada' : 'Oculta'}</small>
        </div>
        <div class="row-actions">
          <button class="boton claro" type="button" data-edit-category="${item.id}">Editar</button>
          <button class="boton claro" type="button" data-delete-category="${item.id}">Eliminar</button>
        </div>
      </article>
    `, 'No hay categorías guardadas.');

    renderList(announcementsList, announcements, item => `
      <article class="admin-row">
        <div>
          <strong>${item.title || item.id}</strong>
          <small>${item.published ? 'Publicado' : 'Oculto'} · prioridad ${item.priority || 1}</small>
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
  form.imagen.value = item.imagen || '';
  form.precio.value = item.precio || '';
  form.descripcion.value = item.descripcion || '';
  form.detalles.value = JSON.stringify(item.detalles || [], null, 2);
  form.tonos.value = JSON.stringify(item.tonos || [], null, 2);
  form.published.checked = Boolean(item.published);
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
  const admin = token.claims.admin === true;
  if (!admin) {
    guard.hidden = false;
    panel.hidden = true;
    roleBadge.textContent = 'Sin permisos';
    return;
  }

  guard.hidden = true;
  panel.hidden = false;
  roleBadge.textContent = 'Administrador';
  await refreshUsers();
  await refreshContent();
}

onAuthStateChanged(auth, checkAdmin);

document.querySelector('[data-admin-logout]').addEventListener('click', async () => {
  await signOut(auth);
  window.location.href = '/';
});

document.querySelector('[data-product-form]').addEventListener('submit', async event => {
  event.preventDefault();
  const form = event.currentTarget;
  const id = (form.id.value || slugify(form.nombre.value)).trim();
  const payload = {
    id,
    nombre: form.nombre.value.trim(),
    categoria: form.categoria.value.trim(),
    imagen: form.imagen.value.trim(),
    precio: form.precio.value ? Number(form.precio.value) : null,
    descripcion: form.descripcion.value.trim(),
    detalles: parseJsonArray(form.detalles.value, []),
    tonos: parseJsonArray(form.tonos.value, []),
    published: form.published.checked,
    updatedAt: Date.now()
  };
  await setDoc(doc(db, 'products', id), payload);
  setStatus('Producto guardado.');
  form.reset();
  form.published.checked = true;
  await refreshContent();
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

document.querySelector('[data-badge-form]').addEventListener('submit', async event => {
  event.preventDefault();
  const formulario = event.currentTarget;
  const data = Object.fromEntries(new FormData(formulario).entries());
  if (!data.uid || !data.reason) {
    setStatus('Selecciona usuario y escribe el motivo.', true);
    return;
  }
  try {
    await functions.setCustomerBadge({ uid: data.uid, badge: data.badge, reason: data.reason });
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
    await functions.adjustBalance({ uid: data.uid, amountCop: Number(data.amountCop), reason: data.reason });
    setStatus('Saldo ajustado.');
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
    const payload = JSON.parse(data.items);
    await functions.recordPurchase({
      uid: data.uid,
      reference: data.reference,
      totalCop: Number(data.totalCop),
      items: payload
    });
    setStatus('Compra registrada.');
  } catch (error) {
    setStatus(error.message || 'No pudimos registrar la compra.', true);
  }
});

document.querySelector('[data-refresh-users]').addEventListener('click', refreshUsers);
