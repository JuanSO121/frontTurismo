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
  personOutline, funnelOutline, filterOutline, closeCircleOutline, searchOutline, refreshOutline } from 'ionicons/icons';
import { addIcons } from 'ionicons';
import { Famoso, Pais } from 'src/app/interfaces/turismo.interfac';
import { FamososService } from 'src/app/services/turismo/famosos.service';
import { PaisesService } from 'src/app/services/turismo/paises.service';
import { FavoriteService } from 'src/app/services/favoritos/favorite.service';

@Component({
  selector: 'app-gallery',
  templateUrl: './gallery.component.html',
  styleUrls: ['./gallery.component.scss'],
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
export class GalleryComponent implements OnInit {
  @Input() title: string = 'Galería de Famosos';
  
  // Datos principales
  paises: Pais[] = [];
  ciudades: string[] = [];
  categorias: string[] = []; // Nueva propiedad para categorías
  famososDelPais: Famoso[] = []; // Todos los famosos del país seleccionado
  famososFiltrados: Famoso[] = []; // Famosos filtrados por ciudad y/o categoría
  famososMostrados: Famoso[] = []; // Los famosos que se muestran actualmente
  
  // Selecciones actuales
  selectedPais: Pais | null = null;
  selectedCiudad: string = ''; // Vacío significa "todas las ciudades"
  selectedCategoria: string = ''; // Nueva propiedad para categoría seleccionada
  selectedFamoso: Famoso | null = null;
  
  // Modal properties
  isModalOpen: boolean = false;
  selectedFamosoForModal: Famoso | null = null;

  // Toast properties
  isToastOpen: boolean = false;
  toastMessage: string = '';
  toastColor: string = 'success';

  // Imágenes
  defaultImage: string = 'assets/img/no-image.png';

  constructor(
    private famososService: FamososService,
    private paisesService: PaisesService,
    private favoriteService: FavoriteService,
    private alertController: AlertController,
    private loadingController: LoadingController,
    private modalController: ModalController,
    private toastController: ToastController
  ) {
    addIcons({funnelOutline,filterOutline,closeCircleOutline,informationCircleOutline,personOutline,locationOutline,searchOutline,refreshOutline,globeOutline,closeOutline,heart,addCircleOutline,trashOutline,imageOutline,businessOutline,calendarOutline,heartOutline});
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
    this.selectedCategoria = ''; // Reset categoría
    this.selectedFamoso = null;
    this.famososDelPais = [];
    this.famososFiltrados = [];
    this.famososMostrados = [];
    this.ciudades = [];
    this.categorias = []; // Reset categorías
    
    if (!paisId) {
      this.selectedPais = null;
      return;
    }
    
    this.selectedPais = this.paises.find(pais => pais._id === paisId) || null;
    
    if (this.selectedPais) {
      await this.loadFamososByPais(this.selectedPais.nombre);
    }
  }

  async loadFamososByPais(paisNombre: string) {
    const loading = await this.presentLoading('Cargando famosos del país...');
    
    try {
      this.famososService.getFamososByPais(paisNombre).subscribe({
        next: (response) => {
          if (response && response.ok && response.data) {
            this.famososDelPais = response.data;
            // Mostrar TODOS los famosos del país inicialmente
            this.famososMostrados = [...this.famososDelPais];
            // Extraer ciudades y categorías únicas de los famosos del país
            this.extractCiudadesFromFamosos(this.famososDelPais);
            this.extractCategoriasFromFamosos(this.famososDelPais); // Nueva función
            console.log('Famosos del país cargados:', this.famososDelPais);
            console.log('Ciudades disponibles:', this.ciudades);
            console.log('Categorías disponibles:', this.categorias);
          } else {
            console.error('Formato de respuesta inesperado:', response);
            this.famososDelPais = [];
            this.famososMostrados = [];
            this.ciudades = [];
            this.categorias = [];
          }
          loading.dismiss();
        },
        error: (error) => {
          console.error('Error al cargar famosos del país:', error);
          this.presentAlert('Error', 'No se pudieron cargar los famosos del país');
          this.famososDelPais = [];
          this.famososMostrados = [];
          this.ciudades = [];
          this.categorias = [];
          loading.dismiss();
        }
      });
    } catch (error) {
      console.error('Error en la carga de famosos del país:', error);
      loading.dismiss();
    }
  }

  private extractCiudadesFromFamosos(famosos: Famoso[]) {
    // Extraer ciudades únicas de los famosos
    const ciudadesUnicas = [...new Set(
      famosos
        .map((f: Famoso) => f.ciudad)
        .filter((ciudad): ciudad is string => 
          typeof ciudad === 'string' && ciudad.trim() !== ''
        )
    )];
    this.ciudades = ciudadesUnicas.sort(); // Ordenar alfabéticamente
  }

  // Nueva función para extraer categorías únicas
  private extractCategoriasFromFamosos(famosos: Famoso[]) {
    const categoriasUnicas = [...new Set(
      famosos
        .map((f: Famoso) => f.categoria)
        .filter((categoria): categoria is string => 
          typeof categoria === 'string' && categoria.trim() !== ''
        )
    )];
    this.categorias = categoriasUnicas.sort(); // Ordenar alfabéticamente
  }

  ciudadSelected(event: Event) {
    const selectElement = event.target as HTMLIonSelectElement;
    this.selectedCiudad = selectElement.value;
    this.applyFilters(); // Aplicar filtros combinados
  }

  // Nueva función para manejar selección de categoría
  categoriaSelected(event: Event) {
    const selectElement = event.target as HTMLIonSelectElement;
    this.selectedCategoria = selectElement.value;
    this.applyFilters(); // Aplicar filtros combinados
  }

  // Nueva función para aplicar filtros combinados
  private applyFilters() {
    let famososFiltrados = [...this.famososDelPais];

    // Filtrar por ciudad si se seleccionó una
    if (this.selectedCiudad) {
      famososFiltrados = famososFiltrados.filter(famoso => famoso.ciudad === this.selectedCiudad);
    }

    // Filtrar por categoría si se seleccionó una
    if (this.selectedCategoria) {
      famososFiltrados = famososFiltrados.filter(famoso => famoso.categoria === this.selectedCategoria);
    }

    this.famososMostrados = famososFiltrados;
    console.log('Famosos mostrados después del filtro:', this.famososMostrados);
    
    // Log para debug
    console.log('Filtros aplicados:', {
      ciudad: this.selectedCiudad,
      categoria: this.selectedCategoria,
      resultados: this.famososMostrados.length
    });
  }

  // Función para limpiar todos los filtros
  clearFilters() {
    this.selectedCiudad = '';
    this.selectedCategoria = '';
    this.famososMostrados = [...this.famososDelPais];
  }

  // Función para obtener texto descriptivo de los filtros activos
  getActiveFiltersText(): string {
    const filters = [];
    if (this.selectedCiudad) filters.push(`Ciudad: ${this.selectedCiudad}`);
    if (this.selectedCategoria) filters.push(`Categoría: ${this.selectedCategoria}`);
    return filters.length > 0 ? filters.join(' | ') : '';
  }

  // Método para abrir el modal con información del famoso
  openFamosoModal(famoso: Famoso) {
    this.selectedFamosoForModal = famoso;
    this.isModalOpen = true;
  }

  closeModal() {
    this.isModalOpen = false;
    this.selectedFamosoForModal = null;
  }

  async toggleFavorite(famoso: Famoso) {
    if (!famoso._id) {
      return;
    }

    try {
      const isFavorite = this.favoriteService.isFavorite(famoso._id, 0); // Usando 0 como índice por ser una sola imagen
      
      if (isFavorite) {
        const success = await this.favoriteService.removeFromFavorites(famoso._id, 0);
        if (success) {
          this.showToast('Famoso eliminado de favoritos', 'warning');
        }
      } else {
        const imageUrl = this.getFamosoImageUrl(famoso);
        const success = await this.favoriteService.addToFavorites(famoso._id, famoso.nombre, imageUrl, 0);
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

  isFavorite(famoso: Famoso): boolean {
    if (!famoso._id) {
      return false;
    }
    return this.favoriteService.isFavorite(famoso._id, 0);
  }

  getFamosoImageUrl(famoso: Famoso): string {
    if (famoso.img) {
      // Si img es un array, tomar la primera imagen
      if (Array.isArray(famoso.img)) {
        return famoso.img[0] || this.defaultImage;
      }
      // Si img es un string
      return famoso.img;
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