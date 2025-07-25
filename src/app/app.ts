import {Component, computed, HostListener, signal, WritableSignal} from '@angular/core';
import {RouterOutlet} from '@angular/router';
import {Note} from "./api/note.service";
import {NoteCreationComponent} from "./components/create/note-creation.component";
import {Reminder} from "./api/reminder.service";
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
                                    <mat-chip>{{ reminder.category }}</mat-chip>
                                    <span class="date">{{ reminder.date }}</span>
                                </div>
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

                @for (note of searchResultsNotes(); track note.id) {
                    <p>{{ note.description }}</p>
                }

                @for (reminder of searchResultsReminders(); track reminder.id) {
                    <p>{{ reminder.title }}</p>
                }
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
        return {'height': (Math.ceil(StateService.reminders().length / this.cols()) * 10) + 'rem'};
    });
    protected readonly noteHeight = computed(() => {
        try {
            return {'height': (Math.ceil(StateService.notes().length / this.cols()) * (16 + (8 * (StateService.notes().reduce(((acc, n, _, __) => (n.reminders.length > acc.reminders.length) ? n : acc), StateService.notes().at(0)!)).reminders.length))) + 'rem'};
        } catch (error) {
            return {'height': (Math.ceil(StateService.notes().length / this.cols()) * 16) + 'rem'};
        }
    });
    protected readonly searchResultsNotes: WritableSignal<Note[]> = signal([]);
    protected readonly searchResultsReminders: WritableSignal<Reminder[]> = signal([]);

    protected readonly StateService = StateService;
    protected readonly Monitor = Monitor;

    constructor(protected readonly stateService: StateService) {
        this.cols.update(_ => this.calculateCols())
        this.searchResultsNotes.update(_ => StateService.notes())
        this.searchResultsReminders.update(_ => StateService.reminders())
        this.search.valueChanges.pipe(debounceTime(500)).subscribe(value => this.updateResults(value));
    }

    @HostListener('window:resize', ['$event'])
    sizeChange(_: any) {
        this.cols.update(_ => this.calculateCols())
    }

    calculateCols() {
        return Math.floor(window.innerWidth / 400)
    }

    updateResults(searchTerm: string | null) {
        if (searchTerm != undefined) {
            if (!searchTerm.startsWith('tag:')) {
                const regex = new RegExp(searchTerm, 'i');
                console.log(regex)
                this.searchResultsNotes.update(_ => StateService.notes().filter(n => regex.exec(n.name) != undefined || regex.exec(n.description) != undefined));
                this.searchResultsReminders.update(_ => StateService.reminders().filter(n => regex.exec(n.title) != undefined));
            } else {
                if (searchTerm.includes(';')) {
                    const tag = searchTerm.substring(searchTerm.indexOf(':') + 1, searchTerm.indexOf(';')).trim();
                    const other = searchTerm.substring(searchTerm.indexOf(';') + 1).trim();
                    const regex = new RegExp(other, 'i');
                    this.searchResultsNotes.update(_ => StateService.notes().filter(n => (regex.exec(n.name) != undefined || regex.exec(n.description) != undefined) && n.category == tag));
                    this.searchResultsReminders.update(_ => StateService.reminders().filter(r => regex.exec(r.title) != undefined && r.category.trim() == tag.trim()));
                } else {
                    const tag = searchTerm.substring(searchTerm.indexOf(':') + 1).trim();
                    this.searchResultsNotes.update(_ => StateService.notes().filter(n => n.category == tag));
                    this.searchResultsReminders.update(_ => StateService.reminders().filter(r => r.category.trim() == tag.trim()));
                }
            }
        }
    }
}
