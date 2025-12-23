const readyBtn = document.getElementById("ready");
const pseudoInput = document.getElementById("pseudo");

const playerId = 'player_' + Date.now();
const playersRef = firebase.database().ref('lobby/players');

readyBtn.onclick = () => {
  const pseudo = pseudoInput.value.trim();
  if (!pseudo) {
    alert("Entre ton pseudo !");
    return;
  }

  // Envoyer seulement le pseudo pour tester
  playersRef.child(playerId).set({
    pseudo: pseudo,
    avatar: "https://via.placeholder.com/100" // image temporaire
  }, error => {
    if (error) alert("Erreur Firebase : " + error);
    else alert("Envoyé à Firebase !");
  });
};

