/**
 * @jest-environment jsdom
 */

import { fireEvent, screen } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";
import { localStorageMock } from "../__mocks__/localStorage.js";
import mockStore from "../__mocks__/store";
import router from "../app/Router.js";
import { ROUTES, ROUTES_PATH } from "../constants/routes.js";
import NewBill from "../containers/NewBill.js";
import BillsUI from "../views/BillsUI.js";
import NewBillUI from "../views/NewBillUI.js";

jest.mock("../app/store", () => mockStore);

// Tests page NewBill :

describe("Given I am an employee and I create a new bill", () => {
  beforeEach(() => {
    window.localStorage.clear();
    document.body.innerHTML = "";
  });

  // Test création réussie d'une note de frais avec un fichier valide
  test("Then it should create a new bill when all the required fields are filled", () => {
    Object.defineProperty(window, "localStorage", {
      value: localStorageMock,
    });
    window.localStorage.setItem(
      "user",
      JSON.stringify({
        type: "Employee",
        email: "e-mail@test.fr",
      })
    );

    document.body.innerHTML = NewBillUI();
    const mockOnNavigate = jest.fn();
    const newBill = new NewBill({
      document,
      onNavigate: mockOnNavigate,
      store: mockStore,
      localStorage: window.localStorage,
    });

    // Simulation de la saisie des champs obligatoires
    fireEvent.change(screen.getByTestId("expense-type"), {
      target: { value: "Transports" },
    });
    fireEvent.change(screen.getByTestId("expense-name"), {
      target: { value: "Test Transport" },
    });
    fireEvent.change(screen.getByTestId("datepicker"), {
      target: { value: "2023-04-11" },
    });
    fireEvent.change(screen.getByTestId("amount"), {
      target: { value: "200" },
    });
    fireEvent.change(screen.getByTestId("vat"), { target: { value: "20" } });
    fireEvent.change(screen.getByTestId("pct"), { target: { value: "20" } });
    fireEvent.change(screen.getByTestId("commentary"), {
      target: { value: "Business trip" },
    });

    // Simulation d'un fichier valide
    const file = new File(["file.jpg"], "file.jpg", { type: "image/jpeg" });
    const fileField = screen.getByTestId("file");
    userEvent.upload(fileField, file);

    const handleSubmit = jest.fn((e) => newBill.handleSubmit(e));
    const form = screen.getByTestId("form-new-bill");
    form.addEventListener("submit", handleSubmit);

    fireEvent.submit(form);

    expect(handleSubmit).toHaveBeenCalled();
    expect(mockOnNavigate).toHaveBeenCalledWith(ROUTES_PATH["Bills"]);
  });

  // Test tentative de soumission avec un fichier invalide
  test("Then it should not create a new bill when the file has an invalid extension", () => {
    Object.defineProperty(window, "localStorage", {
      value: localStorageMock,
    });
    window.localStorage.setItem(
      "user",
      JSON.stringify({
        type: "Employee",
        email: "mail@test.fr",
      })
    );

    const root = document.createElement("div");
    root.setAttribute("id", "root");
    document.body.append(root);
    router();
    window.onNavigate(ROUTES_PATH.NewBill);

    const fileWithInvalidExt = new File(["file.gif"], "file.gif", {
      type: "image/gif",
    });

    const alerting = jest.spyOn(window, "alert").mockImplementation(() => {});

    const fileField = screen.getByTestId("file");
    userEvent.upload(fileField, fileWithInvalidExt);

    expect(alerting).toHaveBeenCalledWith(
      "Veuillez choisir un fichier au format jpg, jpeg ou png."
    );

    expect(fileField.value).toBe("");
  });

  // Test soumission échouée à cause de champs manquants
  test("Then it should not submit the form and an error should be displayed when fields are missing", () => {
    Object.defineProperty(window, "localStorage", {
      value: localStorageMock,
    });
    window.localStorage.setItem(
      "user",
      JSON.stringify({
        type: "Employee",
        email: "test@test.fr",
      })
    );

    const root = document.createElement("div");
    root.setAttribute("id", "root");
    document.body.append(root);
    router();
    window.onNavigate(ROUTES_PATH.NewBill);

    // Soumission form avec des champs manquants
    fireEvent.change(screen.getByTestId("expense-type"), {
      target: { value: "" },
    });
    fireEvent.change(screen.getByTestId("expense-name"), {
      target: { value: "" },
    });
    fireEvent.change(screen.getByTestId("datepicker"), {
      target: { value: "" },
    });
    fireEvent.change(screen.getByTestId("amount"), { target: { value: "" } });

    const alerting = jest.spyOn(window, "alert").mockImplementation(() => {});

    const form = screen.getByTestId("form-new-bill");
    fireEvent.submit(form);

    expect(alerting).toHaveBeenCalled();
  });

  // Test intégration avec erreurs API
  describe("When an error occurs on API", () => {
    beforeEach(() => {
      jest.spyOn(mockStore, "bills");
      Object.defineProperty(window, "localStorage", {
        value: localStorageMock,
      });
      window.localStorage.setItem(
        "user",
        JSON.stringify({
          type: "Employee",
          email: "a@a",
        })
      );
      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.appendChild(root);
      router();
    });

    test("Then API fetch fails with 500 error", async () => {
      mockStore.bills.mockImplementationOnce(() => {
        return {
          list: () => Promise.reject(new Error("Erreur 500")),
        };
      });

      window.onNavigate(ROUTES_PATH.NewBill);
      await new Promise(process.nextTick);
      document.body.innerHTML = BillsUI({ error: "Erreur 500" });
      const message = screen.getByText(/Erreur 500/);
      expect(message).toBeTruthy();
    });

    test("Then API fetch fails with 404 error", async () => {
      mockStore.bills.mockImplementationOnce(() => {
        return {
          list: () => Promise.reject(new Error("Erreur 404")),
        };
      });

      window.onNavigate(ROUTES_PATH.NewBill);
      await new Promise(process.nextTick);
      document.body.innerHTML = BillsUI({ error: "Erreur 404" });
      const message = screen.getByText(/Erreur 404/);
      expect(message).toBeTruthy();
    });
  });

  // Test intégration de soumission réussie d'une nouvelle note de frais
  test("Then the bill is added to the list after submission", async () => {
    Object.defineProperty(window, "localStorage", {
      value: localStorageMock,
    });
    window.localStorage.setItem(
      "user",
      JSON.stringify({
        type: "Employee",
        email: "azerty@email.com",
      })
    );

    document.body.innerHTML = NewBillUI();

    const onNavigate = (pathname) => {
      document.body.innerHTML = ROUTES({ pathname });
    };

    const newBill = new NewBill({
      document,
      onNavigate,
      store: null,
      localStorage: window.localStorage,
    });

    screen.getByTestId("expense-type").value = "Transport";
    screen.getByTestId("expense-name").value = "Test Bill";
    screen.getByTestId("datepicker").value = "2023-05-01";
    screen.getByTestId("amount").value = "200";
    screen.getByTestId("vat").value = "20";
    screen.getByTestId("pct").value = "10";
    screen.getByTestId("commentary").value = "Business trip";
    newBill.fileName = "test.jpg";
    newBill.fileUrl = "/test.jpg";

    newBill.updateBill = jest.fn();
    const handleSubmit = jest.fn((e) => newBill.handleSubmit(e));

    const form = screen.getByTestId("form-new-bill");
    form.addEventListener("submit", handleSubmit);
    fireEvent.submit(form);

    expect(handleSubmit).toHaveBeenCalled();
    expect(newBill.updateBill).toHaveBeenCalled();
    expect(newBill.fileName).toBe("test.jpg");
  });
});
