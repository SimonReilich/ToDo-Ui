import {Component, Inject, inject} from "@angular/core";
import {MatListModule} from "@angular/material/list";
import {MatFormField, MatInput} from "@angular/material/input";
import {FormBuilder, ReactiveFormsModule, Validators} from "@angular/forms";
import {MatOption, MatSelect} from "@angular/material/select";
import {MatButton} from "@angular/material/button";
import {MatError, MatLabel} from "@angular/material/form-field";
import {Tag} from "../../api/tag.service";
import {MAT_BOTTOM_SHEET_DATA, MatBottomSheetRef} from "@angular/material/bottom-sheet";
import {StateService} from "../../api/state.service";

@Component({
    selector: 'tag-sheet',
    template: `
        <form class="sheetForm" [formGroup]="form">
            <mat-form-field>
                <mat-label>title</mat-label>
                <input matInput type="text" id="title" formControlName="name">

                @if (!REGEX.test(form.value.name!)) {
                    <mat-error>Only alphanumeric characters are allowed</mat-error>
                }
            </mat-form-field>
            @if (mode == 'modify') {
                <mat-form-field>
                    <mat-label>merge</mat-label>
                    <mat-select formControlName="merge">
                        <mat-option [value]="-1">Do not merge</mat-option>
                        @for (tag of other; track tag.id) {
                            <mat-option [value]="tag.id">{{ tag.name }}</mat-option>
                        }
                    </mat-select>
                </mat-form-field>
            }
        </form>
        <div class="formButtonContainer">
            <button (click)="REGEX.test(form.value.name!) ? (mode == 'create' ? add() : edit()) : console.log('invalid')" matButton="outlined" class="formButton">{{ mode }}
            </button>
            @if (mode == 'modify') {
                <button (click)="delete()" matButton="outlined" class="formButton">delete tag</button>
            }
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
        MatError,
    ],
})

export class TagSheet {

    readonly form;

    protected readonly other: Tag[]
    protected readonly mode: 'create' | 'modify'
    private _bottomSheetRef =
        inject<MatBottomSheetRef<TagSheet>>(MatBottomSheetRef);

    protected readonly REGEX = new RegExp("^[a-zA-Z0-9]+$")

    constructor(private stateService: StateService, protected readonly fb: FormBuilder, @Inject(MAT_BOTTOM_SHEET_DATA) public data: { id?: number }) {
        if (this.data == null) {
            this.form = fb.group({
                name: this.fb.control('', [Validators.pattern(this.REGEX), Validators.required]),
                merge: this.fb.control(-1)
            })
            this.other = []
            this.mode = 'create'
        } else {
            const tag = stateService.getTagById(this.data.id!)!
            this.form = fb.group({
                name: this.fb.control(tag.name, [Validators.pattern(this.REGEX), Validators.required]),
                merge: this.fb.control(-1)
            })
            this.other = this.stateService.tags().filter(t => t.id != this.data.id)
            this.mode = 'modify'
        }
    }

    add() {
        this.stateService.addTag({
            id: -1,
            name: this.form.value.name!.trim()
        })
        this._bottomSheetRef.dismiss()
    }

    edit() {
        if (this.form.value.name != this.stateService.getTagById(this.data.id!)!.name) {
            this.stateService.editTag({
                id: this.data.id!,
                name: this.form.value.name!,
            })
        }
        if (this.form.value.merge != undefined && this.form.value.merge != -1) {
            this.stateService.mergeTags(this.data.id!, this.form.value.merge)
        }
        this._bottomSheetRef.dismiss()
    }

    delete() {
        this.stateService.deleteTag(this.data.id!)
        this._bottomSheetRef.dismiss()
    }

    protected readonly console = console;
}