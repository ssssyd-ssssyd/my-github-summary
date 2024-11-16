import { Routes } from '@angular/router';
import { AuthenticationComponent } from './components/authentication/authentication.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';

export const routes: Routes = [
  { path: '', component: AuthenticationComponent },
  { path: 'dashboard', component: DashboardComponent },
];
