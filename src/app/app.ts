import {Component, computed, HostListener, OnDestroy, Signal, signal} from '@angular/core';
import {RouterOutlet} from '@angular/router';
import {Note, NoteService} from "./api/note.service";
import {NoteformComponent} from "./components/noteform.component";
import {Reminder, ReminderService} from "./api/reminder.service";
import {ReminderformComponent} from "./components/reminderform.component";
import {MatCard, MatCardActions, MatCardContent, MatCardHeader, MatCardTitle} from "@angular/material/card";
import {MatButton} from "@angular/material/button";
import {MatGridList, MatGridTile} from "@angular/material/grid-list";
import {MatDivider} from "@angular/material/list";
import {MatChip} from "@angular/material/chips";
import {MatCheckbox} from "@angular/material/checkbox";
import {NgStyle} from "@angular/common";
import {NoteeditComponent} from "./components/noteedit.component";
import {RemindereditComponent} from "./components/reminderedit.component";
import {MatTab, MatTabGroup} from "@angular/material/tabs";
import {MatToolbar} from "@angular/material/toolbar";
import {StateService} from "./api/state.service";
import {MatProgressSpinner} from "@angular/material/progress-spinner";

interface NoteMessage {
    type: 'D' | 'C' | 'E' | 'ER' | 'DR' | 'L';
    note?: Note;
    reminder?: Reminder;
}

interface RemMessage {
    type: 'D' | 'C' | 'E' | 'L';
    reminder?: Reminder;
}

@Component({
    selector: 'td-root',
    imports: [RouterOutlet, NoteformComponent, ReminderformComponent, MatCard, MatCardHeader, MatCardContent, MatCardActions, MatButton, MatCardTitle, MatGridList, MatGridTile, MatChip, MatDivider, MatCheckbox, NgStyle, NoteeditComponent, RemindereditComponent, MatTabGroup, MatTab, MatToolbar, MatProgressSpinner,],
    template: `
        <mat-toolbar>
            <span>Welcome to {{ title() }}</span>
            @if (StateService.working()) {
                <span class="spacer"></span>
                <mat-spinner diameter="23"></mat-spinner>
            }
        </mat-toolbar>


        <mat-tab-group>
            <mat-tab label="Notes">
                <mat-grid-list [cols]="cols()" rowHeight="fit" [ngStyle]="noteHeight()">
                    @for (note of StateService.notes(); track note.id) {
                        <mat-grid-tile>
                            <mat-card appearance="outlined" class="card">
                                <mat-card-header>
                                    <mat-card-title>{{ note.name }}</mat-card-title>
                                    <mat-chip>{{ note.category }}</mat-chip>
                                </mat-card-header>
                                <mat-divider></mat-divider>
                                <mat-card-content>
                                    <p class="desc">{{ note.description }}</p>
                                    @for (reminder of note.reminders; track reminder.id) {
                                        <mat-divider></mat-divider>
                                        <div class="reminderItem">
                                            <div class="header">
                                                <span>{{ reminder.title }}</span>
                                                <mat-chip>{{ reminder.category }}</mat-chip>
                                                <span class="date">{{ reminder.date }}</span>
                                            </div>
                                            <div class="buttons">
                                                <button (click)="stateService.removeReminder(note.id, reminder.id)" matButton [disabled]="StateService.working()">remove
                                                </button>
                                                @if (!reminder.done) {
                                                    <button matButton (click)="stateService.completeReminder(reminder.id)" [disabled]="StateService.working()">done</button>
                                                }
                                                <mat-checkbox [checked]="reminder.done" [disabled]="true"></mat-checkbox>
                                            </div>
                                        </div>
                                    }
                                </mat-card-content>
                                <mat-divider></mat-divider>
                                <mat-card-actions>
                                    <note-edit-component [id]="note.id" (refresh)="stateService.updateNotes()"></note-edit-component>
                                    <button matButton="outlined" (click)="stateService.deleteNote(note.id)" [disabled]="StateService.working()">delete</button>
                                </mat-card-actions>
                            </mat-card>
                        </mat-grid-tile>
                    }
                </mat-grid-list>

                <note-form-component></note-form-component>

            </mat-tab>
            <mat-tab label="Reminders">


                <mat-grid-list [cols]="cols()" rowHeight="fit" [ngStyle]="reminderHeight()">
                    @for (reminder of StateService.reminders(); track reminder.id) {
                        <mat-grid-tile>
                            <mat-card class="reminderItem card" appearance="outlined">
                                <div class="header">
                                    <span class="title">{{ reminder.title }}</span>
                                    <mat-chip>{{ reminder.category }}</mat-chip>
                                    <span class="date">{{ reminder.date }}</span>
                                </div>
                                <div class="buttons buttonsRem">
                                    <reminder-edit-component [id]="reminder.id"></reminder-edit-component>
                                    <button (click)="stateService.deleteReminder(reminder.id)" matButton="outlined" [disabled]="StateService.working()">delete</button>
                                    @if (!reminder.done) {
                                        <button matButton="outlined" (click)="stateService.completeReminder(reminder.id)" [disabled]="StateService.working()">done</button>
                                    }
                                    <mat-checkbox [checked]="reminder.done" [disabled]="true"></mat-checkbox>
                                </div>
                            </mat-card>
                        </mat-grid-tile>
                    }
                </mat-grid-list>

                <reminder-form-component></reminder-form-component>
            </mat-tab>
            
            <mat-tab label="Tags">
                
            </mat-tab>
            
            <mat-tab label="Search">
                
            </mat-tab>
        </mat-tab-group>

        <router-outlet/>
    `,
    styles: `
    `,
})
export class App {
    protected readonly title = signal('notes');

    protected readonly noteService: NoteService;
    protected readonly reminderService: ReminderService;
    protected readonly stateService: StateService;

    protected readonly cols = signal(3);
    protected readonly reminderHeight = computed(() => {
        return {'height': (Math.ceil(StateService.reminders().length / this.cols()) * 10) + 'rem'};
    });
    protected readonly noteHeight = computed(() => {
        try {
            return {'height': (Math.ceil(StateService.notes().length / this.cols()) * (16 + (8 * (StateService.notes().reduce(((acc, n, _, __) => (n.reminders.length > acc.reminders.length) ? n : acc), StateService.notes().at(0)!)).reminders.length))) + 'rem'};
        } catch (error) {
            return {'height': (Math.ceil(StateService.notes().length / this.cols()) * 16) + 'rem'};
        }
    });

    constructor(protected readonly nService: NoteService, protected readonly rService: ReminderService, protected readonly sService: StateService) {
        this.noteService = nService;
        this.reminderService = rService;
        this.stateService = sService

        this.cols.update(_ => this.calculateCols())
        setTimeout(() => this.title.set("your notes"), 2000)
    }

    @HostListener('window:resize', ['$event'])
    sizeChange(_: any) {
        this.cols.update(_ => this.calculateCols())
    }

    calculateCols() {
        return Math.floor(window.innerWidth / 400)
    }

    protected readonly StateService = StateService;
}
