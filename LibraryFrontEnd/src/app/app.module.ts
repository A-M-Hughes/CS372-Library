import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouterModule } from '@angular/router';
import { AppRoutingModule } from './app-routing.module';
import { FormsModule } from '@angular/forms';
import { ReactiveFormsModule } from '@angular/forms';
import { AppComponent } from './app.component';
import { LoginPageComponent } from './login-page/login-page.component';
import { SignupPageComponent } from './signup-page/signup-page.component';
import { HomepageComponent } from './homepage/homepage.component';
import { NavbarComponent } from './navbar/navbar.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HomepageSectionComponent } from './homepage-section/homepage-section.component';
import { SharedModule } from 'src/shared/shared.module';
import { TrendingBookListComponent } from './trending-book-list/trending-book-list.component';
import { BookCardComponent } from './book-card/book-card.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { HttpClientModule, HTTP_INTERCEPTORS} from '@angular/common/http';
import { SearchPageComponent } from './search-page/search-page.component';
import { RecomendedPageComponent } from './recomended-page/recomended-page.component';
import { CollectionPageComponent } from './collection-page/collection-page.component';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { SpinnerComponent } from './spinner/spinner.component';
import { LoadingInterceptor } from './loading.interceptor';

@NgModule({
  declarations: [
    AppComponent,
    LoginPageComponent,
    SignupPageComponent,
    HomepageComponent,
    NavbarComponent,
    HomepageSectionComponent,
    TrendingBookListComponent,
    BookCardComponent,
    DashboardComponent,
    SearchPageComponent,
    RecomendedPageComponent,
    CollectionPageComponent,
    SpinnerComponent
  ],
  imports: [
    BrowserModule,
    MatChipsModule,
    ReactiveFormsModule,
    RouterModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    SharedModule,
    HttpClientModule,
    FormsModule,
    ReactiveFormsModule,
    MatChipsModule,
    MatIconModule,
    MatFormFieldModule,
  ],
  providers: [
    {
      provide: HTTP_INTERCEPTORS, useClass: LoadingInterceptor, multi: true
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
