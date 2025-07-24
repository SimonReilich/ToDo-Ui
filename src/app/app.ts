import {Component, OnDestroy, Signal, signal} from '@angular/core';
import {RouterOutlet} from '@angular/router';
import {Note, NoteService} from "./api/note.service";
import {toSignal} from "@angular/core/rxjs-interop";
import {NoteformComponent} from "./components/noteform.component";
import {Reminder, ReminderService} from "./api/reminder.service";
import {scan, startWith, Subject, switchMap} from "rxjs";
import {ReminderformComponent} from "./components/reminderform.component";
import {MatCard, MatCardActions, MatCardContent, MatCardHeader, MatCardTitle} from "@angular/material/card";
import {MatButton} from "@angular/material/button";
import {MatGridList, MatGridTile} from "@angular/material/grid-list";
import {MatDivider} from "@angular/material/list";
import {MatToolbar} from "@angular/material/toolbar";
import {MatChip} from "@angular/material/chips";
import {MatCheckbox} from "@angular/material/checkbox";
import {NgStyle} from "@angular/common";
import {NoteeditComponent} from "./components/noteedit.component";
import {RemindereditComponent} from "./components/reminderedit.component";

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
    imports: [RouterOutlet, NoteformComponent, ReminderformComponent, MatCard, MatCardHeader, MatCardContent, MatCardActions, MatButton, MatCardTitle, MatGridList, MatGridTile, MatChip, MatDivider, MatCheckbox, NgStyle, NoteeditComponent, RemindereditComponent],
    template: `
        <h1>Welcome to {{ title() }}!</h1>

        <mat-divider></mat-divider>

        <h2>Your Notes</h2>

        <mat-grid-list [cols]="calculateCols()" rowHeight="fit" [ngStyle]="applyNoteContainerHeight()">
            @for (note of notes(); track note.id) {
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
                                        <button (click)="removeRemFromNote(note.id, reminder.id)" matButton>remove
                                        </button>
                                        @if (!reminder.done) {
                                            <button matButton (click)="done(reminder.id)">done</button>
                                        }
                                        <mat-checkbox [checked]="reminder.done" [disabled]="true"></mat-checkbox>
                                    </div>
                                </div>
                            }
                        </mat-card-content>
                        <mat-divider></mat-divider>
                        <mat-card-actions>
                            <note-edit-component [id]="note.id" (refresh)="refreshSingle($event)"></note-edit-component>
                            <button matButton="outlined" (click)="deleteNote(note.id)">delete</button>
                        </mat-card-actions>
                    </mat-card>
                </mat-grid-tile>
            }
        </mat-grid-list>

        <note-form-component (refresh)='refresh()'></note-form-component>

        <mat-divider></mat-divider>

        <h2>Your Reminders</h2>

        <mat-grid-list [cols]="calculateCols()" rowHeight="fit" [ngStyle]="applyRemContainerHeight()">
            @for (reminder of reminders(); track reminder.id) {
                <mat-grid-tile>
                    <mat-card class="reminderItem card" appearance="outlined">
                        <div class="header">
                            <span class="title">{{ reminder.title }}</span>
                            <mat-chip>{{ reminder.category }}</mat-chip>
                            <span class="date">{{ reminder.date }}</span>
                        </div>
                        <div class="buttons buttonsRem">
                            <reminder-edit-component [id]="reminder.id" (refresh)="refreshSingleReminder($event)"></reminder-edit-component>
                            <button (click)="deleteReminder(reminder.id)" matButton="outlined">delete</button>
                            @if (!reminder.done) {
                                <button matButton="outlined" (click)="done(reminder.id)">done</button>
                            }
                            <mat-checkbox [checked]="reminder.done" [disabled]="true"></mat-checkbox>
                        </div>
                    </mat-card>
                </mat-grid-tile>
            }
        </mat-grid-list>

        <reminder-form-component (refresh)="refreshReminders()"></reminder-form-component>

        <router-outlet/>
    `,
    styles: `
    `,
})
export class App implements OnDestroy {
    protected readonly title = signal('notes');
    protected readonly notes: Signal<Note[]>;
    protected readonly reminders: Signal<Reminder[]>;

    protected readonly noteService: NoteService;
    protected readonly reminderService: ReminderService;

    private readonly updateSubjectNotes = new Subject<NoteMessage>()
    private readonly updateSubjectRems = new Subject<RemMessage>()

    constructor(protected readonly nService: NoteService, protected readonly rService: ReminderService) {
        this.noteService = nService;
        this.reminderService = rService;

        setTimeout(() => this.title.set("your notes"), 2000)

        const notes$ = this.noteService.getAll()
            .pipe(
                switchMap(notes => (this.updateSubjectNotes.pipe(scan((acc, n) => this.processNotes(this, acc, n), notes), startWith(notes)))),
            )
        this.notes = toSignal(notes$, {initialValue: []});

        const reminders$ = this.reminderService.getAll()
            .pipe(
                switchMap(reminders => this.updateSubjectRems.pipe(scan((acc, r) => this.processRems(this, acc, r), reminders), startWith(reminders))),
            )
        this.reminders = toSignal(reminders$, {initialValue: []});
    }

    ngOnDestroy() {
        this.updateSubjectNotes.complete()
        this.updateSubjectRems.complete()
    }

    done(id: number) {
        this.reminderService.complete(id)
        const original = this.reminders().filter(reminder => reminder.id == id)[0]
        const edited: Reminder = {
            id: original.id,
            title: original.title,
            date: original.date,
            category: original.category,
            done: true
        }
        this.updateSubjectNotes.next({type: 'ER', reminder: edited})
        this.updateSubjectRems.next({type: 'E', reminder: edited})
    }

    deleteReminder(id: number) {
        const reminder = this.reminders().filter(reminder => reminder.id == id)[0]
        this.reminderService.delete(id)
        this.updateSubjectNotes.next({type: 'DR', reminder: reminder})
        this.updateSubjectRems.next({type: 'D', reminder: reminder})
    }

    deleteNote(id: number) {
        const note = this.notes().filter(reminder => reminder.id == id)[0]
        this.noteService.delete(id)
        this.updateSubjectNotes.next({type: 'D', note: note})
    }

    removeRemFromNote(id: number, rId: number) {
        this.noteService.removeReminder(id, rId)
        const original = this.notes().filter((note) => note.id == id)[0]
        const modified: Note = {
            id: original.id,
            name: original.name,
            description: original.description,
            reminders: original.reminders.filter((r: Reminder) => r.id != rId),
            category: original.category,
        }
        this.updateSubjectNotes.next({type: 'E', note: modified})
    }

    applyRemContainerHeight() {
        return {'height': (Math.ceil(this.reminders().length / 3) * 11) + 'rem'};
    }

    applyNoteContainerHeight() {
        try {
            return {'height': (Math.ceil(this.notes().length / 3) * (16 + (8 * (this.notes().reduce(((acc, n, i, arr) => (n.reminders.length > acc.reminders.length) ? n : acc), this.notes().at(0)!)).reminders.length))) + 'rem'};
        } catch (error) {
            return {'height': (Math.ceil(this.notes().length / 3) * 16) + 'rem'};
        }
    }

    refresh() {
        this.updateSubjectNotes.next({type: 'L'})
    }

    refreshReminders() {
        this.updateSubjectRems.next({type: "L"})
        this.updateSubjectNotes.next({type: 'L'})
    }

    refreshSingle(id: number) {
        this.noteService.get(id).subscribe(note => {
            this.updateSubjectNotes.next({type: 'E', note: note})
        })
    }

    refreshSingleReminder(id: number) {
        this.reminderService.get(id).subscribe(reminder => {
            this.updateSubjectRems.next({type: 'E', reminder: reminder})
        })
        this.refresh()
    }

    processNotes(self: App, state: Note[], msg: NoteMessage): Note[] {
        switch (msg.type) {
            case "C":
                return [...state, msg.note!];
            case 'D':
                return state.filter((n) => n.id != msg.note!.id);
            case 'E':
                return [msg.note!, ...state.filter((n) => n.id != msg.note!.id)];
            case 'ER':
                return state.map((note: Note) => {
                    if (note.reminders.find((r: Reminder) => r.id == msg.reminder!.id)) {
                        return {
                            id: note.id,
                            name: note.name,
                            description: note.description,
                            reminders: note.reminders.map((r: Reminder) => {
                                if (r.id == msg.reminder!.id) {
                                    return msg.reminder!;
                                } else {
                                    return r;
                                }
                            }),
                            category: note.category,
                        }
                    } else {
                        return note
                    }
                })
            case 'DR':
                return state.map((note) => {
                    return {
                        id: note.id,
                        name: note.name,
                        description: note.description,
                        reminders: note.reminders.filter((r) => r.id != msg.reminder!.id),
                        category: note.category,
                    }
                })
            case 'L':
                self.noteService.getAll().subscribe(notes => notes.forEach(n => self.updateSubjectNotes.next({type: 'C', note: n})))
                return []
        }
    }

    processRems(self: App, state: Reminder[], msg: RemMessage): Reminder[] {
        switch (msg.type) {
            case "D":
                return state.filter((r) => r.id != msg.reminder!.id);
            case "E":
                const i = state.findIndex((r) => r.id == msg.reminder!.id)
                state[i] = msg.reminder!;
                return state
            case 'C':
                return [...state, msg.reminder!];
            case 'L':
                self.reminderService.getAll().subscribe(reminders => reminders.forEach(r => self.updateSubjectRems.next({type: 'C', reminder: r})))
                return []
        }
    }

    calculateCols() {
        return Math.floor(window.innerWidth / 400)
    }
}
