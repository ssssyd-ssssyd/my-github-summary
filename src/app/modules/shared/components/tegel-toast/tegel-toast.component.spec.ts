import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TegelToastComponent } from './tegel-toast.component';

describe('TegelToastComponent', () => {
  let component: TegelToastComponent;
  let fixture: ComponentFixture<TegelToastComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TegelToastComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TegelToastComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
