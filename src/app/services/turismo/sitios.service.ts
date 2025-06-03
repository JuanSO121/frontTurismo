import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Observable, throwError, from, of } from 'rxjs';
import { catchError, map, switchMap, tap } from 'rxjs/operators';
import { Router } from '@angular/router';
import { StorageService } from '../storage.service';
import { URL_TURISMO } from 'src/app/config/url.servicios';
import { Sitio } from 'src/app/interfaces/turismo.interfac';

export interface Visita {
  _id?: string;
  famoso_id: string[];
  usuario_id: string;
  sitio_id: string;
  fecha: Date;
  comentario: string;
  img?: string;
  qr_code?: string;
  coordenadas?: string;
  usuario_nombre?: string; // Campo adicional para mostrar el nombre
}

@Injectable({
  providedIn: 'root'
})
export class SitiosService {

  constructor(
    private http: HttpClient,
    private storageService: StorageService,
    private router: Router
  ) { }

  // ======================== MÉTODOS PÚBLICOS (NO REQUIEREN AUTENTICACIÓN) ========================

  /**
   * Obtiene todos los sitios
   * @returns Observable con el listado de sitios
   */
  getSitios(): Observable<any> {
    const url = `${URL_TURISMO}/sitios`;

    return this.http.get<any>(url).pipe(
      tap((response) => {
        console.log('DATOS de sitios recibidos del servidor:', response);
      }),
      catchError(this.handleError.bind(this))
    );
  }

  /**
   * Obtiene un sitio específico por ID
   * @param id ID del sitio a buscar
   * @returns Observable con el sitio encontrado
   */
  getSitioById(id: string): Observable<Sitio> {
    const url = `${URL_TURISMO}/sitios/${id}`;

    return this.http.get<any>(url).pipe(
      map(response => {
        if (response && response.ok && response.data) {
          return response.data;
        }
        return response;
      }),
      catchError(this.handleError.bind(this))
    );
  }

  /**
   * Obtiene sitios por nombre
   * @param nombre Nombre del sitio a buscar
   * @returns Observable con el sitio encontrado
   */
  getSitioByName(nombre: string): Observable<any> {
    const url = `${URL_TURISMO}/sitios/nombre`;
    const body = { nombre };

    return this.http.post<any>(url, body).pipe(
      tap(response => console.log('Respuesta de búsqueda por nombre:', response)),
      catchError(this.handleError.bind(this))
    );
  }

  /**
   * Obtiene sitios por país
   * @param pais Nombre del país
   * @returns Observable con los sitios encontrados
   */
  getSitiosByPais(pais: string): Observable<any> {
    const url = `${URL_TURISMO}/sitios/pais`;
    const body = { pais };

    return this.http.post<any>(url, body).pipe(
      tap(response => console.log('Respuesta de búsqueda por país:', response)),
      catchError(this.handleError.bind(this))
    );
  }

  /**
   * Obtiene sitios por ciudad
   * @param ciudad Nombre de la ciudad
   * @returns Observable con los sitios encontrados
   */
  getSitiosByCiudad(ciudad: string): Observable<any> {
    const url = `${URL_TURISMO}/sitios/ciudad`;
    const body = { ciudad };

    return this.http.post<any>(url, body).pipe(
      tap(response => console.log('Respuesta de búsqueda por ciudad:', response)),
      catchError(this.handleError.bind(this))
    );
  }

  /**
   * Obtiene el top 10 de sitios más visitados por país
   * @param pais Nombre del país
   * @returns Observable con los sitios más visitados
   */
  getTop10SitiosByPais(pais: string): Observable<any> {
    const url = `${URL_TURISMO}/sitios/top10porpais`;
    const body = { pais };

    return this.http.post<any>(url, body).pipe(
      tap(response => console.log('Respuesta de top 10 sitios por país:', response)),
      catchError(this.handleError.bind(this))
    );
  }

  // ======================== MÉTODOS ADMIN (REQUIEREN AUTENTICACIÓN) ========================

  /**
   * Crea un nuevo sitio (SOLO ADMIN)
   * @param sitio Datos del sitio a crear
   * @returns Observable con la respuesta del servidor
   */
  crearSitio(sitio: Sitio): Observable<any> {
    const url = `${URL_TURISMO}/sitios/crear`;
    const sitioData = this.prepareSitioData(sitio);

    return this.getAuthHeaders().pipe(
      switchMap(headers => {
        return this.http.post(url, sitioData, { headers }).pipe(
          tap(response => {
            console.log('Sitio creado exitosamente:', response);
          }),
          catchError(this.handleError.bind(this))
        );
      }),
      catchError(error => {
        console.error('Error al crear sitio:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Actualiza un sitio existente (SOLO ADMIN)
   * @param sitio Datos del sitio a actualizar
   * @returns Observable con la respuesta del servidor
   */
  actualizarSitio(sitio: Sitio): Observable<any> {
    if (!sitio._id) {
      return throwError(() => new Error('ID del sitio es requerido para actualizar'));
    }

    const url = `${URL_TURISMO}/sitios/editar/${sitio._id}`;
    const sitioData = this.prepareSitioData(sitio);

    return this.getAuthHeaders().pipe(
      switchMap(headers => {
        return this.http.put(url, sitioData, { headers }).pipe(
          tap(response => {
            console.log('Sitio actualizado exitosamente:', response);
          }),
          catchError(this.handleError.bind(this))
        );
      }),
      catchError(error => {
        console.error(`Error al actualizar sitio ${sitio._id}:`, error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Elimina un sitio específico (SOLO ADMIN)
   * @param id ID del sitio a eliminar
   * @returns Observable con la respuesta del servidor
   */
  eliminarSitio(id: string): Observable<any> {
    const url = `${URL_TURISMO}/sitios/eliminar/${id}`;

    return this.getAuthHeaders().pipe(
      switchMap(headers => {
        return this.http.delete(url, { headers }).pipe(
          tap(response => {
            console.log('Sitio eliminado exitosamente:', response);
          }),
          catchError(this.handleError.bind(this))
        );
      }),
      catchError(error => {
        console.error(`Error al eliminar sitio ${id}:`, error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Método CRUD unificado para sitios (SOLO ADMIN)
   * @param sitio Datos del sitio
   * @param accion Acción a realizar (crear, actualizar, eliminar)
   * @returns Observable con la respuesta del servidor
   */
  crudSitios(sitio: Sitio, accion: 'crear' | 'actualizar' | 'eliminar'): Observable<any> {
    switch (accion) {
      case 'crear':
        return this.crearSitio(sitio);
        
      case 'actualizar':
        return this.actualizarSitio(sitio);
        
      case 'eliminar':
        if (!sitio._id) {
          return throwError(() => new Error('ID del sitio es requerido para eliminar'));
        }
        return this.eliminarSitio(sitio._id);
        
      default:
        return throwError(() => new Error(`Acción no válida: ${accion}`));
    }
  }

  // ======================== MÉTODOS DE UTILIDAD ========================

  /**
   * Verifica si el usuario está autenticado
   * @returns Promise con el estado de autenticación
   */
  async isAuthenticated(): Promise<boolean> {
    try {
      const token = await this.storageService.getCookie();
      return !!token;
    } catch (error) {
      console.error('Error al verificar autenticación:', error);
      return false;
    }
  }

  /**
   * Verifica si el usuario tiene permisos de administrador
   * @returns Promise con el estado de administrador
   */
  async isAdmin(): Promise<boolean> {
    try {
      const token = await this.storageService.getCookie();
      if (!token) return false;

      // Decodificar el token JWT para verificar el rol
      const tokenParts = token.split('.');
      if (tokenParts.length !== 3) return false;

      const payload = JSON.parse(atob(tokenParts[1]));
      
      // Verificar si tiene rol de admin (ajusta según tu estructura de token)
      return payload.role === 'ADMIN_ROLE' || payload.rol === 'admin' || payload.admin === true;
    } catch (error) {
      console.error('Error al verificar permisos de admin:', error);
      return false;
    }
  }

  // ======================== MÉTODOS PRIVADOS ========================

  /**
   * Obtiene los headers de autenticación para las peticiones
   * @returns Observable con los headers
   */
  private getAuthHeaders(): Observable<HttpHeaders> {
    return from(this.storageService.getCookie()).pipe(
      map(token => {
        const headers = new HttpHeaders({
          'Content-Type': 'application/json'
        });
        
        if (token) {
          console.log('Añadiendo token a la petición de sitio');
          return headers.set('x-token', token);
        } else {
          console.warn('No hay token disponible para la petición de sitio');
          throw new Error('Token de autenticación requerido');
        }
      }),
      catchError(error => {
        console.error('Error al obtener headers de autenticación para sitio:', error);
        return throwError(() => new Error('Error de autenticación'));
      })
    );
  }

  /**
   * Prepara los datos del sitio para enviarlos al servidor
   * @param sitio Datos del sitio
   * @returns Objeto con los datos preparados
   */
  private prepareSitioData(sitio: Sitio): any {
    // Validar campos requeridos
    if (!sitio.nombre?.trim()) {
      throw new Error('El nombre del sitio es requerido');
    }
    if (!sitio.tipo?.trim()) {
      throw new Error('El tipo del sitio es requerido');
    }
    if (!sitio.ciudad?.trim()) {
      throw new Error('La ciudad del sitio es requerida');
    }
    if (!sitio.pais_id?.trim()) {
      throw new Error('El país del sitio es requerido');
    }

    const sitioData: Partial<Sitio> = {
      nombre: sitio.nombre.trim(),
      tipo: sitio.tipo.trim(),
      descripcion: sitio.descripcion?.trim() || '',
      direccion: sitio.direccion?.trim() || '',
      ciudad: sitio.ciudad.trim(),
      img: sitio.img?.trim() || '',
      pais_id: sitio.pais_id.trim(),
      plato_id: Array.isArray(sitio.plato_id) ? sitio.plato_id : []
    };

    // Solo incluir coordenadas si están presentes
    // if (sitio.coordenadas) {
    //   sitioData.coordenadas = sitio.coordenadas;
    // }

    console.log('Datos del sitio preparados:', sitioData);
    return sitioData;
  }

  /**
   * Maneja los errores HTTP
   * @param error Error HTTP
   * @returns Observable con el error
   */
  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'Ha ocurrido un error desconocido';

    if (error.error instanceof ErrorEvent) {
      // Error del lado del cliente
      errorMessage = `Error de red: ${error.error.message}`;
    } else {
      // Error del lado del servidor
      console.log('Error del servidor:', error);
      
      if (error.error && error.error.msg) {
        errorMessage = error.error.msg;
      } else {
        errorMessage = `Código de error: ${error.status}, mensaje: ${error.message}`;
      }
      
      // Manejar errores específicos
      switch (error.status) {
        case 401:
          errorMessage = 'No autorizado: La sesión ha expirado o no tienes permisos.';
          this.handleAuthError();
          break;
        case 403:
          errorMessage = 'Acceso denegado: No tienes permisos de administrador.';
          break;
        case 404:
          errorMessage = 'Recurso no encontrado.';
          break;
        case 406:
          errorMessage = error.error?.msg || 'Datos no válidos para la operación.';
          break;
        case 418:
          errorMessage = error.error?.msg || 'El recurso ya existe.';
          break;
        case 500:
          errorMessage = 'Error interno del servidor. Contacte al administrador.';
          break;
      }
    }

    console.error('Error en SitiosService:', errorMessage);
    return throwError(() => new Error(errorMessage));
  }

  /**
   * Maneja errores de autenticación
   */
  private handleAuthError() {
    console.log('Manejando error de autenticación en sitios');
    this.storageService.removeCookie()
      .then(() => {
        this.router.navigate(['/login']);
      })
      .catch(error => {
        console.error('Error al eliminar token durante manejo de error de autenticación:', error);
        this.router.navigate(['/login']);
      });
  }
}