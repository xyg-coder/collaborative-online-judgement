import {Component, Inject, OnDestroy, OnInit} from '@angular/core';
import {Problem} from '../../models/problem.model';
import {Subscription} from 'rxjs/Subscription';

@Component({
  selector: 'app-problem-list',
  templateUrl: './problem-list.component.html',
  styleUrls: ['./problem-list.component.css']
})
export class ProblemListComponent implements OnInit, OnDestroy {

  problems: Problem[] = [];
  subscriptionProblems: Subscription;

  searchTerm = '';
  subscriptionInput: Subscription;

  constructor(@Inject('data') private data,
              @Inject('input') private input) { }

  ngOnInit() {
    this.getProblems();
    this.getInput();
  }

  getInput(): void {
    this.subscriptionInput = this.input.getInput()
      .subscribe(inputTerm => this.searchTerm = inputTerm);
  }

  getProblems(): void {
    this.subscriptionProblems = this.data.getProblems()
      .subscribe(problems => this.problems = problems);
  }

  ngOnDestroy() {
    this.subscriptionProblems.unsubscribe();
    this.subscriptionInput.unsubscribe();
  }

}
