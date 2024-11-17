import { CUSTOM_ELEMENTS_SCHEMA, Component, OnInit } from '@angular/core';
import { GithubService } from '../../services/github.service';
import Chart, { ChartData } from 'chart.js/auto';
import { forkJoin } from 'rxjs';
import { Router } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
})
export class DashboardComponent implements OnInit {
  constructor(private githubService: GithubService, private router: Router) {}
  public numberOfProjects: number = 0;
  public followers: number = 0;
  public following: number = 0;
  public chartData: {
    labels: string[];
    datasets: { data: number[]; backgroundColor: string[] }[];
  } = {
    labels: [],
    datasets: [
      {
        data: [],
        backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0'],
      },
    ],
  };
  public totalLanguages: { [key: string]: number } = {};
  public languagePercentages: { [key: string]: number } = {};
  private userData: any;
  private chart: Chart | undefined;
  private repositories: any;
  ngOnInit(): void {
    this.userData = history.state.userData;
    this.numberOfProjects = this.userData.public_repos;
    this.followers = this.userData.followers;
    this.following = this.userData.following;
    // console.log(this.userData);
    this.fetchProgrammingLanguages();
  }

  public onMyCommitsClicked() {
    this.router.navigate(['/myCommits'], {
      state: { userData: this.userData, repositories: this.repositories },
    });
  }

  // private fetchRepositories() {
  //   this.githubService.fetchRepositories('ssssyd-ssssyd').subscribe((repos) => {

  //     repos.map((repo) => {
  //       this.githubService
  //         .fetchCommitActivity(repo.owner.login, repo.name)
  //         .subscribe(console.log);
  //     });
  //   });
  //   // ******
  //   this.githubService.fetchRepositories('ssssyd-ssssyd').subscribe({
  //     next: (repos) => {
  //       this.repositories = repos;
  //       // Prepare API calls for commit activity for each repository
  //       const commitRequests = repos.map(
  //         (repo) =>
  //           this.githubService
  //             .fetchCommitActivity(repo.owner.login, repo.name)
  //             .pipe() // Additional processing can be done here if needed
  //       );
  //       // Execute all requests in parallel
  //       forkJoin(commitRequests).subscribe({
  //         next: (commitResponses) => {
  //           this.commitActivity = commitResponses.map((commits, index) => {
  //             const totalCommits = commits
  //               ? commits.reduce((sum, week) => sum + week.total, 0)
  //               : 0;
  //             return {
  //               repoName: this.repositories[index].name,
  //               totalCommits,
  //             };
  //           });
  //           console.log('Commit Activity:', this.commitActivity);
  //         },
  //         error: (err) => console.error('Error fetching commit activity:', err),
  //       });
  //     },
  //     error: (err) => console.error('Error fetching repositories:', err),
  //   });
  // }

  // private fetchProgrammingLanguages() {
  //   // this.githubService.fetchRepositories('ssssyd-ssssyd').subscribe((repos) => {
  //   //   repos.map((repo) => {
  //   //     this.githubService
  //   //       .fetchProgrammingLanguages(repo.owner.login, repo.name)
  //   //       .subscribe(console.log);
  //   //   });
  //   // });

  //   this.githubService.fetchRepositories('ssssyd-ssssyd').subscribe((repos) => {
  //     const languageData: { [key: string]: number } = {};
  //     repos.map((repo) => {
  //       this.githubService
  //         .fetchProgrammingLanguages(repo.owner.login, repo.name)
  //         .subscribe((languages) => {
  //           Object.entries(languages).forEach(([language, value]) => {
  //             languageData[language] =
  //               (languageData[language] || 0) + Number(value);
  //           });
  //           console.log(languageData);
  //         });
  //     });
  //     this.updateChartData(languageData);
  //   });
  // }

  private fetchProgrammingLanguages() {
    this.githubService.fetchRepositories('ssssyd-ssssyd').subscribe((repos) => {
      this.repositories = repos;
      const languageData: { [key: string]: number } = {};
      const languageRequests = repos.map(
        (repo) =>
          this.githubService
            .fetchProgrammingLanguages(repo.owner.login, repo.name)
            .pipe() // Add error handling if needed
      );

      // Wait for all language data to be fetched
      forkJoin(languageRequests).subscribe({
        next: (languagesArray) => {
          languagesArray.forEach((languages) => {
            Object.entries(languages).forEach(([language, value]) => {
              languageData[language] =
                (languageData[language] || 0) + Number(value);
            });
          });

          // Update chart data and render the chart
          this.updateChartData(languageData);
          this.renderChart();
        },
        error: (err) =>
          console.error('Error fetching programming languages:', err),
      });
    });
  }

  private updateChartData(languageData: { [key: string]: number }): void {
    // Calculate total sum of all languages
    const total = Object.values(languageData).reduce(
      (sum, value) => sum + value,
      0
    );

    // Calculate percentages for each language
    this.languagePercentages = Object.fromEntries(
      Object.entries(languageData).map(([language, value]) => [
        language,
        Number(((value / total) * 100).toFixed(2)),
      ])
    );

    // Prepare data for the chart
    this.chartData = {
      labels: Object.keys(this.languagePercentages),
      datasets: [
        {
          data: Object.values(this.languagePercentages),
          backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0'], // Add more colors if needed
        },
      ],
    };
  }

  private renderChart(): void {
    const ctx = document.getElementById(
      'languagePieChart'
    ) as HTMLCanvasElement;

    if (this.chart) {
      this.chart.destroy();
    }

    this.chart = new Chart(ctx, {
      type: 'pie',
      data: this.chartData as ChartData<'pie'>,
      options: {
        plugins: {
          legend: {
            display: true,
            position: 'bottom',
          },
        },
      },
    });
  }
}
