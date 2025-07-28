import {Component, Inject, inject} from "@angular/core";
import {MatListModule} from "@angular/material/list";
import {MatFormField, MatInput} from "@angular/material/input";
import {FormBuilder, ReactiveFormsModule, Validators} from "@angular/forms";
import {MatOption, MatSelect} from "@angular/material/select";
import {MatButton} from "@angular/material/button";
import {MatLabel} from "@angular/material/form-field";
import {MAT_BOTTOM_SHEET_DATA, MatBottomSheetRef} from "@angular/material/bottom-sheet";
import {StateService} from "../../api/state.service";


@Component({
    selector: 'note-sheet',
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
            <button (click)="mode == 'create' ? add() : edit()" matButton="outlined" class="formButton">create</button>
        </div>`,
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

export class NoteSheet {
    readonly form

    private _bottomSheetRef =
        inject<MatBottomSheetRef<NoteSheet>>(MatBottomSheetRef);

    protected readonly mode: 'create' | 'modify'

    constructor(protected stateService: StateService, protected readonly fb: FormBuilder, @Inject(MAT_BOTTOM_SHEET_DATA) public data: {id?: number}) {
        const note = stateService.getNoteById(this.data.id!)

        if (note == undefined) {
            this.form = fb.group({
                title: this.fb.control('', [Validators.required]),
                description: this.fb.control(''),
                tag: this.fb.control(-1, [Validators.required]),
            })
            this.mode = 'create'
        } else {
            this.form = fb.group({
                title: this.fb.control(note.name, [Validators.required]),
                description: this.fb.control(note.description),
                tag: this.fb.control(note.tag == undefined ? -1 : note.tag.id, [Validators.required]),
            })
            this.mode = 'modify'
        }
    }

    add() {
        this.stateService.addNote({
            id: -1,
            name: this.form.value.title!.trim(),
            description: this.form.value.description!.trim(),
            reminders: [],
            tag: this.stateService.getTagById(this.form.value.tag!),
        })
        this._bottomSheetRef.dismiss()
    }

    edit() {
        this.stateService.editNote({
            id: this.data.id!,
            name: this.form.value.title!.trim(),
            description: this.form.value.description!,
            reminders: this.stateService.getNoteById(this.data.id!)!.reminders,
            tag: this.stateService.getTagById(this.form.value.tag!),
        })
        this._bottomSheetRef.dismiss()
    }
}