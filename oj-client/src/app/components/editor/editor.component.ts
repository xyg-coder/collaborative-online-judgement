import {Component, Inject, OnInit} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {BehaviorSubject} from 'rxjs/BehaviorSubject';

declare var ace: any;

@Component({
  selector: 'app-editor',
  templateUrl: './editor.component.html',
  styleUrls: ['./editor.component.css']
})
export class EditorComponent implements OnInit {



  editor: any;

  languages = ['Java', 'C++', 'Python'];
  language = 'Java';

  sessionId: string;

  output = '';


  defaultContent = {
    'Java':
      `
public class Example {
  public static void main(String[] args) {
    // Type your code here
  }
}`,
    'C++':
      `
#include <iostream>
using namespace std;
int main() {
    //Type your code here
    return 0;
}`,
    'Python':
      `
class Solution:
  def example():
    #write your python code here
    `};

  modeMap = {
    'Java': 'java',
    'C++': 'c_cpp',
    'Python': 'python'
  };
  constructor(@Inject('collaboration') private collaboration,
              private route: ActivatedRoute,
              @Inject('data') private data) { }

   ngOnInit() {
    this.route.params.subscribe(params => {
      this.sessionId = params['id'];
      this.initEditor();
    });

    this.collaboration.getLanguageObservable().subscribe(language => this.language = language);
  }

  initEditor(): void {
    this.editor = ace.edit('editor');
    this.editor.setTheme('ace/theme/eclipse');
    this.editor.$blockScrolling = Infinity;
    this.resetEditor();
    this.collaboration.init(this.sessionId, this.editor);

    document.getElementsByTagName('textarea')[0].focus();

    this.editor.lastAppliedChange = null;

    this.editor.on('change', e => {
      console.log('editor changes: ' + JSON.stringify(e));
      if (this.editor.lastAppliedChange !== e) {
        this.collaboration.change(JSON.stringify(e));
      }
    });

    this.editor.getSession().getSelection().on('changeCursor', () => {
      const cursor = this.editor.getSession().getSelection().getCursor();
      this.collaboration.cursorMove(JSON.stringify(cursor));
    });

    this.collaboration.restoreBuffer();
  }

  setLanguage(language: string): void {
    this.language = language;
    this.collaboration.resetLanguage(this.language);
    this.resetEditor();
  }

  resetEditor(): void {
    this.editor.setValue(this.defaultContent[this.language]);
    this.editor.session.setMode('ace/mode/' + this.modeMap[this.language]);
    this.output = '';
  }

  submit(): void {
    const userCode = this.editor.getValue();
    const data = {
      user_code: userCode,
      lang: this.language.toLowerCase()
    };
    this.data.buildAndRun(data)
      .then(res => {
        this.output = `build result: ${res['build']};
        run result: ${res['run']}`;
      });
  }
}
