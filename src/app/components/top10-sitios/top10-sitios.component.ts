import { Component, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { 
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonItem,
  IonLabel,
  IonSelect,
  IonSelectOption,
  IonButton,
  IonIcon,
  IonGrid,
  IonRow,
  IonCol,
  IonBadge,
  IonChip,
  IonSkeletonText,
  IonRippleEffect,
  AlertController,
  LoadingController,
  ToastController
} from '@ionic/angular/standalone';

import { 
  trophyOutline,
  medalOutline,
  ribbonOutline,
  starOutline,
  locationOutline,
  businessOutline,
  globeOutline,
  eyeOutline,
  flameOutline
} from 'ionicons/icons';
import { addIcons } from 'ionicons';

import { Sitio, Pais } from 'src/app/interfaces/turismo.interfac';
import { SitiosService } from 'src/app/services/turismo/sitios.service';
import { PaisesService } from 'src/app/services/turismo/paises.service';
import { FavoriteService } from 'src/app/services/favoritos/favorite.service';

@Component({
  selector: 'app-top10-sitios',
  templateUrl: './top10-sitios.component.html',
  styleUrls: ['./top10-sitios.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonItem,
    IonLabel,
    IonSelect,
    IonSelectOption,
    IonButton,
    IonIcon,
    IonGrid,
    IonRow,
    IonCol,
    IonBadge,
    IonChip,
    IonSkeletonText,
    IonRippleEffect
  ]
})
export class Top10SitiosComponent implements OnInit {
  @Input() title: string = 'Top 10 Sitios Más Visitados';
  
  // Datos principales
  paises: Pais[] = [];
  top10Sitios: Sitio[] = [];
  selectedPais: Pais | null = null;
  
  // Estados de carga
  isLoadingPaises: boolean = true;
  isLoadingTop10: boolean = false;
  
  // Imágenes
  defaultImage: string = 'assets/img/no-image.png';

  constructor(
    private sitiosService: SitiosService,
    private paisesService: PaisesService,
    private favoriteService: FavoriteService,
    private alertController: AlertController,
    private loadingController: LoadingController,
    private toastController: ToastController
  ) {
    addIcons({
      trophyOutline,
      medalOutline,
      ribbonOutline,
      starOutline,
      locationOutline,
      businessOutline,
      globeOutline,
      eyeOutline,
      flameOutline
    });
  }

  ngOnInit() {
    this.loadPaises();
  }

  async loadPaises() {
    this.isLoadingPaises = true;
    
    try {
      this.paisesService.getPaises().subscribe({
        next: (response) => {
          if (response && response.ok && response.data) {
            this.paises = response.data;
            console.log('Países cargados para Top 10:', this.paises);
          } else {
            console.error('Formato de respuesta inesperado:', response);
            this.showToast('Error al cargar países', 'danger');
          }
          this.isLoadingPaises = false;
        },
        error: (error) => {
          console.error('Error al cargar países:', error);
          this.showToast('No se pudieron cargar los países', 'danger');
          this.isLoadingPaises = false;
        }
      });
    } catch (error) {
      console.error('Error en la carga de países:', error);
      this.isLoadingPaises = false;
    }
  }

  async paisSelected(event: Event) {
    const selectElement = event.target as HTMLIonSelectElement;
    const paisId = selectElement.value;
    
    // Reset
    this.top10Sitios = [];
    
    if (!paisId) {
      this.selectedPais = null;
      return;
    }
    
    this.selectedPais = this.paises.find(pais => pais._id === paisId) || null;
    
    if (this.selectedPais) {
      await this.loadTop10SitiosByPais(this.selectedPais.nombre);
    }
  }

  async loadTop10SitiosByPais(paisNombre: string) {
    this.isLoadingTop10 = true;
    
    try {
      this.sitiosService.getTop10SitiosByPais(paisNombre).subscribe({
        next: (response) => {
          if (response && response.ok && response.data) {
            this.top10Sitios = response.data;
            console.log('Top 10 sitios cargados:', this.top10Sitios);
            
            if (this.top10Sitios.length === 0) {
              this.showToast(`No hay datos de sitios visitados en ${paisNombre}`, 'warning');
            } else {
              this.showToast(`Top ${this.top10Sitios.length} sitios cargados`, 'success');
            }
          } else {
            console.error('Formato de respuesta inesperado:', response);
            this.top10Sitios = [];
            this.showToast('Error en el formato de datos', 'danger');
          }
          this.isLoadingTop10 = false;
        },
        error: (error) => {
          console.error('Error al cargar top 10 sitios:', error);
          this.showToast('No se pudo cargar el ranking de sitios', 'danger');
          this.top10Sitios = [];
          this.isLoadingTop10 = false;
        }
      });
    } catch (error) {
      console.error('Error en la carga del top 10:', error);
      this.isLoadingTop10 = false;
    }
  }

  async toggleFavorite(sitio: Sitio) {
    if (!sitio._id) {
      return;
    }

    try {
      const isFavorite = this.favoriteService.isFavorite(sitio._id, 0);
      
      if (isFavorite) {
        const success = await this.favoriteService.removeFromFavorites(sitio._id, 0);
        if (success) {
          this.showToast('Sitio eliminado de favoritos', 'warning');
        }
      } else {
        const imageUrl = this.getSitioImageUrl(sitio);
        const success = await this.favoriteService.addToFavorites(sitio._id, sitio.nombre, imageUrl, 0);
        if (success) {
          this.showToast('Sitio agregado a favoritos', 'success');
        } else {
          this.showToast('El sitio ya está en favoritos', 'primary');
        }
      }
    } catch (error) {
      console.error('Error al manejar favorito:', error);
      this.showToast('Error al manejar favorito', 'danger');
    }
  }

  isFavorite(sitio: Sitio): boolean {
    if (!sitio._id) {
      return false;
    }
    return this.favoriteService.isFavorite(sitio._id, 0);
  }

  getSitioImageUrl(sitio: Sitio): string {
    if (sitio.img) {
      if (Array.isArray(sitio.img)) {
        return sitio.img[0] || this.defaultImage;
      }
      return sitio.img;
    }
    return this.defaultImage;
  }

  handleImageError(event: Event) {
    const imgElement = event.target as HTMLImageElement;
    imgElement.src = this.defaultImage;
  }

  getRankingIcon(position: number): string {
    switch (position) {
      case 1: return 'trophy-outline';
      case 2: return 'medal-outline';
      case 3: return 'ribbon-outline';
      default: return 'star-outline';
    }
  }

  getRankingColor(position: number): string {
    switch (position) {
      case 1: return 'warning'; // Oro
      case 2: return 'medium';  // Plata
      case 3: return 'tertiary'; // Bronce
      default: return 'primary';
    }
  }

  async showToast(message: string, color: string = 'success') {
    const toast = await this.toastController.create({
      message,
      duration: 2000,
      color,
      position: 'bottom'
    });
    await toast.present();
  }
}