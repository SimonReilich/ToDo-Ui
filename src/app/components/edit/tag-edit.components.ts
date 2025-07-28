import {Component, inject, input} from '@angular/core';
import {MatBottomSheet} from "@angular/material/bottom-sheet";
import {Monitor} from "../../api/state.service";
import {Tag} from "../../api/tag.service";
import {MatChip} from "@angular/material/chips";
import {TagSheet} from "../sheets/tag-sheet.component";

@Component({
    selector: 'tag-edit',
    imports: [
        MatChip
    ],
    template: `
        <mat-chip (click)="openBottomSheet()" [disabled]="Monitor.waitingOnExcl()">{{ tag().name }}</mat-chip>
    `,
    styles: `
    `
})
export class TagEditComponent {

    tag = input.required<Tag>()
    protected readonly Monitor = Monitor;
    private _bottomSheet = inject(MatBottomSheet);

    openBottomSheet(): void {
        this._bottomSheet.open(TagSheet, {data: {id: this.tag().id}});
    }
}

