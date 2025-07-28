import {Component, inject} from '@angular/core';
import {ReactiveFormsModule} from '@angular/forms';
import {MatFabButton} from "@angular/material/button";
import {MatBottomSheet} from "@angular/material/bottom-sheet";
import {MatIconModule} from "@angular/material/icon";
import {Monitor} from "../../api/state.service";
import {NoteSheet} from "../sheets/note-sheet.component";

@Component({
    selector: 'note-creation',
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
export class NoteCreationComponent {

    protected readonly Monitor = Monitor;
    private _bottomSheet = inject(MatBottomSheet);

    openBottomSheet(): void {
        this._bottomSheet.open(NoteSheet)
    }
}