import {Component, computed, HostListener, input, Signal, signal} from "@angular/core";
import {MatButton} from "@angular/material/button";
import {MatCard, MatCardActions, MatCardContent, MatCardHeader, MatCardTitle} from "@angular/material/card";
import {MatCheckbox} from "@angular/material/checkbox";
import {MatGridList, MatGridTile} from "@angular/material/grid-list";
import {NoteEditComponent} from "../edit/note-edit.component";
import {ReminderEditComponent} from "../edit/reminder-edit.component";
import {TagEditComponent} from "../edit/tag-edit.components";
import {Monitor, StateService} from "../../api/state.service";
import {NgStyle} from "@angular/common";
import {Note} from "../../api/note.service";
import {MatDivider} from "@angular/material/list";
import {toObservable} from "@angular/core/rxjs-interop";

@Component({
    selector: 'note-grid',
    imports: [
        MatButton,
        MatCard,
        MatCardActions,
        MatCardContent,
        MatCardHeader,
        MatCardTitle,
        MatCheckbox,
        MatDivider,
        MatGridList,
        MatGridTile,
        NoteEditComponent,
        ReminderEditComponent,
        TagEditComponent,
        NgStyle

    ],
    template: `
        <mat-grid-list [cols]="cols()" rowHeight="fit" [ngStyle]="height()">
            @for (note of notes()(); track note.id) {
                <mat-grid-tile>
                    <mat-card appearance="raised" class="card">
                        <mat-card-header>
                            <mat-card-title>{{ note.name }}</mat-card-title>
                            @if (note.tag != undefined) {
                                <tag-edit [tag]="note.tag"></tag-edit>
                            }
                        </mat-card-header>
                        <mat-divider></mat-divider>
                        <mat-card-content>
                            <p class="desc">{{ note.description }}</p>
                            @for (reminder of note.reminders; track reminder.id) {
                                <mat-divider></mat-divider>
                                <div class="reminderItem">
                                    <div class="header">
                                        <span>{{ reminder.title }}</span>
                                        @if (reminder.tag != undefined) {
                                            <tag-edit [tag]="reminder.tag"></tag-edit>
                                        }
                                        <span class="date">{{ reminder.date }}</span>
                                    </div>
                                    <div class="buttons">
                                        <reminder-edit [id]="reminder.id" buttonStyle="text"></reminder-edit>
                                        <button (click)="stateService.removeReminder(note.id, reminder.id)"
                                                matButton [disabled]="Monitor.waitingOnExcl()">remove
                                        </button>
                                        @if (!reminder.done) {
                                            <button matButton
                                                    (click)="stateService.completeReminder(reminder.id)"
                                                    [disabled]="Monitor.waitingOnExcl()">done
                                            </button>
                                        }
                                        <mat-checkbox [checked]="reminder.done"
                                                      [disabled]="true"></mat-checkbox>
                                    </div>
                                </div>
                            }
                        </mat-card-content>
                        <mat-divider></mat-divider>
                        <mat-card-actions>
                            <note-edit [id]="note.id"></note-edit>
                            <button matButton="outlined" (click)="stateService.deleteNote(note.id)"
                                    [disabled]="Monitor.waitingOnExcl()">delete
                            </button>
                        </mat-card-actions>
                    </mat-card>
                </mat-grid-tile>
            }
        </mat-grid-list>
    `
})
export class NoteGridComponent {

    public readonly notes = input.required<Signal<Note[]>>()
    public readonly colsConfig = input.required<number>()

    protected readonly cols = signal(1)
    protected readonly height = computed(() => {
        try {
            return {'height': (Math.ceil(this.notes()().length / this.cols()) * (16 + (8 * (this.notes()().reduce(((acc, n, _, __) => (n.reminders.length > acc.reminders.length) ? n : acc), this.notes()().at(0)!)).reminders.length))) + 'rem'};
        } catch (error) {
            return {'height': (Math.ceil(this.notes()().length / this.cols()) * 16) + 'rem'};
        }
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