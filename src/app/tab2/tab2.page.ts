import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { 
  IonHeader, 
  IonToolbar, 
  IonTitle, 
  IonContent,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonGrid,
  IonRow,
  IonCol,
  IonButton,
  IonIcon,
  IonBadge,
  IonChip,
  IonLabel,
  IonModal,
  IonItem,
  IonList,
  IonSegment,
  IonSegmentButton,
  IonSearchbar,
  IonRefresher,
  IonRefresherContent,
  AlertController,
  ToastController,
  ActionSheetController
} from '@ionic/angular/standalone';

import { 
  heart,
  heartOutline,
  trashOutline,
  shareOutline,
  downloadOutline,
  informationCircleOutline,
  gridOutline,
  listOutline,
  filterOutline,
  closeOutline,
  calendarOutline,
  businessOutline,
  searchOutline,
  refreshOutline, ellipsisVertical, imageOutline, timeOutline } from 'ionicons/icons';
import { addIcons } from 'ionicons';

import { FavoriteService, FavoriteImage } from '../services/favoritos/favorite.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-tab2',
  templateUrl: 'tab2.page.html',
  styleUrls: ['tab2.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonHeader, 
    IonToolbar, 
    IonTitle, 
    IonContent,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonGrid,
    IonRow,
    IonCol,
    IonButton,
    IonIcon,
    IonBadge,
    IonChip,
    IonLabel,
    IonModal,
    IonItem,
    IonList,
    IonSegment,
    IonSegmentButton,
    IonSearchbar,
    IonRefresher,
    IonRefresherContent
  ]
})
export class Tab2Page implements OnInit, OnDestroy {
  favorites: FavoriteImage[] = [];
  filteredFavorites: FavoriteImage[] = [];
  favoritesByHero: { [heroName: string]: FavoriteImage[] } = {};
  
  // UI State
  viewMode: 'grid' | 'list' = 'grid';
  sortBy: 'date' | 'hero' | 'recent' = 'recent';
  searchTerm: string = '';
  isModalOpen: boolean = false;
  selectedFavorite: FavoriteImage | null = null;
  
  // Loading state
  isLoading: boolean = false;
  
  // Stats
  totalFavorites: number = 0;
  uniqueHeroes: number = 0;
  
  private favoritesSubscription: Subscription | null = null;
  defaultImage: string = 'assets/img/no-image.png';

  constructor(
    private favoriteService: FavoriteService,
    private alertController: AlertController,
    private toastController: ToastController,
    private actionSheetController: ActionSheetController
  ) {
    addIcons({heart,gridOutline,listOutline,trashOutline,informationCircleOutline,ellipsisVertical,searchOutline,heartOutline,closeOutline,shareOutline,imageOutline,calendarOutline,timeOutline,downloadOutline,filterOutline,businessOutline,refreshOutline});
  }

  ngOnInit() {
    this.loadFavorites();
  }

  ngOnDestroy() {
    if (this.favoritesSubscription) {
      this.favoritesSubscription.unsubscribe();
    }
  }

  loadFavorites() {
    this.isLoading = true;
    
    this.favoritesSubscription = this.favoriteService.getFavorites().subscribe({
      next: (favorites) => {
        this.favorites = favorites;
        this.updateStats();
        this.groupFavoritesByHero();
        this.applyFiltersAndSort();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error al cargar favoritos:', error);
        this.showToast('Error al cargar favoritos', 'danger');
        this.isLoading = false;
      }
    });
  }

  updateStats() {
    this.totalFavorites = this.favorites.length;
    this.uniqueHeroes = new Set(this.favorites.map(fav => fav.heroName)).size;
  }

  groupFavoritesByHero() {
    this.favoritesByHero = this.favorites.reduce((acc, favorite) => {
      if (!acc[favorite.heroName]) {
        acc[favorite.heroName] = [];
      }
      acc[favorite.heroName].push(favorite);
      return acc;
    }, {} as { [heroName: string]: FavoriteImage[] });
  }

  applyFiltersAndSort() {
    let filtered = [...this.favorites];

    // Aplicar filtro de búsqueda
    if (this.searchTerm.trim()) {
      const searchLower = this.searchTerm.toLowerCase();
      filtered = filtered.filter(fav => 
        fav.heroName.toLowerCase().includes(searchLower)
      );
    }

    // Aplicar ordenamiento
    switch (this.sortBy) {
      case 'date':
        filtered.sort((a, b) => a.dateAdded.getTime() - b.dateAdded.getTime());
        break;
      case 'hero':
        filtered.sort((a, b) => a.heroName.localeCompare(b.heroName));
        break;
      case 'recent':
      default:
        filtered.sort((a, b) => b.dateAdded.getTime() - a.dateAdded.getTime());
        break;
    }

    this.filteredFavorites = filtered;
  }

  onSearchChange(event: any) {
    this.searchTerm = event.detail.value || '';
    this.applyFiltersAndSort();
  }

  onSortChange(event: any) {
    this.sortBy = event.detail.value;
    this.applyFiltersAndSort();
  }

  onViewModeChange(event: any) {
    this.viewMode = event.detail.value;
  }

  async onRefresh(event: any) {
    this.loadFavorites();
    setTimeout(() => {
      event.target.complete();
    }, 1000);
  }

  openFavoriteModal(favorite: FavoriteImage) {
    this.selectedFavorite = favorite;
    this.isModalOpen = true;
  }

  closeModal() {
    this.isModalOpen = false;
    this.selectedFavorite = null;
  }

  async removeFavorite(favorite: FavoriteImage, event?: Event) {
    if (event) {
      event.stopPropagation();
    }

    const alert = await this.alertController.create({
      header: 'Confirmar eliminación',
      message: `¿Deseas eliminar esta imagen de "${favorite.heroName}" de tus favoritos?`,
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: async () => {
            const success = await this.favoriteService.removeFromFavorites(favorite.heroId, favorite.imageIndex);
            if (success) {
              this.showToast('Imagen eliminada de favoritos', 'success');
              // El observable se actualizará automáticamente
            } else {
              this.showToast('Error al eliminar de favoritos', 'danger');
            }
          }
        }
      ]
    });

    await alert.present();
  }

  async presentActionSheet(favorite: FavoriteImage, event: Event) {
    event.stopPropagation();

    const actionSheet = await this.actionSheetController.create({
      header: `${favorite.heroName}`,
      buttons: [
        {
          text: 'Ver detalles',
          icon: 'information-circle-outline',
          handler: () => {
            this.openFavoriteModal(favorite);
          }
        },
        {
          text: 'Compartir',
          icon: 'share-outline',
          handler: () => {
            this.shareFavorite(favorite);
          }
        },
        {
          text: 'Eliminar de favoritos',
          icon: 'trash-outline',
          role: 'destructive',
          handler: () => {
            this.removeFavorite(favorite);
          }
        },
        {
          text: 'Cancelar',
          icon: 'close-outline',
          role: 'cancel'
        }
      ]
    });

    await actionSheet.present();
  }

  async shareFavorite(favorite: FavoriteImage) {
    try {
      if (navigator.share) {
        await navigator.share({
          title: `Imagen de ${favorite.heroName}`,
          text: `Mira esta imagen de ${favorite.heroName} que tengo en mis favoritos`,
          url: favorite.imageUrl
        });
      } else {
        // Fallback: copiar URL al portapapeles
        await navigator.clipboard.writeText(favorite.imageUrl);
        this.showToast('URL copiada al portapapeles', 'success');
      }
    } catch (error) {
      console.error('Error al compartir:', error);
      this.showToast('Error al compartir', 'danger');
    }
  }

  async clearAllFavorites() {
    if (this.favorites.length === 0) {
      this.showToast('No hay favoritos para eliminar', 'warning');
      return;
    }

    const alert = await this.alertController.create({
      header: 'Eliminar todos los favoritos',
      message: `¿Estás seguro de que quieres eliminar todos los ${this.favorites.length} favoritos? Esta acción no se puede deshacer.`,
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Eliminar todos',
          role: 'destructive',
          handler: async () => {
            await this.favoriteService.clearAllFavorites();
            this.showToast('Todos los favoritos han sido eliminados', 'success');
          }
        }
      ]
    });

    await alert.present();
  }

  handleImageError(event: Event) {
    const imgElement = event.target as HTMLImageElement;
    imgElement.src = this.defaultImage;
  }

  getHeroNames(): string[] {
    return Object.keys(this.favoritesByHero).sort();
  }

  getFavoritesByHero(heroName: string): FavoriteImage[] {
    return this.favoritesByHero[heroName] || [];
  }

  formatDate(date: Date): string {
    return new Intl.DateTimeFormat('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  }

  getRelativeTime(date: Date): string {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Hace un momento';
    if (diffInMinutes < 60) return `Hace ${diffInMinutes} min`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `Hace ${diffInHours}h`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `Hace ${diffInDays}d`;
    
    return this.formatDate(date);
  }

  private async showToast(message: string, color: string = 'success') {
    const toast = await this.toastController.create({
      message,
      duration: 2000,
      color,
      position: 'bottom'
    });
    await toast.present();
  }
}