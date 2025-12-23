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
let playerNamesCache = {}; // cache des pseudos

// ----------------- Rejoindre le lobby -----------------
readyBtn.onclick = () => {
  const pseudo = pseudoInput.value.trim();
  const file = avatarInput.files[0];
  totalPlayers = parseInt(totalPlayersInput.value);

  if (!pseudo || !file || !totalPlayers || totalPlayers < 10) {
    alert("Pseudo, photo et nombre de joueurs (minimum 10) sont obligatoires !");
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
    const avatarBase64 = e.target.result;

    playersRef.child(playerId).set({
      pseudo,
      avatar: avatarBase64,
      ready: true
    });

    lobbyRef.child('totalPlayers').set(totalPlayers);

    // Mettre à jour le cache pour ce joueur
    playerNamesCache[playerId] = pseudo;
  };
  reader.readAsDataURL(file);
};

// ----------------- Affichage avatars -----------------
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

    // Mettre à jour cache pseudos
    playerNamesCache[id] = player.pseudo;
  });

  // Vérifier si le lobby est complet
  const total = Object.keys(players).length;
  lobbyRef.child('totalPlayers').once('value').then(snap => {
    const totalExpected = snap.val();
    if(totalExpected && total === totalExpected){
      initMJActions(players);
    }
  });
});

// ----------------- Phase actions MJ -----------------
let actionsInitialized = false;
function initMJActions(players){
  if(actionsInitialized) return;
  actionsInitialized = true;

  const playerIds = Object.keys(players);
  const MJId = playerIds[0]; // MJ = premier joueur
  const N = 3;
  const candidates = playerIds.filter(id => id !== MJId);
  const selected = [];

  while(selected.length < N){
    const rand = candidates[Math.floor(Math.random()*candidates.length)];
    if(!selected.includes(rand)) selected.push(rand);
  }

  actionsPhaseDiv.style.display = "block";
  actionsContainer.innerHTML = "";

  selected.forEach(id => {
    const p = document.createElement("p");
    p.textContent = playerNamesCache[id] + " écrit une action pour le MJ";
    const input = document.createElement("input");
    input.type = "text";
    input.dataset.creator = id;
    actionsContainer.appendChild(p);
    actionsContainer.appendChild(input);
  });

  submitActionsBtn.onclick = () => {
    const inputs = actionsContainer.querySelectorAll("input");
    inputs.forEach(input => {
      const actionText = input.value.trim();
      const creator = input.dataset.creator;
      if(actionText){
        actionsRef.child(MJId).push({
          text: actionText,
          createdBy: creator,
          done: false
        });
      }
    });

    // 3 actions pré-remplies pour les autres joueurs
    playerIds.forEach(id => {
      if(id === MJId) return;
      for(let i=1; i<=3; i++){
        actionsRef.child(id).push({
          text: "Action " + i,
          createdBy: MJId,
          done: false
        });
      }
    });

    actionsPhaseDiv.style.display = "none";
    startBingo();
  };
}

// ----------------- Bingo temps réel -----------------
function startBingo(){
  let bingoContainer = document.getElementById("bingoContainer");
  if(!bingoContainer){
    bingoContainer = document.createElement("div");
    bingoContainer.id = "bingoContainer";
    waitingDiv.appendChild(bingoContainer);
  }

  actionsRef.on('value', snapshot => {
    bingoContainer.innerHTML = "";
    const allActions = snapshot.val();
    if(!allActions) return;

    Object.keys(allActions).forEach(player => {
      const playerActions = allActions[player];
      if(!playerActions) return;

      const playerDiv = document.createElement("div");
      playerDiv.className = "playerActions";

      const title = document.createElement("h3");
      title.textContent = playerNamesCache[player] || player;
      playerDiv.appendChild(title);

      Object.keys(playerActions).forEach(aid => {
        const action = playerActions[aid];
        if(player === playerId) return; // pas ses propres actions

        const actionDiv = document.createElement("div");
        actionDiv.textContent = action.text;
        actionDiv.style.textDecoration = action.done ? "line-through" : "none";
        actionDiv.style.cursor = "pointer";

        actionDiv.onclick = () => {
          if(!action.done){
            actionsRef.child(player).child(aid).update({done:true});
            new Audio("https://www.myinstants.com/media/sounds/cash.mp3").play();
          }
        };

        playerDiv.appendChild(actionDiv);
      });

      bingoContainer.appendChild(playerDiv);
    });
  });
}

// ----------------- Supprimer joueur quand il quitte -----------------
window.addEventListener("beforeunload", () => {
  playersRef.child(playerId).remove();
});

