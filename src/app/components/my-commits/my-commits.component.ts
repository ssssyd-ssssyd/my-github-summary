import {
  CUSTOM_ELEMENTS_SCHEMA,
  Component,
  OnInit,
  signal,
} from '@angular/core';
import { GithubService } from '../../services/github.service';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { formatDistanceToNow } from 'date-fns';

@Component({
  selector: 'app-my-commits',
  standalone: true,
  imports: [ReactiveFormsModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './my-commits.component.html',
  styleUrl: './my-commits.component.css',
})
export class MyCommitsComponent implements OnInit {
  constructor(private githubService: GithubService) {}
  public commitFilterInput = new FormControl<string>('');

  public repositories = signal<any[]>([]); // Signal for repositories
  public userData = signal<any>(null); // Signal for user data
  public commitList = signal<any[]>([]); // Signal for commit list
  public sortedDates = signal<string[]>([]); // Signal for grouped commits
  public sortedGroupedCommits = signal<{ [key: string]: any[] }>({}); // Signal for grouped commits
  // public groupedCommitDates = signal<string[]>([]); // Signal for grouped dates
  ngOnInit(): void {
    this.repositories.set(history.state.repositories);
    this.userData.set(history.state.userData);

    this.commitFilterInput.valueChanges.subscribe((filterValue) => {
      this.filterCommits(filterValue || '');
    });
  }

  public onRepoChange(event: any) {
    this.fetchCommitsForRepo(event.detail.value);
  }

  public formatRelativeTime(dateString: string): string {
    return formatDistanceToNow(new Date(dateString), { addSuffix: true });
  }

  public formatDate(dateString: string): string {
    const today = new Date();
    const givenDate = new Date(dateString);

    // Check if the date is today
    const isToday = today.toDateString() === givenDate.toDateString();

    // If the date is today, prepend "Today"
    if (isToday) {
      return `Today, ${givenDate.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      })}`;
    }

    // Otherwise, format with full month name and day
    return givenDate.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
    });
  }

  private fetchCommitsForRepo(repoName: string): void {
    this.githubService
      .fetchListOfCommits(this.userData().login, repoName)
      .subscribe({
        next: (commits) => {
          this.sortedGroupedCommits.set(
            this.groupAndSortCommitsByDate(commits)
          );
          this.commitList.set(commits);
          this.filterCommits(this.commitFilterInput.value || '');
          console.log(this.commitList());
        },
        error: (err) => console.error('Error fetching commits:', err),
      });
  }

  private groupAndSortCommitsByDate(commitList: any[]): {
    [key: string]: any[];
  } {
    const groupedCommits = commitList.reduce(
      (groups: { [key: string]: any[] }, commit: any) => {
        const commitDate = new Date(commit.commit.author.date);
        const formattedDate = commitDate.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        });
        if (!groups[formattedDate]) {
          groups[formattedDate] = [];
        }
        groups[formattedDate].push(commit);
        return groups;
      },
      {}
    );

    return this.sortGroupedCommits(groupedCommits);
  }

  private sortGroupedCommits(groupedCommits: { [key: string]: any[] }): {
    [key: string]: any[];
  } {
    this.sortedDates.set(
      Object.keys(groupedCommits).sort((a, b) => {
        const dateA = Date.parse(a);
        const dateB = Date.parse(b);
        return dateB - dateA; // Descending order
      })
    );

    const sortedGroupedCommits: { [key: string]: any[] } = {};
    this.sortedDates().forEach((date) => {
      sortedGroupedCommits[date] = groupedCommits[date];
    });

    return sortedGroupedCommits;
  }

  private filterCommits(filterValue: string): void {
    // Filter commits based on the commit message
    const filtered = this.commitList().filter((commit) =>
      commit.commit.message.toLowerCase().includes(filterValue.toLowerCase())
    );

    // Update grouped commits after filtering
    this.sortedGroupedCommits.set(this.groupAndSortCommitsByDate(filtered));
    console.log('Updated Grouped Commits:', this.sortedGroupedCommits());
  }
}
