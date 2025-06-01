import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { StorageService } from '../storage.service';


export interface FavoriteImage {
  id: string;
  heroId: string;
  heroName: string;
  imageUrl: string;
  imageIndex: number;
  dateAdded: Date;
}

@Injectable({
  providedIn: 'root'
})
export class FavoriteService {
  private readonly FAVORITES_KEY = 'favorite_images';
  private _favorites = new BehaviorSubject<FavoriteImage[]>([]);
  
  constructor(private storageService: StorageService) {
    this.loadFavorites();
  }

  getFavorites() {
    return this._favorites.asObservable();
  }

  getCurrentFavorites(): FavoriteImage[] {
    return this._favorites.getValue();
  }

  async addToFavorites(heroId: string, heroName: string, imageUrl: string, imageIndex: number): Promise<boolean> {
    try {
      const currentFavorites = this.getCurrentFavorites();
      const favoriteId = `${heroId}_${imageIndex}`;
      
      // Verificar si ya existe en favoritos
      const existingFavorite = currentFavorites.find(fav => fav.id === favoriteId);
      if (existingFavorite) {
        console.log('La imagen ya está en favoritos');
        return false;
      }

      const newFavorite: FavoriteImage = {
        id: favoriteId,
        heroId,
        heroName,
        imageUrl,
        imageIndex,
        dateAdded: new Date()
      };

      const updatedFavorites = [...currentFavorites, newFavorite];
      await this.saveFavorites(updatedFavorites);
      
      console.log('Imagen agregada a favoritos:', newFavorite);
      return true;
    } catch (error) {
      console.error('Error al agregar a favoritos:', error);
      return false;
    }
  }

  async removeFromFavorites(heroId: string, imageIndex: number): Promise<boolean> {
    try {
      const currentFavorites = this.getCurrentFavorites();
      const favoriteId = `${heroId}_${imageIndex}`;
      
      const updatedFavorites = currentFavorites.filter(fav => fav.id !== favoriteId);
      
      if (updatedFavorites.length === currentFavorites.length) {
        console.log('La imagen no estaba en favoritos');
        return false;
      }

      await this.saveFavorites(updatedFavorites);
      console.log('Imagen eliminada de favoritos');
      return true;
    } catch (error) {
      console.error('Error al eliminar de favoritos:', error);
      return false;
    }
  }

  isFavorite(heroId: string, imageIndex: number): boolean {
    const favoriteId = `${heroId}_${imageIndex}`;
    return this.getCurrentFavorites().some(fav => fav.id === favoriteId);
  }

  async clearAllFavorites(): Promise<void> {
    try {
      await this.saveFavorites([]);
      console.log('Todos los favoritos han sido eliminados');
    } catch (error) {
      console.error('Error al limpiar favoritos:', error);
    }
  }

  private async loadFavorites(): Promise<void> {
    try {
      await this.storageService.init();
      
      // Intentar cargar desde el storage principal
      let favoritesData = null;
      
      if (this.storageService['_storage']) {
        favoritesData = await this.storageService['_storage'].get(this.FAVORITES_KEY);
      }
      
      // Fallback a localStorage si no se pudo cargar
      if (!favoritesData) {
        try {
          const localStorageData = localStorage.getItem(this.FAVORITES_KEY);
          if (localStorageData) {
            favoritesData = JSON.parse(localStorageData);
          }
        } catch (e) {
          console.warn('Error al cargar desde localStorage:', e);
        }
      }

      if (favoritesData && Array.isArray(favoritesData)) {
        // Convertir las fechas de string a Date objects
        const favorites = favoritesData.map(fav => ({
          ...fav,
          dateAdded: new Date(fav.dateAdded)
        }));
        
        this._favorites.next(favorites);
        console.log('Favoritos cargados:', favorites);
      } else {
        this._favorites.next([]);
        console.log('No se encontraron favoritos guardados');
      }
    } catch (error) {
      console.error('Error al cargar favoritos:', error);
      this._favorites.next([]);
    }
  }

  private async saveFavorites(favorites: FavoriteImage[]): Promise<void> {
    try {
      await this.storageService.init();
      
      // Intentar guardar en el storage principal
      if (this.storageService['_storage']) {
        await this.storageService['_storage'].set(this.FAVORITES_KEY, favorites);
      }
      
      // También guardar en localStorage como backup
      try {
        localStorage.setItem(this.FAVORITES_KEY, JSON.stringify(favorites));
      } catch (e) {
        console.warn('Error al guardar en localStorage:', e);
      }

      // Actualizar el BehaviorSubject
      this._favorites.next(favorites);
    } catch (error) {
      console.error('Error al guardar favoritos:', error);
      
      // Fallback: intentar guardar solo en localStorage
      try {
        localStorage.setItem(this.FAVORITES_KEY, JSON.stringify(favorites));
        this._favorites.next(favorites);
        console.log('Favoritos guardados en localStorage como fallback');
      } catch (e) {
        console.error('Error crítico al guardar favoritos:', e);
        throw error;
      }
    }
  }

  // Método para obtener estadísticas de favoritos
  getFavoritesStats() {
    const favorites = this.getCurrentFavorites();
    const heroStats = favorites.reduce((acc, fav) => {
      acc[fav.heroName] = (acc[fav.heroName] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      total: favorites.length,
      byHero: heroStats,
      mostRecent: favorites.length > 0 ? 
        favorites.reduce((latest, fav) => 
          fav.dateAdded > latest.dateAdded ? fav : latest
        ) : null
    };
  }
}