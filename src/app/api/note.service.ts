import { Injectable } from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {delay, Observable} from "rxjs";
import {Reminder} from "./reminder.service";
import {StateService} from "./state.service";

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
    return this.http.get<Note[]>('/api/notes').pipe(delay(StateService.delay))
  }

  get(id: number): Observable<Note> {
    return this.http.get<Note>('/api/notes/' + id).pipe(delay(StateService.delay))
  }

  create(note: Note) {
    return this.http.post<Note>('/api/notes', {
      name: note.name,
      description: note.description,
      reminders: note.reminders,
      category: note.category
    }).pipe(delay(StateService.delay))
  }

  update(note: Note) {
    return this.http.put('/api/notes/' + note.id, note).pipe(delay(StateService.delay))
  }

  addReminder(id: number, rId: number) {
    return this.http.put('/api/notes/' + id + '/reminders/' + rId, {}).pipe(delay(StateService.delay))
  }

  removeReminder(id: number, rId: number) {
    return this.http.delete('/api/notes/' + id + '/reminders/' + rId).pipe(delay(StateService.delay))
  }

  delete(id: number) {
    return this.http.delete('/api/notes/' + id).pipe(delay(StateService.delay))
  }
}
