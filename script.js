const readyBtn = document.getElementById("ready");
const pseudoInput = document.getElementById("pseudo");
const waitingDiv = document.getElementById("waiting");
const lobbyDiv = document.getElementById("lobby");
const avatarsContainer = document.getElementById("avatarsContainer");

const playerId = 'player_' + Date.now();
const playersRef = firebase.database().ref('lobby/players');

readyBtn.onclick = () => {
  const pseudo = pseudoInput.value.trim();
  if (!pseudo) {
    alert("Entre ton pseudo !");
    return;
  }

  // Afficher waiting room
  lobbyDiv.style.display = "none";
  waitingDiv.style.display = "block";

  // Envoyer pseudo + avatar temporaire
  playersRef.child(playerId).set({
    pseudo: pseudo,
    avatar: "https://via.placeholder.com/100"
  }, error => {
    if (error) alert("Erreur Firebase : " + error);
    else console.log("Envoyé à Firebase !");
  });
};

// Écouter en temps réel
playersRef.on('value', snapshot => {
  avatarsContainer.innerHTML = "";
  const players = snapshot.val();
  if (!players) return;

  Object.keys(players).forEach(id => {
    const player = players[id];
    const img = document.createElement("img");
    img.src = player.avatar;
    img.title = player.pseudo;
    avatarsContainer.appendChild(img);
  });
});

// Supprimer joueur quand il quitte
window.addEventListener("beforeunload", () => {
  playersRef.child(playerId).remove();
});
