import {Component, Inject, inject, input} from '@angular/core';
import {FormControl, ReactiveFormsModule} from '@angular/forms';
import {MatButton} from "@angular/material/button";
import {MatFormField, MatInput} from "@angular/material/input";
import {MatLabel} from "@angular/material/form-field";
import {MatOption, MatSelect} from "@angular/material/select";
import {MatListModule} from "@angular/material/list";
import {MAT_BOTTOM_SHEET_DATA, MatBottomSheet, MatBottomSheetRef} from "@angular/material/bottom-sheet";
import {Monitor, StateService} from "../../api/state.service";

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

    private _bottomSheet = inject(MatBottomSheet);

    id = input.required<number>()

    protected readonly Monitor = Monitor;

    openBottomSheet(): void {
        this._bottomSheet.open(EditNoteSheet, {data: { id: this.id() }});
    }
}

@Component({
    selector: 'edit-note-sheet',
    template: `
        <form class="sheetForm">
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
                <mat-select [formControl]="category">
                    <mat-option value="ToDo">ToDo</mat-option>
                    <mat-option value="Important">Important</mat-option>
                </mat-select>
            </mat-form-field>
        </form>
        <div class="formButtonContainer">
            <button (click)="edit()" matButton="outlined" class="formButton">confirm</button>
        </div>
    `,
    imports: [
        MatListModule,
        MatFormField,
        ReactiveFormsModule,
        MatSelect,
        MatOption,
        MatButton,
        MatInput,
        MatLabel,
    ],
})

export class EditNoteSheet {

    title = new FormControl('');
    desc = new FormControl('');
    category = new FormControl('ToDo');

    private _bottomSheetRef =
        inject<MatBottomSheetRef<EditNoteSheet>>(MatBottomSheetRef);

    constructor(private stateService: StateService, @Inject(MAT_BOTTOM_SHEET_DATA) public data: {id: number}) {
        const note = stateService.getNoteById(this.data.id)

        if (note != undefined) {
            this.title = new FormControl(note.name)
            this.desc = new FormControl(note.description)
            this.category = new FormControl(note.category)
        }
    }

    edit() {
        this.stateService.editNote({
            id: this.data.id,
            name: this.title.value!,
            description: this.desc.value!,
            reminders: [],
            category: this.category.value!,
        })
        this._bottomSheetRef.dismiss()
    }
}