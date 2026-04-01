import { useEffect, useState } from "react";
import SuitableLandForm from "../form/SuitableLandForm";

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

  const IGNORE_KEYS = new Set([
    "temple",
    "parking",
    "junction",
    "hotel",
    "building",
    "n",
    "id",
    "id_2",
    "road_name",
    "priority",
    "road_id",
    "access",
    "condition",
    "upd_date",
    "upd_time",
  ]);
  const [openCoreZones, setOpenCoreZones] = useState({});


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
    <div className="w-80 h-full bg-gradient-to-b from-[#0f2a44] to-[#133b5c] p-4 border-l overflow-y-auto">
      {/* HEADER */}
      <h2 className="text-lg font-bold mb-4 text-white sticky top-0 bg-[#133b5c] py-2 z-10">
        Analysis Results
      </h2>

      {/* {selectedTypes?.includes("toilets_sanitation") && (
        <div className="flex flex-col gap-2 mb-4"> */}
      {/* Reusable Button */}
      {/* {[
            { key: "demand", label: "Demand Analysis" },
            { key: "supply", label: "Supply Gap Analysis" },
          ].map((btn) => (
            <button
              key={btn.key}
              onClick={() => {
                setAnalysisLayers((prev) => ({
                  ...prev,
                  [btn.key]: !prev[btn.key],
                }));
                setShowAnalysisOptions(true);
              }}
              className={`px-3 py-2 text-sm rounded-md border border-white transition-all duration-200
            ${
              analysisLayers[btn.key]
                ? "bg-[#0f2a44] text-white"
                : "bg-[#133b5c] text-gray-200 hover:bg-[#0f2a44]"
            }`}
            >
              {btn.label}
            </button>
          ))} */}

      {/* Site Priority */}
      {/* <button
            onClick={() => {
              setShowAnalysisOptions(true);
              setShowLandSuitableDropdown((prev) => !prev);
            }}
            className={`px-3 py-2 text-sm rounded-md border border-white transition-all duration-200
          ${
            analysisLayers.suitable_land
              ? "bg-[#0f2a44] text-white"
              : "bg-[#133b5c] text-gray-200 hover:bg-[#0f2a44]"
          }`}
          >
            Site Priority
          </button>
        </div>
      )} */}

      {selectedTypes?.includes("toilets_sanitation") && (
        <div className="flex flex-col gap-2 mb-4">
          {[
            { key: "demand", label: "Demand Analysis" },
            { key: "supply", label: "Supply Gap Analysis" },
          ].map((btn) => {
            const isDisabled = btn.key === "supply" && !analysisLayers.demand;

            return (
              <button
                key={btn.key}
                disabled={isDisabled}
                onClick={() => {
                  if (isDisabled) return;

                  if (btn.key === "demand" && analysisLayers.demand) {
                    setShowLandSuitableDropdown(false);
                  }

                  if (btn.key === "supply" && analysisLayers.supply) {
                    setShowLandSuitableDropdown(false);
                  }

                  setAnalysisLayers((prev) => {
                    if (btn.key === "demand") {
                      const nextDemand = !prev.demand;

                      return {
                        ...prev,
                        demand: nextDemand,
                        supply: nextDemand ? prev.supply : false,
                        suitable_land: nextDemand ? prev.suitable_land : false,
                        site_priority: nextDemand ? prev.site_priority : false,
                      };
                    }

                    const nextSupply = !prev.supply;

                    return {
                      ...prev,
                      supply: nextSupply,
                      suitable_land: nextSupply ? prev.suitable_land : false,
                      site_priority: nextSupply ? prev.site_priority : false,
                    };
                  });

                  setShowAnalysisOptions(true);
                }}
                className={`px-3 py-2 text-sm rounded-md border border-white transition-all duration-200
            ${
              isDisabled
                ? "bg-[#133b5c] text-gray-500 opacity-60 cursor-not-allowed"
                : analysisLayers[btn.key]
                  ? "bg-green-600 text-white"
                  : "bg-[#133b5c] text-gray-200 hover:bg-[#0f2a44]"
            }`}
              >
                {btn.label}
              </button>
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
        {selectedTypes.map((type) => {
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
                  {item.coreZones?.[item.coreZones.length - 1]?.total_feature ??
                    item.point_count}
                </span>
              </div>

              {/* <div className="mt-2 flex flex-col gap-3">
                <div className="flex items-center justify-between gap-4">
                  <p className="text-xs text-gray-600">
                    Avg Distance:{" "}
                    <b>
                     {Math.round(
  Number(
    item.coreZones?.[item.coreZones.length - 1]?.avg_distance || 0
  )
)}{" "} m
            
                    </b>
                  </p>

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
                                label: "Nearest Distance",
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
                                <span className="font-medium">{row.value}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div> */}
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

                <div className="flex justify-end">
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
                                label: "Nearest Distance",
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
                                <span className="font-medium">{row.value}</span>
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
