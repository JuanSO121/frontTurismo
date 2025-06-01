import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Observable, catchError, map, throwError, tap, of, switchMap, from } from 'rxjs';
import { Router } from '@angular/router';
import { StorageService } from '../storage.service';
import { URL_TURISMO } from 'src/app/config/url.servicios';
import { AuthService } from '../autenticacion/auth.service';

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
export class VisitaService {

  constructor(
    private http: HttpClient,
    private storageService: StorageService,
    private authService: AuthService,
    private router: Router
  ) { }

  /**
   * Obtiene todas las visitas
   * @returns Observable con el listado de visitas
   */
  getVisitas(): Observable<Visita[]> {
    const url = `${URL_TURISMO}/visitas`;

    return this.http.get<any>(url).pipe(
      map(response => {
        if (response && response.ok && response.data) {
          return response.data;
        }
        return [];
      }),
      catchError(this.handleError.bind(this))
    );
  }

  /**
   * Obtiene una visita por ID
   * @param id ID de la visita
   * @returns Observable con la visita encontrada
   */
  getVisitaById(id: string): Observable<Visita> {
    const url = `${URL_TURISMO}/visitas/${id}`;

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
   * Obtiene visitas por ID de usuario
   * @param usuarioId ID del usuario
   * @returns Observable con las visitas del usuario
   */
  getVisitasByUsuarioId(usuarioId: string): Observable<Visita[]> {
    const url = `${URL_TURISMO}/visitas/usuario`;
    const body = { usuario_id: usuarioId };

    return this.http.post<any>(url, body).pipe(
      map(response => {
        if (response && response.ok && response.data) {
          return response.data;
        }
        return [];
      }),
      catchError(this.handleError.bind(this))
    );
  }

  /**
   * Obtiene visitas por sitio (simulado por ahora)
   * @param sitio Nombre del sitio
   * @returns Observable con las visitas del sitio
   */
  getVisitasBySitio(sitio: string): Observable<Visita[]> {
    // Simulación hasta que tengas el servicio de sitios
    return this.getVisitas().pipe(
      map(visitas => visitas.filter(v => v.sitio_id === sitio))
    );
  }

  /**
   * Crea una nueva visita
   * @param visita Datos de la visita
   * @returns Observable con la respuesta del servidor
   */
// En visita.service.ts - Método crearVisita corregido
crearVisita(visita: Partial<Visita>): Observable<any> {
  const url = `${URL_TURISMO}/visitas/crear`;

  return this.authService.getCurrentUser().pipe(
    switchMap(usuario => {
      if (!usuario?._id) {
        return throwError(() => new Error('Usuario no autenticado'));
      }
      
      const visitaConUsuario = {
        ...visita,
        usuario_id: usuario._id,
        usuario_nombre: usuario.nombre // Opcional: guardar nombre para mostrar
      };

      return this.getAuthHeaders().pipe(
        switchMap(headers => {
          console.log('Datos que se enviarán al backend:', visitaConUsuario);
          return this.http.post(url, visitaConUsuario, { headers });
        })
      );
    }),
    catchError(this.handleError.bind(this))
  );
}
  /**
   * Actualiza una visita existente
   * @param id ID de la visita a actualizar
   * @param visita Datos actualizados
   * @param reqUserId ID del usuario que hace la petición
   * @returns Observable con la respuesta del servidor
   */
  actualizarVisita(id: string, visita: Partial<Visita>, reqUserId: string): Observable<any> {
    const url = `${URL_TURISMO}/visitas/editar/${id}/${reqUserId}`;

    return this.getAuthHeaders().pipe(
      switchMap(headers => {
        return this.http.put(url, visita, { headers }).pipe(
          tap(response => console.log('Visita actualizada:', response)),
          catchError(this.handleError.bind(this))
        );
      })
    );
  }

  /**
   * Elimina una visita
   * @param id ID de la visita a eliminar
   * @param reqUserId ID del usuario que hace la petición
   * @returns Observable con la respuesta del servidor
   */
  eliminarVisita(id: string, reqUserId: string): Observable<any> {
    const url = `${URL_TURISMO}/visitas/eliminar/${id}/${reqUserId}`;

    return this.getAuthHeaders().pipe(
      switchMap(headers => {
        return this.http.delete(url, { headers }).pipe(
          tap(response => console.log('Visita eliminada:', response)),
          catchError(this.handleError.bind(this))
        );
      })
    );
  }

  /**
   * Obtiene los headers de autenticación
   * @returns Observable con los headers
   */
  private getAuthHeaders(): Observable<HttpHeaders> {
    return from(this.storageService.getCookie()).pipe(
      map(token => {
        const headers = new HttpHeaders({
          'Content-Type': 'application/json'
        });
        
        if (token) {
          return headers.set('x-token', token);
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
   * Maneja errores HTTP
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