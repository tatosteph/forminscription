document.addEventListener("DOMContentLoaded", function () {
  // Chargement et affichage des réunions disponibles
  let Meeting = Parse.Object.extend("meeting");
  let queryMeeting = new Parse.Query(Meeting);
  queryMeeting.find().then(function (meetings) {
    let selectMeeting = document.getElementById("meeting-select");
    if (selectMeeting) {
      meetings.forEach(function (meeting) {
        let option = document.createElement("option");
        option.value = meeting.id;
        option.text =
          meeting.get("date").toLocaleString() + " - " + meeting.get("adresse");
        selectMeeting.appendChild(option);
      });
    }
  });

  // Chargement et affichage des années scolaires disponibles
  let Anneescolaire = Parse.Object.extend("anneescolaire");
  let queryAnneescolaire = new Parse.Query(Anneescolaire);
  queryAnneescolaire.find().then(function (annees) {
    let selectAnnee = document.getElementById("annee-scolaire-select");
    if (selectAnnee) {
      annees.forEach(function (annee) {
        let option = document.createElement("option");
        option.value = annee.id;
        option.text = annee.get("classekids");
        selectAnnee.appendChild(option);
      });
    }
  });

  // Gestion de l'inscription
  const signupForm = document.getElementById("signup-form");
  if (signupForm) {
    signupForm.addEventListener("submit", function (event) {
      event.preventDefault();

      const username = document.getElementById("username").value;
      const emailPublic = document.getElementById("emailPublic").value;
      const password = document.getElementById("password").value;
      const meetingId = document.getElementById("meeting-select").value;
      const anneescolaireId = document.getElementById("annee-scolaire-select")
        .value;

      let queryMeeting = new Parse.Query(Meeting);
      queryMeeting
        .get(meetingId)
        .then(function (meeting) {
          const maxParticipants = meeting.get("maxParticipants");
          const currentParticipants = meeting.get("currentParticipants") || 0;
          if (currentParticipants < maxParticipants) {
            let User = new Parse.User();
            User.set("username", username);
            User.set("emailPublic", emailPublic);
            User.set("password", password);

            return User.signUp().then(function (user) {
              let queryAnneescolaire = new Parse.Query(Anneescolaire);
              return queryAnneescolaire
                .get(anneescolaireId)
                .then(function (anneescolaire) {
                  let Enregistrement = Parse.Object.extend("enregistrement");
                  let enregistrement = new Enregistrement();
                  enregistrement.set("user", user);
                  enregistrement.set("meeting", meeting);
                  enregistrement.set("anneescolaire", anneescolaire);
                  meeting.increment("currentParticipants");
                  return Parse.Object.saveAll([enregistrement, meeting]);
                });
            });
          } else {
            throw new Error("Désolé, ce meeting est complet.");
          }
        })
        .then(function () {
          signupForm.reset();
          alert("Inscription réussie !");
          updateAvailableSpots(meetingId);
        })
        .catch(function (error) {
          alert("Erreur : " + error.message);
        });
    });
  }

  // Mise à jour des places disponibles
  const meetingSelect = document.getElementById("meeting-select");
  if (meetingSelect) {
    meetingSelect.addEventListener("change", function () {
      const meetingId = this.value;
      updateAvailableSpots(meetingId);
    });
  }

  function updateAvailableSpots(meetingId) {
    let query = new Parse.Query(Meeting);
    query
      .get(meetingId)
      .then(function (meeting) {
        const maxParticipants = meeting.get("maxParticipants");
        const currentParticipants = meeting.get("currentParticipants") || 0;
        const availableSpots = maxParticipants - currentParticipants;
        document.getElementById("places-disponibles").textContent =
          "Places disponibles : " + availableSpots;
      })
      .catch(function (error) {
        console.error(
          "Erreur lors de la mise à jour des places disponibles : ",
          error
        );
      });
  }
});

function filtrerParMeeting() {
  let meetingId = document.getElementById("meeting-select").value;
  let listeUtilisateurs = document.getElementById("liste-utilisateurs");
  listeUtilisateurs.innerHTML = ""; // Nettoyer la liste avant d'afficher les nouveaux résultats

  let Enregistrement = Parse.Object.extend("enregistrement");
  let query = new Parse.Query(Enregistrement);
  query.include("user"); // Pour accéder aux données de l'utilisateur

  // Si "Tous les Meetings" est sélectionné, ne pas filtrer par meetingId
  if (meetingId) {
    query.equalTo("meeting", {
      __type: "Pointer",
      className: "meeting",
      objectId: meetingId,
    });
  }

  query
    .find()
    .then(function (resultats) {
      resultats.forEach(function (enregistrement) {
        let user = enregistrement.get("user");
        let profession = user.get("profession"); // Adapter selon la structure de vos données
        let nom = user.get("username");
        let email = user.get("emailPublic");

        // Afficher les utilisateurs
        let li = document.createElement("li");
        li.textContent = `${nom} - ${email}`;
        listeUtilisateurs.appendChild(li);
      });
    })
    .catch(function (erreur) {
      console.error(
        "Erreur lors de la récupération des utilisateurs : ",
        erreur
      );
    });
}
