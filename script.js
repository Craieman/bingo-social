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
let bingoContainer = null;

// ----------------- Rejoindre le lobby -----------------
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

  const reader = new FileReader();
  reader.onload = function(e) {
    const avatarBase64 = e.target.result;

    playersRef.child(playerId).set({
      pseudo,
      avatar: avatarBase64,
      ready: true
    });

    lobbyRef.child('totalPlayers').set(totalPlayers);

    // Mettre à jour cache pour ce joueur
    playerNamesCache[playerId] = pseudo;
  };
  reader.readAsDataURL(file);
};

// ----------------- Affichage avatars -----------------
playersRef.on('child_added', snapshot => {
  const player = snapshot.val();
  const id = snapshot.key;

  const img = document.createElement("img");
  img.src = player.avatar;
  img.title = player.pseudo;
  avatarsContainer.appendChild(img);

  playerNamesCache[id] = player.pseudo;

  // Vérifier si le lobby est complet
  lobbyRef.child('totalPlayers').once('value').then(snap => {
    const totalExpected = snap.val();
    playersRef.once('value').then(allSnap => {
      const total = Object.keys(allSnap.val() || {}).length;
      if(totalExpected && total === totalExpected){
        initMJActions(allSnap.val());
      }
    });
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

// ----------------- Bingo temps réel optimisé -----------------
function startBingo(){
  if(!bingoContainer){
    bingoContainer = document.createElement("div");
    bingoContainer.id = "bingoContainer";
    waitingDiv.appendChild(bingoContainer);
  }

  // Ajouter actions individuelles
  actionsRef.on('child_added', playerSnap => {
    const playerIdKey = playerSnap.key;
    const playerActions = playerSnap.val();
    if(!playerActions) return;

    const playerDiv = document.createElement("div");
    playerDiv.className = "playerActions";
    const title = document.createElement("h3");
    title.textContent = playerNamesCache[playerIdKey] || playerIdKey;
    playerDiv.appendChild(title);
    bingoContainer.appendChild(playerDiv);

    Object.keys(playerActions).forEach(aid => {
      const action = playerActions[aid];
      if(playerIdKey === playerId) return;

      const actionDiv = document.createElement("div");
      actionDiv.textContent = action.text;
      actionDiv.style.cursor = "pointer";
      actionDiv.style.textDecoration = action.done ? "line-through" : "none";

      actionDiv.onclick = () => {
        if(!action.done){
          actionsRef.child(playerIdKey).child(aid).update({done:true});
          new Audio("https://www.myinstants.com/media/sounds/cash.mp3").play();
        }
      };

      playerDiv.appendChild(actionDiv);
    });
  });

  // Mettre à jour style sans reconstruire
  actionsRef.on('child_changed', playerSnap => {
    const playerIdKey = playerSnap.key;
    const playerActions = playerSnap.val();
    if(!playerActions) return;

    const divs = bingoContainer.querySelectorAll('.playerActions');
    divs.forEach(pd => {
      if(pd.querySelector('h3')?.textContent === (playerNamesCache[playerIdKey] || playerIdKey)){
        Object.keys(playerActions).forEach(aid => {
          const action = playerActions[aid];
          const actionDivs = pd.querySelectorAll('div');
          actionDivs.forEach(ad => {
            if(ad.textContent === action.text){
              ad.style.textDecoration = action.done ? "line-through" : "none";
            }
          });
        });
      }
    });
  });
}

// ----------------- Supprimer joueur quand il quitte -----------------
window.addEventListener("beforeunload", () => {
  playersRef.child(playerId).remove();
});


