import {Component, inject, input} from '@angular/core';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {MatButton} from "@angular/material/button";
import {provideNativeDateAdapter} from "@angular/material/core";
import {MatBottomSheet} from "@angular/material/bottom-sheet";
import {Monitor} from "../../api/state.service";
import {ReminderSheet} from "../sheets/reminder-sheet.component";

@Component({
    selector: 'reminder-edit',
    providers: [provideNativeDateAdapter()],
    imports: [
        ReactiveFormsModule,
        MatButton,
        FormsModule,
    ],
    template: `
        <button (click)="openBottomSheet()" [matButton]="buttonStyle()" [disabled]="Monitor.waitingOnExcl()">edit
        </button>
    `,
    styles: `
    `
})
export class ReminderEditComponent {

    id = input.required<number>()
    buttonStyle = input.required<"outlined" | "text">()
    protected readonly Monitor = Monitor;
    private _bottomSheet = inject(MatBottomSheet);

    openBottomSheet(): void {
        this._bottomSheet.open(ReminderSheet, {data: {id: this.id()}})
    }
}