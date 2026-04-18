const API_URL = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");

export const API = {
  demand: `${API_URL}/demand_layer`,
  supply: `${API_URL}/supply_layer`,
  getLayer: `${API_URL}/get_geojson_layer`,
  analysis: `${API_URL}/v1/get_feature_count_avg_distance`,
  layerList: `${API_URL}/get_layer_list`,
  aoi: `${API_URL}/aoi_layer`,
  suitableLand: `${API_URL}/suitable_land`,
  sanitation: `${API_URL}/santitation_scenario`,
  openArea: `${API_URL}/open_area`,

  coreAnalysis: `${API_URL}/v1/get_feature_count_avg_distance`,

  emptySpaces: (radius) => `${API_URL}/empty-spaces?radius=${radius}`,

  bottlenecks: (radius, zone) =>
    `${API_URL}/bottlenecks?radius=${radius}&zone=${encodeURIComponent(zone)}`,
  routingAOI: `${API_URL}/aoi`,
  roads: `${API_URL}/roads`,
  ghats: `${API_URL}/ghats`,
  river: `${API_URL}/river`,
  shortestPath: `${API_URL}/shortest-path`,
  intersections: `${API_URL}/intersections`
};

