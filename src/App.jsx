import AppRouter from "@/router";
import ErrorBoundary from "@/shared/components/layout/ErrorBoundary";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "@/shared/styles/toast.css";
import "@/shared/services/notification";

function App() {
  return (
    <>
      <ErrorBoundary>
        <AppRouter />
      </ErrorBoundary>
      <ToastContainer
        position="top-center"
        autoClose={5000}
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
