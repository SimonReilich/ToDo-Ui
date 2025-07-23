import {Component, output} from '@angular/core';
import {Reminder, ReminderService} from "../api/reminder.service";
import {FormControl, FormsModule, ReactiveFormsModule} from '@angular/forms';
import {MatFormField, MatInput, MatLabel} from "@angular/material/input";
import {MatOption, MatSelect} from "@angular/material/select";
import {MatButton} from "@angular/material/button";
import {MatDatepicker, MatDatepickerInput, MatDatepickerToggle} from "@angular/material/datepicker";
import {MatTimepicker, MatTimepickerInput, MatTimepickerToggle} from "@angular/material/timepicker";
import {provideNativeDateAdapter} from "@angular/material/core";

@Component({
    selector: 'rem-form-component',
    providers: [provideNativeDateAdapter()],
    imports: [
        ReactiveFormsModule,
        MatFormField,
        MatLabel,
        MatOption,
        MatSelect,
        MatButton,
        MatInput,
        MatDatepicker,
        MatDatepickerToggle,
        MatTimepicker,
        MatTimepickerToggle,
        MatTimepickerInput,
        FormsModule,
        MatDatepickerInput,
    ],
    template: `
        @if (create) {
            <form>
                <mat-form-field>
                    <mat-label>title</mat-label>
                    <input matInput type="text" id="title" [formControl]="title">
                </mat-form-field>

                <mat-form-field>
                    <mat-label>Meeting date</mat-label>
                    <input matInput [matDatepicker]="picker" [(ngModel)]="value" [ngModelOptions]="{standalone: true}">
                    <mat-datepicker-toggle [for]="picker" matSuffix/>
                    <mat-datepicker #picker></mat-datepicker>
                </mat-form-field>

                <mat-form-field>
                    <mat-label>Meeting time</mat-label>
                    <input matInput
                           [matTimepicker]="timepicker"
                           [(ngModel)]="value"
                           [ngModelOptions]="{updateOn: 'blur', standalone: true}">
                    <mat-timepicker #timepicker/>
                    <mat-timepicker-toggle [for]="timepicker" matSuffix/>
                </mat-form-field>

                <mat-form-field>
                    <mat-label>important</mat-label>
                    <mat-select [formControl]="imp">
                        <mat-option value="ToDo">ToDo</mat-option>
                        <mat-option value="Important">Important</mat-option>
                    </mat-select>
                </mat-form-field>
                <mat-form-field>
                    <mat-label>Note (optional)</mat-label>
                    <input matInput type="text" id="note" [formControl]="note">
                </mat-form-field>
            </form>
            <button (click)="add()" matButton="outlined">create</button>
            <button (click)="toggleCreate()" matButton="outlined">cancel</button>
        } @else {
            <button (click)="toggleCreate()" matButton="outlined">add</button>
        }
    `,
    styles: ``
})
export class RemformComponent {

    title = new FormControl('');
    imp = new FormControl('');
    note = new FormControl('');
    value: Date = new Date();
    saved = output<Reminder>();
    attach = output<[number, string]>();
    protected create = false;

    constructor(private readonly reminderService: ReminderService) {
    }

    add() {
        const note = this.note.value!;
        this.reminderService.create(<Reminder>{
            id: 0,
            title: this.title.value,
            category: this.imp.value,
            date: this.value.toDateString() + '\n' + this.value.getHours().toString().padStart(2, '0') + ':' + this.value.getMinutes().toString().padStart(2, '0')
        }).subscribe(reminder => {
            this.saved.emit(reminder)
            this.attach.emit([reminder.id, note])
        })
        this.toggleCreate()
    }

    toggleCreate() {
        this.create = !this.create
        if (!this.create) {
            this.title.reset()
            this.imp.reset()
            this.note.reset()
        }
    }
}
