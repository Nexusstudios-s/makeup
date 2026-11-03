import { onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js';
import { getFunctions, httpsCallable } from 'https://www.gstatic.com/firebasejs/11.10.0/firebase-functions.js';
import { appFirebase, auth } from './firebase-client.js';

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

function setStatus(mensaje, error = false) {
  status.textContent = mensaje;
  status.style.color = error ? '#b14848' : '#477a5b';
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

async function refreshUsers() {
  try {
    const resultado = await functions.listUsers({ pageSize: 100 });
    renderUsers(resultado.data.users || []);
  } catch (error) {
    setStatus(error.message || 'No se pudo cargar la lista.', true);
  }
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
}

onAuthStateChanged(auth, checkAdmin);

document.querySelector('[data-admin-logout]').addEventListener('click', async () => {
  await signOut(auth);
  window.location.href = '/';
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
