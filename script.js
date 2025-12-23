const readyBtn = document.getElementById("ready");
const pseudoInput = document.getElementById("pseudo");
const avatarInput = document.getElementById("avatar");
const lobbyDiv = document.getElementById("lobby");
const waitingDiv = document.getElementById("waiting");
const avatarsContainer = document.getElementById("avatarsContainer");

const playerId = 'player_' + Date.now();
const playersRef = firebase.database().ref('lobby/players');

readyBtn.onclick = () => {
  const pseudo = pseudoInput.value.trim();
  const file = avatarInput.files[0];

  if (!pseudo || !file) {
    alert("Entre ton pseudo et choisis une photo !");
    return;
  }

  if (!file.type.startsWith("image/")) {
    alert("Choisis un fichier image !");
    return;
  }

  lobbyDiv.style.display = "none";
  waitingDiv.style.display = "block";

  const reader = new FileReader();
  reader.onload = function(e) {
    // On envoie la photo convertie en base64
    playersRef.child(playerId).set({
      pseudo: pseudo,
      avatar: e.target.result
    });
  };
  reader.onerror = function() {
    alert("Erreur lors de la lecture de l'image. Réessaie !");
  };
  reader.readAsDataURL(file);
};

// Temps réel : afficher tous les joueurs
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

// Supprimer le joueur quand il quitte
window.addEventListener("beforeunload", () => {
  playersRef.child(playerId).remove();
});
