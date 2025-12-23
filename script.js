let avatars = [];

document.getElementById("ready").onclick = () => {
  const pseudo = document.getElementById("pseudo").value;
  const avatarInput = document.getElementById("avatar");

  if (!pseudo || !avatarInput.files || avatarInput.files.length === 0) {
    alert("Entre ton pseudo et choisis une photo !");
    return;
  }

  const avatarFile = avatarInput.files[0];

  // Vérifie que c'est bien une image
  if (!avatarFile.type.startsWith("image/")) {
    alert("Choisis un fichier image !");
    return;
  }

  // Crée un objet URL au lieu de FileReader (plus fiable sur mobile)
  const avatarURL = URL.createObjectURL(avatarFile);

  avatars.push({ pseudo, src: avatarURL });

  // Affiche la waiting room
  showWaitingRoom();
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
