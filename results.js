document.addEventListener('DOMContentLoaded', function () {
  const quizState = localStorage.getItem('quizState');
  if (quizState !== 'completed') {
    window.location.href = 'index.html'; // Redirect if the quiz is not completed
    return;
  }

  const userAnswers = JSON.parse(localStorage.getItem('userAnswers'));
  const finalScore = JSON.parse(localStorage.getItem('finalScore'));

  if (!userAnswers || finalScore === undefined) {
    window.location.href = 'index.html'; // Redirect if no quiz data exists
    return;
  }

  document.getElementById('final-score').textContent = `Your Score: ${finalScore}`;

  const summaryDiv = document.getElementById('quiz-summary');
  userAnswers.forEach((answer, index) => {
    const question = answer.question;
    const correct = answer.selectedAnswer === question.correct_answer;
    const resultClass = correct ? 'correct' : 'incorrect';

    const questionSummary = document.createElement('div');
    questionSummary.classList.add('question-summary');
    questionSummary.innerHTML = `
      <p>Question ${index + 1}:<br>${question.question}</p>
      <br>
      <p>Difficulty: ${question.difficulty.charAt(0).toUpperCase() + question.difficulty.slice(1)}</p>
      <p>Your Answer: <span class="${resultClass}">${answer.selectedAnswer}</span></p>
      <p>Correct Answer: <span class="correct">${question.correct_answer}</span></p>
    `;

    summaryDiv.appendChild(questionSummary);
  });

  // Display high score on results page
  const highScore = JSON.parse(localStorage.getItem('highScore')) || 0;
  document.getElementById('high-score').textContent = `High Score: ${highScore}`;

  // Clear saved progress and state
  localStorage.removeItem('quizProgress');
  localStorage.removeItem('quizState');
  localStorage.removeItem('questions');
  localStorage.removeItem('userAnswers');
  localStorage.removeItem('finalScore');
});