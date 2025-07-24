import {Component, inject, output, signal} from '@angular/core';
import {Note, NoteService} from "../api/note.service";
import {FormControl, ReactiveFormsModule} from '@angular/forms';
import {MatButton, MatFabButton} from "@angular/material/button";
import {MatFormField, MatInput} from "@angular/material/input";
import {MatLabel} from "@angular/material/form-field";
import {MatOption, MatSelect} from "@angular/material/select";
import {MatListModule} from "@angular/material/list";
import {MatBottomSheet, MatBottomSheetRef} from "@angular/material/bottom-sheet";
import {MatIconModule} from "@angular/material/icon";
import {MatProgressSpinner} from "@angular/material/progress-spinner";
import {StateService} from "../api/state.service";

@Component({
    selector: 'note-form-component',
    imports: [
        ReactiveFormsModule,
        MatFabButton,
        MatIconModule,
    ],
    template: `
        <button (click)="openBottomSheet()" matFab class="open" [disabled]="StateService.working()"><mat-icon fontIcon="add"></mat-icon></button>
    `,
    styles: `
    `
})
export class NoteformComponent {

    private _bottomSheet = inject(MatBottomSheet);

    openBottomSheet(): void {
        this._bottomSheet.open(CreateNoteSheet)
    }

    protected readonly StateService = StateService;
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
        <div class="formButtonContainer">
            <button (click)="add()" matButton="outlined" class="formButton">create</button>
        </div>`,
    imports: [MatListModule, MatFormField, ReactiveFormsModule, MatSelect, MatOption, MatButton, MatInput, MatLabel,],
})

export class CreateNoteSheet {
    title = new FormControl('');
    desc = new FormControl('');
    imp = new FormControl('ToDo');
    waiting = signal(false)

    private _bottomSheetRef =
        inject<MatBottomSheetRef<CreateNoteSheet>>(MatBottomSheetRef);

    constructor(private stateService: StateService) {
    }

    add() {
        this.waiting.update(_ => true)
        this.stateService.addNote({
            id: -1,
            name: this.title.value!,
            description: this.desc.value!,
            reminders: [],
            category: this.imp.value!,
        })
        this._bottomSheetRef.dismiss()
    }
}