import {Component, Inject, inject, input, output} from '@angular/core';
import {Note, NoteService} from "../api/note.service";
import {FormControl, ReactiveFormsModule} from '@angular/forms';
import {MatButton} from "@angular/material/button";
import {MatFormField, MatInput} from "@angular/material/input";
import {MatLabel} from "@angular/material/form-field";
import {MatOption, MatSelect} from "@angular/material/select";
import {MatListModule} from "@angular/material/list";
import {MAT_BOTTOM_SHEET_DATA, MatBottomSheet, MatBottomSheetRef} from "@angular/material/bottom-sheet";

@Component({
    selector: 'note-edit-component',
    imports: [
        ReactiveFormsModule,
        MatButton,
    ],
    template: `
        <button (click)="openBottomSheet()" matButton="outlined">edit</button>
    `,
    styles: `
    `
})
export class NoteeditComponent {

    refresh = output<number>();

    private _bottomSheet = inject(MatBottomSheet);

    id = input.required<number>()

    openBottomSheet(): void {
        const ref = this._bottomSheet.open(CreateNoteSheet, {data: { id: this.id() }});

        ref.afterDismissed().subscribe(_ => {
            this.refresh.emit(this.id())
        });
    }
}

@Component({
    selector: 'create-note-sheet',
    template: `
        <form>
            <mat-form-field>
                <mat-label>title</mat-label>
                <input matInput type="text" id="title" [formControl]="title" required>
            </mat-form-field>
            <mat-form-field>
                <mat-label>description</mat-label>
                <textarea matInput type="text" id="desc" [formControl]="desc" required></textarea>
            </mat-form-field>
            <mat-form-field>
                <mat-label>category</mat-label>
                <mat-select [formControl]="imp">
                    <mat-option value="ToDo">ToDo</mat-option>
                    <mat-option value="Important">Important</mat-option>
                </mat-select>
            </mat-form-field>
        </form>
        <button (click)="edit()" matButton="outlined" class="formButton">confirm</button>`,
    imports: [MatListModule, MatFormField, ReactiveFormsModule, MatSelect, MatOption, MatButton, MatInput, MatLabel],
})

export class CreateNoteSheet {
    title = new FormControl('');
    desc = new FormControl('');
    imp = new FormControl('ToDo');

    private _bottomSheetRef =
        inject<MatBottomSheetRef<CreateNoteSheet>>(MatBottomSheetRef);

    constructor(private noteService: NoteService, @Inject(MAT_BOTTOM_SHEET_DATA) public data: {id: number}) {
        const self = this
        noteService.get(data.id).subscribe(note => {
            self.title = new FormControl(note.name)
            self.desc = new FormControl(note.description)
            self.imp = new FormControl(note.category)
        })
    }

    edit() {
        const self = this;
        this.noteService.update(<Note>{
            id: this.data.id,
            name: this.title.value,
            description: this.desc.value,
            reminders: [],
            category: this.imp.value,
        }).subscribe(_ => self._bottomSheetRef.dismiss());
    }
}