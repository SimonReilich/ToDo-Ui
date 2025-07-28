import {Component, Inject, inject} from "@angular/core";
import {MatListModule} from "@angular/material/list";
import {MatFormField, MatInput} from "@angular/material/input";
import {FormControl, ReactiveFormsModule} from "@angular/forms";
import {MatOption, MatSelect} from "@angular/material/select";
import {MatButton} from "@angular/material/button";
import {MatLabel} from "@angular/material/form-field";
import {Tag} from "../../api/tag.service";
import {MAT_BOTTOM_SHEET_DATA, MatBottomSheetRef} from "@angular/material/bottom-sheet";
import {StateService} from "../../api/state.service";

@Component({
    selector: 'tag-sheet',
    template: `
        <form class="sheetForm">
            <mat-form-field>
                <mat-label>title</mat-label>
                <input matInput type="text" id="title" [formControl]="name" required>
            </mat-form-field>
            @if (mode == 'edit') {
                <mat-form-field>
                    <mat-label>merge</mat-label>
                    <mat-select [formControl]="merge">
                        <mat-option value="-1">Do not merge</mat-option>
                        @for (tag of other; track tag.id) {
                            <mat-option [value]="tag.id">{{ tag.name }}</mat-option>
                        }
                    </mat-select>
                </mat-form-field>
            }
        </form>
        <div class="formButtonContainer">
            <button (click)="mode == 'create' ? add() : edit()" matButton="outlined" class="formButton">confirm</button>
            @if (mode == 'edit') {
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
    ],
})

export class TagSheet {

    name = new FormControl('');
    merge = new FormControl(-1);

    protected readonly other: Tag[]
    protected readonly mode: 'create' | 'modify'
    private _bottomSheetRef =
        inject<MatBottomSheetRef<TagSheet>>(MatBottomSheetRef);

    constructor(private stateService: StateService, @Inject(MAT_BOTTOM_SHEET_DATA) public data: { id?: number }) {
        if (this.data == null || this.data.id == undefined) {
            this.other = []
            this.mode = 'create'
        } else {
            const tag = stateService.getTagById(this.data.id)
            if (tag != undefined) {
                this.name = new FormControl(tag.name)
            }
            this.other = this.stateService.tags().filter(t => t.id != this.data.id)
            this.mode = 'modify'
        }
    }

    add() {
        this.stateService.addTag({
            id: -1,
            name: this.name.value!.trim()
        })
        this._bottomSheetRef.dismiss()
    }

    edit() {
        if (this.name.value != this.stateService.getTagById(this.data.id!)!.name) {
            this.stateService.editTag({
                id: this.data.id!,
                name: this.name.value!,
            })
        }
        if (this.merge.value != undefined && this.merge.value != -1) {
            this.stateService.mergeTags(this.data.id!, this.merge.value)
        }
        this._bottomSheetRef.dismiss()
    }

    delete() {
        this.stateService.deleteTag(this.data.id!)
        this._bottomSheetRef.dismiss()
    }
}