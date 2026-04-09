import { useEffect, useState } from "react";
import SuitableLandForm from "../form/SuitableLandForm";
import Tooltip from "@mui/material/Tooltip";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";

export default function AnalysisPanel({
  buffer,
  selectedTypes = [],
  analysisData = {},
  selectedFeature,
  setAnalysisLayers,
  analysisLayers,
  setShowAnalysisOptions,
  showLandSuitableDropdown,
  setShowLandSuitableDropdown,
  proximity,
  setProximity,
  toiletSheet,
  setToiletSheet,
  handleToiletAnalysis,
}) {
  const TYPE_LABELS = {
    toilets_sanitation: "Toilet",
    road_network3: "Road",
    police_station: "Police Station",
    parking_loc: "Parking",
    temple_ujjain: "Temple",
  };
  const [openCoreZones, setOpenCoreZones] = useState({});
  const [loadingCoreZones, setLoadingCoreZones] = useState({});

  // const IGNORE_KEYS = new Set([
  //   "temple",
  //   "parking",
  //   "junction",
  //   "hotel",
  //   "building",
  //   "n",
  //   "id",
  //   "id_2",
  //   "road_name",
  //   "priority",
  //   "road_id",
  //   "access",
  //   "condition",
  //   "upd_date",
  //   "upd_time",
  // ]);

  useEffect(() => {
    if (analysisLayers.suitable_land) {
      setShowLandSuitableDropdown(true);
    } else {
      setShowLandSuitableDropdown(false);
    }
  }, [analysisLayers]);

  const getZoneHeading = (zone) => {
    const totalMeters = Math.round(buffer * 1000);
    const zoneMeters = Math.round((totalMeters / 4) * zone);
    return `Zone ${zone} (0-${zoneMeters} m)`;
  };

  return (
    <div className="w-70 h-full bg-gradient-to-b from-[#0f2a44] to-[#133b5c] p-4 border-l overflow-y-auto">
      {/* HEADER */}
      <h2 className="text-xl font-bold mb-4 text-yellow-400 sticky top-0  py-2 z-10">
        Analysis Results
      </h2>

      {selectedTypes?.includes("toilets_sanitation") && (
        <div className="flex flex-col gap-2 mb-4 ">
          {[
            {
              key: "demand",
              label: "Demand Analysis",
              info: (
                <div className="text-[11px] text-gray-700 leading-5  ">
                  <div className="font-semibold mb-1">Toilet Demand</div>

                  <div className="mb-2">
                    Toilet demand is a score calculated based on the weighted
                    importance of temples, parking areas, road crossings,
                    hotels, ghats, and buildings within a defined 50×50 meter
                    grid.
                  </div>

                  <div className="mb-2">
                    It represents the requirement for toilet facilities within
                    an area, based on the presence and intensity of
                    activity-generating factors such as temples, parking areas,
                    road crossings, hotels, ghats, and buildings.
                  </div>

                  <div className="font-semibold mb-1">
                    Demand Score = 5T + 3P + 2J + 2H + 1B + 2G
                  </div>

                  <div>T = Number of temples</div>
                  <div>P = Number of parking areas</div>
                  <div>J = Number of road crossings (junctions)</div>
                  <div>H = Number of hotels</div>
                  <div>B = Number of buildings</div>
                  <div>G = Number of ghats</div>
                </div>
              ),
            },
            {
              key: "supply",
              label: "Supply Gap Analysis",
              info: (
                <div className="text-[11px] text-gray-700 leading-5 ">
                  <div className="font-semibold mb-1">Supply</div>

                  <div className="mb-2">
                    Toilet supply is a score calculated based on the
                    availability, capacity, and condition of existing toilet
                    facilities within a defined 50×50 meter grid.
                  </div>

                  <div className="font-semibold mb-1">
                    Supply Score = CS * FD * 101
                  </div>

                  <div className="mb-2">
                    <div>CS = Capacity Score</div>
                    <div className="ml-0">
                      Calculated using Effective Capacity and Seat Hourly
                      Capacity
                    </div>
                    <div>FD = Distance Decay</div>
                    <div className="ml-0">
                      FD = e^(-d/1200), where d = distance to nearest toilet
                    </div>
                    <div>
                      101 = Used to bring supply value to a comparable range
                      with demand
                    </div>
                  </div>

                  <div className="font-semibold mb-1">
                    Service Gap Score (Demand vs Supply Analysis)
                  </div>

                  <div className="mb-1">
                    Service Gap Score (G) = Peak Demand - Effective Supply
                  </div>

                  <div>
                    Peak Demand: Calculated based on area-specific activity
                    weights
                  </div>
                  <div>
                    Effective Supply: Derived from facility capacity adjusted by
                    its distance from user
                  </div>
                </div>
              ),
            },
            {
              key: "open_area",
              label: "Open Area",
             
            },
          ].map((btn) => {
            // const isDisabled = btn.key === "supply" && !analysisLayers.demand;
            const isDisabled =
              (btn.key === "supply" && !analysisLayers.demand) ||
              (btn.key === "open_area" && !analysisLayers.supply);


            return (
              <span key={btn.key} className="w-full">
                <button
                  disabled={isDisabled}
                  style={isDisabled ? { pointerEvents: "none" } : undefined}
                  onClick={() => {
                    if (isDisabled) return;

                    if (btn.key === "demand" && analysisLayers.demand) {
                      setShowLandSuitableDropdown(false);
                    }

                    if (btn.key === "supply" && analysisLayers.supply) {
                      setShowLandSuitableDropdown(false);
                    }

                    if (btn.key === "open_area" && analysisLayers.open_area) {
                      setShowLandSuitableDropdown(false);
                    }

                    setAnalysisLayers((prev) => {
                      if (btn.key === "demand") {
                        const nextDemand = !prev.demand;

                        return {
                          ...prev,
                          demand: nextDemand,
                          supply: nextDemand ? prev.supply : false,
                          suitable_land: nextDemand
                            ? prev.suitable_land
                            : false,
                          site_priority: nextDemand
                            ? prev.site_priority
                            : false,
                          open_area: nextDemand ? prev.open_area : false,
                        };
                      }

                      if (btn.key === "supply") {
                        const nextSupply = !prev.supply;

                        return {
                          ...prev,
                          supply: nextSupply,
                          suitable_land: nextSupply
                            ? prev.suitable_land
                            : false,
                          site_priority: nextSupply
                            ? prev.site_priority
                            : false,
                          open_area: nextSupply ? prev.open_area : false,
                        };
                      }

                      if (btn.key === "open_area") {
                        return {
                          ...prev,
                          open_area: !prev.open_area,
                        };
                      }

                      return prev;
                    });

                    setShowAnalysisOptions(true);
                  }}
                  // onClick={() => {
                  //   if (isDisabled) return;

                  //   if (btn.key === "demand" && analysisLayers.demand) {
                  //     setShowLandSuitableDropdown(false);
                  //   }

                  //   if (btn.key === "supply" && analysisLayers.supply) {
                  //     setShowLandSuitableDropdown(false);
                  //   }

                  //   if (btn.key === "open_area" && analysisLayers.open_area) {
                  //     setShowLandSuitableDropdown(false);
                  //   }

                  //   setAnalysisLayers((prev) => {
                  //     if (btn.key === "demand") {
                  //       const nextDemand = !prev.demand;

                  //       return {
                  //         ...prev,
                  //         demand: nextDemand,
                  //         supply: nextDemand ? prev.supply : false,
                  //         suitable_land: nextDemand
                  //           ? prev.suitable_land
                  //           : false,
                  //         site_priority: nextDemand
                  //           ? prev.site_priority
                  //           : false,
                  //         open_area: nextDemand ? prev.open_area : false,
                  //       };
                  //     }

                  //     if (btn.key === "supply") {
                  //       const nextSupply = !prev.supply;

                  //       return {
                  //         ...prev,
                  //         supply: nextSupply,
                  //         suitable_land: nextSupply
                  //           ? prev.suitable_land
                  //           : false,
                  //         site_priority: nextSupply
                  //           ? prev.site_priority
                  //           : false,
                  //       };
                  //     }

                  //     if (btn.key === "open_area") {
                  //       return {
                  //         ...prev,
                  //         open_area: !prev.open_area,
                  //       };
                  //     }

                  //     return prev;
                  //   });

                  //   setShowAnalysisOptions(true);
                  // }}
                  // onClick={() => {
                  //   if (isDisabled) return;

                  //   if (btn.key === "demand" && analysisLayers.demand) {
                  //     setShowLandSuitableDropdown(false);
                  //   }

                  //   if (btn.key === "supply" && analysisLayers.supply) {
                  //     setShowLandSuitableDropdown(false);
                  //   }
                  //   if (btn.key === "open_area" && analysisLayers.open_area) {
                  //     setShowLandSuitableDropdown(fa)
                  //   }
                  //     setAnalysisLayers((prev) => {
                  //       if (btn.key === "demand") {
                  //         const nextDemand = !prev.demand;

                  //         return {
                  //           ...prev,
                  //           demand: nextDemand,
                  //           supply: nextDemand ? prev.supply : false,
                  //           suitable_land: nextDemand
                  //             ? prev.suitable_land
                  //             : false,
                  //           site_priority: nextDemand
                  //             ? prev.site_priority
                  //             : false,
                  //         };
                  //       }

                  //       const nextSupply = !prev.supply;

                  //       return {
                  //         ...prev,
                  //         supply: nextSupply,
                  //         suitable_land: nextSupply
                  //           ? prev.suitable_land
                  //           : false,
                  //         site_priority: nextSupply
                  //           ? prev.site_priority
                  //           : false,
                  //       };
                  //     });

                  //   setShowAnalysisOptions(true);
                  // }}
                  // onClick={() => {
                  //   if (isDisabled) return;

                  //   if (btn.key === "demand" && analysisLayers.demand) {
                  //     setShowLandSuitableDropdown(false);
                  //   }

                  //   if (btn.key === "supply" && analysisLayers.supply) {
                  //     setShowLandSuitableDropdown(false);
                  //   }

                  //   setAnalysisLayers((prev) => {
                  //     if (btn.key === "demand") {
                  //       const nextDemand = !prev.demand;

                  //       return {
                  //         ...prev,
                  //         demand: nextDemand,
                  //         supply: nextDemand ? prev.supply : false,
                  //         suitable_land: nextDemand
                  //           ? prev.suitable_land
                  //           : false,
                  //         site_priority: nextDemand
                  //           ? prev.site_priority
                  //           : false,
                  //       };
                  //     }

                  //     if (btn.key === "supply") {
                  //       const nextSupply = !prev.supply;

                  //       return {
                  //         ...prev,
                  //         supply: nextSupply,
                  //         suitable_land: nextSupply
                  //           ? prev.suitable_land
                  //           : false,
                  //         site_priority: nextSupply
                  //           ? prev.site_priority
                  //           : false,
                  //       };
                  //     }

                  //     if (btn.key === "open_area") {
                  //       return {
                  //         ...prev,
                  //         open_area: !prev.open_area,
                  //       };
                  //     }

                  //     return prev;
                  //   });

                  //   setShowAnalysisOptions(true);
                  // }}
                  className={`w-full px-3 py-2 text-sm rounded-md border border-white transition-all duration-200 flex items-center justify-between ${
                    isDisabled
                      ? "bg-[#133b5c] text-gray-500 opacity-60 cursor-not-allowed"
                      : analysisLayers[btn.key]
                        ? "bg-green-600 text-white"
                        : "bg-[#133b5c] text-gray-200 hover:bg-[#0f2a44]"
                  }`}
                >
                  <span>{btn.label}</span>
                  <Tooltip
                    title={btn.info}
                    arrow
                    placement="top"
                    slotProps={{
                      tooltip: {
                        sx: {
                          maxWidth: 360,
                          whiteSpace: "normal",
                          fontSize: "0.85rem",
                          lineHeight: 1.5,
                          backgroundColor: "#dbeafe",
                        },
                      },
                    }}
                  >
                    <span className="inline-flex items-center">
                      <InfoOutlinedIcon
                        sx={{ fontSize: 16, cursor: "pointer" }}
                      />
                    </span>
                  </Tooltip>
                </button>
              </span>
            );
          })}

          <button
            disabled={!analysisLayers.supply}
            onClick={() => {
              if (!analysisLayers.supply) return;

              setShowAnalysisOptions(true);
              setShowLandSuitableDropdown((prev) => !prev);
            }}
            className={`px-3 py-2 text-sm rounded-md border border-white transition-all duration-200
    ${
      !analysisLayers.supply
        ? "bg-[#133b5c] text-gray-500 opacity-60 cursor-not-allowed"
        : showLandSuitableDropdown
          ? "bg-green-600 text-white"
          : "bg-[#133b5c] text-gray-200 hover:bg-[#0f2a44]"
    }`}
          >
            Site Priority
          </button>
        </div>
      )}
      {selectedFeature &&
        (() => {
          const layer = selectedFeature?.layer?.toLowerCase() || "";

          // Only render details card for ML / Bottleneck layers.
          if (!layer.includes("bottleneck") && !layer.includes("ml")) {
            return null;
          }

          return (
            <div className="mb-4 p-4 rounded-xl bg-white/10 border border-white/20">
              {/* TITLE */}
              <h3 className="text-sm font-bold text-yellow-300 mb-3">
                {layer.includes("bottleneck")
                  ? "Bottleneck Details"
                  : "Empty Space"}
              </h3>

              {/* ================= BOTTLENECK ================= */}
              {layer.includes("bottleneck") &&
                (() => {
                  const risk = selectedFeature?.risk_class || "LOW";

                  return (
                    <div className="space-y-2 text-xs text-white">
                      <div className="flex justify-between items-center">
                        <span>Risk Level</span>
                        <span
                          className={`px-2 py-1 rounded text-xs font-semibold
                  ${
                    risk === "CRITICAL"
                      ? "bg-red-500"
                      : risk === "HIGH"
                        ? "bg-orange-400"
                        : "bg-yellow-400"
                  }`}
                        >
                          {risk}
                        </span>
                      </div>

                      <div className="flex justify-between">
                        <span>Risk Score</span>
                        <span>{selectedFeature?.risk_score || "N/A"}</span>
                      </div>

                      <div className="flex justify-between">
                        <span>Crowd Level</span>
                        <span>{selectedFeature?.crowd_lvl || "N/A"}</span>
                      </div>

                      <div className="flex justify-between">
                        <span>Junction Type</span>
                        <span>{selectedFeature?.junc_type || "N/A"}</span>
                      </div>

                      <div className="flex justify-between">
                        <span>Road Connections</span>
                        <span>{selectedFeature?.roads_conn ?? "N/A"}</span>
                      </div>

                      <div className="flex justify-between">
                        <span>Zone</span>
                        <span>{selectedFeature?.zone || "N/A"}</span>
                      </div>

                      <div className="flex justify-between">
                        <span>Distance</span>
                        <span>
                          {selectedFeature?.distance_from_temple || "0"} m
                        </span>
                      </div>

                      <div className="flex justify-between">
                        <span>Signal</span>
                        <span>{selectedFeature?.signal ? "Yes" : "No"}</span>
                      </div>

                      <div className="flex justify-between">
                        <span>Barricade</span>
                        <span>{selectedFeature?.barricade ? "Yes" : "No"}</span>
                      </div>

                      <div className="flex justify-between">
                        <span>Control</span>
                        <span>{selectedFeature?.control || "NA"}</span>
                      </div>
                    </div>
                  );
                })()}

              {/* ================= EMPTY SPACE ================= */}
              {layer.includes("ml") &&
                (() => {
                  const area = Number(selectedFeature?.area_sqm || 0);
                  const occupancy = Number(selectedFeature?.occupied_pct || 0);
                  const distance = Number(
                    selectedFeature?.distance_from_temple || 0,
                  );

                  return (
                    <div className="space-y-3 text-xs text-white">
                      <div className="flex justify-between">
                        <span>Area</span>
                        <span>{area.toFixed(0)} sqm</span>
                      </div>

                      <div className="flex justify-between items-center">
                        <span>Occupancy</span>
                        <span
                          className={`px-2 py-1 rounded text-xs font-semibold
                              ${
                                occupancy < 20
                                  ? "bg-green-500"
                                  : occupancy < 50
                                    ? "bg-yellow-400"
                                    : "bg-red-500"
                              }`}
                        >
                          {occupancy.toFixed(1)} %
                        </span>
                      </div>

                      <div className="flex justify-between">
                        <span>Distance</span>
                        <span>{distance} m</span>
                      </div>
                    </div>
                  );
                })()}
            </div>
          );
        })()}
      {/* FORM */}
      <div className="space-y-4">
        {showLandSuitableDropdown && (
          <SuitableLandForm
            proximity={proximity}
            setProximity={setProximity}
            toiletSheet={toiletSheet}
            setToiletSheet={setToiletSheet}
            handleToiletAnalysis={handleToiletAnalysis}
          />
        )}

        {/* ANALYSIS CARDS */}
        {selectedTypes
          .filter((type) => type !== "road_network3")
          .map((type) => {
            const item = analysisData[type];
            if (!item) return null;
            const lastZone = item.coreZones?.[item.coreZones.length - 1];

            return (
              <div key={type} className="bg-white p-3 rounded shadow-sm">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-sm">
                    {TYPE_LABELS[type] || type}
                  </span>

                  <span className="font-bold text-blue-600 text-sm">
                    {item.coreZones?.[item.coreZones.length - 1]
                      ?.total_feature ?? item.point_count}
                  </span>
                </div>

                <div className="mt-2 flex flex-col gap-3">
                  {!openCoreZones[type] && item.coreZones?.length > 0 && (
                    <div className="rounded-md border border-red-700 bg-red-100 p-2">
                      <div className="space-y-1">
                        {[
                          {
                            label: "Total Feature",
                            value:
                              item.coreZones[item.coreZones.length - 1]
                                .total_feature,
                          },
                          {
                            label: "Nearest Distance",
                            value: `${Math.round(
                              Number(
                                item.coreZones[item.coreZones.length - 1]
                                  .nearest_distance,
                              ),
                            )} m`,
                          },
                          {
                            label: "Avg Distance",
                            value: `${Math.round(
                              Number(
                                item.coreZones[item.coreZones.length - 1]
                                  .avg_distance,
                              ),
                            )} m`,
                          },
                          {
                            label: "Density",
                            value: Number(
                              item.coreZones[item.coreZones.length - 1].density,
                            ).toFixed(2),
                          },
                        ].map((row) => (
                          <div
                            key={row.label}
                            className="grid grid-cols-[1fr_auto] gap-2 text-xs text-gray-700"
                          >
                            <span>{row.label}</span>
                            <span className="font-medium">{row.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* <div className="flex justify-end">
                  <button
                  
                    onClick={() => {
                      const isOpening = !openCoreZones[type];

                      setOpenCoreZones((prev) => ({
                        ...prev,
                        [type]: !prev[type],
                      }));

                      if (isOpening) {
                        window.dispatchEvent(
                          new CustomEvent("run-core-analysis"),
                        );
                      }
                    }}
                    className={`text-white text-xs transition px-3 py-1.5 rounded-full ${
                      openCoreZones[type]
                        ? "bg-orange-500 hover:bg-orange-600"
                        : "bg-orange-400 hover:bg-orange-500"
                    }`}
                  >
                    Core Analysis
                  </button>
                </div> */}

                  <div className="flex justify-end">
                    <button
                      disabled={loadingCoreZones[type]}
                      onClick={() => {
                        window.dispatchEvent(
                          new CustomEvent("close-core-analysis"),
                        );
                        const isOpening = !openCoreZones[type];

                        if (!isOpening) {
                          setOpenCoreZones((prev) => ({
                            ...prev,
                            [type]: false,
                          }));

                          setLoadingCoreZones((prev) => ({
                            ...prev,
                            [type]: false,
                          }));

                          return;
                        }

                        setLoadingCoreZones((prev) => ({
                          ...prev,
                          [type]: true,
                        }));

                        window.dispatchEvent(
                          new CustomEvent("run-core-analysis"),
                        );

                        setTimeout(() => {
                          setOpenCoreZones((prev) => ({
                            ...prev,
                            [type]: true,
                          }));

                          setLoadingCoreZones((prev) => ({
                            ...prev,
                            [type]: false,
                          }));
                        }, 1000);
                      }}
                      className={`text-white text-xs transition px-3 py-1.5 rounded-full ${
                        loadingCoreZones[type]
                          ? "bg-gray-400 cursor-not-allowed"
                          : openCoreZones[type]
                            ? "bg-orange-500 hover:bg-orange-600"
                            : "bg-orange-400 hover:bg-orange-500"
                      }`}
                    >
                      {loadingCoreZones[type]
                        ? "Loading..."
                        : "Concentric buffer analysis"}
                    </button>
                  </div>

                  {openCoreZones[type] && item.coreZones?.length > 0 && (
                    <div className="space-y-2 border-t pt-3">
                      {item.coreZones.map((zoneItem) => {
                        const zoneStyles = {
                          1: {
                            card: "border-green-700 bg-green-100",
                            title: "text-green-700",
                          },
                          2: {
                            card: "border-yellow-700 bg-yellow-100",
                            title: "text-yellow-800",
                          },
                          3: {
                            card: "border-blue-700 bg-blue-100",
                            title: "text-blue-700",
                          },
                          4: {
                            card: "border-red-700 bg-red-100",
                            title: "text-red-700",
                          },
                        };

                        const currentZoneStyle = zoneStyles[zoneItem.zone] || {
                          card: "border-orange-900 bg-orange-50",
                          title: "text-orange-700",
                        };

                        return (
                          <div
                            key={zoneItem.zone}
                            className={`rounded-md border p-2 ${currentZoneStyle.card}`}
                          >
                            <div
                              className={`mb-2 text-xs font-semibold ${currentZoneStyle.title}`}
                            >
                              {getZoneHeading(zoneItem.zone)}
                            </div>

                            <div className="space-y-1">
                              {[
                                {
                                  label: "Total Feature",
                                  value: zoneItem.total_feature,
                                },
                                {
                                  label: "Nearest facility",
                                  value: `${Math.round(Number(zoneItem.nearest_distance))} m`,
                                },
                                {
                                  label: "Avg Distance",
                                  value: `${Math.round(Number(zoneItem.avg_distance))} m`,
                                },
                                {
                                  label: "Density",
                                  value: Number(zoneItem.density).toFixed(2),
                                },
                              ].map((row) => (
                                <div
                                  key={row.label}
                                  className="grid grid-cols-[1fr_auto] gap-2 text-xs text-gray-700"
                                >
                                  <span>{row.label}</span>
                                  <span className="font-medium">
                                    {row.value}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
}
