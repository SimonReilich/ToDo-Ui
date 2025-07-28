import {Component, computed, signal} from '@angular/core';
import {RouterOutlet} from '@angular/router';
import {NoteCreationComponent} from "./components/create/note-creation.component";
import {ReminderCreationComponent} from "./components/create/reminder-creation.component";
import {MatTab, MatTabGroup} from "@angular/material/tabs";
import {MatToolbar} from "@angular/material/toolbar";
import {Monitor, StateService} from "./api/state.service";
import {MatProgressSpinner} from "@angular/material/progress-spinner";
import {TagCreationComponent} from "./components/create/tag-creation.components";
import {MatFormField, MatInput} from "@angular/material/input";
import {MatLabel} from "@angular/material/form-field";
import {FormControl, ReactiveFormsModule} from "@angular/forms";
import {debounceTime} from "rxjs";
import {MatAutocomplete, MatAutocompleteTrigger, MatOption} from "@angular/material/autocomplete";
import {Note} from "./api/note.service";
import {Reminder} from "./api/reminder.service";
import {NoteGridComponent} from "./components/display/note-grid.component";
import {ReminderGridComponent} from "./components/display/reminder-grid.component";
import {TagTableComponent} from "./components/display/tag-table.component";

@Component({
    selector: 'td-root',
    imports: [
        RouterOutlet,
        NoteCreationComponent,
        ReminderCreationComponent,
        MatTabGroup,
        MatTab,
        MatToolbar,
        MatProgressSpinner,
        TagCreationComponent,
        MatFormField,
        MatLabel,
        MatInput,
        ReactiveFormsModule,
        MatAutocomplete,
        MatOption,
        MatAutocompleteTrigger,
        NoteGridComponent,
        ReminderGridComponent,
        TagTableComponent,
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
                <note-grid [notes]="stateService.notes" [colsConfig]="0"></note-grid>
                <note-creation></note-creation>
            </mat-tab>

            <mat-tab label="Reminders">
                <reminder-grid [colsConfig]="0" [reminders]="stateService.reminders"></reminder-grid>
                <reminder-creation></reminder-creation>
            </mat-tab>

            <mat-tab label="Tags">
                <tag-table></tag-table>
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

                <div class="searchRes">
                    <note-grid [colsConfig]="1" [notes]="filteredNotes"></note-grid>

                    <reminder-grid [colsConfig]="1" [reminders]="filteredReminders"></reminder-grid>
                </div>
            </mat-tab>
        </mat-tab-group>

        <router-outlet/>
    `,
    styles: `
    `,
})
export class App {
    search = new FormControl('')
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

    constructor(protected readonly stateService: StateService) {
        this.search.valueChanges.pipe(debounceTime(600)).subscribe(value => {
            this.updateSearchResults(value)
            this.searchInput.update(_ => value!)
        });
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
