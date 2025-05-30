import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { 
  IonHeader, 
  IonToolbar, 
  IonTitle, 
  IonContent,
  IonList,
  IonItem,
  IonLabel,
  IonSelect,
  IonSelectOption,
  IonGrid,
  IonRow,
  IonCol,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonButton,
  IonIcon,
  IonInput,
  IonAlert,
  IonLoading,
  AlertController,
  LoadingController, IonSpinner } from '@ionic/angular/standalone';
import { ExploreContainerComponent } from '../explore-container/explore-container.component';
import { HeroesBDService } from '../services/heroes-bd.service';
import { Heroe } from '../interfaces/heroes.interface';
import { addCircleOutline, trashOutline, imageOutline } from 'ionicons/icons';
import { addIcons } from 'ionicons';

@Component({
  selector: 'app-tab3',
  templateUrl: 'tab3.page.html',
  styleUrls: ['tab3.page.scss'],
  standalone: true,
  imports: [IonSpinner, 
    CommonModule,
    FormsModule,
    IonHeader, 
    IonToolbar, 
    IonTitle, 
    IonContent,
    IonList,
    IonItem,
    IonLabel,
    IonSelect,
    IonSelectOption,
    IonGrid,
    IonRow,
    IonCol,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonButton,
    IonIcon,
    IonInput,
    IonAlert,
    IonLoading,
    ExploreContainerComponent
  ],
})
export class Tab3Page implements OnInit {
  heroes: Heroe[] = [];
  selectedHero: Heroe | null = null;
  heroImages: string[] = [];
  newImageUrl: string = '';
  defaultImage: string = 'assets/img/no-image.png';
  isLoading: boolean = false;
  showAddImageAlert: boolean = false;
  loadingMessage: string = 'Cargando...';
  
  constructor(
    private heroesBDService: HeroesBDService,
    private alertController: AlertController,
    private loadingController: LoadingController
  ) {
    addIcons({ addCircleOutline, trashOutline, imageOutline });
  }

  ngOnInit() {
    this.loadHeroes();
  }

  async loadHeroes() {
    const loading = await this.presentLoading('Cargando héroes...');
    
    try {
      this.heroesBDService.getHeroes().subscribe({
        next: (response) => {
          if (response && response.Ok && response.resp) {
            this.heroes = response.resp;
            console.log('Héroes cargados:', this.heroes);
          } else {
            console.error('Formato de respuesta inesperado:', response);
          }
          loading.dismiss();
        },
        error: (error) => {
          console.error('Error al cargar héroes:', error);
          this.presentAlert('Error', 'No se pudieron cargar los héroes');
          loading.dismiss();
        }
      });
    } catch (error) {
      console.error('Error en la carga de héroes:', error);
      loading.dismiss();
    }
  }

  async heroSelected(event: Event) {
    const selectElement = event.target as HTMLIonSelectElement;
    const heroId = selectElement.value;
    
    if (!heroId) {
      this.selectedHero = null;
      this.heroImages = [];
      return;
    }
    
    this.selectedHero = this.heroes.find(hero => hero._id === heroId) || null;
    
    if (this.selectedHero) {
      await this.loadHeroImages(heroId);
    }
  }

  async loadHeroImages(heroId: string) {
    const loading = await this.presentLoading('Cargando imágenes...');
    
    try {
      this.heroesBDService.getHeroeImages(heroId).subscribe({
        next: (images) => {
          this.heroImages = images || [];
          console.log('Imágenes cargadas:', this.heroImages);
          loading.dismiss();
        },
        error: (error) => {
          console.error('Error al cargar imágenes:', error);
          this.presentAlert('Error', 'No se pudieron cargar las imágenes');
          this.heroImages = [];
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
            if (data.imageUrl && this.selectedHero) {
              this.addImage(data.imageUrl);
            }
          }
        }
      ]
    });

    await alert.present();
  }

  async addImage(imageUrl: string) {
    if (!this.selectedHero || !this.selectedHero._id) {
      await this.presentAlert('Error', 'Primero selecciona un héroe');
      return;
    }

    if (!imageUrl.trim()) {
      await this.presentAlert('Error', 'Por favor ingresa una URL válida');
      return;
    }

    const loading = await this.presentLoading('Agregando imagen...');

    try {
      this.heroesBDService.addHeroeImage(this.selectedHero._id, imageUrl).subscribe({
        next: (response) => {
          console.log('Imagen agregada:', response);
          // Recargar las imágenes para ver la nueva
          this.loadHeroImages(this.selectedHero!._id!);
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
    if (!this.selectedHero || !this.selectedHero._id) {
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
              this.heroesBDService.deleteHeroeImage(this.selectedHero!._id!, imageIndex).subscribe({
                next: (response) => {
                  console.log('Imagen eliminada:', response);
                  // Recargar las imágenes para reflejar el cambio
                  this.loadHeroImages(this.selectedHero!._id!);
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
}