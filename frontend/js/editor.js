/**
 * editor.js — CodeMirror init + multi-language buffer management
 */
window.Editor = (() => {

  const BROWSER_LANGS = new Set(['html', 'css', 'js']);

  const LANG_META = {
    html:       { mode: 'htmlmixed',  label: 'HTML',       hint: 'Runs in browser preview' },
    css:        { mode: 'css',        label: 'CSS',        hint: 'Runs in browser preview' },
    js:         { mode: 'javascript', label: 'JavaScript', hint: 'Runs in browser preview' },
    python:     { mode: 'python',     label: 'Python',     hint: 'Runs via Judge0 server'  },
    typescript: { mode: 'text/typescript', label: 'TypeScript', hint: 'Runs via Judge0'   },
    java:       { mode: 'text/x-java', label: 'Java',     hint: 'Runs via Judge0'         },
    cpp:        { mode: 'text/x-c++src', label: 'C++',    hint: 'Runs via Judge0'         },
    rust:       { mode: 'rust',        label: 'Rust',      hint: 'Runs via Judge0'         },
    go:         { mode: 'go',          label: 'Go',        hint: 'Runs via Judge0'         },
    sql:        { mode: 'sql',         label: 'SQL',       hint: 'Runs via Judge0'         },
  };

  const DEFAULTS = {
    html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>KrestLab</title>
</head>
<body>
  <h1>Hello, KrestLab!</h1>
  <p>Edit HTML, CSS, and JS then click <strong>Run</strong>.</p>
  <button onclick="greet()">Click me</button>
</body>
</html>`,
    css: `body {
  font-family: system-ui, sans-serif;
  padding: 32px;
  background: #f8fafc;
  color: #1e293b;
}
h1 { color: #7c6af7; margin-bottom: 12px; }
button {
  margin-top: 16px; padding: 8px 20px;
  background: #7c6af7; color: #fff;
  border: none; border-radius: 6px; cursor: pointer;
}`,
    js: `function greet() {
  console.log('Hello from KrestLab!');
  console.warn('This is a warning');
  console.error('This is an error');
}`,
    python: `# Python — runs on the server via Judge0
def fibonacci(n):
    a, b = 0, 1
    for _ in range(n):
        print(a, end=' ')
        a, b = b, a + b

fibonacci(10)
print()
print("Hello from KrestLab!")`,
    typescript: `// TypeScript — transpiled and run via Judge0
interface User {
  name: string;
  level: number;
}

function greetUser(user: User): string {
  return \`Welcome to KrestLab, \${user.name}! You are level \${user.level}.\`;
}

const me: User = { name: "Dev", level: 1 };
console.log(greetUser(me));`,
    java: `public class Main {
    public static void main(String[] args) {
        System.out.println("Hello from KrestLab!");
        for (int i = 1; i <= 5; i++) {
            System.out.println("Step " + i);
        }
    }
}`,
    cpp: `#include <iostream>
#include <vector>
using namespace std;

int main() {
    cout << "Hello from KrestLab!" << endl;
    vector<int> nums = {1, 2, 3, 4, 5};
    int sum = 0;
    for (int n : nums) sum += n;
    cout << "Sum: " << sum << endl;
    return 0;
}`,
    rust: `fn main() {
    println!("Hello from KrestLab!");
    let nums: Vec<i32> = (1..=5).collect();
    let sum: i32 = nums.iter().sum();
    println!("Sum of 1..5 = {}", sum);
}`,
    go: `package main

import "fmt"

func main() {
    fmt.Println("Hello from KrestLab!")
    sum := 0
    for i := 1; i <= 5; i++ {
        sum += i
    }
    fmt.Printf("Sum of 1..5 = %d\\n", sum)
}`,
    sql: `-- SQL — executed via Judge0
CREATE TABLE users (
    id   INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    xp   INTEGER DEFAULT 0
);

INSERT INTO users VALUES (1, 'Chinonso', 500);
INSERT INTO users VALUES (2, 'Dev',      120);

SELECT name, xp FROM users ORDER BY xp DESC;`,
  };

  const buffers    = { ...DEFAULTS };
  let   activeLang = 'html';
  let   cm         = null;

  function init() {
    cm = CodeMirror(document.getElementById('cmEditor'), {
      value:             buffers[activeLang],
      mode:              LANG_META[activeLang].mode,
      theme:             'dracula',
      lineNumbers:       true,
      autoCloseBrackets: true,
      autoCloseTags:     true,
      indentWithTabs:    false,
      tabSize:           2,
      indentUnit:        2,
      lineWrapping:      false,
      extraKeys: {
        'Ctrl-/':   (c) => c.toggleComment(),
        'Cmd-/':    (c) => c.toggleComment(),
        'Tab':      (c) => c.execCommand('indentMore'),
        'Shift-Tab':(c) => c.execCommand('indentLess'),
      },
    });

    cm.on('change', () => { buffers[activeLang] = cm.getValue(); });
    _bindTabs();
  }

  function _bindTabs() {
    document.querySelectorAll('#langTabs .tab').forEach((tab) => {
      tab.addEventListener('click', () => {
        const lang = tab.dataset.lang;
        if (lang === activeLang) return;

        buffers[activeLang] = cm.getValue();

        document.querySelectorAll('#langTabs .tab').forEach((t) => t.classList.remove('active'));
        tab.classList.add('active');

        activeLang = lang;
        cm.setValue(buffers[lang] || '');
        cm.setOption('mode', LANG_META[lang]?.mode || 'text/plain');
        cm.focus();

        document.getElementById('editorLabel').textContent = LANG_META[lang]?.label || lang;
        const hint = document.getElementById('execHint');
        if (hint) hint.textContent = LANG_META[lang]?.hint || '';
      });
    });
  }

  function getValue(lang)       { return lang === activeLang ? cm.getValue() : (buffers[lang] || ''); }
  function setValue(lang, code) { buffers[lang] = code; if (lang === activeLang && cm) cm.setValue(code); }
  function clearCurrent()       { cm.setValue(''); buffers[activeLang] = ''; }
  function getActiveLang()      { return activeLang; }
  function isBrowserLang()      { return BROWSER_LANGS.has(activeLang); }
  function refresh()            { if (cm) setTimeout(() => cm.refresh(), 50); }

  // Set a specific language tab as active programmatically (for tutor starter code)
  function switchTo(lang, code) {
    const tab = document.querySelector(`#langTabs .tab[data-lang="${lang}"]`);
    if (tab) tab.click();
    if (code !== undefined) setValue(lang, code);
  }

  return { init, getValue, setValue, clearCurrent, getActiveLang, isBrowserLang, refresh, switchTo, buffers: () => buffers };
})();
