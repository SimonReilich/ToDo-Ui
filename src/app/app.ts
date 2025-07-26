import {Component, computed, HostListener, signal} from '@angular/core';
import {RouterOutlet} from '@angular/router';
import {NoteCreationComponent} from "./components/create/note-creation.component";
import {ReminderCreationComponent} from "./components/create/reminder-creation.component";
import {MatCard, MatCardActions, MatCardContent, MatCardHeader, MatCardTitle} from "@angular/material/card";
import {MatButton} from "@angular/material/button";
import {MatGridList, MatGridTile} from "@angular/material/grid-list";
import {MatDivider} from "@angular/material/list";
import {MatChip} from "@angular/material/chips";
import {MatCheckbox} from "@angular/material/checkbox";
import {NgStyle} from "@angular/common";
import {NoteEditComponent} from "./components/edit/note-edit.component";
import {ReminderEditComponent} from "./components/edit/reminder-edit.component";
import {MatTab, MatTabGroup} from "@angular/material/tabs";
import {MatToolbar} from "@angular/material/toolbar";
import {Monitor, StateService} from "./api/state.service";
import {MatProgressSpinner} from "@angular/material/progress-spinner";
import {TagCreationComponent} from "./components/create/tag-creation.components";
import {TagEditComponent} from "./components/edit/tag-edit.components";
import {MatFormField, MatInput} from "@angular/material/input";
import {MatLabel} from "@angular/material/form-field";
import {FormControl, ReactiveFormsModule} from "@angular/forms";
import {debounceTime} from "rxjs";

@Component({
    selector: 'td-root',
    imports: [
        RouterOutlet,
        NoteCreationComponent,
        ReminderCreationComponent,
        MatCard,
        MatCardHeader,
        MatCardContent,
        MatCardActions,
        MatButton,
        MatCardTitle,
        MatGridList,
        MatGridTile,
        MatChip,
        MatDivider,
        MatCheckbox,
        NgStyle,
        NoteEditComponent,
        ReminderEditComponent,
        MatTabGroup,
        MatTab,
        MatToolbar,
        MatProgressSpinner,
        TagCreationComponent,
        NoteEditComponent,
        TagEditComponent,
        MatFormField,
        MatLabel,
        MatInput,
        ReactiveFormsModule,
    ],
    template: `
        <mat-toolbar>
            <span>Welcome to your notes</span>
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
                                    @if (note.tag != undefined) {
                                        <mat-chip>{{ note.tag.name }}</mat-chip>
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
                                                    <mat-chip>{{ reminder.tag.name }}</mat-chip>
                                                }
                                                <span class="date">{{ reminder.date }}</span>
                                            </div>
                                            <div class="buttons">
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

                <note-creation></note-creation>

            </mat-tab>
            <mat-tab label="Reminders">

                <mat-grid-list [cols]="cols()" rowHeight="fit" [ngStyle]="reminderHeight()">
                    @for (reminder of StateService.reminders(); track reminder.id) {
                        <mat-grid-tile>
                            <mat-card class="reminderItem card" appearance="outlined">
                                <div class="header">
                                    <span class="title">{{ reminder.title }}</span>
                                    @if (reminder.tag != undefined) {
                                        <mat-chip>{{ reminder.tag.name }}</mat-chip>
                                    }
                                    <span class="date">{{ reminder.date }}</span>
                                </div>
                                <mat-divider></mat-divider>
                                <div class="buttons buttonsRem">
                                    <reminder-edit [id]="reminder.id"></reminder-edit>
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

                <reminder-creation></reminder-creation>
            </mat-tab>

            <mat-tab label="Tags">
                <div class="tagContainer">
                    @for (tag of StateService.tags(); track tag.id) {
                        <tag-edit class="tag" [tag]="tag">{{ tag.name }}</tag-edit>
                    }
                </div>

                <tag-creation></tag-creation>
            </mat-tab>

            <mat-tab label="Search">
                <mat-form-field class="searchbar">
                    <mat-label>Search</mat-label>
                    <input matInput [formControl]="search">
                </mat-form-field>

                <mat-grid-list [cols]="1" rowHeight="fit" [ngStyle]="noteSearchHeight()" class="searchRes">
                    @for (note of searchResultsNotes(); track note.id) {
                        <mat-grid-tile>
                            <mat-card appearance="outlined" class="card">
                                <mat-card-header>
                                    <mat-card-title>{{ note.name }}</mat-card-title>
                                    @if (note.tag != undefined) {
                                        <mat-chip>{{ note.tag.name }}</mat-chip>
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
                                                    <mat-chip>{{ reminder.tag.name }}</mat-chip>
                                                }
                                                <span class="date">{{ reminder.date }}</span>
                                            </div>
                                            <div class="buttons">
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

                <mat-grid-list [cols]="1" rowHeight="fit" [ngStyle]="reminderSearchHeight()" class="searchRes">
                    @for (reminder of searchResultsReminders(); track reminder.id) {
                        <mat-grid-tile>
                            <mat-card class="reminderItem card" appearance="outlined">
                                <div class="header">
                                    <span class="title">{{ reminder.title }}</span>
                                    @if (reminder.tag != undefined) {
                                        <mat-chip>{{ reminder.tag.name }}</mat-chip>
                                    }
                                    <span class="date">{{ reminder.date }}</span>
                                </div>
                                <mat-divider></mat-divider>
                                <div class="buttons buttonsRem">
                                    <reminder-edit [id]="reminder.id"></reminder-edit>
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
            </mat-tab>
        </mat-tab-group>

        <router-outlet/>
    `,
    styles: `
    `,
})
export class App {

    search = new FormControl('');
    protected readonly cols = signal(3);
    protected readonly reminderHeight = computed(() => {
        return {'height': (Math.ceil(StateService.reminders().length / this.cols()) * 11) + 'rem'};
    });
    protected readonly noteHeight = computed(() => {
        try {
            return {'height': (Math.ceil(StateService.notes().length / this.cols()) * (16 + (8 * (StateService.notes().reduce(((acc, n, _, __) => (n.reminders.length > acc.reminders.length) ? n : acc), StateService.notes().at(0)!)).reminders.length))) + 'rem'};
        } catch (error) {
            return {'height': (Math.ceil(StateService.notes().length / this.cols()) * 16) + 'rem'};
        }
    });

    protected readonly searchResultsNotes = computed(() => {
        if (StateService.tags().some(t => t.name == this.searchTag()) && this.searchTerm() == '') {
            return StateService.notes().filter(n => n.category == this.searchTag())
        } else if (StateService.tags().some(t => t.name == this.searchTag())) {
            const regex = new RegExp(this.searchTerm())
            return StateService.notes().filter(n => (regex.exec(n.name) != undefined || regex.exec(n.description) != undefined) && n.category == this.searchTag())
        } else {
            const regex = new RegExp(this.searchTerm())
            return StateService.notes().filter(n => regex.exec(n.name) != undefined || regex.exec(n.description) != undefined)
        }
    })
    protected readonly searchResultsReminders = computed(() => {
        if (StateService.tags().some(t => t.name == this.searchTag()) && this.searchTerm() == '') {
            return StateService.reminders().filter(r => r.category == this.searchTag())
        } else if (StateService.tags().some(t => t.name == this.searchTag())) {
            const regex = new RegExp(this.searchTerm())
            return StateService.reminders().filter(n => regex.exec(n.title) != undefined && n.category == this.searchTag())
        } else {
            const regex = new RegExp(this.searchTerm())
            return StateService.reminders().filter(n => regex.exec(n.title) != undefined)
        }
    })
    protected readonly searchTerm = signal('')
    protected readonly searchTag = signal('')
    protected readonly reminderSearchHeight = computed(() => {
        return {'height': (Math.ceil(this.searchResultsReminders().length) * 11) + 'rem'};
    });
    protected readonly noteSearchHeight = computed(() => {
        try {
            return {'height': (Math.ceil(this.searchResultsNotes().length) * (16 + (8 * (this.searchResultsNotes().reduce(((acc, n, _, __) => (n.reminders.length > acc.reminders.length) ? n : acc), this.searchResultsNotes().at(0)!)).reminders.length))) + 'rem'};
        } catch (error) {
            return {'height': (Math.ceil(this.searchResultsNotes().length) * 16) + 'rem'};
        }
    });

    protected readonly StateService = StateService;
    protected readonly Monitor = Monitor;

    constructor(protected readonly stateService: StateService) {
        this.cols.update(_ => this.calculateCols())
        this.search.valueChanges.pipe(debounceTime(600)).subscribe(value => this.updateResults(value));
    }

    @HostListener('window:resize', ['$event'])
    sizeChange(_: any) {
        this.cols.update(_ => this.calculateCols())
    }

    calculateCols() {
        return Math.floor(window.innerWidth / 400)
    }

    updateResults(input: string | null) {
        if (input != undefined) {
            if (!input.startsWith('tag:')) {
                this.searchTerm.update(_ => input);
                this.searchTag.update(_ => '')
            } else {
                if (input.includes(';')) {
                    const tag = input.substring(input.indexOf(':') + 1, input.indexOf(';')).trim();
                    const other = input.substring(input.indexOf(';') + 1).trim();
                    this.searchTerm.update(_ => other)
                    this.searchTag.update(_ => tag)
                } else {
                    const tag = input.substring(input.indexOf(':') + 1).trim();
                    this.searchTerm.update(_ => '')
                    this.searchTag.update(_ => tag)
                }
            }
        }
    }
}
