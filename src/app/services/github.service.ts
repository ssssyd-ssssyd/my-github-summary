import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class GithubService {
  private apiUrl = 'https://api.github.com';
  constructor(private http: HttpClient) {}

  authenticateUser(token: string): Observable<any> {
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });
    return this.http.get(`${this.apiUrl}/user`, { headers });
  }

  fetchRepositories(username: string): Observable<any[]> {
    const url = `${this.apiUrl}/users/${username}/repos`;
    return this.http.get<any[]>(url);
  }

  fetchCommitActivity(owner: string, repo: string): Observable<any[]> {
    const url = `${this.apiUrl}/repos/${owner}/${repo}/stats/commit_activity`;
    return this.http.get<any[]>(url);
  }
}
