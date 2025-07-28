import {Component} from "@angular/core";
import {
    MatCell,
    MatCellDef,
    MatColumnDef,
    MatHeaderCell, MatHeaderCellDef,
    MatHeaderRow,
    MatHeaderRowDef,
    MatRow, MatRowDef, MatTable
} from "@angular/material/table";
import {MatSort, MatSortHeader} from "@angular/material/sort";
import {TagEditComponent} from "../edit/tag-edit.components";
import {CollectionViewer, DataSource} from "@angular/cdk/collections";
import {debounceTime, map, merge, Observable} from "rxjs";
import {toObservable} from "@angular/core/rxjs-interop";
import {StateService} from "../../api/state.service";

export interface tagListEntry {
    name: string;
    id: number;
    notes: number;
    reminders: number;
}

class TagStatistics implements DataSource<any> {
    constructor(private readonly data$: Observable<any>) {
    }

    connect(_: CollectionViewer): Observable<any[]> {
        return this.data$;
    }

    disconnect(_: CollectionViewer): void {
    }
}
@Component({
    selector: 'tag-table',
    imports: [
        MatCell,
        MatCellDef,
        MatColumnDef,
        MatHeaderCell,
        MatHeaderRow,
        MatHeaderRowDef,
        MatRow,
        MatRowDef,
        MatSort,
        MatSortHeader,
        MatTable,
        TagEditComponent,
        MatHeaderCellDef
    ],
    template: `
        <div class="tableWrapper">
            <mat-table [dataSource]="tagDataSource" matSort
                       class="mat-elevation-z8">

                <!-- Name Column -->
                <ng-container matColumnDef="name">
                    <mat-header-cell *matHeaderCellDef mat-sort-header="name"
                                     sortActionDescription="Sort by name">
                        Name
                    </mat-header-cell>
                    <mat-cell *matCellDef="let tag">
                        <tag-edit class="tag" [tag]="tag">{{ tag.name }}</tag-edit>
                    </mat-cell>
                </ng-container>

                <!-- Notes Column -->
                <ng-container matColumnDef="notes">
                    <mat-header-cell *matHeaderCellDef mat-sort-header="notes"
                                     sortActionDescription="Sort by notes">
                        Notes
                    </mat-header-cell>
                    <mat-cell *matCellDef="let tag"> {{ tag.notes }}</mat-cell>
                </ng-container>

                <!-- Symbol Column -->
                <ng-container matColumnDef="reminders">
                    <mat-header-cell *matHeaderCellDef mat-sort-header="reminders"
                                     sortActionDescription="Sort by reminder">
                        Reminders
                    </mat-header-cell>
                    <mat-cell *matCellDef="let tag"> {{ tag.reminders }}</mat-cell>
                </ng-container>

                <mat-header-row *matHeaderRowDef="displayedColumns"></mat-header-row>
                <mat-row *matRowDef="let row; columns: displayedColumns;"></mat-row>
            </mat-table>
        </div>
    `
})
export class TagTableComponent {
    tagData$;
    displayedColumns = ['name', 'notes', 'reminders']
    tagDataSource: DataSource<tagListEntry>

    constructor(protected readonly stateService: StateService) {
        this.tagData$ = merge(toObservable(this.stateService.tags), toObservable(this.stateService.notes), toObservable(this.stateService.reminders)).pipe(debounceTime(1_000)).pipe(
            map(() => this.stateService.tags().map(t => ({
                name: t.name,
                id: t.id,
                notes: this.stateService.notes().filter(n => n.tag?.id == t.id).length,
                reminders: this.stateService.reminders().filter(r => r.tag?.id == t.id).length,
            })))
        );

        this.tagDataSource = new TagStatistics(this.tagData$)
    }

}