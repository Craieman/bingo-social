// Tableau local pour stocker les avatars avant affichage
let avatars = [];

// Récupérer les éléments HTML
const readyBtn = document.getElementById("ready");
const pseudoInput = document.getElementById("pseudo");
const avatarInput = document.getElementById("avatar");
const lobbyDiv = document.getElementById("lobby");
const waitingDiv = document.getElementById("waiting");
const avatarsContainer = document.getElementById("avatarsContainer");

// Créer un identifiant unique pour ce joueur
const playerId = 'player_' + Date.now();

// Référence Firebase pour les joueurs du lobby
const playersRef = database.ref('lobby/players');

// Quand le joueur clique sur "Je suis prêt !"
readyBtn.onclick = () => {
  const pseudo = pseudoInput.value.trim();

  if (!pseudo || !avatarInput.files || avatarInput.files.length === 0) {
    alert("Entre ton pseudo et choisis une photo !");
    return;
  }

  const avatarFile = avatarInput.files[0];

  // Vérifier que c'est bien une image
  if (!avatarFile.type.startsWith("image/")) {
    alert("Choisis un fichier image !");
    return;
  }

  // Créer un URL temporaire pour afficher la photo localement
  const avatarURL = URL.createObjectURL(avatarFile);

  // Masquer le lobby et afficher la waiting room
  lobbyDiv.style.display = "none";
  waitingDiv.style.display = "block";

  // Envoyer pseudo + avatar à Firebase
  const reader = new FileReader();
  reader.onload = function(e) {
    playersRef.child(playerId).set({
      pseudo: pseudo,
      avatar: e.target.result // on envoie la photo en base64
    });
  };
  reader.readAsDataURL(avatarFile);
};

// Écouter les changements dans le lobby en temps réel
playersRef.on('value', (snapshot) => {
  avatarsContainer.innerHTML = ""; // vider le container
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

// Supprimer le joueur de Firebase quand il ferme la page
window.addEventListener("beforeunload", () => {
  playersRef.child(playerId).remove();
});
