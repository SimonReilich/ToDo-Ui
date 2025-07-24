import {Component, Inject, inject, input, output} from '@angular/core';
import {Reminder, ReminderService} from "../api/reminder.service";
import {FormControl, FormsModule, ReactiveFormsModule} from '@angular/forms';
import {MatFormField, MatInput, MatLabel} from "@angular/material/input";
import {MatOption, MatSelect} from "@angular/material/select";
import {MatButton} from "@angular/material/button";
import {MatDatepicker, MatDatepickerInput, MatDatepickerToggle} from "@angular/material/datepicker";
import {MatTimepicker, MatTimepickerInput, MatTimepickerToggle} from "@angular/material/timepicker";
import {provideNativeDateAdapter} from "@angular/material/core";
import {MatListModule} from "@angular/material/list";
import {MAT_BOTTOM_SHEET_DATA, MatBottomSheet, MatBottomSheetRef} from "@angular/material/bottom-sheet";
import {Note, NoteService} from "../api/note.service";

@Component({
    selector: 'reminder-edit-component',
    providers: [provideNativeDateAdapter()],
    imports: [
        ReactiveFormsModule,
        MatButton,
        FormsModule,
    ],
    template: `
        <button (click)="openBottomSheet()" matButton="outlined" class="open">edit</button>
    `,
    styles: `
    `
})
export class RemindereditComponent {

    refresh = output<number>();

    private _bottomSheet = inject(MatBottomSheet);

    id = input.required<number>()

    openBottomSheet(): void {
        this._bottomSheet.open(CreateReminderSheet, {data: {id: this.id()}}).afterDismissed().subscribe(_ => {
            this.refresh.emit(this.id())
        })
    }
}

@Component({
    selector: 'create-reminder-sheet',
    template: `
        <form>
            <mat-form-field>
                <mat-label>title</mat-label>
                <input matInput type="text" id="title" [formControl]="title" required>
            </mat-form-field>

            <mat-form-field>
                <mat-label>date</mat-label>
                <input matInput [matDatepicker]="picker" [(ngModel)]="value" [ngModelOptions]="{standalone: true}" required>
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
                <mat-select [formControl]="imp">
                    <mat-option value="ToDo">ToDo</mat-option>
                    <mat-option value="Important">Important</mat-option>
                </mat-select>
            </mat-form-field>
            <mat-form-field>
                <mat-label>note</mat-label>
                <mat-select [formControl]="note">
                    <mat-option value="">none</mat-option>
                    @for (note of notes; track note.id) {
                        <mat-option [value]="note.name">{{ note.name }}</mat-option>
                    }
                </mat-select>
            </mat-form-field>
        </form>
        <button (click)="edit()" matButton="outlined" class="formButton">confirm</button>`,
    providers: [provideNativeDateAdapter()],
    imports: [MatListModule, MatFormField, ReactiveFormsModule, MatSelect, MatOption, MatButton, MatInput, MatLabel, MatDatepickerInput, FormsModule, MatDatepickerToggle, MatDatepicker, MatTimepickerInput, MatTimepicker, MatTimepickerToggle,],
})

export class CreateReminderSheet {
    title = new FormControl('');
    imp = new FormControl('ToDo');
    note = new FormControl('');
    value: Date = new Date();
    notes: Note[] = [];

    private _bottomSheetRef =
        inject<MatBottomSheetRef<CreateReminderSheet>>(MatBottomSheetRef);

    constructor(private reminderService: ReminderService, private noteService: NoteService, @Inject(MAT_BOTTOM_SHEET_DATA) public data: {id: number}) {
        this.noteService.getAll().subscribe(notes => this.notes = notes);
        const self = this
        reminderService.get(data.id).subscribe(reminder => {
            self.title = new FormControl(reminder.title);
            self.imp = new FormControl(reminder.category);
            self.value = new Date(reminder.date);
            self.noteService.getAll().subscribe(notes => {
                notes.forEach(note => {
                    if (note.reminders.find(r => r.id == reminder.id)) {
                        self.note = new FormControl(note.name)
                    }
                })
            })
        })
    }

    edit() {
        this.reminderService.update(<Reminder>{
            id: this.data.id,
            title: this.title.value,
            category: this.imp.value,
            date: this.value.toDateString() + '\n' + this.value.getHours().toString().padStart(2, '0') + ':' + this.value.getMinutes().toString().padStart(2, '0')
        }).subscribe(r => {
            this.noteService.getAll().subscribe(notes => notes.forEach(note => {
                if (this.note.value != undefined && note.name.trim().toLowerCase() === this.note.value.toLowerCase()) {
                    this.noteService.addReminder(note.id, this.data.id)
                } else {
                    this.noteService.removeReminder(note.id, this.data.id)
                }
            }))
            this._bottomSheetRef.dismiss()
        });
    }
}