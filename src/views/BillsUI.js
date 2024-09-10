import Actions from "./Actions.js";
import ErrorPage from "./ErrorPage.js";
import LoadingPage from "./LoadingPage.js";
import VerticalLayout from "./VerticalLayout.js";

// Fonction pour trier les factures par date dans l'ordre croissant
// Cette fonction prend en paramètre un tableau de factures
const sortBills = (bills) => {
  return bills
    ? bills.sort((a, b) => new Date(b.date) - new Date(a.date)) // Tri décroissant par date
    : []; // Si aucun bill, on retourne un tableau vide
};

// Fonction pour créer une ligne du tableau avec les détails d'une facture
const row = (bill) => {
  return `
    <tr>
      <td>${bill.type}</td>
      <td>${bill.name}</td>
      <td>${bill.date}</td>
      <td>${bill.amount} €</td>
      <td>${bill.status}</td>
      <td>
        ${Actions(bill.fileUrl)}
      </td>
    </tr>
    `;
};

// Fonction pour générer toutes les lignes du tableau à partir des factures
// On trie les factures avant de générer les lignes
const rows = (data) => {
  const sortedBills = sortBills(data); // On trie les factures par date
  return sortedBills.map((bill) => row(bill)).join(""); // On crée une ligne pour chaque facture et on les joint pour afficher un tableau complet
};

// Fonction principale qui gère l'affichage des factures, du chargement ou des erreurs
// Cette fonction retourne l'affichage du tableau ou d'une page de chargement/erreur
export default ({ data: bills, loading, error }) => {
  // Contenu de la modale pour afficher les factures
  const modal = () => `
    <div class="modal fade" id="modaleFile" data-testid="modaleFile" tabindex="-1" role="dialog" aria-labelledby="exampleModalCenterTitle" aria-hidden="true">
      <div class="modal-dialog modal-dialog-centered modal-lg" role="document">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" id="exampleModalLongTitle">Justificatif</h5>
            <button type="button" class="close" data-dismiss="modal" aria-label="Close">
              <span aria-hidden="true">&times;</span>
            </button>
          </div>
          <div class="modal-body">
          </div>
        </div>
      </div>
    </div>
  `;

  // Si les données sont en train de charger, on retourne la page de chargement
  if (loading) {
    return LoadingPage(); // Affichage de la page de chargement
  }

  // Si une erreur est survenue, on retourne la page d'erreur avec le message d'erreur
  else if (error) {
    return ErrorPage(error); // Affichage de la page d'erreur avec le message passé en paramètre
  }

  // Si tout est ok, on affiche la page des factures
  return `
    <div class='layout'>
      ${VerticalLayout(120)}
      <div class='content'>
        <div class='content-header'>
          <div class='content-title'> Mes notes de frais </div>
          <button type="button" data-testid='btn-new-bill' class="btn btn-primary">Nouvelle note de frais</button>
        </div>
        <div id="data-table">
        <table id="example" class="table table-striped" style="width:100%">
          <thead>
              <tr>
                <th>Type</th>
                <th>Nom</th>
                <th>Date</th>
                <th>Montant</th>
                <th>Statut</th>
                <th>Actions</th>
              </tr>
          </thead>
          <tbody data-testid="tbody">
            ${rows(bills)}
          </tbody>
          </table>
        </div>
      </div>
      ${modal()}
    </div>`;
};
