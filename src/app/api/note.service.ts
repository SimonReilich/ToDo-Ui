import { Injectable } from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {Observable} from "rxjs";
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
    return this.http.get<Note[]>('/api/notes')
  }

  get(id: number): Observable<Note> {
    return this.http.get<Note>('/api/notes/' + id)
  }

  create(note: Note) {
    return this.http.post<Note>('/api/notes', {
      name: note.name,
      description: note.description,
      reminders: note.reminders,
      category: note.category
    })
  }

  update(note: Note) {
    this.http.put('/api/notes/' + note.id, note).subscribe()
  }

  addReminder(id: number, rId: number) {
    this.http.put('/api/notes/' + id + '/reminders/' + rId, {}).subscribe()
  }

  removeReminder(id: number, rId: number) {
    this.http.delete('/api/notes/' + id + '/reminders/' + rId).subscribe()
  }

  delete(id: number) {
    this.http.delete('/api/notes/' + id)
  }
}
