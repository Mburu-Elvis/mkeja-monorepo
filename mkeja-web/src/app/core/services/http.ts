import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { getStorageItem } from '../utils/storage';

@Injectable({
  providedIn: 'root'
})
export class HttpService {
  private baseUrl = environment.apiBaseUrl;

  constructor(private http: HttpClient) {}

  private getHeaders(includeJson = true): HttpHeaders {
    const token = getStorageItem('access_token');
    let headers = new HttpHeaders({
      'Authorization': `Bearer ${token || ''}`,
      'X-Request-Id': this.generateRequestId()
    });
    if (includeJson) {
      headers = headers.set('Content-Type', 'application/json');
    }
    return headers;
  }

  private generateRequestId(): string {
    return `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private handleError(error: any) {
    console.error('API Error:', error);
    let message = error?.error?.message || error.message || 'An unexpected error occurred';
    if (error?.status === 0) {
      message = 'Cannot reach the server. Ensure the API is running and try again.';
    }
    return throwError(() => new Error(message));
  }

  get<T>(endpoint: string, params?: any): Observable<T> {
    let httpParams = new HttpParams();
    if (params) {
      Object.keys(params).forEach(key => {
        if (params[key] !== undefined && params[key] !== null) {
          httpParams = httpParams.set(key, params[key]);
        }
      });
    }

    return this.http
      .get<T>(`${this.baseUrl}${endpoint}`, {
        headers: this.getHeaders(),
        params: httpParams
      })
      .pipe(catchError(this.handleError));
  }

  getPublic<T>(endpoint: string, params?: any): Observable<T> {
    let httpParams = new HttpParams();
    if (params) {
      Object.keys(params).forEach(key => {
        if (params[key] !== undefined && params[key] !== null) {
          httpParams = httpParams.set(key, params[key]);
        }
      });
    }

    return this.http
      .get<T>(`${this.baseUrl}${endpoint}`, {
        headers: new HttpHeaders({
          'X-Request-Id': this.generateRequestId()
        }),
        params: httpParams
      })
      .pipe(catchError(this.handleError));
  }

  getBlob(endpoint: string): Observable<Blob> {
    return this.http
      .get(`${this.baseUrl}${endpoint}`, {
        headers: this.getHeaders(false),
        responseType: 'blob'
      })
      .pipe(catchError(this.handleError));
  }

  post<T>(endpoint: string, data: any): Observable<T> {
    return this.http
      .post<T>(`${this.baseUrl}${endpoint}`, data, {
        headers: this.getHeaders()
      })
      .pipe(catchError(this.handleError));
  }

  postPublic<T>(endpoint: string, data: any): Observable<T> {
    return this.http
      .post<T>(`${this.baseUrl}${endpoint}`, data, {
        headers: new HttpHeaders({
          'Content-Type': 'application/json',
          'X-Request-Id': this.generateRequestId()
        })
      })
      .pipe(catchError(this.handleError));
  }

  postPublicMultipart<T>(endpoint: string, formData: FormData): Observable<T> {
    return this.http
      .post<T>(`${this.baseUrl}${endpoint}`, formData, {
        headers: new HttpHeaders({
          'X-Request-Id': this.generateRequestId()
        })
      })
      .pipe(catchError(this.handleError));
  }

  postMultipart<T>(endpoint: string, formData: FormData): Observable<T> {
    return this.http
      .post<T>(`${this.baseUrl}${endpoint}`, formData, {
        headers: this.getHeaders(false)
      })
      .pipe(catchError(this.handleError));
  }

  put<T>(endpoint: string, data: any): Observable<T> {
    return this.http
      .put<T>(`${this.baseUrl}${endpoint}`, data, {
        headers: this.getHeaders()
      })
      .pipe(catchError(this.handleError));
  }

  patch<T>(endpoint: string, data: any): Observable<T> {
    return this.http
      .patch<T>(`${this.baseUrl}${endpoint}`, data, {
        headers: this.getHeaders()
      })
      .pipe(catchError(this.handleError));
  }

  delete<T>(endpoint: string): Observable<T> {
    return this.http
      .delete<T>(`${this.baseUrl}${endpoint}`, {
        headers: this.getHeaders()
      })
      .pipe(catchError(this.handleError));
  }
}
