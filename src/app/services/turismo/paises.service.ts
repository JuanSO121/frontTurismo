import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';

import { Observable, catchError, map, throwError, tap, of, switchMap, from } from 'rxjs';

import { Router } from '@angular/router';
import { StorageService } from '../storage.service';
import { URL_TURISMO } from 'src/app/config/url.servicios';
import { Pais } from 'src/app/interfaces/turismo.interfac';

@Injectable({
  providedIn: 'root'
})
export class PaisesService {

  constructor(
    private http: HttpClient,
    private storageService: StorageService,
    private router: Router
  ) { }

  /**
   * Obtiene todos los países
   * @returns Observable con el listado de países
   */
  getPaises(): Observable<any> {
    const url = `${URL_TURISMO}/paises`;

    return this.http.get<any>(url).pipe(
      tap((response) => {
        console.log('DATOS de países recibidos del servidor:', response);
      }),
      catchError(this.handleError.bind(this))
    );
  }

  /**
   * Obtiene un país específico por ID
   * @param id ID del país a buscar
   * @returns Observable con el país encontrado
   */
  getPaisById(id: string): Observable<Pais> {
    const url = `${URL_TURISMO}/paises/${id}`;

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
   * Obtiene país por nombre
   * @param nombre Nombre del país a buscar
   * @returns Observable con el país encontrado
   */
  getPaisByName(nombre: string): Observable<any> {
    const url = `${URL_TURISMO}/paises/nombre`;
    const body = { nombre };

    return this.http.post<any>(url, body).pipe(
      tap(response => console.log('Respuesta de búsqueda de país por nombre:', response)),
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
   * Realiza operaciones CRUD sobre países
   * @param pais Datos del país
   * @param accion Acción a realizar (insertar, modificar, eliminar)
   * @returns Observable con la respuesta del servidor
   */
  crud_Paises(pais: Pais, accion: 'insertar' | 'modificar' | 'eliminar'): Observable<any> {
    const paisToSend = this.preparePaisData(pais);

    return this.getAuthHeaders().pipe(
      switchMap(headers => {
        switch (accion) {
          case 'eliminar':
            const deleteUrl = `${URL_TURISMO}/paises/eliminar/${pais._id}`;
            return this.http.delete(deleteUrl, { headers }).pipe(
              tap(response => console.log('Respuesta de eliminación de país:', response)),
              catchError(this.handleError.bind(this))
            );

          case 'insertar':
            const postUrl = `${URL_TURISMO}/paises/crear`;
            return this.http.post(postUrl, paisToSend, { headers }).pipe(
              tap(response => console.log('Respuesta de inserción de país:', response)),
              catchError(this.handleError.bind(this))
            );

          case 'modificar':
            const putUrl = `${URL_TURISMO}/paises/editar/${pais._id}`;
            return this.http.put(putUrl, paisToSend, { headers }).pipe(
              tap(response => console.log('Respuesta de modificación de país:', response)),
              catchError(this.handleError.bind(this))
            );

          default:
            return throwError(() => new Error('Acción no válida'));
        }
      }),
      catchError(error => {
        console.error(`Error en operación CRUD de país (${accion}):`, error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Obtiene las ciudades únicas de los famosos por país
   * Esta función ayuda a obtener las ciudades disponibles para un país específico
   * @param paisId ID del país
   * @returns Observable con las ciudades disponibles
   */
  getCiudadesByPais(paisId: string): Observable<string[]> {
    // Esta función puede implementarse llamando a un endpoint específico
    // o procesando los datos de famosos para extraer ciudades únicas
    const url = `${URL_TURISMO}/paises/${paisId}/ciudades`;

    return this.http.get<any>(url).pipe(
      map(response => {
        if (response && response.ok && response.data) {
          return response.data;
        }
        return [];
      }),
      catchError(error => {
        console.error('Error al obtener ciudades del país:', error);
        return of([]);
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
          console.log('Añadiendo token a la petición de país');
          return headers.set('x-token', token);
        } else {
          console.warn('No hay token disponible para la petición de país');
        }
        
        return headers;
      }),
      catchError(error => {
        console.error('Error al obtener headers de autenticación para país:', error);
        return of(new HttpHeaders({
          'Content-Type': 'application/json'
        }));
      })
    );
  }

  /**
   * Prepara los datos del país para enviarlos al servidor
   * @param pais Datos del país
   * @returns Objeto con los datos preparados
   */
  private preparePaisData(pais: Pais): any {
    const paisData: Partial<Pais> = {
      nombre: pais.nombre
    };

    // Solo incluye el _id si existe y no es una operación de inserción
    if (pais._id) {
      paisData._id = pais._id;
    }

    return paisData;
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
    console.log('Manejando error de autenticación en países');
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