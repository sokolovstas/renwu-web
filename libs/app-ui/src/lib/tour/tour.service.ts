import { inject, Injectable } from '@angular/core';
import { RwTooltipService } from '@renwu/components';

import { IStepOption, TourService } from 'ngx-ui-tour-core';
import { TourHintComponent } from './tour-hint/tour-hint.component';

export interface TourSettings {
  path: string;
  stepSettings: IStepOption;
  relative: string;
}

const defaultSettings: TourSettings = {
  path: 'assets/tour.json',
  stepSettings: {
    enableBackdrop: true,
    backdropConfig: {
      offset: 2,
      zIndex: '500',
    },
  },
  relative: '',
};

@Injectable({
  providedIn: 'root',
})
export class RenwuTourService {
  tour = inject(TourService);
  tooltipService = inject(RwTooltipService);

  constructor() {
    this.tour.end$.subscribe(() => this.tooltipService.removeAll());
    this.tour.stepShow$.subscribe((s) => {
      const stepIndex = this.tour.steps?.indexOf(s.step) + 1;
      this.tooltipService.place(
        this.tooltipService.addWithType(TourHintComponent, {
          title: s.step.title,
          text: s.step.content,
          onNext: () => {
            this.tooltipService.removeAll();
            setTimeout(() => {
              if (stepIndex === this.tour.steps.length) {
                this.tour.end();
              } else {
                this.tour.next();
              }
            }, 200);
          },
          onEnd: () => {
            this.tooltipService.removeAll();
            this.tour.end();
          },
          onPrev: () => {
            this.tooltipService.removeAll();
            this.tour.prev();
          },
          totalSteps: this.tour.steps.length,
          step: stepIndex,
        }),
        this.tour.anchors[s.step.anchorId].element.nativeElement,
        { placements: 'bottom' },
      );
      // setTimeout(() => {
      //   tour.next();
      // }, 1000);
    });
  }

  async runTour(settings: Partial<TourSettings>) {
    settings = { ...defaultSettings, ...settings };

    this.tour.initialize(
      await fetch(new URL(settings.path, settings.relative).toString())
        .then((v) => v.json())
        .catch(() => []),
      settings.stepSettings,
    );
    setTimeout(() => {
      this.tour.start();
    }, 1000);
    return settings;
  }
}
