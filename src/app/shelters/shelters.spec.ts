import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Shelters } from './shelters';

describe('Shelters', () => {
  let component: Shelters;
  let fixture: ComponentFixture<Shelters>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Shelters]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Shelters);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
