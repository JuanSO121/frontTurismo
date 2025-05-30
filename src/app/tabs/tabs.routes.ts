import { Routes } from '@angular/router';
import { TabsPage } from './tabs.page';

export const routes: Routes = [
  {
    path: '',
    component: TabsPage,
    children: [
      {
        path: 'tab2',
        loadComponent: () =>
          import('../tab2/tab2.page').then((m) => m.Tab2Page),
      },
      {
        path: 'tab3',
        loadComponent: () =>
          import('../tab3/tab3.page').then((m) => m.Tab3Page),
      },
      {
        path: 'heroes', 
        loadComponent: () =>
          import('../pages/heroes/heroes.page').then((m) => m.HeroesPage),
      },
      {
        path: '',
        redirectTo: 'heroes',  
        pathMatch: 'full',
      },
    ],
  }
];