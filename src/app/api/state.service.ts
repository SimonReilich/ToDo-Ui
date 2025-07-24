import {Injectable, signal, WritableSignal} from '@angular/core';
import {Note, NoteService} from "./note.service";
import {Reminder, ReminderService} from "./reminder.service";
import {catchError, map} from "rxjs";

function waitUntil(condition: any, checkInterval=100) {
    return new Promise<void>(resolve => {
        let interval = setInterval(() => {
            if (!condition()) return;
            clearInterval(interval);
            resolve();
        }, checkInterval)
    })
}

@Injectable({
    providedIn: 'root'
})

export class StateService {

    protected readonly noteService: NoteService;
    protected readonly reminderService: ReminderService;
    public static readonly notes: WritableSignal<Note[]> = signal([])
    public static readonly reminders: WritableSignal<Reminder[]> = signal([])
    public static readonly working: WritableSignal<boolean> = signal(false)

    constructor(protected nService: NoteService, protected rService: ReminderService) {
        this.noteService = nService;
        this.reminderService = rService;
    }

    async updateNotes() {
        await waitUntil(() => !StateService.working());
        StateService.working.update(_ => true)
        this.noteService.getAll().subscribe(notes => {
            StateService.notes.update(_ => notes)
            StateService.working.update(_ => false)
        })
    }

    async updateReminders() {
        await waitUntil(() => !StateService.working());
        StateService.working.update(_ => true)
        this.reminderService.getAll().subscribe(reminders => {
            StateService.reminders.update(_ => reminders)
            StateService.working.update(_ => false)
        })
        await this.updateNotes()
    }

    private addNoteSilent(note: Note) {
        StateService.notes.update(v => [...v, note])
    }

    private addReminderSilent(reminder: Reminder) {
        StateService.reminders.update(v => [...v, reminder])
    }

    private deleteNoteSilent(id: number) {
        StateService.reminders.update(v => v.filter(n => n.id != id))
    }

    private deleteReminderSilent(id: number) {
        StateService.reminders.update(v => v.filter(r => r.id != id))
    }

    private editNoteSilent(note: Note) {
        StateService.notes.update(v => v.map(n => {
            if (n.id == note.id) {
                return note
            } else {
                return n
            }
        }))
    }

    private editReminderSilent(reminder: Reminder) {
        StateService.reminders.update(v => v.map(r => {
            if (r.id == reminder.id) {
                return reminder
            } else {
                return r
            }
        }))
    }

    private uncompleteReminderSilent(id: number) {
        StateService.reminders.update(v => v.map(r => {
            if (r.id == id) {
                return {
                    id: r.id,
                    title: r.title,
                    category: r.category,
                    date: r.date,
                    done: false,
                }
            } else {
                return r
            }
        }))
    }

    private assignReminderSilent(id: number, rId: number) {
        const reminder = StateService.reminders().find(r => r.id == rId)
        StateService.notes.update(v => v.map(n => {
            if (n.id == id && n.reminders.some(r => r.id == rId)) {
                return {
                    id: n.id,
                    name: n.name,
                    description: n.description,
                    category: n.category,
                    reminders: [...n.reminders, reminder!],
                }
            } else {
                return n
            }
        }))
    }

    private removeReminderSilent(id: number, rId: number) {
        StateService.notes.update(v => v.map(n => {
            if (n.id == id) {
                return {
                    id: n.id,
                    name: n.name,
                    description: n.description,
                    category: n.category,
                    reminders: n.reminders.filter(r => r.id != rId),
                }
            } else {
                return n
            }
        }))
    }

    async addNote(note: Note) {
        await waitUntil(() => !StateService.working());
        StateService.working.update(_ => true)
        StateService.notes.update(v => [...v, note])
        console.log('added note, waiting on api...');
        this.noteService.create(note).pipe(catchError(error => {
            this.deleteNoteSilent(note.id)
            return error
        })).subscribe(result => {
            if (typeof result === 'object') {
                StateService.notes.update(v => v.map(n => {
                        if (n.id == -1) {
                            console.log('request successful, updating id')
                            return result as Note
                        } else {
                            return n
                        }
                    }
                ))
            }
            StateService.working.update(_ => false)
        })
    }

    async addReminder(reminder: Reminder) {
        await waitUntil(() => !StateService.working());
        StateService.working.update(_ => true)
        StateService.reminders.update(v => [...v, reminder])
        console.log('added reminder, waiting on api...');
        this.reminderService.create(reminder).pipe(catchError(error => {
            this.deleteReminderSilent(reminder.id)
            return error
        })).subscribe(result => {
            if (typeof result === 'object') {
                StateService.reminders.update(v => v.map(r => {
                        if (r.id == -1) {
                            console.log('request successful, updating id')
                            return result as Reminder
                        } else {
                            return r
                        }
                    }
                ))
            }
            StateService.working.update(_ => false)
        })
    }

    async deleteNote(id: number) {
        await waitUntil(() => !StateService.working());
        StateService.working.update(_ => true)
        const note = StateService.notes().find(n => n.id == id)
        console.log('deleted note, waiting on api...');
        StateService.notes.update(v => v.filter(n => n.id != id))
        this.noteService.delete(id).pipe(catchError(error => {
            this.addNoteSilent(note!)
            return error
        })).subscribe(_ => StateService.working.update(_ => false));
    }

    async deleteReminder(id: number) {
        await waitUntil(() => !StateService.working());
        StateService.working.update(_ => true)
        const reminder = StateService.reminders().find(r => r.id == id)
        console.log('deleted reminder, waiting on api...');
        StateService.reminders.update(v => v.filter(r => r.id != id))
        this.reminderService.delete(id).pipe(catchError(error => {
            this.addReminderSilent(reminder!)
            return error
        })).subscribe(_ => StateService.working.update(_ => false))
        await this.updateNotes()
    }

    async editNote(note: Note) {
        await waitUntil(() => !StateService.working());
        StateService.working.update(_ => true)
        const oldNote = StateService.notes().find(n => n.id == note.id)
        StateService.notes.update(v => v.map(n => {
            if (n.id == note.id) {
                return note
            } else {
                return n
            }
        }))
        console.log('edited note, waiting on api...');
        this.noteService.update(note).pipe(catchError(error => {
            this.editNoteSilent(oldNote!)
            return error
        })).subscribe(_ => StateService.working.update(_ => false))
    }

    async editReminder(reminder: Reminder) {
        await waitUntil(() => !StateService.working());
        StateService.working.update(_ => true)
        const oldReminder = StateService.reminders().find(r => r.id == reminder.id)
        StateService.reminders.update(v => v.map(r => {
            if (r.id == reminder.id) {
                return reminder
            } else {
                return r
            }
        }))
        console.log('edited reminder, waiting on api...');
        this.reminderService.update(reminder).pipe(catchError(error => {
            this.editReminderSilent(oldReminder!)
            return error
        })).subscribe(_ => StateService.working.update(_ => false))
        await this.updateNotes()
    }

    async completeReminder(id: number) {
        await waitUntil(() => !StateService.working());
        StateService.working.update(_ => true)
        StateService.reminders.update(v => v.map(r => {
            if (r.id == id) {
                return {
                    id: r.id,
                    title: r.title,
                    category: r.category,
                    date: r.date,
                    done: true,
                }
            } else {
                return r
            }
        }))
        console.log('completed reminder, waiting on api...');
        this.reminderService.complete(id).pipe(catchError(error => {
            this.uncompleteReminderSilent(id)
            return error
        })).subscribe(_ => StateService.working.update(_ => false))
        await this.updateNotes()
    }

    async assignReminder(id: number, rId: number) {
        await waitUntil(() => !StateService.working());
        StateService.working.update(_ => true)
        const reminder = StateService.reminders().find(r => r.id == rId)
        StateService.notes.update(v => v.map(n => {
            if (n.id == id && n.reminders.some(r => r.id == rId)) {
                return {
                    id: n.id,
                    name: n.name,
                    description: n.description,
                    category: n.category,
                    reminders: [...n.reminders, reminder!],
                }
            } else {
                return n
            }
        }))
        console.log('assigned reminder, waiting on api...');
        this.noteService.addReminder(id, rId).pipe(catchError(error => {
            this.removeReminderSilent(id, rId)
            return error
        })).subscribe(_ => StateService.working.update(_ => false))
        await this.updateNotes()
    }

    async removeReminder(id: number, rId: number) {
        await waitUntil(() => !StateService.working());
        StateService.working.update(_ => true)
        StateService.notes.update(v => v.map(n => {
            if (n.id == id) {
                return {
                    id: n.id,
                    name: n.name,
                    description: n.description,
                    category: n.category,
                    reminders: n.reminders.filter(r => r.id != rId),
                }
            } else {
                return n
            }
        }))
        console.log('removed reminder, waiting on api...')
        this.noteService.removeReminder(id, rId).pipe(catchError(error => {
            this.assignReminderSilent(id, rId)
            return error
        })).subscribe(_ => StateService.working.update(_ => false))
        await this.updateNotes()
    }

    getNoteById(id: number) {
        return StateService.notes().find(n => n.id == id)
    }

    getReminderById(id: number) {
        return StateService.reminders().find(r => r.id == id)
    }
}
