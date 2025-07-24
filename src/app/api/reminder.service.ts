import { Injectable } from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {Observable} from "rxjs";

export interface Reminder {
    id: number;
    title: string;
    date: string;
    category: string;
    done: boolean;
}

@Injectable({
    providedIn: 'root'
})
export class ReminderService {
    constructor(private readonly http: HttpClient) { }

    getAll(): Observable<Reminder[]> {
        return this.http.get<Reminder[]>('/api/reminders')
    }

    get(id: number): Observable<Reminder> {
        return this.http.get<Reminder>('/api/reminders/' + id)
    }

    create(reminder: Reminder) {
        return this.http.post<Reminder>('/api/reminders', {
            title: reminder.title,
            date: reminder.date,
            category: reminder.category,
            done: reminder.done,
        })
    }

    update(reminder: Reminder) {
        return this.http.put('/api/reminders/' + reminder.id, reminder)
    }

    complete(id: number) {
        this.http.put('/api/reminders/complete/' + id, {}).subscribe()
    }

    delete(id: number) {
        this.http.delete('/api/reminders/' + id).subscribe()
    }
}
