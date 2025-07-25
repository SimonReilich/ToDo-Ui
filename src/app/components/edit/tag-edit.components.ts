import {Component, Inject, inject, input} from '@angular/core';
import {MAT_BOTTOM_SHEET_DATA, MatBottomSheet, MatBottomSheetRef} from "@angular/material/bottom-sheet";
import {Monitor, StateService} from "../../api/state.service";
import {FormControl, ReactiveFormsModule} from "@angular/forms";
import {Tag} from "../../api/tag.service";
import {MatListModule} from "@angular/material/list";
import {MatFormField, MatInput} from "@angular/material/input";
import {MatOption, MatSelect} from "@angular/material/select";
import {MatButton} from "@angular/material/button";
import {MatLabel} from "@angular/material/form-field";
import {MatChip} from "@angular/material/chips";

@Component({
    selector: 'tag-edit',
    imports: [
        MatChip
    ],
    template: `
        <mat-chip (click)="openBottomSheet()" [disabled]="Monitor.waitingOnExcl()">{{ tag().name }}</mat-chip>
    `,
    styles: `
    `
})
export class TagEditComponent {

    tag = input.required<Tag>()
    protected readonly Monitor = Monitor;
    private _bottomSheet = inject(MatBottomSheet);

    openBottomSheet(): void {
        this._bottomSheet.open(CreateNoteSheet, {data: {id: this.tag().id}});
    }
}

@Component({
    selector: 'edit-tag-sheet',
    template: `
      <form class="sheetForm">
        <mat-form-field>
          <mat-label>title</mat-label>
          <input matInput type="text" id="title" [formControl]="name" required>
        </mat-form-field>
        <mat-form-field>
          <mat-label>merge</mat-label>
          <mat-select [formControl]="merge">
            <mat-option value="-1">Do not merge</mat-option>
            @for (tag of other; track tag.id) {
              <mat-option [value]="tag.id">{{ tag.name }}</mat-option>
            }
          </mat-select>
        </mat-form-field>
      </form>
      <div class="formButtonContainer">
        <button (click)="edit()" matButton="outlined" class="formButton">confirm</button>
        <button (click)="delete()" matButton="outlined" class="formButton">delete tag</button>
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

export class CreateNoteSheet {

    name = new FormControl('');
    merge = new FormControl(-1);

    protected readonly other: Tag[]
    private _bottomSheetRef =
        inject<MatBottomSheetRef<CreateNoteSheet>>(MatBottomSheetRef);

  protected readonly StateService = StateService;

    constructor(private stateService: StateService, @Inject(MAT_BOTTOM_SHEET_DATA) public data: { id: number }) {
        const tag = stateService.getTagById(this.data.id)
        if (tag != undefined) {
            this.name = new FormControl(tag.name)
        }
        this.other = StateService.tags().filter(t => t.id != this.data.id)
    }

    edit() {
        if (this.name.value != this.stateService.getTagById(this.data.id)!.name) {
            this.stateService.editTag({
                id: this.data.id,
                name: this.name.value!,
            })
        }
        if (this.merge.value != undefined && this.merge.value != -1) {
            this.stateService.mergeTags(this.data.id, this.merge.value)
        }
        this._bottomSheetRef.dismiss()
    }

    delete() {
        this.stateService.deleteTag(this.data.id)
        this._bottomSheetRef.dismiss()
    }
}