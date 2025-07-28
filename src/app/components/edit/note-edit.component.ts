import {Component, inject, input} from '@angular/core';
import {ReactiveFormsModule} from '@angular/forms';
import {MatButton} from "@angular/material/button";
import {MatBottomSheet} from "@angular/material/bottom-sheet";
import {Monitor} from "../../api/state.service";
import {NoteSheet} from "../sheets/note-sheet.component";

@Component({
    selector: 'note-edit',
    imports: [
        ReactiveFormsModule,
        MatButton,
    ],
    template: `
        <button (click)="openBottomSheet()" matButton="outlined" [disabled]="Monitor.waitingOnExcl()">edit</button>
    `,
    styles: `
    `
})
export class NoteEditComponent {

    id = input.required<number>()
    protected readonly Monitor = Monitor;
    private _bottomSheet = inject(MatBottomSheet);

    openBottomSheet(): void {
        this._bottomSheet.open(NoteSheet, {data: {id: this.id()}});
    }
}