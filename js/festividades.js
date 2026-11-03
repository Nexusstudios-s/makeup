(() => {
  const colores = [
    { luz: '#fff1cb', halo: 'rgba(255, 226, 158, .65)' },
    { luz: '#e8b653', halo: 'rgba(232, 182, 83, .55)' },
    { luz: '#c95b55', halo: 'rgba(201, 91, 85, .45)' },
    { luz: '#81aa8c', halo: 'rgba(129, 170, 140, .45)' }
  ];

  function dibujarGuirnalda(guirnalda, cantidad, caidaMaxima) {
    const fragmento = document.createDocumentFragment();
    for (let indice = 0; indice < cantidad; indice += 1) {
      const luz = document.createElement('span');
      const color = colores[indice % colores.length];
      const proporcion = indice / (cantidad - 1);
      luz.className = 'bombilla-navidad';
      luz.dataset.indice = String(indice);
      luz.style.setProperty('--posicion', `${proporcion * 100}%`);
      luz.style.setProperty('--caida', `${Math.sin(proporcion * Math.PI) * caidaMaxima}px`);
      luz.style.setProperty('--color-luz', color.luz);
      luz.style.setProperty('--halo-luz', color.halo);
      luz.style.setProperty('--duracion-luz', `${2.1 + (indice % 5) * 0.22}s`);
      luz.style.setProperty('--retardo-luz', `${-((indice % 7) * 0.31)}s`);
      fragmento.append(luz);
    }
    guirnalda.append(fragmento);
  }

  const cabecera = document.querySelector('.cabecera');
  if (cabecera && !cabecera.querySelector('.luces-cabecera')) {
    const lucesCabecera = document.createElement('div');
    lucesCabecera.className = 'luces-navidad luces-cabecera';
    lucesCabecera.setAttribute('aria-hidden', 'true');
    cabecera.prepend(lucesCabecera);
    dibujarGuirnalda(lucesCabecera, 18, 3);
  }

  const lucesTemporada = document.querySelector('[data-luces-navidad]');
  if (lucesTemporada) dibujarGuirnalda(lucesTemporada, 20, 11);

  const bombillas = [...document.querySelectorAll('.bombilla-navidad')];
  const coloresNoche = [
    { luz: '#ff5277', halo: 'rgba(255, 82, 119, .88)' },
    { luz: '#42d9ff', halo: 'rgba(66, 217, 255, .86)' },
    { luz: '#ffd166', halo: 'rgba(255, 209, 102, .9)' },
    { luz: '#b67aff', halo: 'rgba(182, 122, 255, .86)' },
    { luz: '#55e6a3', halo: 'rgba(85, 230, 163, .84)' },
    { luz: '#ff8b57', halo: 'rgba(255, 139, 87, .86)' }
  ];
  const patronesNoche = [[0, 1, 2, 3, 4, 5], [2, 4, 0, 5, 1, 3], [5, 3, 1, 4, 0, 2]];
  const reducirMovimiento = window.matchMedia('(prefers-reduced-motion: reduce)');
  let patronActual = 0;
  let intervaloPatron = null;

  function aplicarPatron(tema) {
    const orden = tema === 'noche' ? patronesNoche[patronActual] : null;
    bombillas.forEach((bombilla, indice) => {
      const color = tema === 'noche'
        ? coloresNoche[orden[indice % orden.length]]
        : colores[indice % colores.length];
      bombilla.style.setProperty('--color-luz', color.luz);
      bombilla.style.setProperty('--halo-luz', color.halo);
      bombilla.style.setProperty('--retardo-luz', `${-(((indice + patronActual * 2) % 7) * 0.31)}s`);
    });
  }

  function detenerPatrones() {
    if (intervaloPatron === null) return;
    clearInterval(intervaloPatron);
    intervaloPatron = null;
  }

  function iniciarPatrones() {
    if (intervaloPatron !== null || reducirMovimiento.matches || document.hidden) return;
    intervaloPatron = setInterval(() => {
      patronActual = (patronActual + 1) % patronesNoche.length;
      aplicarPatron('noche');
    }, 5600);
  }

  function cambiarTema(tema) {
    detenerPatrones();
    if (tema === 'noche') {
      aplicarPatron('noche');
      iniciarPatrones();
      return;
    }
    aplicarPatron('dia');
  }

  window.addEventListener('tema:cambio', event => cambiarTema(event.detail.tema));
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) detenerPatrones();
    else if (document.body.classList.contains('modo-noche')) iniciarPatrones();
  });
  reducirMovimiento.addEventListener('change', () => {
    if (reducirMovimiento.matches) detenerPatrones();
    else if (document.body.classList.contains('modo-noche')) iniciarPatrones();
  });
  cambiarTema(document.body.classList.contains('modo-noche') ? 'noche' : 'dia');
})();
