import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';

import { Observable, catchError, map, throwError, tap, of, switchMap, from } from 'rxjs';

import { Router } from '@angular/router';
import { StorageService } from '../storage.service';
import { URL_TURISMO } from 'src/app/config/url.servicios';
import { Plato } from 'src/app/interfaces/turismo.interfac';

@Injectable({
  providedIn: 'root'
})
export class PlatosService {

  constructor(
    private http: HttpClient,
    private storageService: StorageService,
    private router: Router
  ) { }

  /**
   * Obtiene todos los platos
   * @returns Observable con el listado de platos
   */
  getPlatos(): Observable<any> {
    const url = `${URL_TURISMO}/platos`;

    return this.http.get<any>(url).pipe(
      tap((response) => {
        console.log('DATOS de platos recibidos del servidor:', response);
      }),
      catchError(this.handleError.bind(this))
    );
  }

  /**
   * Obtiene un plato específico por ID
   * @param id ID del plato a buscar
   * @returns Observable con el plato encontrado
   */
  getPlatoById(id: string): Observable<Plato> {
    const url = `${URL_TURISMO}/platos/${id}`;

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
   * Obtiene platos por nombre
   * @param nombre Nombre del plato a buscar
   * @returns Observable con el plato encontrado
   */
  getPlatoByName(nombre: string): Observable<any> {
    const url = `${URL_TURISMO}/platos/nombre`;
    const body = { nombre };

    return this.http.post<any>(url, body).pipe(
      tap(response => console.log('Respuesta de búsqueda por nombre:', response)),
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
   * Realiza operaciones CRUD sobre platos
   * @param plato Datos del plato
   * @param accion Acción a realizar (insertar, modificar, eliminar)
   * @returns Observable con la respuesta del servidor
   */
  crud_Platos(plato: Plato, accion: 'insertar' | 'modificar' | 'eliminar'): Observable<any> {
    const platoToSend = this.preparePlatoData(plato);

    return this.getAuthHeaders().pipe(
      switchMap(headers => {
        switch (accion) {
          case 'eliminar':
            const deleteUrl = `${URL_TURISMO}/platos/eliminar/${plato._id}`;
            return this.http.delete(deleteUrl, { headers }).pipe(
              tap(response => console.log('Respuesta de eliminación de plato:', response)),
              catchError(this.handleError.bind(this))
            );

          case 'insertar':
            const postUrl = `${URL_TURISMO}/platos/crear`;
            return this.http.post(postUrl, platoToSend, { headers }).pipe(
              tap(response => console.log('Respuesta de inserción de plato:', response)),
              catchError(this.handleError.bind(this))
            );

          case 'modificar':
            const putUrl = `${URL_TURISMO}/platos/editar/${plato._id}`;
            return this.http.put(putUrl, platoToSend, { headers }).pipe(
              tap(response => console.log('Respuesta de modificación de plato:', response)),
              catchError(this.handleError.bind(this))
            );

          default:
            return throwError(() => new Error('Acción no válida'));
        }
      }),
      catchError(error => {
        console.error(`Error en operación CRUD de plato (${accion}):`, error);
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
          console.log('Añadiendo token a la petición de plato');
          return headers.set('x-token', token);
        } else {
          console.warn('No hay token disponible para la petición de plato');
        }
        
        return headers;
      }),
      catchError(error => {
        console.error('Error al obtener headers de autenticación para plato:', error);
        return of(new HttpHeaders({
          'Content-Type': 'application/json'
        }));
      })
    );
  }

  /**
   * Prepara los datos del plato para enviarlos al servidor
   * @param plato Datos del plato
   * @returns Objeto con los datos preparados
   */
  private preparePlatoData(plato: Plato): any {
    const platoData: Partial<Plato> = {
      nombre: plato.nombre,
      descripcion: plato.descripcion,
      precio: plato.precio,
      pais_id: plato.pais_id,
      sitio_id: plato.sitio_id || [],
      img: plato.img
    };

    // Solo incluye el _id si existe y no es una operación de inserción
    if (plato._id) {
      platoData._id = plato._id;
    }

    return platoData;
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
    console.log('Manejando error de autenticación en platos');
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