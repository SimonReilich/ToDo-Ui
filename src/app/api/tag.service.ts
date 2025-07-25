import { Injectable } from '@angular/core';
import {delay} from "rxjs";
import {StateService} from "./state.service";
import {HttpClient} from "@angular/common/http";

export interface Tag {
  id: number,
  name: string
}

@Injectable({
  providedIn: 'root'
})
export class TagService {
  constructor(private readonly http: HttpClient) { }

  getAll() {
    return this.http.get<Tag[]>('/api/tags').pipe(delay(StateService.delay))
  }

  get(id: number) {
    return this.http.get(`/api/tags/${id}`).pipe(delay(StateService.delay))
  }

  create(tag: Tag) {
    return this.http.post('/api/tags', tag).pipe(delay(StateService.delay))
  }

  update(tag: Tag) {
    return this.http.put(`/api/tags/${tag.id}`, tag).pipe(delay(StateService.delay))
  }

  merge(id1: number, id2: number) {
    return this.http.put(`/api/tags/${id1}/${id2}`, {}).pipe(delay(StateService.delay))
  }

  delete(id: number) {
    return this.http.delete(`/api/tags/${id}`).pipe(delay(StateService.delay))
  }
}
