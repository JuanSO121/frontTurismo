import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { URL_HEROES } from '../config/url.servicios';
import { Observable, catchError, map, throwError, tap, of, switchMap, from } from 'rxjs';
import { Heroe } from '../interfaces/heroes.interface';
import { StorageService } from './storage.service';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class HeroesBDService {

  constructor(
    private http: HttpClient,
    private storageService: StorageService,
    private router: Router
  ) { }

/**
 * Realiza el registro de un nuevo usuario
 * @param nombre Nombre del usuario
 * @param correo Correo del usuario
 * @param password Contraseña del usuario
 * @returns Observable con la respuesta del servidor
 */
register(nombre: string, correo: string, password: string): Observable<any> {
  const url = `${URL_HEROES}/usuarios`;
  const body = {
    nombre,
    correo,
    password
  };
  
  return this.http.post(url, body).pipe(
    tap((response: any) => {
      console.log('Respuesta de registro recibida:', response);
      
      // Si el registro incluye un token, guardarlo inmediatamente
      if (response && response.token) {
        // Uso directo del servicio para garantizar que se guarde correctamente
        this.storageService.setCookie(response.token)
          .then(() => console.log('Token guardado con éxito durante registro'))
          .catch(err => console.error('Error al guardar token durante registro:', err));
      }
    }),
    catchError((error) => {
      console.error('Error en la petición de registro:', error);
      return this.handleError(error);
    })
  );
}
  /**
   * Obtiene todos los héroes
   * @returns Observable con el listado de héroes
   */
  getHeroes(): Observable<any> {
    const url = `${URL_HEROES}/heroes`;

    return this.http.get<any>(url).pipe(
      tap((response) => {
        console.log('DATOS recibidos del servidor:', response);
      }),
      catchError(this.handleError.bind(this))
    );
  }

  /**
   * Obtiene un héroe específico
   * @param id ID del héroe a buscar
   * @returns Observable con el héroe encontrado
   */
  getUnHeroe(id: string): Observable<Heroe> {
    const url = `${URL_HEROES}/heroes/${id}`;

    return this.http.get<Heroe>(url).pipe(
      catchError(this.handleError.bind(this))
    );
  }

  /**
   * Obtiene las imágenes de un héroe específico
   * @param id ID del héroe
   * @returns Observable con el array de imágenes
   */
  getHeroeImages(id: string): Observable<string[]> {
    const url = `${URL_HEROES}/heroes/${id}/images`;

    return this.http.get<any>(url).pipe(
      map(response => {
        if (response && response.Ok && response.resp) {
          return response.resp;
        }
        return [];
      }),
      catchError(error => {
        console.error('Error al obtener imágenes del héroe:', error);
        return of([]);
      })
    );
  }

  /**
   * Añade una nueva imagen a un héroe
   * @param id ID del héroe
   * @param imageUrl URL de la imagen a añadir
   * @returns Observable con la respuesta del servidor
   */
  addHeroeImage(id: string, imageUrl: string): Observable<any> {
    const url = `${URL_HEROES}/heroes/${id}/images`;
    const body = { imageUrl };

    return this.http.post(url, body).pipe(
      tap(response => console.log('Respuesta de agregar imagen:', response)),
      catchError(this.handleError.bind(this))
    );
  }

  /**
   * Elimina una imagen de un héroe
   * @param id ID del héroe
   * @param imageIndex Índice de la imagen a eliminar
   * @returns Observable con la respuesta del servidor
   */
  deleteHeroeImage(id: string, imageIndex: number): Observable<any> {
    const url = `${URL_HEROES}/heroes/${id}/images/${imageIndex}`;

    return this.http.delete(url).pipe(
      tap(response => console.log('Respuesta de eliminar imagen:', response)),
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
      return !!token; // Convierte a booleano (true si hay token, false si no)
    } catch (error) {
      console.error('Error al verificar autenticación:', error);
      return false;
    }
  }

  /**
   * Realiza operaciones CRUD sobre héroes
   * @param heroe Datos del héroe
   * @param accion Acción a realizar (insertar, modificar, eliminar)
   * @returns Observable con la respuesta del servidor
   */
  crud_Heroes(heroe: Heroe, accion: 'insertar' | 'modificar' | 'eliminar'): Observable<any> {
    // Procesar correctamente el array de imágenes antes de enviarlo
    const heroeToSend = this.prepareHeroeData(heroe);

    // Obtener el token para asegurar que se esté enviando en la petición
    return this.getAuthHeaders().pipe(
      switchMap(headers => {
        switch (accion) {
          case 'eliminar':
            const deleteUrl = `${URL_HEROES}/heroes/${heroe._id}`;
            return this.http.delete(deleteUrl, { headers }).pipe(
              tap(response => console.log('Respuesta de eliminación:', response)),
              catchError(this.handleError.bind(this))
            );
  
          case 'insertar':
            const postUrl = `${URL_HEROES}/heroes`;
            return this.http.post(postUrl, heroeToSend, { headers }).pipe(
              tap(response => console.log('Respuesta de inserción:', response)),
              catchError(this.handleError.bind(this))
            );
  
          case 'modificar':
            const putUrl = `${URL_HEROES}/heroes/${heroe._id}`;
            return this.http.put(putUrl, heroeToSend, { headers }).pipe(
              tap(response => console.log('Respuesta de modificación:', response)),
              catchError(this.handleError.bind(this))
            );
  
          default:
            return throwError(() => new Error('Acción no válida'));
        }
      }),
      catchError(error => {
        console.error(`Error en operación CRUD (${accion}):`, error);
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
          console.log('Añadiendo token a la petición');
          return headers.set('x-token', token);
        } else {
          console.warn('No hay token disponible para la petición');
        }
        
        return headers;
      }),
      catchError(error => {
        console.error('Error al obtener headers de autenticación:', error);
        // Devolver headers sin token si hay error
        return of(new HttpHeaders({
          'Content-Type': 'application/json'
        }));
      })
    );
  }

  /**
   * Realiza el login del usuario
   * @param user Correo del usuario
   * @param pass Contraseña del usuario
   * @returns Observable con la respuesta del servidor
   */
  login(user: string, pass: string): Observable<any> {
    let url = `${URL_HEROES}/auth/login`;
    const body = {
      correo: user,
      password: pass
    };
    
    return this.http.post(url, body).pipe(
      tap((response: any) => {
        console.log('Respuesta de login recibida');
      }),
      switchMap((response: any) => {
        // Guardar el token en el almacenamiento
        if (response && response.token) {
          return this.saveToken(response.token).pipe(
            map(() => response)
          );
        } else {
          console.warn('No se encontró token en la respuesta del servidor');
          return of(response);
        }
      }),
      catchError((error) => {
        console.error('Error en la petición de login:', error);
        return this.handleError(error);
      })
    );
  }

  /**
   * Guarda el token en el almacenamiento
   * @param token Token de autenticación
   * @returns Observable que completa cuando se guarda el token
   */
  private saveToken(token: string): Observable<void> {
    return from(this.storageService.setCookie(token)).pipe(
      tap(() => console.log('Token guardado correctamente')),
      catchError(error => {
        console.error('Error al guardar token:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Cierra la sesión del usuario
   */
  logout(): Observable<void> {
    return from(this.storageService.removeCookie()).pipe(
      tap(() => {
        console.log('Token eliminado correctamente');
        // Redirigir al usuario a la página de login o inicio
        this.router.navigate(['/login']);
      }),
      catchError(error => {
        console.error('Error al cerrar sesión:', error);
        // Intentar redirigir de todos modos
        this.router.navigate(['/login']);
        return of(undefined);
      })
    );
  }

  /**
   * Prepara los datos del héroe para enviarlos al servidor
   * Asegura que el campo img se maneje correctamente
   * @param heroe Datos del héroe
   * @returns Objeto con los datos preparados
   */
  private prepareHeroeData(heroe: Heroe): any {
    // Crea un nuevo objeto en lugar de modificar el original
    const heroeData: Partial<Heroe> = {
      nombre: heroe.nombre,
      bio: heroe.bio,
      aparicion: heroe.aparicion,
      casa: heroe.casa
    };

    // Maneja el campo img correctamente
    if (typeof heroe.img === 'string') {
      heroeData.img = [heroe.img];
    } else if (Array.isArray(heroe.img)) {
      heroeData.img = [...heroe.img]; // Crea una copia para evitar modificar el original
    } else {
      heroeData.img = []; // Valor por defecto
    }

    // Solo incluye el _id si existe y no es una operación de inserción
    if (heroe._id) {
      heroeData._id = heroe._id;
    }

    return heroeData;
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
      errorMessage = `Código de error: ${error.status}, mensaje: ${error.message}`;
      
      // Si el servidor envía un mensaje específico, usarlo
      if (error.error && error.error.msg) {
        errorMessage = error.error.msg;
      }
      
      // Verificar si es un error de autenticación
      if (error.status === 401) {
        errorMessage = 'No autorizado: La sesión ha expirado o no tienes permisos.';
        // Manejar el error de autenticación
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
    // Remover token de forma segura y redirigir
    this.storageService.removeCookie()
      .then(() => {
        this.router.navigate(['/login']);
      })
      .catch(error => {
        console.error('Error al eliminar token durante manejo de error de autenticación:', error);
        // Intentar redirigir de todos modos
        this.router.navigate(['/login']);
      });
  }
}