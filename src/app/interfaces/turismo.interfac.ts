export interface Famoso {
  _id?: string;
  ciudad: string;
  nombre: string;
  categoria: string;
  descripcion?: string;
  pais_id: string;
  img?: string | string[]; // Allow both single string and array of strings
}

export interface FamosoRanking {
  ranking: number;
  famoso_id: string;
  nombre: string;
  categoria: string;
  ciudad: string;
  descripcion: string;
  img: string;
  pais_id: string;
  totalVisitas: number;
}

// Interface para la respuesta del top 10
export interface Top10FamososResponse {
  ok: boolean;
  msg: string;
  data: FamosoRanking[];
  total: number;
}

export interface Pais {
  _id?: string;
  nombre: string;
}

export interface Plato {
  _id?: string;
  nombre: string;
  descripcion?: string;
  precio?: string;
  pais_id: string;
  sitio_id: string[]; // arreglo de IDs de sitios
  img?: string;
}

export interface Sitio {
  _id?: string;
  nombre: string;
  tipo: string;
  descripcion?: string;
  direccion: string;
  ciudad: string;
  img?: string;
  pais_id: string;
  plato_id: string[]; // arreglo de IDs de platos
}

export interface Visita {
  _id?: string;
  famoso_id: string[]; // arreglo de IDs de famosos
  usuario_id: string;
  sitio_id?: string;
  fecha: Date | string;
  comentario: string;
  img?: string;
  qr_code?: string;
  coordenadas?: string;
}

