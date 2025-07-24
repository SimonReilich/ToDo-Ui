import { Injectable } from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {delay, Observable} from "rxjs";
import {Reminder} from "./reminder.service";

export interface Note {
  id: number;
  name: string;
  description: string;
  reminders: Reminder[];
  category: string;
}

@Injectable({
  providedIn: 'root'
})
export class NoteService {
  constructor(private readonly http: HttpClient) { }

  getAll(): Observable<Note[]> {
    return this.http.get<Note[]>('/api/notes').pipe(delay(2_000))
  }

  get(id: number): Observable<Note> {
    return this.http.get<Note>('/api/notes/' + id).pipe(delay(2_000))
  }

  create(note: Note) {
    return this.http.post<Note>('/api/notes', {
      name: note.name,
      description: note.description,
      reminders: note.reminders,
      category: note.category
    }).pipe(delay(2_000))
  }

  update(note: Note) {
    return this.http.put('/api/notes/' + note.id, note).pipe(delay(2_000))
  }

  addReminder(id: number, rId: number) {
    return this.http.put('/api/notes/' + id + '/reminders/' + rId, {}).pipe(delay(2_000))
  }

  removeReminder(id: number, rId: number) {
    return this.http.delete('/api/notes/' + id + '/reminders/' + rId).pipe(delay(2_000))
  }

  delete(id: number) {
    return this.http.delete('/api/notes/' + id).pipe(delay(2_000))
  }
}
