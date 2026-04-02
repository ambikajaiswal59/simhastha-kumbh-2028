const API_URL = import.meta.env.VITE_API_URL;

export const API = {
  demand: `${API_URL}/demand_layer`,

  supply: `${API_URL}/supply_layer`,

  getLayer: `${API_URL}/get_geojson_layer`,

  analysis: `${API_URL}/get_feature_count_avg_distance`,
  layerList: `${API_URL}/get_layer_list`,
  aoi: `${API_URL}/aoi_layer`,
  suitableLand: `${API_URL}/suitable_land`,
  sanitation: `${API_URL}/santitation_scenario`,
  emptySpaces: (radius) => `${API_URL}/empty-spaces?radius=${radius}`,

  bottlenecks: (radius, zone) =>
    `${API_URL}/bottlenecks?radius=${radius}&zone=${zone}`,
};
