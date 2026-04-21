// ============================================================================
// practice.js — problem bank renderer for Grammar Explorer
// ----------------------------------------------------------------------------
// Usage:
//   <div id="practice-container"></div>
//   <script src="shared/practice.js"></script>
//   <script>
//     Practice.mount({
//       container: '#practice-container',
//       bankUrl: 'data/problems/parts-of-speech.json',
//       filter: {tags: ['noun'], count: 3},   // optional
//       onComplete: (results) => {}           // optional
//     });
//   </script>
// ============================================================================

(function (window) {
  'use strict';

  const Practice = {};

  // ==========================================================================
  // STATE (per mount)
  // ==========================================================================
  function createState(config, problems) {
    return {
      config,
      problems,
      currentIdx: 0,
      answered: [],   // per-problem: {problem, userAnswer, correct}
      locked: false,  // whether current problem has been submitted
    };
  }

  // ==========================================================================
  // PROBLEM FILTERING & SHUFFLING
  // ==========================================================================
  function filterProblems(bank, filter) {
    let problems = bank.problems.slice();
    if (filter.tags && filter.tags.length) {
      problems = problems.filter(p =>
        p.tags.some(t => filter.tags.includes(t))
      );
    }
    if (filter.difficulty) {
      problems = problems.filter(p => p.difficulty === filter.difficulty);
    }
    if (filter.type) {
      problems = problems.filter(p => p.type === filter.type);
    }
    // Shuffle
    for (let i = problems.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [problems[i], problems[j]] = [problems[j], problems[i]];
    }
    // Limit count
    if (filter.count) {
      problems = problems.slice(0, filter.count);
    }
    return problems;
  }

  // ==========================================================================
  // RENDERING
  // ==========================================================================
  function render(state) {
    const root = document.querySelector(state.config.container);
    if (!root) return;

    if (state.currentIdx >= state.problems.length) {
      renderSummary(root, state);
      return;
    }

    const problem = state.problems[state.currentIdx];
    const answered = state.answered[state.currentIdx];

    root.innerHTML = `
      <div class="practice-widget">
        <div class="practice-progress">
          <span class="practice-progress-text">Question ${state.currentIdx + 1} of ${state.problems.length}</span>
          <div class="practice-progress-dots">
            ${state.problems.map((_, i) => {
              let cls = 'practice-dot';
              if (i < state.currentIdx) {
                cls += state.answered[i] && state.answered[i].correct ? ' correct' : ' incorrect';
              } else if (i === state.currentIdx) {
                cls += ' current';
              }
              return `<span class="${cls}"></span>`;
            }).join('')}
          </div>
        </div>

        <div class="practice-body">
          ${renderProblem(problem, answered)}
        </div>

        ${answered ? renderFeedback(problem, answered, state) : ''}
      </div>
    `;

    attachHandlers(root, state);
  }

  function renderProblem(problem, answered) {
    if (problem.type === 'multiple-choice') {
      return renderMultipleChoice(problem, answered);
    } else if (problem.type === 'classify') {
      return renderClassify(problem, answered);
    } else if (problem.type === 'identify') {
      return renderIdentify(problem, answered);
    }
    return '<div>Unknown problem type: ' + problem.type + '</div>';
  }

  function renderMultipleChoice(problem, answered) {
    return `
      <div class="practice-prompt">${escapeHtml(problem.prompt)}</div>
      <div class="practice-choices">
        ${problem.choices.map((choice, i) => {
          let cls = 'practice-choice';
          if (answered) {
            if (i === problem.answer) cls += ' correct';
            else if (i === answered.userAnswer) cls += ' incorrect';
            cls += ' locked';
          }
          return `<button class="${cls}" data-choice="${i}">${escapeHtml(choice)}</button>`;
        }).join('')}
      </div>
    `;
  }

  function renderClassify(problem, answered) {
    // Highlight the target word within the sentence
    const targetRegex = new RegExp('\\b(' + escapeRegex(problem.target) + ')\\b', 'i');
    const highlightedSentence = escapeHtml(problem.sentence).replace(
      targetRegex,
      '<mark class="practice-target">$1</mark>'
    );
    return `
      <div class="practice-classify-sentence">${highlightedSentence}</div>
      <div class="practice-prompt">${escapeHtml(problem.prompt)}</div>
      <div class="practice-choices">
        ${problem.choices.map((choice, i) => {
          let cls = 'practice-choice';
          if (answered) {
            if (i === problem.answer) cls += ' correct';
            else if (i === answered.userAnswer) cls += ' incorrect';
            cls += ' locked';
          }
          return `<button class="${cls}" data-choice="${i}">${escapeHtml(choice)}</button>`;
        }).join('')}
      </div>
    `;
  }

  function renderIdentify(problem, answered) {
    const selected = answered ? new Set(answered.userAnswer) : new Set();
    const correctSet = new Set(problem.answer);

    return `
      <div class="practice-prompt">${escapeHtml(problem.instruction)}</div>
      <div class="practice-identify-sentence">
        ${problem.sentence.map((word, i) => {
          let cls = 'practice-word';
          if (answered) {
            cls += ' locked';
            const wasSelected = selected.has(i);
            const isCorrect = correctSet.has(i);
            if (wasSelected && isCorrect) cls += ' correct-picked';      // right pick
            else if (wasSelected && !isCorrect) cls += ' wrong-picked';  // wrong pick
            else if (!wasSelected && isCorrect) cls += ' missed';        // missed the correct one
          } else if (selected.has(i)) {
            cls += ' selected';
          }
          const isPunct = /^[.,;:!?'"()\-\u2014]+$/.test(word);
          if (isPunct) cls += ' punct';
          return `<span class="${cls}" data-idx="${i}">${escapeHtml(word)}</span>`;
        }).join('')}
      </div>
      ${!answered ? '<button class="practice-check-btn">Check Answer</button>' : ''}
    `;
  }

  function renderFeedback(problem, answered, state) {
    const isLast = state.currentIdx === state.problems.length - 1;
    const icon = answered.correct ? '✓' : '✗';
    const label = answered.correct ? 'Correct' : 'Not quite';
    const cls = answered.correct ? 'correct' : 'incorrect';
    return `
      <div class="practice-feedback ${cls}">
        <div class="practice-feedback-header">
          <span class="practice-feedback-icon">${icon}</span>
          <span class="practice-feedback-label">${label}</span>
        </div>
        <div class="practice-feedback-body">${problem.explanation}</div>
      </div>
      <div class="practice-actions">
        <button class="practice-next-btn">${isLast ? 'See Results' : 'Next →'}</button>
      </div>
    `;
  }

  function renderSummary(root, state) {
    const correctCount = state.answered.filter(a => a && a.correct).length;
    const total = state.problems.length;
    const percent = Math.round((correctCount / total) * 100);

    let message = '';
    if (percent === 100) message = "Perfect! Every one right.";
    else if (percent >= 80) message = "Strong work.";
    else if (percent >= 60) message = "Solid start. Try again for full mastery.";
    else message = "Keep at it. The explanations are where the learning happens — read them carefully.";

    root.innerHTML = `
      <div class="practice-widget">
        <div class="practice-summary">
          <div class="practice-summary-score">${correctCount} / ${total}</div>
          <div class="practice-summary-message">${message}</div>
          <div class="practice-summary-dots">
            ${state.answered.map(a => {
              const ok = a && a.correct;
              return `<span class="practice-dot ${ok ? 'correct' : 'incorrect'}"></span>`;
            }).join('')}
          </div>
          <button class="practice-retry-btn">Try a New Set</button>
        </div>
      </div>
    `;

    const retryBtn = root.querySelector('.practice-retry-btn');
    retryBtn.addEventListener('click', () => {
      if (state.config.onComplete) state.config.onComplete(state.answered);
      Practice.mount(state.config);  // remount fresh
    });
  }

  // ==========================================================================
  // INTERACTION HANDLERS
  // ==========================================================================
  function attachHandlers(root, state) {
    const problem = state.problems[state.currentIdx];
    const answered = state.answered[state.currentIdx];

    if (answered) {
      // Locked — only Next button is active
      const nextBtn = root.querySelector('.practice-next-btn');
      if (nextBtn) {
        nextBtn.addEventListener('click', () => {
          state.currentIdx++;
          render(state);
        });
      }
      return;
    }

    if (problem.type === 'multiple-choice' || problem.type === 'classify') {
      root.querySelectorAll('.practice-choice').forEach(btn => {
        btn.addEventListener('click', () => {
          const choiceIdx = parseInt(btn.dataset.choice, 10);
          submitAnswer(state, choiceIdx);
        });
      });
    } else if (problem.type === 'identify') {
      const selection = new Set();
      root.querySelectorAll('.practice-word:not(.punct)').forEach(word => {
        word.addEventListener('click', () => {
          const idx = parseInt(word.dataset.idx, 10);
          if (selection.has(idx)) {
            selection.delete(idx);
            word.classList.remove('selected');
          } else {
            selection.add(idx);
            word.classList.add('selected');
          }
        });
      });
      const checkBtn = root.querySelector('.practice-check-btn');
      checkBtn.addEventListener('click', () => {
        submitAnswer(state, Array.from(selection).sort((a, b) => a - b));
      });
    }
  }

  function submitAnswer(state, userAnswer) {
    const problem = state.problems[state.currentIdx];
    const correct = isCorrect(problem, userAnswer);
    state.answered[state.currentIdx] = { problem, userAnswer, correct };
    render(state);
  }

  function isCorrect(problem, userAnswer) {
    if (problem.type === 'identify') {
      const correctArr = problem.answer.slice().sort((a, b) => a - b);
      const userArr = userAnswer.slice().sort((a, b) => a - b);
      if (correctArr.length !== userArr.length) return false;
      return correctArr.every((v, i) => v === userArr[i]);
    }
    return userAnswer === problem.answer;
  }

  // ==========================================================================
  // UTILITIES
  // ==========================================================================
  function escapeHtml(s) {
    if (typeof s !== 'string') return String(s);
    return s.replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
  }

  function escapeRegex(s) {
    return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  // ==========================================================================
  // PUBLIC API
  // ==========================================================================
  Practice.mount = function (config) {
    fetch(config.bankUrl)
      .then(r => {
        if (!r.ok) throw new Error('Failed to load bank: ' + r.status);
        return r.json();
      })
      .then(bank => {
        const filter = config.filter || { count: 5 };
        if (!filter.count) filter.count = 5;
        const problems = filterProblems(bank, filter);
        if (problems.length === 0) {
          document.querySelector(config.container).innerHTML =
            '<div class="practice-widget"><div class="practice-empty">No problems match this filter yet.</div></div>';
          return;
        }
        const state = createState(config, problems);
        render(state);
      })
      .catch(err => {
        const el = document.querySelector(config.container);
        if (el) el.innerHTML =
          '<div class="practice-widget"><div class="practice-error">Couldn\'t load problem bank.<br><small>' + escapeHtml(err.message) + '</small></div></div>';
      });
  };

  window.Practice = Practice;
})(window);
