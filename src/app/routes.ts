import { createBrowserRouter } from "react-router";
import { Layout } from "./components/Layout";
import { LoginPage } from "./components/LoginPage";
import { Dashboard } from "./components/Dashboard";
import { Browse } from "./components/Browse";
import { ItemDetail } from "./components/ItemDetail";
import { CreatePost } from "./components/CreatePost";
import { MyListings } from "./components/MyListings";
import { SavedItems } from "./components/SavedItems";
import { Messages } from "./components/Messages";
import { Profile } from "./components/Profile";
import { NotFound } from "./components/NotFound";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: LoginPage,
  },
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
]);