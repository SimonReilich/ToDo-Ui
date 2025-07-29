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

    public static readonly delay: number = 0
    public readonly notes: WritableSignal<Note[]> = signal([])
    public readonly reminders: WritableSignal<Reminder[]> = signal([])
    public readonly tags: WritableSignal<Tag[]> = signal([])
    public readonly working: WritableSignal<boolean> = signal(false)

    constructor(protected noteService: NoteService, protected reminderService: ReminderService, protected tagService: TagService) {
        this.updateTags().then(() => this.refresh())
    }

    refresh() {
        setTimeout(() => {
            this.updateTags().then(() => this.refresh())
        }, 60_000)
    }

    async updateNotes() {
        this.noteService.getAll().subscribe(notes => {
            this.notes.update(_ => notes)
        })
    }

    async updateReminders() {
        this.reminderService.getAll().subscribe(reminders => {
            this.reminders.update(_ => reminders)
        })
        await this.updateNotes()
    }

    async updateTags() {
        this.tagService.getAll().subscribe(tags => {
            this.tags.update(_ => tags)
        })
        await this.updateReminders()
    }

    async addNote(note: Note) {
        const lock = Monitor.registerExcl();
        await waitUntil(() => Monitor.isActive(lock));
        this.working.update(_ => true)
        this.notes.update(v => [...v, note])
        this.noteService.create(note).pipe(catchError(error => {
            this.updateTags()
            this.working.update(_ => false)
            Monitor.deregister(lock)
            return error
        })).subscribe(result => {
            if (typeof result === 'object') {
                this.notes.update(v => v.map(n => {
                        if (n.id == -1) {
                            return result as Note
                        } else {
                            return n
                        }
                    }
                ))
            }
            this.working.update(_ => false)
            Monitor.deregister(lock)
        })
    }

    async addReminder(reminder: Reminder) {
        const lock = Monitor.registerExcl();
        await waitUntil(() => Monitor.isActive(lock));
        this.working.update(_ => true)
        this.reminders.update(v => [...v, reminder])
        this.reminderService.create(reminder).pipe(catchError(error => {
            this.updateTags()
            this.working.update(_ => false)
            Monitor.deregister(lock)
            return error
        })).subscribe(result => {
            if (typeof result === 'object') {
                this.reminders.update(v => v.map(r => {
                        if (r.id == -1) {
                            return result as Reminder
                        } else {
                            return r
                        }
                    }
                ))
            }
            this.working.update(_ => false)
            Monitor.deregister(lock)
        })
    }

    async addTag(tag: Tag) {
        const lock = Monitor.registerExcl();
        await waitUntil(() => Monitor.isActive(lock));
        this.working.update(_ => true)
        this.tags.update(v => [...v, tag])
        this.tagService.create(tag).pipe(catchError(error => {
            this.updateTags()
            this.working.update(_ => false)
            Monitor.deregister(lock)
            return error
        })).subscribe(result => {
            if (typeof result === 'object') {
                this.tags.update(v => v.map(t => {
                        if (t.id == -1) {
                            return result as Tag
                        } else {
                            return t
                        }
                    }
                ))
            }
            this.working.update(_ => false)
            Monitor.deregister(lock)
        })
    }

    async deleteNote(id: number) {
        const lock = Monitor.register();
        await waitUntil(() => Monitor.isActive(lock));
        this.working.update(_ => true)
        this.notes.update(v => v.filter(n => n.id != id))
        this.noteService.delete(id).pipe(catchError(error => {
            this.updateTags()
            this.working.update(_ => false)
            Monitor.deregister(lock)
            return error
        })).subscribe(_ => {
                this.working.update(_ => false)
                Monitor.deregister(lock)
            }
        );
    }

    async deleteReminder(id: number) {
        const lock = Monitor.register();
        await waitUntil(() => Monitor.isActive(lock));
        this.working.update(_ => true)
        this.reminders.update(v => v.filter(r => r.id != id))
        this.notes.update(v => v.map(n => {
            return {
                id: n.id,
                name: n.name,
                description: n.description,
                reminders: n.reminders.filter(r => r.id != id),
                tag: n.tag
            }
        }))
        this.reminderService.delete(id).pipe(catchError(error => {
            this.updateTags()
            this.working.update(_ => false)
            Monitor.deregister(lock)
            return error
        })).subscribe(_ => {
            this.working.update(_ => false)
            Monitor.deregister(lock)
        })
    }

    async deleteTag(id: number) {
        const lock = Monitor.register();
        await waitUntil(() => Monitor.isActive(lock));
        this.working.update(_ => true)
        this.tags.update(v => v.filter(t => t.id != id))
        this.notes.update(v => v.map(n => {
            return {
                id: n.id,
                name: n.name,
                description: n.description,
                reminders: n.reminders,
                tag: (n.tag != undefined && n.tag.id == id) ? undefined : n.tag
            }
        }))
        this.reminders.update(v => v.map(r => {
            return {
                id: r.id,
                title: r.title,
                date: r.date,
                done: r.done,
                tag: (r.tag != undefined && r.tag.id == id) ? undefined : r.tag
            }
        }))
        this.tagService.delete(id).pipe(catchError(error => {
            this.updateTags()
            this.working.update(_ => false)
            Monitor.deregister(lock)
            return error
        })).subscribe(_ => {
            this.working.update(_ => false)
            Monitor.deregister(lock)
        });
    }

    async editNote(note: Note) {
        const lock = Monitor.register();
        await waitUntil(() => Monitor.isActive(lock));
        this.working.update(_ => true)
        this.notes.update(v => v.map(n => {
            if (n.id == note.id) {
                return note
            } else {
                return n
            }
        }))
        this.noteService.update(note).pipe(catchError(error => {
            this.updateTags()
            this.working.update(_ => false)
            Monitor.deregister(lock)
            return error
        })).subscribe(_ => {
            this.working.update(_ => false)
            Monitor.deregister(lock)
        })
    }

    async editReminder(reminder: Reminder) {
        const lock = Monitor.register();
        await waitUntil(() => Monitor.isActive(lock));
        this.working.update(_ => true)
        this.reminders.update(v => v.map(r => {
            if (r.id == reminder.id) {
                return reminder
            } else {
                return r
            }
        }))
        this.notes.update(v => v.map(n => {
            return {
                id: n.id,
                name: n.name,
                description: n.description,
                reminders: n.reminders.map(r => {
                    if (r.id == reminder.id) {
                        return reminder
                    } else {
                        return r
                    }
                }),
                tag: n.tag
            }
        }))
        this.reminderService.update(reminder).pipe(catchError(error => {
            this.updateTags()
            this.working.update(_ => false)
            Monitor.deregister(lock)
            return error
        })).subscribe(_ => {
            this.working.update(_ => false)
            Monitor.deregister(lock)
        })
    }

    async editTag(tag: Tag) {
        const lock = Monitor.register();
        await waitUntil(() => Monitor.isActive(lock));
        this.working.update(_ => true)
        this.tags.update(v => v.map(t => {
            if (t.id == tag.id) {
                return tag
            } else {
                return t
            }
        }))
        this.notes.update(v => v.map(n => {
            return {
                id: n.id,
                name: n.name,
                description: n.description,
                reminders: n.reminders,
                tag: (n.tag != undefined && n.tag.id == tag.id) ? tag : n.tag
            }
        }))
        this.reminders.update(v => v.map(r => {
            return {
                id: r.id,
                title: r.title,
                date: r.date,
                done: r.done,
                tag: (r.tag != undefined && r.tag.id == tag.id) ? tag : r.tag
            }
        }))
        this.tagService.update(tag).pipe(catchError(error => {
            this.updateTags()
            this.working.update(_ => false)
            Monitor.deregister(lock)
            return error
        })).subscribe(_ => {
            this.working.update(_ => false)
            Monitor.deregister(lock)
        })
    }

    async completeReminder(id: number) {
        const lock = Monitor.register();
        await waitUntil(() => Monitor.isActive(lock));
        this.working.update(_ => true)
        this.reminders.update(v => v.map(r => {
            if (r.id == id) {
                return {
                    id: r.id,
                    title: r.title,
                    date: r.date,
                    done: true,
                    tag: r.tag
                }
            } else {
                return r
            }
        }))
        this.notes.update(v => v.map(n => {
            if (n.reminders.some(r => r.id == id)) {
                return {
                    id: n.id,
                    name: n.name,
                    description: n.description,
                    reminders: n.reminders.map(r => {
                        if (r.id == id) {
                            return {
                                id: r.id,
                                title: r.title,
                                date: r.date,
                                done: true,
                                tag: r.tag
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
            this.updateTags()
            this.working.update(_ => false)
            Monitor.deregister(lock)
            return error
        })).subscribe(_ => {
            this.working.update(_ => false)
            Monitor.deregister(lock)
        })
    }

    async assignReminder(id: number, rId: number) {
        const lock = Monitor.registerExcl();
        await waitUntil(() => Monitor.isActive(lock));
        this.working.update(_ => true)
        const reminder = this.reminders().find(r => r.id == rId)
        this.notes.update(v => v.map(n => {
            if (n.id == id) {
                return {
                    id: n.id,
                    name: n.name,
                    description: n.description,
                    reminders: [...n.reminders, reminder!],
                    tag: n.tag
                }
            } else {
                return n
            }
        }))
        this.noteService.addReminder(id, rId).pipe(catchError(error => {
            this.updateTags()
            this.working.update(_ => false)
            Monitor.deregister(lock)
            return error
        })).subscribe(_ => {
            this.working.update(_ => false)
            Monitor.deregister(lock)
        })
    }

    async addAndAssignReminder(id: number, reminder: Reminder) {
        const lock = Monitor.registerExcl();
        await waitUntil(() => Monitor.isActive(lock));
        this.working.update(_ => true)
        this.reminders.update(v => [...v, reminder])
        this.reminderService.create(reminder).pipe(catchError(error => {
            this.updateTags()
            this.working.update(_ => false)
            Monitor.deregister(lock)
            return error
        })).subscribe(result => {
            if (typeof result === 'object') {
                this.reminders.update(v => v.map(r => {
                        if (r.id == -1) {
                            this.notes.update(v => v.map(n => {
                                if (n.id == id) {
                                    return {
                                        id: n.id,
                                        name: n.name,
                                        description: n.description,
                                        reminders: [...n.reminders, result as Reminder],
                                        tag: n.tag
                                    }
                                } else {
                                    return n
                                }
                            }))
                            this.noteService.addReminder(id, (result as Reminder).id).pipe(catchError(error => {
                                this.updateTags()
                                this.working.update(_ => false)
                                Monitor.deregister(lock)
                                return error
                            })).subscribe(_ => {
                                this.working.update(_ => false)
                                Monitor.deregister(lock)
                            })
                            return result as Reminder
                        } else {
                            return r
                        }
                    }
                ))
            }
            this.working.update(_ => false)
            Monitor.deregister(lock)
        })
    }

    async removeReminder(id: number, rId: number) {
        const lock = Monitor.registerExcl();
        await waitUntil(() => Monitor.isActive(lock));
        this.working.update(_ => true)
        this.notes.update(v => v.map(n => {
            if (n.id == id) {
                return {
                    id: n.id,
                    name: n.name,
                    description: n.description,
                    reminders: n.reminders.filter(r => r.id != rId),
                    tag: n.tag
                }
            } else {
                return n
            }
        }))
        this.noteService.removeReminder(id, rId).pipe(catchError(error => {
            this.updateTags()
            this.working.update(_ => false)
            Monitor.deregister(lock)
            return error
        })).subscribe(_ => {
            this.working.update(_ => false)
            Monitor.deregister(lock)
        })
    }

    async mergeTags(id1: number, id2: number) {
        const lock = Monitor.register();
        await waitUntil(() => Monitor.isActive(lock));
        this.working.update(_ => true)
        this.notes.update(v => v.map(n => {
            return {
                id: n.id,
                name: n.name,
                description: n.description,
                reminders: n.reminders,
                tag: (n.tag != undefined && n.tag.id == id2) ? this.getTagById(id1) : n.tag
            }
        }))
        this.reminders.update(v => v.map(r => {
            return {
                id: r.id,
                title: r.title,
                date: r.date,
                done: r.done,
                tag: (r.tag != undefined && r.tag.id == id2) ? this.getTagById(id1) : r.tag
            }
        }))
        this.tags.update(v => v.filter(t => t.id != id2))
        this.tagService.merge(id1, id2).pipe(catchError(error => {
            this.updateTags()
            this.working.update(_ => false)
            Monitor.deregister(lock)
            return error
        })).subscribe(_ => {
            this.working.update(_ => false)
            Monitor.deregister(lock)
        });
    }

    getNoteById(id: number) {
        return this.notes().find(n => n.id == id)
    }

    getReminderById(id: number) {
        return this.reminders().find(r => r.id == id)
    }

    getTagById(id: number) {
        return this.tags().find(t => t.id == id)
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

    static register(): Lock {
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

    static registerExcl(): Lock {
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

    static isActive(lock: Lock): boolean {
        return this.registered.some(l => l.id == lock.id)
    }

    static deregister(lock: Lock) {
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