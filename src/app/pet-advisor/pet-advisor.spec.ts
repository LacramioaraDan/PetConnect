import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PetAdvisor } from './pet-advisor';

describe('PetAdvisor', () => {
  let component: PetAdvisor;
  let fixture: ComponentFixture<PetAdvisor>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PetAdvisor]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PetAdvisor);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
