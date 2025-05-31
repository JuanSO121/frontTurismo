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
  heart
} from 'ionicons/icons';
import { addIcons } from 'ionicons';
import { Heroe } from 'src/app/interfaces/heroes.interface';
import { HeroesBDService } from 'src/app/services/heroes-bd.service';
import { FavoriteService } from 'src/app/services/favorite.service';

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
  @Input() title: string = 'Galería de Imágenes';
  @Input() selectLabel: string = 'Seleccionar Héroe';
  @Input() selectPlaceholder: string = 'Seleccione un héroe';
  
  characters: Heroe[] = [];
  selectedCharacter: Heroe | null = null;
  
  characterImages: string[] = [];
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
    private heroesBDService: HeroesBDService,
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
      heart
    });
  }

  ngOnInit() {
    this.loadCharacters();
  }

  async loadCharacters() {
    const loading = await this.presentLoading('Cargando personajes...');
    
    try {
      this.heroesBDService.getHeroes().subscribe({
        next: (response) => {
          if (response && response.Ok && response.resp) {
            this.characters = response.resp;
            console.log('Personajes cargados:', this.characters);
          } else {
            console.error('Formato de respuesta inesperado:', response);
          }
          loading.dismiss();
        },
        error: (error) => {
          console.error('Error al cargar personajes:', error);
          this.presentAlert('Error', 'No se pudieron cargar los personajes');
          loading.dismiss();
        }
      });
    } catch (error) {
      console.error('Error en la carga de personajes:', error);
      loading.dismiss();
    }
  }

  async characterSelected(event: Event) {
    const selectElement = event.target as HTMLIonSelectElement;
    const characterId = selectElement.value;
    
    if (!characterId) {
      this.selectedCharacter = null;
      this.characterImages = [];
      return;
    }
    
    this.selectedCharacter = this.characters.find(character => character._id === characterId) || null;
    
    if (this.selectedCharacter) {
      await this.loadCharacterImages(characterId);
    }
  }

  async loadCharacterImages(characterId: string) {
    const loading = await this.presentLoading('Cargando imágenes...');
    
    try {
      this.heroesBDService.getHeroeImages(characterId).subscribe({
        next: (images) => {
          this.characterImages = images || [];
          console.log('Imágenes cargadas:', this.characterImages);
          loading.dismiss();
        },
        error: (error) => {
          console.error('Error al cargar imágenes:', error);
          this.presentAlert('Error', 'No se pudieron cargar las imágenes');
          this.characterImages = [];
          loading.dismiss();
        }
      });
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
            if (data.imageUrl && this.selectedCharacter) {
              this.addImage(data.imageUrl);
            }
          }
        }
      ]
    });

    await alert.present();
  }

  async addImage(imageUrl: string) {
    if (!this.selectedCharacter || !this.selectedCharacter._id) {
      await this.presentAlert('Error', 'Primero selecciona un personaje');
      return;
    }

    if (!imageUrl.trim()) {
      await this.presentAlert('Error', 'Por favor ingresa una URL válida');
      return;
    }

    const loading = await this.presentLoading('Agregando imagen...');

    try {
      this.heroesBDService.addHeroeImage(this.selectedCharacter._id, imageUrl).subscribe({
        next: (response) => {
          console.log('Imagen agregada:', response);
          // Recargar las imágenes para ver la nueva
          this.loadCharacterImages(this.selectedCharacter!._id!);
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
    if (!this.selectedCharacter || !this.selectedCharacter._id) {
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
              this.heroesBDService.deleteHeroeImage(this.selectedCharacter!._id!, imageIndex).subscribe({
                next: (response) => {
                  console.log('Imagen eliminada:', response);
                  // Recargar las imágenes para reflejar el cambio
                  this.loadCharacterImages(this.selectedCharacter!._id!);
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
    if (!this.selectedCharacter || !this.selectedCharacter._id) {
      return;
    }

    const imageUrl = this.characterImages[imageIndex];
    const heroId = this.selectedCharacter._id;
    const heroName = this.selectedCharacter.nombre;

    try {
      const isFavorite = this.favoriteService.isFavorite(heroId, imageIndex);
      
      if (isFavorite) {
        const success = await this.favoriteService.removeFromFavorites(heroId, imageIndex);
        if (success) {
          this.showToast('Imagen eliminada de favoritos', 'warning');
        }
      } else {
        const success = await this.favoriteService.addToFavorites(heroId, heroName, imageUrl, imageIndex);
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
    if (!this.selectedCharacter || !this.selectedCharacter._id) {
      return false;
    }
    return this.favoriteService.isFavorite(this.selectedCharacter._id, imageIndex);
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

  getCharacterInfo(): string {
    if (!this.selectedCharacter) return '';
    
    const aparicionYear = this.selectedCharacter.aparicion ? 
      new Date(this.selectedCharacter.aparicion).getFullYear() : 
      'Desconocido';
    
    return `Imagen ${this.selectedImageIndex + 1} de ${this.characterImages.length} • ${aparicionYear}`;
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