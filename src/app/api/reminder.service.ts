import { Injectable } from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {delay, Observable} from "rxjs";
import {StateService} from "./state.service";

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
        return this.http.get<Reminder[]>('/api/reminders').pipe(delay(StateService.delay))
    }

    get(id: number): Observable<Reminder> {
        return this.http.get<Reminder>('/api/reminders/' + id).pipe(delay(StateService.delay))
    }

    create(reminder: Reminder) {
        return this.http.post<Reminder>('/api/reminders', {
            title: reminder.title,
            date: reminder.date,
            category: reminder.category,
            done: reminder.done,
        }).pipe(delay(StateService.delay))
    }

    update(reminder: Reminder) {
        return this.http.put('/api/reminders/' + reminder.id, reminder).pipe(delay(StateService.delay))
    }

    complete(id: number) {
        return this.http.put('/api/reminders/complete/' + id, {}).pipe(delay(StateService.delay))
    }

    delete(id: number) {
        return this.http.delete('/api/reminders/' + id).pipe(delay(StateService.delay))
    }
}
