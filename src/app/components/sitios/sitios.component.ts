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
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonChip,
  IonBadge,
  IonToast,
  AlertController,
  LoadingController,
  ModalController,
  ToastController,
  IonSearchbar 
} from '@ionic/angular/standalone';

import { 
  addCircleOutline, 
  trashOutline, 
  imageOutline, 
  closeOutline, 
  calendarOutline, 
  informationCircleOutline, 
  businessOutline,
  heartOutline,
  heart,
  locationOutline,
  globeOutline,
  homeOutline,
  mapOutline
} from 'ionicons/icons';
import { addIcons } from 'ionicons';
import { Sitio, Pais } from 'src/app/interfaces/turismo.interfac';
import { SitiosService } from 'src/app/services/turismo/sitios.service';
import { PaisesService } from 'src/app/services/turismo/paises.service';
import { FavoriteService } from 'src/app/services/favoritos/favorite.service';

@Component({
  selector: 'app-sitios',
  templateUrl: './sitios.component.html',
  styleUrls: ['./sitios.component.scss'],
  standalone: true,
  imports: [
    IonSearchbar,
    IonToast,
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
    IonModal,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonChip,
    IonBadge
  ]
})
export class SitiosComponent implements OnInit {
  @Input() title: string = 'Galería de Sitios Turísticos';
  
  // Datos principales
  paises: Pais[] = [];
  ciudades: string[] = [];
  sitiosDelPais: Sitio[] = []; // Todos los sitios del país seleccionado
  sitiosFiltrados: Sitio[] = []; // Sitios filtrados por ciudad (si se selecciona)
  sitiosMostrados: Sitio[] = []; // Los sitios que se muestran actualmente
  
  // Selecciones actuales
  selectedPais: Pais | null = null;
  selectedCiudad: string = ''; // Vacío significa "todas las ciudades"
  selectedSitio: Sitio | null = null;
  
  // Modal properties
  isModalOpen: boolean = false;
  selectedSitioForModal: Sitio | null = null;

  // Toast properties
  isToastOpen: boolean = false;
  toastMessage: string = '';
  toastColor: string = 'success';

  // Imágenes
  defaultImage: string = 'assets/img/no-image.png';

  constructor(
    private sitiosService: SitiosService,
    private paisesService: PaisesService,
    private favoriteService: FavoriteService,
    private alertController: AlertController,
    private loadingController: LoadingController,
    private modalController: ModalController,
    private toastController: ToastController
  ) {
    addIcons({
      addCircleOutline,
      informationCircleOutline,
      trashOutline,
      imageOutline,
      closeOutline,
      businessOutline,
      calendarOutline,
      heartOutline,
      heart,
      locationOutline,
      globeOutline,
      homeOutline,
      mapOutline
    });
  }

  ngOnInit() {
    this.loadPaises();
  }

  async loadPaises() {
    const loading = await this.presentLoading('Cargando países...');
    
    try {
      this.paisesService.getPaises().subscribe({
        next: (response) => {
          if (response && response.ok && response.data) {
            this.paises = response.data;
            console.log('Países cargados:', this.paises);
          } else {
            console.error('Formato de respuesta inesperado:', response);
          }
          loading.dismiss();
        },
        error: (error) => {
          console.error('Error al cargar países:', error);
          this.presentAlert('Error', 'No se pudieron cargar los países');
          loading.dismiss();
        }
      });
    } catch (error) {
      console.error('Error en la carga de países:', error);
      loading.dismiss();
    }
  }

  async paisSelected(event: Event) {
    const selectElement = event.target as HTMLIonSelectElement;
    const paisId = selectElement.value;
    
    // Reset selections
    this.selectedCiudad = '';
    this.selectedSitio = null;
    this.sitiosDelPais = [];
    this.sitiosFiltrados = [];
    this.sitiosMostrados = [];
    this.ciudades = [];
    
    if (!paisId) {
      this.selectedPais = null;
      return;
    }
    
    this.selectedPais = this.paises.find(pais => pais._id === paisId) || null;
    
    if (this.selectedPais) {
      await this.loadSitiosByPais(this.selectedPais.nombre);
    }
  }

  async loadSitiosByPais(paisNombre: string) {
    const loading = await this.presentLoading('Cargando sitios del país...');
    
    try {
      this.sitiosService.getSitiosByPais(paisNombre).subscribe({
        next: (response) => {
          if (response && response.ok && response.data) {
            this.sitiosDelPais = response.data;
            // Mostrar TODOS los sitios del país inicialmente
            this.sitiosMostrados = [...this.sitiosDelPais];
            // Extraer ciudades únicas de los sitios del país
            this.extractCiudadesFromSitios(this.sitiosDelPais);
            console.log('Sitios del país cargados:', this.sitiosDelPais);
            console.log('Ciudades disponibles:', this.ciudades);
          } else {
            console.error('Formato de respuesta inesperado:', response);
            this.sitiosDelPais = [];
            this.sitiosMostrados = [];
            this.ciudades = [];
          }
          loading.dismiss();
        },
        error: (error) => {
          console.error('Error al cargar sitios del país:', error);
          this.presentAlert('Error', 'No se pudieron cargar los sitios del país');
          this.sitiosDelPais = [];
          this.sitiosMostrados = [];
          this.ciudades = [];
          loading.dismiss();
        }
      });
    } catch (error) {
      console.error('Error en la carga de sitios del país:', error);
      loading.dismiss();
    }
  }

  private extractCiudadesFromSitios(sitios: Sitio[]) {
    // Extraer ciudades únicas de los sitios
    const ciudadesUnicas = [...new Set(
      sitios
        .map((s: Sitio) => s.ciudad)
        .filter((ciudad): ciudad is string => 
          typeof ciudad === 'string' && ciudad.trim() !== ''
        )
    )];
    this.ciudades = ciudadesUnicas.sort(); // Ordenar alfabéticamente
  }

  ciudadSelected(event: Event) {
    const selectElement = event.target as HTMLIonSelectElement;
    this.selectedCiudad = selectElement.value;
    
    if (!this.selectedCiudad) {
      // Si no hay ciudad seleccionada, mostrar TODOS los sitios del país
      this.sitiosMostrados = [...this.sitiosDelPais];
    } else {
      // Filtrar sitios por la ciudad seleccionada
      this.sitiosMostrados = this.sitiosDelPais.filter(sitio => sitio.ciudad === this.selectedCiudad);
    }
    
    console.log('Sitios mostrados:', this.sitiosMostrados);
  }

  // Método para abrir el modal con información del sitio
  openSitioModal(sitio: Sitio) {
    this.selectedSitioForModal = sitio;
    this.isModalOpen = true;
  }

  closeModal() {
    this.isModalOpen = false;
    this.selectedSitioForModal = null;
  }

  async toggleFavorite(sitio: Sitio) {
    if (!sitio._id) {
      return;
    }

    try {
      const isFavorite = this.favoriteService.isFavorite(sitio._id, 0); // Usando 0 como índice por ser una sola imagen
      
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
      // Si img es un array, tomar la primera imagen
      if (Array.isArray(sitio.img)) {
        return sitio.img[0] || this.defaultImage;
      }
      // Si img es un string
      return sitio.img;
    }
    return this.defaultImage;
  }

  handleImageError(event: Event) {
    const imgElement = event.target as HTMLImageElement;
    imgElement.src = this.defaultImage;
  }

  async presentLoading(message: string) {
    const loading = await this.loadingController.create({
      message,
      spinner: 'circles'
    });
    await loading.present();
    return loading;
  }

  async presentAlert(header: string, message: string) {
    const alert = await this.alertController.create({
      header,
      message,
      buttons: ['OK']
    });
    await alert.present();
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