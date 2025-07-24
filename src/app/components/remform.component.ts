import {Component, inject, output} from '@angular/core';
import {Reminder, ReminderService} from "../api/reminder.service";
import {FormControl, FormsModule, ReactiveFormsModule} from '@angular/forms';
import {MatFormField, MatInput, MatLabel} from "@angular/material/input";
import {MatOption, MatSelect} from "@angular/material/select";
import {MatButton} from "@angular/material/button";
import {MatDatepicker, MatDatepickerInput, MatDatepickerToggle} from "@angular/material/datepicker";
import {MatTimepicker, MatTimepickerInput, MatTimepickerToggle} from "@angular/material/timepicker";
import {provideNativeDateAdapter} from "@angular/material/core";
import {MatListModule} from "@angular/material/list";
import {MatBottomSheet, MatBottomSheetRef} from "@angular/material/bottom-sheet";
import {NoteService} from "../api/note.service";

@Component({
    selector: 'rem-form-component',
    providers: [provideNativeDateAdapter()],
    imports: [
        ReactiveFormsModule,
        MatButton,
        FormsModule,
    ],
    template: `
        <button (click)="openBottomSheet()" matButton="outlined" class="open">add</button>
    `,
    styles: `
    .open {
      margin-bottom: 2rem;
    }
    `
})
export class RemformComponent {

    refresh = output<void>();

    private _bottomSheet = inject(MatBottomSheet);

    openBottomSheet(): void {
        this._bottomSheet.open(CreateReminderSheet).afterDismissed().subscribe(_ => {
            this.refresh.emit()
        })
    }
}

@Component({
    selector: 'create-reminder-sheet',
    template: `
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
                <mat-label>category</mat-label>
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
        <button (click)="add()" matButton="outlined">create</button>`,
    providers: [provideNativeDateAdapter()],
    imports: [MatListModule, MatFormField, ReactiveFormsModule, MatSelect, MatOption, MatButton, MatInput, MatLabel, MatDatepickerInput, FormsModule, MatDatepickerToggle, MatDatepicker, MatTimepickerInput, MatTimepicker, MatTimepickerToggle,
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
        MatDatepickerInput,],
})

export class CreateReminderSheet {
    title = new FormControl('');
    imp = new FormControl('ToDo');
    note = new FormControl('');
    value: Date = new Date();
    private _bottomSheetRef =
        inject<MatBottomSheetRef<CreateReminderSheet>>(MatBottomSheetRef);

    constructor(private reminderService: ReminderService, private noteService: NoteService) {
    }

    openLink(event: MouseEvent): void {
        this._bottomSheetRef.dismiss();
        event.preventDefault();
    }

    add() {
        this.reminderService.create(<Reminder>{
            id: 0,
            title: this.title.value,
            category: this.imp.value,
            date: this.value.toDateString() + '\n' + this.value.getHours().toString().padStart(2, '0') + ':' + this.value.getMinutes().toString().padStart(2, '0')
        }).subscribe(r => {
            this.noteService.getAll().subscribe(notes => notes.forEach(note => {
                if (this.note.value != undefined && note.name.trim().toLowerCase() === this.note.value.toLowerCase()) {
                    this.noteService.addReminder(note.id, r.id)
                }
            }))
        });
        this._bottomSheetRef.dismiss();
    }
}