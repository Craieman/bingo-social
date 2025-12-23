// Éléments HTML
const readyBtn = document.getElementById("ready");
const pseudoInput = document.getElementById("pseudo");
const avatarInput = document.getElementById("avatar");
const lobbyDiv = document.getElementById("lobby");
const waitingDiv = document.getElementById("waiting");
const avatarsContainer = document.getElementById("avatarsContainer");

// ID unique du joueur
const playerId = 'player_' + Date.now();

// Référence Firebase pour les joueurs du lobby
const playersRef = firebase.database().ref('lobby/players');

// Quand le joueur clique sur "Je suis prêt !"
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

  // Masquer le lobby et afficher la waiting room
  lobbyDiv.style.display = "none";
  waitingDiv.style.display = "block";

  // Lire l'image en base64 et envoyer dans Firebase
  const reader = new FileReader();
  reader.onload = function(e) {
    const avatarBase64 = e.target.result;

    // Écrire dans Firebase
    playersRef.child(playerId).set({
      pseudo: pseudo,
      avatar: avatarBase64
    }, error => {
      if (error) {
        alert("Erreur lors de l'envoi à Firebase : " + error);
      }
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

// Supprimer le joueur de Firebase quand il quitte
window.addEventListener("beforeunload", () => {
  playersRef.child(playerId).remove();
});

