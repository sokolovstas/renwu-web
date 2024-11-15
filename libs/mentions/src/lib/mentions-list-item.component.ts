import {
  AfterViewInit,
  Component,
  ComponentFactoryResolver,
  ComponentRef,
  Input,
  OnChanges,
  SimpleChanges,
  Type,
  ViewChild,
  ViewContainerRef,
} from '@angular/core';
import { MentionsListItem } from './mentions-config';

@Component({
  selector: 'rw-mentions-list-item',
  standalone: true,
  styleUrl: './mentions-list-item.component.scss',
  template: `
    <li class="mention-list-item">
      <ng-container #itemComponentViewRef></ng-container>
    </li>
  `,
})
export class BaseMentionsListItemComponent<T>
  implements AfterViewInit, OnChanges
{
  @Input()
  labelKey = 'label';

  @Input()
  item: T;

  @Input()
  active: boolean;

  @ViewChild('itemComponentViewRef', { read: ViewContainerRef })
  itemComponentViewRef: ViewContainerRef;

  @Input()
  itemComponent: Type<MentionsListItem<T>>;

  componentRef: ComponentRef<MentionsListItem<T>>;

  constructor(private componentResolver: ComponentFactoryResolver) {}

  ngAfterViewInit(): void {
    if (this.itemComponent) {
      const componentFactory = this.componentResolver.resolveComponentFactory(
        this.itemComponent,
      );
      this.componentRef =
        this.itemComponentViewRef.createComponent(componentFactory);
      this.componentRef.instance.item = this.item;
      this.componentRef.instance.active = this.active;
      this.componentRef.changeDetectorRef.detectChanges();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (this.componentRef?.instance) {
      if (changes['item']) {
        this.componentRef.instance.item = this.item;
      }
      if (changes['active']) {
        this.componentRef.instance.active = this.active;
      }
      this.componentRef.changeDetectorRef.detectChanges();
    }
  }
}
