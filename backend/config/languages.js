// Judge0 CE language IDs
// Full reference: https://github.com/judge0/judge0/blob/master/docs/api/submissions/language-ids.md

const LANGUAGES = {
  python:     { id: 71,  name: 'Python 3 (3.8.1)',  ext: 'py'   },
  javascript: { id: 63,  name: 'Node.js (12.14.0)',  ext: 'js'   },
  typescript: { id: 74,  name: 'TypeScript (3.7.4)', ext: 'ts'   },
  c:          { id: 50,  name: 'C (GCC 9.2.0)',      ext: 'c'    },
  cpp:        { id: 54,  name: 'C++ (GCC 9.2.0)',     ext: 'cpp'  },
  java:       { id: 62,  name: 'Java (OpenJDK 13)',   ext: 'java' },
  rust:       { id: 73,  name: 'Rust (1.40.0)',       ext: 'rs'   },
  go:         { id: 60,  name: 'Go (1.13.5)',         ext: 'go'   },
  ruby:       { id: 72,  name: 'Ruby (2.7.0)',        ext: 'rb'   },
  php:        { id: 68,  name: 'PHP (7.4.1)',         ext: 'php'  },
  kotlin:     { id: 78,  name: 'Kotlin (1.3.70)',     ext: 'kt'   },
  bash:       { id: 46,  name: 'Bash (5.0.0)',        ext: 'sh'   },
  sql:        { id: 82,  name: 'SQL (SQLite 3.27.2)', ext: 'sql'  },
};

module.exports = { LANGUAGES };

