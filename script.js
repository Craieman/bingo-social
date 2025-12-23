document.getElementById("createRoom").onclick = () => {
  alert("Créer un salon (bientôt)");
};

document.getElementById("joinRoom").onclick = () => {
  alert("Rejoindre un salon (bientôt)");

};

let avatars = [];

document.getElementById("ready").onclick = () => {
  const pseudo = document.getElementById("pseudo").value;
  const avatarFile = document.getElementById("avatar").files[0];

  if (!pseudo || !avatarFile) {
    alert("Entre ton pseudo et choisis une photo !");
    return;
  }

  // Lire l'image pour l'afficher localement
  const reader = new FileReader();
  reader.onload = function(e) {
    avatars.push({ pseudo, src: e.target.result });
    showWaitingRoom();
  };
  reader.readAsDataURL(avatarFile);
};

function showWaitingRoom() {
  document.getElementById("lobby").style.display = "none";
  document.getElementById("waiting").style.display = "block";

  const container = document.getElementById("avatarsContainer");
  container.innerHTML = "";
  avatars.forEach(player => {
    const img = document.createElement("img");
    img.src = player.src;
    img.title = player.pseudo;
    container.appendChild(img);
  });
}
