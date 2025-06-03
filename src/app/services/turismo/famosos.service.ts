import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';

import { Observable, catchError, map, throwError, tap, of, switchMap, from } from 'rxjs';

import { Router } from '@angular/router';
import { StorageService } from '../storage.service';
import { URL_TURISMO } from 'src/app/config/url.servicios';
import { Famoso,FamosoRanking,Top10FamososResponse } from 'src/app/interfaces/turismo.interfac';

@Injectable({
  providedIn: 'root'
})
export class FamososService {

  constructor(
    private http: HttpClient,
    private storageService: StorageService,
    private router: Router
  ) { }

  /**
   * Obtiene todos los famosos
   * @returns Observable con el listado de famosos
   */
  getFamosos(): Observable<any> {
    const url = `${URL_TURISMO}/famosos`;

    return this.http.get<any>(url).pipe(
      tap((response) => {
        console.log('DATOS de famosos recibidos del servidor:', response);
      }),
      catchError(this.handleError.bind(this))
    );
  }

  /**
   * Obtiene un famoso específico por ID
   * @param id ID del famoso a buscar
   * @returns Observable con el famoso encontrado
   */
  getFamosoById(id: string): Observable<Famoso> {
    const url = `${URL_TURISMO}/famosos/${id}`;

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
   * Obtiene famosos por nombre
   * @param nombre Nombre del famoso a buscar
   * @returns Observable con el famoso encontrado
   */
  getFamosoByName(nombre: string): Observable<any> {
    const url = `${URL_TURISMO}/famosos/nombre`;
    const body = { nombre };

    return this.http.post<any>(url, body).pipe(
      tap(response => console.log('Respuesta de búsqueda por nombre:', response)),
      catchError(this.handleError.bind(this))
    );
  }

  /**
   * Obtiene famosos por categoría
   * @param categoria Categoría del famoso
   * @returns Observable con los famosos encontrados
   */
  getFamososByCategoria(categoria: string): Observable<any> {
    const url = `${URL_TURISMO}/famosos/categoria`;
    const body = { categoria };

    return this.http.post<any>(url, body).pipe(
      tap(response => console.log('Respuesta de búsqueda por categoría:', response)),
      catchError(this.handleError.bind(this))
    );
  }

  /**
   * Obtiene famosos por ciudad
   * @param ciudad Ciudad del famoso
   * @returns Observable con los famosos encontrados
   */
  getFamososByCiudad(ciudad: string): Observable<any> {
    const url = `${URL_TURISMO}/famosos/ciudad`;
    const body = { ciudad };

    return this.http.post<any>(url, body).pipe(
      tap(response => console.log('Respuesta de búsqueda por ciudad:', response)),
      catchError(this.handleError.bind(this))
    );
  }

  /**
   * Obtiene famosos por país
   * @param pais Nombre del país
   * @returns Observable con los famosos encontrados
   */
  getFamososByPais(pais: string): Observable<any> {
    const url = `${URL_TURISMO}/famosos/pais`;
    const body = { pais };

    return this.http.post<any>(url, body).pipe(
      tap(response => console.log('Respuesta de búsqueda por país:', response)),
      catchError(this.handleError.bind(this))
    );
  }

  /**
   * Obtiene el top 10 de famosos más visitados
   * @returns Observable con el ranking de famosos más visitados
   */
  getTop10FamososMasVisitados(): Observable<Top10FamososResponse> {
    const url = `${URL_TURISMO}/famosos/top`;

    return this.http.get<Top10FamososResponse>(url).pipe(
      tap(response => {
        console.log('Top 10 famosos más visitados:', response);
        if (response.data && response.data.length > 0) {
          console.log('Famoso más visitado:', response.data[0]);
        }
      }),
      map(response => {
        // Validar la estructura de la respuesta
        if (!response.ok || !response.data) {
          throw new Error('Respuesta inválida del servidor');
        }
        return response;
      }),
      catchError(this.handleError.bind(this))
    );
  }

  /**
   * Obtiene solo los datos del top 10 sin la estructura de respuesta completa
   * @returns Observable con el array de famosos rankeados
   */
  getTop10FamososData(): Observable<FamosoRanking[]> {
    return this.getTop10FamososMasVisitados().pipe(
      map(response => response.data || [])
    );
  }

  /**
   * Obtiene el famoso más visitado (posición #1 del ranking)
   * @returns Observable con el famoso más visitado
   */
  getFamosoMasVisitado(): Observable<FamosoRanking | null> {
    return this.getTop10FamososData().pipe(
      map(famosos => famosos.length > 0 ? famosos[0] : null)
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
   * Realiza operaciones CRUD sobre famosos
   * @param famoso Datos del famoso
   * @param accion Acción a realizar (insertar, modificar, eliminar)
   * @returns Observable con la respuesta del servidor
   */
  crud_Famosos(famoso: Famoso, accion: 'insertar' | 'modificar' | 'eliminar'): Observable<any> {
    const famosoToSend = this.prepareFamosoData(famoso);

    return this.getAuthHeaders().pipe(
      switchMap(headers => {
        switch (accion) {
          case 'eliminar':
            const deleteUrl = `${URL_TURISMO}/famosos/eliminar/${famoso._id}`;
            return this.http.delete(deleteUrl, { headers }).pipe(
              tap(response => console.log('Respuesta de eliminación de famoso:', response)),
              catchError(this.handleError.bind(this))
            );

          case 'insertar':
            const postUrl = `${URL_TURISMO}/famosos/crear`;
            return this.http.post(postUrl, famosoToSend, { headers }).pipe(
              tap(response => console.log('Respuesta de inserción de famoso:', response)),
              catchError(this.handleError.bind(this))
            );

          case 'modificar':
            const putUrl = `${URL_TURISMO}/famosos/editar/${famoso._id}`;
            return this.http.put(putUrl, famosoToSend, { headers }).pipe(
              tap(response => console.log('Respuesta de modificación de famoso:', response)),
              catchError(this.handleError.bind(this))
            );

          default:
            return throwError(() => new Error('Acción no válida'));
        }
      }),
      catchError(error => {
        console.error(`Error en operación CRUD de famoso (${accion}):`, error);
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
          console.log('Añadiendo token a la petición de famoso');
          return headers.set('x-token', token);
        } else {
          console.warn('No hay token disponible para la petición de famoso');
        }
        
        return headers;
      }),
      catchError(error => {
        console.error('Error al obtener headers de autenticación para famoso:', error);
        return of(new HttpHeaders({
          'Content-Type': 'application/json'
        }));
      })
    );
  }

  /**
   * Prepara los datos del famoso para enviarlos al servidor
   * @param famoso Datos del famoso
   * @returns Objeto con los datos preparados
   */
  private prepareFamosoData(famoso: Famoso): any {
    const famosoData: Partial<Famoso> = {
      nombre: famoso.nombre,
      ciudad: famoso.ciudad,
      categoria: famoso.categoria,
      descripcion: famoso.descripcion,
      pais_id: famoso.pais_id,
      img: famoso.img
    };

    // Solo incluye el _id si existe y no es una operación de inserción
    if (famoso._id) {
      famosoData._id = famoso._id;
    }

    return famosoData;
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
    console.log('Manejando error de autenticación en famosos');
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