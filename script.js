const readyBtn = document.getElementById("ready");
const pseudoInput = document.getElementById("pseudo");
const avatarInput = document.getElementById("avatar");
const totalPlayersInput = document.getElementById("totalPlayers");

const lobbyDiv = document.getElementById("lobby");
const waitingDiv = document.getElementById("waiting");
const avatarsContainer = document.getElementById("avatarsContainer");

const actionsPhaseDiv = document.getElementById("actionsPhase");
const actionsContainer = document.getElementById("actionsContainer");
const submitActionsBtn = document.getElementById("submitActions");

const playerId = 'player_' + Date.now();
const playersRef = firebase.database().ref('lobby/players');
const lobbyRef = firebase.database().ref('lobby');
const actionsRef = firebase.database().ref('lobby/actions');

let totalPlayers = 0;

// Quand le joueur clique "Je suis prêt !"
readyBtn.onclick = () => {
  const pseudo = pseudoInput.value.trim();
  const file = avatarInput.files[0];
  totalPlayers = parseInt(totalPlayersInput.value);

  if (!pseudo || !file || !totalPlayers) {
    alert("Pseudo, photo et nombre de joueurs sont obligatoires !");
    return;
  }

  if (!file.type.startsWith("image/")) {
    alert("Choisis un fichier image !");
    return;
  }

  lobbyDiv.style.display = "none";
  waitingDiv.style.display = "block";

  // Lire l'image en base64
  const reader = new FileReader();
  reader.onload = function(e) {
    const avatarBase64 = e.target.result;
    console.log("Avatar base64 :", avatarBase64.slice(0,50));

    // Écrire dans Firebase
    playersRef.child(playerId).set({
      pseudo,
      avatar: avatarBase64,
      ready: true
    });

    // Enregistrer totalPlayers si MJ
    lobbyRef.child('totalPlayers').set(totalPlayers);
  };
  reader.readAsDataURL(file);
};

// Affichage des avatars en temps réel
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

  // Vérifier si le lobby est complet
  const total = Object.keys(players).length;
  lobbyRef.child('totalPlayers').once('value', snap => {
    const totalExpected = snap.val();
    if(totalExpected && total === totalExpected){
      initMJActions(players);
    }
  });
});

// Fonction pour initialiser les actions du MJ
let actionsInitialized = false;
function initMJActions(players){
  if(actionsInitialized) return;
  actionsInitialized = true;

  const playerIds = Object.keys(players);
  const MJId = playerIds[0]; // Ici, on prend le premier comme MJ (tu peux adapter)
  const N = 3; // Nombre d'actions pour le MJ
  const candidates = playerIds.filter(id => id !== MJId);
  const selected = [];

  while(selected.length < N){
    const rand = candidates[Math.floor(Math.random()*candidates.length)];
    if(!selected.includes(rand)) selected.push(rand);
  }

  // Montrer interface pour écrire les actions du MJ
  actionsPhaseDiv.style.display = "block";
  actionsContainer.innerHTML = "";

  selected.forEach(id => {
    const p = document.createElement("p");
    p.textContent = players[id].pseudo + " écrit une action pour le MJ";
    const input = document.createElement("input");
    input.type = "text";
    input.dataset.creator = id;
    actionsContainer.appendChild(p);
    actionsContainer.appendChild(input);
  });

  submitActionsBtn.onclick = () => {
    const inputs = actionsContainer.querySelectorAll("input");
    inputs.forEach((input, index) => {
      const actionText = input.value.trim();
      const creator = input.dataset.creator;
      if(actionText){
        actionsRef.child(MJId).push({
          text: actionText,
          createdBy: creator
        });
      }
    });
    alert("Actions du MJ créées !");
    actionsPhaseDiv.style.display = "none";
  };
}

// Supprimer joueur quand il quitte
window.addEventListener("beforeunload", () => {
  playersRef.child(playerId).remove();
});

});


