import { formatDate, formatStatus } from "../app/format.js";
import { ROUTES_PATH } from "../constants/routes.js";
import Logout from "./Logout.js";

// Classe pour gérer la page Bills
export default class Bills {
  // Constructeur de la classe, reçoit les éléments nécessaires pour manipuler le DOM, la navigation et le stockage
  constructor({ document, onNavigate, store, localStorage }) {
    this.document = document; // Référence au document (DOM)
    this.onNavigate = onNavigate; // Fonction pour naviguer entre les pages
    this.store = store; // Stockage utilisé pour récupérer les factures

    // Récupére le bouton nouvelle note de frais et y ajoute un écouteur d'événement
    const buttonNewBill = this.document.querySelector(
      `button[data-testid="btn-new-bill"]`
    );
    if (buttonNewBill) {
      buttonNewBill.addEventListener("click", this.handleClickNewBill); // Appel de la fonction handleClickNewBill quand on clique sur le bouton
    }

    // Récupére toutes les icônes oeil pour voir les factures et y ajoute un écouteur d'événement
    const iconEye = this.document.querySelectorAll(
      `div[data-testid="icon-eye"]`
    );
    if (iconEye) {
      iconEye.forEach((icon) => {
        // Ajout d'un écouteur d'événement pour chaque icône avec la bonne référence à l'élément cliqué
        icon.addEventListener("click", (event) =>
          this.handleClickIconEye(event)
        );
      });
    }

    // Appel de la classe Logout pour gérer la déconnexion
    new Logout({ document, localStorage, onNavigate });
  }

  // Fonction appelée lors du clic sur le bouton nouvelle note de frais
  handleClickNewBill = () => {
    this.onNavigate(ROUTES_PATH["NewBill"]);
  };

  // Fonction appelée lors du clic sur l'icône œil pour visualiser la facture
  handleClickIconEye = (event) => {
    // Correction : Utilisation de event.currentTarget pour récupérer l'élément cliqué
    const icon = event.currentTarget;
    const billUrl = icon.getAttribute("data-bill-url");

    if (billUrl) {
      const imgWidth = Math.floor($("#modaleFile").width() * 0.5);
      $("#modaleFile")
        .find(".modal-body")
        .html(
          `<div style='text-align: center;' class="bill-proof-container">
            <img width=${imgWidth} src=${billUrl} alt="Bill" />
          </div>`
        );
      $("#modaleFile").modal("show");
    } else {
      console.error("Aucune URL de fichier trouvée pour cette facture.");
    }
  };

  // Fonction pour récupérer et afficher les factures
  getBills = () => {
    if (this.store) {
      return this.store
        .bills()
        .list()
        .then((snapshot) => {
          // Log des dates avant tri pour vérifier les données brutes
          console.log(
            "Dates before sorting:",
            snapshot.map((doc) => doc.date)
          );

          // Fonction pour trier les factures du plus récent au plus ancien
          const billsInDescOrder = (a, b) => {
            const dateA = new Date(a.date); // Conversion en objet Date
            const dateB = new Date(b.date); // Conversion en objet Date
            console.log(`Comparing dates : ${dateA} vs ${dateB}`); // Log pour comparer les dates
            return dateA > dateB ? -1 : 1; // Tri des factures du plus récent au plus ancien
          };

          // Tri des factures
          const sortedBills = snapshot.sort(billsInDescOrder);

          // Log après tri pour voir si le tri est correct
          console.log(
            "Dates after sorting:",
            sortedBills.map((doc) => doc.date)
          );

          // Mapping pour formater les dates après le tri
          const bills = sortedBills.map((doc) => {
            try {
              return {
                ...doc,
                date: formatDate(doc.date), // Formate la date
                status: formatStatus(doc.status), // Formate le statut
              };
            } catch (e) {
              // En cas d'erreur, on log et on retourne la facture non formatée
              console.error(e, "for", doc);
              return {
                ...doc,
                date: doc.date, // Garde la date brute si une erreur survient
                status: formatStatus(doc.status), // Garde le statut formaté même en cas d'erreur
              };
            }
          });

          return bills; // Retourne la liste des factures formatées ou brutes
        });
    }
  };
}
