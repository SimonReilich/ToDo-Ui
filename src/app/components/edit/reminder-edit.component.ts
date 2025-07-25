import {Component, Inject, inject, input} from '@angular/core';
import {FormControl, FormsModule, ReactiveFormsModule} from '@angular/forms';
import {MatFormField, MatInput, MatLabel} from "@angular/material/input";
import {MatOption, MatSelect} from "@angular/material/select";
import {MatButton} from "@angular/material/button";
import {MatDatepicker, MatDatepickerInput, MatDatepickerToggle} from "@angular/material/datepicker";
import {MatTimepicker, MatTimepickerInput, MatTimepickerToggle} from "@angular/material/timepicker";
import {provideNativeDateAdapter} from "@angular/material/core";
import {MatListModule} from "@angular/material/list";
import {MAT_BOTTOM_SHEET_DATA, MatBottomSheet, MatBottomSheetRef} from "@angular/material/bottom-sheet";
import {Note} from "../../api/note.service";
import {Monitor, StateService} from "../../api/state.service";

@Component({
    selector: 'reminder-edit',
    providers: [provideNativeDateAdapter()],
    imports: [
        ReactiveFormsModule,
        MatButton,
        FormsModule,
    ],
    template: `
        <button (click)="openBottomSheet()" matButton="outlined" [disabled]="Monitor.waitingOnExcl()">edit</button>
    `,
    styles: `
    `
})
export class ReminderEditComponent {

    private _bottomSheet = inject(MatBottomSheet);

    id = input.required<number>()

    protected readonly Monitor = Monitor;

    openBottomSheet(): void {
        this._bottomSheet.open(EditReminderSheet, {data: {id: this.id()}})
    }
}

@Component({
    selector: 'edit-reminder-sheet',
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
                <input matInput required
                       [matTimepicker]="timepicker"
                       [(ngModel)]="value"
                       [ngModelOptions]="{updateOn: 'blur', standalone: true}">
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
            <mat-form-field>
                <mat-label>note</mat-label>
                <mat-select [formControl]="note">
                    <mat-option value="">none</mat-option>
                    @for (note of StateService.notes(); track note.id) {
                        <mat-option [value]="note.name">{{ note.name }}</mat-option>
                    }
                </mat-select>
            </mat-form-field>
        </form>
        <div class="formButtonContainer">
            <button (click)="edit()" matButton="outlined" class="formButton">confirm</button>
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

export class EditReminderSheet {

    title = new FormControl('');
    category = new FormControl('ToDo');
    note = new FormControl('');
    value: Date = new Date();

    private _bottomSheetRef =
        inject<MatBottomSheetRef<EditReminderSheet>>(MatBottomSheetRef);

    protected readonly StateService = StateService;

    constructor(private stateService: StateService, @Inject(MAT_BOTTOM_SHEET_DATA) public data: {id: number}) {

        const reminder = stateService.getReminderById(this.data.id)
        const assignedNote = StateService.notes().find(n => n.reminders.some(reminder => reminder.id == reminder.id))

        if (reminder != undefined) {
            this.title = new FormControl(reminder.title);
            this.category = new FormControl(reminder.category);
            this.value = new Date(reminder.date);
            if (assignedNote != undefined) {
                this.note = new FormControl(assignedNote.name)
            }
        }
    }

    edit() {
        this.stateService.editReminder({
            id: this.data.id,
            title: this.title.value!,
            category: this.category.value!,
            date: this.value.toDateString() + '\n' + this.value.getHours().toString().padStart(2, '0') + ':' + this.value.getMinutes().toString().padStart(2, '0'),
            done: this.stateService.getReminderById(this.data.id)!.done
        })

        StateService.notes().filter(n => {
            return n.reminders.some(r => r.id == this.data.id) || n.name == this.note.value
        }).forEach((note: Note) => {
            if (note.name == this.note.value) {
                if (note.reminders.some(r => r.id == this.data.id)) return;
                this.stateService.assignReminder(note.id, this.data.id)
            } else {
                this.stateService.removeReminder(note.id, this.data.id)
            }
        })
        this._bottomSheetRef.dismiss()
    }
}