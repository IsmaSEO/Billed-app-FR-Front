import { ROUTES_PATH } from "../constants/routes.js";
import Logout from "./Logout.js";

export default class NewBill {
  // Constructeur de la classe NewBill pour gérer la création d'une nouvelle note de frais
  constructor({ document, onNavigate, store, localStorage }) {
    this.document = document; // Référence au document HTML
    this.onNavigate = onNavigate; // Fonction pour naviguer entre les pages
    this.store = store; // Stockage des données via l'API

    // Récupération du formulaire et ajout d'un écouteur d'événement pour la soumission
    const formNewBill = this.document.querySelector(
      `form[data-testid="form-new-bill"]`
    );
    formNewBill.addEventListener("submit", this.handleSubmit); // L'événement submit est correctement associé

    // Récupération du champ de fichier et ajout d'un écouteur d'événement pour la gestion des fichiers
    const fileInput = this.document.querySelector(`input[data-testid="file"]`);
    fileInput.addEventListener("change", this.handleChangeFile);

    // Initialisation des variables pour le fichier soumis
    this.fileUrl = null;
    this.fileName = null;
    this.billId = null;

    // Gestion de la déconnexion
    /* istanbul ignore next */
    new Logout({ document, localStorage, onNavigate });
  }

  // Fonction pour gérer le changement de fichier et l'envoi au serveur
  handleChangeFile = (e) => {
    e.preventDefault();

    // Récupération du fichier sélectionné
    const file = this.document.querySelector(`input[data-testid="file"]`)
      .files[0];
    const filePath = e.target.value.split(/\\/g);
    const fileName = filePath[filePath.length - 1];

    // Vérification du type de fichier (seulement jpg, jpeg, png acceptés)
    const validExtensions = ["jpg", "jpeg", "png"];
    const fileExtension = fileName.split(".").pop().toLowerCase();

    if (!validExtensions.includes(fileExtension)) {
      alert("Veuillez choisir un fichier au format jpg, jpeg ou png.");
      this.document.querySelector(`input[data-testid="file"]`).value = ""; // Réinitialise le champ de fichier
      return;
    }

    // Préparation des données pour l'envoi au serveur
    /* istanbul ignore next */
    const formData = new FormData();
    const email = JSON.parse(localStorage.getItem("user")).email;
    formData.append("file", file);
    formData.append("email", email);

    // Envoi des données
    /* istanbul ignore next */
    this.store
      .bills()
      .create({
        data: formData,
        headers: {
          noContentType: true,
        },
      })
      .then(({ fileUrl, key }) => {
        this.billId = key;
        this.fileUrl = fileUrl;
        this.fileName = fileName;
      })
      .catch((error) => console.error(error));
  };

  // Fonction pour gérer la soumission du formulaire
  handleSubmit = (e) => {
    e.preventDefault();

    // Récupération des valeurs du formulaire
    const email = JSON.parse(localStorage.getItem("user")).email;
    const bill = {
      email,
      type: e.target.querySelector(`select[data-testid="expense-type"]`).value,
      name: e.target.querySelector(`input[data-testid="expense-name"]`).value,
      amount: parseInt(
        e.target.querySelector(`input[data-testid="amount"]`).value
      ),
      date: e.target.querySelector(`input[data-testid="datepicker"]`).value,
      vat: e.target.querySelector(`input[data-testid="vat"]`).value,
      pct:
        parseInt(e.target.querySelector(`input[data-testid="pct"]`).value) ||
        20,
      commentary: e.target.querySelector(`textarea[data-testid="commentary"]`)
        .value,
      fileUrl: this.fileUrl, // URL du fichier uploadé
      fileName: this.fileName, // Nom du fichier uploadé
      status: "pending", // Statut initial de la facture
    };

    // Enregistrement de la note de frais
    this.updateBill(bill);
    this.onNavigate(ROUTES_PATH["Bills"]); // Redirection vers la page des factures
  };

  // Fonction pour mettre à jour la note de frais dans la base de données
  /* istanbul ignore next */
  updateBill = (bill) => {
    if (this.store) {
      this.store
        .bills()
        .update({ data: JSON.stringify(bill), selector: this.billId })
        .then(() => {
          this.onNavigate(ROUTES_PATH["Bills"]); // Redirection après mise à jour
        })
        .catch((error) => console.error(error));
    }
  };
}
