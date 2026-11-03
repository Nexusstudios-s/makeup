const MARCA = 'Make Up\nAngelica Cardenas';
const MARCA_COMPLETA = 'Make Up By Angelica Cardenas';
const WHATSAPP = '3154885493';
const INSTAGRAM = 'https://www.instagram.com/makeupby_angelicacardenas?utm_source=ig_web_button_share_sheet&rpxt=ZDNlZDc0MzIxNw==';
const FACEBOOK = '';
const TIKTOK = 'https://www.tiktok.com/@angelicacardenas49?_r=1&_t=ZS-9B4UtuVjIYr';

const CATEGORIAS = {
  bases: {
    titulo: 'Bases',
    texto: 'Bases Atenea en varios tonos para elegir con asesoría.',
    imagen: 'media/carrusel/bases-atenea.jpeg',
    colores: ['#ecd6c8', '#d9b8a4']
  },
  capilar: {
    titulo: 'Cuidado capilar',
    texto: 'Cuidado, protección y peinado para el cabello.',
    imagen: 'media/productos/cuidado-capilar-ole.jpeg',
    colores: ['#ecc9cd', '#cf9aa8']
  },
  'cuidado-facial': {
    titulo: 'Cuidado facial',
    texto: 'Limpiadores, sérums y cremas de las marcas que aparecen en nuestras fotos.',
    imagen: 'media/productos/WhatsApp Image 2026-11-02 at 9.05.40 AM (4).jpeg',
    colores: ['#d6dfd0', '#a8bdad']
  },
  labiales: {
    titulo: 'Labios',
    texto: 'Brillos y tonos Atenea para completar tu maquillaje.',
    imagen: 'media/productos/WhatsApp Image 2026-11-02 at 9.05.57 AM (1).jpeg',
    colores: ['#ecc9cd', '#cf9aa8']
  },
  ojos: {
    titulo: 'Ojos',
    texto: 'Paletas de sombras en tonos rosas y neutros.',
    imagen: 'media/productos/paleta-sombras.jpeg',
    colores: ['#d8cde6', '#ab9cc8']
  },
  rostro: {
    titulo: 'Rostro',
    texto: 'Polvos, rubores y sticks de color para el rostro.',
    imagen: 'media/productos/polvo-rostro-sandstorm.jpeg',
    colores: ['#cfdcd2', '#9fbba8']
  },
  accesorios: {
    titulo: 'Accesorios',
    texto: 'Botellas y vasos térmicos para acompañarte.',
    imagen: 'media/productos/termo-cafe.jpeg',
    colores: ['#cbd8e6', '#9db5cf']
  }
};

const PRODUCTOS = [
  {
    id: 'bas-1', categoria: 'bases', destacado: true,
    nombre: 'Base Atenea 1st Scene Serum Tinted', precio: null,
    imagen: 'media/carrusel/tonos-base-atenea.jpeg',
    descripcion: 'La foto muestra la base Atenea 1st Scene Serum Tinted y sus tonos aplicados sobre la piel.',
    detalles: ['Envase de 30 ml', 'Varios tonos visibles', 'Consulta disponibilidad'],
    tonos: [
      { n: 'Light', c: '#f5ddcb' }, { n: 'Porcelain', c: '#efcfb3' },
      { n: 'Cream', c: '#e8c19d' }, { n: 'Vanilla', c: '#dfb38a' },
      { n: 'Almond', c: '#d5a176' }, { n: 'Olive', c: '#c79469' },
      { n: 'Temple', c: '#c08458' }, { n: 'Sand', c: '#a96e45' },
      { n: 'Ebony', c: '#714538' }
    ]
  },
  {
    id: 'cap-1', categoria: 'capilar', destacado: true,
    nombre: 'Cuidado capilar Olé', precio: null,
    imagen: 'media/productos/cuidado-capilar-ole.jpeg',
    descripcion: 'La foto reúne productos Olé para el lavado, tratamiento y cuidado diario del cabello.',
    detalles: ['Línea de cuidado capilar', 'Consulta productos disponibles']
  },
  {
    id: 'cap-2', categoria: 'capilar',
    nombre: 'Óleo Extraordinario Elvive', precio: null,
    imagen: 'media/productos/serum-capilar-elvive.jpeg',
    descripcion: 'Aceite capilar Elvive Óleo Extraordinario. La imagen muestra el envase y sus beneficios para el cabello.',
    detalles: ['Envase de 100 ml', 'Nutrición y brillo', 'Consulta disponibilidad']
  },
  {
    id: 'cap-3', categoria: 'capilar',
    nombre: 'Perfume capilar Click Hair', precio: null,
    imagen: 'media/carrusel/perfume-capilar-clickhair.jpeg',
    descripcion: 'Perfume capilar Click Hair con extracto de miel y brillo intenso, como indica el envase.',
    detalles: ['Envase de 100 ml', 'Extracto de miel', 'Consulta aromas disponibles']
  },
  {
    id: 'cap-4', categoria: 'capilar',
    nombre: 'Olé Termo & Desenredo', precio: null,
    imagen: 'media/productos/protector-termico-ole.jpeg',
    descripcion: 'Sprays Olé para protección térmica y desenredo del cabello.',
    detalles: ['Dos presentaciones visibles', 'Protección térmica', 'Consulta disponibilidad']
  },
  {
    id: 'ojo-1', categoria: 'ojos',
    nombre: 'Paleta de sombras en tonos rosas', precio: null,
    imagen: 'media/productos/paleta-sombras.jpeg',
    descripcion: 'Paleta abierta con sombras mate y brillantes en tonos rosas, durazno y neutros.',
    detalles: ['Tonos mate y brillantes', 'Gama rosa y neutra', 'Consulta disponibilidad']
  },
  {
    id: 'ros-1', categoria: 'rostro',
    nombre: 'Polvo compacto Sand Storm', precio: null,
    imagen: 'media/productos/polvo-rostro-sandstorm.jpeg',
    descripcion: 'Polvo compacto Sand Storm en tonos cálidos, junto a muestras de color y un look de maquillaje.',
    detalles: ['Tonos cálidos', 'Formato compacto', 'Consulta disponibilidad']
  },
  {
    id: 'acc-1', categoria: 'accesorios', destacado: true,
    nombre: 'Botella térmica Mickey', precio: null,
    imagen: 'media/productos/botella-mickey.jpeg',
    descripcion: 'Botella térmica gris y negra con diseño de Mickey Mouse, tapa con seguro y correa.',
    detalles: ['Tapa con seguro', 'Incluye correa', 'Consulta disponibilidad']
  },
  {
    id: 'acc-2', categoria: 'accesorios',
    nombre: 'Vaso térmico para café', precio: null,
    imagen: 'media/productos/termo-cafe.jpeg',
    descripcion: 'Vaso térmico color caramelo con tapa clara y asa para llevar bebidas.',
    detalles: ['Tapa clara', 'Asa para llevar', 'Consulta disponibilidad']
  },
  {
    id: 'piel-1', categoria: 'cuidado-facial', destacado: true,
    nombre: 'Medicube PDRN Pink Peptide Serum', precio: null,
    imagen: 'media/productos/WhatsApp Image 2026-10-29 at 3.39.07 PM.jpeg',
    descripcion: 'Sérum Medicube PDRN Pink Peptide con PDRN de sodio al 1% y complejo de cinco péptidos, según el envase.',
    detalles: ['30 ml', 'PDRN de sodio al 1%', 'Complejo de cinco péptidos']
  },
  {
    id: 'piel-2', categoria: 'cuidado-facial',
    nombre: 'Medicube PDRN Pink Collagen Jelly Eye Mask', precio: null,
    imagen: 'media/productos/WhatsApp Image 2026-11-02 at 9.05.39 AM.jpeg',
    descripcion: 'Mascarillas de gel para el contorno de ojos de la línea PDRN Pink Collagen Jelly.',
    detalles: ['Seis pares por caja', 'Mascarillas para el contorno de ojos']
  },
  {
    id: 'piel-3', categoria: 'cuidado-facial',
    nombre: 'Medicube PDRN Pink Glutathione Serum Mist', precio: null,
    imagen: 'media/productos/WhatsApp Image 2026-11-02 at 9.05.39 AM (1).jpeg',
    descripcion: 'Bruma facial bifásica Medicube PDRN Pink Glutathione Serum Mist.',
    detalles: ['100 ml', 'Agitar antes de usar']
  },
  {
    id: 'piel-4', categoria: 'cuidado-facial',
    nombre: 'Mixsoon Bean Essence', precio: null,
    imagen: 'media/productos/WhatsApp Image 2026-11-02 at 9.05.40 AM.jpeg',
    descripcion: 'Esencia facial Mixsoon Bean Essence en frasco con dosificador.',
    detalles: ['50 ml']
  },
  {
    id: 'piel-5', categoria: 'cuidado-facial',
    nombre: 'Celimax Retinal Shot Tightening Booster', precio: null,
    imagen: 'media/productos/WhatsApp Image 2026-11-02 at 9.05.40 AM (1).jpeg',
    descripcion: 'Sérum de cuidado facial Celimax Retinal Shot Tightening Booster.',
    detalles: ['15 ml', 'Retinal 0,1%', 'Matrixyl 3000 al 3%']
  },
  {
    id: 'piel-6', categoria: 'cuidado-facial',
    nombre: 'Anua Heartleaf + BHA Pore Deep Cleansing Foam', precio: null,
    imagen: 'media/productos/WhatsApp Image 2026-11-02 at 9.05.40 AM (2).jpeg',
    descripcion: 'Limpiador facial en espuma Anua Heartleaf + BHA Quercetinol Pore Deep Cleansing Foam.',
    detalles: ['150 ml', 'Heartleaf + BHA']
  },
  {
    id: 'piel-7', categoria: 'cuidado-facial',
    nombre: 'SKIN1004 Madagascar Centella Teca Cream', precio: null,
    imagen: 'media/productos/WhatsApp Image 2026-11-02 at 9.05.40 AM (3).jpeg',
    descripcion: 'Crema facial Teca de SKIN1004 Madagascar Centella.',
    detalles: ['75 ml']
  },
  {
    id: 'piel-8', categoria: 'cuidado-facial', destacado: true,
    nombre: 'Anua Azelaic Acid 10 + Hyaluron Serum', precio: null,
    imagen: 'media/productos/WhatsApp Image 2026-11-02 at 9.05.40 AM (4).jpeg',
    descripcion: 'Sérum Anua Azelaic Acid 10 + Hyaluron Redness Soothing Serum.',
    detalles: ['30 ml', 'Ácido azelaico al 10% + ácido hialurónico']
  },
  {
    id: 'piel-9', categoria: 'cuidado-facial',
    nombre: 'Beauty of Joseon Revive Eye Serum', precio: null,
    imagen: 'media/productos/WhatsApp Image 2026-11-02 at 9.05.40 AM (5).jpeg',
    descripcion: 'Sérum para el contorno de ojos Revive Eye Serum de Beauty of Joseon.',
    detalles: ['Ginseng + retinal']
  },
  {
    id: 'piel-10', categoria: 'cuidado-facial',
    nombre: 'SKIN1004 Madagascar Centella Teca Soothing Toner', precio: null,
    imagen: 'media/productos/WhatsApp Image 2026-11-02 at 9.05.41 AM (3).jpeg',
    descripcion: 'Tónico facial calmante Teca de SKIN1004 Madagascar Centella.',
    detalles: ['210 ml']
  },
  {
    id: 'piel-11', categoria: 'cuidado-facial',
    nombre: 'Medicube Zero Pore Cream 2.0', precio: null,
    imagen: 'media/productos/WhatsApp Image 2026-11-02 at 9.05.42 AM.jpeg',
    descripcion: 'Crema facial Medicube Zero Pore Cream 2.0.',
    detalles: ['50 ml', 'Pantenol + alantoína', 'Ácido hialurónico']
  },
  {
    id: 'piel-12', categoria: 'cuidado-facial',
    nombre: 'Tocobo Calamine Cleansing Duo', precio: null,
    imagen: 'media/productos/WhatsApp Image 2026-11-02 at 9.05.42 AM (1).jpeg',
    descripcion: 'La foto muestra el aceite limpiador Calamine Pore Control Cleansing Oil y la espuma Coconut Clay Cleansing Foam.',
    detalles: ['Aceite limpiador: 20 ml', 'Espuma limpiadora: 15 ml']
  },
  {
    id: 'cap-5', categoria: 'capilar',
    nombre: 'got2b Glued Styling Spiking Glue', precio: null,
    imagen: 'media/productos/WhatsApp Image 2026-11-02 at 9.05.41 AM.jpeg',
    descripcion: 'Gel fijador got2b Glued Styling Spiking Glue para peinados de fijación fuerte.',
    detalles: ['35 g', 'Resistente al agua, según el envase']
  },
  {
    id: 'lab-1', categoria: 'labiales', destacado: true,
    nombre: 'Atenea Sublime Defined Gloss', precio: 48000,
    imagen: 'media/productos/WhatsApp Image 2026-11-02 at 9.05.57 AM (1).jpeg',
    descripcion: 'Brillo labial Atenea Sublime Defined Gloss con aplicador de precisión, vitamina E y aceite de coco.',
    detalles: ['Acabado luminoso', 'Vitamina E + aceite de coco']
  },
  {
    id: 'lab-2', categoria: 'labiales',
    nombre: 'Atenea Deep Plum', precio: 34000,
    imagen: 'media/productos/WhatsApp Image 2026-11-02 at 9.05.57 AM (3).jpeg',
    descripcion: 'Tono Deep Plum de Atenea, mostrado en una pieza promocional con acabado brillante.',
    detalles: ['Tono vino profundo']
  },
  {
    id: 'ros-2', categoria: 'rostro', destacado: true,
    nombre: 'Atenea Sunbaked Stick', precio: 44000,
    imagen: 'media/productos/WhatsApp Image 2026-11-02 at 9.05.57 AM (2).jpeg',
    descripcion: 'Stick de color Atenea disponible en los tonos Sunbaked, Oasm Flame, Cocoa Dream y Cranberry Juice.',
    detalles: ['Cuatro tonos mostrados'],
    tonos: [
      { n: 'Sunbaked', c: '#eaa79d' }, { n: 'Oasm Flame', c: '#dc7775' },
      { n: 'Cocoa Dream', c: '#754449' }, { n: 'Cranberry Juice', c: '#b5244d' }
    ]
  },
  {
    id: 'ros-3', categoria: 'rostro',
    nombre: 'Iluminador compacto', precio: null,
    imagen: 'media/productos/WhatsApp Image 2026-11-02 at 9.05.57 AM.jpeg',
    descripcion: 'Detalle de aplicación con brocha sobre un compacto de acabado brillante.',
    detalles: ['Aplicación con brocha', 'Consulta disponibilidad']
  }
];

window.catalogoLocal = { categorias: CATEGORIAS, productos: PRODUCTOS };
