import { CUSTOM_ELEMENTS_SCHEMA, Component, OnInit } from '@angular/core';
import { GithubService } from '../../services/github.service';

@Component({
  selector: 'app-my-commits',
  standalone: true,
  imports: [],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './my-commits.component.html',
  styleUrl: './my-commits.component.css',
})
export class MyCommitsComponent implements OnInit {
  constructor(private githubService: GithubService) {}
  public repositories: any;
  public userData: any;
  public commitList: any;
  ngOnInit(): void {
    this.repositories = history.state.repositories;
    this.userData = history.state.userData;
    console.log(this.repositories);
    console.log(this.userData);
  }

  public onRepoChange(event: any) {
    console.log(event);

    this.fetchCommitsForRepo(event.detail.value);
  }

  private fetchCommitsForRepo(repoName: string): void {
    this.githubService
      .fetchListOfCommits(this.userData.login, repoName)
      .subscribe({
        next: (commits) => {
          this.commitList = commits;
          console.log('Commits:', commits);
          // Process and display commits here
        },
        error: (err) => console.error('Error fetching commits:', err),
      });
  }
}
