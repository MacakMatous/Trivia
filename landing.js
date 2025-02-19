document.getElementById('quiz-settings-form').addEventListener('submit', function (event) {
  event.preventDefault();
  
  const theme = document.getElementById('theme').value;
  const numEasyQuestions = parseInt(document.getElementById('easy_questions').value);
  const numMediumQuestions = parseInt(document.getElementById('medium_questions').value);
  const numHardQuestions = parseInt(document.getElementById('hard_questions').value);

  var selectElement = document.getElementById("theme");
  var selectedOption = selectElement.options[selectElement.selectedIndex];
  var selectedText = selectedOption.text; 

  // Create the game configuration object
  const newGame = {
    category: selectedText,
    easy: numEasyQuestions,
    medium: numMediumQuestions,
    hard: numHardQuestions
  };

  // Add new game at the beginning
  lastGames.unshift(newGame); 

    // Limit the list to 3 configurations
  if (lastGames.length > 3) {
    lastGames.pop(); 
  }

  // Save updated list to local storage
  localStorage.setItem(lastGamesKey, JSON.stringify(lastGames));

  // Update the displayed list
  updateLastGamesList();

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
    fetchEasy: true,
    fetchMedium: true,
    fetchHard: true
  }));

  localStorage.setItem('quizState', 'inProgress');

  window.location.href = 'quiz.html';
});

const lastGamesKey = 'lastGames';

let lastGames = JSON.parse(localStorage.getItem(lastGamesKey)) || [];

function updateLastGamesList() {
  const lastGamesList = document.getElementById('last-games');
  lastGamesList.innerHTML = ''; 

  lastGames.forEach((game, index) => {
    const listItem = document.createElement('li');
    listItem.textContent = `Theme: ${game.category} - Easy: ${game.easy}, Medium: ${game.medium}, Hard: ${game.hard}`;
    lastGamesList.appendChild(listItem);
  });
}

window.onload = updateLastGamesList;


// Display high score on landing page
document.addEventListener('DOMContentLoaded', function () {
  const highScore = JSON.parse(localStorage.getItem('highScore')) || 0;
  document.getElementById('high-score').textContent = `High Score: ${highScore}`;
});
