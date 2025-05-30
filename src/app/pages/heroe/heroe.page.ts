import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonContent, IonHeader, IonTitle, IonToolbar,
  IonButtons,
  IonBackButton,
} from '@ionic/angular/standalone';
import { Heroe } from 'src/app/interfaces/heroes.interface';
import { ActivatedRoute} from '@angular/router';
import { HeroesBDService } from 'src/app/services/heroes-bd.service';
import { HeroeEditComponent } from 'src/app/components/heroe-edit/heroe-edit.component';


@Component({
  selector: 'app-heroe',
  templateUrl: './heroe.page.html',
  styleUrls: ['./heroe.page.scss'],
  standalone: true,
  imports: [
    IonBackButton,
    IonButtons,
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    CommonModule,
    FormsModule,
  
    HeroeEditComponent
  ]
})
export class HeroePage implements OnInit {
  id!: string;

  heroe: Heroe = {
    _id: '',
    nombre: '',
    bio: '',
    img: '',
    aparicion: '',
    casa: '',
  };

  accion!: string;
  //visualizar
  //insertar
  //actualizar


  constructor(
    private activatedRoute: ActivatedRoute,
    private bd: HeroesBDService,

    ) {

    this.activatedRoute.params.subscribe((params) => {
      this.id = params['id'];
      this.accion = params['accion'];

      console.log('IDHEROE', this.id, 'ACCION', this.accion);

      if (this.id != '') {
        this.cargarUnHeroe();
      }

    });

  }

  ngOnInit() {
  }

  async cargarUnHeroe() {
    await this.bd
      .getUnHeroe(this.id)
      .toPromise()
      .then((data: any) => {
        //Aqui se realiza la asignacion de los personajes de la respuesta
        this.heroe = data.resp;

        console.log("MIHeroePAGE", this.heroe);

      });
  }


}
