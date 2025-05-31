import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { URL_HEROES } from '../config/url.servicios';
import { Observable, catchError, map, throwError, tap, of, switchMap, from } from 'rxjs';
import { StorageService } from './storage.service';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class VisitasService {

  constructor(
    private http: HttpClient,
    private storageService: StorageService,
    private router: Router
  ) { }

  /**
   * Obtiene todas las visitas del usuario autenticado
   * @returns Observable con el listado de visitas
   */
  getVisitas(): Observable<any> {
    return this.getAuthHeaders().pipe(
      switchMap(headers => {
        const url = `${URL_HEROES}/visitas`;
        return this.http.get<any>(url, { headers }).pipe(
          tap((response) => {
            console.log('Visitas recibidas del servidor:', response);
          }),
          catchError(this.handleError.bind(this))
        );
      })
    );
  }

  /**
   * Crea una nueva visita
   * @param visita Datos de la visita a crear
   * @returns Observable con la respuesta del servidor
   */
  crearVisita(visita: any): Observable<any> {
    return this.getAuthHeaders().pipe(
      switchMap(headers => {
        const url = `${URL_HEROES}/visitas`;
        return this.http.post(url, visita, { headers }).pipe(
          tap(response => console.log('Respuesta de creación:', response)),
          catchError(this.handleError.bind(this))
        );
      })
    );
  }

  /**
   * Actualiza una visita existente
   * @param id ID de la visita
   * @param visita Datos actualizados
   * @returns Observable con la respuesta del servidor
   */
  actualizarVisita(id: string, visita: any): Observable<any> {
    return this.getAuthHeaders().pipe(
      switchMap(headers => {
        const url = `${URL_HEROES}/visitas/${id}`;
        return this.http.put(url, visita, { headers }).pipe(
          tap(response => console.log('Respuesta de actualización:', response)),
          catchError(this.handleError.bind(this))
        );
      })
    );
  }

  /**
   * Elimina una visita
   * @param id ID de la visita a eliminar
   * @returns Observable con la respuesta del servidor
   */
  eliminarVisita(id: string): Observable<any> {
    return this.getAuthHeaders().pipe(
      switchMap(headers => {
        const url = `${URL_HEROES}/visitas/${id}`;
        return this.http.delete(url, { headers }).pipe(
          tap(response => console.log('Respuesta de eliminación:', response)),
          catchError(this.handleError.bind(this))
        );
      })
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
          console.log('Añadiendo token a la petición');
          return headers.set('x-token', token);
        } else {
          console.warn('No hay token disponible para la petición');
        }
        
        return headers;
      }),
      catchError(error => {
        console.error('Error al obtener headers de autenticación:', error);
        return of(new HttpHeaders({
          'Content-Type': 'application/json'
        }));
      })
    );
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
    console.log('Manejando error de autenticación');
    this.storageService.removeCookie()
      .then(() => {
        this.router.navigate(['/login']);
      })
      .catch(error => {
        console.error('Error al eliminar token:', error);
        this.router.navigate(['/login']);
      });
  }
}