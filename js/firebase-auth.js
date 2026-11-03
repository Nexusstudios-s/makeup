import {
  GithubAuthProvider,
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  reauthenticateWithCredential,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updatePassword,
  updateProfile,
  EmailAuthProvider
} from 'https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js';
import { collection, doc, getDoc, getDocs, serverTimestamp, setDoc, updateDoc } from 'https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js';
import { getDownloadURL, ref, uploadBytes } from 'https://www.gstatic.com/firebasejs/11.10.0/firebase-storage.js';
import { auth, db, storage } from './firebase-client.js';

const dock = document.createElement('nav');
dock.className = 'cuenta-dock';
dock.setAttribute('aria-label', 'Accesos rápidos');
dock.innerHTML = `
  <a class="dock-enlace" href="/" aria-label="Inicio">
    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/></svg>
    <span>Inicio</span>
  </a>
  <a class="dock-enlace" href="/categoria?c=bases" aria-label="Catálogo">
    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5h16v14H4zM8 5V3m8 2V3M8 10h8m-8 4h5"/></svg>
    <span>Catálogo</span>
  </a>
  <a class="dock-enlace" href="/#reservar" aria-label="Reservar maquillaje">
    <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18m-12 4 2 2 4-4"/></svg>
    <span>Reservar</span>
  </a>
  <button class="dock-cuenta" type="button" data-auth-open aria-label="Iniciar sesión">
    <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg>
    <span data-auth-label>Acceder</span>
  </button>`;

document.body.append(dock);

const modal = document.createElement('dialog');
modal.className = 'auth-dialog';
modal.setAttribute('aria-labelledby', 'auth-title');
modal.innerHTML = `
  <button class="x" type="button" aria-label="Cerrar">×</button>
  <div class="auth-panel">
    <div class="auth-intro">
      <img src="assets/logo/ACV.png" alt="" width="52" height="52">
      <p class="sobrelinea">Tu espacio de belleza</p>
      <h2 id="auth-title">Bienvenida</h2>
      <p>Guarda tus datos y consulta tu cuenta.</p>
    </div>
    <section class="auth-guest" data-auth-guest>
      <div class="auth-tabs" role="group" aria-label="Tipo de acceso">
        <button type="button" data-auth-mode="login" aria-pressed="true">Iniciar sesión</button>
        <button type="button" data-auth-mode="register" aria-pressed="false">Crear cuenta</button>
      </div>
      <div class="auth-providers">
        <button class="auth-provider" type="button" data-auth-provider="google"><span class="provider-g">G</span>Continuar con Google</button>
        <button class="auth-provider" type="button" data-auth-provider="github"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 .9a11.1 11.1 0 0 0-3.5 21.6c.6.1.8-.2.8-.6v-2.1c-3.1.7-3.8-1.3-3.8-1.3-.5-1.3-1.3-1.7-1.3-1.7-1-.7.1-.7.1-.7 1.1.1 1.7 1.2 1.7 1.2 1 .1.5 1 .5 1 1.9.4 2.4-1.2 2.4-1.2.2-.7.5-1.2.9-1.5-2.5-.3-5.1-1.3-5.1-5.5 0-1.2.4-2.1 1.1-2.9-.1-.3-.5-1.4.1-2.9 0 0 .9-.3 3 1.1a10.4 10.4 0 0 1 5.5 0c2.1-1.4 3-1.1 3-1.1.6 1.5.2 2.6.1 2.9.7.8 1.1 1.7 1.1 2.9 0 4.2-2.6 5.2-5.1 5.5.5.4 1 1.2 1 2.4v3.6c0 .4.2.7.8.6A11.1 11.1 0 0 0 12 .9Z"/></svg>Continuar con GitHub</button>
      </div>
      <p class="auth-separador">o con tu correo</p>
      <form class="auth-form" data-auth-form>
        <label class="auth-nombre" hidden>Nombre
          <input name="nombre" type="text" autocomplete="name" maxlength="70">
        </label>
        <label>Correo electrónico
          <input name="email" type="email" autocomplete="email" required>
        </label>
        <label>Contraseña
          <input name="password" type="password" autocomplete="current-password" minlength="8" required>
        </label>
        <button class="boton auth-submit" type="submit">Iniciar sesión</button>
      </form>
      <button class="auth-reset" type="button" data-auth-reset>Olvidé mi contraseña</button>
    </section>
    <section class="auth-session" data-auth-session hidden>
      <div class="perfil-portada">
        <img data-perfil-banner alt="" hidden>
        <span>Tu perfil</span>
      </div>
      <div class="perfil-identidad">
        <img class="auth-avatar" data-auth-avatar alt="" hidden>
        <span class="auth-avatar auth-avatar-inicial" data-auth-inicial aria-hidden="true">A</span>
        <div><h3 data-auth-name></h3><p data-auth-email></p><div class="perfil-insignias" data-perfil-insignias></div></div>
      </div>
      <form class="perfil-form" data-perfil-form>
        <label>Nombre visible<input name="displayName" maxlength="70" autocomplete="name" required></label>
        <label>Sobre mí<textarea name="description" maxlength="300" rows="3" placeholder="Cuéntales algo sobre ti"></textarea></label>
        <div class="perfil-archivos">
          <label>Foto de perfil<input name="avatar" type="file" accept="image/*"></label>
          <label>Banner<input name="banner" type="file" accept="image/*"></label>
        </div>
        <button class="boton auth-submit" type="submit" data-profile-save>Guardar perfil</button>
      </form>
      <div class="perfil-resumen">
        <section><h4>Mis compras</h4><ul data-perfil-compras></ul></section>
        <section><h4>Mi saldo</h4><p data-perfil-saldo></p><ul data-perfil-movimientos></ul></section>
      </div>
      <form class="perfil-password" data-password-form>
        <h4>Cambiar contraseña</h4>
        <label>Contraseña actual<input name="passwordActual" type="password" autocomplete="current-password" required></label>
        <label>Nueva contraseña<input name="passwordNueva" type="password" autocomplete="new-password" minlength="8" required></label>
        <button class="auth-reset" type="submit">Actualizar contraseña</button>
      </form>
      <button class="boton auth-submit" type="button" data-auth-signout>Cerrar sesión</button>
    </section>
    <p class="auth-feedback" data-auth-feedback role="status" aria-live="polite"></p>
  </div>`;

document.body.append(modal);

const formulario = modal.querySelector('[data-auth-form]');
const campoNombre = modal.querySelector('.auth-nombre');
const botonEnviar = modal.querySelector('.auth-submit');
const feedback = modal.querySelector('[data-auth-feedback]');
const seccionInvitado = modal.querySelector('[data-auth-guest]');
const seccionSesion = modal.querySelector('[data-auth-session]');
let modo = 'login';
let usuarioActual = null;
let perfilActual = null;

const insignias = {
  cliente: { nombre: 'Cliente', simbolo: 'C', color: '#b88a69' },
  vip: { nombre: 'VIP', simbolo: 'V', color: '#c29a45' },
  veterano: { nombre: 'Veterano/a', simbolo: '★', color: '#748b77' }
};

function formatoCop(valor) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0
  }).format(valor);
}

function fechaCorta(valor) {
  const fecha = valor?.toDate?.();
  return fecha ? new Intl.DateTimeFormat('es-CO', { dateStyle: 'medium' }).format(fecha) : 'Fecha pendiente';
}

function mostrarInsignias(datos) {
  const zona = modal.querySelector('[data-perfil-insignias]');
  zona.replaceChildren();
  Object.entries(insignias).forEach(([clave, insignia]) => {
    const asignacion = datos?.[clave];
    if (!asignacion) return;
    const grupo = document.createElement('span');
    grupo.className = 'insignia-grupo';
    const boton = document.createElement('button');
    boton.className = 'insignia-cliente';
    boton.type = 'button';
    boton.style.setProperty('--color-insignia', insignia.color);
    boton.textContent = insignia.simbolo;
    boton.setAttribute('aria-label', `Insignia ${insignia.nombre}`);
    const detalle = document.createElement('span');
    detalle.className = 'insignia-detalle';
    detalle.hidden = true;
    detalle.textContent = `${insignia.nombre}: ${asignacion.reason || 'Insignia asignada por el equipo.'}`;
    boton.addEventListener('click', () => {
      detalle.hidden = !detalle.hidden;
      boton.setAttribute('aria-expanded', String(!detalle.hidden));
    });
    grupo.append(boton, detalle);
    zona.append(grupo);
  });
}

function pintarLista(zona, filas, vacio, formatear) {
  zona.replaceChildren();
  if (filas.length === 0) {
    const item = document.createElement('li');
    item.textContent = vacio;
    zona.append(item);
    return;
  }
  filas.forEach(fila => {
    const item = document.createElement('li');
    item.textContent = formatear(fila);
    zona.append(item);
  });
}

async function cargarPerfil(usuario) {
  const perfilRef = doc(db, 'profiles', usuario.uid);
  let perfil = await getDoc(perfilRef);
  if (!perfil.exists()) {
    const datosIniciales = {
      displayName: usuario.displayName || usuario.email?.split('@')[0] || 'Cliente',
      photoURL: usuario.photoURL || '',
      bannerURL: '',
      description: '',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    await setDoc(perfilRef, datosIniciales);
    perfil = await getDoc(perfilRef);
  }

  perfilActual = perfil.data() || {};
  const form = modal.querySelector('[data-perfil-form]');
  form.elements.displayName.value = perfilActual.displayName || usuario.displayName || '';
  form.elements.description.value = perfilActual.description || '';
  const foto = modal.querySelector('[data-auth-avatar]');
  const inicial = modal.querySelector('[data-auth-inicial]');
  if (perfilActual.photoURL || usuario.photoURL) {
    foto.src = perfilActual.photoURL || usuario.photoURL;
    foto.hidden = false;
    inicial.hidden = true;
  } else {
    foto.hidden = true;
    inicial.hidden = false;
    inicial.textContent = (perfilActual.displayName || 'C').slice(0, 1).toUpperCase();
  }
  const banner = modal.querySelector('[data-perfil-banner]');
  banner.hidden = !perfilActual.bannerURL;
  if (perfilActual.bannerURL) banner.src = perfilActual.bannerURL;
  modal.querySelector('[data-auth-name]').textContent = perfilActual.displayName || usuario.displayName || 'Cliente';
  mostrarInsignias(perfilActual.badges);
  modal.querySelector('[data-password-form]').hidden = !usuario.providerData.some(item => item.providerId === 'password');

  const [comprasSnapshot, saldoSnapshot] = await Promise.all([
    getDocs(collection(db, 'profiles', usuario.uid, 'purchases')),
    getDocs(collection(db, 'profiles', usuario.uid, 'balanceTransactions'))
  ]);
  const compras = comprasSnapshot.docs.map(item => item.data()).sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
  const movimientos = saldoSnapshot.docs.map(item => item.data()).sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
  pintarLista(modal.querySelector('[data-perfil-compras]'), compras, 'Aún no tienes compras registradas.', compra => `${fechaCorta(compra.createdAt)} · ${formatoCop(compra.totalCop || 0)}`);
  modal.querySelector('[data-perfil-saldo]').textContent = Number.isSafeInteger(perfilActual.balanceCop)
    ? formatoCop(perfilActual.balanceCop)
    : 'Aún no tienes saldo registrado.';
  pintarLista(modal.querySelector('[data-perfil-movimientos]'), movimientos.slice(0, 5), 'Sin movimientos de saldo.', movimiento => `${fechaCorta(movimiento.createdAt)} · ${movimiento.reason || 'Movimiento'} · ${formatoCop(movimiento.amountCop || 0)}`);
}

function mostrarFeedback(mensaje, error = false) {
  feedback.textContent = mensaje;
  feedback.classList.toggle('error', error);
}

function mensajeError(error) {
  const mensajes = {
    'auth/email-already-in-use': 'Ese correo ya tiene una cuenta. Inicia sesión.',
    'auth/invalid-credential': 'Revisa tu correo y contraseña.',
    'auth/invalid-email': 'Escribe un correo válido.',
    'auth/weak-password': 'Usa una contraseña de al menos 8 caracteres.',
    'auth/popup-closed-by-user': 'Se cerró la ventana de acceso.',
    'auth/operation-not-allowed': 'Activa este método de acceso en Firebase Console.',
    'auth/account-exists-with-different-credential': 'Ese correo está vinculado a otro método de acceso.'
  };
  return mensajes[error.code] || 'No pudimos completar el acceso. Intenta de nuevo.';
}

function cambiarModo(nuevoModo) {
  modo = nuevoModo;
  const registro = modo === 'register';
  campoNombre.hidden = !registro;
  formulario.elements.password.autocomplete = registro ? 'new-password' : 'current-password';
  modal.querySelectorAll('[data-auth-mode]').forEach(boton => {
    boton.setAttribute('aria-pressed', String(boton.dataset.authMode === modo));
  });
  botonEnviar.textContent = registro ? 'Crear cuenta' : 'Iniciar sesión';
  modal.querySelector('[data-auth-reset]').hidden = registro;
  mostrarFeedback('');
}

async function actualizarSesion(usuario) {
  usuarioActual = usuario;
  dock.querySelector('[data-auth-label]').textContent = usuario ? 'Mi cuenta' : 'Acceder';
  dock.querySelector('[data-auth-open]').setAttribute('aria-label', usuario ? 'Abrir mi cuenta' : 'Iniciar sesión');
  seccionInvitado.hidden = Boolean(usuario);
  seccionSesion.hidden = !usuario;
  if (!usuario) {
    perfilActual = null;
    modal.querySelector('#auth-title').textContent = 'Bienvenida';
    return;
  }

  const nombre = usuario.displayName || usuario.email?.split('@')[0] || 'Cliente';
  modal.querySelector('[data-auth-name]').textContent = nombre;
  modal.querySelector('[data-auth-email]').textContent = usuario.email || '';
  modal.querySelector('#auth-title').textContent = `Hola, ${nombre}`;
  try {
    await cargarPerfil(usuario);
  } catch (error) {
    mostrarFeedback('Iniciaste sesión, pero no pudimos leer tu perfil. Revisa las reglas de Firestore.', true);
  }
}

modal.querySelectorAll('[data-auth-mode]').forEach(boton => {
  boton.addEventListener('click', () => cambiarModo(boton.dataset.authMode));
});

formulario.addEventListener('submit', async event => {
  event.preventDefault();
  if (!formulario.reportValidity()) return;
  botonEnviar.disabled = true;
  mostrarFeedback('Conectando con Firebase…');

  const email = formulario.elements.email.value.trim();
  const password = formulario.elements.password.value;
  try {
    if (modo === 'register') {
      const nombre = formulario.elements.nombre.value.trim();
      const result = await createUserWithEmailAndPassword(auth, email, password);
      if (nombre) await updateProfile(result.user, { displayName: nombre });
      actualizarSesion(auth.currentUser);
      modal.close();
    } else {
      await signInWithEmailAndPassword(auth, email, password);
      modal.close();
    }
  } catch (error) {
    mostrarFeedback(mensajeError(error), true);
  } finally {
    botonEnviar.disabled = false;
  }
});

const perfilForm = modal.querySelector('[data-perfil-form]');
perfilForm.addEventListener('submit', async event => {
  event.preventDefault();
  if (!usuarioActual || !perfilForm.reportValidity()) return;
  const boton = perfilForm.querySelector('[data-profile-save]');
  boton.disabled = true;
  mostrarFeedback('Guardando perfil…');

  try {
    let photoURL = perfilActual?.photoURL || usuarioActual.photoURL || '';
    let bannerURL = perfilActual?.bannerURL || '';
    const archivos = [
      { input: perfilForm.elements.avatar, key: 'avatar', set: value => { photoURL = value; } },
      { input: perfilForm.elements.banner, key: 'banner', set: value => { bannerURL = value; } }
    ];
    for (const archivo of archivos) {
      const file = archivo.input.files[0];
      if (!file) continue;
      if (!file.type.startsWith('image/') || file.size > 5 * 1024 * 1024) {
        throw new Error('Usa una imagen de hasta 5 MB.');
      }
      const destino = ref(storage, `profiles/${usuarioActual.uid}/${archivo.key}-${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '-')}`);
      await uploadBytes(destino, file, { contentType: file.type });
      archivo.set(await getDownloadURL(destino));
    }

    const displayName = perfilForm.elements.displayName.value.trim();
    const description = perfilForm.elements.description.value.trim();
    await updateProfile(usuarioActual, { displayName, photoURL: photoURL || null });
    await setDoc(doc(db, 'profiles', usuarioActual.uid), {
      displayName,
      photoURL,
      bannerURL,
      description,
      updatedAt: serverTimestamp()
    }, { merge: true });
    await cargarPerfil(usuarioActual);
    mostrarFeedback('Perfil guardado.');
  } catch (error) {
    mostrarFeedback(error.message || mensajeError(error), true);
  } finally {
    boton.disabled = false;
  }
});

modal.querySelector('[data-password-form]').addEventListener('submit', async event => {
  event.preventDefault();
  if (!usuarioActual || !event.currentTarget.reportValidity()) return;
  const form = event.currentTarget;
  const actual = form.elements.passwordActual.value;
  const nueva = form.elements.passwordNueva.value;
  const boton = form.querySelector('button[type="submit"]');
  boton.disabled = true;
  try {
    const credential = EmailAuthProvider.credential(usuarioActual.email, actual);
    await reauthenticateWithCredential(usuarioActual, credential);
    await updatePassword(usuarioActual, nueva);
    form.reset();
    mostrarFeedback('Contraseña actualizada.');
  } catch (error) {
    const mensaje = error.code === 'auth/requires-recent-login'
      ? 'Vuelve a iniciar sesión y prueba de nuevo.'
      : mensajeError(error);
    mostrarFeedback(mensaje, true);
  } finally {
    boton.disabled = false;
  }
});

modal.querySelectorAll('[data-auth-provider]').forEach(boton => {
  boton.addEventListener('click', async () => {
    const provider = boton.dataset.authProvider === 'google'
      ? new GoogleAuthProvider()
      : new GithubAuthProvider();
    boton.disabled = true;
    mostrarFeedback('Conectando con Firebase…');
    try {
      await signInWithPopup(auth, provider);
      modal.close();
    } catch (error) {
      mostrarFeedback(mensajeError(error), true);
    } finally {
      boton.disabled = false;
    }
  });
});

modal.querySelector('[data-auth-reset]').addEventListener('click', async () => {
  const email = formulario.elements.email.value.trim();
  if (!email) {
    mostrarFeedback('Escribe tu correo para enviarte el enlace de recuperación.', true);
    formulario.elements.email.focus();
    return;
  }
  try {
    await sendPasswordResetEmail(auth, email);
    mostrarFeedback('Te enviamos un enlace para restablecer tu contraseña.');
  } catch (error) {
    mostrarFeedback(mensajeError(error), true);
  }
});

modal.querySelector('[data-auth-signout]').addEventListener('click', async () => {
  await signOut(auth);
  modal.close();
});
modal.querySelector('.x').addEventListener('click', () => modal.close());
modal.addEventListener('click', event => {
  if (event.target === modal) modal.close();
});
dock.querySelector('[data-auth-open]').addEventListener('click', () => {
  mostrarFeedback('');
  actualizarSesion(usuarioActual);
  modal.showModal();
});
onAuthStateChanged(auth, actualizarSesion);
