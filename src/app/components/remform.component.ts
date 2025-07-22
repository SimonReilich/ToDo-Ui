import {Component, output} from '@angular/core';
import {Reminder, ReminderService} from "../api/reminder.service";
import {FormControl, ReactiveFormsModule} from '@angular/forms';
import {Observable} from "rxjs";

@Component({
  selector: 'rem-form-component',
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
  desc = new FormControl('');
  imp = new FormControl(false);

  saved = output<Observable<Reminder>>();

  constructor(private readonly reminderService: ReminderService) {}

  add() {
  }
}
