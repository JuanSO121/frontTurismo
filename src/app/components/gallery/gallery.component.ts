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
  personOutline
} from 'ionicons/icons';
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
  famosos: Famoso[] = [];
  
  // Selecciones actuales
  selectedPais: Pais | null = null;
  selectedCiudad: string = '';
  selectedFamoso: Famoso | null = null;
  
  // Imágenes
  famosoImages: string[] = [];
  defaultImage: string = 'assets/img/no-image.png';
  
  // Modal properties
  isModalOpen: boolean = false;
  selectedImageUrl: string = '';
  selectedImageIndex: number = -1;

  // Toast properties
  isToastOpen: boolean = false;
  toastMessage: string = '';
  toastColor: string = 'success';

  constructor(
    private famososService: FamososService,
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
      personOutline
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
    this.selectedFamoso = null;
    this.famosos = [];
    this.famosoImages = [];
    this.ciudades = [];
    
    if (!paisId) {
      this.selectedPais = null;
      return;
    }
    
    this.selectedPais = this.paises.find(pais => pais._id === paisId) || null;
    
    if (this.selectedPais) {
      await this.loadCiudadesByPais(paisId);
    }
  }

  async loadCiudadesByPais(paisId: string) {
    const loading = await this.presentLoading('Cargando ciudades...');
    
    try {
      this.paisesService.getCiudadesByPais(paisId).subscribe({
        next: (ciudades: string[]) => {
          this.ciudades = ciudades || [];
          console.log('Ciudades cargadas:', this.ciudades);
          loading.dismiss();
        },
        error: (error) => {
          console.error('Error al cargar ciudades:', error);
          // Si no hay endpoint específico, obtener ciudades de los famosos
          this.loadCiudadesFromFamosos();
          loading.dismiss();
        }
      });
    } catch (error) {
      console.error('Error en la carga de ciudades:', error);
      this.loadCiudadesFromFamosos();
      loading.dismiss();
    }
  }

  async loadCiudadesFromFamosos() {
    if (!this.selectedPais) return;
    
    try {
      this.famososService.getFamososByPais(this.selectedPais.nombre).subscribe({
        next: (response) => {
          if (response && response.ok && response.data) {
            const famososDelPais = response.data as Famoso[];
            // Extraer ciudades únicas - Corregido el error de TypeScript
            const ciudadesUnicas = [...new Set(
              famososDelPais
                .map((f: Famoso) => f.ciudad)
                .filter((ciudad): ciudad is string => 
                  typeof ciudad === 'string' && ciudad.trim() !== ''
                )
            )];
            this.ciudades = ciudadesUnicas;
            console.log('Ciudades extraídas de famosos:', this.ciudades);
          }
        },
        error: (error) => {
          console.error('Error al obtener ciudades de famosos:', error);
        }
      });
    } catch (error) {
      console.error('Error al extraer ciudades de famosos:', error);
    }
  }

  async ciudadSelected(event: Event) {
    const selectElement = event.target as HTMLIonSelectElement;
    this.selectedCiudad = selectElement.value;
    
    // Reset selections
    this.selectedFamoso = null;
    this.famosoImages = [];
    this.famosos = [];
    
    if (!this.selectedCiudad) {
      return;
    }
    
    await this.loadFamososByCiudad(this.selectedCiudad);
  }

  async loadFamososByCiudad(ciudad: string) {
    const loading = await this.presentLoading('Cargando famosos...');
    
    try {
      this.famososService.getFamososByCiudad(ciudad).subscribe({
        next: (response) => {
          if (response && response.ok && response.data) {
            this.famosos = response.data;
            console.log('Famosos cargados:', this.famosos);
          } else {
            console.error('Formato de respuesta inesperado:', response);
          }
          loading.dismiss();
        },
        error: (error) => {
          console.error('Error al cargar famosos:', error);
          this.presentAlert('Error', 'No se pudieron cargar los famosos');
          loading.dismiss();
        }
      });
    } catch (error) {
      console.error('Error en la carga de famosos:', error);
      loading.dismiss();
    }
  }

  async famosoSelected(event: Event) {
    const selectElement = event.target as HTMLIonSelectElement;
    const famosoId = selectElement.value;
    
    if (!famosoId) {
      this.selectedFamoso = null;
      this.famosoImages = [];
      return;
    }
    
    this.selectedFamoso = this.famosos.find(famoso => famoso._id === famosoId) || null;
    
    if (this.selectedFamoso) {
      await this.loadFamosoImages(famosoId);
    }
  }

  async loadFamosoImages(famosoId: string) {
    const loading = await this.presentLoading('Cargando imágenes...');
    
    try {
      if (this.selectedFamoso && this.selectedFamoso.img) {
        // Si img es un array
        if (Array.isArray(this.selectedFamoso.img)) {
          this.famosoImages = this.selectedFamoso.img;
        } else {
          // Si img es un string
          this.famosoImages = [this.selectedFamoso.img];
        }
      } else {
        this.famosoImages = [];
      }
      
      console.log('Imágenes cargadas:', this.famosoImages);
      loading.dismiss();
    } catch (error) {
      console.error('Error en la carga de imágenes:', error);
      loading.dismiss();
    }
  }

  async showAddImagePrompt() {
    const alert = await this.alertController.create({
      header: 'Agregar imagen',
      inputs: [
        {
          name: 'imageUrl',
          type: 'text',
          placeholder: 'URL de la imagen'
        }
      ],
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Agregar',
          handler: (data) => {
            if (data.imageUrl && this.selectedFamoso) {
              this.addImage(data.imageUrl);
            }
          }
        }
      ]
    });

    await alert.present();
  }

  async addImage(imageUrl: string) {
    if (!this.selectedFamoso || !this.selectedFamoso._id) {
      await this.presentAlert('Error', 'Primero selecciona un famoso');
      return;
    }

    if (!imageUrl.trim()) {
      await this.presentAlert('Error', 'Por favor ingresa una URL válida');
      return;
    }

    const loading = await this.presentLoading('Agregando imagen...');

    try {
      // Actualizar el famoso con la nueva imagen - Corregido el tipo
      const updatedFamoso: Famoso = { ...this.selectedFamoso };
      
      if (Array.isArray(updatedFamoso.img)) {
        updatedFamoso.img.push(imageUrl);
      } else if (updatedFamoso.img) {
        updatedFamoso.img = [updatedFamoso.img, imageUrl];
      } else {
        updatedFamoso.img = [imageUrl];
      }

      this.famososService.crud_Famosos(updatedFamoso, 'modificar').subscribe({
        next: (response) => {
          console.log('Imagen agregada:', response);
          // Recargar las imágenes
          this.loadFamosoImages(this.selectedFamoso!._id!);
          this.showToast('Imagen agregada exitosamente', 'success');
          loading.dismiss();
        },
        error: (error) => {
          console.error('Error al agregar imagen:', error);
          this.presentAlert('Error', 'No se pudo agregar la imagen');
          loading.dismiss();
        }
      });
    } catch (error) {
      console.error('Error al agregar imagen:', error);
      loading.dismiss();
    }
  }

  async deleteImage(imageIndex: number) {
    if (!this.selectedFamoso || !this.selectedFamoso._id) {
      return;
    }

    const alert = await this.alertController.create({
      header: 'Confirmar',
      message: '¿Estás seguro de que quieres eliminar esta imagen?',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Eliminar',
          handler: async () => {
            const loading = await this.presentLoading('Eliminando imagen...');
            
            try {
              const updatedFamoso: Famoso = { ...this.selectedFamoso! };
              
              if (Array.isArray(updatedFamoso.img)) {
                updatedFamoso.img.splice(imageIndex, 1);
              }

              this.famososService.crud_Famosos(updatedFamoso, 'modificar').subscribe({
                next: (response) => {
                  console.log('Imagen eliminada:', response);
                  this.loadFamosoImages(this.selectedFamoso!._id!);
                  this.showToast('Imagen eliminada exitosamente', 'warning');
                  loading.dismiss();
                },
                error: (error) => {
                  console.error('Error al eliminar imagen:', error);
                  this.presentAlert('Error', 'No se pudo eliminar la imagen');
                  loading.dismiss();
                }
              });
            } catch (error) {
              console.error('Error al eliminar imagen:', error);
              loading.dismiss();
            }
          }
        }
      ]
    });

    await alert.present();
  }

  async toggleFavorite(imageIndex: number) {
    if (!this.selectedFamoso || !this.selectedFamoso._id) {
      return;
    }

    const imageUrl = this.famosoImages[imageIndex];
    const famosoId = this.selectedFamoso._id;
    const famosoName = this.selectedFamoso.nombre;

    try {
      const isFavorite = this.favoriteService.isFavorite(famosoId, imageIndex);
      
      if (isFavorite) {
        const success = await this.favoriteService.removeFromFavorites(famosoId, imageIndex);
        if (success) {
          this.showToast('Imagen eliminada de favoritos', 'warning');
        }
      } else {
        const success = await this.favoriteService.addToFavorites(famosoId, famosoName, imageUrl, imageIndex);
        if (success) {
          this.showToast('Imagen agregada a favoritos', 'success');
        } else {
          this.showToast('La imagen ya está en favoritos', 'primary');
        }
      }
    } catch (error) {
      console.error('Error al manejar favorito:', error);
      this.showToast('Error al manejar favorito', 'danger');
    }
  }

  isFavorite(imageIndex: number): boolean {
    if (!this.selectedFamoso || !this.selectedFamoso._id) {
      return false;
    }
    return this.favoriteService.isFavorite(this.selectedFamoso._id, imageIndex);
  }

  handleImageError(event: Event) {
    const imgElement = event.target as HTMLImageElement;
    imgElement.src = this.defaultImage;
  }

  // Modal methods
  openImageModal(imageUrl: string, imageIndex: number) {
    this.selectedImageUrl = imageUrl;
    this.selectedImageIndex = imageIndex;
    this.isModalOpen = true;
  }

  closeModal() {
    this.isModalOpen = false;
    this.selectedImageUrl = '';
    this.selectedImageIndex = -1;
  }

  getCurrentImageUrl(): string {
    return this.selectedImageUrl || this.defaultImage;
  }

  getFamosoInfo(): string {
    if (!this.selectedFamoso) return '';
    
    return `Imagen ${this.selectedImageIndex + 1} de ${this.famosoImages.length} • ${this.selectedFamoso.categoria}`;
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