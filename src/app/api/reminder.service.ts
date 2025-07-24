import { Injectable } from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {delay, Observable} from "rxjs";

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
        return this.http.get<Reminder[]>('/api/reminders').pipe(delay(2_000))
    }

    get(id: number): Observable<Reminder> {
        return this.http.get<Reminder>('/api/reminders/' + id).pipe(delay(2_000))
    }

    create(reminder: Reminder) {
        return this.http.post<Reminder>('/api/reminders', {
            title: reminder.title,
            date: reminder.date,
            category: reminder.category,
            done: reminder.done,
        }).pipe(delay(2_000))
    }

    update(reminder: Reminder) {
        return this.http.put('/api/reminders/' + reminder.id, reminder).pipe(delay(2_000))
    }

    complete(id: number) {
        return this.http.put('/api/reminders/complete/' + id, {}).pipe(delay(2_000))
    }

    delete(id: number) {
        return this.http.delete('/api/reminders/' + id).pipe(delay(2_000))
    }
}
