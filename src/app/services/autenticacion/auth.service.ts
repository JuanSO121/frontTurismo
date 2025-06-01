import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Observable, throwError, from, of } from 'rxjs';
import { catchError, map, switchMap, tap } from 'rxjs/operators';
import { Router } from '@angular/router';
import { StorageService } from '../storage.service';
import { URL_HEROES } from 'src/app/config/url.servicios';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  constructor(
    private http: HttpClient,
    private storageService: StorageService,
    private router: Router
  ) {}

  register(nombre: string, correo: string, password: string): Observable<any> {
    const url = `${URL_HEROES}/usuarios`;
    const body = { nombre, correo, password };

    return this.http.post(url, body).pipe(
      tap((res: any) => {
        if (res?.token) {
          this.storageService.setCookie(res.token)
            .then(() => console.log('Token guardado tras registro'));
        }
      }),
      catchError(this.handleError.bind(this))
    );
  }

  login(user: string, pass: string): Observable<any> {
    const url = `${URL_HEROES}/auth/login`;
    const body = { correo: user, password: pass };

    return this.http.post(url, body).pipe(
      switchMap((res: any) => {
        if (res?.token) {
          return from(this.storageService.setCookie(res.token)).pipe(map(() => res));
        }
        return of(res);
      }),
      catchError(this.handleError.bind(this))
    );
  }

  logout(): Observable<void> {
    return from(this.storageService.removeCookie()).pipe(
      tap(() => this.router.navigate(['/login'])),
      catchError(error => {
        console.error('Error cerrando sesión:', error);
        this.router.navigate(['/login']);
        return of(undefined);
      })
    );
  }

  async isAuthenticated(): Promise<boolean> {
    try {
      const token = await this.storageService.getCookie();
      return !!token;
    } catch (err) {
      console.error('Error al verificar token:', err);
      return false;
    }
  }

  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'Error desconocido';

    if (error.error instanceof ErrorEvent) {
      errorMessage = `Error de red: ${error.error.message}`;
    } else {
      errorMessage = error.error?.msg || `Error ${error.status}: ${error.message}`;
      if (error.status === 401) {
        this.handleAuthError();
        errorMessage = 'No autorizado: Sesión inválida o expirada.';
      }
    }

    console.error('AuthService Error:', errorMessage);
    return throwError(() => new Error(errorMessage));
  }

  // En auth.service.ts
// En auth.service.ts - getCurrentUser con mejor manejo de errores
getCurrentUser(): Observable<any> {
  return from(this.storageService.getCookie()).pipe(
    switchMap(token => {
      if (!token) {
        console.error('No hay token disponible');
        return throwError(() => new Error('No hay token disponible'));
      }

      console.log('Token encontrado:', token.substring(0, 20) + '...');

      // Decodificar el token JWT directamente en el frontend
      try {
        const tokenParts = token.split('.');
        if (tokenParts.length !== 3) {
          throw new Error('Token JWT malformado');
        }

        const payload = JSON.parse(atob(tokenParts[1]));
        console.log('Payload decodificado:', payload);
        
        const usuario = {
          _id: payload.uid,  
          nombre: payload.nombre,
          correo: payload.correo
        };

        console.log('Usuario extraído:', usuario);
        return of(usuario);
      } catch (error) {
        console.error('Error al decodificar token:', error);
        const errorMsg = error instanceof Error ? error.message : String(error);
        return throwError(() => new Error('Token inválido: ' + errorMsg));
      }
    }),
    catchError(error => {
      console.error('Error al obtener usuario:', error);
      this.handleAuthError();
      return throwError(() => error);
    })
  );
}

  private handleAuthError() {
    this.storageService.removeCookie()
      .then(() => this.router.navigate(['/login']))
      .catch(() => this.router.navigate(['/login']));
  }

  // Agrega este método en tu AuthService


/**
 * Obtiene los datos de un usuario por su ID
 * @param userId ID del usuario a buscar
 * @returns Observable con los datos del usuario
 */
getUserById(userId: string): Observable<any> {
  const url = `${URL_HEROES}/usuarios/${userId}`;
  
  return from(this.storageService.getCookie()).pipe(
    switchMap(token => {
      const headers = new HttpHeaders({
        'Content-Type': 'application/json',
        'x-token': token || ''
      });
      
      return this.http.get(url, { headers }).pipe(
        map((response: any) => {
          console.log('Respuesta getUserById:', response);
          // Ajusta según la estructura de respuesta de tu API
          if (response && response.ok && response.usuario) {
            return response.usuario;
          } else if (response && response.data) {
            return response.data;
          }
          return response;
        }),
        catchError(error => {
          console.error(`Error al obtener usuario ${userId}:`, error);
          return throwError(() => error);
        })
      );
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

  
}
