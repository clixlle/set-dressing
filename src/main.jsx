import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error) {
    return { error };
  }
  componentDidCatch(error, info) {
    console.error("App crashed:", error, info);
  }
  render() {
    if (this.state.error) {
      return (
        <div style={{
          fontFamily: "system-ui, sans-serif", background: "#14151F", color: "#F2F2F8",
          minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24,
        }}>
          <div style={{ maxWidth: 480 }}>
            <h1 style={{ fontSize: 20, marginBottom: 10 }}>Something went wrong</h1>
            <p style={{ color: "#8C8DA6", fontSize: 14, lineHeight: 1.5 }}>
              {this.state.error?.message || String(this.state.error)}
            </p>
            <p style={{ color: "#8C8DA6", fontSize: 13, marginTop: 16 }}>
              Check that VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set correctly in your
              deployment's environment variables, then redeploy.
            </p>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
