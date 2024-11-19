import {
  CUSTOM_ELEMENTS_SCHEMA,
  Component,
  OnDestroy,
  OnInit,
  signal,
} from '@angular/core';
import { GithubService } from '../../services/github.service';
import Chart, { ChartData } from 'chart.js/auto';
import { forkJoin, take } from 'rxjs';
import { Router } from '@angular/router';
import { ToastService } from '../../modules/shared/services/toast.service';

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
  public totalCommitsThisYear = signal<number>(0);
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
  private autoRefreshInterval: any;
  private userData: any;
  private barChart: Chart | undefined;
  private pieChart: Chart | undefined;
  private repositories: any[] = [];

  ngOnInit(): void {
    this.initializeUserData();
    this.loadDashboardData();
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

  private aggregateMonthlyCommits(): void {
    const currentYear = new Date().getFullYear();
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

        const totalCommitsThisYear = Object.entries(monthlyCommitCounts).reduce(
          (total, [monthYear, count]) => {
            const year = parseInt(monthYear.split(' ')[1], 10);
            return year === currentYear ? total + count : total;
          },
          0
        );

        this.totalCommitsThisYear.set(totalCommitsThisYear);
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

  private loadDashboardData(): void {
    this.githubService
      .fetchRepositories(this.userData.login)
      .pipe(take(1))
      .subscribe({
        next: (repos) => {
          this.repositories = repos;
          this.aggregateMonthlyCommits();
          this.fetchProgrammingLanguages(repos);
        },
        error: (err) => console.error('Error fetching repositories:', err),
      });
  }

  private fetchProgrammingLanguages(repositories: any[]): void {
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
          backgroundColor: this.chartData.datasets[0].backgroundColor[1],
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

    const percentages = Object.entries(languageData).reduce(
      (acc, [language, count]) => {
        acc[language] = Number(((count / total) * 100).toFixed(2));
        return acc;
      },
      {} as Record<string, number>
    );

    this.chartData = {
      labels: Object.keys(percentages),
      datasets: [
        {
          data: Object.values(percentages),
          backgroundColor: this.chartData.datasets[0].backgroundColor,
        },
      ],
    };
  }

  private initializeUserData(): void {
    this.userData = history.state.userData;
    if (this.userData) {
      this.numberOfProjects.set(this.userData.public_repos);
      this.followers.set(this.userData.followers);
      this.following.set(this.userData.following);
    }
  }

  private startAutoRefresh(): void {
    this.autoRefreshInterval = setInterval(() => {
      this.loadDashboardData();
      this.toastService.displayToast(
        'information',
        'Data Refreshed',
        'Dashboard data has been updated.'
      );
    }, 15 * 60 * 1000);
  }
}
