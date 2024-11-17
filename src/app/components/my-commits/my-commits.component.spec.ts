import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MyCommitsComponent } from './my-commits.component';

describe('MyCommitsComponent', () => {
  let component: MyCommitsComponent;
  let fixture: ComponentFixture<MyCommitsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MyCommitsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MyCommitsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
