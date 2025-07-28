import {Component} from '@angular/core';
import {RouterOutlet} from '@angular/router';
import {NoteCreationComponent} from "./components/create/note-creation.component";
import {ReminderCreationComponent} from "./components/create/reminder-creation.component";
import {MatTab, MatTabGroup} from "@angular/material/tabs";
import {MatToolbar} from "@angular/material/toolbar";
import {StateService} from "./api/state.service";
import {MatProgressSpinner} from "@angular/material/progress-spinner";
import {TagCreationComponent} from "./components/create/tag-creation.components";
import {ReactiveFormsModule} from "@angular/forms";
import {NoteGridComponent} from "./components/display/note-grid.component";
import {ReminderGridComponent} from "./components/display/reminder-grid.component";
import {TagTableComponent} from "./components/display/tag-table.component";
import {SearchComponent} from "./components/display/search.component";

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
        ReactiveFormsModule,
        NoteGridComponent,
        ReminderGridComponent,
        TagTableComponent,
        SearchComponent,
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
                <search-notes></search-notes>
            </mat-tab>
        </mat-tab-group>

        <router-outlet/>
    `,
    styles: `
    `,
})
export class App {
    constructor(protected readonly stateService: StateService) {}
}
