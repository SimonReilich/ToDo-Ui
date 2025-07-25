import {Component, inject} from '@angular/core';
import {FormControl, ReactiveFormsModule} from '@angular/forms';
import {MatButton, MatFabButton} from "@angular/material/button";
import {MatFormField, MatInput} from "@angular/material/input";
import {MatLabel} from "@angular/material/form-field";
import {MatListModule} from "@angular/material/list";
import {MatBottomSheet, MatBottomSheetRef} from "@angular/material/bottom-sheet";
import {MatIconModule} from "@angular/material/icon";
import {Monitor, StateService} from "../../api/state.service";

@Component({
  selector: 'tag-creation',
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
export class TagCreationComponent {

  private _bottomSheet = inject(MatBottomSheet);

  openBottomSheet(): void {
    this._bottomSheet.open(CreateNoteSheet)
  }

  protected readonly StateService = StateService;
  protected readonly Monitor = Monitor;
}

@Component({
  selector: 'create-tag-sheet',
  template: `
        <form class="sheetForm">
            <mat-form-field>
                <mat-label>name</mat-label>
                <input matInput type="text" id="title" [formControl]="name" required>
            </mat-form-field>
        </form>
        <div class="formButtonContainer">
            <button (click)="add()" matButton="outlined" class="formButton">create</button>
        </div>`,
  imports: [
      MatListModule,
    MatFormField,
    ReactiveFormsModule,
    MatButton,
    MatInput,
    MatLabel,
  ],
})

export class CreateNoteSheet {

  name = new FormControl('');

  private _bottomSheetRef =
      inject<MatBottomSheetRef<CreateNoteSheet>>(MatBottomSheetRef);

  constructor(private stateService: StateService) {}

  add() {
    this.stateService.addTag({
      id: -1,
      name: this.name.value!.trim()
    })
    this._bottomSheetRef.dismiss()
  }
}