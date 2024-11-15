import {
  Directive,
  ElementRef,
  HostBinding,
  Input,
  OnDestroy,
  OnInit,
  inject,
} from '@angular/core';
import {
  IStepOption,
  TourAnchorDirective,
  TourService,
} from 'ngx-ui-tour-core';

@Directive({
  selector: '[renwuTourAnchor]',
  standalone: true,
})
export class RenwuTourAnchorDirective
  implements OnInit, OnDestroy, TourAnchorDirective
{
  private readonly tourService = inject(TourService);
  public readonly element = inject(ElementRef);

  @Input() public renwuTourAnchor: string;

  @HostBinding('class.touranchor--is-active')
  public isActive = false;

  public ngOnInit(): void {
    this.tourService.register(this.renwuTourAnchor, this);
  }

  public ngOnDestroy(): void {
    this.tourService.unregister(this.renwuTourAnchor);
  }

  public showTourStep(step: IStepOption): void {
    this.isActive = true;

    console.group(step.title);
    console.log(step.content);
    console.log(`Anchor id: ${this.renwuTourAnchor}`);
    console.groupEnd();
  }

  public hideTourStep(): void {
    this.isActive = false;
  }
}
