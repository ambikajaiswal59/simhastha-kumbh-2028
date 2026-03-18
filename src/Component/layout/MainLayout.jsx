import Header from "./Header";
import Sidebar from "./Sidebar";
import MapView from "../map/MapView";

export default function MainLayout() {
  return (
    <div className="h-screen flex flex-col">

      <Header />

      <div className="flex flex-1">

        <Sidebar />

        <MapView />

      </div>

    </div>
  );
}