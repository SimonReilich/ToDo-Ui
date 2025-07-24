import {Component, inject, output} from '@angular/core';
import {Note, NoteService} from "../api/note.service";
import {FormControl, ReactiveFormsModule} from '@angular/forms';
import {MatButton} from "@angular/material/button";
import {MatFormField, MatInput} from "@angular/material/input";
import {MatLabel} from "@angular/material/form-field";
import {MatOption, MatSelect} from "@angular/material/select";
import {MatListModule} from "@angular/material/list";
import {MatBottomSheet, MatBottomSheetRef} from "@angular/material/bottom-sheet";

@Component({
    selector: 'note-form-component',
    imports: [
        ReactiveFormsModule,
        MatButton,
    ],
    template: `
        <button (click)="openBottomSheet()" matButton="outlined" class="open">add</button>
    `,
    styles: `
      .open {
        margin-bottom: 2rem;
      }
    `
})
export class NoteformComponent {

    refresh = output<void>();

    private _bottomSheet = inject(MatBottomSheet);

    openBottomSheet(): void {
        this._bottomSheet.open(CreateNoteSheet).afterDismissed().subscribe(_ => {
            this.refresh.emit()
        });
    }
}

@Component({
    selector: 'create-note-sheet',
    template: `
        <form>
            <mat-form-field>
                <mat-label>title</mat-label>
                <input matInput type="text" id="title" [formControl]="title">
            </mat-form-field>
            <mat-form-field>
                <mat-label>description</mat-label>
                <textarea matInput type="text" id="desc" [formControl]="desc"></textarea>
            </mat-form-field>
            <mat-form-field>
                <mat-label>category</mat-label>
                <mat-select [formControl]="imp">
                    <mat-option value="ToDo">ToDo</mat-option>
                    <mat-option value="Important">Important</mat-option>
                </mat-select>
            </mat-form-field>
        </form>
        <button (click)="add()" matButton="outlined" class="formButton">create</button>`,
    imports: [MatListModule, MatFormField, ReactiveFormsModule, MatSelect, MatOption, MatButton, MatInput, MatLabel],
})

export class CreateNoteSheet {
    title = new FormControl('');
    desc = new FormControl('');
    imp = new FormControl('ToDo');
    private _bottomSheetRef =
        inject<MatBottomSheetRef<CreateNoteSheet>>(MatBottomSheetRef);

    constructor(private noteService: NoteService) {
    }

    add() {
        this.noteService.create(<Note>{
            id: 0,
            name: this.title.value,
            description: this.desc.value,
            reminders: [],
            category: this.imp.value,
        }).subscribe();
        this._bottomSheetRef.dismiss();
    }
}