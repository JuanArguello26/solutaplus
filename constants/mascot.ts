// Fuente: PNG con canal alfa real (fondo removido correctamente,
// verificado componiendo la imagen sobre un color sólido de prueba).
// sharp().trim() recorta el margen transparente sobrante y luego se
// reescala a 560px de ancho. Medidas reales verificadas por el script
// de preparación: si se regenera el asset, volver a leer el ancho/alto
// real que imprime.
export const FOXY_MASCOT = {
  src: "/images/foxy-2.png",
  width: 560,
  height: 1003,
};
