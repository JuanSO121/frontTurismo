import { Injectable } from '@angular/core';
import { Storage } from '@ionic/storage-angular';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class StorageService {
  private _storage: Storage | null = null;
  private _initialized = false;
  private initializing: Promise<void> | null = null;
  
  // Token como BehaviorSubject para poder suscribirse a cambios
  private _token = new BehaviorSubject<string | null>(null);

  constructor(private storage: Storage) {
    this.init().catch(error => {
      console.error('Error durante la inicialización automática del storage:', error);
    });
  }

  async init(): Promise<void> {
    // Si ya está inicializado, devuelve directamente
    if (this._initialized) {
      return Promise.resolve();
    }
    
    // Si hay una inicialización en progreso, espera a que termine
    if (this.initializing) {
      return this.initializing;
    }
    
    // Inicia la inicialización
    this.initializing = this.initializeStorage();
    
    try {
      await this.initializing;
      return;
    } catch (error) {
      // Si falla la inicialización, limpia el estado para permitir reintentos
      this.initializing = null;
      throw error;
    }
  }
  
  private async initializeStorage(): Promise<void> {
    try {
      console.log('Inicializando storage...');
      
      // Verificar si el storage está disponible
      if (!this.storage) {
        console.error('Storage is undefined or null');
        throw new Error('Storage is not available');
      }

      // Verificar si el método create existe
      if (typeof this.storage.create !== 'function') {
        console.error('storage.create is not a function');
        // Usar una implementación alternativa
        this._storage = this.storage;
        this._initialized = true;
        console.log('Usando implementación alternativa de storage');
      } else {
        // Implementación normal
        this._storage = await this.storage.create();
        this._initialized = true;
        console.log('Storage inicializado correctamente');
      }
      
      // Cargar el token al inicializar
      await this.loadTokenFromStorage();
    } catch (error) {
      console.error('Error al inicializar storage:', error);
      // Intento de fallback
      await this.initializeFallbackStorage();
    }
  }

  private async initializeFallbackStorage(): Promise<void> {
    console.log('Inicializando fallback storage...');
    // En caso de error, podemos usar localStorage como fallback
    this._storage = {
      get: async (key: string) => localStorage.getItem(key),
      set: async (key: string, value: any) => {
        localStorage.setItem(key, value);
        return value;
      },
      remove: async (key: string) => {
        localStorage.removeItem(key);
        return true;
      },
      clear: async () => {
        localStorage.clear();
        return true;
      },
      keys: async () => Object.keys(localStorage),
      length: async () => localStorage.length
    } as any;
    
    this._initialized = true;
    console.log('Fallback storage inicializado');
    
    // Cargar el token desde el fallback storage
    await this.loadTokenFromStorage();
  }

  private async loadTokenFromStorage(): Promise<void> {
    try {
      let token: string | null = null;
      
      if (this._storage) {
        token = await this._storage.get('auth_cookie');
      }
      
      if (token) {
        console.log('Token recuperado durante la inicialización');
        this._token.next(token);
      } else {
        console.log('No se encontró token en el storage');
      }
    } catch (error) {
      console.error('Error al cargar token desde storage:', error);
    }
  }

  async setCookie(value: string): Promise<void> {
    await this.ensureInitialized();
    
    try {
      if (!this._storage) {
        throw new Error('Storage no está disponible');
      }
      
      await this._storage.set('auth_cookie', value);
      // Actualizar el token en el BehaviorSubject
      this._token.next(value);
      console.log('Token guardado correctamente');
    } catch (error) {
      console.error('Error al guardar token:', error);
      
      // Intento con localStorage directo como último recurso
      try {
        localStorage.setItem('auth_cookie', value);
        this._token.next(value);
        console.log('Token guardado en localStorage como fallback');
      } catch (e) {
        console.error('Error fatal al guardar token en localStorage:', e);
        throw error; // Re-lanzar error original
      }
    }
  }

  getTokenObservable() {
    return this._token.asObservable();
  }

  getCurrentToken(): string | null {
    return this._token.getValue();
  }

  async getCookie(): Promise<string | null> {
    await this.ensureInitialized();
    
    try {
      // Primero intentamos obtener el token del BehaviorSubject
      let token = this._token.getValue();
      
      // Si no hay token en el BehaviorSubject, intentamos obtenerlo del storage
      if (!token && this._storage) {
        token = await this._storage.get('auth_cookie') || null;
        // Si encontramos un token en el storage, actualizamos el BehaviorSubject
        if (token) {
          this._token.next(token);
          console.log('Token recuperado del storage');
        }
      }
      
      return token;
    } catch (error) {
      console.error('Error al recuperar token:', error);
      
      // Intento fallback con localStorage
      try {
        const token = localStorage.getItem('auth_cookie');
        if (token) {
          this._token.next(token);
          return token;
        }
      } catch (e) {
        console.error('Error al recuperar token desde localStorage:', e);
      }
      
      return null;
    }
  }

  async attemptTokenRecovery(): Promise<string | null> {
    // Intento de emergencia para recuperar el token si los métodos normales fallan
    try {
      await this.ensureInitialized();
      
      if (!this._storage) {
        throw new Error('Storage no disponible para recuperación');
      }
      
      const token = await this._storage.get('auth_cookie');
      
      if (token) {
        this._token.next(token);
        console.log('Token recuperado en operación de emergencia');
      }
      
      return token;
    } catch (error) {
      console.error('Error en recuperación de emergencia:', error);
      
      // Si todo falla, intentar con localStorage directamente
      try {
        const token = localStorage.getItem('auth_cookie');
        if (token) {
          console.log('Token recuperado desde localStorage (emergencia)');
          this._token.next(token);
          return token;
        }
      } catch (e) {
        console.error('Error al recuperar desde localStorage (emergencia):', e);
      }
      
      return null;
    }
  }

  async removeCookie(): Promise<void> {
    try {
      await this.ensureInitialized();
      
      if (this._storage) {
        await this._storage.remove('auth_cookie');
        // Actualizar el BehaviorSubject
        this._token.next(null);
        console.log('Token eliminado correctamente');
      }
      
      // También limpiar localStorage por si acaso
      try {
        localStorage.removeItem('auth_cookie');
      } catch (e) {
        console.warn('No se pudo limpiar localStorage:', e);
      }
    } catch (error) {
      console.error('Error al eliminar token:', error);
      
      // Intento fallback con localStorage
      try {
        localStorage.removeItem('auth_cookie');
        this._token.next(null);
        console.log('Token eliminado desde localStorage como fallback');
      } catch (e) {
        console.error('Error al eliminar token desde localStorage:', e);
        throw error; // Re-lanzar error original
      }
    }
  }

  async clearAll(): Promise<void> {
    try {
      await this.ensureInitialized();
      
      if (this._storage) {
        await this._storage.clear();
        this._token.next(null);
        console.log('Almacenamiento limpiado completamente');
      }
      
      // También limpiar localStorage por si acaso
      try {
        localStorage.clear();
      } catch (e) {
        console.warn('No se pudo limpiar localStorage:', e);
      }
    } catch (error) {
      console.error('Error al limpiar storage:', error);
      
      // Intento fallback con localStorage
      try {
        localStorage.clear();
        this._token.next(null);
        console.log('Storage limpiado desde localStorage como fallback');
      } catch (e) {
        console.error('Error al limpiar localStorage:', e);
        throw error; // Re-lanzar error original
      }
    }
  }

  private async ensureInitialized(): Promise<void> {
    if (!this._initialized) {
      console.log('Storage no inicializado. Inicializando ahora...');
      await this.init();
    }
  }
}