import { onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js';
import { addDoc, collection, deleteDoc, doc, getDocs, setDoc } from 'https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js';
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
const reservationsList = document.querySelector('[data-reservas-list]');
const festivitiesList = document.querySelector('[data-festivities-list]');
const supportChatsList = document.querySelector('[data-support-chats-list]');
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

async function refreshReservations() {
  try {
    const reservasSnap = await getDocs(collection(db, 'reservas'));
    const reservas = reservasSnap.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));
    reservas.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));

    renderList(reservationsList, reservas, item => `
      <article class="admin-row reserva-row">
        <div>
          <strong>${item.nombre || 'Reserva'}</strong>
          <small>${item.servicio} · ${item.fecha || 'fecha pendiente'} · ${item.status || 'pendiente'}</small>
          <p>${item.mensaje || 'Sin detalles adicionales'}</p>
        </div>
        <div class="row-actions">
          <button class="boton claro" type="button" data-approve="${item.id}">Aceptar</button>
          <button class="boton claro" type="button" data-reject="${item.id}">Rechazar</button>
        </div>
      </article>
    `, 'No hay reservas.');

    reservationsList.querySelectorAll('[data-approve]').forEach(button => {
      button.addEventListener('click', async () => {
        const reserva = reservas.find(item => item.id === button.dataset.approve);
        const decision = window.prompt(`Aceptaste la reserva de ${reserva?.nombre || 'esta cita'}. Indica detalles de hora o cambios:`, 'Confirmado. Hora acordada por WhatsApp.');
        if (decision === null) return;
        await actualizarReserva(button.dataset.approve, { status: 'aceptada', decision: decision.trim() || 'Confirmado. Hora acordada por WhatsApp.' });
      });
    });

    reservationsList.querySelectorAll('[data-reject]').forEach(button => {
      button.addEventListener('click', async () => {
        const reserva = reservas.find(item => item.id === button.dataset.reject);
        const motivo = window.prompt(`Rechaza la reserva de ${reserva?.nombre || 'esta cita'}. Escribe la razón:`, 'No hay disponibilidad para esa fecha.');
        if (motivo === null) return;
        await actualizarReserva(button.dataset.reject, { status: 'rechazada', decision: motivo.trim() || 'No hay disponibilidad para esa fecha.' });
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
      <article class="admin-row">
        <div>
          <strong>${item.title || item.id}</strong>
          <small>${item.location || 'floating'} · ${item.published ? 'Publicada' : 'Oculta'}</small>
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
        form.imageUrl.value = item.imageUrl || '';
        form.left.value = item.left ?? 50;
        form.top.value = item.top ?? 20;
        form.size.value = item.size ?? 16;
        form.rotate.value = item.rotate ?? 0;
        form.location.value = item.location || 'floating';
        form.published.checked = Boolean(item.published);
        form.dataset.editingId = item.id;
        form.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      });
    });
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
      <article class="admin-row">
        <div>
          <strong>${item.userName || item.userEmail || 'Cliente'}</strong>
          <small>${item.userEmail || 'Sin email'} · ${item.status || 'abierto'}</small>
        </div>
        <div class="row-actions">
          <button class="boton claro" type="button" data-reply-chat="${item.id}">Responder</button>
        </div>
      </article>
    `, 'No hay mensajes de soporte.');
    supportChatsList.querySelectorAll('[data-reply-chat]').forEach(button => {
      button.addEventListener('click', async () => {
        const chatId = button.dataset.replyChat;
        const text = window.prompt('Escribe la respuesta para este cliente:', 'Gracias por contactarnos.');
        if (!text || !text.trim()) return;
        const message = {
          sender: 'support',
          text: text.trim(),
          createdAt: Date.now(),
          createdBy: auth.currentUser?.uid || 'system'
        };
        await addDoc(collection(db, 'supportChats', chatId, 'messages'), message);
        await setDoc(doc(db, 'supportChats', chatId), { lastMessage: text.trim(), status: 'respondido', updatedAt: Date.now() }, { merge: true });
        setStatus('Respuesta enviada al cliente.');
      });
    });
  } catch (error) {
    setStatus(error.message || 'No se pudieron cargar los mensajes.', true);
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
  roleBadge.textContent = admin && support ? 'Soporte / Admin' : (support ? 'Soporte' : 'Administrador');
  await refreshUsers();
  await refreshReservations();
  await refreshFestivities();
  await refreshSupportChats();
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
  const file = form.imageFile.files[0];
  let imageUrl = form.imageUrl.value.trim();
  if (file) {
    const reader = new FileReader();
    reader.onload = async () => {
      const id = form.dataset.editingId || `fest-${Date.now()}`;
      await setDoc(doc(db, 'festivities', id), {
        id,
        title: form.title.value.trim() || 'Decoración',
        imageUrl: reader.result,
        left: Number(form.left.value) || 50,
        top: Number(form.top.value) || 20,
        size: Number(form.size.value) || 16,
        rotate: Number(form.rotate.value) || 0,
        location: form.location.value || 'floating',
        published: form.published.checked,
        updatedAt: Date.now()
      });
      setStatus('Decoración guardada.');
      form.reset();
      delete form.dataset.editingId;
      await refreshFestivities();
    };
    reader.readAsDataURL(file);
    return;
  }
  if (!imageUrl) {
    setStatus('Agrega una URL o sube una imagen.', true);
    return;
  }
  const id = form.dataset.editingId || `fest-${Date.now()}`;
  await setDoc(doc(db, 'festivities', id), {
    id,
    title: form.title.value.trim() || 'Decoración',
    imageUrl,
    left: Number(form.left.value) || 50,
    top: Number(form.top.value) || 20,
    size: Number(form.size.value) || 16,
    rotate: Number(form.rotate.value) || 0,
    location: form.location.value || 'floating',
    published: form.published.checked,
    updatedAt: Date.now()
  });
  setStatus('Decoración guardada.');
  form.reset();
  delete form.dataset.editingId;
  await refreshFestivities();
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
    const profile = await (await fetch(`https://firestore.googleapis.com/v1/projects/${auth.app.options.projectId}/databases/(default)/documents/profiles/${uid}`)).json();
    await setDoc(userDoc, { roles: { [role]: true, admin: role === 'admin' || Boolean(profile.fields?.roles?.mapValue?.fields?.admin?.booleanValue) }, updatedAt: Date.now() }, { merge: true });
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
