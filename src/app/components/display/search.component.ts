import {Component, computed, signal} from "@angular/core";
import {MatAutocomplete, MatAutocompleteTrigger, MatOption} from "@angular/material/autocomplete";
import {MatFormField, MatInput, MatLabel} from "@angular/material/input";
import {NoteGridComponent} from "./note-grid.component";
import {FormControl, ReactiveFormsModule} from "@angular/forms";
import {ReminderGridComponent} from "./reminder-grid.component";
import {Note} from "../../api/note.service";
import {Reminder} from "../../api/reminder.service";
import {StateService} from "../../api/state.service";
import {debounceTime} from "rxjs";

@Component({
    selector: 'search-notes',
    imports: [
        MatAutocomplete,
        MatAutocompleteTrigger,
        MatInput,
        MatLabel,
        MatOption,
        NoteGridComponent,
        ReactiveFormsModule,
        ReminderGridComponent,
        MatFormField
    ],
    template: `
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
    `
})
export class SearchComponent {
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