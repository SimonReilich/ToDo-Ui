import {Component, Inject, inject} from "@angular/core";
import {provideNativeDateAdapter} from "@angular/material/core";
import {MatListModule} from "@angular/material/list";
import {MatFormField, MatInput, MatLabel} from "@angular/material/input";
import {FormBuilder, FormsModule, ReactiveFormsModule, Validators} from "@angular/forms";
import {MatOption, MatSelect} from "@angular/material/select";
import {MatButton} from "@angular/material/button";
import {MatDatepicker, MatDatepickerInput, MatDatepickerToggle} from "@angular/material/datepicker";
import {MatTimepicker, MatTimepickerInput, MatTimepickerToggle} from "@angular/material/timepicker";
import {MAT_BOTTOM_SHEET_DATA, MatBottomSheetRef} from "@angular/material/bottom-sheet";
import {StateService} from "../../api/state.service";
import {Note} from "../../api/note.service";


@Component({
    selector: 'reminder-sheet',
    template: `
        <form class="sheetForm" [formGroup]="form">
            <mat-form-field>
                <mat-label>title</mat-label>
                <input matInput type="text" id="title" formControlName="title" required>
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
                <mat-label>tag</mat-label>
                <mat-select formControlName="tag">
                    <mat-option [value]="-1">no tag</mat-option>
                    @for (tag of stateService.tags(); track tag.id) {
                        <mat-option [value]="tag.id">{{ tag.name }}</mat-option>
                    }
                </mat-select>
            </mat-form-field>
            <mat-form-field>
                <mat-label>note</mat-label>
                <mat-select formControlName="note">
                    <mat-option value="">none</mat-option>
                    @for (note of stateService.notes(); track note.id) {
                        <mat-option [value]="note.id">{{ note.name }}</mat-option>
                    }
                </mat-select>
            </mat-form-field>
        </form>
        <div class="formButtonContainer">
            <button (click)="mode == 'create' ? add() : edit()" matButton="outlined" class="formButton">confirm</button>
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

export class ReminderSheet {
    readonly form;
    value: Date = new Date();
    protected readonly mode: 'create' | 'modify'
    private _bottomSheetRef =
        inject<MatBottomSheetRef<ReminderSheet>>(MatBottomSheetRef);

    constructor(protected stateService: StateService, protected readonly fb: FormBuilder, @Inject(MAT_BOTTOM_SHEET_DATA) public data: {
        id?: number
    }) {

        if (this.data == null) {
            this.form = fb.group({
                title: this.fb.control('', [Validators.required]),
                tag: this.fb.control(-1, [Validators.required]),
                note: this.fb.control(-1, [Validators.required]),
            })
            this.mode = 'create'
        } else {
            const reminder = stateService.getReminderById(this.data.id!)!
            const assignedNote = this.stateService.notes().find(n => n.reminders.some(reminder => reminder.id == reminder.id))
            this.form = fb.group({
                title: this.fb.control(reminder.title, [Validators.required]),
                tag: this.fb.control(reminder.tag == undefined ? -1 : reminder.tag.id, [Validators.required]),
                note: this.fb.control(assignedNote == undefined ? -1 : assignedNote.id, [Validators.required]),
            })
            this.value = new Date(reminder.date);
            this.mode = 'modify'
        }
    }

    add() {
        this.stateService.createAndAssignReminder(this.form.value.note!, {
            id: -1,
            title: this.form.value.title!.trim(),
            date: this.value.toDateString() + '\n' + this.value.getHours().toString().padStart(2, '0') + ':' + this.value.getMinutes().toString().padStart(2, '0'),
            done: false,
            tag: this.stateService.getTagById(this.form.value.tag!),
        })
        this._bottomSheetRef.dismiss()
    }

    edit() {
        this.stateService.editReminder({
            id: this.data.id!,
            title: this.form.value.title!,
            date: this.value.toDateString() + '\n' + this.value.getHours().toString().padStart(2, '0') + ':' + this.value.getMinutes().toString().padStart(2, '0'),
            done: this.stateService.getReminderById(this.data.id!)!.done,
            tag: this.stateService.getTagById(this.form.value.tag!),
        })

        this.stateService.notes().filter(n => {
            return n.reminders.some(r => r.id == this.data.id) || n.id == this.form.value.note
        }).forEach((note: Note) => {
            if (this.stateService.getNoteById(this.form.value.note!) != undefined && note.name == this.stateService.getNoteById(this.form.value.note!)!.name) {
                if (note.reminders.some(r => r.id == this.data.id)) return;
                this.stateService.assignReminder(note.id, this.data.id!)
            } else {
                this.stateService.removeReminder(note.id, this.data.id!)
            }
        })
        this._bottomSheetRef.dismiss()
    }
}