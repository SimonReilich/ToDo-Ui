import {Component, inject} from '@angular/core';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {MatFabButton} from "@angular/material/button";
import {provideNativeDateAdapter} from "@angular/material/core";
import {MatBottomSheet} from "@angular/material/bottom-sheet";
import {MatIcon, MatIconModule} from "@angular/material/icon";
import {Monitor} from "../../api/state.service";
import {ReminderSheet} from "../sheets/reminder-sheet.component";

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
        <button (click)="openBottomSheet()" matFab class="open" [disabled]="Monitor.waitingOnExcl()">
            <mat-icon fontIcon="add"></mat-icon>
        </button>
    `,
    styles: `
    `
})
export class ReminderCreationComponent {

    protected readonly Monitor = Monitor;

    private _bottomSheet = inject(MatBottomSheet);

    openBottomSheet(): void {
        this._bottomSheet.open(ReminderSheet)
    }
}