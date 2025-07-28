import {Component, computed, HostListener, input, Signal, signal} from "@angular/core";
import {MatButton} from "@angular/material/button";
import {MatCard} from "@angular/material/card";
import {MatCheckbox} from "@angular/material/checkbox";
import {MatGridList, MatGridTile} from "@angular/material/grid-list";
import {ReminderEditComponent} from "../edit/reminder-edit.component";
import {TagEditComponent} from "../edit/tag-edit.components";
import {Monitor, StateService} from "../../api/state.service";
import {NgStyle} from "@angular/common";
import {MatDivider} from "@angular/material/list";
import {Reminder} from "../../api/reminder.service";
import {toObservable} from "@angular/core/rxjs-interop";

@Component({
    selector: 'reminder-grid',
    imports: [
        MatButton,
        MatCard,
        MatCheckbox,
        MatDivider,
        MatGridList,
        MatGridTile,
        ReminderEditComponent,
        TagEditComponent,
        NgStyle

    ],
    template: `
        <mat-grid-list [cols]="cols()" rowHeight="fit" [ngStyle]="height()">
            @for (reminder of reminders()(); track reminder.id) {
                <mat-grid-tile>
                    <mat-card class="reminderItem card" appearance="raised">
                        <div class="header">
                            <span class="title">{{ reminder.title }}</span>
                            @if (reminder.tag != undefined) {
                                <tag-edit [tag]="reminder.tag"></tag-edit>
                            }
                            <span class="date">{{ reminder.date }}</span>
                        </div>
                        <mat-divider></mat-divider>
                        <div class="buttons buttonsRem">
                            <reminder-edit [id]="reminder.id" buttonStyle="outlined"></reminder-edit>
                            <button (click)="stateService.deleteReminder(reminder.id)" matButton="outlined"
                                    [disabled]="Monitor.waitingOnExcl()">delete
                            </button>
                            @if (!reminder.done) {
                                <button matButton="outlined"
                                        (click)="stateService.completeReminder(reminder.id)"
                                        [disabled]="Monitor.waitingOnExcl()">done
                                </button>
                            }
                            <mat-checkbox [checked]="reminder.done" [disabled]="true"></mat-checkbox>
                        </div>
                    </mat-card>
                </mat-grid-tile>
            }
        </mat-grid-list>
    `
})
export class ReminderGridComponent {

    public readonly reminders = input.required<Signal<Reminder[]>>()
    public readonly colsConfig = input.required<number>()

    protected readonly cols = signal(1)
    protected readonly height = computed(() => {
        return {'height': (Math.ceil(this.reminders()().length / this.cols()) * 11) + 'rem'};
    })

    protected readonly Monitor = Monitor

    constructor(protected readonly stateService: StateService) {
        toObservable(this.colsConfig).subscribe(_ => this.sizeChange(0))
    }

    @HostListener('window:resize', ['$event'])
    sizeChange(_: any) {
        this.cols.update(_ => this.calculateCols())
    }

    calculateCols() {
        if (this.colsConfig() > 0) {
            return this.colsConfig()
        } else {
            return Math.floor(window.innerWidth / 400)
        }
    }
}