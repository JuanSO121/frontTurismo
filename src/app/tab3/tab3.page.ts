import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { 
  IonHeader, 
  IonToolbar, 
  IonTitle, 
  IonContent, IonCard, IonItem, IonIcon, IonFabButton, IonFabList, IonFab, IonButton, IonChip, IonLabel, IonCardContent } from '@ionic/angular/standalone';
import { GalleryComponent } from '../components/gallery/gallery.component';

@Component({
  selector: 'app-tab3',
  templateUrl: 'tab3.page.html',
  styleUrls: ['tab3.page.scss'],
  standalone: true,
  imports: [IonCardContent, IonLabel, IonChip, IonButton, IonFab, IonFabList, IonFabButton, IonIcon, IonItem, IonCard, 
    CommonModule,
    IonHeader, 
    IonToolbar, 
    IonTitle, 
    IonContent,
    GalleryComponent
  ],
})
export class Tab3Page {
  
  constructor() {}

}