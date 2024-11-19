import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, tap } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class GithubService {
  private apiUrl = 'https://api.github.com';
  private token: string | null = null;
  constructor(private http: HttpClient) {}

  authenticateUser(token: string): Observable<any> {
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });
    return this.http.get(`${this.apiUrl}/user`, { headers }).pipe(
      tap(() => {
        this.token = token;
      })
    );
  }

  private getHeaders(): HttpHeaders {
    if (!this.token) {
      throw new Error(
        'Authentication token is not set. Please authenticate first.'
      );
    }
    return new HttpHeaders({
      Authorization: `Bearer ${this.token}`,
    });
  }

  fetchRepositories(username: string): Observable<any[]> {
    const headers = this.getHeaders();
    const url = `${this.apiUrl}/users/${username}/repos`;
    return this.http.get<any[]>(url, { headers });
  }

  fetchCommitActivity(owner: string, repo: string): Observable<any[]> {
    const headers = this.getHeaders();
    const url = `${this.apiUrl}/repos/${owner}/${repo}/stats/commit_activity`;
    return this.http.get<any[]>(url, { headers });
  }

  fetchProgrammingLanguages(owner: string, repo: string): Observable<any> {
    const headers = this.getHeaders();
    const url = `${this.apiUrl}/repos/${owner}/${repo}/languages`;
    return this.http.get<any>(url, { headers });
  }

  fetchListOfCommits(owner: string, repo: string): Observable<any[]> {
    const headers = this.getHeaders();
    const url = `${this.apiUrl}/repos/${owner}/${repo}/commits`;
    return this.http.get<any[]>(url, { headers });
  }
}
