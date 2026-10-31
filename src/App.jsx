import AppRouter from "@/router";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "@/shared/styles/toast.css";
import "@/shared/services/notification";

function App() {
  return (
    <>
      <AppRouter />
      <ToastContainer
        position="top-center"
        autoClose={false}
        hideProgressBar={true}
        closeButton={false}
        closeOnClick={false}
        pauseOnHover={false}
        pauseOnFocusLoss={false}
        icon={false}
        newestOnTop={true}
        limit={4}
        theme="light"
      />
    </>
  );
}

export default App;
