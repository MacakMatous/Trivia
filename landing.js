document.getElementById('quiz-settings-form').addEventListener('submit', function (event) {
  // prevents reload
  event.preventDefault();

  const theme = document.getElementById('theme').value;
  const numEasyQuestions = parseInt(document.getElementById('easy_questions').value);
  const numMediumQuestions = parseInt(document.getElementById('medium_questions').value);
  const numHardQuestions = parseInt(document.getElementById('hard_questions').value);

  // Validate the inputs
  if (!theme || numEasyQuestions < 0 || numEasyQuestions > 50 ||
    numMediumQuestions < 0 || numMediumQuestions > 50 ||
    numHardQuestions < 0 || numHardQuestions > 50 || (
        numEasyQuestions == 0 &&
        numMediumQuestions== 0 &&
        numHardQuestions == 0
      )
    ) {
    document.getElementById('error-message').style.display = 'block';
    return;
  }

  // Store the settings in localStorage to use them in the quiz
  localStorage.setItem('quizSettings', JSON.stringify({
    theme,
    numEasyQuestions,
    numMediumQuestions,
    numHardQuestions,
  }));

  // Set the quiz state to in progress
  localStorage.setItem('quizState', 'inProgress');

  // Navigate to the quiz page
  window.location.href = 'quiz.html';
});

// Display high score on landing page
document.addEventListener('DOMContentLoaded', function () {
  const highScore = JSON.parse(localStorage.getItem('highScore')) || 0;
  document.getElementById('high-score').textContent = `High Score: ${highScore}`;
});
