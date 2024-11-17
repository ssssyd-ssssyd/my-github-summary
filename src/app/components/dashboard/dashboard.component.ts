import {
  CUSTOM_ELEMENTS_SCHEMA,
  Component,
  OnInit,
  signal,
} from '@angular/core';
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
  public numberOfProjects = signal<number>(0);
  public followers = signal<number>(0);
  public following = signal<number>(0);
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
  public barChartData = signal<{
    labels: string[];
    datasets: {
      label: string;
      data: number[];
      backgroundColor: string;
      borderWidth: number;
    }[];
  }>({
    labels: [],
    datasets: [
      {
        label: 'Commits',
        data: [],
        backgroundColor: '#36A2EB',
        borderWidth: 1,
      },
    ],
  });

  public totalLanguages: { [key: string]: number } = {};
  public languagePercentages: { [key: string]: number } = {};
  private userData: any;
  private barChart: Chart | undefined;
  private pieChart: Chart | undefined;
  private repositories: any[] = [];
  ngOnInit(): void {
    this.userData = history.state.userData;
    this.numberOfProjects.set(this.userData.public_repos);
    this.followers.set(this.userData.followers);
    this.following.set(this.userData.following);
    // console.log(this.userData);
    // this.countCommits();
    this.fetchProgrammingLanguages();
  }

  public onMyCommitsClicked() {
    this.router.navigate(['/myCommits'], {
      state: { userData: this.userData, repositories: this.repositories },
    });
  }

  private countCommits(): void {
    const repositories = this.repositories; // Retrieve the current repositories
    const monthlyCommitCounts: { [key: string]: number } = {}; // Object to store commits per month
    const currentDate = new Date();
    const last12Months = Array.from({ length: 12 })
      .map((_, index) => {
        const date = new Date();
        date.setMonth(currentDate.getMonth() - index);
        return date.toLocaleString('default', {
          month: 'short',
          year: 'numeric',
        });
      })
      .reverse(); // Array of last 12 months in "Month YYYY" format

    repositories.forEach((repo) => {
      this.githubService
        .fetchListOfCommits(this.userData.login, repo.name) // Access `userData.login` directly
        .subscribe({
          next: (commits) => {
            commits.forEach((commit: any) => {
              const commitDate = new Date(commit.commit.author.date);
              const monthYear = commitDate.toLocaleString('default', {
                month: 'short',
                year: 'numeric',
              });

              if (last12Months.includes(monthYear)) {
                // Increment commit count for the month
                monthlyCommitCounts[monthYear] =
                  (monthlyCommitCounts[monthYear] || 0) + 1;
              }
            });

            console.log('Monthly Commit Counts:', monthlyCommitCounts);

            // Update chart data after processing all repositories
            this.updateBarChartData(monthlyCommitCounts, last12Months);
          },
          error: (err) => {
            console.error(
              `Error fetching commits for repository ${repo.name}:`,
              err
            );
          },
        });
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

  private fetchProgrammingLanguages() {
    this.githubService.fetchRepositories('ssssyd-ssssyd').subscribe((repos) => {
      this.repositories = repos;
      this.countCommits();
      const languageData: { [key: string]: number } = {};
      const languageRequests = repos.map((repo) =>
        this.githubService.fetchProgrammingLanguages(
          repo.owner.login,
          repo.name
        )
      );

      forkJoin(languageRequests).subscribe({
        next: (languagesArray) => {
          languagesArray.forEach((languages) => {
            Object.entries(languages).forEach(([language, value]) => {
              languageData[language] =
                (languageData[language] || 0) + Number(value);
            });
          });

          // Update chart data and render the chart
          this.updatePieChartData(languageData);
          this.renderPieChart();
        },
        error: (err) =>
          console.error('Error fetching programming languages:', err),
      });
    });
  }

  private updateBarChartData(
    monthlyCommitCounts: { [key: string]: number },
    last12Months: string[]
  ): void {
    // Prepare labels and data arrays
    const labels = last12Months;
    const data = labels.map((monthYear) => monthlyCommitCounts[monthYear] || 0);

    // Update chart data for bar chart
    this.barChartData.set({
      labels,
      datasets: [
        {
          label: 'Commits',
          data,
          backgroundColor: '#36A2EB',
          borderWidth: 1,
        },
      ],
    });

    this.renderBarChart(); // Call the bar chart rendering function
  }

  private renderBarChart(): void {
    const barChartCanvas = document.getElementById(
      'commitBarChart'
    ) as HTMLCanvasElement;

    if (this.barChart) {
      this.barChart.destroy(); // Destroy the old instance if it exists
    }

    this.barChart = new Chart(barChartCanvas, {
      type: 'bar',
      data: this.barChartData() as ChartData<'bar'>,
      options: {
        responsive: true,
        indexAxis: 'y',
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false,
          },
        },
        scales: {
          x: {
            title: {
              display: true,
              text: 'Months',
            },
          },
          y: {
            title: {
              display: true,
              text: 'Number of Commits',
            },
            beginAtZero: true,
          },
        },
      },
    });
  }

  private renderPieChart(): void {
    const pieChartCanvas = document.getElementById(
      'languagePieChart'
    ) as HTMLCanvasElement;

    if (this.pieChart) {
      this.pieChart.destroy(); // Destroy the old instance if it exists
    }

    this.pieChart = new Chart(pieChartCanvas, {
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

  private updatePieChartData(languageData: { [key: string]: number }): void {
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

  // private renderChart(): void {
  //   const ctx = document.getElementById(
  //     'languagePieChart'
  //   ) as HTMLCanvasElement;

  //   if (this.chart) {
  //     this.chart.destroy();
  //   }

  //   this.chart = new Chart(ctx, {
  //     type: 'pie',
  //     data: this.chartData as ChartData<'pie'>,
  //     options: {
  //       plugins: {
  //         legend: {
  //           display: true,
  //           position: 'bottom',
  //         },
  //       },
  //     },
  //   });
  // }
}
