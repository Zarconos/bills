/**
 * @jest-environment jsdom
 */
import "@testing-library/jest-dom";
import { ROUTES_PATH } from "../constants/routes";
import { localStorageMock } from "../__mocks__/localStorage.js";
import mockStore from "../__mocks__/store";
import {screen, waitFor} from "@testing-library/dom"
import BillsUI from "../views/BillsUI.js"
import { bills } from "../fixtures/bills.js"
import router from "../app/Router.js";
import userEvent from "@testing-library/user-event";
import Bills from "../containers/Bills.js";


jest.mock("../app/store", () => mockStore);

const setup = () => {
  jest.spyOn(mockStore, "bills");
  Object.defineProperty(window, "localStorage", { value: localStorageMock });
  window.localStorage.setItem("user", JSON.stringify({ type: "Employee" }));
  const root = document.createElement("div");
  root.setAttribute("id", "root");
  document.body.appendChild(root);
  router();


describe("When I am on Bills page but it is loading", () => {
  test("Then, loading page should be rendered", () => {
    document.body.innerHTML = BillsUI({ loading: true });
    expect(screen.getAllByText("Loading...")).toBeTruthy();
  });
});

describe("Given I am connected as an employee", () => {
  describe("When I am on Bills Page", () => {
    test("Then bill icon in vertical layout should be highlighted", async () => {

      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee'
      }))
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.append(root)
      router()
      window.onNavigate(ROUTES_PATH.Bills)
      await waitFor(() => screen.getByTestId('icon-window'))
      const windowIcon = screen.getByTestId('icon-window')
      expect(windowIcon.classList.contains('active-icon')).toBe(true);

    })
    test("Then bills should be ordered from earliest to latest", () => {
      document.body.innerHTML = BillsUI({ data: bills })
      const dates = screen.getAllByText(/^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i).map(a => a.innerHTML)
      const antiChrono = (a, b) => ((a < b) ? 1 : -1)
      const datesSorted = [...dates].sort(antiChrono)
      expect(dates).toEqual(datesSorted)
    })
  })
})
};

test('Then bill icon for viewing the receipt must be visible and modal should display on eye click', async () => {
  Object.defineProperty(window, 'localStorage', { value: localStorageMock });
  window.localStorage.setItem('user', JSON.stringify({
    type: 'Employee'
  }));

  const root = document.createElement('div');
  root.setAttribute('id', 'root');
  document.body.append(root);
  router();
  window.onNavigate(ROUTES_PATH.Bills);

  // Wait for the icon-eye elements to be present in the DOM.
  await waitFor(() => screen.getAllByTestId('icon-eye'));

  const iconEye = screen.getAllByTestId('icon-eye')[0];

  // Verify that the icon-eye elements are visible.
  expect(iconEye).toBeTruthy();

  // Create a new instance of Bills and handle the icon-eye click event.
  const billContainer = new Bills({ document, onNavigate, store: mockStore, localStorage: localStorageMock });
  const handleClickIconEye = jest.fn(billContainer.handleClickIconEye);
  iconEye.addEventListener('click', () => handleClickIconEye(iconEye));

  // Simulate a click event on the icon-eye.
  userEvent.click(iconEye);

  // Verify that the handleClickIconEye function was called.
  expect(handleClickIconEye).toHaveBeenCalled();

  // Verify that the modal is displayed.
  expect(screen.getByTestId('modaleFileEmployee')).toBeTruthy();
});


// test d'intégration GET
describe("When I am on Bills page", () => {
  test("Then fetches bills from mock API GET", async () => {
    Object.defineProperty(window, "localStorage", { value: localStorageMock });
    window.localStorage.setItem(
      "user",
      JSON.stringify({
        type: "Employee",
        email: "employee@test.tld",
        status: "connected",
      })
    );
    const root = document.createElement("div");
    root.setAttribute("id", "root");
    document.body.appendChild(root);
    router();
    window.onNavigate(ROUTES_PATH.Bills);

    const dataMocked = jest.spyOn(mockStore.bills(), "list");
    mockStore.bills().list();

    await waitFor(() => {
      expect(dataMocked).toHaveBeenCalledTimes(1);
      expect(document.querySelectorAll("tbody tr").length).toBe(4);
      expect(screen.findByText("Mes notes de frais")).toBeTruthy();
    });
  });

  describe("When an error occurs on API", () => {
    beforeEach(() => {
      jest.spyOn(mockStore, "bills");
      Object.defineProperty(window, "localStorage", { value: localStorageMock });
      window.localStorage.setItem(
        "user",
        JSON.stringify({
          type: "Employee",
          email: "employee@test.tld",
          status: "connected",
        })
      );
      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.appendChild(root);
      router();
    });
    afterEach(() => {
      jest.clearAllMocks();
    });
        test("Then fetches bills from an API and fails with 404 message error", async () => {
           mockStore.bills.mockImplementationOnce(() => {
              return {
                 list: () => {
                    return Promise.reject(new Error("Erreur 404"));
                 },
              };
           });
           window.onNavigate(ROUTES_PATH.Bills);
           await new Promise(process.nextTick);
           const message = await screen.getByText(/Erreur 404/);
           expect(message).toBeTruthy();
        });

        test("when date is corrupted", async () => {
         mockStore.bills().list = () => {
           return Promise.resolve([
             {
               id: "47qAXb6fIm2zOKkLzMro",
               vat: "80",
               fileUrl:
                 "https://test.storage.tld/v0/b/billable-677b6.a…f-1.jpg?alt=media&token=c1640e12-a24b-4b11-ae52-529112e9602a",
               status: "pending",
               type: "ERROR",
               commentary: "séminaire billed",
               name: "encore",
               fileName: "preview-facture-free-201801-pdf-1.jpg",
               amount: 400,
               commentAdmin: "ok",
               email: "a@a",
               pct: 20,
               date: "20000004-04-04",
             },
           ]);
         };
         const root = document.createElement("div");
         root.setAttribute("id", "root");
         document.body.append(root);
         router();
         window.onNavigate(ROUTES_PATH.Bills);
         await waitFor(() => {
           expect(screen.getByText("ERROR")).toBeTruthy();
           expect(screen.getByText("20000004-04-04")).toBeTruthy();
         });
       });
     });
   });

        test("Then fetches messages from an API and fails with 500 message error", async () => {
           mockStore.bills.mockImplementationOnce(() => {
              return {
                 list: () => {
                    return Promise.reject(new Error("Erreur 500"));
                 },
              };
           });

           window.onNavigate(ROUTES_PATH.Bills);
           await new Promise(process.nextTick);
           const message = await screen.getByText(/Erreur 500/);
           expect(message).toBeTruthy();
        });


