import {Injectable, signal, WritableSignal} from '@angular/core';
import {Note, NoteService} from "./note.service";
import {Reminder, ReminderService} from "./reminder.service";
import {catchError} from "rxjs";
import {Tag, TagService} from "./tag.service";

function waitUntil(condition: any, checkInterval = 100) {
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

    public static readonly notes: WritableSignal<Note[]> = signal([])
    public static readonly reminders: WritableSignal<Reminder[]> = signal([])
    public static readonly tags: WritableSignal<Tag[]> = signal([])

    public static readonly working: WritableSignal<boolean> = signal(false)

    public static readonly delay: number = 2_000

    constructor(protected noteService: NoteService, protected reminderService: ReminderService, protected tagService: TagService) {
        this.updateTags().then(() => this.refresh())
    }

    refresh() {
        setTimeout(() => {
            this.updateTags().then(r => this.refresh())
        }, 30_000)
    }

    async updateNotes() {
        this.noteService.getAll().subscribe(notes => {
            StateService.notes.update(_ => notes)
        })
    }

    async updateReminders() {
        this.reminderService.getAll().subscribe(reminders => {
            StateService.reminders.update(_ => reminders)
        })
        await this.updateNotes()
    }

    async updateTags() {
        this.tagService.getAll().subscribe(tags => {
            StateService.tags.update(_ => tags)
        })
        await this.updateReminders()
    }

    async addNote(note: Note) {
        const lock = Monitor.requestExclusive();
        await waitUntil(() => Monitor.canWork(lock));
        StateService.working.update(_ => true)
        StateService.notes.update(v => [...v, note])
        this.noteService.create(note).pipe(catchError(error => {
            this.deleteNoteSilent(note.id)
            StateService.working.update(_ => false)
            Monitor.leave(lock)
            return error
        })).subscribe(result => {
            if (typeof result === 'object') {
                StateService.notes.update(v => v.map(n => {
                        if (n.id == -1) {
                            return result as Note
                        } else {
                            return n
                        }
                    }
                ))
            }
            StateService.working.update(_ => false)
            Monitor.leave(lock)
        })
    }

    async addReminder(reminder: Reminder) {
        const lock = Monitor.requestExclusive();
        await waitUntil(() => Monitor.canWork(lock));
        StateService.working.update(_ => true)
        StateService.reminders.update(v => [...v, reminder])
        this.reminderService.create(reminder).pipe(catchError(error => {
            this.deleteReminderSilent(reminder.id)
            StateService.working.update(_ => false)
            Monitor.leave(lock)
            return error
        })).subscribe(result => {
            if (typeof result === 'object') {
                StateService.reminders.update(v => v.map(r => {
                        if (r.id == -1) {
                            return result as Reminder
                        } else {
                            return r
                        }
                    }
                ))
            }
            StateService.working.update(_ => false)
            Monitor.leave(lock)
        })
    }

    async addTag(tag: Tag) {
        const lock = Monitor.requestExclusive();
        await waitUntil(() => Monitor.canWork(lock));
        StateService.working.update(_ => true)
        StateService.tags.update(v => [...v, tag])
        this.tagService.create(tag).pipe(catchError(error => {
            this.deleteTagSilent(tag.id)
            StateService.working.update(_ => false)
            Monitor.leave(lock)
            return error
        })).subscribe(result => {
            if (typeof result === 'object') {
                StateService.tags.update(v => v.map(t => {
                        if (t.id == -1) {
                            return result as Tag
                        } else {
                            return t
                        }
                    }
                ))
            }
            StateService.working.update(_ => false)
            Monitor.leave(lock)
        })
    }

    async deleteNote(id: number) {
        const lock = Monitor.request();
        await waitUntil(() => Monitor.canWork(lock));
        StateService.working.update(_ => true)
        const note = StateService.notes().find(n => n.id == id)
        StateService.notes.update(v => v.filter(n => n.id != id))
        this.noteService.delete(id).pipe(catchError(error => {
            this.addNoteSilent(note!)
            StateService.working.update(_ => false)
            Monitor.leave(lock)
            return error
        })).subscribe(_ => {
                StateService.working.update(_ => false)
                Monitor.leave(lock)
            }
        );
    }

    async deleteReminder(id: number) {
        const lock = Monitor.request();
        await waitUntil(() => Monitor.canWork(lock));
        StateService.working.update(_ => true)
        const reminder = StateService.reminders().find(r => r.id == id)
        StateService.reminders.update(v => v.filter(r => r.id != id))
        StateService.notes.update(v => v.map(n => {
            return {
                id: n.id,
                name: n.name,
                description: n.description,
                category: n.category,
                reminders: n.reminders.filter(r => r.id != id)
            }
        }))
        this.reminderService.delete(id).pipe(catchError(error => {
            this.addReminderSilent(reminder!)
            StateService.working.update(_ => false)
            Monitor.leave(lock)
            return error
        })).subscribe(_ => {
            StateService.working.update(_ => false)
            Monitor.leave(lock)
        })
    }

    async deleteTag(id: number) {
        const lock = Monitor.request();
        await waitUntil(() => Monitor.canWork(lock));
        StateService.working.update(_ => true)
        const tag = StateService.tags().find(n => n.id == id)
        StateService.tags.update(v => v.filter(n => n.id != id))
        this.tagService.delete(id).pipe(catchError(error => {
            this.addTagSilent(tag!)
            StateService.working.update(_ => false)
            Monitor.leave(lock)
            return error
        })).subscribe(_ => {
            StateService.working.update(_ => false)
            Monitor.leave(lock)
        });
    }

    async editNote(note: Note) {
        const lock = Monitor.request();
        await waitUntil(() => Monitor.canWork(lock));
        StateService.working.update(_ => true)
        const oldNote = StateService.notes().find(n => n.id == note.id)
        StateService.notes.update(v => v.map(n => {
            if (n.id == note.id) {
                return note
            } else {
                return n
            }
        }))
        this.noteService.update(note).pipe(catchError(error => {
            this.editNoteSilent(oldNote!)
            StateService.working.update(_ => false)
            Monitor.leave(lock)
            return error
        })).subscribe(_ => {
            StateService.working.update(_ => false)
            Monitor.leave(lock)
        })
    }

    async editReminder(reminder: Reminder) {
        const lock = Monitor.request();
        await waitUntil(() => Monitor.canWork(lock));
        StateService.working.update(_ => true)
        const oldReminder = StateService.reminders().find(r => r.id == reminder.id)
        StateService.reminders.update(v => v.map(r => {
            if (r.id == reminder.id) {
                return reminder
            } else {
                return r
            }
        }))
        StateService.notes.update(v => v.map(n => {
            return {
                id: n.id,
                name: n.name,
                description: n.description,
                category: n.category,
                reminders: n.reminders.map(r => {
                    if (r.id == reminder.id) {
                        return reminder
                    } else {
                        return r
                    }
                })
            }
        }))
        this.reminderService.update(reminder).pipe(catchError(error => {
            this.editReminderSilent(oldReminder!)
            StateService.working.update(_ => false)
            Monitor.leave(lock)
            return error
        })).subscribe(_ => {
            StateService.working.update(_ => false)
            Monitor.leave(lock)
        })
    }

    async editTag(tag: Tag) {
        const lock = Monitor.request();
        await waitUntil(() => Monitor.canWork(lock));
        StateService.working.update(_ => true)
        const oldTag = StateService.tags().find(t => t.id == tag.id)
        StateService.tags.update(v => v.map(t => {
            if (t.id == tag.id) {
                return tag
            } else {
                return t
            }
        }))
        this.tagService.update(tag).pipe(catchError(error => {
            this.editTagSilent(oldTag!)
            StateService.working.update(_ => false)
            Monitor.leave(lock)
            return error
        })).subscribe(_ => {
            StateService.working.update(_ => false)
            Monitor.leave(lock)
        })
    }

    async completeReminder(id: number) {
        const lock = Monitor.request();
        await waitUntil(() => Monitor.canWork(lock));
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
        StateService.notes.update(v => v.map(n => {
            if (n.reminders.some(r => r.id == id)) {
                return {
                    id: n.id,
                    name: n.name,
                    description: n.description,
                    category: n.category,
                    reminders: n.reminders.map(r => {
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
                    })
                }
            } else {
                return n
            }
        }))
        this.reminderService.complete(id).pipe(catchError(error => {
            this.uncompleteReminderSilent(id)
            StateService.working.update(_ => false)
            Monitor.leave(lock)
            return error
        })).subscribe(_ => {
            StateService.working.update(_ => false)
            Monitor.leave(lock)
        })
    }

    async assignReminder(id: number, rId: number) {
        const lock = Monitor.requestExclusive();
        await waitUntil(() => Monitor.canWork(lock));
        StateService.working.update(_ => true)
        const reminder = StateService.reminders().find(r => r.id == rId)
        StateService.notes.update(v => v.map(n => {
            if (n.id == id) {
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
        this.noteService.addReminder(id, rId).pipe(catchError(error => {
            this.removeReminderSilent(id, rId)
            StateService.working.update(_ => false)
            Monitor.leave(lock)
            return error
        })).subscribe(_ => {
            StateService.working.update(_ => false)
            Monitor.leave(lock)
        })
    }

    async removeReminder(id: number, rId: number) {
        const lock = Monitor.requestExclusive();
        await waitUntil(() => Monitor.canWork(lock));
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
        this.noteService.removeReminder(id, rId).pipe(catchError(error => {
            this.assignReminderSilent(id, rId)
            StateService.working.update(_ => false)
            Monitor.leave(lock)
            return error
        })).subscribe(_ => {
            StateService.working.update(_ => false)
            Monitor.leave(lock)
        })
    }

    async mergeTags(id1: number, id2: number) {
        await this.deleteTag(id2)
    }

    getNoteById(id: number) {
        return StateService.notes().find(n => n.id == id)
    }

    getReminderById(id: number) {
        return StateService.reminders().find(r => r.id == id)
    }

    getTagById(id: number) {
        return StateService.tags().find(t => t.id == id)
    }

    private addNoteSilent(note: Note) {
        StateService.notes.update(v => [...v, note])
    }

    private addReminderSilent(reminder: Reminder) {
        StateService.reminders.update(v => [...v, reminder])
    }

    private addTagSilent(tag: Tag) {
        StateService.tags.update(v => [...v, tag])
    }

    private deleteNoteSilent(id: number) {
        StateService.reminders.update(v => v.filter(n => n.id != id))
    }

    private deleteReminderSilent(id: number) {
        StateService.reminders.update(v => v.filter(r => r.id != id))
    }

    private deleteTagSilent(id: number) {
        StateService.tags.update(v => v.filter(t => t.id != id))
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

    private editTagSilent(tag: Tag) {
        StateService.tags.update(v => v.map(t => {
            if (t.id == tag.id) {
                return tag
            } else {
                return t
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
}

interface Lock {
    type: 'standard' | 'exclusive'
    id: number
}

export class Monitor {

    public static waitingOnExcl = signal<boolean>(false)
    private static nextId: number = 0
    private static registered: Lock[] = []
    private static waiting: Lock[] = []

    static request(): Lock {
        const newLock: Lock = {
            type: 'standard',
            id: this.nextId,
        }
        this.nextId++
        if (this.registered.length == 0 || this.registered.at(0)!.type == 'standard') {
            this.registered.push(newLock)
        } else {
            this.waiting.push(newLock)
        }
        return newLock
    }

    static requestExclusive(): Lock {
        this.waitingOnExcl.update(_ => true)
        const newLock: Lock = {
            type: 'exclusive',
            id: this.nextId,
        }
        this.nextId++
        if (this.registered.length == 0) {
            this.registered.push(newLock)
        } else {
            this.waiting.push(newLock)
        }
        return newLock
    }

    static canWork(lock: Lock): boolean {
        return this.registered.some(l => l.id == lock.id)
    }

    static leave(lock: Lock) {
        this.registered = this.registered.filter(l => l.id != lock.id)
        if (this.registered.length == 0) {
            if (this.waiting.length != 0 && this.waiting.at(0)!.type == "standard") {
                while (this.waiting.length != 0 && this.waiting.at(0)!.type == "standard") {
                    this.registered.push(this.waiting.pop()!)
                }
            } else if (this.waiting.length != 0) {
                this.registered.push(this.waiting.pop()!)
            }
        }
        if (!(this.waiting.some(l => l.type == 'exclusive') || this.registered.some(l => l.type == 'exclusive'))) {
            this.waitingOnExcl.update(_ => false)
        }
    }
}