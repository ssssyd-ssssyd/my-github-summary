import {
  CUSTOM_ELEMENTS_SCHEMA,
  Component,
  OnDestroy,
  OnInit,
  signal,
} from '@angular/core';
import { GithubService } from '../../services/github.service';
import Chart, { ChartData } from 'chart.js/auto';
import { forkJoin } from 'rxjs';
import { Router } from '@angular/router';
import { ToastService } from '../../modules/shared/services/toast.service';
import ChartDataLabels from 'chartjs-plugin-datalabels';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
})
export class DashboardComponent implements OnInit, OnDestroy {
  constructor(
    private githubService: GithubService,
    private router: Router,
    private toastService: ToastService
  ) {}
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
  private autoRefreshInterval: any;
  private userData: any;
  private barChart: Chart | undefined;
  private pieChart: Chart | undefined;
  private repositories: any[] = [];

  ngOnInit(): void {
    this.initializeUserData();
    this.fetchProgrammingLanguages();
    this.startAutoRefresh();
  }

  ngOnDestroy(): void {
    if (this.autoRefreshInterval) {
      clearInterval(this.autoRefreshInterval);
    }
  }

  public onMyCommitsClicked() {
    this.router.navigate(['/myCommits'], {
      state: { userData: this.userData, repositories: this.repositories },
    });
  }

  // private aggregateMonthlyCommits(): void {
  //   const repositories = this.repositories;
  //   const monthlyCommitCounts: { [key: string]: number } = {};
  //   const currentDate = new Date();
  //   const last12Months = Array.from({ length: 12 })
  //     .map((_, index) => {
  //       const date = new Date();
  //       date.setMonth(currentDate.getMonth() - index);
  //       return date.toLocaleString('default', {
  //         month: 'short',
  //         year: 'numeric',
  //       });
  //     })
  //     .reverse();

  //   repositories.forEach((repo) => {
  //     this.githubService
  //       .fetchListOfCommits(this.userData.login, repo.name)
  //       .subscribe({
  //         next: (commits) => {
  //           commits.forEach((commit: any) => {
  //             const commitDate = new Date(commit.commit.author.date);
  //             const monthYear = commitDate.toLocaleString('default', {
  //               month: 'short',
  //               year: 'numeric',
  //             });

  //             if (last12Months.includes(monthYear)) {
  //               monthlyCommitCounts[monthYear] =
  //                 (monthlyCommitCounts[monthYear] || 0) + 1;
  //             }
  //           });

  //           console.log('Monthly Commit Counts:', monthlyCommitCounts);

  //           this.updateBarChartData(monthlyCommitCounts, last12Months);
  //         },
  //         error: (err) => {
  //           console.error(
  //             `Error fetching commits for repository ${repo.name}:`,
  //             err
  //           );
  //         },
  //       });
  //   });
  // }

  private aggregateMonthlyCommits(): void {
    const last12Months = this.getLast12Months();
    const commitRequests = this.repositories.map((repo) =>
      this.githubService.fetchListOfCommits(this.userData.login, repo.name)
    );

    forkJoin(commitRequests).subscribe({
      next: (commitResponses) => {
        const monthlyCommitCounts = this.calculateMonthlyCommits(
          commitResponses,
          last12Months
        );
        this.updateBarChartData(monthlyCommitCounts, last12Months);
      },
      error: (err) => {
        console.error('Error fetching commit data:', err);
      },
    });
  }

  private getLast12Months(): string[] {
    const currentDate = new Date();
    return Array.from({ length: 12 }, (_, index) => {
      const date = new Date();
      date.setMonth(currentDate.getMonth() - index);
      return date.toLocaleString('default', {
        month: 'short',
        year: 'numeric',
      });
    }).reverse();
  }

  private calculateMonthlyCommits(
    commitResponses: any[][],
    last12Months: string[]
  ): { [key: string]: number } {
    const monthlyCommitCounts: { [key: string]: number } = {};

    commitResponses.forEach((commits) => {
      commits.forEach((commit: any) => {
        const commitDate = new Date(commit.commit.author.date);
        const monthYear = commitDate.toLocaleString('default', {
          month: 'short',
          year: 'numeric',
        });

        if (last12Months.includes(monthYear)) {
          monthlyCommitCounts[monthYear] =
            (monthlyCommitCounts[monthYear] || 0) + 1;
        }
      });
    });

    return monthlyCommitCounts;
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

  private fetchProgrammingLanguages(): void {
    this.githubService.fetchRepositories(this.userData.login).subscribe({
      next: (repos) => {
        this.repositories = repos;
        this.aggregateMonthlyCommits();
        this.fetchLanguagesForRepositories(repos);
      },
      error: (err) => console.error('Error fetching repositories:', err),
    });
  }

  private fetchLanguagesForRepositories(repositories: any[]): void {
    const languageRequests = repositories.map((repo) =>
      this.githubService.fetchProgrammingLanguages(repo.owner.login, repo.name)
    );

    forkJoin(languageRequests).subscribe({
      next: (languagesArray) => {
        const aggregatedLanguages = this.aggregateLanguageData(languagesArray);
        this.updatePieChartData(aggregatedLanguages);
        this.renderPieChart();
      },
      error: (err) =>
        console.error('Error fetching programming languages:', err),
    });
  }

  private aggregateLanguageData(
    languagesArray: Array<{ [key: string]: number }>
  ): { [key: string]: number } {
    const languageData: { [key: string]: number } = {};

    languagesArray.forEach((languages) => {
      Object.entries(languages).forEach(([language, value]) => {
        languageData[language] = (languageData[language] || 0) + Number(value);
      });
    });

    return languageData;
  }

  // private fetchProgrammingLanguages() {
  //   this.githubService.fetchRepositories('ssssyd-ssssyd').subscribe((repos) => {
  //     this.repositories = repos;
  //     this.aggregateMonthlyCommits();
  //     const languageData: { [key: string]: number } = {};
  //     const languageRequests = repos.map((repo) =>
  //       this.githubService.fetchProgrammingLanguages(
  //         repo.owner.login,
  //         repo.name
  //       )
  //     );

  //     forkJoin(languageRequests).subscribe({
  //       next: (languagesArray) => {
  //         languagesArray.forEach((languages) => {
  //           Object.entries(languages).forEach(([language, value]) => {
  //             languageData[language] =
  //               (languageData[language] || 0) + Number(value);
  //           });
  //         });

  //         this.updatePieChartData(languageData);
  //         this.renderPieChart();
  //       },
  //       error: (err) =>
  //         console.error('Error fetching programming languages:', err),
  //     });
  //   });
  // }

  private updateBarChartData(
    monthlyCommitCounts: { [key: string]: number },
    last12Months: string[]
  ): void {
    const labels = last12Months;
    const data = labels.map((monthYear) => monthlyCommitCounts[monthYear] || 0);

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

    this.renderBarChart();
  }

  private renderBarChart(): void {
    const barChartCanvas = document.getElementById(
      'commitBarChart'
    ) as HTMLCanvasElement;

    if (this.barChart) {
      this.barChart.destroy();
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
            grid: {
              display: false,
            },
            title: {
              display: false,
              text: 'Number of Commits',
            },
          },
          y: {
            grid: {
              display: false,
            },
            title: {
              display: true,
              text: 'Months',
            },
            beginAtZero: true,
          },
        },
        layout: {
          padding: 40,
        },
      },
    });
  }

  private renderPieChart(): void {
    const pieChartCanvas = document.getElementById(
      'languagePieChart'
    ) as HTMLCanvasElement;

    if (this.pieChart) {
      this.pieChart.destroy();
    }

    this.pieChart = new Chart(pieChartCanvas, {
      type: 'pie',
      data: this.chartData as ChartData<'pie'>,
      options: {
        plugins: {
          legend: {
            display: true,
            position: 'bottom',
            labels: {
              generateLabels: (chart) => {
                const data = chart.data;

                if (
                  !data.labels ||
                  !data.datasets ||
                  !data.datasets[0].data ||
                  !Array.isArray(data.datasets[0].backgroundColor)
                ) {
                  return [];
                }

                const backgroundColor = data.datasets[0]
                  .backgroundColor as string[];

                const total = (data.datasets[0].data as number[]).reduce(
                  (sum, value) => sum + (value || 0),
                  0
                );

                return data.labels.map((label, index) => {
                  const value = (data.datasets[0].data[index] || 0) as number;
                  const percentage = Math.round((value / total) * 100);

                  return {
                    text: `${label} (${percentage}%)`,
                    fillStyle: backgroundColor[index],
                    strokeStyle: backgroundColor[index],
                    lineWidth: 1,
                    hidden: false,
                    index: index,
                  };
                });
              },
            },
          },
        },
        layout: {
          padding: 20,
        },
      },
    });
  }

  private updatePieChartData(languageData: { [key: string]: number }): void {
    const total = Object.values(languageData).reduce(
      (sum, value) => sum + value,
      0
    );

    this.languagePercentages = Object.fromEntries(
      Object.entries(languageData).map(([language, value]) => [
        language,
        Number(((value / total) * 100).toFixed(2)),
      ])
    );

    this.chartData = {
      labels: Object.keys(this.languagePercentages),
      datasets: [
        {
          data: Object.values(this.languagePercentages),
          backgroundColor: [
            '#FF6384',
            '#36A2EB',
            '#FFCE56',
            '#4BC0C0',
            '#9966FF',
            '#FF9F40',
            '#66FF66',
            '#FF66B2',
            '#AABBCC',
            '#DDEEFF',
            '#112233',
            '#445566',
          ],
        },
      ],
    };
  }

  private initializeUserData(): void {
    this.userData = history.state.userData;
    this.numberOfProjects.set(this.userData.public_repos);
    this.followers.set(this.userData.followers);
    this.following.set(this.userData.following);
  }

  private startAutoRefresh(): void {
    this.autoRefreshInterval = setInterval(() => {
      this.fetchProgrammingLanguages();
      this.toastService.displayToast(
        'information',
        'Data Refreshed',
        'Dashboard data has been updated.'
      );
    }, 15 * 60 * 1000);
  }
}
