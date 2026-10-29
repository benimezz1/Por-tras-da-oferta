import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./styles.css";
import "./simulation.css";
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { error: boolean }
> {
  state = { error: false };
  static getDerivedStateFromError() {
    return { error: true };
  }
  render() {
    return this.state.error ? (
      <main className="fatal">
        <h1>Precisamos de uma pausa.</h1>
        <p>
          O jogo encontrou um erro. Tente recarregar. Se persistir, limpe apenas
          o progresso desta demonstração.
        </p>
        <button onClick={() => location.reload()}>Recarregar</button>
        <button
          onClick={() => {
            sessionStorage.removeItem("pto.c4.session.v1");
            location.reload();
          }}
        >
          Limpar demonstração
        </button>
      </main>
    ) : (
      this.props.children
    );
  }
}
ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
);
