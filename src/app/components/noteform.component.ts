import {Component, output} from '@angular/core';
import {Note, NoteService} from "../api/note.service";
import {FormControl, ReactiveFormsModule} from '@angular/forms';

@Component({
  selector: 'note-form-component',
  imports: [
    ReactiveFormsModule,
  ],
  template: `
    <form>
      <div>title</div>
      <input type="text" id="title" [formControl]="title">
      <div>description</div>
      <input type="text" id="desc" [formControl]="desc">
      <div>important</div>
      <input type="checkbox" id="imp" [formControl]="imp">
    </form>
    <button (click)="add()">add note</button>
  `,
  styles: `
    form {
      background-color: aliceblue;
      margin: 1rem 2rem;
      padding: 1rem;
      border: 1px solid lightgray;
      border-radius: 0.75rem;
    }

    button {
      margin: 1rem 2rem;
    }`
})
export class NoteformComponent {

  title = new FormControl('');
  desc = new FormControl('');
  imp = new FormControl(false);

  saved = output<Note>();

  constructor(private readonly noteService: NoteService) {}

  add() {
    this.noteService.create(<Note>{
      id: 0,
      name: this.title.value,
      description: this.desc.value,
      reminders: [],
      category: this.imp.value ? "Important" : "ToDo",
    }).subscribe(note => this.saved.emit(note))
  }
}
