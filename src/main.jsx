import React from "react";
import { createRoot } from "react-dom/client";
import RwaReturnSimulator from "./App.jsx";
import "./styles.css";

class PreviewErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    console.error("RWA Simulator render failed", error, errorInfo);
  }

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <div dir="rtl" className="min-h-screen bg-slate-50 p-6 text-slate-900">
        <div className="mx-auto max-w-3xl rounded-3xl border border-red-200 bg-white p-6 shadow-sm">
          <div className="mb-3 text-sm font-semibold text-red-600">שגיאה בטעינת הסימולטור</div>
          <h1 className="text-2xl font-bold">האפליקציה נתקלה בשגיאה בזמן ההפעלה</h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            במקום מסך לבן מוצגת כאן השגיאה כדי שיהיה אפשר לזהות קונפליקט Merge או רכיב שנשבר. אפשר לשלוח את הטקסט למטה יחד עם הקונפליקטים.
          </p>
          <pre className="mt-4 max-h-72 overflow-auto rounded-2xl bg-slate-950 p-4 text-left text-xs text-red-100" dir="ltr">
            {String(this.state.error?.stack || this.state.error || "Unknown error")}
            {this.state.errorInfo?.componentStack || ""}
          </pre>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-4 rounded-2xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
          >
            טעינה מחדש
          </button>
        </div>
      </div>
    );
  }
}

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Root element #root was not found. Check index.html after merge conflict resolution.");
}

createRoot(rootElement).render(
  <React.StrictMode>
    <PreviewErrorBoundary>
      <RwaReturnSimulator />
    </PreviewErrorBoundary>
  </React.StrictMode>,
);
