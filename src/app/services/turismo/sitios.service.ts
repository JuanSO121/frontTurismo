import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';

import { Observable, catchError, map, throwError, tap, of, switchMap, from } from 'rxjs';

import { Router } from '@angular/router';
import { StorageService } from '../storage.service';
import { URL_TURISMO } from 'src/app/config/url.servicios';
import { Sitio } from 'src/app/interfaces/turismo.interfac';

@Injectable({
  providedIn: 'root'
})
export class SitiosService {

  constructor(
    private http: HttpClient,
    private storageService: StorageService,
    private router: Router
  ) { }

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
   * Realiza operaciones CRUD sobre sitios
   * @param sitio Datos del sitio
   * @param accion Acción a realizar (insertar, modificar, eliminar)
   * @returns Observable con la respuesta del servidor
   */
  crud_Sitios(sitio: Sitio, accion: 'insertar' | 'modificar' | 'eliminar'): Observable<any> {
    const sitioToSend = this.prepareSitioData(sitio);

    return this.getAuthHeaders().pipe(
      switchMap(headers => {
        switch (accion) {
          case 'eliminar':
            const deleteUrl = `${URL_TURISMO}/sitios/eliminar/${sitio._id}`;
            return this.http.delete(deleteUrl, { headers }).pipe(
              tap(response => console.log('Respuesta de eliminación de sitio:', response)),
              catchError(this.handleError.bind(this))
            );

          case 'insertar':
            const postUrl = `${URL_TURISMO}/sitios/crear`;
            return this.http.post(postUrl, sitioToSend, { headers }).pipe(
              tap(response => console.log('Respuesta de inserción de sitio:', response)),
              catchError(this.handleError.bind(this))
            );

          case 'modificar':
            const putUrl = `${URL_TURISMO}/sitios/editar/${sitio._id}`;
            return this.http.put(putUrl, sitioToSend, { headers }).pipe(
              tap(response => console.log('Respuesta de modificación de sitio:', response)),
              catchError(this.handleError.bind(this))
            );

          default:
            return throwError(() => new Error('Acción no válida'));
        }
      }),
      catchError(error => {
        console.error(`Error en operación CRUD de sitio (${accion}):`, error);
        return throwError(() => error);
      })
    );
  }

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
        }
        
        return headers;
      }),
      catchError(error => {
        console.error('Error al obtener headers de autenticación para sitio:', error);
        return of(new HttpHeaders({
          'Content-Type': 'application/json'
        }));
      })
    );
  }

  /**
   * Prepara los datos del sitio para enviarlos al servidor
   * @param sitio Datos del sitio
   * @returns Objeto con los datos preparados
   */
  private prepareSitioData(sitio: Sitio): any {
    const sitioData: Partial<Sitio> = {
      nombre: sitio.nombre,
      tipo: sitio.tipo,
      descripcion: sitio.descripcion,
      direccion: sitio.direccion,
      ciudad: sitio.ciudad,
      img: sitio.img,
      pais_id: sitio.pais_id,
      plato_id: sitio.plato_id || []
    };

    // Solo incluye el _id si existe y no es una operación de inserción
    if (sitio._id) {
      sitioData._id = sitio._id;
    }

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
      errorMessage = `Error de red: ${error.error.message}`;
    } else {
      errorMessage = `Código de error: ${error.status}, mensaje: ${error.message}`;
      
      if (error.error && error.error.msg) {
        errorMessage = error.error.msg;
      }
      
      if (error.status === 401) {
        errorMessage = 'No autorizado: La sesión ha expirado o no tienes permisos.';
        this.handleAuthError();
      }
    }

    console.error(errorMessage);
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