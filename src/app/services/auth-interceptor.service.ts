import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { StorageService } from '../services/storage.service';
import { catchError, from, of, switchMap } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const storageService = inject(StorageService);
  
  // Skip adding token for login or registration endpoints
  if (req.url.includes('/auth/login') || req.url.includes('/usuarios') && req.method === 'POST') {
    console.log('Petición de login/registro, no se requiere token');
    return next(req);
  }
  
  // For all other requests, try to get and attach the token
  return from(storageService.getCookie()).pipe(
    switchMap(token => {
      if (token) {
        console.log('Interceptor: añadiendo token a la petición');
        // Clone the request and add the auth header
        const authReq = req.clone({
          setHeaders: { 'x-token': token }
        });
        return next(authReq);
      } else {
        console.warn('No hay token disponible para la petición:', req.url);
        // If no token is available, try to recover it one more time
        return from(storageService.attemptTokenRecovery()).pipe(
          switchMap(recoveredToken => {
            if (recoveredToken) {
              console.log('Token recuperado de emergencia');
              const authReq = req.clone({
                setHeaders: { 'x-token': recoveredToken }
              });
              return next(authReq);
            }
            // Only log this error for endpoints that should have a token
            console.log('Continuando sin autenticación para:', req.url);
            return next(req);
          }),
          catchError(error => {
            console.error('Error en el interceptor:', error);
            // Ensure errors don't block the application
            return next(req);
          })
        );
      }
    }),
    catchError(error => {
      console.error('Error crítico en el interceptor:', error);
      // If there's any error in the interceptor, let the original request pass
      return next(req);
    })
  );
};