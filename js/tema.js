(() => {
  const clave = 'tema-makeup';
  const botones = [...document.querySelectorAll('[data-cambiar-tema]')];
  let temaGuardado = 'dia';

  try {
    temaGuardado = localStorage.getItem(clave) === 'noche' ? 'noche' : 'dia';
  } catch (error) {}

  function aplicarTema(tema, guardar = true) {
    const esNoche = tema === 'noche';
    document.body.classList.toggle('modo-noche', esNoche);
    document.documentElement.dataset.tema = tema;

    botones.forEach(boton => {
      const etiqueta = esNoche ? 'Cambiar a modo día' : 'Cambiar a modo noche';
      boton.setAttribute('aria-label', etiqueta);
      boton.setAttribute('title', etiqueta);
      boton.setAttribute('aria-pressed', String(esNoche));
      boton.querySelector('.tema-luna').removeAttribute('hidden');
      boton.querySelector('.tema-sol').removeAttribute('hidden');
    });

    if (guardar) {
      try { localStorage.setItem(clave, tema); } catch (error) {}
    }
    window.dispatchEvent(new CustomEvent('tema:cambio', { detail: { tema } }));
  }

  aplicarTema(temaGuardado, false);
  botones.forEach(boton => boton.addEventListener('click', () => {
    aplicarTema(document.body.classList.contains('modo-noche') ? 'dia' : 'noche');
  }));
})();
