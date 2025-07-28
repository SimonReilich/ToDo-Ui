import {Component, inject, signal} from '@angular/core';
import {FormBuilder, FormControl, ReactiveFormsModule, Validators} from '@angular/forms';
import {MatButton, MatFabButton} from "@angular/material/button";
import {MatFormField, MatInput} from "@angular/material/input";
import {MatLabel} from "@angular/material/form-field";
import {MatOption, MatSelect} from "@angular/material/select";
import {MatListModule} from "@angular/material/list";
import {MatBottomSheet, MatBottomSheetRef} from "@angular/material/bottom-sheet";
import {MatIconModule} from "@angular/material/icon";
import {Monitor, StateService} from "../../api/state.service";

@Component({
    selector: 'note-creation',
    imports: [
        ReactiveFormsModule,
        MatFabButton,
        MatIconModule,
    ],
    template: `
        <button (click)="openBottomSheet()" matFab class="open" [disabled]="Monitor.waitingOnExcl()"><mat-icon fontIcon="add"></mat-icon></button>
    `,
    styles: `
    `
})
export class NoteCreationComponent {

    private _bottomSheet = inject(MatBottomSheet);

    protected readonly Monitor = Monitor;

    openBottomSheet(): void {
        this._bottomSheet.open(CreateNoteSheet)
    }
}

@Component({
    selector: 'create-note-sheet',
    template: `
        <form class="sheetForm" [formGroup]="form">
            <mat-form-field>
                <mat-label>title</mat-label>
                <input matInput type="text" id="title" formControlName="title" required>
            </mat-form-field>
            <mat-form-field>
                <mat-label>description</mat-label>
                <textarea matInput type="text" id="desc" formControlName="description" required></textarea>
            </mat-form-field>
            <mat-form-field>
                <mat-label>tag</mat-label>
                <mat-select formControlName="tag">
                    <mat-option [value]="-1">no tag</mat-option>
                    @for (tag of stateService.tags(); track tag.id) {
                        <mat-option [value]="tag.id">{{ tag.name }}</mat-option>
                    }
                </mat-select>
            </mat-form-field>
        </form>
        <div class="formButtonContainer">
            <button (click)="add()" matButton="outlined" class="formButton">create</button>
        </div>`,
    imports: [
        MatListModule,
        MatFormField,
        ReactiveFormsModule,
        MatSelect,
        MatOption,
        MatButton,
        MatInput,
        MatLabel,],
})

export class CreateNoteSheet {
    readonly form;

    waiting = signal(false)

    private _bottomSheetRef =
        inject<MatBottomSheetRef<CreateNoteSheet>>(MatBottomSheetRef);

    constructor(protected stateService: StateService, protected readonly fb: FormBuilder) {
        this.form = fb.group({
            title: this.fb.control('', [Validators.required]),
            description: this.fb.control(''),
            tag: this.fb.control(-1, [Validators.required]),
        })
    }

    add() {
        this.waiting.update(_ => true)
        this.stateService.addNote({
            id: -1,
            name: this.form.value.title!.trim(),
            description: this.form.value.description!.trim(),
            reminders: [],
            tag: this.stateService.getTagById(this.form.value.tag!),
        })
        this._bottomSheetRef.dismiss()
    }

    protected readonly StateService = StateService;
}