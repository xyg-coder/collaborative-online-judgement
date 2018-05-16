import { Injectable } from '@angular/core';
import {BehaviorSubject} from 'rxjs/BehaviorSubject';
import {Problem} from '../models/problem.model';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import {Observable} from 'rxjs/Observable';

@Injectable()
export class DataService {

  private problemSource = new BehaviorSubject<Problem[]>([]);
  constructor(private http: HttpClient) { }

  getProblems(): Observable<Problem[]> {
    this.http.get('api/v1/problems')
      .toPromise()
      .then((res: any) => this.problemSource.next(res))
      .catch(this.handleError);
    return this.problemSource.asObservable();
  }

  getProblem(id: number): Promise<Problem> {
    return this.http.get(`api/v1/problems/${id}`)
      .toPromise()
      .then((res: Response) => res)
      .catch(this.handleError);
  }

  addProblem(problem: Problem): Promise<Problem> {
  const options = { headers: new HttpHeaders({ 'Content-Type': 'application/json' }) };
    return this.http.post('api/v1/problems', problem, options)
      .toPromise()
      .then((res: Response) => {
        this.getProblems();
        return res;
      }).catch(this.handleError);
  }

  buildAndRun(data): Promise<Object> {
    const options = { headers: new HttpHeaders({ 'Content-Type': 'application/json' }) };
    return this.http.post('api/v1/build_and_run', data, options)
      .toPromise()
      .then((res: Response) => {
        console.log(res);
        return res;
      }).catch(this.handleError);
  }

  private handleError(error: any): Promise<any> {
    console.error('An error occurred', error);
    return Promise.reject(error.body || error);
  }
}
