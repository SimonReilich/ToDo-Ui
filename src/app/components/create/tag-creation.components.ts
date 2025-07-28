import {Component, inject} from '@angular/core';
import {ReactiveFormsModule} from '@angular/forms';
import {MatFabButton} from "@angular/material/button";
import {MatBottomSheet} from "@angular/material/bottom-sheet";
import {MatIconModule} from "@angular/material/icon";
import {Monitor} from "../../api/state.service";
import {TagSheet} from "../sheets/tag-sheet.component";

@Component({
    selector: 'tag-creation',
    imports: [
        ReactiveFormsModule,
        MatFabButton,
        MatIconModule,
    ],
    template: `
        <button (click)="openBottomSheet()" matFab class="open" [disabled]="Monitor.waitingOnExcl()">
            <mat-icon fontIcon="add"></mat-icon>
        </button>
    `,
    styles: `
    `
})
export class TagCreationComponent {

    protected readonly Monitor = Monitor;
    private _bottomSheet = inject(MatBottomSheet);

    openBottomSheet(): void {
        this._bottomSheet.open(TagSheet)
    }
}