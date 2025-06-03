import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { 
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonButton,
  IonIcon,
  IonBadge,
  IonChip,
  IonLabel,
  IonSkeletonText,
  IonRippleEffect,
  ToastController
} from '@ionic/angular/standalone';

import {
  trophyOutline,
  medalOutline,
  ribbonOutline,
  starOutline,
  flameOutline,
  eyeOutline,
  heartOutline,
  heart,
  chevronBackOutline,
  chevronForwardOutline,
  personOutline,
  locationOutline, refreshOutline } from 'ionicons/icons';
import { addIcons } from 'ionicons';

import { FamosoRanking, Top10FamososResponse } from 'src/app/interfaces/turismo.interfac';
import { FamososService } from 'src/app/services/turismo/famosos.service';
import { FavoriteService } from 'src/app/services/favoritos/favorite.service';

@Component({
  selector: 'app-ranking-famosos',
  templateUrl: './ranking-famosos.component.html',
  styleUrls: ['./ranking-famosos.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonButton,
    IonIcon,
    IonBadge,
    IonChip,
    IonLabel,
    IonSkeletonText,
    IonRippleEffect
  ]
})
export class RankingFamososComponent implements OnInit {
  @ViewChild('carouselContainer', { static: false }) carouselContainer!: ElementRef;

  // Datos principales
  top10Famosos: FamosoRanking[] = [];
  currentSlide: number = 0;
  
  // Estados de carga
  isLoading: boolean = true;
  
  // Carrusel
  slideWidth: number = 280; // Ancho de cada tarjeta
  visibleSlides: number = 1; // Se calculará dinámicamente
  
  // Imágenes
  defaultImage: string = 'assets/img/no-image.png';

  constructor(
    private famososService: FamososService,
    private favoriteService: FavoriteService,
    private toastController: ToastController
  ) {
    addIcons({flameOutline,eyeOutline,chevronBackOutline,chevronForwardOutline,personOutline,locationOutline,starOutline,refreshOutline,trophyOutline,medalOutline,ribbonOutline,heartOutline,heart});
  }

  ngOnInit() {
    this.loadTop10Famosos();
  }

  // En el constructor, después de addIcons:
ngAfterViewInit() {
  this.calculateVisibleSlides();
  window.addEventListener('resize', () => this.calculateVisibleSlides());
}

ngOnDestroy() {
  window.removeEventListener('resize', () => this.calculateVisibleSlides());
}

// Método para calcular slides visibles según el tamaño de pantalla
private calculateVisibleSlides() {
  const containerWidth = window.innerWidth;
  if (containerWidth >= 768) {
    this.visibleSlides = Math.min(2, this.top10Famosos.length);
    this.slideWidth = 320;
  } else if (containerWidth >= 480) {
    this.visibleSlides = 1;
    this.slideWidth = 280;
  } else {
    this.visibleSlides = 1;
    this.slideWidth = 260;
  }
  
  // Ajustar currentSlide si es necesario
  if (this.currentSlide > this.top10Famosos.length - this.visibleSlides) {
    this.currentSlide = Math.max(0, this.top10Famosos.length - this.visibleSlides);
    this.updateCarouselPosition();
  }
}

// Actualizar el método updateCarouselPosition para mejor suavidad:
private updateCarouselPosition() {
  if (this.carouselContainer) {
    const gap = window.innerWidth >= 768 ? 20 : 16;
    const translateX = -this.currentSlide * (this.slideWidth + gap);
    this.carouselContainer.nativeElement.style.transform = `translateX(${translateX}px)`;
  }
}

// Método para auto-play (opcional)
startAutoPlay() {
  setInterval(() => {
    if (this.canGoNext) {
      this.nextSlide();
    } else {
      this.currentSlide = 0;
      this.updateCarouselPosition();
    }
  }, 5000);
}

  // Actualizar el método loadTop10Famosos para inicializar el carrusel:
async loadTop10Famosos() {
  this.isLoading = true;
  
  try {
    this.famososService.getTop10FamososMasVisitados().subscribe({
      next: (response: Top10FamososResponse) => {
        if (response && response.ok && response.data) {
          this.top10Famosos = response.data;
          console.log('Top 10 famosos cargados:', this.top10Famosos);
          
          // Inicializar carrusel después de cargar datos
          setTimeout(() => {
            this.calculateVisibleSlides();
            this.currentSlide = 0;
          }, 100);
          
          if (this.top10Famosos.length === 0) {
            this.showToast('No hay datos de famosos visitados', 'warning');
          } else {
            this.showToast(`Top ${this.top10Famosos.length} famosos cargados`, 'success');
          }
        } else {
          console.error('Formato de respuesta inesperado:', response);
          this.top10Famosos = [];
          this.showToast('Error en el formato de datos', 'danger');
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error al cargar top 10 famosos:', error);
        this.showToast('No se pudo cargar el ranking de famosos', 'danger');
        this.top10Famosos = [];
        this.isLoading = false;
      }
    });
  } catch (error) {
    console.error('Error en la carga del top 10 famosos:', error);
    this.isLoading = false;
  }
}

  // Métodos del carrusel
  nextSlide() {
    if (this.currentSlide < this.top10Famosos.length - this.visibleSlides) {
      this.currentSlide++;
      this.updateCarouselPosition();
    }
  }

  prevSlide() {
    if (this.currentSlide > 0) {
      this.currentSlide--;
      this.updateCarouselPosition();
    }
  }

  goToSlide(index: number) {
    this.currentSlide = Math.max(0, Math.min(index, this.top10Famosos.length - this.visibleSlides));
    this.updateCarouselPosition();
  }


  // Métodos de utilidad
  async toggleFavorite(famoso: FamosoRanking) {
    if (!famoso.famoso_id) {
      return;
    }

    try {
      const isFavorite = this.favoriteService.isFavorite(famoso.famoso_id, 1); // tipo 1 para famosos
      
      if (isFavorite) {
        const success = await this.favoriteService.removeFromFavorites(famoso.famoso_id, 1);
        if (success) {
          this.showToast('Famoso eliminado de favoritos', 'warning');
        }
      } else {
        const success = await this.favoriteService.addToFavorites(
          famoso.famoso_id, 
          famoso.nombre, 
          famoso.img || this.defaultImage, 
          1
        );
        if (success) {
          this.showToast('Famoso agregado a favoritos', 'success');
        } else {
          this.showToast('El famoso ya está en favoritos', 'primary');
        }
      }
    } catch (error) {
      console.error('Error al manejar favorito:', error);
      this.showToast('Error al manejar favorito', 'danger');
    }
  }

  isFavorite(famoso: FamosoRanking): boolean {
    if (!famoso.famoso_id) {
      return false;
    }
    return this.favoriteService.isFavorite(famoso.famoso_id, 1);
  }

  getFamosoImageUrl(famoso: FamosoRanking): string {
    return famoso.img || this.defaultImage;
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

  formatVisitas(visitas: number): string {
    if (visitas >= 1000000) {
      return (visitas / 1000000).toFixed(1) + 'M';
    } else if (visitas >= 1000) {
      return (visitas / 1000).toFixed(1) + 'K';
    }
    return visitas.toString();
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

  // Getters para la navegación del carrusel
  get canGoPrev(): boolean {
    return this.currentSlide > 0;
  }

  get canGoNext(): boolean {
    return this.currentSlide < this.top10Famosos.length - this.visibleSlides;
  }

  get totalSlides(): number {
    return Math.max(0, this.top10Famosos.length - this.visibleSlides + 1);
  }
}