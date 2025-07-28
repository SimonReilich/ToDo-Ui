import {Component, computed, HostListener, signal} from '@angular/core';
import {RouterOutlet} from '@angular/router';
import {NoteCreationComponent} from "./components/create/note-creation.component";
import {ReminderCreationComponent} from "./components/create/reminder-creation.component";
import {MatCard, MatCardActions, MatCardContent, MatCardHeader, MatCardTitle} from "@angular/material/card";
import {MatButton} from "@angular/material/button";
import {MatGridList, MatGridTile} from "@angular/material/grid-list";
import {MatDivider} from "@angular/material/list";
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
import {debounceTime, map, merge, Observable} from "rxjs";
import {MatAutocomplete, MatAutocompleteTrigger, MatOption} from "@angular/material/autocomplete";
import {Note} from "./api/note.service";
import {Reminder} from "./api/reminder.service";
import {
    MatCell,
    MatCellDef,
    MatColumnDef,
    MatHeaderCell,
    MatHeaderCellDef,
    MatHeaderRow,
    MatHeaderRowDef,
    MatRow,
    MatRowDef,
    MatTable,
} from "@angular/material/table";
import {MatSort, MatSortHeader} from "@angular/material/sort";
import {toObservable} from "@angular/core/rxjs-interop";
import {CollectionViewer, DataSource} from "@angular/cdk/collections";

export interface tagListEntry {
    name: string;
    id: number;
    notes: number;
    reminders: number;
}

class TagStatistics implements DataSource<any>{
    constructor(private readonly data$: Observable<any>) {}

    connect(_: CollectionViewer): Observable<any[]> {
        return this.data$;
    }

    disconnect(_: CollectionViewer): void {}
}

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
        MatAutocomplete,
        MatOption,
        MatAutocompleteTrigger,
        MatTable,
        MatSort,
        MatColumnDef,
        MatHeaderCell,
        MatSortHeader,
        MatCell,
        MatCellDef,
        MatHeaderCellDef,
        MatSort,
        MatHeaderRow,
        MatRow,
        MatHeaderRowDef,
        MatRowDef,
    ],
    template: `
        <mat-toolbar>
            <span>Welcome to your notes</span>
            @if (stateService.working()) {
                <span class="spacer"></span>
                <mat-spinner diameter="23"></mat-spinner>
            }
        </mat-toolbar>

        <mat-tab-group>
            <mat-tab label="Notes">
                <mat-grid-list [cols]="cols()" rowHeight="fit" [ngStyle]="noteHeight()">
                    @for (note of stateService.notes(); track note.id) {
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

                <note-creation></note-creation>

            </mat-tab>
            <mat-tab label="Reminders">

                <mat-grid-list [cols]="cols()" rowHeight="fit" [ngStyle]="reminderHeight()">
                    @for (reminder of stateService.reminders(); track reminder.id) {
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

                <reminder-creation></reminder-creation>
            </mat-tab>

            <mat-tab label="Tags">
                <div class="tableWrapper">
                    <mat-table [dataSource]="tagDataSource" matSort
                               class="mat-elevation-z8">

                        <!-- Name Column -->
                        <ng-container matColumnDef="name">
                            <mat-header-cell *matHeaderCellDef mat-sort-header="name"
                                             sortActionDescription="Sort by name">
                                Name
                            </mat-header-cell>
                            <mat-cell *matCellDef="let tag">
                                <tag-edit class="tag" [tag]="tag">{{ tag.name }}</tag-edit>
                            </mat-cell>
                        </ng-container>

                        <!-- Notes Column -->
                        <ng-container matColumnDef="notes">
                            <mat-header-cell *matHeaderCellDef mat-sort-header="notes"
                                             sortActionDescription="Sort by notes">
                                Notes
                            </mat-header-cell>
                            <mat-cell *matCellDef="let tag"> {{ tag.notes }}</mat-cell>
                        </ng-container>

                        <!-- Symbol Column -->
                        <ng-container matColumnDef="reminders">
                            <mat-header-cell *matHeaderCellDef mat-sort-header="reminders"
                                             sortActionDescription="Sort by reminder">
                                Reminders
                            </mat-header-cell>
                            <mat-cell *matCellDef="let tag"> {{ tag.reminders }}</mat-cell>
                        </ng-container>

                        <mat-header-row *matHeaderRowDef="displayedColumns"></mat-header-row>
                        <mat-row *matRowDef="let row; columns: displayedColumns;"></mat-row>
                    </mat-table>
                </div>

                <tag-creation></tag-creation>
            </mat-tab>

            <mat-tab label="Search">
                <mat-form-field class="searchbar">
                    <mat-label>Search</mat-label>
                    <input matInput [formControl]="search" [matAutocomplete]="auto">
                </mat-form-field>
                <mat-autocomplete #auto="matAutocomplete">
                    @for (tag of filteredTags(); track tag.id) {
                        <mat-option [value]="'tag: ' + tag.name + '; '">tag: {{ tag.name }}</mat-option>
                    }
                </mat-autocomplete>

                @if (stateService.notes().length == 0 && stateService.reminders().length == 0) {
                    <p class="warning">You do not have any notes or reminders</p>
                } @else if (!tagExists() && searchTag() != '') {
                    <p class="warning">The tag <span class="bold"> {{ searchTag() }} </span> does not exist</p>
                } @else if (filteredNotes().length == 0 && filteredReminders().length == 0 && !(searchContent().length == 0)) {
                    <p class="warning">No notes or reminders found that match <span
                            class="bold"> {{ searchContent() }} </span></p>
                } @else if (filteredNotes().length == 0 && filteredReminders().length == 0) {
                    <p class="warning">No notes or reminders with tag <span
                            class="bold"> {{ searchTag() }} </span></p>
                }

                <mat-grid-list [cols]="1" rowHeight="fit" [ngStyle]="noteSearchHeight()" class="searchRes">
                    @for (note of filteredNotes(); track note.id) {
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

                <mat-grid-list [cols]="1" rowHeight="fit" [ngStyle]="reminderSearchHeight()" class="searchRes">
                    @for (reminder of filteredReminders(); track reminder.id) {
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
            </mat-tab>
        </mat-tab-group>

        <router-outlet/>
    `,
    styles: `
    `,
})
export class App {
    search = new FormControl('')

    protected readonly cols = signal(3)
    protected readonly reminderHeight = computed(() => {
        return {'height': (Math.ceil(this.stateService.reminders().length / this.cols()) * 11) + 'rem'};
    })
    protected readonly noteHeight = computed(() => {
        try {
            return {'height': (Math.ceil(this.stateService.notes().length / this.cols()) * (16 + (8 * (this.stateService.notes().reduce(((acc, n, _, __) => (n.reminders.length > acc.reminders.length) ? n : acc), this.stateService.notes().at(0)!)).reminders.length))) + 'rem'};
        } catch (error) {
            return {'height': (Math.ceil(this.stateService.notes().length / this.cols()) * 16) + 'rem'};
        }
    })
    protected readonly reminderSearchHeight = computed(() => {
        return {'height': (Math.ceil(this.filteredReminders().length) * 11) + 'rem'};
    })
    protected readonly noteSearchHeight = computed(() => {
        if (this.filteredNotes().length != 0) {
            try {
                return {'height': (Math.ceil(this.filteredNotes().length) * (16 + (8 * (this.filteredNotes().reduce(((acc, n, _, __) => (n.reminders.length > acc.reminders.length) ? n : acc), this.filteredNotes().at(0)!)).reminders.length))) + 'rem'};
            } catch (error) {
                return {'height': (Math.ceil(this.filteredNotes().length) * 16) + 'rem'};
            }
        } else {
            return {
                'height': 0,
                'padding': 0,
                'margin': 0
            }
        }
    })

    protected readonly searchInput = signal('');
    protected readonly searchContent = signal('')
    protected readonly searchTag = signal('')
    protected readonly tagExists = computed(() => {
        return this.stateService.tags().some(t => t.name.toLowerCase().trim() == this.searchTag().toLowerCase().trim());
    })
    protected readonly filteredNotes = computed(() => {
        if (this.searchContent().trim() == '' && this.searchTag().trim() != '') {
            return this.stateService.notes().filter(n => n.tag?.name.toLowerCase() == this.searchTag().toLowerCase().trim());
        } else if (this.searchTag().trim() != '') {
            const regex = new RegExp(this.searchContent(), 'i')
            return this.stateService.notes().filter(n => (regex.exec(n.name) != undefined || regex.exec(n.description) != undefined) && n.tag?.name == this.searchTag())
        } else {
            const regex = new RegExp(this.searchContent(), 'i')
            return this.stateService.notes().filter(n => regex.exec(n.name) != undefined || regex.exec(n.description) != undefined)
        }
    })
    protected readonly filteredReminders = computed(() => {
        if (this.searchContent().trim() == '' && this.searchTag().trim() != '') {
            return this.stateService.reminders().filter(r => r.tag?.name.toLowerCase() == this.searchTag().toLowerCase().trim())
        } else if (this.searchTag().trim() != '') {
            const regex = new RegExp(this.searchContent(), 'i')
            return this.stateService.reminders().filter(n => regex.exec(n.title) != undefined && n.tag?.name.toLowerCase() == this.searchTag().toLowerCase().trim())
        } else {
            const regex = new RegExp(this.searchContent(), 'i')
            return this.stateService.reminders().filter(n => regex.exec(n.title) != undefined)
        }
    })
    protected readonly filteredTags = computed(() => {
        if (this.searchInput().includes(';')) {
            return [];
        } else if (this.searchInput().length > 4 && !this.searchInput().toLowerCase().startsWith('tag:')) {
            return [];
        } else if (this.searchInput().length <= 4 && 'tag:'.startsWith(this.searchInput().toLowerCase().trim())) {
            return this.stateService.tags().filter(t => this.stateService.notes().some((n: Note) => n.tag?.id == t.id) || this.stateService.reminders().some((r: Reminder) => r.tag?.id == t.id));
        } else if (this.searchInput().toLowerCase().startsWith('tag:')) {
            return this.stateService.tags().filter(t => t.name.toLowerCase().startsWith(this.searchTag().toLowerCase())).filter(t => this.stateService.notes().some((n: Note) => n.tag?.id == t.id) || this.stateService.reminders().some((r: Reminder) => r.tag?.id == t.id));
        } else {
            return []
        }
    })

    protected readonly Monitor = Monitor

    tagData$;
    displayedColumns = ['name', 'notes', 'reminders']
    tagDataSource: DataSource<tagListEntry>

    constructor(protected readonly stateService: StateService) {
        this.cols.update(_ => this.calculateCols())
        this.search.valueChanges.pipe(debounceTime(600)).subscribe(value => {
            this.updateSearchResults(value)
            this.searchInput.update(_ => value!)
        });

        this.tagData$ = merge(toObservable(this.stateService.tags), toObservable(this.stateService.notes), toObservable(this.stateService.reminders)).pipe(debounceTime(1_000)).pipe(
            map(() => this.stateService.tags().map(t => ({
                name: t.name,
                id: t.id,
                notes: this.stateService.notes().filter(n => n.tag?.id == t.id).length,
                reminders: this.stateService.reminders().filter(r => r.tag?.id == t.id).length,
            })))
        );

        this.tagDataSource = new TagStatistics(this.tagData$)
    }

    @HostListener('window:resize', ['$event'])
    sizeChange(_: any) {
        this.cols.update(_ => this.calculateCols())
    }

    calculateCols() {
        return Math.floor(window.innerWidth / 400)
    }

    updateSearchResults(input: string | null) {
        if (input != undefined) {
            if (!input.toLowerCase().startsWith('tag:')) {
                this.searchContent.update(_ => input);
                this.searchTag.update(_ => '')
            } else {
                if (input.includes(';')) {
                    const tag = input.substring(input.indexOf(':') + 1, input.indexOf(';')).trim();
                    const other = input.substring(input.indexOf(';') + 1).trim();
                    this.searchContent.update(_ => other)
                    this.searchTag.update(_ => tag)
                } else {
                    const tag = input.substring(input.indexOf(':') + 1).trim();
                    this.searchContent.update(_ => '')
                    this.searchTag.update(_ => tag)
                }
            }
        }
    }
}
