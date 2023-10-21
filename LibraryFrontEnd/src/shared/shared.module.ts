import { NgModule } from '@angular/core';
import { FlexLayoutModule } from '@angular/flex-layout';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialogModule } from '@angular/material/dialog';
import { MatInputModule } from '@angular/material/input';

const materialModules = [
    MatButtonModule,
    MatCardModule,
    MatDialogModule,
    MatInputModule,
];

@NgModule({
    imports: [
        materialModules,
        FlexLayoutModule
    ],
    exports: [materialModules],
})
export class SharedModule { }
