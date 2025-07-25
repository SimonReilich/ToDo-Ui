import {Component, inject} from '@angular/core';
import {FormControl, FormsModule, ReactiveFormsModule} from '@angular/forms';
import {MatFormField, MatInput, MatLabel} from "@angular/material/input";
import {MatOption, MatSelect} from "@angular/material/select";
import {MatButton, MatFabButton} from "@angular/material/button";
import {MatDatepicker, MatDatepickerInput, MatDatepickerToggle} from "@angular/material/datepicker";
import {MatTimepicker, MatTimepickerInput, MatTimepickerToggle} from "@angular/material/timepicker";
import {provideNativeDateAdapter} from "@angular/material/core";
import {MatListModule} from "@angular/material/list";
import {MatBottomSheet, MatBottomSheetRef} from "@angular/material/bottom-sheet";
import {MatIcon, MatIconModule} from "@angular/material/icon";
import {Monitor, StateService} from "../../api/state.service";

@Component({
    selector: 'reminder-creation',
    providers: [provideNativeDateAdapter()],
    imports: [
        ReactiveFormsModule,
        FormsModule,
        MatFabButton,
        MatIcon,
        MatIconModule,
    ],
    template: `
        <button (click)="openBottomSheet()" matFab class="open" [disabled]="Monitor.waitingOnExcl()"><mat-icon fontIcon="add"></mat-icon></button>
    `,
    styles: `
    `
})
export class ReminderCreationComponent {

    protected readonly Monitor = Monitor;

    private _bottomSheet = inject(MatBottomSheet);

    openBottomSheet(): void {
        this._bottomSheet.open(CreateReminderSheet)
    }
}

@Component({
    selector: 'create-reminder-sheet',
    template: `
        <form class="sheetForm">
            <mat-form-field>
                <mat-label>title</mat-label>
                <input matInput type="text" id="title" [formControl]="title" required>
            </mat-form-field>

            <mat-form-field>
                <mat-label>date</mat-label>
                <input matInput [matDatepicker]="picker" [(ngModel)]="value" [ngModelOptions]="{standalone: true}"
                       required>
                <mat-datepicker-toggle [for]="picker" matSuffix/>
                <mat-datepicker #picker></mat-datepicker>
            </mat-form-field>

            <mat-form-field>
                <mat-label>time</mat-label>
                <input matInput
                       [matTimepicker]="timepicker"
                       [(ngModel)]="value"
                       [ngModelOptions]="{updateOn: 'blur', standalone: true}" required>
                <mat-timepicker #timepicker/>
                <mat-timepicker-toggle [for]="timepicker" matSuffix/>
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
            <button (click)="add()" matButton="outlined" class="formButton">create</button>
        </div>
    `,
    providers: [provideNativeDateAdapter()],
    imports: [
        MatListModule,
        MatFormField,
        ReactiveFormsModule,
        MatSelect,
        MatOption,
        MatButton,
        MatInput,
        MatLabel,
        MatDatepickerInput,
        FormsModule,
        MatDatepickerToggle,
        MatDatepicker,
        MatTimepickerInput,
        MatTimepicker,
        MatTimepickerToggle,
    ],
})

export class CreateReminderSheet {

    title = new FormControl('');
    category = new FormControl('ToDo');
    value: Date = new Date();

    private _bottomSheetRef =
        inject<MatBottomSheetRef<CreateReminderSheet>>(MatBottomSheetRef);

    constructor(private stateService: StateService) {}

    add() {
        this.stateService.addReminder({
            id: -1,
            title: this.title.value!.trim(),
            category: this.category.value!,
            date: this.value.toDateString() + '\n' + this.value.getHours().toString().padStart(2, '0') + ':' + this.value.getMinutes().toString().padStart(2, '0'),
            done: false
        })
        this._bottomSheetRef.dismiss()
    }
}