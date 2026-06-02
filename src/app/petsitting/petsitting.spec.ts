/// <reference types="jasmine" /> 

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PetSitting } from './petsitting';

describe('PetSitting', () => {
  let component: PetSitting;
  let fixture: ComponentFixture<PetSitting>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PetSitting]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PetSitting);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy(); 
  });
});