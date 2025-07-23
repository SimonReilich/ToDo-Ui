import {Component, output} from '@angular/core';
import {Reminder, ReminderService} from "../api/reminder.service";
import {FormControl, ReactiveFormsModule} from '@angular/forms';
import {Observable} from "rxjs";
import {Note} from "../api/note.service";

@Component({
  selector: 'rem-form-component',
  imports: [
    ReactiveFormsModule,
  ],
  template: `
    <form>
      <div>title</div>
      <input type="text" id="title" [formControl]="title">
      <div>date</div>
      <input type="number" id="date" [formControl]="date">
      <div>important</div>
      <input type="checkbox" id="imp" [formControl]="imp">
      <div>Note (optional)</div>
      <input type="text" id="note" [formControl]="note">
    </form>
    <button (click)="add()">add reminder</button>
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
export class RemformComponent {

  title = new FormControl('');
  date = new FormControl(0);
  imp = new FormControl(false);
  note = new FormControl('');

  saved = output<Reminder>();
  attatch = output<[number, string]>();

  constructor(private readonly reminderService: ReminderService) {}

  add() {
    this.reminderService.create(<Reminder>{
      id: 0,
      title: this.title.value,
      date: this.date.value,
      category: this.imp.value ? "Important" : "ToDo",
    }).subscribe(reminder => {
      this.saved.emit(reminder)
      this.attatch.emit([reminder.id, this.note.value!])
    })
  }
}
