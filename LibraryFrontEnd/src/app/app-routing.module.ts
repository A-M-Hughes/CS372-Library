import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomepageComponent } from './homepage/homepage.component';
import { LoginPageComponent } from './login-page/login-page.component';
import { SignupPageComponent } from './signup-page/signup-page.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { SearchPageComponent } from './search-page/search-page.component';
import { RecomendedPageComponent } from './recomended-page/recomended-page.component';
import { CollectionPageComponent } from './collection-page/collection-page.component';

const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'home', component: HomepageComponent },
  { path: 'login', component: LoginPageComponent},
  { path: 'signup', component: SignupPageComponent},
  { path: 'dashboard', component: DashboardComponent},
  { path: 'search', component: SearchPageComponent },
  { path: 'recommended', component: RecomendedPageComponent},
  { path: 'collection', component: CollectionPageComponent},
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }