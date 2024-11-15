import { Injectable } from '@angular/core';
import { RwSortTableColumnHeadDirective } from './sort-table-column-head.directive';
import { RwSortTableColumnDirective } from './sort-table-column.directive';
import { RwSortTableDragColumnDirective } from './sort-table-drag-column.directive';
import { RwSortTableRowDirective } from './sort-table-row.directive';
import { RwSortTableDirective } from './sort-table.directive';
import { RwSortTableSettingsService } from './sort-table.settings.service';

@Injectable()
export class RwSortTableService {
  currentDrag: RwSortTableRowDirective | RwSortTableDragColumnDirective;
  collections: Record<string, RwSortTableDirective> = {};
  collectionRows: Record<string, RwSortTableRowDirective[]> = {};
  collectionDragColumns: Record<string, RwSortTableDragColumnDirective[]> = {};
  collectionColumnsHead: RwSortTableColumnHeadDirective[] = [];
  collectionColumnsHeadMap: {
    [key: string]: RwSortTableColumnHeadDirective;
  } = {};
  collectionColumns: { [key: string]: RwSortTableColumnDirective[] } = {};

  constructor(private settingsService: RwSortTableSettingsService) {}

  // Register new collection from SortTableDirective
  registerCollection(name: string, table: RwSortTableDirective): void {
    this.collectionRows[name] = [];
    this.collections[name] = table;
  }

  // Unegister new collection from SortTableDirective
  unregisterCollection(name: string): void {
    this.collectionRows[name] = null;
  }

  // Register row for sorting from SortTableRowDirective
  registerRow(name: string, index: number, row: RwSortTableRowDirective): void {
    if (this.collectionRows[name]) {
      this.collectionRows[name][index] = row;
    }
  }

  // Unregister row for sorting from SortTableRowDirective
  unregisterRow(name: string, index: number): void {
    this.collectionRows[name][index] = null;
  }

  // Register column for sorting from SortTableDragColumnDirective
  registerDragColumn(
    name: string,
    index: number,
    column: RwSortTableDragColumnDirective,
  ): void {
    this.collectionDragColumns[name][index] = column;
  }

  // Unregister column for sorting from SortTableDragColumnDirective
  unregisterDragColumn(name: string, index: number): void {
    this.collectionDragColumns[name][index] = null;
  }

  getRow(
    collectionName: string,
    index: number,
  ): RwSortTableDragColumnDirective {
    return this.collectionDragColumns[collectionName][index];
  }

  // Register column for resize from SortTableColumnDirective
  registerColumn(columnId: string, column: RwSortTableColumnDirective): void {
    if (!this.collectionColumns[columnId]) {
      this.collectionColumns[columnId] = [];
    }
    this.collectionColumns[columnId].push(column);
    column.style = this.settingsService.getColumnStyle(columnId, false);
    if (this.collectionColumnsHeadMap[columnId]?.hidden) {
      column.hide();
    }
  }

  // Unregister column for resize from SortTableColumnDirective
  unregisterColumn(columnId: string, index: number): void {
    this.collectionColumns[columnId][index] = null;
  }

  // Register column head for resize from SortTableColumnHeadDirective
  registerColumnHead(
    columnId: string,
    column: RwSortTableColumnHeadDirective,
  ): void {
    this.collectionColumnsHeadMap[columnId] = column;
    this.collectionColumnsHead.push(column);
    column.style = this.settingsService.getColumnStyle(columnId, true);
  }

  // Unregister column head for resize from SortTableColumnHeadDirective
  unregisterColumnHead(columnId: string): void {
    this.collectionColumnsHeadMap[columnId] = null;
  }

  //////////////////////////////////////////////////////////////////////////////
  // Sorting
  //////////////////////////////////////////////////////////////////////////////

  // Start drag on sorting
  startDrag(name: string, index: number): void {
    const collection = {
      ...this.collectionRows,
      ...this.collectionDragColumns,
    }[name];
    for (let ai = 0; ai < collection.length; ++ai) {
      if (collection[ai]) {
        collection[ai].startSorting();
      }
    }
    this.currentDrag = collection[index];
    this.currentDrag.startDrag();
  }

  // Stop drag on sorting
  stopDrag(name: string): void {
    if (!this.currentDrag) {
      return;
    }

    this.currentDrag.stopDrag();
    this.collections[name].setSort(
      this.currentDrag.index,
      this.currentDrag.newIndex,
    );

    const collection = {
      ...this.collectionRows,
      ...this.collectionDragColumns,
    }[name];
    for (let ai = 0; ai < collection.length; ++ai) {
      if (!collection[ai]) {
        continue;
      }
      collection[ai].stopSorting();
    }

    this.currentDrag = null;
  }
  // Move sorted item on sorting
  moveDrag(name: string, offsetX: number, offsetY: number): void {
    if (this.currentDrag) {
      this.currentDrag.moveDrag(offsetX, offsetY);
    }
  }

  // Move other items in list
  moveOther(
    name: string,
    index: number,
    layer: number,
    vertical = false,
  ): void {
    const collection = {
      ...this.collectionRows,
      ...this.collectionDragColumns,
    }[name];
    if (this.currentDrag) {
      for (let ai = 0; ai < collection.length; ++ai) {
        if (collection[ai]) {
          collection[ai].offsetDrag(0);
        }
        if (ai > this.currentDrag.index && ai < index) {
          if (vertical) {
            collection[ai].offsetDrag(-this.currentDrag.offsetWidth);
          } else {
            collection[ai].offsetDrag(-this.currentDrag.offsetHeight);
          }
        }
        if (ai < this.currentDrag.index && ai > index) {
          if (vertical) {
            collection[ai].offsetDrag(this.currentDrag.offsetWidth);
          } else {
            collection[ai].offsetDrag(this.currentDrag.offsetHeight);
          }
        }
      }
      if (this.currentDrag.index > index) {
        if (vertical) {
          if (layer > this.currentDrag.offsetWidth / 2) {
            this.currentDrag.newIndex = index + 1;
          } else {
            this.currentDrag.newIndex = index;
            collection[index].offsetDrag(this.currentDrag.offsetWidth);
          }
        } else {
          if (layer > this.currentDrag.offsetHeight / 2) {
            this.currentDrag.newIndex = index + 1;
          } else {
            this.currentDrag.newIndex = index;
            collection[index].offsetDrag(this.currentDrag.offsetHeight);
          }
        }
      }

      if (this.currentDrag.index < index) {
        if (vertical) {
          if (layer < this.currentDrag.offsetWidth / 2) {
            this.currentDrag.newIndex = index - 1;
          } else {
            this.currentDrag.newIndex = index;
            collection[index].offsetDrag(-this.currentDrag.offsetWidth);
          }
        } else {
          if (layer < this.currentDrag.offsetHeight / 2) {
            this.currentDrag.newIndex = index - 1;
          } else {
            this.currentDrag.newIndex = index;
            collection[index].offsetDrag(-this.currentDrag.offsetHeight);
          }
        }
      }
    }
  }
  onResize(name: string) {
    const fontSize = this.collections[name].getFontSize();
    const width = this.collections[name].getWidth();
    let allColsWidth = 0;

    this.collectionColumnsHead
      .sort(
        (a, b) =>
          this.settingsService.getColumnPriority(a.rwSortTableColumnHead) -
          this.settingsService.getColumnPriority(b.rwSortTableColumnHead),
      )
      .filter(
        (c) =>
          this.settingsService.getColumnPriority(c.rwSortTableColumnHead) !==
          -1,
      )
      .forEach((c) => {
        const style = this.settingsService.getColumnStyle(
          c.rwSortTableColumnHead,
          false,
        );
        if (style.flexBasis.includes('em')) {
          allColsWidth += parseFloat(style.flexBasis.replace('em', '')) || 0;
        }
        if (allColsWidth * fontSize * 2.3 > width) {
          this.collectionColumns[c.columnId]?.forEach((c) => c?.hide());
          this.collectionColumnsHeadMap[c.columnId]?.hide();
        } else {
          this.collectionColumns[c.columnId]?.forEach((c) => c?.show());
          this.collectionColumnsHeadMap[c.columnId]?.show();
        }
      });
  }
}
