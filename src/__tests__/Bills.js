/**
 * @jest-environment jsdom
 */

import { fireEvent, screen, waitFor } from "@testing-library/dom";
import { localStorageMock } from "../__mocks__/localStorage.js";
import router from "../app/Router.js";
import { ROUTES_PATH } from "../constants/routes.js";
import Bills from "../containers/Bills";
import { bills } from "../fixtures/bills.js";
import BillsUI from "../views/BillsUI.js";

describe("Given I am connected as an employee", () => {
  beforeEach(() => {
    Object.defineProperty(window, "localStorage", { value: localStorageMock });
    window.localStorage.setItem(
      "user",
      JSON.stringify({
        type: "Employee",
      })
    );

    const root = document.createElement("div");
    root.setAttribute("id", "root");
    document.body.append(root);
    router();
  });

  describe("When I am on Bills Page", () => {
    // Test pour vérifier que l'icône de la fenêtre est surlignée
    test("Then bill icon in vertical layout should be highlighted", async () => {
      window.onNavigate(ROUTES_PATH.Bills);
      await waitFor(() => screen.getByTestId("icon-window"));
      const windowIcon = screen.getByTestId("icon-window");
      // Vérifie que l'icône est surlignée
      expect(windowIcon.classList.contains("active-icon")).toBe(true);
    });

    // Test pour vérifier le tri des factures par date
    test("Then bills should be ordered from earliest to latest", () => {
      document.body.innerHTML = BillsUI({ data: bills });
      const dates = screen
        .getAllByText(
          /^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i
        )
        .map((a) => a.innerHTML);

      const antiChrono = (a, b) => (a < b ? 1 : -1);
      const datesSorted = [...dates].sort(antiChrono);
      expect(dates).toEqual(datesSorted);
    });

    // Test pour vérifier que le bouton New Bill fonctionne correctement
    test("Then clicking on new bill button should navigate to NewBill page", () => {
      document.body.innerHTML = BillsUI({ data: bills });

      const onNavigate = jest.fn();
      const sampleBills = new Bills({
        document,
        onNavigate,
        store: null,
        localStorage: window.localStorage,
      });

      const newBillButton = screen.getByTestId("btn-new-bill");
      const handleClickNewBill = jest.fn(sampleBills.handleClickNewBill);
      newBillButton.addEventListener("click", handleClickNewBill);

      fireEvent.click(newBillButton);
      expect(handleClickNewBill).toHaveBeenCalled();
      expect(onNavigate).toHaveBeenCalledWith(ROUTES_PATH["NewBill"]);
    });

    // Test pour vérifier que la modale s'ouvre au clic sur l'icône "œil"
    test("Then clicking on the eye icon should open the modal", async () => {
      document.body.innerHTML = BillsUI({ data: bills });

      const sampleBills = new Bills({
        document,
        onNavigate: jest.fn(),
        store: null,
        localStorage: window.localStorage,
      });

      $.fn.modal = jest.fn(); // Simule l'ouverture de la modale

      const eyeIcon = screen.getAllByTestId("icon-eye")[0];
      fireEvent.click(eyeIcon);

      expect($.fn.modal).toHaveBeenCalled();
    });
  });
});
