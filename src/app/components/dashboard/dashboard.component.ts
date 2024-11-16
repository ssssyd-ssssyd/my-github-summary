import { CUSTOM_ELEMENTS_SCHEMA, Component, OnInit } from '@angular/core';
import { GithubService } from '../../services/github.service';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
})
export class DashboardComponent implements OnInit {
  constructor(private githubService: GithubService) {}
  public numberOfProjects: number = 0;
  public followers: number = 0;
  public following: number = 0;
  private userData: any;
  private repositories: any;
  private commitActivity: any;
  ngOnInit(): void {
    this.userData = history.state.userData;
    this.numberOfProjects = this.userData.public_repos;
    this.followers = this.userData.followers;
    this.following = this.userData.following;
    console.log(this.userData);
    this.fetchRepositories();
  }

  private fetchRepositories() {
    this.githubService.fetchRepositories('ssssyd-ssssyd').subscribe((repos) => {
      repos.map((repo) => {
        this.githubService
          .fetchCommitActivity(repo.owner.login, repo.name)
          .subscribe(console.log);
      });
    });
    // ******

    // this.githubService.fetchRepositories('ssssyd-ssssyd').subscribe({
    //   next: (repos) => {
    //     this.repositories = repos;
    //     // Prepare API calls for commit activity for each repository
    //     const commitRequests = repos.map(
    //       (repo) =>
    //         this.githubService
    //           .fetchCommitActivity(repo.owner.login, repo.name)
    //           .pipe() // Additional processing can be done here if needed
    //     );
    //     // Execute all requests in parallel
    //     forkJoin(commitRequests).subscribe({
    //       next: (commitResponses) => {
    //         this.commitActivity = commitResponses.map((commits, index) => {
    //           const totalCommits = commits
    //             ? commits.reduce((sum, week) => sum + week.total, 0)
    //             : 0;
    //           return {
    //             repoName: this.repositories[index].name,
    //             totalCommits,
    //           };
    //         });
    //         console.log('Commit Activity:', this.commitActivity);
    //       },
    //       error: (err) => console.error('Error fetching commit activity:', err),
    //     });
    //   },
    //   error: (err) => console.error('Error fetching repositories:', err),
    // });
  }
}
