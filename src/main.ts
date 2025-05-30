import { bootstrapApplication } from '@angular/platform-browser';
import { RouteReuseStrategy, provideRouter, withPreloading, PreloadAllModules } from '@angular/router';
import { IonicRouteStrategy, provideIonicAngular } from '@ionic/angular/standalone';
import { routes } from './app/app.routes';
import { AppComponent } from './app/app.component';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { APP_INITIALIZER, importProvidersFrom } from '@angular/core';

import { IonicModule } from '@ionic/angular';
import { authInterceptor } from './app/services/auth-interceptor.service';
import { StorageService } from './app/services/storage.service';
import { Storage } from '@ionic/storage-angular';
import { Drivers } from '@ionic/storage';

// Factory para inicializar el storage antes de que la aplicación se cargue
export function initializeStorageFactory(storageService: StorageService) {
  return () => storageService.init();
}

// Factory para crear una instancia de Storage
export function storageFactory() {
  return new Storage({
    name: 'heroesdb',
    driverOrder: [Drivers.IndexedDB, Drivers.LocalStorage]
  });
}

bootstrapApplication(AppComponent, {
  providers: [
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    provideIonicAngular(),
    
    // Correct storage setup with factory
    { provide: Storage, useFactory: storageFactory },
    
    provideRouter(routes, withPreloading(PreloadAllModules)),
    provideHttpClient(withInterceptors([authInterceptor])),
    
    // Inicializar el storage antes de que la aplicación arranque
    {
      provide: APP_INITIALIZER,
      useFactory: initializeStorageFactory,
      deps: [StorageService],
      multi: true
    },
    
    // Importar módulos necesarios
    importProvidersFrom(
      IonicModule.forRoot()
    )
  ],
});