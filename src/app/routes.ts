import { createBrowserRouter } from "react-router";
import { Layout } from "./components/Layout";
import { LoginPage } from "./components/LoginPage";
import { SignupPage } from "./components/SignupPage";
import { RequireAuth, RedirectIfAuthed } from "./components/RouteGuards";
import { Dashboard } from "./components/Dashboard";
import { Browse } from "./components/Browse";
import { ItemDetail } from "./components/ItemDetail";
import { CreatePost } from "./components/CreatePost";
import { MyListings } from "./components/MyListings";
import { SavedItems } from "./components/SavedItems";
import { Messages } from "./components/Messages";
import { Profile } from "./components/Profile";
import { NotFound } from "./components/NotFound";

export const router = createBrowserRouter(
  [
    {
      path: "/",
      Component: RedirectIfAuthed,
      children: [
        { index: true, Component: LoginPage },
        { path: "signup", Component: SignupPage },
      ],
    },
    {
      Component: RequireAuth,
      children: [
        {
          path: "/",
          Component: Layout,
          children: [
            {
              path: "dashboard",
              Component: Dashboard,
            },
            {
              path: "browse",
              Component: Browse,
            },
            {
              path: "item/:id",
              Component: ItemDetail,
            },
            {
              path: "create",
              Component: CreatePost,
            },
            {
              path: "my-listings",
              Component: MyListings,
            },
            {
              path: "my-listings/:id/edit",
              Component: CreatePost,
            },
            {
              path: "saved",
              Component: SavedItems,
            },
            {
              path: "messages",
              Component: Messages,
            },
            {
              path: "profile",
              Component: Profile,
            },
            {
              path: "*",
              Component: NotFound,
            },
          ],
        },
      ],
    },
  ],
  // BASE_URL is "/" locally and "/CampusExchange/" in the GitHub Pages
  // build (see vite.config.ts) — basename keeps route matching and all
  // relative navigation consistent with the actual deployed subpath.
  { basename: import.meta.env.BASE_URL },
);
