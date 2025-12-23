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

  // Afficher la waiting room
  lobbyDiv.style.display = "none";
  waitingDiv.style.display = "block";

  // Lire l'image et convertir en base64
  const reader = new FileReader();

  reader.onload = function(e) {
    const avatarBase64 = e.target.result;

    // 🔹 Console log pour vérifier la conversion
    console.log("Avatar base64 :", avatarBase64.slice(0,50)); // affiche seulement les 50 premiers caractères

    // Envoyer pseudo + avatar à Firebase
    playersRef.child(playerId).set({
      pseudo: pseudo,
      avatar: avatarBase64
    }, error => {
      if (error) alert("Erreur Firebase : " + error);
    });
  };

  reader.onerror = function() {
    alert("Erreur lors de la lecture de l'image. Réessaie !");
  };

  reader.readAsDataURL(file); // conversion en base64
};

// Afficher les avatars en temps réel
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

