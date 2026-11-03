import { addDoc, collection, deleteDoc, doc, getDocs, onSnapshot, orderBy, query, serverTimestamp, updateDoc, where } from 'https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js';
import { auth, db } from './firebase-client.js';

const CAMPANA = `
  <button class="campana notificacion-boton" type="button" aria-label="Notificaciones">
    <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M15 17h5l-1.4-1.4A2 2 0 0 1 18 14.2V11a6 6 0 1 0-12 0v3.2a2 2 0 0 1-.6 1.4L4 17h5m6 0a3 3 0 1 1-6 0"/></svg>
    <span class="campana-count" data-count>0</span>
  </button>`;

const MODAL_HTML = `
  <dialog class="reserva-modal" aria-labelledby="reserva-title">
    <button class="x" type="button" aria-label="Cerrar">×</button>
    <div class="reserva-panel">
      <p class="sobrelinea">Solicitar cita</p>
      <h2 id="reserva-title">Reserva tu maquillaje</h2>
      <form class="reserva-form modal-form" data-reserva-form-modal>
        <label>Tu nombre<input name="nombre" type="text" maxlength="70" required></label>
        <label>Servicio<select name="servicio" required><option value="" selected disabled>Elige un servicio</option><option>Maquillaje social</option><option>Maquillaje de novia</option><option>Maquillaje para evento</option><option>Asesoría de maquillaje</option></select></label>
        <label>Fecha preferida<input name="fecha" type="date" required></label>
        <label>Hora preferida<input name="hora" type="time"></label>
        <label>Detalles<textarea name="mensaje" rows="3" maxlength="400" placeholder="Cuéntanos tu idea, ocasión o look"></textarea></label>
        <div class="reserva-acciones">
          <button class="boton claro" type="button" data-reserva-cancel>Cancelar</button>
          <button class="boton" type="submit">Enviar solicitud</button>
        </div>
      </form>
    </div>
  </dialog>
`;

const NOTIFICACIONES_HTML = `
  <div class="panel-notificaciones" hidden>
    <div class="panel-notificaciones-header">
      <h3>Notificaciones</h3>
      <button class="x" type="button" aria-label="Cerrar notificaciones">×</button>
    </div>
    <div class="lista-notificaciones" data-lista-notificaciones></div>
  </div>
`;

function mostrarDialogoPremium({
  title = 'Atención',
  message = '',
  confirmText = 'Aceptar',
  cancelText = '',
  onConfirm = null,
  onCancel = null
} = {}) {
  const dialog = document.createElement('dialog');
  dialog.className = 'dialogo-premium';
  dialog.innerHTML = `
    <div class="dialogo-premium__contenido">
      <div class="dialogo-premium__header">
        <span class="dialogo-premium__eyebrow">Aviso</span>
        <button class="x" type="button" aria-label="Cerrar">×</button>
      </div>
      <h3>${title}</h3>
      <p>${message}</p>
      <div class="dialogo-premium__acciones">
        ${cancelText ? '<button class="boton claro" type="button" data-dialog-cancel>' + cancelText + '</button>' : ''}
        <button class="boton" type="button" data-dialog-confirm>${confirmText}</button>
      </div>
    </div>
  `;

  document.body.appendChild(dialog);

  const cerrar = () => {
    dialog.close();
    dialog.remove();
  };

  dialog.querySelector('.x').addEventListener('click', () => {
    onCancel?.();
    cerrar();
  });

  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) {
      onCancel?.();
      cerrar();
    }
  });

  if (cancelText) {
    dialog.querySelector('[data-dialog-cancel]').addEventListener('click', () => {
      onCancel?.();
      cerrar();
    });
  }

  dialog.querySelector('[data-dialog-confirm]').addEventListener('click', () => {
    onConfirm?.();
    cerrar();
  });

  dialog.showModal();
}

function setMinDate(selector) {
  const hoy = new Date();
  hoy.setMinutes(hoy.getMinutes() - hoy.getTimezoneOffset());
  selector.min = hoy.toISOString().slice(0, 10);
}

function abrirModalReserva() {
  const modal = document.querySelector('.reserva-modal');
  if (modal) {
    modal.showModal();
    return;
  }
  const wrapper = document.createElement('div');
  wrapper.innerHTML = MODAL_HTML;
  document.body.appendChild(wrapper.firstElementChild);
  const nuevoModal = document.querySelector('.reserva-modal');
  const fechaInput = nuevoModal.querySelector('[name="fecha"]');
  setMinDate(fechaInput);
  nuevoModal.querySelector('[data-reserva-cancel]').addEventListener('click', () => nuevoModal.close());
  nuevoModal.querySelector('.x').addEventListener('click', () => nuevoModal.close());
  nuevoModal.addEventListener('click', (event) => { if (event.target === nuevoModal) nuevoModal.close(); });
  nuevoModal.querySelector('[data-reserva-form-modal]').addEventListener('submit', async (evento) => {
    evento.preventDefault();
    const usuario = auth.currentUser;
    if (!usuario) {
      mostrarDialogoPremium({
        title: 'Inicia sesión para continuar',
        message: 'Necesitas entrar a tu cuenta antes de enviar una solicitud de reserva.',
        confirmText: 'Entendido'
      });
      return;
    }
    const formulario = evento.currentTarget;
    const payload = Object.fromEntries(new FormData(formulario).entries());
    const fecha = new Date(`${payload.fecha}T12:00:00`);
    const reserva = {
      nombre: String(payload.nombre).trim(),
      servicio: String(payload.servicio).trim(),
      fecha: payload.fecha,
      hora: payload.hora || '',
      mensaje: String(payload.mensaje || '').trim(),
      fechaLabel: fecha.toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' }),
      userId: usuario.uid,
      email: usuario.email || '',
      status: 'pendiente',
      createdAt: serverTimestamp()
    };
    await addDoc(collection(db, 'reservas'), reserva);
    formulario.reset();
    nuevoModal.close();
    mostrarDialogoPremium({
      title: 'Solicitud enviada',
      message: 'Tu cita quedó registrada. El equipo la revisará y te responderá por WhatsApp o correo.',
      confirmText: 'Perfecto'
    });
  });
  nuevoModal.showModal();
}

function construirCampana() {
  const boton = document.createElement('div');
  boton.innerHTML = CAMPANA;
  document.querySelector('.acciones')?.appendChild(boton.firstElementChild);
  const panel = document.createElement('div');
  panel.innerHTML = NOTIFICACIONES_HTML;
  document.body.appendChild(panel.firstElementChild);
  const notificacionPanel = document.querySelector('.panel-notificaciones');
  const cerrar = notificacionPanel.querySelector('.x');
  cerrar.addEventListener('click', () => notificacionPanel.hidden = true);
  document.querySelector('.campana')?.addEventListener('click', () => {
    notificacionPanel.hidden = !notificacionPanel.hidden;
  });
  return { panel: notificacionPanel };
}

function renderNotificaciones(lista, panel) {
  const contenedor = panel.querySelector('[data-lista-notificaciones]');
  if (!contenedor) return;
  if (!lista.length) {
    contenedor.innerHTML = '<p class="notificacion-vacia">No tienes notificaciones.</p>';
    return;
  }
  const maxCount = 5;
  const items = lista.slice(0, maxCount).map(notif => `
    <article class="notificacion-item ${notif.read ? 'leida' : 'nueva'}">
      <div class="notificacion-item-contenido">
        <strong>${notif.title || 'Actualización'}</strong>
        <p>${notif.message || ''}</p>
        <small>${notif.createdAt?.toDate ? notif.createdAt.toDate().toLocaleString('es-CO', { dateStyle: 'medium', timeStyle: 'short' }) : 'Ahora'}</small>
      </div>
      <button class="boton claro notificacion-eliminar" type="button" data-delete-notification="${notif.id}" data-notification-scope="${notif.forAll ? 'global' : 'personal'}">Borrar</button>
    </article>
  `).join('');
  contenedor.innerHTML = items;

  contenedor.querySelectorAll('[data-delete-notification]').forEach(boton => {
    boton.addEventListener('click', async () => {
      const notifId = boton.dataset.deleteNotification;
      const scope = boton.dataset.notificationScope;
      const usuario = auth.currentUser;
      if (!usuario || !notifId) return;

      const token = await usuario.getIdTokenResult().catch(() => null);
      const email = (usuario.email || '').trim().toLowerCase();
      const esAdmin = Boolean(token?.claims?.admin || token?.claims?.support || ['angelicacb05@gmail.com', 'santhiagocaro05@gmail.com'].includes(email));

      if (scope === 'global' && !esAdmin) {
        mostrarDialogoPremium({
          title: 'Permiso requerido',
          message: 'Solo el administrador puede borrar las notificaciones globales.',
          confirmText: 'Vale'
        });
        return;
      }

      try {
        if (scope === 'global') {
          await deleteDoc(doc(db, 'globalNotifications', notifId));
        } else {
          await deleteDoc(doc(db, 'profiles', usuario.uid, 'notifications', notifId));
        }
      } catch (error) {
        console.error('No se pudo borrar la notificación:', error);
      }
    });
  });
}

function analizarListaGlobal(lista, usuario) {
  if (!lista || !lista.length) return [];
  const listaGlobal = lista
    .filter(item => item && (item.forAll === true || item.userId === usuario.uid || item.userId === undefined))
    .map(item => ({
      ...item,
      title: item.title || 'Aviso',
      message: item.message || '',
      createdAt: item.createdAt || Date.now(),
      read: Boolean(item.read)
    }));
  return listaGlobal;
}

function observarNotificaciones(usuario) {
  const panel = document.querySelector('.panel-notificaciones');
  if (!panel) return;
  const personal = query(collection(db, 'profiles', usuario.uid, 'notifications'), orderBy('createdAt', 'desc'));
  const globalQ = query(collection(db, 'globalNotifications'), orderBy('createdAt', 'desc'));

  return onSnapshot(globalQ, snapshotGlobal => {
    const globalItems = snapshotGlobal.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data(), forAll: true }));
    onSnapshot(personal, snapshotPersonal => {
      const personalItems = snapshotPersonal.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data(), userId: usuario.uid }));
      const lista = [...globalItems, ...personalItems].sort((a, b) => Number(b.createdAt || 0) - Number(a.createdAt || 0));
      const count = lista.filter(item => !item.read).length;
      const badge = document.querySelector('[data-count]');
      if (badge) badge.textContent = String(count || 0);
      badge?.parentElement?.classList.toggle('tiene-notificaciones', count > 0);
      renderNotificaciones(lista, panel);
    });
  });
}

function inicializarReservas() {
  const abrirButton = document.querySelector('[data-reserva-modal]');
  if (abrirButton && !abrirButton.dataset.modalReady) {
    abrirButton.dataset.modalReady = 'true';
    abrirButton.addEventListener('click', () => abrirModalReserva());
  }

  const formulario = document.querySelector('[data-reserva-form]');
  if (formulario && !formulario.dataset.whatsappReady) {
    formulario.dataset.whatsappReady = 'true';
    formulario.addEventListener('submit', (event) => {
      event.preventDefault();
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
      const ventana = window.open(`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(mensaje)}`, '_blank');
      if (ventana) ventana.opener = null;
      else window.location.href = `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(mensaje)}`;
    });
  }

  if (document.querySelector('.campana')) return;
  construirCampana();

  auth.onAuthStateChanged((usuario) => {
    if (!usuario) {
      const badge = document.querySelector('[data-count]');
      if (badge) badge.textContent = '0';
      return;
    }
    observarNotificaciones(usuario);
  });
}

window.abrirModalReserva = abrirModalReserva;
window.addEventListener('DOMContentLoaded', inicializarReservas);
