import {Component, OnDestroy, Signal, signal} from '@angular/core';
import {RouterOutlet} from '@angular/router';
import {Note, NoteService} from "./api/note.service";
import {toSignal} from "@angular/core/rxjs-interop";
import {NoteformComponent} from "./components/noteform.component";
import {Reminder, ReminderService} from "./api/reminder.service";
import {scan, Subject, switchMap} from "rxjs";

interface NoteMessage {
    type: 'D' | 'C' | 'E' | 'ER' | 'DR';
    note?: Note;
    reminder?: Reminder;
}

interface RemMessage {
    type: 'D' | 'C' | 'E';
    reminder: Reminder;
}

function processNotes(state: Note[], msg: NoteMessage): Note[] {
    switch (msg.type) {
        case "C":
            return [...state, msg.note!];
        case 'D':
            return state.filter((n) => n.id != msg.note!.id);
        case 'E':
            const i = state.findIndex((n) => n.id == msg.note!.id)
            state[i] = msg.note!
            return state
        case 'ER':
            return state.map<Note>((note: any) => {
            if (note.reminder.find((r:any) => r.id == msg.reminder!.id)) {
                return {
                    id: note.id,
                    name: note.name,
                    description: note.description,
                    reminders: [...note.reminders.filter((r: any) => r.id != msg.reminder!.id), msg.reminder],
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
    }
}

function processRems(state: Reminder[], msg: RemMessage): Reminder[] {
    switch (msg.type) {
        case "D":
            return state.filter((r) => r.id != msg.reminder.id);
        case "E":
            const i = state.findIndex((r) => r.id == msg.reminder.id)
            state[i] = msg.reminder;
            return state
        case 'C':
            return [...state, msg.reminder];
    }
}

@Component({
    selector: 'td-root',
    imports: [RouterOutlet, NoteformComponent],
    template: `
        <h1>Welcome to {{ title() }}!</h1>

        <h1>Your Notes</h1>

        @for (note of notes(); track note.id) {
            <div class="container">
                <h2>{{ note.name }}</h2>
                <h5>{{ note.category }}</h5>
                <div>{{ note.description }}</div>
                <ul>
                    @for (reminder of note.reminders; track reminder.id) {
                        <li>
                            <h3>{{ reminder.title }}</h3>
                            <h5>{{ reminder.category }}</h5>
                            <div>{{ reminder.date }}</div>
                            <div>{{ reminder.done }}</div>
                            @if (!reminder.done) {
                                <button (click)="done(reminder.id)" class="done">done</button>
                            }
                            <button (click)="removeRem(note.id, reminder.id)">remove reminder</button>
                        </li>
                    }
                </ul>
            </div>
        }

        <note-form-component (saved)='add($event)'></note-form-component>

        <h1>Your Reminders</h1>

        @for (reminder of reminders(); track reminder.id) {
            <div class="container">
                <h3>{{ reminder.title }}</h3>
                <h5>{{ reminder.category }}</h5>
                <div>{{ reminder.date }}</div>
                <div>{{ reminder.done }}</div>
                @if (!reminder.done) {
                    <button (click)="done(reminder.id)" class="done">done</button>
                }
            </div>
        }

        <router-outlet/>
    `,
    styles: [],
})
export class App implements OnDestroy {
    protected readonly title = signal('todo-ui');
    protected readonly notes: Signal<Note[]>;
    protected readonly reminders: Signal<Reminder[]>;

    private readonly updateSubjectNotes = new Subject<NoteMessage>()
    private readonly updateSubjectRems = new Subject<RemMessage>()

    constructor(private readonly noteService: NoteService, private readonly reminderService: ReminderService) {
        setTimeout(() => this.title.set("test"), 4000)

        const notes$ = this.noteService.getAll()
            .pipe(
                switchMap(notes => this.updateSubjectNotes.pipe(scan(processNotes, notes))),
            )
        this.notes = toSignal(notes$, {initialValue: []});

        const reminders$ = this.reminderService.getAll()
            .pipe(
                switchMap(reminders => this.updateSubjectRems.pipe(scan(processRems, reminders))),
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

    removeRem(id: number, rId: number) {
        this.noteService.removeReminder(id, rId)
        const original = this.notes().filter((note) => note.id == id)[0]
        const edited: Note = {
            id: original.id,
            name: original.name,
            description: original.description,
            reminders: original.reminders.filter((reminder) => reminder.id != rId),
            category: original.category
        }
        const toRemove = original.reminders.filter((reminder) => reminder.id == rId)[0]
        this.updateSubjectNotes.next({type: 'DR', reminder: toRemove})
        this.updateSubjectRems.next({type: 'D', reminder: toRemove})
    }

    add(note: Note) {
        this.updateSubjectNotes.next({type: 'C', note: note})
        note.reminders.forEach(reminder => {
            if (!this.reminders().includes(reminder)) {
                this.updateSubjectRems.next({type: 'C', reminder: reminder})
            }
        })
    }
}
