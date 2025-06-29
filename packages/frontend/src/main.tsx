import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Route, Routes, useParams } from "react-router-dom";
import "./index.css";
import HomePage from "./pages/HomePage/HomePage.tsx";
import AppDetailPage from "@pages/AppDetailPage/AppDetailPage.tsx";
import AppEditPage from "@pages/AppEditPage/AppEditPage.tsx";
import CreateProjectPage from "@pages/AppCreationPage/AppCreationPage.tsx";

import { SessionProvider } from "@sharedComponents/keycloakSession/SessionProvider.tsx";
import { TodoPage } from "@pages/TodoPage.tsx";
import MyProjectsPage from "@pages/MyProjectsPage/MyProjectsPage.tsx";

const AppDetailWrapper = () => {
  const { slug } = useParams<{ slug: string }>();
  if (!slug) {
    return <div>Error: App slug is required</div>;
  }
  return <AppDetailPage slug={slug} />;
};

const AppEditPageWrapper = () => {
  const { slug } = useParams<{ slug: string }>();
  if (!slug) {
    return <div>Error: App slug is required</div>;
  }
  return <AppEditPage slug={slug} />;
};

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <SessionProvider>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/page/project/:slug" element={<AppDetailWrapper />} />
          <Route
            path="/page/project/:slug/edit"
            element={<AppEditPageWrapper />}
          />
          <Route path="/page/my-projects" element={<MyProjectsPage />} />
          <Route path="/page/todo" element={<TodoPage />} />
          <Route path="/page/create-project" element={<CreateProjectPage />} />
        </Routes>
      </SessionProvider>
    </BrowserRouter>
  </StrictMode>
);

// Floating toggle button logic
function setupTodoToggleButton() {
  const btn = document.createElement("button");
  btn.className = "todo-toggle-btn";
  btn.title = "Toggle TODO overlay";
  btn.innerHTML = "🟧";
  let enabled = false;

  const rootDiv = document.getElementById("root");
  function updateRootClass() {
    if (!rootDiv) return;
    if (enabled) {
      rootDiv.classList.add("debugEnabled");
    } else {
      rootDiv.classList.remove("debugEnabled");
    }
    btn.style.opacity = enabled ? "1" : "0.6";
  }

  btn.onclick = () => {
    enabled = !enabled;
    updateRootClass();
  };

  document.body.appendChild(btn);
  updateRootClass();
}

setupTodoToggleButton();
